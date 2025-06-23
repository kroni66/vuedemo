<template>
  <el-dialog
    v-model="dialogVisible"
    :title="`Preview: ${dataset?.name || 'Dataset'}`"
    width="80%"
    top="5vh"
  >
    <div v-if="dataset" class="preview-content">
      <!-- Dataset Info -->
      <el-card class="info-card">
        <div class="dataset-info">
          <div class="info-item">
            <span class="label">Type:</span>
            <el-tag :type="getTypeColor(dataset.type)">{{ dataset.type }}</el-tag>
          </div>
          <div class="info-item">
            <span class="label">Size:</span>
            <span>{{ dataset.size }}</span>
          </div>
          <div class="info-item">
            <span class="label">Samples:</span>
            <span>{{ dataset.samples.toLocaleString() }}</span>
          </div>
          <div class="info-item">
            <span class="label">Status:</span>
            <el-tag :type="getStatusColor(dataset.status)">{{ dataset.status }}</el-tag>
          </div>
        </div>
      </el-card>

      <!-- Preview Content Based on Type -->
      <el-card class="preview-card">
        <template #header>
          <div class="card-header">
            <h3>Data Preview</h3>
            <div class="preview-controls">
              <el-button size="small" @click="refreshPreview">
                <el-icon><Refresh /></el-icon>
                Refresh
              </el-button>
              <el-button size="small" @click="downloadSample">
                <el-icon><Download /></el-icon>
                Download Sample
              </el-button>
            </div>
          </div>
        </template>

        <!-- Text Dataset Preview -->
        <div v-if="dataset.type === 'text'" class="text-preview">
          <el-table :data="textSampleData" style="width: 100%" max-height="400">
            <el-table-column prop="id" label="ID" width="80" />
            <el-table-column prop="text" label="Text" min-width="300">
              <template #default="scope">
                <div class="text-content">{{ scope.row.text }}</div>
              </template>
            </el-table-column>
            <el-table-column prop="label" label="Label" width="120">
              <template #default="scope">
                <el-tag size="small">{{ scope.row.label }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="length" label="Length" width="100" />
          </el-table>
        </div>

        <!-- Image Dataset Preview -->
        <div v-else-if="dataset.type === 'image'" class="image-preview">
          <div class="image-grid">
            <div v-for="image in imageSampleData" :key="image.id" class="image-item">
              <div class="image-container">
                <img :src="image.url" :alt="image.filename" />
                <div class="image-overlay">
                  <span class="image-label">{{ image.label }}</span>
                </div>
              </div>
              <div class="image-info">
                <div class="filename">{{ image.filename }}</div>
                <div class="dimensions">{{ image.width }}×{{ image.height }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Tabular Dataset Preview -->
        <div v-else-if="dataset.type === 'tabular'" class="tabular-preview">
          <el-table :data="tabularSampleData" style="width: 100%" max-height="400">
            <el-table-column
              v-for="column in tabularColumns"
              :key="column.prop"
              :prop="column.prop"
              :label="column.label"
              :width="column.width"
            />
          </el-table>
        </div>

        <!-- Audio Dataset Preview -->
        <div v-else-if="dataset.type === 'audio'" class="audio-preview">
          <div class="audio-list">
            <div v-for="audio in audioSampleData" :key="audio.id" class="audio-item">
              <div class="audio-info">
                <div class="audio-title">{{ audio.filename }}</div>
                <div class="audio-meta">
                  <span>Duration: {{ audio.duration }}s</span>
                  <span>Sample Rate: {{ audio.sampleRate }}Hz</span>
                  <el-tag size="small">{{ audio.label }}</el-tag>
                </div>
              </div>
              <div class="audio-controls">
                <audio :src="audio.url" controls preload="none"></audio>
              </div>
            </div>
          </div>
        </div>
      </el-card>

      <!-- Statistics -->
      <el-card class="stats-card">
        <template #header>
          <h3>Dataset Statistics</h3>
        </template>
        <div class="stats-content">
          <el-row :gutter="20">
            <el-col :span="12">
              <div class="stat-chart">
                <h4>Label Distribution</h4>
                <div class="chart-placeholder">
                  <div v-for="stat in labelStats" :key="stat.label" class="stat-bar">
                    <div class="stat-label">{{ stat.label }}</div>
                    <div class="stat-progress">
                      <el-progress :percentage="stat.percentage" :show-text="false" />
                      <span class="stat-count">{{ stat.count }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </el-col>
            <el-col :span="12">
              <div class="stat-summary">
                <h4>Summary</h4>
                <div class="summary-items">
                  <div class="summary-item">
                    <span class="summary-label">Total Samples:</span>
                    <span class="summary-value">{{ dataset.samples.toLocaleString() }}</span>
                  </div>
                  <div class="summary-item">
                    <span class="summary-label">Unique Labels:</span>
                    <span class="summary-value">{{ labelStats.length }}</span>
                  </div>
                  <div class="summary-item">
                    <span class="summary-label">File Size:</span>
                    <span class="summary-value">{{ dataset.size }}</span>
                  </div>
                  <div class="summary-item">
                    <span class="summary-label">Created:</span>
                    <span class="summary-value">{{ formatDate(dataset.createdAt) }}</span>
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
        <el-button type="primary" @click="useForTraining">
          <el-icon><VideoPlay /></el-icon>
          Use for Training
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Refresh, Download, VideoPlay } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const props = defineProps({
  modelValue: Boolean,
  dataset: Object
})

const emit = defineEmits(['update:modelValue'])

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// Sample data for different dataset types
const textSampleData = ref([
  { id: 1, text: "This product is amazing! I love the quality and design.", label: "positive", length: 52 },
  { id: 2, text: "Not satisfied with the purchase. Poor quality materials.", label: "negative", length: 58 },
  { id: 3, text: "Average product, nothing special but does the job.", label: "neutral", length: 48 },
  { id: 4, text: "Excellent customer service and fast delivery!", label: "positive", length: 44 },
  { id: 5, text: "The item broke after just one week of use.", label: "negative", length: 42 }
])

const imageSampleData = ref([
  { id: 1, filename: "product_001.jpg", url: "https://via.placeholder.com/150x150/409EFF/fff?text=Product+1", label: "electronics", width: 1920, height: 1080 },
  { id: 2, filename: "product_002.jpg", url: "https://via.placeholder.com/150x150/67C23A/fff?text=Product+2", label: "clothing", width: 1280, height: 720 },
  { id: 3, filename: "product_003.jpg", url: "https://via.placeholder.com/150x150/E6A23C/fff?text=Product+3", label: "home", width: 1600, height: 900 },
  { id: 4, filename: "product_004.jpg", url: "https://via.placeholder.com/150x150/F56C6C/fff?text=Product+4", label: "sports", width: 1920, height: 1080 }
])

const tabularSampleData = ref([
  { id: 1, name: "John Doe", age: 28, salary: 65000, department: "Engineering", experience: 3.5 },
  { id: 2, name: "Jane Smith", age: 32, salary: 78000, department: "Marketing", experience: 5.2 },
  { id: 3, name: "Bob Johnson", age: 45, salary: 95000, department: "Management", experience: 12.1 },
  { id: 4, name: "Alice Brown", age: 29, salary: 72000, department: "Design", experience: 4.8 }
])

const tabularColumns = ref([
  { prop: 'id', label: 'ID', width: 80 },
  { prop: 'name', label: 'Name', width: 120 },
  { prop: 'age', label: 'Age', width: 80 },
  { prop: 'salary', label: 'Salary', width: 100 },
  { prop: 'department', label: 'Department', width: 120 },
  { prop: 'experience', label: 'Experience', width: 100 }
])

const audioSampleData = ref([
  { id: 1, filename: "speech_001.wav", url: "#", duration: 3.2, sampleRate: 44100, label: "command" },
  { id: 2, filename: "speech_002.wav", url: "#", duration: 2.8, sampleRate: 44100, label: "question" },
  { id: 3, filename: "speech_003.wav", url: "#", duration: 4.1, sampleRate: 44100, label: "statement" }
])

const labelStats = ref([
  { label: "positive", count: 15000, percentage: 45 },
  { label: "negative", count: 12000, percentage: 36 },
  { label: "neutral", count: 6300, percentage: 19 }
])

const getTypeColor = (type) => {
  const colors = {
    text: 'primary',
    image: 'success',
    tabular: 'warning',
    audio: 'info'
  }
  return colors[type] || 'default'
}

const getStatusColor = (status) => {
  const colors = {
    ready: 'success',
    processing: 'warning',
    error: 'danger'
  }
  return colors[status] || 'default'
}

const formatDate = (date) => {
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  })
}

