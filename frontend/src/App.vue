<template>
  <div class="min-h-screen bg-gray-50 text-gray-900">
    <div class="max-w-4xl mx-auto p-4">
      <nav class="flex items-center justify-between py-3">
        <div class="font-semibold">FixFinder</div>
        <div class="flex gap-3">
          <RouterLink class="underline" to="/dashboard">Dashboard</RouterLink>
          <RouterLink class="underline" to="/login">Login</RouterLink>
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
