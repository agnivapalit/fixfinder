<template>
  <div class="bg-white rounded-xl shadow p-6">
    <h1 class="text-xl font-semibold mb-4">Admin — Technicians</h1>

    <div class="controls mb-3">
      <button class="border rounded px-3 py-2" @click="loadPending" :disabled="loading">Refresh</button>
      <span v-if="message" class="msg">{{ message }}</span>
    </div>

    <table v-if="techs.length">
      <thead>
        <tr><th>Email</th><th>Actions</th></tr>
      </thead>
      <tbody>
        <tr v-for="t in techs" :key="t.user.id">
          <td>{{ t.user.email }}</td>
          <td>
            <button class="border rounded px-3 py-1" @click="viewDetails(t.user.id)" :disabled="loading">View</button>
            <button class="border rounded px-3 py-1" @click="approve(t.user.id)" :disabled="loading">Approve</button>
            <button class="border rounded px-3 py-1" @click="reject(t.user.id)" :disabled="loading">Reject</button>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Details modal -->
    <div v-if="selectedTech" class="modal fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center">
      <div class="bg-white p-6 rounded shadow max-w-xl w-full">
        <h2 class="text-lg font-semibold mb-3">Technician signup details</h2>
        <div class="mb-2"><strong>Email:</strong> {{ selectedTech.user.email }}</div>
        <div v-if="selectedTech.user.phone" class="mb-2"><strong>Phone:</strong> {{ selectedTech.user.phone }}</div>
        <div class="mb-2"><strong>Workplace:</strong> {{ selectedTech.workplace }}</div>
        <div class="mb-2"><strong>Experience (years):</strong> {{ selectedTech.experienceYears }}</div>
        <div v-if="parsedExperiences.length" class="mb-2"><strong>Experiences:</strong>
          <ul class="list-disc pl-6">
            <li v-for="(e, i) in parsedExperiences" :key="i">{{ e }}</li>
          </ul>
        </div>
        <div class="mb-2"><strong>Categories:</strong> <span v-for="c in parsedCategories" :key="c" class="mr-2 inline-block rounded bg-gray-100 px-2">{{ c }}</span></div>
        <div class="mb-2"><strong>Certifications:</strong> <span v-if="parsedCerts.length">{{ parsedCerts.join(', ') }}</span><span v-else>None</span></div>
        <div class="mb-4 text-sm text-gray-600"><strong>Requested:</strong> {{ new Date(selectedTech.createdAt).toLocaleString() }}</div>

        <div class="flex justify-end">
          <button class="border rounded px-3 py-1 mr-2" @click="closeDetails">Close</button>
          <button class="border rounded px-3 py-1 bg-green-100" @click="approve(selectedTech.userId)" :disabled="loading">Approve</button>
          <button class="border rounded px-3 py-1 bg-red-100" @click="reject(selectedTech.userId)" :disabled="loading">Reject</button>
        </div>
      </div>
    </div>

    <p v-else class="text-gray-600">No pending technicians.</p>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { api } from '../lib/api';

const techs = ref([]);
const loading = ref(false);
const message = ref('');
const selectedTech = ref(null);

const parsedCategories = computed(() => {
  if (!selectedTech.value) return [];
  try { return JSON.parse(selectedTech.value.categories || '[]'); } catch { return []; }
});
const parsedExperiences = computed(() => {
  if (!selectedTech.value) return [];
  try { return JSON.parse(selectedTech.value.experiences || '[]'); } catch { return []; }
});
const parsedCerts = computed(() => {
  if (!selectedTech.value) return [];
  try { return JSON.parse(selectedTech.value.certifications || '[]'); } catch { return []; }
});

async function loadPending() {
  loading.value = true;
  message.value = '';
  try {
    const { data } = await api.get('/admin/technicians/pending');
    techs.value = data.techs || [];
  } catch (err) {
    message.value = err?.response?.data?.error || 'Failed to load';
  } finally { loading.value = false; }
}

async function viewDetails(userId) {
  loading.value = true;
  selectedTech.value = null;
  message.value = '';
  try {
    const { data } = await api.get(`/admin/technicians/${userId}`);
    selectedTech.value = data.tech;
  } catch (err) {
    message.value = err?.response?.data?.error || 'Failed to load details';
  } finally { loading.value = false; }
}

function closeDetails() {
  selectedTech.value = null;
}

async function approve(userId) {
  loading.value = true;
  try {
    await api.post(`/admin/technicians/${userId}/approve`);
    message.value = 'Technician approved';
    if (selectedTech.value && selectedTech.value.userId === userId) selectedTech.value = null;
    await loadPending();
  } catch (err) {
    message.value = 'Failed to approve';
  } finally { loading.value = false; }
}

async function reject(userId) {
  loading.value = true;
  try {
    await api.post(`/admin/technicians/${userId}/reject`);
    message.value = 'Technician rejected';
    if (selectedTech.value && selectedTech.value.userId === userId) selectedTech.value = null;
    await loadPending();
  } catch (err) {
    message.value = 'Failed to reject';
  } finally { loading.value = false; }
}

onMounted(loadPending);
</script>

<style scoped>
.admin { padding: 1rem; }
.controls { margin-bottom: 0.5rem; }
.msg { margin-left: 1rem; color: #066; }
table { width: 100%; border-collapse: collapse; }
th, td { text-align: left; border-bottom: 1px solid #eee; padding: 0.5rem; }
button { margin-right: 0.5rem; }
</style>
