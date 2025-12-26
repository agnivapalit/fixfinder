<template>
  <div class="bg-white rounded-xl shadow p-6">
    <div class="flex items-center justify-between mb-4">
      <h1 class="text-xl font-semibold">Chat</h1>
      <button class="border rounded px-3 py-2" @click="reload">Refresh</button>
    </div>

    <p v-if="chat.error" class="text-red-600 mb-3">{{ chat.error }}</p>

    <div class="border rounded p-3 h-80 overflow-auto bg-gray-50">
      <div v-for="m in chat.messages" :key="m.id" class="mb-3">
        <div class="text-xs text-gray-600">{{ m.sender.email }} • {{ new Date(m.createdAt).toLocaleString() }}</div>
        <RouterLink v-if="listingId" class="underline text-sm" :to="`/listing/${listingId}`">Open listing</RouterLink>
        <div class="whitespace-pre-wrap">{{ m.body }}</div>
      </div>
      <div v-if="!chat.messages.length" class="text-gray-600">No messages yet.</div>
    </div>

    <form class="mt-4 flex gap-2" @submit.prevent="send">
      <input class="flex-1 border rounded p-2" v-model="body" placeholder="Type a message..." />
      <button class="bg-black text-white rounded px-4 disabled:opacity-50" :disabled="!body.trim()">
        Send
      </button>
    </form>
  </div>
</template>

<script setup>
import { onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import { useChatStore } from "../stores/chat";

const route = useRoute();
const chat = useChatStore();
const threadId = route.params.threadId;
const listingId = route.query.listingId;

const body = ref("");

async function reload() {
  await chat.fetchMessages(threadId);
}

async function send() {
  const text = body.value.trim();
  if (!text) return;
  await chat.sendMessage(threadId, text);
  body.value = "";
  await reload();
}

onMounted(reload);
</script>
