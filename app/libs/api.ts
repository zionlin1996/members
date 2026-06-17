import type {
  PublicKeyCredentialCreationOptionsJSON,
  RegistrationResponseJSON,
} from "@simplewebauthn/browser";

const BASE = import.meta.env.VITE_API_URL;

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.message ?? `Request failed (${res.status})`);
  return body as T;
}

// ── Passkey registration ───────────────────────────────────────────────────

export type PasskeyStartPayload = {
  displayName: string;
  username: string;
  backupEmail: string;
};

export type PasskeyStartResult = {
  sessionId: string;
  options: PublicKeyCredentialCreationOptionsJSON;
};

export function passkeyRegisterStart(payload: PasskeyStartPayload) {
  return request<PasskeyStartResult>("/auth/register/passkey/start", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export type PasskeyFinishPayload = {
  sessionId: string;
  credential: RegistrationResponseJSON;
};

export function passkeyRegisterFinish(payload: PasskeyFinishPayload) {
  return request<{ id: string; username: string; status: string }>(
    "/auth/register/passkey/finish",
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );
}
