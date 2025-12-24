<template>
  <div class="bg-white rounded-xl shadow p-6">
    <div class="flex items-center justify-between mb-4">
      <h1 class="text-xl font-semibold">Messages</h1>
      <button class="border rounded px-3 py-2" @click="chat.fetchThreads()">Refresh</button>
    </div>

    <p v-if="chat.error" class="text-red-600 mb-3">{{ chat.error }}</p>
    <div v-if="chat.loading">Loading...</div>

    <div v-else class="space-y-3">
      <RouterLink
        v-for="t in chat.threads"
        :key="t.id"
        class="block border rounded p-4 hover:bg-gray-50"
        :to="`/chat/${t.id}`"
      >
        <div class="font-semibold">{{ t.listing.title }}</div>
        <div class="text-sm text-gray-600">{{ t.listing.category }}</div>
        <div class="text-xs text-gray-500 mt-2">
          Last: {{ t.lastMessage ? t.lastMessage.body.slice(0, 80) : "No messages yet" }}
        </div>
      </RouterLink>

      <div v-if="!chat.threads.length" class="text-gray-600">No threads yet.</div>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from "vue";
import { useChatStore } from "../stores/chat";

const chat = useChatStore();
onMounted(() => chat.fetchThreads());
</script>
