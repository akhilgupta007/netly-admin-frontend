import { create } from "zustand";

export const useAuthStore = create((set) => ({
  token: null,
  uid: null,
  role: null,
  email: null,
  isHydrated: false,

  setAuth: ({ token, uid, role, email }) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("netly_admin_token", token);
      localStorage.setItem("netly_admin_uid", uid);
      localStorage.setItem("netly_admin_role", role);
      localStorage.setItem("netly_admin_email", email);
    }
    set({ token, uid, role, email });
  },

  clearAuth: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("netly_admin_token");
      localStorage.removeItem("netly_admin_uid");
      localStorage.removeItem("netly_admin_role");
      localStorage.removeItem("netly_admin_email");
      localStorage.removeItem("netly_admin_profile");
    }
    set({ token: null, uid: null, role: null, email: null });
  },

  hydrate: () => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("netly_admin_token");
      const uid = localStorage.getItem("netly_admin_uid");
      const role = localStorage.getItem("netly_admin_role");
      const email = localStorage.getItem("netly_admin_email");
      set({ token, uid, role, email, isHydrated: true });
    } else {
      set({ isHydrated: true });
    }
  }
}));
