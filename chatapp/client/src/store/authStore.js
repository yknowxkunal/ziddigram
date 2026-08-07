import { create } from "zustand";
import api from "../utils/api";

export const useAuthStore = create((set) => ({
  user: null,
  loading: true,
  error: null,

  async checkAuth() {
    try {
      const { data } = await api.get("/auth/me");
      set({ user: data.user, loading: false });
    } catch {
      set({ user: null, loading: false });
    }
  },

  async signup(payload) {
    set({ error: null });
    try {
      const { data } = await api.post("/auth/signup", payload);
      set({ user: data.user });
      return true;
    } catch (err) {
      set({ error: err.response?.data?.message || "Signup failed" });
      return false;
    }
  },

  async login(payload) {
    set({ error: null });
    try {
      const { data } = await api.post("/auth/login", payload);
      set({ user: data.user });
      return true;
    } catch (err) {
      set({ error: err.response?.data?.message || "Login failed" });
      return false;
    }
  },

  async logout() {
    try {
      await api.post("/auth/logout");
    } finally {
      set({ user: null });
    }
  },
}));
