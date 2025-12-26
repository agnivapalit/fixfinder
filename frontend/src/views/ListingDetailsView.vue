<template>
  <div class="bg-white rounded-xl shadow p-6">
    <div class="flex items-start justify-between gap-4">
      <div>
        <h1 class="text-xl font-semibold">{{ listings.detail?.title || "Listing" }}</h1>
        <div class="text-sm text-gray-600">{{ listings.detail?.category }}</div>
        <div class="text-sm text-gray-600">Status: {{ listings.detail?.status }}<span v-if="listings.detail?.jobDoneAt"> • Done</span></div>
        <div class="text-xs text-gray-500 mt-2">
          Expires: {{ listings.detail ? new Date(listings.detail.expiresAt).toLocaleString() : "" }}
        </div>
      </div>

      <div class="flex gap-2">
        <button class="border rounded px-3 py-2" @click="refresh">Refresh</button>
        <button v-if="auth.user?.role === 'TECHNICIAN'" class="border rounded px-3 py-2" @click="toggleFav"> Toggle favourite </button>
        <button v-if="auth.user?.role === 'CUSTOMER' && auth.user?.id !== listings.detail?.customer?.id" class="border rounded px-3 py-2" @click="reportOpen = !reportOpen">Report</button>
      </div>
    </div>

    <button v-if="auth.user?.role === 'TECHNICIAN'" class="border rounded px-3 py-2" @click="done">Mark done</button>
    <button v-if="auth.user?.role === 'TECHNICIAN' && listings.detail?.acceptedTechnicianId === auth.user?.id" class="border rounded px-3 py-2" @click="(reportTarget = 'owner', reportOpen = true)">Report customer</button>

    <!-- Report -->
    <div v-if="reportOpen" class="border rounded p-4 mt-3">
      <div class="font-semibold mb-2">Report listing</div>

      <div class="mb-2">
        <label class="mr-3">
          <input type="radio" v-model="reportTarget" value="owner" :disabled="auth.user?.id === listings.detail?.customer?.id" />
          Report owner
        </label>
        <label v-if="listings.detail?.acceptedTechnicianId">
          <input type="radio" v-model="reportTarget" value="technician" :disabled="auth.user?.id === listings.detail?.acceptedTechnicianId" />
          Report technician
        </label>
      </div>

      <textarea class="w-full border rounded p-2 h-24" v-model="reportReason" placeholder="Reason for report"></textarea>
      <div class="flex items-center gap-2 mt-2">
        <label class="text-sm"><input type="checkbox" v-model="reportIncludeChat" class="mr-2"/> Include chat</label>
      </div>
      <div class="flex gap-2 mt-3">
        <button class="bg-black text-white rounded px-3 py-2" @click="submitReport">Submit report</button>
        <button class="border rounded px-3 py-2" @click="reportOpen=false">Cancel</button>
      </div>
      <div v-if="reportMessage" class="text-sm text-green-600 mt-2">{{ reportMessage }}</div>
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

      <!-- Technician: send offer -->
      <div v-if="auth.user?.role === 'TECHNICIAN'" class="border rounded p-4">
        <div class="font-semibold mb-2">Send Offer (max 3)</div>

        <form class="space-y-2" @submit.prevent="submitOffer">
          <input class="w-full border rounded p-2" v-model="offerType" placeholder="Repair type (e.g. zipper replacement)" />
          <textarea class="w-full border rounded p-2 h-24" v-model="offerDesc" placeholder="Offer description (min 10 chars)"></textarea>
          <input class="w-full border rounded p-2" v-model="offerLocation" placeholder="Location (in shop / flexible / address)" />

          <button class="bg-black text-white rounded p-2 disabled:opacity-50" :disabled="listings.loading">
            {{ listings.loading ? "Sending..." : "Send Offer" }}
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
            <option value="rating_desc">Rating: High → Low</option>
            <option value="rating_asc">Rating: Low → High</option>
          </select>
        </div>

        <button class="border rounded px-3 py-2 mb-3" @click="loadBids">Refresh bids</button>

        <div class="space-y-2">
          <div v-for="b in listings.bids" :key="b.id" class="border rounded p-3">
            <div class="font-semibold">
              € {{ (b.priceCents / 100).toFixed(2) }}
            </div>
            <div class="text-sm text-gray-600">Tech: {{ b.technician.email }}</div>
            <div class="text-sm text-yellow-600">
              Rating: 
              <span v-if="b.technician.technicianProfile.ratingCount > 0">
                {{ b.technician.technicianProfile.ratingAvg.toFixed(1) }} ({{ b.technician.technicianProfile.ratingCount }} reviews)
              </span>
              <span v-else>No ratings yet  &nbsp;</span>
            <button class="border rounded px-3 py-1 mt-2" @click="messageTech(b.technician.id)"> Message </button>
            <div v-if="b.note" class="text-sm mt-2 whitespace-pre-wrap">{{ b.note }}</div>
          </div>

          <div v-if="!listings.bids.length" class="text-gray-600">No bids yet.</div>
        </div>
      </div>
      </div>
      <!-- Customer/Admin: view offers -->
      <div v-if="auth.user?.role !== 'TECHNICIAN'" class="border rounded p-4">
        <div class="font-semibold mb-3">Offers</div>

        <button class="border rounded px-3 py-2 mb-3" @click="listings.fetchOffers(listingId)">
          Refresh offers
        </button>

        <div class="space-y-2">
          <div v-for="o in listings.offers" :key="o.id" class="border rounded p-3">
            <div class="font-semibold">{{ o.repairType }} • {{ o.status }}</div>
            <div class="flex items-center justify-between">
              <div class="text-sm text-gray-600">Tech: {{ o.technician.email }}</div>

              <!-- Owner: report accepted technician -->
              <button
                v-if="o.status === 'ACCEPTED' && auth.user?.role === 'CUSTOMER' && auth.user?.id === listings.detail?.customer?.id"
                class="border rounded px-3 py-1 text-sm"
                @click="(reportTarget = 'technician', reportOpen = true)">
                Report technician
              </button>

              <!-- Accepted technician: report customer -->
              <button
                v-if="o.status === 'ACCEPTED' && auth.user?.role === 'TECHNICIAN' && auth.user?.id === o.technician.id"
                class="border rounded px-3 py-1 text-sm"
                @click="(reportTarget = 'owner', reportOpen = true)">
                Report customer
              </button>
            </div>

            <div class="text-sm mt-2 whitespace-pre-wrap">{{ o.description }}</div>
            <div class="text-sm text-gray-700 mt-2">Location: {{ o.location }}</div>

            <button
              v-if="o.status === 'SENT'"
              class="mt-2 bg-black text-white rounded px-3 py-1 disabled:opacity-50"
              :disabled="listings.loading"
              @click="accept(o.id)">
              Accept offer</button>
          </div>

        <div v-if="!listings.offers.length" class="text-gray-600">No offers yet.</div>
      </div>
      </div>
      <div v-if="auth.user?.role === 'CUSTOMER'" class="border rounded p-4">
        <div class="font-semibold mb-2">Review</div>

        <div v-if="listings.review">
          <div class="text-sm">Rating: {{ listings.review.rating }} / 5</div>
          <div v-if="listings.review.comment" class="mt-2 whitespace-pre-wrap">
            {{ listings.review.comment }}
          </div>
        </div>

        <div v-else>
          <p class="text-sm text-gray-600 mb-3">
            You can leave a review after the job is marked done.
          </p>

              <div v-if="listings.detail?.jobDoneAt" class="space-y-2">
                <select class="border rounded p-2" v-model.number="rating">
                  <option :value="5">5</option>
                  <option :value="4">4</option>
                  <option :value="3">3</option>
                  <option :value="2">2</option>
                  <option :value="1">1</option>
                </select>

                <textarea class="w-full border rounded p-2 h-24" v-model="comment" placeholder="Optional comment"></textarea>

                <button class="bg-black text-white rounded px-3 py-2" @click="submitReview">
                  Submit review
                </button>
              </div>
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

