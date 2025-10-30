// 全局变量
let selectedFile = null;
let resultData = null;
let selectedExtension = 'custom';
const API_BASE_URL = 'http://localhost:8080/api';

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    loadSavedKeys();
    checkServerStatus();
    setupEventListeners();
    
    // 默认显示idle.gif
    showStatusImage('idle');
});

function disableControls() {
    // 密钥配置 (输入框和随机生成按钮)
    document.getElementById('k1').disabled = true;
    document.getElementById('k2').disabled = true;
    document.getElementById('k3').disabled = true;
    document.getElementById('iv').disabled = true;
    // 假设“随机生成全部”是card-header中的唯一按钮
    const generateBtn = document.querySelector('.card-header button');
    if (generateBtn) generateBtn.disabled = true; 

    // 操作和内容类型选择 (Radio Buttons)
    document.querySelectorAll('input[name="operation"]').forEach(radio => radio.disabled = true);
    document.querySelectorAll('input[name="contentType"]').forEach(radio => radio.disabled = true);
    
    // 内容输入
    document.getElementById('inputText').disabled = true;
    document.getElementById('uploadArea').style.pointerEvents = 'none'; // 禁用文件上传区
    
    // 文件信息/移除文件按钮 (通过禁用父容器的pointerEvents实现)
    const fileInfo = document.getElementById('fileInfo');
    if (fileInfo.style.display !== 'none') fileInfo.style.pointerEvents = 'none';
    
    // 解密扩展名组 (Radio Buttons 和 Custom Input)
    const extensionGroup = document.getElementById('extensionGroup');
    extensionGroup.style.pointerEvents = 'none'; 
    
    // 主处理按钮 (将在处理函数中单独处理文本和loading状态)
    document.getElementById('processBtn').disabled = true;
}

function enableControls() {
    // 密钥配置
    document.getElementById('k1').disabled = false;
    document.getElementById('k2').disabled = false;
    document.getElementById('k3').disabled = false;
    document.getElementById('iv').disabled = false;
    const generateBtn = document.querySelector('.card-header button');
    if (generateBtn) generateBtn.disabled = false;
    
    // 操作和内容类型选择
    document.querySelectorAll('input[name="operation"]').forEach(radio => radio.disabled = false);
    document.querySelectorAll('input[name="contentType"]').forEach(radio => radio.disabled = false);
    
    // 内容输入
    document.getElementById('inputText').disabled = false;
    document.getElementById('uploadArea').style.pointerEvents = 'auto';
    
    // 文件信息/移除文件按钮
    const fileInfo = document.getElementById('fileInfo');
    fileInfo.style.pointerEvents = 'auto';

    // 解密扩展名组
    const extensionGroup = document.getElementById('extensionGroup');
    extensionGroup.style.pointerEvents = 'auto'; 
    
    // 主处理按钮
    document.getElementById('processBtn').disabled = false;
}

// 显示状态图片
function showStatusImage(state) {
    const container = document.getElementById('statusImageContainer');
    const img = document.getElementById('statusImage');
    
    const images = {
        idle: './assets/idle.gif',
        complete: './assets/finish.gif'
    };
    
    if (state === 'processing') {
        // 处理中时隐藏状态图片（进度卡片中已有gif）
        container.style.display = 'none';
    } else if (images[state]) {
        img.src = images[state];
        container.style.display = 'block';
    } else {
        container.style.display = 'none';
    }
}

// 初始化应用
function initializeApp() {
    console.log('✅ 3DES-CBC 加密工具已加载');
    
    // 初始化按钮文本（默认是加密模式）
    const operation = document.querySelector('input[name="operation"]:checked').value;
    const btnText = document.getElementById('btnText');
    btnText.textContent = operation === 'encrypt' ? '开始加密' : '开始解密';
}

