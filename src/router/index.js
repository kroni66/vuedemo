import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from '../pages/Dashboard.vue'
import Datasets from '../pages/Datasets.vue'
import Models from '../pages/Models.vue'
import Training from '../pages/Training.vue'
import Evaluation from '../pages/Evaluation.vue'

const routes = [
  {
    path: '/',
    name: 'Dashboard',
    component: Dashboard,
    meta: { title: 'Dashboard' }
  },
  {
    path: '/datasets',
    name: 'Datasets',
    component: Datasets,
    meta: { title: 'Datasets' }
  },
  {
    path: '/models',
    name: 'Models',
    component: Models,
    meta: { title: 'Models' }
  },
  {
    path: '/training',
    name: 'Training',
    component: Training,
    meta: { title: 'Training' }
  },
  {
    path: '/evaluation',
    name: 'Evaluation',
    component: Evaluation,
    meta: { title: 'Evaluation' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Navigation guard to update page title
router.beforeEach((to, from, next) => {
  document.title = to.meta.title ? `${to.meta.title} - AI Fine Tuning` : 'AI Fine Tuning'
  next()
})

export default router

