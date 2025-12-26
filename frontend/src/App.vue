<template>
  <div class="min-h-screen bg-gray-50 text-gray-900">
    <div class="max-w-4xl mx-auto p-4">
      <nav v-if="!isAuthPage" class="flex items-center justify-between py-3">
        <div class="font-semibold">FixFinder</div>

        <div class="flex items-center gap-3">
          <RouterLink class="underline" to="/dashboard">Dashboard</RouterLink>
          <RouterLink class="underline" to="/browse">Browse</RouterLink>
          <div v-if="auth.user?.role === 'ADMIN'" class="relative">
            <button @click="adminOpen = !adminOpen" class="underline">Admin ▾</button>
            <div v-if="adminOpen" class="absolute right-0 mt-2 bg-white border rounded shadow p-2">
              <RouterLink class="block px-3 py-1 hover:bg-gray-100" to="/admin/technicians">Technicians</RouterLink>
              <RouterLink class="block px-3 py-1 hover:bg-gray-100" to="/admin/activity">Activity</RouterLink>
              <RouterLink class="block px-3 py-1 hover:bg-gray-100" to="/admin/reports">Reports</RouterLink>
              <RouterLink class="block px-3 py-1 hover:bg-gray-100" to="/admin/bans">Bans</RouterLink>
            </div>
          </div>
          <RouterLink v-if="auth.user?.role === 'CUSTOMER'" class="underline" to="/my-listings">My Listings</RouterLink>

          <div v-if="!auth.token" class="flex items-center gap-2">
            <RouterLink class="underline" to="/login">Login</RouterLink>
            <RouterLink class="underline" to="/signup">Sign up</RouterLink>
          </div>

          <RouterLink v-if="auth.user?.role === 'TECHNICIAN'" class="underline" to="/favourites">Favourites</RouterLink>    
          <RouterLink v-if="auth.user?.role === 'TECHNICIAN' || auth.user?.role === 'CUSTOMER'" class="underline" to="/chat">Messages</RouterLink>
          <RouterLink v-if="auth.user?.role === 'TECHNICIAN'" class="underline" to="/tech/jobs">Jobs</RouterLink>
          <RouterLink v-if="auth.user?.role === 'TECHNICIAN'" class="underline" to="/tech/reviews">My Reviews</RouterLink> 

          <div v-else class="flex items-center gap-2">
            <span class="text-sm text-gray-600">{{ auth.user?.email }}</span>
            <RouterLink class="underline" to="/profile">Profile</RouterLink>
            <button class="border rounded px-3 py-1" @click="handleLogout">Logout</button>
          </div>
        </div>
      </nav>

      <div v-if="isAuthPage" class="flex items-center justify-between py-3 mb-8">
        <div class="font-semibold">FixFinder</div>
        <div class="flex items-center gap-3">
          <RouterLink class="underline" to="/login">Login</RouterLink>
          <RouterLink class="underline" to="/signup">Sign up</RouterLink>
        </div>
      </div>

      <RouterView />
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref, computed } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useAuthStore } from "./stores/auth";

const auth = useAuthStore();
const router = useRouter();
const route = useRoute();
const adminOpen = ref(false);

const isAuthPage = computed(() => {
  return route.path === "/login" || route.path === "/signup";
});

const handleLogout = async () => {
  await auth.logout();
  router.push("/login");
};

onMounted(() => auth.init());
</script>
