<template>
  <div class="min-h-screen bg-gray-50 text-gray-900 font-sans">
    <nav v-if="!isAuthPage" class="fixed w-full z-50 top-0 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div class="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        
        <RouterLink to="/" class="flex items-center gap-2 group">
          <div class="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold group-hover:bg-indigo-700 transition">
            F
          </div>
          <span class="text-xl font-extrabold tracking-tight text-gray-900">FixFinder</span>
        </RouterLink>

        <div v-if="auth.user?.role == 'CUSTOMER' || auth.user?.role == 'TECHNICIAN' || auth.user?.role == 'ADMIN'" class="hidden md:flex items-center gap-6">
          <RouterLink class="text-sm font-medium text-gray-600 hover:text-indigo-600 transition" to="/dashboard">Dashboard</RouterLink>
          <RouterLink class="text-sm font-medium text-gray-600 hover:text-indigo-600 transition" to="/browse">Browse</RouterLink>
          
          <div v-if="auth.user?.role === 'ADMIN'" class="relative">
            <button @click="adminOpen = !adminOpen" class="text-sm font-medium text-gray-600 hover:text-indigo-600 flex items-center gap-1 transition">
              Admin <span class="text-[10px] transition-transform" :class="{'rotate-180': adminOpen}">▼</span>
            </button>
            <div v-if="adminOpen" class="absolute right-0 mt-3 w-48 bg-white border border-gray-100 rounded-xl shadow-xl p-2 py-3 z-50">
              <RouterLink @click="adminOpen = false" class="block px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg" to="/admin/technicians">Technicians</RouterLink>
              <RouterLink @click="adminOpen = false" class="block px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg" to="/admin/activity">Activity</RouterLink>
              <RouterLink @click="adminOpen = false" class="block px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg" to="/admin/reports">Reports</RouterLink>
              <RouterLink @click="adminOpen = false" class="block px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg" to="/admin/bans">Bans</RouterLink>
            </div>
          </div>

          <RouterLink v-if="auth.user?.role === 'CUSTOMER'" class="text-sm font-medium text-gray-600 hover:text-indigo-600 transition" to="/my-listings">My Listings</RouterLink>
          <RouterLink v-if="auth.user?.role === 'TECHNICIAN'" class="text-sm font-medium text-gray-600 hover:text-indigo-600 transition" to="/favourites">Favourites</RouterLink>    
          <RouterLink v-if="auth.user?.role === 'TECHNICIAN' || auth.user?.role === 'CUSTOMER'" class="text-sm font-medium text-gray-600 hover:text-indigo-600 transition" to="/chat">Messages</RouterLink>
          <RouterLink v-if="auth.user?.role === 'TECHNICIAN'" class="text-sm font-medium text-gray-600 hover:text-indigo-600 transition" to="/tech/jobs">Jobs</RouterLink>
          <RouterLink v-if="auth.user?.role === 'TECHNICIAN'" class="text-sm font-medium text-gray-600 hover:text-indigo-600 transition" to="/tech/reviews">My Reviews</RouterLink> 
        </div>

        <div class="flex items-center gap-4">
          <div v-if="!auth.token" class="flex items-center gap-3">
            <RouterLink class="text-sm font-bold text-gray-700 hover:text-indigo-600 transition" to="/login">Login</RouterLink>
            <RouterLink class="px-5 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-lg hover:bg-indigo-700 transition shadow-md shadow-indigo-100" to="/signup">Sign up</RouterLink>
          </div>

          <div v-else class="flex items-center gap-4 pl-4 border-l border-gray-100">
            <div class="hidden lg:flex flex-col items-end">
              <span class="text-xs font-bold text-gray-900 leading-none">{{ auth.user?.email.split('@')[0] }}</span>
              <span class="text-[10px] text-indigo-600 font-medium uppercase tracking-tighter">{{ auth.user?.role }}</span>
            </div>
            <RouterLink class="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-indigo-100 transition group" to="/profile">
              <span class="text-gray-600 group-hover:text-indigo-600">👤</span>
            </RouterLink>
            <button @click="handleLogout" class="p-2 text-gray-400 hover:text-red-500 transition" title="Logout">
              <span class="text-lg">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </nav>

    <div v-if="isAuthPage && route.path !== '/'" class="max-w-7xl mx-auto px-6 py-8 flex items-center justify-between">
      <RouterLink to="/" class="text-2xl font-black text-indigo-600 tracking-tighter">FixFinder</RouterLink>
      <div class="flex items-center gap-6">
        <RouterLink class="text-sm font-bold text-gray-600 hover:text-indigo-600 transition" to="/login">Login</RouterLink>
        <RouterLink class="text-sm font-bold text-gray-600 hover:text-indigo-600 transition" to="/signup">Sign up</RouterLink>
      </div>
    </div>

    <main :class="{'pt-20': !isAuthPage}">
      <div :class="isAuthPage ? 'w-full' : 'max-w-7xl mx-auto px-6 py-8'">
        <RouterView />
      </div>
    </main>
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
  router.push("/");
};

onMounted(() => auth.init());
</script>