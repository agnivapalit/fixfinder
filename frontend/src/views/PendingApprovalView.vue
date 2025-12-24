<template>
  <div class="bg-white rounded-xl shadow p-6">
    <h1 class="text-xl font-semibold mb-2">Pending approval</h1>
    <p class="text-gray-700">
      Your technician account is waiting for admin approval. Try again later.
    </p>

    <button class="mt-4 border rounded px-3 py-2" @click="auth.logout()">
      Logout
    </button>
  </div>
</template>

<script setup>
import { useAuthStore } from "../stores/auth";
const auth = useAuthStore();
</script>
