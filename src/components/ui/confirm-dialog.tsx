"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal, useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";

type FormAction = NonNullable<React.ComponentProps<"form">["action"]>;

function ConfirmActionButton({
  label,
  pendingLabel,
  danger
}: {
  label: string;
  pendingLabel: string;
  danger: boolean;
}): React.JSX.Element {
  const { pending } = useFormStatus();

  return (
    <Button
      aria-disabled={pending}
      disabled={pending}
      variant={danger ? "danger" : "primary"}
      type="submit"
    >
      {pending ? pendingLabel : label}
    </Button>
  );
}

export function ConfirmDialog({
  triggerLabel,
  title,
  description,
  confirmLabel,
  pendingLabel = "Confirming…",
  action,
  danger = false
}: {
  triggerLabel: string;
  title: string;
  description: string;
  confirmLabel: string;
  pendingLabel?: string;
  action: FormAction;
  danger?: boolean;
}): React.JSX.Element {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    setPortalRoot(document.body);
    return () => dialogRef.current?.close();
  }, []);

  const dialog = portalRoot
    ? createPortal(
        <dialog
          aria-describedby={descriptionId}
          aria-labelledby={titleId}
          className="ds-dialog"
          ref={dialogRef}
        >
          <div className="ds-dialog-body">
            <div>
              <p className="section-kicker">Confirmation required</p>
              <h2 id={titleId}>{title}</h2>
            </div>
            <p id={descriptionId}>{description}</p>
            <div className="ds-dialog-actions">
              <Button
                variant="secondary"
                onClick={() => dialogRef.current?.close()}
                type="button"
              >
                Cancel
              </Button>
              <form action={action}>
                <ConfirmActionButton
                  danger={danger}
                  label={confirmLabel}
                  pendingLabel={pendingLabel}
                />
              </form>
            </div>
          </div>
        </dialog>,
        portalRoot
      )
    : null;

  return (
    <>
      <Button
        aria-haspopup="dialog"
        disabled={!portalRoot}
        variant="ghost"
        onClick={() => dialogRef.current?.showModal()}
        type="button"
      >
        {triggerLabel}
      </Button>
      {dialog}
    </>
  );
}
