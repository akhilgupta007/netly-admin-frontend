import { z } from "zod";

// Zod schemas for validation
export const loginSchema = z.object({
  email: z.string().trim().email("Invalid email address format"),
  password: z.string().min(6, "Password must be at least 6 characters")
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email("Invalid email address format")
});

export const updatePasswordSchema = z.object({
  token: z.string().trim().min(1, "Verification token is required"),
  newPassword: z.string().min(12, "New password must be at least 12 characters")
});

// Helper for cloud function fetch requests
async function callCloudFunction(endpoint, payload) {
  const url = `/api/auth-cf/${endpoint}`;
  
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok || data.error) {
      const errorMessage = data.error?.message || data.error || "An error occurred during authentication.";
      throw new Error(errorMessage);
    }

    return data.result;
  } catch (error) {
    console.error(`Error calling cloud function ${endpoint}:`, error);
    throw error;
  }
}

// API methods
export async function loginAPI(email, password) {
  loginSchema.parse({ email, password });
  return callCloudFunction("adminLogin", { data: { email, password } });
}

export async function forgotPasswordAPI(email) {
  forgotPasswordSchema.parse({ email });
  return callCloudFunction("adminForgotPassword", { data: { email } });
}

export async function updatePasswordAPI(token, newPassword) {
  updatePasswordSchema.parse({ token, newPassword });
  return callCloudFunction("adminUpdatePassword", { data: { token, newPassword } });
}
