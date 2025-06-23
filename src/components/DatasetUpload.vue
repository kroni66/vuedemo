<template>
  <el-dialog
    v-model="dialogVisible"
    title="Upload Dataset"
    width="600px"
    :before-close="handleClose"
  >
    <el-form :model="form" :rules="rules" ref="formRef" label-width="120px">
      <el-form-item label="Dataset Name" prop="name">
        <el-input v-model="form.name" placeholder="Enter dataset name" />
      </el-form-item>

      <el-form-item label="Description" prop="description">
        <el-input
          v-model="form.description"
          type="textarea"
          :rows="3"
          placeholder="Describe your dataset"
        />
      </el-form-item>

      <el-form-item label="Dataset Type" prop="type">
        <el-select v-model="form.type" placeholder="Select dataset type">
          <el-option label="Text" value="text" />
          <el-option label="Image" value="image" />
          <el-option label="Tabular" value="tabular" />
          <el-option label="Audio" value="audio" />
        </el-select>
      </el-form-item>

      <el-form-item label="Files" prop="files">
        <div class="upload-area">
          <el-upload
            ref="uploadRef"
            class="upload-dragger"
            drag
            :multiple="true"
            :auto-upload="false"
            :on-change="handleFileChange"
            :on-remove="handleFileRemove"
            :accept="getAcceptedFileTypes()"
          >
            <el-icon class="el-icon--upload"><upload-filled /></el-icon>
            <div class="el-upload__text">
              Drop files here or <em>click to upload</em>
            </div>
            <template #tip>
              <div class="el-upload__tip">
                {{ getUploadTip() }}
              </div>
            </template>
          </el-upload>
        </div>
      </el-form-item>

      <!-- File List -->
      <div v-if="fileList.length > 0" class="file-list">
        <h4>Selected Files ({{ fileList.length }})</h4>
        <div class="file-items">
          <div v-for="file in fileList" :key="file.uid" class="file-item">
            <div class="file-info">
              <el-icon><Document /></el-icon>
              <span class="file-name">{{ file.name }}</span>
              <span class="file-size">{{ formatFileSize(file.size) }}</span>
            </div>
            <el-button
              size="small"
              type="danger"
              text
              @click="removeFile(file)"
            >
              <el-icon><Delete /></el-icon>
            </el-button>
          </div>
        </div>
        <div class="total-size">
          Total size: {{ formatFileSize(totalSize) }}
        </div>
      </div>

      <!-- Advanced Options -->
      <el-collapse v-model="activeCollapse">
        <el-collapse-item title="Advanced Options" name="advanced">
          <el-form-item label="Split Ratio">
            <el-row :gutter="16">
              <el-col :span="8">
                <el-input-number
                  v-model="form.trainSplit"
                  :min="0.1"
                  :max="0.9"
                  :step="0.1"
                  :precision="1"
                />
                <div class="split-label">Train</div>
              </el-col>
              <el-col :span="8">
                <el-input-number
                  v-model="form.validationSplit"
                  :min="0.1"
                  :max="0.9"
                  :step="0.1"
                  :precision="1"
                />
                <div class="split-label">Validation</div>
              </el-col>
              <el-col :span="8">
                <el-input-number
                  v-model="form.testSplit"
                  :min="0.0"
                  :max="0.5"
                  :step="0.1"
                  :precision="1"
                />
                <div class="split-label">Test</div>
              </el-col>
            </el-row>
          </el-form-item>

          <el-form-item label="Preprocessing">
            <el-checkbox-group v-model="form.preprocessing">
              <el-checkbox label="normalize">Normalize data</el-checkbox>
              <el-checkbox label="remove_duplicates">Remove duplicates</el-checkbox>
              <el-checkbox label="handle_missing">Handle missing values</el-checkbox>
            </el-checkbox-group>
          </el-form-item>
        </el-collapse-item>
      </el-collapse>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">Cancel</el-button>
        <el-button
          type="primary"
          @click="handleUpload"
          :loading="uploading"
          :disabled="fileList.length === 0"
        >
          {{ uploading ? 'Uploading...' : 'Upload Dataset' }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { UploadFilled, Document, Delete } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const props = defineProps({
  modelValue: Boolean
})

const emit = defineEmits(['update:modelValue', 'uploaded'])

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const formRef = ref()
const uploadRef = ref()
const uploading = ref(false)
const activeCollapse = ref([])

const form = ref({
  name: '',
  description: '',
  type: '',
  files: [],
  trainSplit: 0.7,
  validationSplit: 0.2,
  testSplit: 0.1,
  preprocessing: []
})

const fileList = ref([])

const rules = {
  name: [
    { required: true, message: 'Please enter dataset name', trigger: 'blur' }
  ],
  description: [
    { required: true, message: 'Please enter description', trigger: 'blur' }
  ],
  type: [
    { required: true, message: 'Please select dataset type', trigger: 'change' }
  ]
}

const totalSize = computed(() => {
  return fileList.value.reduce((total, file) => total + file.size, 0)
})

// Watch for split ratio changes to ensure they sum to 1.0
watch([() => form.value.trainSplit, () => form.value.validationSplit], ([train, validation]) => {
  form.value.testSplit = Math.max(0, 1 - train - validation)
})

const getAcceptedFileTypes = () => {
  const typeMap = {
    text: '.txt,.csv,.json,.tsv',
    image: '.jpg,.jpeg,.png,.gif,.bmp,.webp',
    tabular: '.csv,.xlsx,.json,.parquet',
    audio: '.wav,.mp3,.flac,.ogg'
  }
  return typeMap[form.value.type] || '*'
}

const getUploadTip = () => {
  const tipMap = {
    text: 'Supported formats: TXT, CSV, JSON, TSV',
    image: 'Supported formats: JPG, PNG, GIF, BMP, WebP',
    tabular: 'Supported formats: CSV, Excel, JSON, Parquet',
    audio: 'Supported formats: WAV, MP3, FLAC, OGG'
  }
  return tipMap[form.value.type] || 'Select dataset type first'
}

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const handleFileChange = (file, files) => {
  fileList.value = files
}

const handleFileRemove = (file, files) => {
  fileList.value = files
}

const removeFile = (file) => {
  const index = fileList.value.findIndex(f => f.uid === file.uid)
  if (index > -1) {
    fileList.value.splice(index, 1)
    uploadRef.value.handleRemove(file)
  }
}

const handleUpload = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    
    if (fileList.value.length === 0) {
      ElMessage.warning('Please select at least one file')
      return
    }

    uploading.value = true

    // Simulate upload process
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Create new dataset object
    const newDataset = {
      id: Date.now(),
      name: form.value.name,
      description: form.value.description,
      type: form.value.type,
      status: 'processing',
      size: formatFileSize(totalSize.value),
      samples: Math.floor(Math.random() * 100000) + 1000,
      createdAt: new Date(),
      progress: 0
    }

    emit('uploaded', newDataset)
    handleClose()
    
    ElMessage.success('Dataset upload started successfully!')
  } catch (error) {
    ElMessage.error('Upload failed. Please try again.')
  } finally {
    uploading.value = false
  }
}

