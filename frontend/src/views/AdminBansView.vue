<template>
  <div class="bg-white rounded-xl shadow p-6">
    <h1 class="text-xl font-semibold mb-4">Admin — Bans</h1>

    <form @submit.prevent="createBan" class="ban-form mb-4">
      <div class="grid grid-cols-3 gap-3 mb-3">
        <div>
          <label class="text-sm">Email</label>
          <input class="w-full border rounded p-2" v-model="email" placeholder="user@example.com" />
        </div>
        <div>
          <label class="text-sm">Phone</label>
          <input class="w-full border rounded p-2" v-model="phone" placeholder="+1..." />
        </div>
        <div>
          <label class="text-sm">Reason</label>
          <input class="w-full border rounded p-2" v-model="reason" placeholder="Reason for ban" />
        </div>
      </div>

      <button class="bg-black text-white rounded px-3 py-2" type="submit" :disabled="loading">Ban</button>
      <span v-if="message" class="msg">{{ message }}</span>
    </form>

    <h2 class="text-lg font-semibold mb-2">Existing Bans</h2>
    <table v-if="bans.length">
      <thead><tr><th>Email</th><th>Phone</th><th>Reason</th><th>When</th><th>Actions</th></tr></thead>
      <tbody>
        <tr v-for="b in bans" :key="b.id">
          <td>{{ b.email }}</td>
          <td>{{ b.phone }}</td>
          <td>{{ b.reason }}</td>
          <td>{{ new Date(b.createdAt).toLocaleString() }}</td>
          <td><button class="border rounded px-3 py-1" @click="removeBan(b.id)" :disabled="loading">Remove</button></td>
        </tr>
      </tbody>
    </table>
    <p v-else class="text-gray-600">No bans.</p>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { api } from '../lib/api';

const email = ref('');
const phone = ref('');
const reason = ref('');
const bans = ref([]);
const loading = ref(false);
const message = ref('');

async function loadBans() {
  loading.value = true; message.value = '';
  try { const { data } = await api.get('/admin/bans'); bans.value = data.bans || []; } catch (err) { message.value = 'Failed to load bans'; }
  finally { loading.value = false; }
}

async function createBan() {
  loading.value = true; message.value = '';
  try {
    await api.post('/admin/ban', { email: email.value, phone: phone.value, reason: reason.value });
    message.value = 'User banned';
    email.value = phone.value = reason.value = '';
    await loadBans();
  } catch (err) { message.value = 'Failed to ban'; }
  finally { loading.value = false; }
}

async function removeBan(id) {
  if (!confirm('Remove ban #' + id + '?')) return;
  loading.value = true; message.value = '';
  try { await api.post('/admin/bans/remove', { id }); message.value = 'Ban removed'; await loadBans(); } catch (err) { message.value = 'Failed to remove ban'; }
  finally { loading.value = false; }
}

onMounted(loadBans);
</script>

<style scoped>
.admin { padding: 1rem; }
.ban-form div { margin-bottom: 0.5rem; }
.msg { margin-left: 1rem; color: #066; }
table { width: 100%; border-collapse: collapse; }
th, td { text-align: left; border-bottom: 1px solid #eee; padding: 0.5rem; }
</style>
