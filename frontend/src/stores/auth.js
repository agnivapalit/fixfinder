import { defineStore } from "pinia";
import { api, setAuthToken } from "../lib/api";

export const useAuthStore = defineStore("auth", {
  state: () => ({
    token: localStorage.getItem("token") || null,
    user: null,
    loading: false,
    error: null,
  }),
  actions: {
    async init() {
      if (!this.token) return;
      setAuthToken(this.token);
      try {
        const res = await api.get("/me");
        this.user = res.data.user;
      } catch {
        this.logout();
      }
    },
    async login(email, password) {
      this.loading = true;
      this.error = null;
      try {
        const res = await api.post("/auth/login", { email, password });
        this.token = res.data.token;
        localStorage.setItem("token", this.token);
        setAuthToken(this.token);

        const me = await api.get("/me");
        this.user = me.data.user;
      } catch (e) {
        this.error = e?.response?.data?.error || "Login failed";
      } finally {
        this.loading = false;
      }
    },
    logout() {
      this.token = null;
      this.user = null;
      this.error = null;
      localStorage.removeItem("token");
      setAuthToken(null);
    },
  },
});
