<template>
  <div class="models">
    <div class="page-header">
      <div class="header-content">
        <h1>Models</h1>
        <p>Configure and manage your AI models</p>
      </div>
      <div class="header-actions">
        <el-button type="primary" @click="showCreateDialog = true">
          <el-icon><Plus /></el-icon>
          Create Model
        </el-button>
      </div>
    </div>

    <!-- Model Templates -->
    <el-card class="templates-card">
      <template #header>
        <h3>Popular Model Templates</h3>
      </template>
      <el-row :gutter="20">
        <el-col :span="8" v-for="template in modelTemplates" :key="template.id">
          <div class="template-card" @click="useTemplate(template)">
            <div class="template-icon">
              <el-icon size="32" :color="template.color">
                <component :is="template.icon" />
              </el-icon>
            </div>
            <div class="template-content">
              <h4>{{ template.name }}</h4>
              <p>{{ template.description }}</p>
              <div class="template-tags">
                <el-tag v-for="tag in template.tags" :key="tag" size="small">{{ tag }}</el-tag>
              </div>
            </div>
          </div>
        </el-col>
      </el-row>
    </el-card>

    <!-- Existing Models -->
    <el-card class="models-card">
      <template #header>
        <div class="card-header">
          <h3>Your Models</h3>
          <div class="filters">
            <el-input
              v-model="searchQuery"
              placeholder="Search models..."
              :prefix-icon="Search"
              clearable
              style="width: 200px"
            />
            <el-select v-model="selectedStatus" placeholder="Status" clearable style="width: 120px">
              <el-option label="All" value="" />
              <el-option label="Draft" value="draft" />
              <el-option label="Training" value="training" />
              <el-option label="Trained" value="trained" />
              <el-option label="Deployed" value="deployed" />
            </el-select>
          </div>
        </div>
      </template>

      <el-table :data="filteredModels" style="width: 100%">
        <el-table-column prop="name" label="Model Name" min-width="200">
          <template #default="scope">
            <div class="model-name">
              <strong>{{ scope.row.name }}</strong>
              <div class="model-type">{{ scope.row.type }}</div>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column prop="architecture" label="Architecture" width="150" />
        
        <el-table-column prop="dataset" label="Dataset" width="150" />
        
        <el-table-column prop="status" label="Status" width="120">
          <template #default="scope">
            <el-tag :type="getStatusColor(scope.row.status)">
              {{ scope.row.status }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="accuracy" label="Accuracy" width="100">
          <template #default="scope">
            <span v-if="scope.row.accuracy">{{ scope.row.accuracy }}%</span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        
        <el-table-column prop="createdAt" label="Created" width="120">
          <template #default="scope">
            {{ formatDate(scope.row.createdAt) }}
          </template>
        </el-table-column>
        
        <el-table-column label="Actions" width="200">
          <template #default="scope">
            <el-button size="small" @click="editModel(scope.row)">
              <el-icon><Edit /></el-icon>
              Edit
            </el-button>
            <el-button 
              size="small" 
              type="primary" 
              @click="trainModel(scope.row)"
              :disabled="scope.row.status === 'training'"
            >
              <el-icon><VideoPlay /></el-icon>
              {{ scope.row.status === 'training' ? 'Training...' : 'Train' }}
            </el-button>
            <el-dropdown @command="handleModelAction">
              <el-button size="small" text>
                <el-icon><MoreFilled /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item :command="`duplicate-${scope.row.id}`">Duplicate</el-dropdown-item>
                  <el-dropdown-item :command="`export-${scope.row.id}`">Export</el-dropdown-item>
                  <el-dropdown-item divided :command="`delete-${scope.row.id}`">Delete</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- Create/Edit Model Dialog -->
    <ModelConfig 
      v-model="showCreateDialog" 
      :model="selectedModel"
      @saved="handleModelSaved"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { 
  Plus, 
  Search, 
  Edit, 
  VideoPlay, 
  MoreFilled,
  Setting,
  DataAnalysis,
  Picture,
  ChatDotRound
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import ModelConfig from '../components/ModelConfig.vue'

const searchQuery = ref('')
const selectedStatus = ref('')
const showCreateDialog = ref(false)
const selectedModel = ref(null)

const modelTemplates = ref([
  {
    id: 1,
    name: 'Text Classification',
    description: 'Classify text into predefined categories',
    icon: 'ChatDotRound',
    color: '#409EFF',
    tags: ['NLP', 'Classification', 'BERT'],
    config: {
      type: 'text_classification',
      architecture: 'bert-base-uncased',
      task: 'classification'
    }
  },
  {
    id: 2,
    name: 'Image Recognition',
    description: 'Recognize and classify objects in images',
    icon: 'Picture',
    color: '#67C23A',
    tags: ['Computer Vision', 'CNN', 'ResNet'],
    config: {
      type: 'image_classification',
      architecture: 'resnet50',
      task: 'classification'
    }
  },
  {
    id: 3,
    name: 'Regression Analysis',
    description: 'Predict continuous numerical values',
    icon: 'DataAnalysis',
    color: '#E6A23C',
    tags: ['Regression', 'Tabular', 'XGBoost'],
    config: {
      type: 'regression',
      architecture: 'xgboost',
      task: 'regression'
    }
  }
])

const models = ref([
  {
    id: 1,
    name: 'Sentiment Analyzer',
    type: 'Text Classification',
    architecture: 'BERT-base',
    dataset: 'Customer Reviews',
    status: 'trained',
    accuracy: 94.2,
    createdAt: new Date('2024-01-15')
  },
  {
    id: 2,
    name: 'Product Classifier',
    type: 'Image Classification',
    architecture: 'ResNet-50',
    dataset: 'Product Images',
    status: 'training',
    accuracy: null,
    createdAt: new Date('2024-01-20')
  },
  {
    id: 3,
    name: 'Sales Predictor',
    type: 'Regression',
    architecture: 'XGBoost',
    dataset: 'Sales Data',
    status: 'draft',
    accuracy: null,
    createdAt: new Date('2024-01-18')
  },
  {
    id: 4,
    name: 'Fraud Detection',
    type: 'Binary Classification',
    architecture: 'Random Forest',
    dataset: 'Transaction Data',
    status: 'deployed',
    accuracy: 98.7,
    createdAt: new Date('2024-01-10')
  }
])

const filteredModels = computed(() => {
  return models.value.filter(model => {
    const matchesSearch = model.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                         model.type.toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchesStatus = !selectedStatus.value || model.status === selectedStatus.value
    
    return matchesSearch && matchesStatus
  })
})

const getStatusColor = (status) => {
  const colors = {
    draft: 'info',
    training: 'warning',
    trained: 'success',
    deployed: 'primary'
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

const useTemplate = (template) => {
  selectedModel.value = {
    ...template.config,
    name: '',
    description: ''
  }
  showCreateDialog.value = true
}

const editModel = (model) => {
  selectedModel.value = { ...model }
  showCreateDialog.value = true
}

const trainModel = (model) => {
  if (model.status === 'training') return
  
  ElMessage.success(`Starting training for ${model.name}`)
  model.status = 'training'
  
  // Simulate training completion
  setTimeout(() => {
    model.status = 'trained'
    model.accuracy = Math.floor(Math.random() * 20) + 80 // Random accuracy between 80-100
    ElMessage.success(`Training completed for ${model.name}`)
  }, 5000)
}

const handleModelAction = (command) => {
  const [action, id] = command.split('-')
  const model = models.value.find(m => m.id === parseInt(id))
  
  switch (action) {
    case 'duplicate':
      ElMessage.success(`Duplicating ${model.name}...`)
      break
    case 'export':
      ElMessage.success(`Exporting ${model.name}...`)
      break
    case 'delete':
      ElMessage.warning(`Delete ${model.name}?`)
      break
  }
}

const handleModelSaved = (modelData) => {
  if (modelData.id) {
    // Update existing model
    const index = models.value.findIndex(m => m.id === modelData.id)
    if (index > -1) {
      models.value[index] = { ...models.value[index], ...modelData }
    }
  } else {
    // Create new model
    const newModel = {
      ...modelData,
      id: Date.now(),
      status: 'draft',
      accuracy: null,
      createdAt: new Date()
    }
    models.value.unshift(newModel)
  }
  
  selectedModel.value = null
  ElMessage.success('Model saved successfully!')
}
</script>

<style scoped>
.models {
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

.templates-card {
  margin-bottom: 24px;
}

.template-card {
  display: flex;
  align-items: center;
  padding: 20px;
  border: 1px solid var(--el-border-color);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  height: 100%;
}

.template-card:hover {
  border-color: var(--el-color-primary);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.template-icon {
  margin-right: 16px;
  flex-shrink: 0;
}

.template-content {
  flex: 1;
}

.template-content h4 {
  margin: 0 0 8px 0;
  color: var(--el-text-color-primary);
}

.template-content p {
  margin: 0 0 12px 0;
  color: var(--el-text-color-regular);
  font-size: 14px;
  line-height: 1.4;
}

.template-tags {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
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

.model-name strong {
  display: block;
  margin-bottom: 2px;
}

.model-type {
  font-size: 12px;
  color: var(--el-text-color-regular);
}
</style>

