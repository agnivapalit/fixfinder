<template>
  <div class="bg-white rounded-xl shadow p-6">
    <div class="flex items-center justify-between mb-4">
      <h1 class="text-xl font-semibold">My Listings</h1>
      <RouterLink class="border rounded px-3 py-2" to="/listings/create">Create</RouterLink>
    </div>

    <button class="border rounded px-3 py-2 mb-4" @click="listings.fetchMine()">Refresh</button>

    <p v-if="listings.error" class="text-red-600 mb-3">{{ listings.error }}</p>

    <div v-if="listings.loading">Loading...</div>

    <div v-else class="space-y-3">
      <div v-for="l in listings.mine" :key="l.id" class="border rounded p-4">
        <div class="font-semibold">{{ l.title }}</div>
        <div class="text-sm text-gray-600">{{ l.category }} • {{ l.status }}</div>
        <div class="text-xs text-gray-500 mt-2">
          Expires: {{ new Date(l.expiresAt).toLocaleString() }}
        </div>
        <RouterLink class="underline text-sm mt-2 inline-block" :to="`/listing/${l.id}`">Open details</RouterLink>
      </div>

      <div v-if="!listings.mine.length" class="text-gray-600">No listings yet.</div>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from "vue";
import { useListingsStore } from "../stores/listings";

const listings = useListingsStore();
onMounted(() => listings.fetchMine());
</script>
