<template>
  <el-dialog
    v-model="dialogVisible"
    :title="`Training Logs - ${job?.name || 'Job'}`"
    width="80%"
    top="5vh"
  >
    <div v-if="job" class="logs-content">
      <!-- Job Info Header -->
      <el-card class="job-info-card">
        <div class="job-summary">
          <div class="job-details">
            <h4>{{ job.name }}</h4>
            <div class="job-meta">
              <el-tag :type="getStatusColor(job.status)">{{ job.status }}</el-tag>
              <span class="separator">•</span>
              <span>{{ job.model }}</span>
              <span class="separator">•</span>
              <span>{{ job.dataset }}</span>
              <span class="separator">•</span>
              <span>{{ formatDate(job.completedAt || job.startedAt) }}</span>
            </div>
          </div>
          <div class="job-actions">
            <el-button size="small" @click="refreshLogs">
              <el-icon><Refresh /></el-icon>
              Refresh
            </el-button>
            <el-button size="small" @click="downloadLogs">
              <el-icon><Download /></el-icon>
              Download
            </el-button>
          </div>
        </div>
      </el-card>

      <!-- Log Filters -->
      <el-card class="filters-card">
        <el-row :gutter="16">
          <el-col :span="6">
            <el-select v-model="logLevel" placeholder="Log Level" style="width: 100%">
              <el-option label="All Levels" value="" />
              <el-option label="Debug" value="debug" />
              <el-option label="Info" value="info" />
              <el-option label="Warning" value="warning" />
              <el-option label="Error" value="error" />
            </el-select>
          </el-col>
          <el-col :span="6">
            <el-select v-model="logCategory" placeholder="Category" style="width: 100%">
              <el-option label="All Categories" value="" />
              <el-option label="Training" value="training" />
              <el-option label="Validation" value="validation" />
              <el-option label="System" value="system" />
              <el-option label="Data" value="data" />
            </el-select>
          </el-col>
          <el-col :span="8">
            <el-input
              v-model="searchQuery"
              placeholder="Search logs..."
              :prefix-icon="Search"
              clearable
            />
          </el-col>
          <el-col :span="4">
            <el-switch
              v-model="autoScroll"
              active-text="Auto-scroll"
              inactive-text="Manual"
            />
          </el-col>
        </el-row>
      </el-card>

      <!-- Logs Display -->
      <el-card class="logs-card">
        <template #header>
          <div class="logs-header">
            <h3>Training Logs ({{ filteredLogs.length }} entries)</h3>
            <div class="log-stats">
              <el-tag size="small" type="danger" v-if="errorCount > 0">
                {{ errorCount }} errors
              </el-tag>
              <el-tag size="small" type="warning" v-if="warningCount > 0">
                {{ warningCount }} warnings
              </el-tag>
            </div>
          </div>
        </template>

        <div class="logs-container" ref="logsContainer">
          <div
            v-for="log in filteredLogs"
            :key="log.id"
            class="log-entry"
            :class="[`log-${log.level}`, { 'highlighted': log.message.toLowerCase().includes(searchQuery.toLowerCase()) && searchQuery }]"
          >
            <div class="log-timestamp">{{ formatTime(log.timestamp) }}</div>
            <div class="log-level">
              <el-tag :type="getLevelColor(log.level)" size="small">{{ log.level.toUpperCase() }}</el-tag>
            </div>
            <div class="log-category">{{ log.category }}</div>
            <div class="log-message">{{ log.message }}</div>
            <div v-if="log.details" class="log-details">
              <el-button size="small" text @click="toggleDetails(log.id)">
                <el-icon><CaretRight v-if="!expandedLogs.includes(log.id)" /><CaretDown v-else /></el-icon>
                Details
              </el-button>
              <div v-if="expandedLogs.includes(log.id)" class="details-content">
                <pre>{{ log.details }}</pre>
              </div>
            </div>
          </div>
        </div>

        <!-- Load More -->
        <div v-if="hasMoreLogs" class="load-more">
          <el-button @click="loadMoreLogs" :loading="loadingMore">
            Load More Logs
          </el-button>
        </div>
      </el-card>

      <!-- Training Metrics Chart -->
      <el-card v-if="job.status === 'completed' || job.status === 'training'" class="metrics-card">
        <template #header>
          <h3>Training Metrics</h3>
        </template>
        <div class="metrics-charts">
          <el-row :gutter="20">
            <el-col :span="12">
              <div class="chart-container">
                <h4>Loss Over Time</h4>
                <div class="chart-placeholder">
                  <div class="loss-chart">
                    <div class="chart-line loss-line"></div>
                  </div>
                </div>
              </div>
            </el-col>
            <el-col :span="12">
              <div class="chart-container">
                <h4>Accuracy Over Time</h4>
                <div class="chart-placeholder">
                  <div class="accuracy-chart">
                    <div class="chart-line accuracy-line"></div>
                  </div>
                </div>
              </div>
            </el-col>
          </el-row>
        </div>
      </el-card>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="dialogVisible = false">Close</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { Refresh, Download, Search, CaretRight, CaretDown } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const props = defineProps({
  modelValue: Boolean,
  job: Object
})

