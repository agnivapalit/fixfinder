import { defineStore } from "pinia";
import { api } from "../lib/api";

export const useFavouritesStore = defineStore("favourites", {
  state: () => ({
    favourites: [],
    loading: false,
    error: null,
  }),
  actions: {
    async fetchMine() {
      this.loading = true;
      this.error = null;
      try {
        const res = await api.get("/favourites");
        this.favourites = res.data.favourites;
      } catch (e) {
        this.error = e?.response?.data?.error || "Failed to load favourites";
      } finally {
        this.loading = false;
      }
    },
    async toggle(listingId) {
      const res = await api.post(`/favourites/toggle/${listingId}`);
      return res.data.favourited;
    },
  },
});