// 加载保存的密钥
function loadSavedKeys() {
    const keys = ['k1', 'k2', 'k3', 'iv'];
    keys.forEach(key => {
        const saved = localStorage.getItem(key);
        if (saved) {
            document.getElementById(key).value = saved;
        }
    });
}

// 保存密钥
function saveKeys() {
    const keys = ['k1', 'k2', 'k3', 'iv'];
    keys.forEach(key => {
        const value = document.getElementById(key).value.trim();
        if (value) {
            localStorage.setItem(key, value);
        }
    });
}

// 检查服务器状态
async function checkServerStatus() {
    try {
        const response = await fetch(`${API_BASE_URL}/health`);
        const data = await response.json();
        
        if (data.success) {
            document.getElementById('serverStatus').textContent = '运行中 (localhost:8080)';
            document.getElementById('serverStatus').style.background = 'rgba(76, 175, 80, 0.3)';
        }
    } catch (error) {
        document.getElementById('serverStatus').textContent = '未连接';
        document.getElementById('serverStatus').style.background = 'rgba(244, 67, 54, 0.3)';
        console.error('❌ 服务器连接失败:', error);
    }
}

// 设置事件监听器
function setupEventListeners() {
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    
    uploadArea.addEventListener('click', () => fileInput.click());
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('dragleave', handleDragLeave);
    uploadArea.addEventListener('drop', handleDrop);
    fileInput.addEventListener('change', handleFileSelect);
    
    // 监听操作模式切换
    document.querySelectorAll('input[name="operation"]').forEach(radio => {
        radio.addEventListener('change', switchOperation);
    });
}

// 切换内容类型
function switchContentType() {
    const contentType = document.querySelector('input[name="contentType"]:checked').value;
    const fileSection = document.getElementById('fileSection');
    const textSection = document.getElementById('textSection');
    const extensionGroup = document.getElementById('extensionGroup');
    
    // 获取当前的操作模式
    const operation = document.querySelector('input[name="operation"]:checked').value; // <--- 确保在两种情况下都能获取到

    if (contentType === 'file') {
        fileSection.style.display = 'block';
        textSection.style.display = 'none';
        // 只有在【文件模式】且【解密模式】时，才显示扩展名选择
        extensionGroup.style.display = (operation === 'decrypt') ? 'block' : 'none'; // <-- 修正后的逻辑
    } else {
        fileSection.style.display = 'none';
        textSection.style.display = 'block';
        extensionGroup.style.display = 'none'; // 文本模式下，始终隐藏扩展名选择
    }
    
    // 隐藏之前的结果
    document.getElementById('resultCard').style.display = 'none';
    document.getElementById('resultPreviewArea').style.display = 'none';
    document.getElementById('downloadButtonArea').style.display = 'none';
    document.getElementById('progressCard').style.display = 'none';
    
    // 恢复状态图片为idle
    showStatusImage('idle');
    switchOperation();
    console.log('📝 切换内容类型:', contentType);
}

// 切换操作模式
function switchOperation() {
    const operation = document.querySelector('input[name="operation"]:checked').value;
    const contentType = document.querySelector('input[name="contentType"]:checked').value;
    const extensionGroup = document.getElementById('extensionGroup');
    const btnText = document.getElementById('btnText');
    const processBtn = document.getElementById('processBtn');
    
    // 更新按钮文本
    btnText.textContent = operation === 'encrypt' ? '开始加密' : '开始解密';

    
    // 只有文件模式的解密才显示扩展名选择
    extensionGroup.style.display = (operation === 'decrypt' && contentType === 'file') ? 'block' : 'none';
    
    // 隐藏之前的结果
    document.getElementById('resultCard').style.display = 'none';
    document.getElementById('resultPreviewArea').style.display = 'none';
    document.getElementById('downloadButtonArea').style.display = 'none';
    document.getElementById('progressCard').style.display = 'none';
    
    // 恢复状态图片为idle
    showStatusImage('idle');
    
    console.log('🔄 切换操作模式:', operation);
}

