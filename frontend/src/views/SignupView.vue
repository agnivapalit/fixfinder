<template>
  <div class="max-w-md mx-auto bg-white rounded-xl shadow p-6">
    <h1 class="text-xl font-semibold mb-4">Sign up</h1>

    <p v-if="error" class="text-red-600 mb-3">{{ error }}</p>

    <form class="space-y-3" @submit.prevent="submit">
      <input class="w-full border rounded p-2" v-model="email" placeholder="Email" />
      <input class="w-full border rounded p-2" type="password" v-model="password" placeholder="Password" />
      <input class="w-full border rounded p-2" v-model="phone" placeholder="Phone (mock verified)" />

      <select class="w-full border rounded p-2" v-model="role">
        <option value="CUSTOMER">Customer</option>
        <option value="TECHNICIAN">Technician</option>
      </select>

      <!-- Technician fields -->
      <div v-if="role === 'TECHNICIAN'" class="space-y-2 border rounded p-3">
        <input class="w-full border rounded p-2" v-model="certifications" placeholder="Certifications (cloud storage link)" />
        <input class="w-full border rounded p-2" type="number" min="0" v-model.number="experience" placeholder="Experience (years)" />

        <div class="flex items-center gap-2">
          <label class="text-sm">Number of experience entries</label>
          <select class="border rounded p-2" v-model.number="experienceCount">
            <option v-for="n in 6" :key="n" :value="n-1">{{ n-1 }}</option>
          </select>
        </div>

        <div class="space-y-2">
          <div v-for="(exp, idx) in experiences" :key="idx">
            <input class="w-full border rounded p-2" v-model="experiences[idx]" :placeholder="`Experience #${idx+1}`" />
          </div>
        </div>

        <select class="w-full border rounded p-2" v-model="workplace">
          <option value="IN_SHOP">In shop</option>
          <option value="FLEXIBLE">Flexible</option>
        </select>

        <p class="text-xs text-gray-600">
          Technician accounts require admin approval.
        </p>
      </div>

      <button class="w-full bg-black text-white rounded p-2">
        Create account
      </button>
    </form>

    <RouterLink class="block text-sm underline mt-4" to="/login">
      Already have an account? Login
    </RouterLink>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { api } from "../lib/api";
import { useRouter } from "vue-router";

const router = useRouter();

const email = ref("");
const password = ref("");
const phone = ref("");
const role = ref("CUSTOMER");

const certifications = ref("");
const experience = ref();
const workplace = ref("FLEXIBLE");
const experienceCount = ref(0);
const experiences = ref([]);

// keep experiences array in sync with selected count
import { watch } from "vue";
watch(experienceCount, (n) => {
  const arr = experiences.value;
  const target = Math.max(0, Math.floor(n));
  if (arr.length > target) {
    experiences.value = arr.slice(0, target);
  } else {
    for (let i = arr.length; i < target; i++) arr.push("");
    experiences.value = arr;
  }
});

const error = ref(null);

async function submit() {
  error.value = null;
  try {
    await api.post("/auth/signup", {
      email: email.value,
      password: password.value,
      phone: phone.value,
      role: role.value,
      certifications: certifications.value,
      experience: experience.value,
      workplace: workplace.value,
      experiences: role.value === "TECHNICIAN" ? experiences.value.filter(Boolean) : undefined,
    });

    if (role.value === "TECHNICIAN") {
      router.push("/login?pending=1");
    } else {
      router.push("/login");
    }
  } catch (e) {
    error.value = e?.response?.data?.error || "Signup failed";
  }
}
</script>
