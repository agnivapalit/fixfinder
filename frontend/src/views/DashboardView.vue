<template>
  <div class="bg-white rounded-xl shadow p-6">
    <h1 class="text-xl font-semibold mb-4">Dashboard</h1>

    <div v-if="!auth.user" class="space-y-3">
      <p>You are not logged in.</p>
      <RouterLink class="underline" to="/login">Go to login</RouterLink>
    </div>

    <div v-else class="space-y-2">
      <div><span class="font-semibold">Email:</span> {{ auth.user.email }}</div>
      <div><span class="font-semibold">Role:</span> {{ auth.user.role }}</div>
      <div><span class="font-semibold">Email verified:</span> {{ auth.user.emailVerified }}</div>
      <div><span class="font-semibold">Phone verified:</span> {{ auth.user.phoneVerified }}</div>

      <div v-if="auth.user.role === 'TECHNICIAN'">
        <span class="font-semibold">Approved:</span>
        {{ auth.user.technicianProfile?.approved }}
      </div>

      <button class="mt-4 border rounded px-3 py-2" @click="auth.logout()">Logout</button>
    </div>
  </div>
</template>

<script setup>
import { useAuthStore } from "../stores/auth";
const auth = useAuthStore();
</script>
