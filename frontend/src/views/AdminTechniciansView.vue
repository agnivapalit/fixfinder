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
            <button class="border rounded px-3 py-1" @click="approve(t.user.id)" :disabled="loading">Approve</button>
            <button class="border rounded px-3 py-1" @click="reject(t.user.id)" :disabled="loading">Reject</button>
          </td>
        </tr>
      </tbody>
    </table>

    <p v-else class="text-gray-600">No pending technicians.</p>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { api } from '../lib/api';

const techs = ref([]);
const loading = ref(false);
const message = ref('');

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

async function approve(userId) {
  loading.value = true;
  try {
    await api.post(`/admin/technicians/${userId}/approve`);
    message.value = 'Technician approved';
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
