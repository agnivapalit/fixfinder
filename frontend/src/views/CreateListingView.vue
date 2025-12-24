<template>
  <div class="bg-white rounded-xl shadow p-6 max-w-xl">
    <h1 class="text-xl font-semibold mb-4">Create Listing</h1>

    <form class="space-y-3" @submit.prevent="submit">
      <input class="w-full border rounded p-2" v-model="title" placeholder="Title" required />
      <input class="w-full border rounded p-2" v-model="category" placeholder="Category (e.g. Shoes)" required />

      <div>
        <textarea
          class="w-full border rounded p-2 h-40"
          v-model="description"
          placeholder="Describe the repair (min 50 words)"
          required
        />
        <div class="text-sm text-gray-600">
          Word count: {{ wordCount }} <span v-if="wordCount < 50" class="text-red-600">(min 50)</span>
        </div>
      </div>

      <div class="space-y-2">
        <input class="w-full border rounded p-2" v-model="img1" placeholder="Image URL 1" required />
        <input class="w-full border rounded p-2" v-model="img2" placeholder="Image URL 2" required />
        <input class="w-full border rounded p-2" v-model="img3" placeholder="Image URL 3" required />
      </div>

      <button class="w-full bg-black text-white rounded p-2 disabled:opacity-50" :disabled="listings.loading || wordCount < 50">
        {{ listings.loading ? "Creating..." : "Create" }}
      </button>

      <p v-if="listings.error" class="text-red-600">{{ listings.error }}</p>
    </form>
  </div>
</template>

<script setup>
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import { useListingsStore } from "../stores/listings";

const router = useRouter();
const listings = useListingsStore();

const title = ref("");
const category = ref("");
const description = ref("");
const img1 = ref("");
const img2 = ref("");
const img3 = ref("");

const wordCount = computed(() =>
  description.value.trim().split(/\s+/).filter(Boolean).length
);

async function submit() {
  if (wordCount.value < 50) return;

  await listings.createListing({
    title: title.value,
    category: category.value,
    description: description.value,
    imageUrls: [img1.value, img2.value, img3.value],
  });

  router.push("/my-listings");
}
</script>
