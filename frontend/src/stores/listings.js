import { defineStore } from "pinia";
import { api } from "../lib/api";

export const useListingsStore = defineStore("listings", {
  state: () => ({
    active: [],
    mine: [],
    loading: false,
    error: null,
  }),
  actions: {
    async fetchActive() {
      this.loading = true;
      this.error = null;
      try {
        const res = await api.get("/listings");
        this.active = res.data.listings;
      } catch (e) {
        this.error = e?.response?.data?.error || "Failed to load listings";
      } finally {
        this.loading = false;
      }
    },
    async fetchMine() {
      this.loading = true;
      this.error = null;
      try {
        const res = await api.get("/listings/mine");
        this.mine = res.data.listings;
      } catch (e) {
        this.error = e?.response?.data?.error || "Failed to load your listings";
      } finally {
        this.loading = false;
      }
    },
    async createListing(payload) {
      this.loading = true;
      this.error = null;
      try {
        const res = await api.post("/listings", payload);
        return res.data.listing;
      } catch (e) {
        this.error = e?.response?.data?.error || "Failed to create listing";
        throw e;
      } finally {
        this.loading = false;
      }
    },
  },
});
