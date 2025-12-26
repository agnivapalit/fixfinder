<template>
  <div class="max-w-2xl mx-auto bg-white rounded-xl shadow p-6">
    <h1 class="text-2xl font-semibold mb-6">Profile Management</h1>

    <p v-if="successMessage" class="text-green-600 mb-4">{{ successMessage }}</p>
    <p v-if="error" class="text-red-600 mb-4">{{ error }}</p>

    <form class="space-y-4" @submit.prevent="updateProfile">
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium mb-1">First Name</label>
          <input 
            class="w-full border rounded p-2" 
            v-model="formData.firstName" 
            placeholder="First name"
            :disabled="loading"
          />
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">Last Name</label>
          <input 
            class="w-full border rounded p-2" 
            v-model="formData.lastName" 
            placeholder="Last name"
            :disabled="loading"
          />
        </div>
      </div>

      <div>
        <label class="block text-sm font-medium mb-1">Email</label>
        <input 
          class="w-full border rounded p-2 bg-gray-100 cursor-not-allowed" 
          :value="user?.email"
          disabled
        />
        <p class="text-xs text-gray-500 mt-1">Email cannot be changed</p>
      </div>

      <div>
        <label class="block text-sm font-medium mb-1">Phone</label>
        <input 
          class="w-full border rounded p-2" 
          v-model="formData.phone" 
          placeholder="Phone number"
          :disabled="loading"
        />
      </div>

      <div class="border-t pt-4">
        <h2 class="text-lg font-semibold mb-2">Account Information</h2>
        <div class="space-y-2 text-sm">
          <p><span class="font-medium">Role:</span> {{ user?.role }}</p>
          <p><span class="font-medium">Email Verified:</span> {{ user?.emailVerified ? "Yes" : "No" }}</p>
          <p><span class="font-medium">Phone Verified:</span> {{ user?.phoneVerified ? "Yes" : "No" }}</p>
        </div>
      </div>

      <button 
        type="submit" 
        class="w-full bg-black text-white rounded p-2 hover:bg-gray-800 disabled:bg-gray-400"
        :disabled="loading"
      >
        {{ loading ? "Saving..." : "Save Changes" }}
      </button>
    </form>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useAuthStore } from "../stores/auth";
import { api } from "../lib/api";

const auth = useAuthStore();
const user = ref(null);
const loading = ref(false);
const error = ref(null);
const successMessage = ref(null);

const formData = ref({
  firstName: "",
  lastName: "",
  phone: "",
});

onMounted(async () => {
  try {
    const res = await api.get("/me");
    user.value = res.data.user;
    
    // Initialize form with current data
    formData.value = {
      firstName: user.value?.firstName || "",
      lastName: user.value?.lastName || "",
      phone: user.value?.phone || "",
    };
  } catch (err) {
    error.value = "Failed to load profile";
  }
});

async function updateProfile() {
  error.value = null;
  successMessage.value = null;
  loading.value = true;

  try {
    const res = await api.patch("/me", {
      firstName: formData.value.firstName || undefined,
      lastName: formData.value.lastName || undefined,
      phone: formData.value.phone || undefined,
    });

    user.value = res.data.user;
    successMessage.value = "Profile updated successfully!";
    
    // Clear success message after 3 seconds
    setTimeout(() => {
      successMessage.value = null;
    }, 3000);
  } catch (err) {
    error.value = err?.response?.data?.error || "Failed to update profile";
  } finally {
    loading.value = false;
  }
}
</script>
