<template>
  <el-dialog
    v-model="dialogVisible"
    title="Start Training Job"
    width="600px"
    :before-close="handleClose"
  >
    <el-form :model="form" :rules="rules" ref="formRef" label-width="120px">
      <el-form-item label="Job Name" prop="name">
        <el-input v-model="form.name" placeholder="Enter training job name" />
      </el-form-item>

      <el-form-item label="Model" prop="modelId">
        <el-select v-model="form.modelId" placeholder="Select model to train" style="width: 100%">
          <el-option
            v-for="model in availableModels"
            :key="model.id"
            :label="model.name"
            :value="model.id"
          >
            <div class="model-option">
              <span class="model-name">{{ model.name }}</span>
              <span class="model-type">{{ model.type }}</span>
            </div>
          </el-option>
        </el-select>
      </el-form-item>

      <el-form-item label="Dataset" prop="datasetId">
        <el-select v-model="form.datasetId" placeholder="Select training dataset" style="width: 100%">
          <el-option
            v-for="dataset in availableDatasets"
            :key="dataset.id"
            :label="dataset.name"
            :value="dataset.id"
          >
            <div class="dataset-option">
              <span class="dataset-name">{{ dataset.name }}</span>
              <span class="dataset-size">{{ dataset.samples }} samples</span>
            </div>
          </el-option>
        </el-select>
      </el-form-item>

      <el-form-item label="Priority" prop="priority">
        <el-select v-model="form.priority" placeholder="Select priority">
          <el-option label="Low" value="low" />
          <el-option label="Normal" value="normal" />
          <el-option label="High" value="high" />
          <el-option label="Urgent" value="urgent" />
        </el-select>
      </el-form-item>

      <!-- Training Configuration -->
      <el-divider content-position="left">Training Configuration</el-divider>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="Epochs">
            <el-input-number
              v-model="form.epochs"
              :min="1"
              :max="1000"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="Batch Size">
            <el-input-number
              v-model="form.batchSize"
              :min="1"
              :max="512"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="Learning Rate">
            <el-input-number
              v-model="form.learningRate"
              :min="0.0001"
              :max="1"
              :step="0.0001"
              :precision="4"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="Validation Split">
            <el-input-number
              v-model="form.validationSplit"
              :min="0.1"
              :max="0.5"
              :step="0.1"
              :precision="1"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <!-- Advanced Options -->
      <el-collapse v-model="activeCollapse">
        <el-collapse-item title="Advanced Options" name="advanced">
          <el-form-item label="Early Stopping">
            <el-switch v-model="form.earlyStopping" />
            <div v-if="form.earlyStopping" style="margin-top: 8px;">
              <el-input-number
                v-model="form.patience"
                :min="1"
                :max="50"
                placeholder="Patience"
                style="width: 120px;"
              />
              <span style="margin-left: 8px; color: var(--el-text-color-regular);">epochs patience</span>
            </div>
          </el-form-item>

          <el-form-item label="Save Checkpoints">
            <el-switch v-model="form.saveCheckpoints" />
          </el-form-item>

          <el-form-item label="GPU Allocation">
            <el-select v-model="form.gpuCount" placeholder="Select GPU count">
              <el-option label="1 GPU" value="1" />
              <el-option label="2 GPUs" value="2" />
              <el-option label="4 GPUs" value="4" />
              <el-option label="Auto" value="auto" />
            </el-select>
          </el-form-item>

          <el-form-item label="Notifications">
            <el-checkbox-group v-model="form.notifications">
              <el-checkbox label="email">Email notifications</el-checkbox>
              <el-checkbox label="slack">Slack notifications</el-checkbox>
              <el-checkbox label="webhook">Webhook notifications</el-checkbox>
            </el-checkbox-group>
          </el-form-item>
        </el-collapse-item>
      </el-collapse>

      <!-- Resource Estimation -->
      <el-alert
        v-if="resourceEstimate"
        :title="resourceEstimate.title"
        :description="resourceEstimate.description"
        type="info"
        show-icon
        :closable="false"
        style="margin-top: 16px;"
      />
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">Cancel</el-button>
        <el-button
          type="primary"
          @click="handleStart"
          :loading="starting"
        >
          {{ starting ? 'Starting...' : 'Start Training' }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'

const props = defineProps({
  modelValue: Boolean
})

const emit = defineEmits(['update:modelValue', 'started'])

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const formRef = ref()
const starting = ref(false)
const activeCollapse = ref([])

const form = ref({
  name: '',
  modelId: null,
  datasetId: null,
  priority: 'normal',
  epochs: 10,
  batchSize: 32,
  learningRate: 0.001,
  validationSplit: 0.2,
  earlyStopping: true,
  patience: 5,
  saveCheckpoints: true,
  gpuCount: '1',
  notifications: ['email']
})

const rules = {
  name: [
    { required: true, message: 'Please enter job name', trigger: 'blur' }
  ],
  modelId: [
    { required: true, message: 'Please select a model', trigger: 'change' }
  ],
  datasetId: [
    { required: true, message: 'Please select a dataset', trigger: 'change' }
  ],
  priority: [
    { required: true, message: 'Please select priority', trigger: 'change' }
  ]
}

const availableModels = ref([
  {
    id: 1,
    name: 'Sentiment Analyzer',
    type: 'Text Classification',
    status: 'draft'
  },
  {
    id: 2,
    name: 'Product Classifier',
    type: 'Image Classification',
    status: 'draft'
  },
  {
    id: 3,
    name: 'Sales Predictor',
    type: 'Regression',
    status: 'draft'
  }
])

const availableDatasets = ref([
  {
    id: 1,
    name: 'Customer Reviews',
    samples: 50000,
    type: 'text'
  },
  {
    id: 2,
    name: 'Product Images',
    samples: 25000,
    type: 'image'
  },
  {
    id: 3,
    name: 'Sales Data',
    samples: 100000,
    type: 'tabular'
  }
])

const resourceEstimate = computed(() => {
  if (!form.value.modelId || !form.value.datasetId) return null
  
  const model = availableModels.value.find(m => m.id === form.value.modelId)
  const dataset = availableDatasets.value.find(d => d.id === form.value.datasetId)
  
  if (!model || !dataset) return null
  
  const estimatedTime = Math.ceil((dataset.samples * form.value.epochs) / (form.value.batchSize * 1000))
  const gpuHours = estimatedTime * parseInt(form.value.gpuCount || '1')
  
  return {
    title: `Estimated Training Time: ${estimatedTime} hours`,
    description: `Using ${form.value.gpuCount} GPU(s) • ${gpuHours} GPU hours • ~$${(gpuHours * 2.5).toFixed(2)} estimated cost`
  }
})

// Auto-generate job name when model and dataset are selected
watch([() => form.value.modelId, () => form.value.datasetId], ([modelId, datasetId]) => {
  if (modelId && datasetId && !form.value.name) {
    const model = availableModels.value.find(m => m.id === modelId)
    const dataset = availableDatasets.value.find(d => d.id === datasetId)
    if (model && dataset) {
      form.value.name = `${model.name} - ${dataset.name} Training`
    }
  }
})

const handleStart = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    starting.value = true

    // Simulate job creation
    await new Promise(resolve => setTimeout(resolve, 1500))

    const model = availableModels.value.find(m => m.id === form.value.modelId)
    const dataset = availableDatasets.value.find(d => d.id === form.value.datasetId)

    const jobData = {
      name: form.value.name,
      model: model.name,
      dataset: dataset.name,
      totalEpochs: form.value.epochs,
      eta: resourceEstimate.value?.title.match(/\d+/)?.[0] + 'h 0m' || '2h 30m',
      hyperparameters: {
        learningRate: form.value.learningRate,
        batchSize: form.value.batchSize,
        epochs: form.value.epochs,
        validationSplit: form.value.validationSplit
      },
      priority: form.value.priority
    }

    emit('started', jobData)
    handleClose()
    
    ElMessage.success('Training job started successfully!')
  } catch (error) {
    ElMessage.error('Please fill in all required fields')
  } finally {
    starting.value = false
  }
}

const handleClose = () => {
  if (!starting.value) {
    dialogVisible.value = false
    resetForm()
  }
}

const resetForm = () => {
  if (formRef.value) {
    formRef.value.resetFields()
  }
  form.value = {
    name: '',
    modelId: null,
    datasetId: null,
    priority: 'normal',
    epochs: 10,
    batchSize: 32,
    learningRate: 0.001,
    validationSplit: 0.2,
    earlyStopping: true,
    patience: 5,
    saveCheckpoints: true,
    gpuCount: '1',
    notifications: ['email']
  }
}
</script>

<style scoped>
.model-option,
.dataset-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.model-name,
.dataset-name {
  font-weight: 500;
}

.model-type,
.dataset-size {
  font-size: 12px;
  color: var(--el-text-color-regular);
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.el-divider {
  margin: 24px 0 16px 0;
}
</style>

