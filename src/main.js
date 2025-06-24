import { createApp } from 'vue'
import { StoryblokVue, apiPlugin } from '@storyblok/vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import router from './router'
import pinia from './stores'
import './assets/styles/main.css'
import App from './App.vue'

const app = createApp(App)

// Register Element Plus icons
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.use(StoryblokVue, {
  accessToken: 'd6IKUtAUDiKyAhpJtrLFcwtt',
  use: [apiPlugin],
  apiOptions: {
    region: ''
  }
})

app.use(ElementPlus)
app.use(router)
app.use(pinia)

app.mount('#app')
