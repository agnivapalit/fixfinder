<template>
  <div class="bg-white rounded-xl shadow p-6">
    <div class="flex items-start justify-between gap-4">
      <div>
        <h1 class="text-xl font-semibold">{{ listings.detail?.title || "Listing" }}</h1>
        <div class="text-sm text-gray-600">{{ listings.detail?.category }}</div>
        <div class="text-xs text-gray-500 mt-2">
          Expires: {{ listings.detail ? new Date(listings.detail.expiresAt).toLocaleString() : "" }}
        </div>
      </div>

      <div class="flex gap-2">
        <button class="border rounded px-3 py-2" @click="refresh">Refresh</button>
        <button v-if="auth.user?.role === 'TECHNICIAN'" class="border rounded px-3 py-2" @click="toggleFav"> Toggle favourite </button>
      </div>
    </div>

    <p v-if="listings.error" class="text-red-600 mt-3">{{ listings.error }}</p>
    <div v-if="listings.loading" class="mt-4">Loading...</div>

    <div v-else-if="listings.detail" class="mt-4 space-y-4">
      <div>
        <div class="font-semibold mb-1">Description</div>
        <p class="text-gray-800 whitespace-pre-wrap">{{ listings.detail.description }}</p>
      </div>

      <div>
        <div class="font-semibold mb-2">Images</div>
        <div class="grid sm:grid-cols-3 gap-3">
          <a
            v-for="(u, idx) in listings.detail.imageUrls"
            :key="idx"
            :href="u"
            target="_blank"
            class="border rounded p-2 text-sm underline break-all"
          >
            Image {{ idx + 1 }}
          </a>
        </div>
      </div>

      <!-- Technician: place bid -->
      <div v-if="auth.user?.role === 'TECHNICIAN'" class="border rounded p-4">
        <div class="font-semibold mb-2">Place / Update Bid</div>

        <form class="flex flex-col gap-2" @submit.prevent="submitBid">
          <input class="border rounded p-2" v-model.number="priceEuros" type="number" min="5" step="0.5" />
          <textarea class="border rounded p-2 h-24" v-model="note" placeholder="Optional note (max 500)"></textarea>

          <button class="bg-black text-white rounded p-2 disabled:opacity-50" :disabled="listings.loading">
            {{ listings.loading ? "Saving..." : "Save Bid" }}
          </button>
        </form>
      </div>

      <!-- Customer/Admin: view bids -->
      <div v-if="auth.user?.role !== 'TECHNICIAN'" class="border rounded p-4">
        <div class="flex items-center justify-between mb-3">
          <div class="font-semibold">Bids</div>
          <select class="border rounded p-2 text-sm" v-model="sort" @change="loadBids">
            <option value="price_asc">Price: Low → High</option>
            <option value="price_desc">Price: High → Low</option>
          </select>
        </div>

        <button class="border rounded px-3 py-2 mb-3" @click="loadBids">Refresh bids</button>

        <div class="space-y-2">
          <div v-for="b in listings.bids" :key="b.id" class="border rounded p-3">
            <div class="font-semibold">
              € {{ (b.priceCents / 100).toFixed(2) }}
            </div>
            <div class="text-sm text-gray-600">Tech: {{ b.technician.email }}</div>
            <button class="border rounded px-3 py-1 mt-2" @click="messageTech(b.technician.id)"> Message </button>
            <div v-if="b.note" class="text-sm mt-2 whitespace-pre-wrap">{{ b.note }}</div>
          </div>

          <div v-if="!listings.bids.length" class="text-gray-600">No bids yet.</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import { useAuthStore } from "../stores/auth";
import { useListingsStore } from "../stores/listings";
import { useFavouritesStore } from "../stores/favourites";
import { useRouter } from "vue-router";
import { useChatStore } from "../stores/chat";

const route = useRoute();
const auth = useAuthStore();
const listings = useListingsStore();

const listingId = route.params.id;

const priceEuros = ref(15);
const note = ref("");
const sort = ref("price_asc");

const favs = useFavouritesStore();

const router = useRouter();
const chat = useChatStore();

async function refresh() {
  await listings.fetchDetail(listingId);
  if (auth.user?.role !== "TECHNICIAN") {
    await listings.fetchBids(listingId, sort.value);
  }
}

async function submitBid() {
  const cents = Math.round(Number(priceEuros.value) * 100);
  await listings.placeBid(listingId, { priceCents: cents, note: note.value || undefined });
  await listings.fetchDetail(listingId);
}

async function loadBids() {
  await listings.fetchBids(listingId, sort.value);
}

async function toggleFav() {
  await favs.toggle(listingId);
}

async function messageTech(technicianId) {
  const thread = await chat.createThread(listingId, technicianId);
  router.push(`/chat/${thread.id}`);
}

onMounted(refresh);
</script>
