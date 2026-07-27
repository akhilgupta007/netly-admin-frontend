import { functions, httpsCallable } from "@/lib/firebase";

const FRIENDLY_CODES = {
  unauthenticated: "Your session expired. Please sign in again.",
  "permission-denied": "You do not have permission to perform this action.",
  "not-found": "That record no longer exists.",
  "already-exists": "That record already exists.",
  "failed-precondition": "This action is not allowed right now.",
  unavailable: "Could not reach the server. Check your connection and retry."
};

/**
 * Calls a Cloud Function by name and returns its payload.
 */
export async function callFunction(name, payload = {}) {
  try {
    const fn = httpsCallable(functions, name);
    const result = await fn(payload);
    return result.data;
  } catch (error) {
    const message =
      error?.message && !error.message.startsWith("INTERNAL")
        ? error.message
        : FRIENDLY_CODES[error?.code?.replace("functions/", "")] ||
          "Something went wrong. Please try again.";

    const wrapped = new Error(message);
    wrapped.code = error?.code;
    throw wrapped;
  }
}

export const inviteAdmin = ({ email, role }) =>
  callFunction("inviteAdmin", { email, role });