// 选择扩展名
function selectExtension(ext) {
    selectedExtension = ext;
    const customInput = document.getElementById('customExtension');
    
    // 更新按钮状态
    document.querySelectorAll('.ext-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    if (ext === 'custom') {
        customInput.style.display = 'block';
        customInput.focus();
    } else {
        customInput.style.display = 'none';
        customInput.value = ext;
    }
    
    console.log('📎 选择扩展名:', ext);
}

// 拖拽处理
function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    this.classList.add('dragover');
}

function handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    this.classList.remove('dragover');
}

function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    this.classList.remove('dragover');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleFile(files[0]);
    }
}

function handleFileSelect(e) {
    const files = e.target.files;
    if (files.length > 0) {
        handleFile(files[0]);
    }
}

function handleFile(file) {
    selectedFile = file;
    
    document.getElementById('uploadArea').style.display = 'none';
    document.getElementById('fileInfo').style.display = 'flex';
    document.getElementById('fileName').textContent = file.name;
    document.getElementById('fileSize').textContent = formatFileSize(file.size);
    
    // 添加文件预览
    showUploadedFilePreview(file);
    
    console.log('📁 选择文件:', file.name, formatFileSize(file.size));
}

// 显示上传文件的预览
function showUploadedFilePreview(file) {
    const fileInfo = document.getElementById('fileInfo');
    
    // 移除旧的预览
    const oldPreview = fileInfo.querySelector('.file-preview');
    if (oldPreview) {
        oldPreview.remove();
    }
    
    const ext = file.name.split('.').pop().toLowerCase();
    const previewDiv = document.createElement('div');
    previewDiv.className = 'file-preview';
    
    // 创建预览内容
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(ext)) {
        // 图片预览
        const reader = new FileReader();
        reader.onload = function(e) {
            previewDiv.innerHTML = `<img src="${e.target.result}" alt="预览">`;
            fileInfo.appendChild(previewDiv);
        };
        reader.readAsDataURL(file);
    } else if (['mp3', 'wav', 'ogg', 'flac', 'm4a'].includes(ext)) {
        // 音频预览
        const url = URL.createObjectURL(file);
        previewDiv.innerHTML = `
            <audio controls>
                <source src="${url}" type="${getMimeType(file.name)}">
            </audio>
        `;
        fileInfo.appendChild(previewDiv);
    } else if (['mp4', 'webm', 'avi', 'mov'].includes(ext)) {
        // 视频预览
        const url = URL.createObjectURL(file);
        previewDiv.innerHTML = `
            <video controls>
                <source src="${url}" type="${getMimeType(file.name)}">
            </video>
        `;
        fileInfo.appendChild(previewDiv);
    } else if (ext === 'txt' && file.size < 100000) {
        // 文本预览（小于100KB）
        const reader = new FileReader();
        reader.onload = function(e) {
            const text = e.target.result;
            const preview = text.length > 200 ? text.substring(0, 200) + '...' : text;
            previewDiv.innerHTML = `<pre>${escapeHtml(preview)}</pre>`;
            fileInfo.appendChild(previewDiv);
        };
        reader.readAsText(file);
    }
}

function removeFile() {
    selectedFile = null;
    document.getElementById('fileInput').value = '';
    document.getElementById('uploadArea').style.display = 'block';
    
    const fileInfo = document.getElementById('fileInfo');
    fileInfo.style.display = 'none';
    
    // 清理预览
    const preview = fileInfo.querySelector('.file-preview');
    if (preview) {
        preview.remove();
    }
    switchOperation();
}

function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

// 生成随机密钥
function generateKey(id) {
    const hex = '0123456789ABCDEF';
    let key = '';
    for (let i = 0; i < 16; i++) {
        key += hex[Math.floor(Math.random() * 16)];
    }
    document.getElementById(id).value = key;
    saveKeys();
    console.log('🎲 生成密钥:', id, '=', key);
}

