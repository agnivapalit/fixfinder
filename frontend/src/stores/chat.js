import { defineStore } from "pinia";
import { api } from "../lib/api";

export const useChatStore = defineStore("chat", {
  state: () => ({
    threads: [],
    messages: [],
    loading: false,
    error: null,
  }),
  actions: {
    async fetchThreads() {
      this.loading = true;
      this.error = null;
      try {
        const res = await api.get("/chat/threads");
        this.threads = res.data.threads;
      } catch (e) {
        this.error = e?.response?.data?.error || "Failed to load threads";
      } finally {
        this.loading = false;
      }
    },
    async createThread(listingId, technicianId) {
      const res = await api.post("/chat/threads", { listingId, technicianId });
      return res.data.thread;
    },
    async fetchMessages(threadId) {
      this.loading = true;
      this.error = null;
      try {
        const res = await api.get(`/chat/threads/${threadId}/messages`);
        this.messages = res.data.messages;
      } catch (e) {
        this.error = e?.response?.data?.error || "Failed to load messages";
      } finally {
        this.loading = false;
      }
    },
    async sendMessage(threadId, body) {
      const res = await api.post(`/chat/threads/${threadId}/messages`, { body });
      return res.data.message;
    },
    async findThread(listingId, technicianId) {
      const res = await api.get("/chat/thread-by-listing", { params: { listingId, technicianId } });
      return res.data.thread; // null or {id,...}
    },
  },
});
