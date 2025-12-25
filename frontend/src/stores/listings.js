import { defineStore } from "pinia";
import { api } from "../lib/api";

export const useListingsStore = defineStore("listings", {
  state: () => ({
    active: [],
    mine: [],
    loading: false,
    error: null,
    detail: null,
    bids: [],
    offers: [],
    review: null,
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
    async fetchDetail(id) {
      this.loading = true;
      this.error = null;
      try {
        const res = await api.get(`/listings/${id}`);
        this.detail = res.data.listing;
      } catch (e) {
        this.error = e?.response?.data?.error || "Failed to load listing";
      } finally {
        this.loading = false;
      }
    },

    async fetchBids(listingId, sort = "price_asc") {
      this.loading = true;
      this.error = null;
      try {
        const res = await api.get(`/listings/${listingId}/bids`, { params: { sort } });
        this.bids = res.data.bids;
      } catch (e) {
        this.error = e?.response?.data?.error || "Failed to load bids";
      } finally {
        this.loading = false;
      }
    },

    async placeBid(listingId, payload) {
      this.loading = true;
      this.error = null;
      try {
        const res = await api.post(`/listings/${listingId}/bids`, payload);
        return res.data.bid;
      } catch (e) {
        this.error = e?.response?.data?.error || "Failed to place bid";
        throw e;
      } finally {
        this.loading = false;
      }
    },

    async fetchOffers(listingId) {
      this.loading = true;
      this.error = null;
      try {
        const res = await api.get(`/listings/${listingId}/offers`);
        this.offers = res.data.offers;
      } catch (e) {
        this.error = e?.response?.data?.error || "Failed to load offers";
      } finally {
        this.loading = false;
      }
    },

    async sendOffer(listingId, payload) {
      this.loading = true;
      this.error = null;
      try {
        const res = await api.post(`/listings/${listingId}/offers`, payload);
        return res.data.offer;
      } catch (e) {
        this.error = e?.response?.data?.error || "Failed to send offer";
        throw e;
      } finally {
        this.loading = false;
      }
    },

    async acceptOffer(offerId) {
      this.loading = true;
      this.error = null;
      try {
        await api.post(`/offers/${offerId}/accept`);
      } catch (e) {
        this.error = e?.response?.data?.error || "Failed to accept offer";
        throw e;
      } finally {
        this.loading = false;
      }
    },

    async markDone(listingId) {
      this.loading = true;
      this.error = null;
      try {
        await api.post(`/listings/${listingId}/done`);
      } catch (e) {
        this.error = e?.response?.data?.error || "Failed to mark done";
        throw e;
      } finally {
        this.loading = false;
      }
    },

    async fetchReview(listingId) {
      this.error = null;
      try {
        const res = await api.get(`/listings/${listingId}/review`);
        this.review = res.data.review;
      } catch (e) {
        // if none, keep null; only show error for real failures
        if (e?.response?.status !== 404) {
          this.error = e?.response?.data?.error || "Failed to load review";
        }
        this.review = null;
      }
    },

    async createReview(listingId, payload) {
      this.error = null;
      try {
        const res = await api.post(`/listings/${listingId}/review`, payload);
        this.review = res.data.review;
        return this.review;
      } catch (e) {
        this.error = e?.response?.data?.error || "Failed to submit review";
        throw e;
      }
    },

  },
});