function generateRandomKeys() {
    generateKey('k1');
    generateKey('k2');
    generateKey('k3');
    generateKey('iv');
}

// 验证输入
function validateInputs() {
    const k1 = document.getElementById('k1').value.trim();
    const k2 = document.getElementById('k2').value.trim();
    const k3 = document.getElementById('k3').value.trim();
    const iv = document.getElementById('iv').value.trim();
    
    if (!k1 || !k2 || !k3 || !iv) {
        alert('请填写所有密钥！');
        return false;
    }
    
    const hexRegex = /^[0-9A-Fa-f]{16}$/;
    if (!hexRegex.test(k1) || !hexRegex.test(k2) || !hexRegex.test(k3) || !hexRegex.test(iv)) {
        alert('密钥必须是16位十六进制字符！');
        return false;
    }
    
    const contentType = document.querySelector('input[name="contentType"]:checked').value;
    const operation = document.querySelector('input[name="operation"]:checked').value;
    
    if (contentType === 'file' && !selectedFile) {
        alert('请选择文件！');
        return false;
    }
    
    if (contentType === 'text') {
        const text = document.getElementById('inputText').value.trim();
        if (!text) {
            alert('请输入文本！');
            return false;
        }
    }
    
    if (contentType === 'file' && operation === 'decrypt') {
        const ext = document.getElementById('customExtension').value.trim();
        if (!ext) {
            alert('请选择或输入文件扩展名！');
            return false;
        }
    }
    
    return true;
}

// 主处理函数
async function processContent() {
    if (!validateInputs()) {
        return;
    }
    
    const contentType = document.querySelector('input[name="contentType"]:checked').value;
    
    if (contentType === 'text') {
        await processText();
    } else {
        await processFile();
    }
}

// 文本处理（本地）
async function processText() {
    saveKeys();
    disableControls();
    const operation = document.querySelector('input[name="operation"]:checked').value;
    const inputText = document.getElementById('inputText').value.trim();
    
    // 立即显示处理中图片
    showStatusImage('processing');
    
    // 禁用按钮
    const processBtn = document.getElementById('processBtn');
    const btnText = document.getElementById('btnText'); // ❗ 确保获取到 btnText 元素
    if (btnText) {
        btnText.textContent = '处理中...'; 
    }
    
    // 显示进度
    showProgress(operation === 'encrypt' ? '加密中...' : '解密中...', 50, '本地处理...');
    
    try {
        let result;
        
        if (operation === 'encrypt') {
            // 加密：文本 -> 字节 -> 加密 -> 十六进制
            result = await encryptTextLocal(inputText);
        } else {
            // 解密：十六进制 -> 字节 -> 解密 -> 文本
            result = await decryptTextLocal(inputText);
        }
        
        // 显示完成
        showProgress('完成', 100, '处理成功！');
        
        setTimeout(() => {
            hideProgress();
            showStatusImage('complete');
            
            // 显示结果
            document.getElementById('resultCard').style.display = 'block';
            document.getElementById('resultIcon').style.display = 'none'; // 隐藏图标
            document.getElementById('resultMessage').innerHTML = 
                operation === 'encrypt' 
                    ? `<div class="success-title">加密成功</div><br>输出为十六进制字符串` 
                    : `<div class="success-title">解密成功</div><br>已还原为原始文本`;
            
            // 显示预览
            const previewArea = document.getElementById('resultPreviewArea');
            const previewContent = document.getElementById('resultPreviewContent');
            previewArea.style.display = 'block';
            previewContent.innerHTML = `<pre style="white-space: pre-wrap; word-break: break-all;">${escapeHtml(result)}</pre>`;
            
            // 文本结果提供复制按钮
            document.getElementById('downloadButtonArea').style.display = 'block';
            document.getElementById('downloadButtonArea').innerHTML = `
                <button class="btn-primary" onclick="copyTextResult()">
                    <span>复制结果</span>
                </button>
            `;
            
            resultData = { type: 'text', content: result };
            // ⭐ 关键修正 1：手动恢复按钮文本
            const currentOperation = document.querySelector('input[name="operation"]:checked').value;
            const btnText = document.getElementById('btnText');
            if (btnText) {
                btnText.textContent = currentOperation === 'encrypt' ? '开始加密' : '开始解密'; 
            }
            // 恢复按钮
            enableControls();

        }, 500);
        
    } catch (error) {
        hideProgress();
        showError('处理失败: ' + error.message);
        enableControls();
        switchOperation();
    }
}

