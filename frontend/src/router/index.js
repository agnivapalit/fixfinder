import { createRouter, createWebHistory } from "vue-router";
import LoginView from "../views/LoginView.vue";
import DashboardView from "../views/DashboardView.vue";
import { useAuthStore } from "../stores/auth";
import PendingApprovalView from "../views/PendingApprovalView.vue";
import CreateListingView from "../views/CreateListingView.vue";
import MyListingsView from "../views/MyListingsView.vue";
import BrowseListingsView from "../views/BrowseListingsView.vue";
import ListingDetailsView from "../views/ListingDetailsView.vue";
import FavouritesView from "../views/FavouritesView.vue";
import ChatInboxView from "../views/ChatInboxView.vue";
import ChatThreadView from "../views/ChatThreadView.vue";
import TechJobsView from "../views/TechJobsView.vue";
import TechReviewsView from "../views/TechReviewsView.vue";

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
    {
      path: "/browse",
      component: BrowseListingsView,
      meta: { requiresAuth: true, roles: ["TECHNICIAN", "CUSTOMER", "ADMIN"] },
    },
    {
      path: "/listings/create",
      component: CreateListingView,
      meta: { requiresAuth: true, roles: ["CUSTOMER"] },
    },
    {
      path: "/my-listings",
      component: MyListingsView,
      meta: { requiresAuth: true, roles: ["CUSTOMER"] },
    },
    {
      path: "/listing/:id",
      component: ListingDetailsView,
      meta: { requiresAuth: true, roles: ["TECHNICIAN", "CUSTOMER", "ADMIN"] },
    },
    {
      path: "/favourites",
      component: FavouritesView,
      meta: { requiresAuth: true, roles: ["TECHNICIAN"] },
    },
    {
      path: "/chat",
      component: ChatInboxView,
      meta: { requiresAuth: true, roles: ["CUSTOMER", "TECHNICIAN", "ADMIN"] },
    },
    {
      path: "/chat/:threadId",
      component: ChatThreadView,
      meta: { requiresAuth: true, roles: ["CUSTOMER", "TECHNICIAN", "ADMIN"] },
    },
    {
      path: "/tech/jobs",
      component: TechJobsView,
      meta: { requiresAuth: true, roles: ["TECHNICIAN"] },
    },
    {
      path: "/tech/reviews",
      component: TechReviewsView,
      meta: { requiresAuth: true, roles: ["TECHNICIAN"] },
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

  if (to.meta.roles && auth.user && !to.meta.roles.includes(auth.user.role)) {
  return "/dashboard";
  }

  return true;
});

export default router;
