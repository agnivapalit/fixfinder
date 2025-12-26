<template>
  <div class="bg-white rounded-xl shadow p-6 admin-box">
    <h1 class="text-xl font-semibold mb-4">Admin — Reports</h1>

    <div class="controls mb-3">
      <button class="border rounded px-3 py-2" @click="loadReports" :disabled="loading">Refresh</button>
      <span v-if="message" class="msg">{{ message }}</span>
    </div>

    <table v-if="reports.length">
      <thead><tr><th>Listing</th><th>Reporter</th><th>Reported</th><th>Include Chat</th><th>Reason</th><th>When</th><th>Actions</th></tr></thead>
      <tbody>
        <template v-for="r in reports" :key="r.id">
          <tr
            @click="selectReport(r.id)"
            :class="{ 'selected-row': selectedReportId === r.id }"
            class="selectable-row"
          >
            <td>{{ r.listing?.title || '—' }}</td>
            <td>{{ r.reporter?.email }}</td>
            <td>{{ r.reported?.email }}</td>
            <td>{{ r.includeChat ? 'Yes' : 'No' }}</td>
            <td>
              <span v-if="selectedReportId === r.id" class="reason-inline">{{ r.reason }}</span>
              <span v-else class="text-muted">Click to expand</span>
            </td>
            <td>{{ new Date(r.createdAt).toLocaleString() }}</td>
            <td>
              <div class="flex gap-2">
                <template v-if="selectedReportId === r.id">
                  <button v-if="r.includeChat" class="border rounded px-3 py-1" @click.stop="viewChat(r.id)">View Chat</button>
                  <button class="border rounded px-3 py-1" @click.stop="deleteListing(r.listingId)" :disabled="loading || !r.listingId">Delete Listing</button>
                </template>
                <template v-else>
                  <span class="text-gray-400">Click to expand</span>
                </template>
              </div>
            </td>
          </tr>

          <tr v-if="selectedReportId === r.id" class="expanded-row">
            <td :colspan="7">
              <div class="expanded-content">
                <div class="mb-2"><strong>Reason:</strong> {{ r.reason }}</div>

                <div class="mb-3">
                  <button v-if="r.includeChat" class="border rounded px-3 py-1 mr-2" @click.stop="viewChat(r.id)">View Chat</button>
                  <button class="border rounded px-3 py-1" @click.stop="deleteListing(r.listingId)" :disabled="loading || !r.listingId">Delete Listing</button>
                </div>

                <div v-if="chatOpen && activeChatReportId === r.id" class="border rounded p-3 bg-gray-50">
                  <div class="flex items-center justify-between mb-2">
                    <div class="font-semibold">Report Chat</div>
                    <div>
                      <button class="border rounded px-3 py-1 mr-2" @click.stop="closeChat">Close</button>
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

              </div>
            </td>
          </tr>
        </template>
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

const chatOpen = ref(false);
const chatLoading = ref(false);
const chatThreads = ref([]);
const chatError = ref('');

const selectedReportId = ref(null);
const activeChatReportId = ref(null);
function selectReport(id) {
  selectedReportId.value = selectedReportId.value === id ? null : id;
  // if we collapsed the selection, clear chat state too
  if (selectedReportId.value === null) {
    activeChatReportId.value = null;
    chatOpen.value = false;
    chatThreads.value = [];
    chatError.value = '';
  }
}

async function loadReports() {
  loading.value = true; message.value = '';
  try { const { data } = await api.get('/admin/reports'); reports.value = data.reports || []; } catch (err) { message.value = 'Failed to load reports'; }
  finally { loading.value = false; }
}

async function deleteListing(id) {
  if (!id) return;
  if (!confirm('Delete listing #' + id + '?')) return;
  loading.value = true;
  try { await api.delete(`/admin/listings/${id}`); message.value = 'Listing deleted'; await loadReports(); selectedReportId.value = null; activeChatReportId.value = null; chatOpen.value = false; chatThreads.value = []; } catch (err) { message.value = 'Failed to delete listing'; }
  finally { loading.value = false; }
}

async function viewChat(reportId) {
  if (!reportId) return;
  chatOpen.value = true;
  activeChatReportId.value = reportId;
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

function closeChat() {
  chatOpen.value = false;
  activeChatReportId.value = null;
  chatThreads.value = [];
  chatError.value = '';
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
.admin-box { max-width: 1100px; margin: 0 auto; }

table { width: 100%; border-collapse: collapse; }
th, td { text-align: left; border-bottom: 1px solid #eee; padding: 0.5rem; }

.selectable-row { cursor: pointer; }
.selected-row { background-color: #f9fafb; }
.text-muted { color: #9CA3AF; }

.expanded-row td { background-color: #f8fafc; padding-top: 1rem; padding-bottom: 1rem; }
.expanded-content { max-width: 100%; }
.reason-inline { display: inline-block; max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

</style>