// 本地文本加密
async function encryptTextLocal(text) {
    // 调用服务器API进行文本加密
    const k1 = document.getElementById('k1').value.trim();
    const k2 = document.getElementById('k2').value.trim();
    const k3 = document.getElementById('k3').value.trim();
    const iv = document.getElementById('iv').value.trim();
    
    const response = await fetch(`${API_BASE_URL}/encrypt-text`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, k1, k2, k3, iv })
    });
    
    const data = await response.json();
    if (!data.success) {
        throw new Error(data.error || '加密失败');
    }
    
    return data.result;
}

// 本地文本解密
async function decryptTextLocal(hexString) {
    // 调用服务器API进行文本解密
    const k1 = document.getElementById('k1').value.trim();
    const k2 = document.getElementById('k2').value.trim();
    const k3 = document.getElementById('k3').value.trim();
    const iv = document.getElementById('iv').value.trim();
    
    const response = await fetch(`${API_BASE_URL}/decrypt-text`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hexString, k1, k2, k3, iv })
    });
    
    const data = await response.json();
    if (!data.success) {
        throw new Error(data.error || '解密失败');
    }
    
    return data.result;
}

// 复制文本结果
function copyTextResult() {
    if (resultData && resultData.type === 'text') {
        navigator.clipboard.writeText(resultData.content).then(() => {
            alert('已复制到剪贴板！');
        });
    }
}

