<template>
  <div class="bg-white rounded-xl shadow p-6">
    <div class="flex items-center justify-between mb-4">
      <h1 class="text-xl font-semibold">My Favourites</h1>
      <button class="border rounded px-3 py-2" @click="store.fetchMine()">Refresh</button>
    </div>

    <p v-if="store.error" class="text-red-600 mb-3">{{ store.error }}</p>
    <div v-if="store.loading">Loading...</div>

    <div v-else class="space-y-3">
      <div v-for="f in store.favourites" :key="f.id" class="border rounded p-4">
        <div class="font-semibold">{{ f.listing.title }}</div>
        <div class="text-sm text-gray-600">{{ f.listing.category }}</div>
        <RouterLink class="underline text-sm mt-2 inline-block" :to="`/listing/${f.listing.id}`">
          Open listing
        </RouterLink>
      </div>

      <div v-if="!store.favourites.length" class="text-gray-600">No favourites yet.</div>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from "vue";
import { useFavouritesStore } from "../stores/favourites";

const store = useFavouritesStore();
onMounted(() => store.fetchMine());
</script>