const emit = defineEmits(['update:modelValue'])

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const logsContainer = ref()
const logLevel = ref('')
const logCategory = ref('')
const searchQuery = ref('')
const autoScroll = ref(true)
const expandedLogs = ref([])
const loadingMore = ref(false)
const hasMoreLogs = ref(true)

// Sample log data
const logs = ref([
  {
    id: 1,
    timestamp: new Date(Date.now() - 10000),
    level: 'info',
    category: 'system',
    message: 'Training job started successfully',
    details: null
  },
  {
    id: 2,
    timestamp: new Date(Date.now() - 9000),
    level: 'info',
    category: 'data',
    message: 'Loading training dataset: Customer Reviews (50,000 samples)',
    details: null
  },
  {
    id: 3,
    timestamp: new Date(Date.now() - 8000),
    level: 'info',
    category: 'data',
    message: 'Dataset preprocessing completed',
    details: 'Train samples: 35,000\nValidation samples: 10,000\nTest samples: 5,000'
  },
  {
    id: 4,
    timestamp: new Date(Date.now() - 7000),
    level: 'info',
    category: 'training',
    message: 'Model architecture: BERT-base-uncased',
    details: 'Parameters: 110M\nLayers: 12\nHidden size: 768\nAttention heads: 12'
  },
  {
    id: 5,
    timestamp: new Date(Date.now() - 6000),
    level: 'info',
    category: 'training',
    message: 'Epoch 1/10 - Loss: 0.6234, Accuracy: 0.7123, Val_Loss: 0.5987, Val_Accuracy: 0.7456',
    details: null
  },
  {
    id: 6,
    timestamp: new Date(Date.now() - 5000),
    level: 'info',
    category: 'training',
    message: 'Epoch 2/10 - Loss: 0.4567, Accuracy: 0.8234, Val_Loss: 0.4321, Val_Accuracy: 0.8456',
    details: null
  },
  {
    id: 7,
    timestamp: new Date(Date.now() - 4000),
    level: 'warning',
    category: 'training',
    message: 'Learning rate reduced from 0.001 to 0.0005 due to plateau',
    details: 'Patience: 3 epochs\nFactor: 0.5\nMin LR: 1e-6'
  },
  {
    id: 8,
    timestamp: new Date(Date.now() - 3000),
    level: 'info',
    category: 'validation',
    message: 'Validation accuracy improved: 0.8456 -> 0.8789',
    details: null
  },
  {
    id: 9,
    timestamp: new Date(Date.now() - 2000),
    level: 'error',
    category: 'system',
    message: 'GPU memory warning: 95% utilization',
    details: 'GPU 0: 7.6GB / 8GB\nConsider reducing batch size or model size'
  },
  {
    id: 10,
    timestamp: new Date(Date.now() - 1000),
    level: 'info',
    category: 'training',
    message: 'Training completed successfully - Final accuracy: 94.2%',
    details: 'Total epochs: 10\nBest validation accuracy: 94.2%\nTraining time: 3h 45m'
  }
])

const filteredLogs = computed(() => {
  return logs.value.filter(log => {
    const matchesLevel = !logLevel.value || log.level === logLevel.value
    const matchesCategory = !logCategory.value || log.category === logCategory.value
    const matchesSearch = !searchQuery.value || 
      log.message.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      log.category.toLowerCase().includes(searchQuery.value.toLowerCase())
    
    return matchesLevel && matchesCategory && matchesSearch
  })
})

const errorCount = computed(() => {
  return logs.value.filter(log => log.level === 'error').length
})

const warningCount = computed(() => {
  return logs.value.filter(log => log.level === 'warning').length
})

const getStatusColor = (status) => {
  const colors = {
    completed: 'success',
    failed: 'danger',
    stopped: 'warning',
    training: 'primary'
  }
  return colors[status] || 'default'
}

