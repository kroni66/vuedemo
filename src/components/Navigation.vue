<template>
  <el-menu
    :default-active="$route.path"
    class="navigation-menu"
    router
    :collapse="false"
  >
    <el-menu-item index="/">
      <el-icon><House /></el-icon>
      <span>Dashboard</span>
    </el-menu-item>
    
    <el-menu-item index="/datasets">
      <el-icon><FolderOpened /></el-icon>
      <span>Datasets</span>
    </el-menu-item>
    
    <el-menu-item index="/models">
      <el-icon><Setting /></el-icon>
      <span>Models</span>
    </el-menu-item>
    
    <el-menu-item index="/training">
      <el-icon><VideoPlay /></el-icon>
      <span>Training</span>
    </el-menu-item>
    
    <el-menu-item index="/evaluation">
      <el-icon><DataAnalysis /></el-icon>
      <span>Evaluation</span>
    </el-menu-item>
  </el-menu>
</template>

<script setup>
import { 
  House, 
  FolderOpened, 
  Setting, 
  VideoPlay, 
  DataAnalysis 
} from '@element-plus/icons-vue'
</script>

<style scoped>
.navigation-menu {
  border: none;
  height: 100%;
}

.navigation-menu .el-menu-item {
  height: 56px;
  line-height: 56px;
}

.navigation-menu .el-menu-item.is-active {
  background-color: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
}
</style>

