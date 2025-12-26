<template>
  <div class="bg-white rounded-xl shadow p-6">
    <div class="flex items-center justify-between mb-4">
      <h1 class="text-xl font-semibold">My Jobs</h1>
      <div class="flex gap-2">
        <button class="border rounded px-3 py-2" @click="setType('current')">Current</button>
        <button class="border rounded px-3 py-2" @click="setType('history')">History</button>
      </div>
    </div>

    <p v-if="store.error" class="text-red-600 mb-3">{{ store.error }}</p>
    <div v-if="store.loading">Loading...</div>

    <div v-else class="space-y-3">
      <div v-for="o in store.jobs" :key="o.id" class="border rounded p-4">
        <div class="font-semibold">{{ o.listing.title }}</div>
        <div class="text-sm text-gray-600">{{ o.listing.category }}</div>

        <div class="text-sm mt-2">
          Offer: <span class="font-semibold">{{ o.repairType }}</span>
        </div>
        <div class="text-sm text-gray-700 mt-1">Location: {{ o.location }}</div>

        <div class="text-xs text-gray-500 mt-2">
          Customer: {{ o.listing.customer.email }}
          <span v-if="o.listing.jobDoneAt"> • Done: {{ new Date(o.listing.jobDoneAt).toLocaleString() }}</span>
        </div>

        <div class="mt-3 flex gap-3">
          <RouterLink class="underline text-sm" :to="`/listing/${o.listing.id}`">Open listing</RouterLink>
          <button class="border rounded px-3 py-1" @click="openChat(o.listing.id)">Open chat</button>
        </div>
      </div>

      <div v-if="!store.jobs.length" class="text-gray-600">No jobs.</div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from "vue";
import { useTechnicianStore } from "../stores/technician";
import { useChatStore } from "../stores/chat";
import { useRouter } from "vue-router";
import { useAuthStore } from "../stores/auth";

const store = useTechnicianStore();
const type = ref("current");
const chat = useChatStore();
const router = useRouter();
const auth = useAuthStore();

async function openChat(listingId) {
  const thread = await chat.findThread(listingId, auth.user.id);
  if (!thread) {
    // technician can create thread for themselves
    const created = await chat.createThread(listingId);
    router.push(`/chat/${created.id}`);
    return;
  }
  router.push(`/chat/${thread.id}`);
}

function setType(t) {
  type.value = t;
  store.fetchJobs(t);
}

onMounted(() => store.fetchJobs(type.value));
</script>