const handleClose = () => {
  if (!uploading.value) {
    dialogVisible.value = false
    resetForm()
  }
}

const resetForm = () => {
  if (formRef.value) {
    formRef.value.resetFields()
  }
  fileList.value = []
  form.value = {
    name: '',
    description: '',
    type: '',
    files: [],
    trainSplit: 0.7,
    validationSplit: 0.2,
    testSplit: 0.1,
    preprocessing: []
  }
}
</script>

<style scoped>
.upload-area {
  width: 100%;
}

.upload-dragger {
  width: 100%;
}

.file-list {
  margin-top: 16px;
  padding: 16px;
  background: var(--el-bg-color-page);
  border-radius: 6px;
}

.file-list h4 {
  margin: 0 0 12px 0;
  color: var(--el-text-color-primary);
}

.file-items {
  max-height: 200px;
  overflow-y: auto;
}

.file-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.file-item:last-child {
  border-bottom: none;
}

.file-info {
  display: flex;
  align-items: center;
  flex: 1;
  gap: 8px;
}

.file-name {
  flex: 1;
  font-weight: 500;
}

.file-size {
  color: var(--el-text-color-regular);
  font-size: 12px;
}

.total-size {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--el-border-color-lighter);
  font-weight: 500;
  text-align: right;
}

.split-label {
  text-align: center;
  font-size: 12px;
  color: var(--el-text-color-regular);
  margin-top: 4px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>

