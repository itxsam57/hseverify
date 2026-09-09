import "server-only";

import { headers } from "next/headers";

import { getServerEnvironment } from "@/lib/config/server-environment";
import { getDatabaseClient } from "@/lib/database/database";
import { PublicVerificationRepository } from "@/lib/public-verification/public-verification-repository";
import { publicVerificationMetadataFromHeaders, publicVerificationRequestFingerprint } from "@/lib/public-verification/public-verification-request";
import { PublicVerificationService } from "@/lib/public-verification/public-verification-service";

export function getPublicVerificationSecret(): string {
  return getServerEnvironment().sessionSecret;
}

export async function getPublicVerificationRequestRuntime(): Promise<{
  service: PublicVerificationService;
  requestFingerprint: string;
}> {
  const environment = getServerEnvironment();
  const requestHeaders = await headers();
  const requestFingerprint = publicVerificationRequestFingerprint(
    publicVerificationMetadataFromHeaders(requestHeaders, environment.publicVerificationTrustedIpHeader),
    environment.sessionSecret
  );
  const database = await getDatabaseClient();
  return {
    service: new PublicVerificationService(
      new PublicVerificationRepository(database),
      environment.sessionSecret
    ),
    requestFingerprint
  };
}
