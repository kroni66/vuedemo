<template>
  <div class="evaluation">
    <div class="page-header">
      <div class="header-content">
        <h1>Model Evaluation</h1>
        <p>Test and evaluate your trained models</p>
      </div>
    </div>

    <!-- Model Selection -->
    <el-card class="model-selection-card">
      <template #header>
        <h3>Select Model to Evaluate</h3>
      </template>
      <el-row :gutter="20">
        <el-col :span="8">
          <el-select v-model="selectedModel" placeholder="Choose a trained model" style="width: 100%">
            <el-option
              v-for="model in trainedModels"
              :key="model.id"
              :label="model.name"
              :value="model.id"
            >
              <div class="model-option">
                <span class="model-name">{{ model.name }}</span>
                <span class="model-accuracy">{{ model.accuracy }}% accuracy</span>
              </div>
            </el-option>
          </el-select>
        </el-col>
        <el-col :span="8">
          <el-select v-model="selectedDataset" placeholder="Choose test dataset" style="width: 100%">
            <el-option
              v-for="dataset in testDatasets"
              :key="dataset.id"
              :label="dataset.name"
              :value="dataset.id"
            />
          </el-select>
        </el-col>
        <el-col :span="8">
          <el-button 
            type="primary" 
            @click="runEvaluation" 
            :disabled="!selectedModel || !selectedDataset"
            :loading="evaluating"
          >
            <el-icon><DataAnalysis /></el-icon>
            {{ evaluating ? 'Evaluating...' : 'Run Evaluation' }}
          </el-button>
        </el-col>
      </el-row>
    </el-card>

    <!-- Quick Test -->
    <el-card v-if="selectedModel" class="quick-test-card">
      <template #header>
        <h3>Quick Test</h3>
      </template>
      <div class="test-interface">
        <el-row :gutter="20">
          <el-col :span="12">
            <div class="input-section">
              <h4>Input</h4>
              <div v-if="getModelType(selectedModel) === 'text'">
                <el-input
                  v-model="testInput.text"
                  type="textarea"
                  :rows="4"
                  placeholder="Enter text to classify..."
                />
              </div>
              <div v-else-if="getModelType(selectedModel) === 'image'">
                <el-upload
                  class="image-uploader"
                  :show-file-list="false"
                  :on-change="handleImageUpload"
                  :auto-upload="false"
                  accept="image/*"
                >
                  <img v-if="testInput.imageUrl" :src="testInput.imageUrl" class="uploaded-image" />
                  <el-icon v-else class="uploader-icon"><Plus /></el-icon>
                </el-upload>
              </div>
              <div v-else-if="getModelType(selectedModel) === 'tabular'">
                <el-form :model="testInput.tabular" label-width="100px">
                  <el-form-item v-for="field in tabularFields" :key="field.name" :label="field.label">
                    <el-input-number
                      v-if="field.type === 'number'"
                      v-model="testInput.tabular[field.name]"
                      style="width: 100%"
                    />
                    <el-input
                      v-else
                      v-model="testInput.tabular[field.name]"
                    />
                  </el-form-item>
                </el-form>
              </div>
              <el-button 
                type="primary" 
                @click="runQuickTest" 
                :loading="testing"
                style="margin-top: 16px;"
              >
                {{ testing ? 'Predicting...' : 'Predict' }}
              </el-button>
            </div>
          </el-col>
          <el-col :span="12">
            <div class="output-section">
              <h4>Prediction Result</h4>
              <div v-if="predictionResult" class="prediction-result">
                <div class="prediction-main">
                  <span class="prediction-label">{{ predictionResult.label }}</span>
                  <span class="prediction-confidence">{{ predictionResult.confidence }}%</span>
                </div>
                <div class="prediction-details">
                  <div v-for="item in predictionResult.details" :key="item.label" class="detail-item">
                    <span class="detail-label">{{ item.label }}</span>
                    <el-progress :percentage="item.probability" :show-text="false" />
                    <span class="detail-value">{{ item.probability }}%</span>
                  </div>
                </div>
              </div>
              <div v-else class="no-prediction">
                <el-empty description="No prediction yet" :image-size="80" />
              </div>
            </div>
          </el-col>
        </el-row>
      </div>
    </el-card>

    <!-- Evaluation Results -->
    <el-card v-if="evaluationResults" class="results-card">
      <template #header>
        <div class="card-header">
          <h3>Evaluation Results</h3>
          <div class="result-meta">
            <el-tag>{{ evaluationResults.modelName }}</el-tag>
            <span>•</span>
            <span>{{ evaluationResults.testSamples }} test samples</span>
            <span>•</span>
            <span>{{ evaluationResults.evaluatedAt }}</span>
          </div>
        </div>
      </template>

      <el-row :gutter="20">
        <!-- Metrics Overview -->
        <el-col :span="8">
          <div class="metrics-overview">
            <h4>Performance Metrics</h4>
            <div class="metric-cards">
              <div class="metric-card">
                <div class="metric-value">{{ evaluationResults.accuracy }}%</div>
                <div class="metric-label">Accuracy</div>
              </div>
              <div class="metric-card">
                <div class="metric-value">{{ evaluationResults.precision }}%</div>
                <div class="metric-label">Precision</div>
              </div>
              <div class="metric-card">
                <div class="metric-value">{{ evaluationResults.recall }}%</div>
                <div class="metric-label">Recall</div>
              </div>
              <div class="metric-card">
                <div class="metric-value">{{ evaluationResults.f1Score }}%</div>
                <div class="metric-label">F1 Score</div>
              </div>
            </div>
          </div>
        </el-col>

        <!-- Confusion Matrix -->
        <el-col :span="8">
          <div class="confusion-matrix">
            <h4>Confusion Matrix</h4>
            <div class="matrix-container">
              <table class="matrix-table">
                <thead>
                  <tr>
                    <th></th>
                    <th v-for="label in evaluationResults.labels" :key="label">{{ label }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(row, i) in evaluationResults.confusionMatrix" :key="i">
                    <th>{{ evaluationResults.labels[i] }}</th>
                    <td v-for="(value, j) in row" :key="j" :class="{ 'diagonal': i === j }">
                      {{ value }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </el-col>

        <!-- ROC Curve -->
        <el-col :span="8">
          <div class="roc-curve">
            <h4>ROC Curve</h4>
            <div class="chart-container">
              <div class="roc-placeholder">
                <div class="roc-line"></div>
                <div class="auc-score">AUC: {{ evaluationResults.auc }}</div>
              </div>
            </div>
          </div>
        </el-col>
      </el-row>

      <!-- Detailed Results -->
      <el-divider />
      <div class="detailed-results">
        <h4>Classification Report</h4>
        <el-table :data="evaluationResults.classificationReport" style="width: 100%">
          <el-table-column prop="class" label="Class" width="150" />
          <el-table-column prop="precision" label="Precision" width="120">
            <template #default="scope">
              {{ scope.row.precision }}%
            </template>
          </el-table-column>
          <el-table-column prop="recall" label="Recall" width="120">
            <template #default="scope">
              {{ scope.row.recall }}%
            </template>
          </el-table-column>
          <el-table-column prop="f1Score" label="F1-Score" width="120">
            <template #default="scope">
              {{ scope.row.f1Score }}%
            </template>
          </el-table-column>
          <el-table-column prop="support" label="Support" width="120" />
        </el-table>
      </div>

      <!-- Export Options -->
      <el-divider />
      <div class="export-options">
        <h4>Export Results</h4>
        <div class="export-buttons">
          <el-button @click="exportResults('pdf')">
            <el-icon><Document /></el-icon>
            Export PDF Report
          </el-button>
          <el-button @click="exportResults('csv')">
            <el-icon><Download /></el-icon>
            Export CSV Data
          </el-button>
          <el-button @click="exportResults('json')">
            <el-icon><Download /></el-icon>
            Export JSON
          </el-button>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { DataAnalysis, Plus, Document, Download } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const selectedModel = ref(null)
const selectedDataset = ref(null)
const evaluating = ref(false)
const testing = ref(false)
const predictionResult = ref(null)
const evaluationResults = ref(null)

const testInput = ref({
  text: '',
  imageUrl: '',
  tabular: {}
})

const trainedModels = ref([
  {
    id: 1,
    name: 'Sentiment Analyzer',
    type: 'text_classification',
    accuracy: 94.2
  },
  {
    id: 2,
    name: 'Product Classifier',
    type: 'image_classification',
    accuracy: 89.7
  },
  {
    id: 3,
    name: 'Sales Predictor',
    type: 'regression',
    accuracy: 87.3
  }
])

const testDatasets = ref([
  { id: 1, name: 'Test Reviews Dataset' },
  { id: 2, name: 'Validation Images' },
  { id: 3, name: 'Test Sales Data' }
])

const tabularFields = ref([
  { name: 'age', label: 'Age', type: 'number' },
  { name: 'income', label: 'Income', type: 'number' },
  { name: 'experience', label: 'Experience', type: 'number' },
  { name: 'location', label: 'Location', type: 'text' }
])

const getModelType = (modelId) => {
  const model = trainedModels.value.find(m => m.id === modelId)
  return model?.type?.split('_')[0] || 'text'
}

const handleImageUpload = (file) => {
  const reader = new FileReader()
  reader.onload = (e) => {
    testInput.value.imageUrl = e.target.result
  }
  reader.readAsDataURL(file.raw)
}

const runQuickTest = async () => {
  testing.value = true
  
  // Simulate prediction
  await new Promise(resolve => setTimeout(resolve, 1500))
  
  const modelType = getModelType(selectedModel.value)
  
  if (modelType === 'text') {
    predictionResult.value = {
      label: 'Positive',
      confidence: 87.3,
      details: [
        { label: 'Positive', probability: 87.3 },
        { label: 'Neutral', probability: 8.9 },
        { label: 'Negative', probability: 3.8 }
      ]
    }
  } else if (modelType === 'image') {
    predictionResult.value = {
      label: 'Electronics',
      confidence: 92.1,
      details: [
        { label: 'Electronics', probability: 92.1 },
        { label: 'Clothing', probability: 4.2 },
        { label: 'Home & Garden', probability: 3.7 }
      ]
    }
  } else {
    predictionResult.value = {
      label: '$45,230',
      confidence: 89.5,
      details: [
        { label: 'Predicted Value', probability: 89.5 },
        { label: 'Confidence Interval', probability: 85.2 }
      ]
    }
  }
  
  testing.value = false
  ElMessage.success('Prediction completed!')
}

const runEvaluation = async () => {
  evaluating.value = true
  
  // Simulate evaluation
  await new Promise(resolve => setTimeout(resolve, 3000))
  
  evaluationResults.value = {
    modelName: trainedModels.value.find(m => m.id === selectedModel.value)?.name,
    testSamples: 2500,
    evaluatedAt: new Date().toLocaleString(),
    accuracy: 94.2,
    precision: 93.8,
    recall: 94.6,
    f1Score: 94.2,
    auc: 0.97,
    labels: ['Positive', 'Neutral', 'Negative'],
    confusionMatrix: [
      [850, 45, 15],
      [32, 780, 28],
      [18, 22, 710]
    ],
    classificationReport: [
      { class: 'Positive', precision: 94.4, recall: 93.4, f1Score: 93.9, support: 910 },
      { class: 'Neutral', precision: 92.1, recall: 92.9, f1Score: 92.5, support: 840 },
      { class: 'Negative', precision: 94.3, recall: 94.7, f1Score: 94.5, support: 750 }
    ]
  }
  
  evaluating.value = false
  ElMessage.success('Evaluation completed!')
}

const exportResults = (format) => {
  ElMessage.success(`Exporting results as ${format.toUpperCase()}...`)
}
</script>

<style scoped>
.evaluation {
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 24px;
}

.page-header h1 {
  margin: 0 0 8px 0;
}

.page-header p {
  margin: 0;
  color: var(--el-text-color-regular);
}

.model-selection-card,
.quick-test-card,
.results-card {
  margin-bottom: 24px;
}

.model-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.model-name {
  font-weight: 500;
}

.model-accuracy {
  font-size: 12px;
  color: var(--el-text-color-regular);
}

.test-interface {
  margin-top: 16px;
}

.input-section,
.output-section {
  height: 100%;
}

.input-section h4,
.output-section h4 {
  margin: 0 0 16px 0;
  color: var(--el-text-color-primary);
}

.image-uploader {
  border: 2px dashed var(--el-border-color);
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: border-color 0.3s;
}

.image-uploader:hover {
  border-color: var(--el-color-primary);
}

.uploader-icon {
  font-size: 28px;
  color: var(--el-text-color-placeholder);
  width: 200px;
  height: 150px;
  line-height: 150px;
  text-align: center;
}

.uploaded-image {
  width: 200px;
  height: 150px;
  object-fit: cover;
  display: block;
}

.prediction-result {
  padding: 16px;
  border: 1px solid var(--el-border-color);
  border-radius: 8px;
  background: var(--el-bg-color-page);
}

.prediction-main {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.prediction-label {
  font-size: 18px;
  font-weight: bold;
  color: var(--el-color-primary);
}

.prediction-confidence {
  font-size: 16px;
  font-weight: 500;
  color: var(--el-color-success);
}

.prediction-details {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.detail-label {
  width: 80px;
  font-size: 14px;
}

.detail-value {
  width: 50px;
  font-size: 12px;
  text-align: right;
}

.no-prediction {
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h3 {
  margin: 0;
}

.result-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: var(--el-text-color-regular);
}

.metrics-overview h4,
.confusion-matrix h4,
.roc-curve h4 {
  margin: 0 0 16px 0;
}

.metric-cards {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.metric-card {
  text-align: center;
  padding: 16px;
  border: 1px solid var(--el-border-color);
  border-radius: 8px;
  background: var(--el-bg-color-page);
}

.metric-value {
  font-size: 24px;
  font-weight: bold;
  color: var(--el-color-primary);
  margin-bottom: 4px;
}

.metric-label {
  font-size: 12px;
  color: var(--el-text-color-regular);
}

.matrix-container {
  overflow-x: auto;
}

.matrix-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.matrix-table th,
.matrix-table td {
  padding: 8px;
  text-align: center;
  border: 1px solid var(--el-border-color);
}

.matrix-table th {
  background: var(--el-bg-color-page);
  font-weight: 500;
}

.matrix-table td.diagonal {
  background: var(--el-color-success-light-9);
  font-weight: bold;
}

.chart-container {
  height: 200px;
  position: relative;
}

.roc-placeholder {
  width: 100%;
  height: 100%;
  background: var(--el-bg-color-page);
  border-radius: 8px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.roc-line {
  width: 80%;
  height: 2px;
  background: linear-gradient(45deg, var(--el-color-primary), var(--el-color-success));
  transform: rotate(45deg);
}

.auc-score {
  position: absolute;
  bottom: 16px;
  right: 16px;
  font-size: 12px;
  font-weight: bold;
  color: var(--el-text-color-primary);
}

.detailed-results h4 {
  margin: 0 0 16px 0;
}

.export-options h4 {
  margin: 0 0 16px 0;
}

.export-buttons {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}
</style>

