<template>
  <div class="bg-white rounded-xl shadow p-6">
    <div class="flex items-center justify-between mb-4">
      <h1 class="text-xl font-semibold">Active Listings</h1>

      <RouterLink
        v-if="auth.user?.role === 'CUSTOMER'"
        class="border rounded px-3 py-2"
        to="/listings/create"
      >
        Create Listing
      </RouterLink>
    </div>

    <button class="border rounded px-3 py-2 mb-4" @click="listings.fetchActive()">
      Refresh
    </button>

    <p v-if="listings.error" class="text-red-600 mb-3">{{ listings.error }}</p>

    <div v-if="listings.loading">Loading...</div>

    <div v-else class="grid sm:grid-cols-2 gap-3">
      <div v-for="l in listings.active" :key="l.id" class="border rounded p-4">
        <div class="font-semibold">{{ l.title }}</div>
        <div class="text-sm text-gray-600">{{ l.category }}</div>
        <div class="text-xs text-gray-500 mt-2">
          Expires: {{ new Date(l.expiresAt).toLocaleString() }}
        </div>

        <RouterLink class="underline text-sm mt-3 inline-block" :to="`/listing/${l.id}`">
          View details (next)
        </RouterLink>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from "vue";
import { useAuthStore } from "../stores/auth";
import { useListingsStore } from "../stores/listings";

const auth = useAuthStore();
const listings = useListingsStore();

onMounted(() => listings.fetchActive());
</script>
