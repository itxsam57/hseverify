"use client";

import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";

const DIRECT_IDENTIFIER_PATTERN = /^(?:worker_id|credential_id)_[A-Za-z0-9_-]{24}$/;
const PUBLIC_ROUTE_PATTERN = /^\/verify\/(?:result|qr)\/([A-Za-z0-9_-]{80,1200})$/;
const MAX_SCANNED_VALUE_LENGTH = 1600;
const SCAN_TIMEOUT_MS = 15_000;

interface DetectedBarcode {
  rawValue?: string;
}

interface NativeBarcodeDetector {
  detect(source: HTMLVideoElement): Promise<readonly DetectedBarcode[]>;
}

type NativeBarcodeDetectorConstructor = new (input: {
  formats: readonly string[];
}) => NativeBarcodeDetector;

function barcodeDetectorConstructor(): NativeBarcodeDetectorConstructor | null {
  return (
    window as unknown as {
      BarcodeDetector?: NativeBarcodeDetectorConstructor;
    }
  ).BarcodeDetector ?? null;
}

function stopStream(stream: MediaStream | null): void {
  for (const track of stream?.getTracks() ?? []) track.stop();
}

interface ScanSession {
  stream: MediaStream | null;
  video: HTMLVideoElement | null;
  timeout: number | null;
}

function releaseSession(session: ScanSession | null): void {
  if (!session) return;
  if (session.timeout !== null) window.clearTimeout(session.timeout);
  stopStream(session.stream);
  if (session.video) {
    session.video.pause();
    session.video.srcObject = null;
  }
}

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
}

export function PublicQrScanner({
  onIdentifier
}: {
  onIdentifier: (identifier: string) => void;
}): React.JSX.Element {
  const [scanning, setScanning] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const activeSession = useRef<ScanSession | null>(null);

  // Cleanup only: camera acquisition remains exclusively in startScanner.
  useEffect(() => () => {
    releaseSession(activeSession.current);
    activeSession.current = null;
  }, []);

  function finishSession(session: ScanSession, nextMessage?: string): void {
    if (activeSession.current !== session) return;
    activeSession.current = null;
    releaseSession(session);
    setScanning(false);
    if (nextMessage !== undefined) setMessage(nextMessage);
  }

  function acceptScannedValue(rawValue: string): boolean {
    const value = rawValue.trim();
    if (value.length < 1 || value.length > MAX_SCANNED_VALUE_LENGTH) {
      return false;
    }
    if (DIRECT_IDENTIFIER_PATTERN.test(value)) {
      onIdentifier(value);
      setMessage("QR code read. Review the ID, then choose Verify.");
      return true;
    }

    try {
      const url = new URL(value, window.location.origin);
      if (url.origin !== window.location.origin) return false;
      if (!PUBLIC_ROUTE_PATTERN.test(url.pathname)) return false;
      window.location.assign(url.pathname);
      return true;
    } catch {
      return false;
    }
  }

  async function startScanner(): Promise<void> {
    if (activeSession.current) return;
    setMessage(null);
    const Detector = barcodeDetectorConstructor();
    if (!Detector || !navigator.mediaDevices?.getUserMedia) {
      setMessage(
        "QR scanning is unavailable in this browser. Enter the Worker ID or Credential ID manually."
      );
      return;
    }

    setScanning(true);
    const session: ScanSession = { stream: null, video: null, timeout: null };
    activeSession.current = session;
    // Bound permission, playback and detector waits too, not only loop iterations.
    session.timeout = window.setTimeout(() => finishSession(
      session,
      "No supported HSE Verify QR code was detected. You can enter the ID manually."
    ), SCAN_TIMEOUT_MS);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: { ideal: "environment" } }
      });
      if (activeSession.current !== session) {
        stopStream(stream);
        return;
      }
      session.stream = stream;
      const video = document.createElement("video");
      session.video = video;
      video.muted = true;
      video.playsInline = true;
      video.srcObject = stream;
      await video.play();
      if (activeSession.current !== session) return;

      const detector = new Detector({ formats: ["qr_code"] });
      while (activeSession.current === session) {
        const detections = await detector.detect(video);
        if (activeSession.current !== session) return;
        const rawValue = detections.find(
          (item) => typeof item.rawValue === "string" && item.rawValue.length > 0
        )?.rawValue;
        if (rawValue && acceptScannedValue(rawValue)) return;
        await wait(150);
      }
    } catch (error) {
      if (activeSession.current !== session) return;
      const denied =
        error instanceof DOMException &&
        (error.name === "NotAllowedError" || error.name === "SecurityError");
      setMessage(
        denied
          ? "Camera permission was denied. Manual verification is still available."
          : "QR scanning could not start. Manual verification is still available."
      );
    } finally {
      finishSession(session);
    }
  }

  return (
    <div className="public-qr-control">
      <Button disabled={scanning} onClick={startScanner} type="button" variant="secondary">
        {scanning ? "Scanning…" : "Scan QR"}
      </Button>
      {scanning ? (
        <Button onClick={() => {
          const session = activeSession.current;
          if (session) finishSession(session, "Scanning stopped. Manual verification is still available.");
        }} type="button" variant="secondary">
          Stop scanning
        </Button>
      ) : null}
      {message ? <p aria-live="polite" className="muted-copy">{message}</p> : null}
    </div>
  );
}