// 文件处理（服务器）
async function processFile() {
    saveKeys();
    
    // 隐藏之前的结果
    document.getElementById('resultCard').style.display = 'none';
    document.getElementById('resultPreviewArea').style.display = 'none';
    document.getElementById('downloadButtonArea').style.display = 'none';
    
    // 立即显示处理中图片
    showStatusImage('processing');
    
    const k1 = document.getElementById('k1').value.trim();
    const k2 = document.getElementById('k2').value.trim();
    const k3 = document.getElementById('k3').value.trim();
    const iv = document.getElementById('iv').value.trim();
    const operation = document.querySelector('input[name="operation"]:checked').value;
    const extension = document.getElementById('customExtension').value.trim();
    
    // 禁用按钮
    const processBtn = document.getElementById('processBtn');
    const btnText = document.getElementById('btnText'); // ❗ 确保获取到 btnText 元素
    if (btnText) {
        btnText.textContent = '处理中...'; 
    }

    disableControls();
    
    // 显示进度
    showProgress(operation === 'encrypt' ? '加密中...' : '解密中...', 0, '正在上传文件...');
    
    try {
        const formData = new FormData();
        formData.append('k1', k1);
        formData.append('k2', k2);
        formData.append('k3', k3);
        formData.append('iv', iv);
        formData.append('file', selectedFile);
        if (operation === 'decrypt') {
            formData.append('extension', extension);
        }
        
        const endpoint = operation === 'encrypt' ? '/encrypt' : '/decrypt';
        console.log('📤 正在上传文件...');
        
        // 1. 先发送POST请求获取taskId
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            throw new Error(`HTTP错误: ${response.status}`);
        }
        
        const responseData = await response.json();
        
        if (!responseData.success) {
            throw new Error(responseData.error || '处理失败');
        }
        
        const taskId = responseData.taskId;
        console.log('📋 任务ID:', taskId);
        
        // 2. 建立SSE连接监听进度
        const eventSource = new EventSource(`${API_BASE_URL}/progress/${taskId}`);
        
        eventSource.onopen = () => {
            console.log('✅ SSE连接已建立');
        };
        
        eventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                console.log('📨 收到消息:', data);
                
                if (data.type === 'connected') {
                    console.log('🔗 SSE已连接');
                    
                } else if (data.type === 'progress') {
                    // 更新进度
                    showProgress(
                        operation === 'encrypt' ? '加密中...' : '解密中...',
                        data.progress,
                        `处理中: ${data.current}/${data.total} (${data.progress}%)`
                    );
                    console.log(`📊 进度: ${data.progress}%`);
                    
                } else if (data.type === 'status') {
                    showProgress(
                        data.status,
                        data.progress || 0,
                        data.status
                    );
                    
                } else if (data.type === 'complete') {
                    // 处理完成
                    eventSource.close();
                    console.log('✅ 处理完成');
                    
                    showProgress('完成', 100, '处理成功！');
                    
                    // 保存结果数据
                    resultData = {
                        type: 'file',
                        fileData: data.fileData,
                        fileName: data.fileName,
                        fileSize: data.fileSize,
                        mimeType: getMimeType(data.fileName)
                    };
                    
                    setTimeout(() => {
                        hideProgress();
                        showStatusImage('complete');
                        
                        // 显示成功消息
                        document.getElementById('resultCard').style.display = 'block';
                        document.getElementById('resultIcon').style.display = 'none'; // 隐藏图标
                        document.getElementById('resultMessage').innerHTML = 
                            operation === 'encrypt' 
                                ? `<div class="success-title">加密成功</div><br>文件: ${data.fileName}<br>大小: ${formatFileSize(data.fileSize)}` 
                                : `<div class="success-title">解密成功</div><br>文件: ${data.fileName}<br>大小: ${formatFileSize(data.fileSize)}`;
                        
                        // 显示预览
                        document.getElementById('resultPreviewArea').style.display = 'block'; 
                        showFilePreview(data.fileName, data.fileData);
                        
                        // 显示下载按钮（恢复默认按钮）
                        document.getElementById('downloadButtonArea').innerHTML = `
                            <button class="btn-primary" onclick="downloadResult()">
                                <span>下载文件</span>
                            </button>
                        `;
                        document.getElementById('downloadButtonArea').style.display = 'block';
                        // 恢复按钮文本和控制
                        const currentOperation = document.querySelector('input[name="operation"]:checked').value;
                        const btnText = document.getElementById('btnText');
                        if (btnText) {
                            btnText.textContent = currentOperation === 'encrypt' ? '开始加密' : '开始解密'; 
                        }
                        enableControls();
                       
                    }, 500);
                    
                } else if (data.type === 'error') {
                    eventSource.close();
                    throw new Error(data.error);
                }
            } catch (error) {
                console.error('❌ 解析消息失败:', error);
            }
        };
        
        eventSource.onerror = (error) => {
            console.error('❌ SSE连接错误:', error);
            eventSource.close();
            hideProgress();
            showError('连接错误，请重试');
            enableControls();
            switchOperation();
        };
        
    } catch (error) {
        hideProgress();
        showError('处理失败: ' + error.message);
        enableControls();
        switchOperation();
    }
}

