<template>
  <div class="bg-white rounded-xl shadow p-6">
    <h1 class="text-xl font-semibold mb-2">My Reviews</h1>

    <div v-if="store.profile" class="text-sm text-gray-700 mb-4">
      Avg: {{ (store.profile.ratingAvg ?? 0).toFixed(2) }} ({{ store.profile.ratingCount ?? 0 }})
    </div>

    <p v-if="store.error" class="text-red-600 mb-3">{{ store.error }}</p>
    <div v-if="store.loading">Loading...</div>

    <div v-else class="space-y-3">
      <div v-for="r in store.reviews" :key="r.id" class="border rounded p-4">
        <div class="font-semibold">{{ r.listing.title }}</div>
        <div class="text-sm text-gray-600">{{ r.listing.category }}</div>
        <div class="text-sm mt-2">Rating: {{ r.rating }} / 5</div>
        <div v-if="r.comment" class="text-sm mt-2 whitespace-pre-wrap">{{ r.comment }}</div>
        <RouterLink class="underline text-sm mt-2 inline-block" :to="`/listing/${r.listing.id}`">Open listing</RouterLink>
      </div>

      <div v-if="!store.reviews.length" class="text-gray-600">No reviews yet.</div>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from "vue";
import { useTechReviewsStore } from "../stores/techReviews";

const store = useTechReviewsStore();
onMounted(() => store.fetch());
</script>
