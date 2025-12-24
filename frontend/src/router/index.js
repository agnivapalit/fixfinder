import { createRouter, createWebHistory } from "vue-router";
import LoginView from "../views/LoginView.vue";
import DashboardView from "../views/DashboardView.vue";
import { useAuthStore } from "../stores/auth";
import PendingApprovalView from "../views/PendingApprovalView.vue";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/", redirect: "/dashboard" },
    { path: "/login", component: LoginView },

    {
      path: "/dashboard",
      component: DashboardView,
      meta: { requiresAuth: true },
    },
    {
      path: "/pending-approval",
      component: PendingApprovalView,
      meta: { requiresAuth: true },
    },
  ],
});

router.beforeEach(async (to) => {
  const auth = useAuthStore();

  // Ensure token is loaded + /me fetched once on refresh
  if (auth.token && !auth.user) {
    await auth.init();
  }

  if (to.meta.requiresAuth && !auth.token) {
    return "/login";
  }

  // If logged in but user object didn't load (token bad), send to login
  if (to.meta.requiresAuth && auth.token && !auth.user) return "/login";

  // Technician approval gate
  if (
    auth.user?.role === "TECHNICIAN" &&
    auth.user?.technicianProfile?.approved === false &&
    to.path !== "/pending-approval"
    ) {
    return "/pending-approval";
  }

  // Optional: if already logged in, prevent going back to login
  if (to.path === "/login" && auth.token) {
    return "/dashboard";
  }

  return true;
});

export default router;