// 显示文件预览
function showFilePreview(fileName, fileData) {
    const previewArea = document.getElementById('resultPreviewArea');
    const previewContent = document.getElementById('resultPreviewContent');
    const ext = fileName.split('.').pop().toLowerCase();
    
    previewArea.style.display = 'block';
    
    // 从base64还原文件
    const byteCharacters = atob(fileData);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    
    // 获取正确的MIME类型
    const mimeType = getMimeType(fileName);
    const blob = new Blob([byteArray], { type: mimeType });
    const url = URL.createObjectURL(blob);
    
    // 根据文件类型显示预览
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(ext)) {
        previewContent.innerHTML = `<img src="${url}" style="max-width: 100%; border-radius: 12px;" alt="图片预览">`;
    } else if (['mp3', 'wav', 'ogg', 'flac', 'm4a'].includes(ext)) {
        previewContent.innerHTML = `
            <div style="padding: 20px;">
                <audio controls style="width: 100%;">
                    <source src="${url}" type="${mimeType}">
                    您的浏览器不支持音频播放
                </audio>
            </div>
        `;
    } else if (['mp4', 'webm', 'ogg', 'avi', 'mov'].includes(ext)) {
        previewContent.innerHTML = `
            <video controls style="max-width: 100%; border-radius: 12px;">
                <source src="${url}" type="${mimeType}">
                您的浏览器不支持视频播放
            </video>
        `;
    } else if (ext === 'txt') {
        // 读取文本内容
        const reader = new FileReader();
        reader.onload = function(e) {
            previewContent.innerHTML = `<pre style="white-space: pre-wrap; word-break: break-all; background: rgba(0,0,0,0.3); padding: 15px; border-radius: 12px; max-height: 400px; overflow-y: auto;">${escapeHtml(e.target.result)}</pre>`;
        };
        reader.readAsText(blob);
    } else {
        previewContent.innerHTML = `<p style="color: rgba(255,255,255,0.7); padding: 20px;">该文件类型 (${ext}) 不支持预览</p>`;
    }
}

// 下载结果文件
function downloadResult() {
    if (!resultData) return;
    
    if (resultData.type === 'text') {
        copyTextResult();
        return;
    }
    
    // 从base64还原文件
    const byteCharacters = atob(resultData.fileData);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray]);
    
    // 下载文件
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = resultData.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    console.log('💾 下载文件:', resultData.fileName);
}

// 获取MIME类型
function getMimeType(fileName) {
    const ext = fileName.split('.').pop().toLowerCase();
    const mimeTypes = {
        // 文本
        'txt': 'text/plain',
        'html': 'text/html',
        'css': 'text/css',
        'js': 'application/javascript',
        // 图片
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'webp': 'image/webp',
        'bmp': 'image/bmp',
        'svg': 'image/svg+xml',
        // 音频
        'mp3': 'audio/mpeg',
        'wav': 'audio/wav',
        'ogg': 'audio/ogg',
        'flac': 'audio/flac',
        'm4a': 'audio/mp4',
        // 视频
        'mp4': 'video/mp4',
        'webm': 'video/webm',
        'avi': 'video/x-msvideo',
        'mov': 'video/quicktime',
        // 文档
        'pdf': 'application/pdf',
        'doc': 'application/msword',
        'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    };
    return mimeTypes[ext] || 'application/octet-stream';
}

// HTML转义
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 进度显示
function showProgress(status, percent, info) {
    const card = document.getElementById('progressCard');
    card.style.display = 'block';
    document.getElementById('progressStatus').textContent = status;
    document.getElementById('progressPercent').textContent = percent + '%';
    document.getElementById('progressFill').style.width = percent + '%';
    document.getElementById('progressInfo').textContent = info;
}

function hideProgress() {
    document.getElementById('progressCard').style.display = 'none';
}

function showSuccess(message) {
    const card = document.getElementById('resultCard');
    card.style.display = 'block';
    document.getElementById('resultIcon').style.display = 'none'; // 隐藏图标
    document.getElementById('resultMessage').innerHTML = `<div class="success-title">成功</div><br>${message}`;
}

function showError(message) {
    const card = document.getElementById('resultCard');
    card.style.display = 'block';
    document.getElementById('resultIcon').style.display = 'none'; // 隐藏图标
    document.getElementById('resultMessage').innerHTML = `<div class="error-title">错误</div><br>${message}`;
}