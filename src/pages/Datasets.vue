<template>
  <div class="datasets">
    <div class="page-header">
      <div class="header-content">
        <h1>Datasets</h1>
        <p>Manage your training datasets</p>
      </div>
      <div class="header-actions">
        <el-button type="primary" @click="showUploadDialog = true">
          <el-icon><Upload /></el-icon>
          Upload Dataset
        </el-button>
      </div>
    </div>

    <!-- Filters and Search -->
    <el-card class="filters-card">
      <el-row :gutter="16">
        <el-col :span="8">
          <el-input
            v-model="searchQuery"
            placeholder="Search datasets..."
            :prefix-icon="Search"
            clearable
          />
        </el-col>
        <el-col :span="6">
          <el-select v-model="selectedType" placeholder="Dataset Type" clearable>
            <el-option label="All Types" value="" />
            <el-option label="Text" value="text" />
            <el-option label="Image" value="image" />
            <el-option label="Tabular" value="tabular" />
            <el-option label="Audio" value="audio" />
          </el-select>
        </el-col>
        <el-col :span="6">
          <el-select v-model="selectedStatus" placeholder="Status" clearable>
            <el-option label="All Status" value="" />
            <el-option label="Ready" value="ready" />
            <el-option label="Processing" value="processing" />
            <el-option label="Error" value="error" />
          </el-select>
        </el-col>
        <el-col :span="4">
          <el-button @click="resetFilters">Reset</el-button>
        </el-col>
      </el-row>
    </el-card>

    <!-- Datasets Grid -->
    <div class="datasets-grid">
      <el-row :gutter="20">
        <el-col :span="8" v-for="dataset in filteredDatasets" :key="dataset.id">
          <el-card class="dataset-card" :class="{ 'processing': dataset.status === 'processing' }">
            <div class="dataset-header">
              <div class="dataset-type">
                <el-tag :type="getTypeColor(dataset.type)">{{ dataset.type }}</el-tag>
              </div>
              <el-dropdown @command="handleDatasetAction">
                <el-button text>
                  <el-icon><MoreFilled /></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item :command="`preview-${dataset.id}`">Preview</el-dropdown-item>
                    <el-dropdown-item :command="`download-${dataset.id}`">Download</el-dropdown-item>
                    <el-dropdown-item :command="`duplicate-${dataset.id}`">Duplicate</el-dropdown-item>
                    <el-dropdown-item divided :command="`delete-${dataset.id}`">Delete</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>

            <div class="dataset-content">
              <h3>{{ dataset.name }}</h3>
              <p class="dataset-description">{{ dataset.description }}</p>
              
              <div class="dataset-stats">
                <div class="stat">
                  <span class="stat-label">Size:</span>
                  <span class="stat-value">{{ dataset.size }}</span>
                </div>
                <div class="stat">
                  <span class="stat-label">Samples:</span>
                  <span class="stat-value">{{ dataset.samples.toLocaleString() }}</span>
                </div>
                <div class="stat">
                  <span class="stat-label">Created:</span>
                  <span class="stat-value">{{ formatDate(dataset.createdAt) }}</span>
                </div>
              </div>

              <div class="dataset-status">
                <el-tag :type="getStatusColor(dataset.status)" size="small">
                  {{ dataset.status }}
                </el-tag>
                <div v-if="dataset.status === 'processing'" class="processing-progress">
                  <el-progress :percentage="dataset.progress" size="small" />
                </div>
              </div>
            </div>

            <div class="dataset-actions">
              <el-button size="small" @click="previewDataset(dataset)">
                <el-icon><View /></el-icon>
                Preview
              </el-button>
              <el-button size="small" type="primary" @click="useDataset(dataset)">
                <el-icon><VideoPlay /></el-icon>
                Use for Training
              </el-button>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- Empty State -->
    <div v-if="filteredDatasets.length === 0" class="empty-state">
      <el-empty description="No datasets found">
        <el-button type="primary" @click="showUploadDialog = true">Upload Your First Dataset</el-button>
      </el-empty>
    </div>

    <!-- Upload Dialog -->
    <DatasetUpload v-model="showUploadDialog" @uploaded="handleDatasetUploaded" />

    <!-- Preview Dialog -->
    <DatasetPreview 
      v-model="showPreviewDialog" 
      :dataset="selectedDataset"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { 
  Upload, 
  Search, 
  MoreFilled, 
  View, 
  VideoPlay 
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import DatasetUpload from '../components/DatasetUpload.vue'
import DatasetPreview from '../components/DatasetPreview.vue'

const searchQuery = ref('')
const selectedType = ref('')
const selectedStatus = ref('')
const showUploadDialog = ref(false)
const showPreviewDialog = ref(false)
const selectedDataset = ref(null)

const datasets = ref([
  {
    id: 1,
    name: 'Customer Reviews Dataset',
    description: 'Product reviews with sentiment labels for classification training',
    type: 'text',
    status: 'ready',
    size: '45.2 MB',
    samples: 50000,
    createdAt: new Date('2024-01-15'),
    progress: 100
  },
  {
    id: 2,
    name: 'Product Images',
    description: 'High-resolution product images for computer vision tasks',
    type: 'image',
    status: 'processing',
    size: '2.1 GB',
    samples: 25000,
    createdAt: new Date('2024-01-20'),
    progress: 65
  },
  {
    id: 3,
    name: 'Sales Data',
    description: 'Historical sales data with multiple features for regression',
    type: 'tabular',
    status: 'ready',
    size: '12.8 MB',
    samples: 100000,
    createdAt: new Date('2024-01-10'),
    progress: 100
  },
  {
    id: 4,
    name: 'Audio Samples',
    description: 'Speech recognition training data with transcriptions',
    type: 'audio',
    status: 'error',
    size: '890 MB',
    samples: 15000,
    createdAt: new Date('2024-01-18'),
    progress: 0
  }
])

const filteredDatasets = computed(() => {
  return datasets.value.filter(dataset => {
    const matchesSearch = dataset.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                         dataset.description.toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchesType = !selectedType.value || dataset.type === selectedType.value
    const matchesStatus = !selectedStatus.value || dataset.status === selectedStatus.value
    
    return matchesSearch && matchesType && matchesStatus
  })
})

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

const resetFilters = () => {
  searchQuery.value = ''
  selectedType.value = ''
  selectedStatus.value = ''
}

const handleDatasetAction = (command) => {
  const [action, id] = command.split('-')
  const dataset = datasets.value.find(d => d.id === parseInt(id))
  
  switch (action) {
    case 'preview':
      previewDataset(dataset)
      break
    case 'download':
      ElMessage.success(`Downloading ${dataset.name}...`)
      break
    case 'duplicate':
      ElMessage.success(`Duplicating ${dataset.name}...`)
      break
    case 'delete':
      ElMessage.warning(`Delete ${dataset.name}?`)
      break
  }
}

const previewDataset = (dataset) => {
  selectedDataset.value = dataset
  showPreviewDialog.value = true
}

const useDataset = (dataset) => {
  ElMessage.success(`Using ${dataset.name} for training`)
  // Navigate to training page with dataset pre-selected
}

const handleDatasetUploaded = (newDataset) => {
  datasets.value.unshift(newDataset)
  ElMessage.success('Dataset uploaded successfully!')
}
</script>

<style scoped>
.datasets {
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

.filters-card {
  margin-bottom: 24px;
}

.datasets-grid {
  margin-bottom: 24px;
}

.dataset-card {
  height: 100%;
  transition: all 0.3s ease;
}

.dataset-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.dataset-card.processing {
  border-left: 4px solid var(--el-color-warning);
}

.dataset-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.dataset-content h3 {
  margin: 0 0 8px 0;
  font-size: 16px;
}

.dataset-description {
  margin: 0 0 16px 0;
  color: var(--el-text-color-regular);
  font-size: 14px;
  line-height: 1.4;
}

.dataset-stats {
  margin-bottom: 16px;
}

.stat {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
  font-size: 14px;
}

.stat-label {
  color: var(--el-text-color-regular);
}

.stat-value {
  font-weight: 500;
}

.dataset-status {
  margin-bottom: 16px;
}

.processing-progress {
  margin-top: 8px;
}

.dataset-actions {
  display: flex;
  gap: 8px;
}

.dataset-actions .el-button {
  flex: 1;
}

.empty-state {
  text-align: center;
  padding: 60px 0;
}
</style>

