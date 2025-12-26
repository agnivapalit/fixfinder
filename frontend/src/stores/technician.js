import { defineStore } from "pinia";
import { api } from "../lib/api";

export const useTechnicianStore = defineStore("technician", {
  state: () => ({
    jobs: [],
    loading: false,
    error: null,
  }),
  actions: {
    async fetchJobs(type = "current") {
      this.loading = true;
      this.error = null;
      try {
        const res = await api.get("/technician/jobs", { params: { type } });
        this.jobs = res.data.jobs;
      } catch (e) {
        this.error = e?.response?.data?.error || "Failed to load jobs";
      } finally {
        this.loading = false;
      }
    },
  },
});