const refreshPreview = () => {
  ElMessage.success('Preview refreshed')
}

const downloadSample = () => {
  ElMessage.success('Downloading sample data...')
}

const useForTraining = () => {
  ElMessage.success(`Using ${props.dataset?.name} for training`)
  dialogVisible.value = false
}
</script>

<style scoped>
.preview-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.info-card {
  margin-bottom: 0;
}

.dataset-info {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.label {
  font-weight: 500;
  color: var(--el-text-color-regular);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h3 {
  margin: 0;
}

.preview-controls {
  display: flex;
  gap: 8px;
}

.text-content {
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}

.image-item {
  text-align: center;
}

.image-container {
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 8px;
}

.image-container img {
  width: 100%;
  height: 150px;
  object-fit: cover;
}

.image-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 4px 8px;
}

.image-label {
  font-size: 12px;
}

.image-info {
  font-size: 12px;
  color: var(--el-text-color-regular);
}

.filename {
  font-weight: 500;
  margin-bottom: 2px;
}

.audio-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.audio-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border: 1px solid var(--el-border-color);
  border-radius: 8px;
}

.audio-info {
  flex: 1;
}

.audio-title {
  font-weight: 500;
  margin-bottom: 4px;
}

.audio-meta {
  display: flex;
  gap: 12px;
  align-items: center;
  font-size: 12px;
  color: var(--el-text-color-regular);
}

.audio-controls {
  margin-left: 16px;
}

.stats-content {
  margin-top: 16px;
}

.stat-chart h4,
.stat-summary h4 {
  margin: 0 0 16px 0;
}

.stat-bar {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

.stat-label {
  width: 80px;
  font-size: 14px;
}

.stat-progress {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12px;
}

.stat-count {
  font-size: 12px;
  color: var(--el-text-color-regular);
  min-width: 60px;
}

.summary-items {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.summary-label {
  color: var(--el-text-color-regular);
}

.summary-value {
  font-weight: 500;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>

