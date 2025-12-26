<template>
  <div class="bg-white rounded-xl shadow p-6">
    <h1 class="text-xl font-semibold mb-4">Admin — Reports</h1>

    <div class="controls mb-3">
      <button class="border rounded px-3 py-2" @click="loadReports" :disabled="loading">Refresh</button>
      <span v-if="message" class="msg">{{ message }}</span>
    </div>

    <table v-if="reports.length">
      <thead><tr><th>Listing</th><th>Reporter</th><th>Reported</th><th>Reason</th><th>When</th><th>Actions</th></tr></thead>
      <tbody>
        <tr v-for="r in reports" :key="r.id">
          <td>{{ r.listing?.title || '—' }}</td>
          <td>{{ r.reporter?.email }}</td>
          <td>{{ r.reported?.email }}</td>
          <td>{{ r.reason }}</td>
          <td>{{ new Date(r.createdAt).toLocaleString() }}</td>
          <td>
            <button class="border rounded px-3 py-1" @click="deleteListing(r.listingId)" :disabled="loading || !r.listingId">Delete Listing</button>
          </td>
        </tr>
      </tbody>
    </table>

    <p v-else class="text-gray-600">No reports.</p>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { api } from '../lib/api';

const reports = ref([]);
const loading = ref(false);
const message = ref('');

async function loadReports() {
  loading.value = true; message.value = '';
  try { const { data } = await api.get('/admin/reports'); reports.value = data.reports || []; } catch (err) { message.value = 'Failed to load reports'; }
  finally { loading.value = false; }
}

async function deleteListing(id) {
  if (!id) return;
  if (!confirm('Delete listing #' + id + '?')) return;
  loading.value = true;
  try { await api.delete(`/admin/listings/${id}`); message.value = 'Listing deleted'; await loadReports(); } catch (err) { message.value = 'Failed to delete listing'; }
  finally { loading.value = false; }
}

onMounted(loadReports);
</script>

<style scoped>
.admin { padding: 1rem; }
.controls { margin-bottom: 0.5rem; }
.msg { margin-left: 1rem; color: #066; }
table { width: 100%; border-collapse: collapse; }
th, td { text-align: left; border-bottom: 1px solid #eee; padding: 0.5rem; }
</style>
