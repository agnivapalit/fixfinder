<template>
  <div class="min-h-screen bg-gray-50 text-gray-900">
    <div class="max-w-4xl mx-auto p-4">
      <nav class="flex items-center justify-between py-3">
        <div class="font-semibold">FixFinder</div>

        <div class="flex items-center gap-3">
          <RouterLink class="underline" to="/dashboard">Dashboard</RouterLink>
          <RouterLink class="underline" to="/browse">Browse</RouterLink>
          <RouterLink v-if="auth.user?.role === 'CUSTOMER'" class="underline" to="/my-listings">My Listings</RouterLink>
          <RouterLink v-if="!auth.token" class="underline" to="/login">Login</RouterLink>
          <RouterLink v-if="auth.user?.role === 'TECHNICIAN'" class="underline" to="/favourites">Favourites</RouterLink>
          <RouterLink v-if="auth.token" class="underline" to="/chat">Messages</RouterLink>

          <div v-else class="flex items-center gap-2">
            <span class="text-sm text-gray-600">{{ auth.user?.email }}</span>
            <button class="border rounded px-3 py-1" @click="auth.logout()">Logout</button>
          </div>
        </div>
      </nav>

      <RouterView />
    </div>
  </div>
</template>

<script setup>
import { onMounted } from "vue";
import { useAuthStore } from "./stores/auth";

const auth = useAuthStore();
onMounted(() => auth.init());
</script>
