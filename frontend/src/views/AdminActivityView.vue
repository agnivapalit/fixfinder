<template>
  <div class="bg-white rounded-xl shadow p-6">
    <div class="flex items-center justify-between mb-4">
      <h1 class="text-xl font-semibold">Admin — Activity</h1>
      <div>
        <button class="border rounded px-3 py-2" @click="loadAll" :disabled="loading">Refresh</button>
      </div>
    </div>

    <div v-if="!listings.length">No listings found.</div>

    <div v-for="l in listings" :key="l.id" class="border rounded p-4 mb-3">
      <div class="flex items-center justify-between">
        <div>
          <div class="font-semibold">{{ l.title }}</div>
          <div class="text-sm text-gray-600">Created: {{ new Date(l.createdAt).toLocaleString() }}</div>
        </div>
        <div class="flex gap-2">
          <button class="border rounded px-3 py-1" @click="deleteListing(l.id)" :disabled="loading">Delete</button>
          <RouterLink :to="`/listing/${l.id}`" class="underline">Open</RouterLink>
        </div>
      </div>

      <div class="mt-3 grid grid-cols-2 gap-4">
        <div>
          <div class="font-semibold mb-2">Bids</div>
          <div v-if="l._bids?.length">
            <div v-for="b in l._bids" :key="b.id" class="border rounded p-3 mb-2">
              <div class="flex items-center justify-between">
                <div>
                  <div class="font-semibold">€{{ (b.priceCents/100).toFixed(2) }}</div>
                  <div class="text-sm text-gray-600">Tech: {{ b.technician?.email || '—' }}</div>
                </div>
                <div class="flex gap-2">
                  <button class="border rounded px-3 py-1" @click="deleteBid(b.id)" :disabled="loading">Delete Bid</button>
                </div>
              </div>
              <div v-if="b.note" class="text-sm mt-2">{{ b.note }}</div>
            </div>
          </div>
          <div v-else class="text-gray-600">No bids</div>
        </div>

        <div>
          <div class="font-semibold mb-2">Offers</div>
          <div v-if="l._offers?.length">
            <div v-for="o in l._offers" :key="o.id" class="border rounded p-3 mb-2">
              <div class="font-semibold">{{ o.repairType }} • {{ o.status }}</div>
              <div class="text-sm text-gray-600">Tech: {{ o.technician?.email || '—' }}</div>
              <div class="text-sm mt-2">{{ o.description }}</div>
            </div>
          </div>
          <div v-else class="text-gray-600">No offers</div>
        </div>
      </div>
    </div>

    <p v-if="message" class="text-sm text-red-600">{{ message }}</p>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { api } from '../lib/api';

const listings = ref([]);
const loading = ref(false);
const message = ref('');

async function fetchListings() {
  loading.value = true; message.value = '';
  try {
    const { data } = await api.get('/admin/listings');
    // Map listings and prepare empty children
    listings.value = (data.listings || []).map(l => ({ ...l, _bids: [], _offers: [] }));
  } catch (err) { message.value = 'Failed to load listings'; }
  finally { loading.value = false; }
}

async function fetchBids() {
  try {
    const { data } = await api.get('/admin/bids');
    return data.bids || [];
  } catch (err) { message.value = 'Failed to load bids'; return []; }
}

async function fetchOffers() {
  try {
    const { data } = await api.get('/admin/offers');
    return data.offers || [];
  } catch (err) { message.value = 'Failed to load offers'; return []; }
}

async function populateChildren() {
  const [bids, offers] = await Promise.all([fetchBids(), fetchOffers()]);
  // attach to listings
  const map = Object.fromEntries(listings.value.map(l => [l.id, l]));
  bids.forEach(b => {
    const list = map[b.listingId];
    if (list) list._bids.push(b);
  });
  offers.forEach(o => {
    const list = map[o.listingId];
    if (list) list._offers.push(o);
  });
}

async function deleteListing(id) {
  if (!confirm('Delete listing #' + id + '?')) return;
  loading.value = true;
  try {
    await api.delete(`/admin/listings/${id}`);
    await loadAll();
  } catch (err) { message.value = 'Failed to delete listing'; }
  finally { loading.value = false; }
}

async function deleteBid(id) {
  if (!confirm('Delete bid #' + id + '?')) return;
  loading.value = true; message.value = '';
  try {
    await api.post('/admin/bids/remove', { id });
    await loadAll();
  } catch (err) { message.value = 'Failed to delete bid'; }
  finally { loading.value = false; }
}

async function loadAll() {
  message.value = '';
  await fetchListings();
  await populateChildren();
}

onMounted(loadAll);
</script>

<style scoped>
/* keep spacing consistent with other pages */
</style>
