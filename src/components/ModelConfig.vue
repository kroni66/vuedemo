<template>
  <el-dialog
    v-model="dialogVisible"
    :title="isEditing ? 'Edit Model' : 'Create New Model'"
    width="700px"
    :before-close="handleClose"
  >
    <el-form :model="form" :rules="rules" ref="formRef" label-width="140px">
      <el-form-item label="Model Name" prop="name">
        <el-input v-model="form.name" placeholder="Enter model name" />
      </el-form-item>

      <el-form-item label="Description" prop="description">
        <el-input
          v-model="form.description"
          type="textarea"
          :rows="3"
          placeholder="Describe your model"
        />
      </el-form-item>

      <el-form-item label="Task Type" prop="type">
        <el-select v-model="form.type" placeholder="Select task type" @change="handleTypeChange">
          <el-option label="Text Classification" value="text_classification" />
          <el-option label="Image Classification" value="image_classification" />
          <el-option label="Regression" value="regression" />
          <el-option label="Object Detection" value="object_detection" />
          <el-option label="Named Entity Recognition" value="ner" />
          <el-option label="Sentiment Analysis" value="sentiment_analysis" />
        </el-select>
      </el-form-item>

      <el-form-item label="Architecture" prop="architecture">
        <el-select v-model="form.architecture" placeholder="Select architecture">
          <el-option
            v-for="arch in availableArchitectures"
            :key="arch.value"
            :label="arch.label"
            :value="arch.value"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="Dataset" prop="dataset">
        <el-select v-model="form.dataset" placeholder="Select dataset">
          <el-option
            v-for="dataset in availableDatasets"
            :key="dataset.id"
            :label="dataset.name"
            :value="dataset.name"
          />
        </el-select>
      </el-form-item>

      <!-- Hyperparameters Section -->
      <el-divider content-position="left">Hyperparameters</el-divider>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="Learning Rate">
            <el-input-number
              v-model="form.hyperparameters.learningRate"
              :min="0.0001"
              :max="1"
              :step="0.0001"
              :precision="4"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="Batch Size">
            <el-input-number
              v-model="form.hyperparameters.batchSize"
              :min="1"
              :max="512"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="Epochs">
            <el-input-number
              v-model="form.hyperparameters.epochs"
              :min="1"
              :max="1000"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="Validation Split">
            <el-input-number
              v-model="form.hyperparameters.validationSplit"
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
        <el-collapse-item title="Advanced Configuration" name="advanced">
          <el-form-item label="Optimizer">
            <el-select v-model="form.advanced.optimizer" placeholder="Select optimizer">
              <el-option label="Adam" value="adam" />
              <el-option label="SGD" value="sgd" />
              <el-option label="RMSprop" value="rmsprop" />
              <el-option label="AdamW" value="adamw" />
            </el-select>
          </el-form-item>

          <el-form-item label="Loss Function">
            <el-select v-model="form.advanced.lossFunction" placeholder="Select loss function">
              <el-option
                v-for="loss in availableLossFunctions"
                :key="loss.value"
                :label="loss.label"
                :value="loss.value"
              />
            </el-select>
          </el-form-item>

          <el-form-item label="Regularization">
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Dropout Rate">
                  <el-input-number
                    v-model="form.advanced.dropoutRate"
                    :min="0"
                    :max="0.9"
                    :step="0.1"
                    :precision="1"
                    style="width: 100%"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Weight Decay">
                  <el-input-number
                    v-model="form.advanced.weightDecay"
                    :min="0"
                    :max="0.1"
                    :step="0.001"
                    :precision="3"
                    style="width: 100%"
                  />
                </el-form-item>
              </el-col>
            </el-row>
          </el-form-item>

          <el-form-item label="Early Stopping">
            <el-switch v-model="form.advanced.earlyStopping" />
            <div v-if="form.advanced.earlyStopping" style="margin-top: 8px;">
              <el-input-number
                v-model="form.advanced.patience"
                :min="1"
                :max="50"
                placeholder="Patience"
                style="width: 120px;"
              />
              <span style="margin-left: 8px; color: var(--el-text-color-regular);">epochs patience</span>
            </div>
          </el-form-item>

          <el-form-item label="Data Augmentation">
            <el-checkbox-group v-model="form.advanced.dataAugmentation">
              <el-checkbox v-if="isImageTask" label="rotation">Rotation</el-checkbox>
              <el-checkbox v-if="isImageTask" label="flip">Horizontal Flip</el-checkbox>
              <el-checkbox v-if="isImageTask" label="zoom">Random Zoom</el-checkbox>
              <el-checkbox v-if="isTextTask" label="synonym">Synonym Replacement</el-checkbox>
              <el-checkbox v-if="isTextTask" label="backtranslation">Back Translation</el-checkbox>
            </el-checkbox-group>
          </el-form-item>
        </el-collapse-item>
      </el-collapse>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">Cancel</el-button>
        <el-button type="primary" @click="handleSave" :loading="saving">
          {{ saving ? 'Saving...' : (isEditing ? 'Update Model' : 'Create Model') }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'

const props = defineProps({
  modelValue: Boolean,
  model: Object
})

const emit = defineEmits(['update:modelValue', 'saved'])

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const formRef = ref()
const saving = ref(false)
const activeCollapse = ref([])

const isEditing = computed(() => props.model && props.model.id)

const form = ref({
  name: '',
  description: '',
  type: '',
  architecture: '',
  dataset: '',
  hyperparameters: {
    learningRate: 0.001,
    batchSize: 32,
    epochs: 10,
    validationSplit: 0.2
  },
  advanced: {
    optimizer: 'adam',
    lossFunction: '',
    dropoutRate: 0.1,
    weightDecay: 0.01,
    earlyStopping: true,
    patience: 5,
    dataAugmentation: []
  }
})

const rules = {
  name: [
    { required: true, message: 'Please enter model name', trigger: 'blur' }
  ],
  description: [
    { required: true, message: 'Please enter description', trigger: 'blur' }
  ],
  type: [
    { required: true, message: 'Please select task type', trigger: 'change' }
  ],
  architecture: [
    { required: true, message: 'Please select architecture', trigger: 'change' }
  ],
  dataset: [
    { required: true, message: 'Please select dataset', trigger: 'change' }
  ]
}

const architectureMap = {
  text_classification: [
    { label: 'BERT Base', value: 'bert-base-uncased' },
    { label: 'BERT Large', value: 'bert-large-uncased' },
    { label: 'RoBERTa Base', value: 'roberta-base' },
    { label: 'DistilBERT', value: 'distilbert-base-uncased' }
  ],
  image_classification: [
    { label: 'ResNet-50', value: 'resnet50' },
    { label: 'ResNet-101', value: 'resnet101' },
    { label: 'EfficientNet-B0', value: 'efficientnet-b0' },
    { label: 'Vision Transformer', value: 'vit-base-patch16' }
  ],
  regression: [
    { label: 'XGBoost', value: 'xgboost' },
    { label: 'Random Forest', value: 'random_forest' },
    { label: 'Linear Regression', value: 'linear_regression' },
    { label: 'Neural Network', value: 'mlp_regressor' }
  ],
  object_detection: [
    { label: 'YOLO v8', value: 'yolov8' },
    { label: 'Faster R-CNN', value: 'faster_rcnn' },
    { label: 'SSD MobileNet', value: 'ssd_mobilenet' }
  ],
  ner: [
    { label: 'BERT NER', value: 'bert-base-ner' },
    { label: 'SpaCy NER', value: 'spacy-ner' },
    { label: 'BiLSTM-CRF', value: 'bilstm-crf' }
  ],
  sentiment_analysis: [
    { label: 'BERT Sentiment', value: 'bert-base-sentiment' },
    { label: 'RoBERTa Sentiment', value: 'roberta-sentiment' },
    { label: 'VADER', value: 'vader' }
  ]
}

const lossFunctionMap = {
  text_classification: [
    { label: 'Cross Entropy', value: 'cross_entropy' },
    { label: 'Focal Loss', value: 'focal_loss' }
  ],
  image_classification: [
    { label: 'Cross Entropy', value: 'cross_entropy' },
    { label: 'Label Smoothing', value: 'label_smoothing' }
  ],
  regression: [
    { label: 'Mean Squared Error', value: 'mse' },
    { label: 'Mean Absolute Error', value: 'mae' },
    { label: 'Huber Loss', value: 'huber' }
  ],
  object_detection: [
    { label: 'YOLO Loss', value: 'yolo_loss' },
    { label: 'Focal Loss', value: 'focal_loss' }
  ]
}

const availableArchitectures = computed(() => {
  return architectureMap[form.value.type] || []
})

const availableLossFunctions = computed(() => {
  return lossFunctionMap[form.value.type] || []
})

const availableDatasets = ref([
  { id: 1, name: 'Customer Reviews', type: 'text' },
  { id: 2, name: 'Product Images', type: 'image' },
  { id: 3, name: 'Sales Data', type: 'tabular' },
  { id: 4, name: 'Audio Samples', type: 'audio' }
])

const isImageTask = computed(() => {
  return ['image_classification', 'object_detection'].includes(form.value.type)
})

const isTextTask = computed(() => {
  return ['text_classification', 'ner', 'sentiment_analysis'].includes(form.value.type)
})

// Watch for model prop changes
watch(() => props.model, (newModel) => {
  if (newModel) {
    Object.assign(form.value, {
      name: newModel.name || '',
      description: newModel.description || '',
      type: newModel.type || '',
      architecture: newModel.architecture || '',
      dataset: newModel.dataset || '',
      hyperparameters: {
        learningRate: 0.001,
        batchSize: 32,
        epochs: 10,
        validationSplit: 0.2,
        ...newModel.hyperparameters
      },
      advanced: {
        optimizer: 'adam',
        lossFunction: '',
        dropoutRate: 0.1,
        weightDecay: 0.01,
        earlyStopping: true,
        patience: 5,
        dataAugmentation: [],
        ...newModel.advanced
      }
    })
  }
}, { immediate: true })

const handleTypeChange = () => {
  // Reset architecture when type changes
  form.value.architecture = ''
  form.value.advanced.lossFunction = ''
  form.value.advanced.dataAugmentation = []
}

const handleSave = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    saving.value = true

    // Simulate save process
    await new Promise(resolve => setTimeout(resolve, 1000))

    const modelData = {
      ...form.value,
      id: props.model?.id
    }

    emit('saved', modelData)
    handleClose()
  } catch (error) {
    ElMessage.error('Please fill in all required fields')
  } finally {
    saving.value = false
  }
}

const handleClose = () => {
  if (!saving.value) {
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
    description: '',
    type: '',
    architecture: '',
    dataset: '',
    hyperparameters: {
      learningRate: 0.001,
      batchSize: 32,
      epochs: 10,
      validationSplit: 0.2
    },
    advanced: {
      optimizer: 'adam',
      lossFunction: '',
      dropoutRate: 0.1,
      weightDecay: 0.01,
      earlyStopping: true,
      patience: 5,
      dataAugmentation: []
    }
  }
}
</script>

<style scoped>
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.el-form-item {
  margin-bottom: 18px;
}

.el-divider {
  margin: 24px 0 16px 0;
}
</style>

