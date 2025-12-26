import { defineStore } from "pinia";
import { api } from "../lib/api";

export const useTechReviewsStore = defineStore("techReviews", {
  state: () => ({ profile: null, reviews: [], loading: false, error: null }),
  actions: {
    async fetch() {
      this.loading = true;
      this.error = null;
      try {
        const res = await api.get("/technician/my-reviews");
        this.profile = res.data.profile;
        this.reviews = res.data.reviews;
      } catch (e) {
        this.error = e?.response?.data?.error || "Failed to load reviews";
      } finally {
        this.loading = false;
      }
    },
  },
});
