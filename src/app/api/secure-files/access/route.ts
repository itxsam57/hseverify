import {
  SecureFileAccessContractError,
  SecureFileAccessDeniedError
} from "@/lib/secure-files/secure-file-access-domain";
import {
  buildSignedSecureFileAccessUrl,
  readCurrentSecureFilePrincipal,
  secureFileAccessBadRequestResponse,
  secureFileAccessDeniedResponse,
  secureFileAccessErrorResponse,
  secureFileAuthorizationResponse
} from "@/lib/secure-files/secure-file-access-http";
import { authorizeSecureFileAccess } from "@/lib/secure-files/secure-file-access-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_REQUEST_BYTES = 4_096;

export async function POST(request: Request): Promise<Response> {
  try {
    const principal = await readCurrentSecureFilePrincipal();
    const text = await request.text();
    if (Buffer.byteLength(text, "utf8") > MAX_REQUEST_BYTES) {
      return secureFileAccessBadRequestResponse();
    }

    let body: unknown;
    try {
      body = JSON.parse(text) as unknown;
    } catch {
      return secureFileAccessBadRequestResponse();
    }

    const issued = await authorizeSecureFileAccess({
      principal,
      request: body
    });
    return secureFileAuthorizationResponse({
      accessUrl: buildSignedSecureFileAccessUrl({
        purpose: issued.purpose,
        token: issued.token
      }),
      expiresAt: issued.expiresAt
    });
  } catch (error) {
    if (error instanceof SecureFileAccessDeniedError) {
      return secureFileAccessDeniedResponse();
    }
    if (error instanceof SecureFileAccessContractError) {
      return secureFileAccessBadRequestResponse();
    }
    return secureFileAccessErrorResponse();
  }
}
