<template>
  <div class="bg-white rounded-xl shadow p-6 max-w-md">
    <h1 class="text-xl font-semibold mb-4">Login</h1>

    <form class="space-y-3" @submit.prevent="submit">
      <input class="w-full border rounded p-2" v-model="email" type="email" placeholder="Email" required />
      <input class="w-full border rounded p-2" v-model="password" type="password" placeholder="Password" required />

      <button class="w-full bg-black text-white rounded p-2 disabled:opacity-50" :disabled="auth.loading">
        {{ auth.loading ? "Logging in..." : "Login" }}
      </button>

      <p v-if="auth.error" class="text-red-600">{{ auth.error }}</p>
    </form>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../stores/auth";

const auth = useAuthStore();
const router = useRouter();

const email = ref("");
const password = ref("");

async function submit() {
  await auth.login(email.value, password.value);
  if (auth.user) router.push("/dashboard");
}
</script>
