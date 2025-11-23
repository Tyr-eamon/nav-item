<template>
  <div class="settings-manage">
    <div class="manage-header">
      <h3>背景图片设置</h3>
    </div>
    
    <div class="settings-form">
      <div class="form-group">
        <label>背景图片URL</label>
        <input 
          v-model="backgroundImageUrl" 
          type="text" 
          placeholder="输入图片URL (如: https://example.com/image.png)"
          class="input"
        />
        <p class="help-text">请输入完整的图片URL地址</p>
      </div>

      <div class="preview-section">
        <label>图片预览</label>
        <div class="preview-container">
          <img 
            v-if="backgroundImageUrl && isValidUrl(backgroundImageUrl)" 
            :src="backgroundImageUrl" 
            alt="背景图片预览"
            class="preview-image"
            @error="previewError = true"
          />
          <div v-else-if="previewError" class="preview-error">
            图片加载失败，请检查URL是否正确
          </div>
          <div v-else class="preview-placeholder">
            输入图片URL后显示预览
          </div>
        </div>
      </div>

      <div class="button-group">
        <button @click="saveSettings" :disabled="loading || !backgroundImageUrl.trim()" class="btn btn-primary">
          {{ loading ? '保存中...' : '保存设置' }}
        </button>
        <button @click="resetForm" class="btn btn-secondary">
          重置
        </button>
      </div>

      <p v-if="message" :class="['message', messageType]">
        {{ message }}
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { getBackgroundImage, updateBackgroundImage } from '../../api';

const backgroundImageUrl = ref('');
const loading = ref(false);
const message = ref('');
const messageType = ref('');
const previewError = ref(false);

onMounted(async () => {
  try {
    const res = await getBackgroundImage();
    backgroundImageUrl.value = res.data.url || '';
  } catch (err) {
    console.error('获取背景图片设置失败:', err);
  }
});

function isValidUrl(str) {
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
}

async function saveSettings() {
  if (!backgroundImageUrl.value.trim()) {
    message.value = '请输入图片URL';
    messageType.value = 'error';
    return;
  }

  if (!isValidUrl(backgroundImageUrl.value)) {
    message.value = '请输入有效的URL地址';
    messageType.value = 'error';
    return;
  }

  loading.value = true;
  try {
    const res = await updateBackgroundImage(backgroundImageUrl.value);
    message.value = '背景图片URL已成功更新！';
    messageType.value = 'success';
    previewError.value = false;
  } catch (err) {
    console.error('更新背景图片失败:', err);
    message.value = '更新失败：' + (err.response?.data?.message || err.message);
    messageType.value = 'error';
  } finally {
    loading.value = false;
  }
}

async function resetForm() {
  try {
    const res = await getBackgroundImage();
    backgroundImageUrl.value = res.data.url || '';
  } catch (err) {
    console.error('获取背景图片设置失败:', err);
  }
  message.value = '';
  previewError.value = false;
}
</script>

<style scoped>
.settings-manage {
  background: white;
  border-radius: 8px;
  padding: 24px;
}

.manage-header {
  border-bottom: 1px solid #e0e0e0;
  padding-bottom: 16px;
  margin-bottom: 24px;
}

.manage-header h3 {
  margin: 0;
  font-size: 18px;
  color: #333;
}

.settings-form {
  max-width: 600px;
}

.form-group {
  margin-bottom: 24px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: #333;
  font-weight: 500;
  font-size: 14px;
}

.input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  font-family: inherit;
}

.input:focus {
  outline: none;
  border-color: #2566d8;
  box-shadow: 0 0 0 3px rgba(37, 102, 216, 0.1);
}

.help-text {
  margin: 8px 0 0 0;
  color: #999;
  font-size: 12px;
}

.preview-section {
  margin-bottom: 24px;
}

.preview-section label {
  display: block;
  margin-bottom: 8px;
  color: #333;
  font-weight: 500;
  font-size: 14px;
}

.preview-container {
  background: #f5f5f5;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
  height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.preview-placeholder {
  color: #999;
  text-align: center;
  font-size: 14px;
}

.preview-error {
  color: #d32f2f;
  text-align: center;
  font-size: 14px;
  padding: 20px;
}

.button-group {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
}

.btn {
  padding: 8px 24px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-primary {
  background: #2566d8;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #1e5bb8;
}

.btn-primary:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.btn-secondary {
  background: #f0f0f0;
  color: #333;
}

.btn-secondary:hover {
  background: #e0e0e0;
}

.message {
  padding: 12px 16px;
  border-radius: 4px;
  font-size: 14px;
  margin-top: 16px;
}

.message.success {
  background: #e8f5e9;
  color: #2e7d32;
  border: 1px solid #c8e6c9;
}

.message.error {
  background: #ffebee;
  color: #c62828;
  border: 1px solid #ffcdd2;
}
</style>
