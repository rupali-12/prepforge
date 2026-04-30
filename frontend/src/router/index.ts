import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth.store'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // Public routes
    {
      path: '/',
      name: 'home',
      component: () => import('../views/HomeView.vue'),
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/auth/LoginView.vue'),
      meta: { guestOnly: true },
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('../views/auth/RegisterView.vue'),
      meta: { guestOnly: true },
    },
    {
      path: '/verify-email',
      name: 'verify-email',
      component: () => import('../views/auth/VerifyEmailView.vue'),
      meta: { guestOnly: true },
    },
    {
      path: '/forgot-password',
      name: 'forgot-password',
      component: () => import('../views/auth/ForgotPasswordView.vue'),
      meta: { guestOnly: true },
    },
    {
      path: '/reset-password',
      name: 'reset-password',
      component: () => import('../views/auth/ResetPasswordView.vue'),
      meta: { guestOnly: true },
    },
    // Protected routes (requires login)
    {
      path: '/dashboard',
      name: 'dashboard',
      component: () => import('../views/DashboardView.vue'),
      meta: { requiresAuth: true },
    },
    {
  path: '/problems',
  name: 'problems',
  component: () => import('../views/problems/ProblemListView.vue'),
  meta: { requiresAuth: true },
},
{
  path: '/problems/:slug',
  name: 'problem-detail',
  component: () => import('../views/problems/ProblemDetailView.vue'),
  meta: { requiresAuth: true },
},
{
  path: '/interview/setup',
  name: 'interview-setup',
  component: () => import('../views/interview/InterviewSetupView.vue'),
  meta: { requiresAuth: true },
},
{
  path: '/interview/:sessionId',
  name: 'interview',
  component: () => import('../views/interview/InterviewView.vue'),
  meta: { requiresAuth: true },
},
{
  path: '/interview/:sessionId/result',
  name: 'interview-result',
  component: () => import('../views/interview/InterviewResultView.vue'),
  meta: { requiresAuth: true },
},
    // 404
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('../views/NotFoundView.vue'),
    },
  ],
})

// Navigation Guards
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()

  // Fetch user if token exists but user not loaded yet
  if (authStore.accessToken && !authStore.user) {
    await authStore.fetchMe()
  }

  // Route requires auth — redirect to login if not authenticated
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next({ name: 'login' })
    return
  }

  // Route is guest only — redirect to dashboard if already logged in
  if (to.meta.guestOnly && authStore.accessToken) {
    next({ name: 'dashboard' })
    return
  }

  next()
})

export default router