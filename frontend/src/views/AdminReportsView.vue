<template>
  <div class="bg-white rounded-xl shadow p-6">
    <h1 class="text-xl font-semibold mb-4">Admin — Reports</h1>

    <div class="controls mb-3">
      <button class="border rounded px-3 py-2" @click="loadReports" :disabled="loading">Refresh</button>
      <span v-if="message" class="msg">{{ message }}</span>
    </div>

    <table v-if="reports.length">
      <thead><tr><th>Listing</th><th>Reporter</th><th>Reported</th><th>Include Chat</th><th>Reason</th><th>When</th><th>Actions</th></tr></thead>
      <tbody>
        <tr v-for="r in reports" :key="r.id">
          <td>{{ r.listing?.title || '—' }}</td>
          <td>{{ r.reporter?.email }}</td>
          <td>{{ r.reported?.email }}</td>
          <td>{{ r.includeChat ? 'Yes' : 'No' }}</td>
          <td>{{ r.reason }}</td>
          <td>{{ new Date(r.createdAt).toLocaleString() }}</td>
          <td>
            <div class="flex gap-2">
              <button v-if="r.includeChat" class="border rounded px-3 py-1" @click="viewChat(r.id)">View Chat</button>
              <button class="border rounded px-3 py-1" @click="deleteListing(r.listingId)" :disabled="loading || !r.listingId">Delete Listing</button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>

    <div v-if="chatOpen" class="border rounded p-4 mt-3 bg-gray-50">
      <div class="flex items-center justify-between mb-2">
        <div class="font-semibold">Report Chat</div>
        <div>
          <button class="border rounded px-3 py-1 mr-2" @click="chatOpen = false">Close</button>
          <button v-if="chatThreads.length" class="border rounded px-3 py-1" @click="copyChat">Copy</button>
        </div>
      </div>

      <div v-if="chatLoading">Loading chat...</div>
      <div v-if="chatError" class="text-red-600">{{ chatError }}</div>

      <div v-for="t in chatThreads" :key="t.threadId" class="mb-4">
        <div class="text-sm text-gray-600">Thread: {{ t.threadId }} — Customer: {{ t.customerId }} • Technician: {{ t.technicianId }}</div>
        <div class="mt-2 space-y-2">
          <div v-for="m in t.messages" :key="m.id" class="p-2 bg-white rounded">
            <div class="text-xs text-gray-600">{{ m.sender?.email }} • {{ new Date(m.createdAt).toLocaleString() }}</div>
            <div class="mt-1 whitespace-pre-wrap">{{ m.body }}</div>
          </div>
        </div>
      </div>
    </div>

    <p v-else class="text-gray-600">No reports.</p>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { api } from '../lib/api';

const reports = ref([]);
const loading = ref(false);
const message = ref('');

const chatOpen = ref(false);
const chatLoading = ref(false);
const chatThreads = ref([]);
const chatError = ref('');

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

async function viewChat(reportId) {
  if (!reportId) return;
  chatOpen.value = true;
  chatLoading.value = true;
  chatError.value = '';
  chatThreads.value = [];
  try {
    const { data } = await api.get(`/admin/reports/${reportId}/chat`);
    chatThreads.value = data.threads || [];
  } catch (err) {
    chatError.value = err?.response?.data?.error || 'Failed to load chat';
  } finally {
    chatLoading.value = false;
  }
}

function copyChat() {
  let txt = '';
  for (const t of chatThreads.value) {
    txt += `Thread ${t.threadId}\n`;
    for (const m of t.messages) {
      txt += `${m.sender?.email} (${new Date(m.createdAt).toLocaleString()}): ${m.body}\n`;
    }
    txt += '\n';
  }
  navigator.clipboard?.writeText(txt);
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
