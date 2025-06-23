<template>
  <el-container class="main-layout">
    <!-- Header -->
    <el-header class="header">
      <div class="header-content">
        <div class="logo">
          <h2>🤖 AI Fine Tuning</h2>
        </div>
        <div class="header-actions">
          <el-button @click="toggleTheme" :icon="isDark ? Sun : Moon" circle />
          <el-dropdown>
            <el-avatar :size="32" src="https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png" />
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item>Profile</el-dropdown-item>
                <el-dropdown-item>Settings</el-dropdown-item>
                <el-dropdown-item divided>Logout</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
    </el-header>

    <el-container>
      <!-- Sidebar -->
      <el-aside width="250px" class="sidebar">
        <Navigation />
      </el-aside>

      <!-- Main Content -->
      <el-main class="main-content">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { ref } from 'vue'
import { useDark, useToggle } from '@vueuse/core'
import { Sun, Moon } from '@element-plus/icons-vue'
import Navigation from '../components/Navigation.vue'

const isDark = useDark()
const toggleTheme = useToggle(isDark)
</script>

<style scoped>
.main-layout {
  height: 100vh;
}

.header {
  background: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color);
  padding: 0;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 100%;
  padding: 0 20px;
}

.logo h2 {
  margin: 0;
  color: var(--el-color-primary);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.sidebar {
  background: var(--el-bg-color);
  border-right: 1px solid var(--el-border-color);
}

.main-content {
  background: var(--el-bg-color-page);
  padding: 20px;
}
</style>