const getLevelColor = (level) => {
  const colors = {
    debug: 'info',
    info: 'primary',
    warning: 'warning',
    error: 'danger'
  }
  return colors[level] || 'default'
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

const formatTime = (date) => {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

const toggleDetails = (logId) => {
  const index = expandedLogs.value.indexOf(logId)
  if (index > -1) {
    expandedLogs.value.splice(index, 1)
  } else {
    expandedLogs.value.push(logId)
  }
}

const refreshLogs = () => {
  ElMessage.success('Logs refreshed')
  // In a real app, this would fetch fresh logs from the server
}

const downloadLogs = () => {
  ElMessage.success('Downloading logs...')
  // In a real app, this would trigger a download of the log file
}

const loadMoreLogs = () => {
  loadingMore.value = true
  
  // Simulate loading more logs
  setTimeout(() => {
    // Add some older logs
    const olderLogs = [
      {
        id: logs.value.length + 1,
        timestamp: new Date(Date.now() - 15000),
        level: 'info',
        category: 'system',
        message: 'Initializing training environment',
        details: null
      },
      {
        id: logs.value.length + 2,
        timestamp: new Date(Date.now() - 14000),
        level: 'debug',
        category: 'system',
        message: 'CUDA version: 11.8, PyTorch version: 2.0.1',
        details: null
      }
    ]
    
    logs.value.unshift(...olderLogs)
    loadingMore.value = false
    hasMoreLogs.value = logs.value.length < 50 // Simulate finite logs
  }, 1000)
}

// Auto-scroll to bottom when new logs arrive
watch(logs, () => {
  if (autoScroll.value) {
    nextTick(() => {
      if (logsContainer.value) {
        logsContainer.value.scrollTop = logsContainer.value.scrollHeight
      }
    })
  }
}, { deep: true })
</script>

<style scoped>
.logs-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.job-info-card {
  margin-bottom: 0;
}

.job-summary {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.job-details h4 {
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

.job-actions {
  display: flex;
  gap: 8px;
}

.filters-card {
  margin-bottom: 0;
}

.logs-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logs-header h3 {
  margin: 0;
}

.log-stats {
  display: flex;
  gap: 8px;
}

.logs-container {
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
  background: var(--el-bg-color-page);
}

.log-entry {
  display: grid;
  grid-template-columns: 100px 80px 100px 1fr auto;
  gap: 12px;
  padding: 8px 12px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 13px;
  align-items: center;
}

.log-entry:last-child {
  border-bottom: none;
}

.log-entry.highlighted {
  background: var(--el-color-primary-light-9);
}

.log-entry.log-error {
  background: var(--el-color-danger-light-9);
}

.log-entry.log-warning {
  background: var(--el-color-warning-light-9);
}

.log-timestamp {
  color: var(--el-text-color-regular);
  font-size: 12px;
}

.log-level {
  text-align: center;
}

.log-category {
  color: var(--el-text-color-secondary);
  font-size: 12px;
  text-transform: uppercase;
}

.log-message {
  color: var(--el-text-color-primary);
  word-break: break-word;
}

.log-details {
  text-align: right;
}

.details-content {
  grid-column: 1 / -1;
  margin-top: 8px;
  padding: 8px;
  background: var(--el-bg-color);
  border-radius: 4px;
  border: 1px solid var(--el-border-color);
}

.details-content pre {
  margin: 0;
  font-size: 12px;
  color: var(--el-text-color-regular);
  white-space: pre-wrap;
}

.load-more {
  text-align: center;
  padding: 16px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.metrics-charts {
  margin-top: 16px;
}

.chart-container h4 {
  margin: 0 0 12px 0;
  text-align: center;
}

.chart-placeholder {
  height: 150px;
  background: var(--el-bg-color-page);
  border-radius: 8px;
  position: relative;
  overflow: hidden;
}

.loss-chart,
.accuracy-chart {
  width: 100%;
  height: 100%;
  position: relative;
}

.chart-line {
  position: absolute;
  bottom: 20px;
  left: 10px;
  right: 10px;
  height: 2px;
  border-radius: 1px;
}

.loss-line {
  background: linear-gradient(90deg, #ff6b6b, #4ecdc4);
  transform: rotate(-5deg);
}

.accuracy-line {
  background: linear-gradient(90deg, #4ecdc4, #45b7d1);
  transform: rotate(3deg);
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
}
</style>