const offerType = ref("");
const offerDesc = ref("");
const offerLocation = ref("");

const rating = ref(5);
const comment = ref("");

async function refresh() {
  await listings.fetchDetail(listingId);
  await listings.fetchOffers(listingId);
  if (auth.user?.role !== "TECHNICIAN") {
    await listings.fetchBids(listingId, sort.value);
  }
  if (auth.user?.role === "CUSTOMER") {
    await listings.fetchReview(listingId);
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
  let thread = await chat.findThread(listingId, technicianId);
  if (!thread) thread = await chat.createThread(listingId, technicianId);
  router.push(`/chat/${thread.id}`);
}

async function submitOffer() {
  await listings.sendOffer(listingId, {
    repairType: offerType.value,
    description: offerDesc.value,
    location: offerLocation.value,
  });
  offerType.value = "";
  offerDesc.value = "";
  offerLocation.value = "";
  await listings.fetchOffers(listingId);
}

async function accept(offerId) {
  await listings.acceptOffer(offerId);
  await refresh();
}

async function done() {
  await listings.markDone(listingId);
  await refresh();
}

async function submitReview() {
  await listings.createReview(listingId, {
    rating: rating.value,
    comment: comment.value || undefined,
  });
  comment.value = "";
}

const reportOpen = ref(false);
const reportReason = ref("");
const reportIncludeChat = ref(false);
const reportTarget = ref("owner");
const reportMessage = ref("");

async function submitReport() {
  reportMessage.value = "";
  try {
    let reportedId = listings.detail?.customer?.id;
    if (reportTarget.value === "technician") {
      reportedId = listings.detail?.acceptedTechnicianId;
    }
    if (!reportedId) throw new Error("No target selected for report");

    await listings.createReport(listingId, { reason: reportReason.value, includeChat: reportIncludeChat.value, reportedId });
    reportMessage.value = "Report submitted";
    reportOpen.value = false;
    reportReason.value = "";
    reportIncludeChat.value = false;
    reportTarget.value = "owner";
  } catch (e) {
    reportMessage.value = e?.response?.data?.error || e?.message || "Failed to submit report";
  }
}

onMounted(refresh);
</script>
