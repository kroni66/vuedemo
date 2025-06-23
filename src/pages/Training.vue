<template>
  <div class="training">
    <div class="page-header">
      <div class="header-content">
        <h1>Training</h1>
        <p>Monitor and manage your model training jobs</p>
      </div>
      <div class="header-actions">
        <el-button type="primary" @click="showStartDialog = true">
          <el-icon><VideoPlay /></el-icon>
          Start Training
        </el-button>
      </div>
    </div>

    <!-- Active Training Jobs -->
    <el-card v-if="activeJobs.length > 0" class="active-jobs-card">
      <template #header>
        <div class="card-header">
          <h3>Active Training Jobs ({{ activeJobs.length }})</h3>
          <el-button size="small" @click="refreshJobs">
            <el-icon><Refresh /></el-icon>
            Refresh
          </el-button>
        </div>
      </template>

      <div class="training-jobs">
        <div v-for="job in activeJobs" :key="job.id" class="training-job">
          <div class="job-header">
            <div class="job-info">
              <h4>{{ job.name }}</h4>
              <div class="job-meta">
                <el-tag size="small">{{ job.model }}</el-tag>
                <span class="separator">•</span>
                <span>{{ job.dataset }}</span>
                <span class="separator">•</span>
                <span>Started {{ formatRelativeTime(job.startedAt) }}</span>
              </div>
            </div>
            <div class="job-controls">
              <el-button size="small" @click="pauseJob(job)" :disabled="job.status === 'paused'">
                <el-icon><VideoPause /></el-icon>
                {{ job.status === 'paused' ? 'Paused' : 'Pause' }}
              </el-button>
              <el-button size="small" type="danger" @click="stopJob(job)">
                <el-icon><VideoStop /></el-icon>
                Stop
              </el-button>
            </div>
          </div>

          <div class="job-progress">
            <div class="progress-info">
              <span class="progress-text">
                Epoch {{ job.currentEpoch }}/{{ job.totalEpochs }} • {{ job.progress }}%
              </span>
              <span class="eta">{{ job.eta }} remaining</span>
            </div>
            <el-progress 
              :percentage="job.progress" 
              :status="job.status === 'paused' ? 'warning' : 'active'"
              :stroke-width="8"
            />
          </div>

          <div class="job-metrics">
            <el-row :gutter="20">
              <el-col :span="8">
                <div class="metric">
                  <span class="metric-label">Loss</span>
                  <span class="metric-value">{{ job.metrics.loss }}</span>
                </div>
              </el-col>
              <el-col :span="8">
                <div class="metric">
                  <span class="metric-label">Accuracy</span>
                  <span class="metric-value">{{ job.metrics.accuracy }}%</span>
                </div>
              </el-col>
              <el-col :span="8">
                <div class="metric">
                  <span class="metric-label">Learning Rate</span>
                  <span class="metric-value">{{ job.metrics.learningRate }}</span>
                </div>
              </el-col>
            </el-row>
          </div>

          <div class="job-charts">
            <el-row :gutter="20">
              <el-col :span="12">
                <div class="chart-container">
                  <h5>Training Loss</h5>
                  <div class="chart-placeholder">
                    <div class="chart-line" :style="{ width: job.progress + '%' }"></div>
                  </div>
                </div>
              </el-col>
              <el-col :span="12">
                <div class="chart-container">
                  <h5>Validation Accuracy</h5>
                  <div class="chart-placeholder">
                    <div class="chart-line accuracy" :style="{ width: job.progress + '%' }"></div>
                  </div>
                </div>
              </el-col>
            </el-row>
          </div>
        </div>
      </div>
    </el-card>

    <!-- Training Queue -->
    <el-card v-if="queuedJobs.length > 0" class="queue-card">
      <template #header>
        <h3>Training Queue ({{ queuedJobs.length }})</h3>
      </template>
      <div class="queued-jobs">
        <div v-for="(job, index) in queuedJobs" :key="job.id" class="queued-job">
          <div class="queue-position">{{ index + 1 }}</div>
          <div class="job-info">
            <h4>{{ job.name }}</h4>
            <p>{{ job.model }} • {{ job.dataset }}</p>
          </div>
          <div class="job-actions">
            <el-button size="small" @click="moveUp(index)" :disabled="index === 0">
              <el-icon><ArrowUp /></el-icon>
            </el-button>
            <el-button size="small" @click="moveDown(index)" :disabled="index === queuedJobs.length - 1">
              <el-icon><ArrowDown /></el-icon>
            </el-button>
            <el-button size="small" type="danger" @click="removeFromQueue(index)">
              <el-icon><Delete /></el-icon>
            </el-button>
          </div>
        </div>
      </div>
    </el-card>

    <!-- Training History -->
    <el-card class="history-card">
      <template #header>
        <div class="card-header">
          <h3>Training History</h3>
          <div class="filters">
            <el-select v-model="historyFilter" placeholder="Filter by status" style="width: 150px">
              <el-option label="All" value="" />
              <el-option label="Completed" value="completed" />
              <el-option label="Failed" value="failed" />
              <el-option label="Stopped" value="stopped" />
            </el-select>
          </div>
        </div>
      </template>

      <el-table :data="filteredHistory" style="width: 100%">
        <el-table-column prop="name" label="Job Name" min-width="200" />
        <el-table-column prop="model" label="Model" width="150" />
        <el-table-column prop="dataset" label="Dataset" width="150" />
        <el-table-column prop="status" label="Status" width="120">
          <template #default="scope">
            <el-tag :type="getStatusColor(scope.row.status)">
              {{ scope.row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="finalAccuracy" label="Final Accuracy" width="120">
          <template #default="scope">
            <span v-if="scope.row.finalAccuracy">{{ scope.row.finalAccuracy }}%</span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="duration" label="Duration" width="120" />
        <el-table-column prop="completedAt" label="Completed" width="150">
          <template #default="scope">
            {{ formatDate(scope.row.completedAt) }}
          </template>
        </el-table-column>
        <el-table-column label="Actions" width="150">
          <template #default="scope">
            <el-button size="small" @click="viewLogs(scope.row)">
              <el-icon><Document /></el-icon>
              Logs
            </el-button>
            <el-button size="small" @click="rerunJob(scope.row)" v-if="scope.row.status !== 'completed'">
              <el-icon><Refresh /></el-icon>
              Rerun
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- Start Training Dialog -->
    <StartTrainingDialog 
      v-model="showStartDialog" 
      @started="handleTrainingStarted"
    />

    <!-- Training Logs Dialog -->
    <TrainingLogs 
      v-model="showLogsDialog" 
      :job="selectedJob"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { 
  VideoPlay, 
  VideoPause, 
  VideoStop, 
  Refresh, 
  ArrowUp, 
  ArrowDown, 
  Delete,
  Document
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import StartTrainingDialog from '../components/StartTrainingDialog.vue'
import TrainingLogs from '../components/TrainingLogs.vue'

const showStartDialog = ref(false)
const showLogsDialog = ref(false)
const selectedJob = ref(null)
const historyFilter = ref('')

const activeJobs = ref([
  {
    id: 1,
    name: 'Sentiment Analysis Training',
    model: 'BERT-base',
    dataset: 'Customer Reviews',
    status: 'training',
    progress: 65,
    currentEpoch: 13,
    totalEpochs: 20,
    eta: '2h 15m',
    startedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    metrics: {
      loss: 0.234,
      accuracy: 89.2,
      learningRate: 0.0001
    }
  },
  {
    id: 2,
    name: 'Image Classification Training',
    model: 'ResNet-50',
    dataset: 'Product Images',
    status: 'training',
    progress: 30,
    currentEpoch: 6,
    totalEpochs: 20,
    eta: '4h 30m',
    startedAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
    metrics: {
      loss: 0.567,
      accuracy: 76.8,
      learningRate: 0.001
    }
  }
])

const queuedJobs = ref([
  {
    id: 3,
    name: 'Sales Prediction Model',
    model: 'XGBoost',
    dataset: 'Sales Data'
  },
  {
    id: 4,
    name: 'Fraud Detection Model',
    model: 'Random Forest',
    dataset: 'Transaction Data'
  }
])

const trainingHistory = ref([
  {
    id: 101,
    name: 'Text Classifier v1',
    model: 'BERT-base',
    dataset: 'News Articles',
    status: 'completed',
    finalAccuracy: 94.2,
    duration: '3h 45m',
    completedAt: new Date('2024-01-20')
  },
  {
    id: 102,
    name: 'Object Detection Model',
    model: 'YOLO v8',
    dataset: 'Street Images',
    status: 'failed',
    finalAccuracy: null,
    duration: '1h 20m',
    completedAt: new Date('2024-01-19')
  },
  {
    id: 103,
    name: 'Regression Model v2',
    model: 'Neural Network',
    dataset: 'Housing Data',
    status: 'stopped',
    finalAccuracy: null,
    duration: '45m',
    completedAt: new Date('2024-01-18')
  }
])

const filteredHistory = computed(() => {
  if (!historyFilter.value) return trainingHistory.value
  return trainingHistory.value.filter(job => job.status === historyFilter.value)
})

const formatRelativeTime = (date) => {
  const now = new Date()
  const diff = now - date
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  
  if (hours > 0) {
    return `${hours}h ${minutes}m ago`
  }
  return `${minutes}m ago`
}

const formatDate = (date) => {
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getStatusColor = (status) => {
  const colors = {
    completed: 'success',
    failed: 'danger',
    stopped: 'warning',
    training: 'primary',
    paused: 'info'
  }
  return colors[status] || 'default'
}

const refreshJobs = () => {
  ElMessage.success('Training jobs refreshed')
  // Simulate progress update
  activeJobs.value.forEach(job => {
    if (job.status === 'training') {
      job.progress = Math.min(100, job.progress + Math.floor(Math.random() * 5))
      job.currentEpoch = Math.floor((job.progress / 100) * job.totalEpochs)
    }
  })
}

const pauseJob = (job) => {
  if (job.status === 'paused') {
    job.status = 'training'
    ElMessage.success(`Resumed training for ${job.name}`)
  } else {
    job.status = 'paused'
    ElMessage.warning(`Paused training for ${job.name}`)
  }
}

const stopJob = async (job) => {
  try {
    await ElMessageBox.confirm(
      `Are you sure you want to stop training for "${job.name}"? This action cannot be undone.`,
      'Stop Training',
      {
        confirmButtonText: 'Stop',
        cancelButtonText: 'Cancel',
        type: 'warning'
      }
    )
    
    // Move to history
    trainingHistory.value.unshift({
      ...job,
      status: 'stopped',
      finalAccuracy: null,
      duration: '2h 30m', // Calculate actual duration
      completedAt: new Date()
    })
    
    // Remove from active jobs
    const index = activeJobs.value.findIndex(j => j.id === job.id)
    if (index > -1) {
      activeJobs.value.splice(index, 1)
    }
    
    ElMessage.success(`Training stopped for ${job.name}`)
  } catch {
    // User cancelled
  }
}

const moveUp = (index) => {
  if (index > 0) {
    const job = queuedJobs.value.splice(index, 1)[0]
    queuedJobs.value.splice(index - 1, 0, job)
  }
}

const moveDown = (index) => {
  if (index < queuedJobs.value.length - 1) {
    const job = queuedJobs.value.splice(index, 1)[0]
    queuedJobs.value.splice(index + 1, 0, job)
  }
}

const removeFromQueue = async (index) => {
  try {
    await ElMessageBox.confirm(
      'Remove this job from the training queue?',
      'Remove Job',
      {
        confirmButtonText: 'Remove',
        cancelButtonText: 'Cancel',
        type: 'warning'
      }
    )
    
    queuedJobs.value.splice(index, 1)
    ElMessage.success('Job removed from queue')
  } catch {
    // User cancelled
  }
}

const viewLogs = (job) => {
  selectedJob.value = job
  showLogsDialog.value = true
}

const rerunJob = (job) => {
  ElMessage.success(`Rerunning ${job.name}...`)
  // Add to queue or start immediately
}

const handleTrainingStarted = (jobData) => {
  // Add to active jobs or queue based on available resources
  if (activeJobs.value.length < 2) {
    activeJobs.value.push({
      ...jobData,
      id: Date.now(),
      status: 'training',
      progress: 0,
      currentEpoch: 0,
      startedAt: new Date(),
      metrics: {
        loss: 0,
        accuracy: 0,
        learningRate: jobData.hyperparameters?.learningRate || 0.001
      }
    })
  } else {
    queuedJobs.value.push({
      ...jobData,
      id: Date.now()
    })
  }
  
  ElMessage.success('Training job started successfully!')
}

// Simulate training progress
setInterval(() => {
  activeJobs.value.forEach(job => {
    if (job.status === 'training' && job.progress < 100) {
      job.progress += Math.random() * 2
      job.currentEpoch = Math.floor((job.progress / 100) * job.totalEpochs)
      
      // Update metrics
      job.metrics.loss = Math.max(0.01, job.metrics.loss - Math.random() * 0.01)
      job.metrics.accuracy = Math.min(99.9, job.metrics.accuracy + Math.random() * 0.5)
      
      // Complete training when progress reaches 100%
      if (job.progress >= 100) {
        job.progress = 100
        job.currentEpoch = job.totalEpochs
        
        // Move to history
        trainingHistory.value.unshift({
          ...job,
          status: 'completed',
          finalAccuracy: job.metrics.accuracy,
          duration: '3h 45m',
          completedAt: new Date()
        })
        
        // Remove from active jobs
        const index = activeJobs.value.findIndex(j => j.id === job.id)
        if (index > -1) {
          activeJobs.value.splice(index, 1)
        }
        
        ElMessage.success(`Training completed for ${job.name}!`)
      }
    }
  })
}, 5000) // Update every 5 seconds
</script>

<style scoped>
.training {
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
}

.header-content h1 {
  margin: 0 0 8px 0;
}

.header-content p {
  margin: 0;
  color: var(--el-text-color-regular);
}

.active-jobs-card,
.queue-card,
.history-card {
  margin-bottom: 24px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h3 {
  margin: 0;
}

.filters {
  display: flex;
  gap: 12px;
}

.training-job {
  padding: 24px;
  border: 1px solid var(--el-border-color);
  border-radius: 8px;
  margin-bottom: 16px;
}

.training-job:last-child {
  margin-bottom: 0;
}

.job-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.job-info h4 {
  margin: 0 0 8px 0;
}

.job-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: var(--el-text-color-regular);
}

.separator {
  color: var(--el-text-color-placeholder);
}

.job-controls {
  display: flex;
  gap: 8px;
}

.job-progress {
  margin-bottom: 16px;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.progress-text {
  font-weight: 500;
}

.eta {
  color: var(--el-text-color-regular);
  font-size: 14px;
}

.job-metrics {
  margin-bottom: 16px;
}

.metric {
  text-align: center;
}

.metric-label {
  display: block;
  font-size: 12px;
  color: var(--el-text-color-regular);
  margin-bottom: 4px;
}

.metric-value {
  display: block;
  font-size: 18px;
  font-weight: bold;
  color: var(--el-text-color-primary);
}

.job-charts {
  margin-top: 16px;
}

.chart-container {
  text-align: center;
}

.chart-container h5 {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: var(--el-text-color-regular);
}

.chart-placeholder {
  height: 40px;
  background: var(--el-bg-color-page);
  border-radius: 4px;
  position: relative;
  overflow: hidden;
}

.chart-line {
  height: 100%;
  background: linear-gradient(90deg, var(--el-color-primary), var(--el-color-primary-light-3));
  transition: width 0.3s ease;
}

.chart-line.accuracy {
  background: linear-gradient(90deg, var(--el-color-success), var(--el-color-success-light-3));
}

.queued-jobs {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.queued-job {
  display: flex;
  align-items: center;
  padding: 16px;
  border: 1px solid var(--el-border-color);
  border-radius: 8px;
}

.queue-position {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--el-color-primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  margin-right: 16px;
}

.queued-job .job-info {
  flex: 1;
}

.queued-job .job-info h4 {
  margin: 0 0 4px 0;
}

.queued-job .job-info p {
  margin: 0;
  color: var(--el-text-color-regular);
  font-size: 14px;
}

.job-actions {
  display: flex;
  gap: 4px;
}
</style>

