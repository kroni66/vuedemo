<template>
  <div class="dashboard">
    <div class="dashboard-header">
      <h1>Dashboard</h1>
      <p>Welcome to your AI Fine Tuning workspace</p>
    </div>

    <!-- Stats Cards -->
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon datasets">
              <el-icon size="24"><FolderOpened /></el-icon>
            </div>
            <div class="stat-info">
              <h3>{{ stats.datasets }}</h3>
              <p>Datasets</p>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon models">
              <el-icon size="24"><Setting /></el-icon>
            </div>
            <div class="stat-info">
              <h3>{{ stats.models }}</h3>
              <p>Models</p>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon training">
              <el-icon size="24"><VideoPlay /></el-icon>
            </div>
            <div class="stat-info">
              <h3>{{ stats.activeTraining }}</h3>
              <p>Active Training</p>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon completed">
              <el-icon size="24"><CircleCheck /></el-icon>
            </div>
            <div class="stat-info">
              <h3>{{ stats.completed }}</h3>
              <p>Completed</p>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- Quick Actions -->
    <el-row :gutter="20" class="content-row">
      <el-col :span="12">
        <el-card>
          <template #header>
            <h3>Quick Actions</h3>
          </template>
          <div class="quick-actions">
            <el-button type="primary" size="large" @click="$router.push('/datasets')">
              <el-icon><Upload /></el-icon>
              Upload Dataset
            </el-button>
            <el-button type="success" size="large" @click="$router.push('/models')">
              <el-icon><Plus /></el-icon>
              Create Model
            </el-button>
            <el-button type="warning" size="large" @click="$router.push('/training')">
              <el-icon><VideoPlay /></el-icon>
              Start Training
            </el-button>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="12">
        <el-card>
          <template #header>
            <h3>Recent Activity</h3>
          </template>
          <div class="activity-list">
            <div v-for="activity in recentActivity" :key="activity.id" class="activity-item">
              <div class="activity-icon">
                <el-icon :color="activity.color"><component :is="activity.icon" /></el-icon>
              </div>
              <div class="activity-content">
                <p class="activity-title">{{ activity.title }}</p>
                <p class="activity-time">{{ activity.time }}</p>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- Training Progress -->
    <el-row :gutter="20" class="content-row">
      <el-col :span="24">
        <el-card>
          <template #header>
            <h3>Active Training Jobs</h3>
          </template>
          <div v-if="trainingJobs.length === 0" class="empty-state">
            <el-empty description="No active training jobs">
              <el-button type="primary" @click="$router.push('/training')">Start Training</el-button>
            </el-empty>
          </div>
          <div v-else>
            <div v-for="job in trainingJobs" :key="job.id" class="training-job">
              <div class="job-info">
                <h4>{{ job.name }}</h4>
                <p>{{ job.model }} • {{ job.dataset }}</p>
              </div>
              <div class="job-progress">
                <el-progress :percentage="job.progress" :status="job.status" />
                <p class="progress-text">{{ job.progress }}% • {{ job.eta }}</p>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { 
  FolderOpened, 
  Setting, 
  VideoPlay, 
  CircleCheck, 
  Upload, 
  Plus,
  DataAnalysis,
  Clock
} from '@element-plus/icons-vue'

const stats = ref({
  datasets: 12,
  models: 8,
  activeTraining: 2,
  completed: 15
})

const recentActivity = ref([
  {
    id: 1,
    title: 'Dataset "Customer Reviews" uploaded',
    time: '2 hours ago',
    icon: 'FolderOpened',
    color: '#409EFF'
  },
  {
    id: 2,
    title: 'Model "Sentiment Classifier" training completed',
    time: '4 hours ago',
    icon: 'CircleCheck',
    color: '#67C23A'
  },
  {
    id: 3,
    title: 'New training job started',
    time: '6 hours ago',
    icon: 'VideoPlay',
    color: '#E6A23C'
  }
])

const trainingJobs = ref([
  {
    id: 1,
    name: 'Text Classification Model',
    model: 'BERT-base',
    dataset: 'News Articles',
    progress: 65,
    status: 'active',
    eta: '2h 15m remaining'
  },
  {
    id: 2,
    name: 'Image Recognition Model',
    model: 'ResNet-50',
    dataset: 'Product Images',
    progress: 30,
    status: 'active',
    eta: '4h 30m remaining'
  }
])
</script>

<style scoped>
.dashboard {
  max-width: 1200px;
  margin: 0 auto;
}

.dashboard-header {
  margin-bottom: 24px;
}

.dashboard-header h1 {
  margin: 0 0 8px 0;
  color: var(--el-text-color-primary);
}

.dashboard-header p {
  margin: 0;
  color: var(--el-text-color-regular);
}

.stats-row {
  margin-bottom: 24px;
}

.content-row {
  margin-bottom: 24px;
}

.stat-card {
  height: 100px;
}

.stat-content {
  display: flex;
  align-items: center;
  height: 100%;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
}

.stat-icon.datasets {
  background: #409EFF20;
  color: #409EFF;
}

.stat-icon.models {
  background: #67C23A20;
  color: #67C23A;
}

.stat-icon.training {
  background: #E6A23C20;
  color: #E6A23C;
}

.stat-icon.completed {
  background: #F56C6C20;
  color: #F56C6C;
}

.stat-info h3 {
  margin: 0 0 4px 0;
  font-size: 24px;
  font-weight: bold;
}

.stat-info p {
  margin: 0;
  color: var(--el-text-color-regular);
  font-size: 14px;
}

.quick-actions {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.activity-list {
  max-height: 300px;
  overflow-y: auto;
}

.activity-item {
  display: flex;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.activity-item:last-child {
  border-bottom: none;
}

.activity-icon {
  margin-right: 12px;
}

.activity-content {
  flex: 1;
}

.activity-title {
  margin: 0 0 4px 0;
  font-weight: 500;
}

.activity-time {
  margin: 0;
  font-size: 12px;
  color: var(--el-text-color-regular);
}

.training-job {
  display: flex;
  align-items: center;
  padding: 16px 0;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.training-job:last-child {
  border-bottom: none;
}

.job-info {
  flex: 1;
  margin-right: 24px;
}

.job-info h4 {
  margin: 0 0 4px 0;
}

.job-info p {
  margin: 0;
  color: var(--el-text-color-regular);
  font-size: 14px;
}

.job-progress {
  width: 300px;
}

.progress-text {
  margin: 4px 0 0 0;
  font-size: 12px;
  color: var(--el-text-color-regular);
  text-align: right;
}

.empty-state {
  text-align: center;
  padding: 40px 0;
}
</style>

