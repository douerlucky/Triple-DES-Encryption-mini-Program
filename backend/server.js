const express = require('express');
const multer = require('multer');
const cors = require('cors');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 8080;

// 启用CORS（允许前端跨域访问）
app.use(cors());
app.use(express.json());

// 配置文件上传
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = './uploads';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir);
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

// 清理临时文件的函数
function cleanupFile(filePath) {
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
    }
}

// 存储活动的SSE连接
const activeConnections = new Map();

// SSE端点 - 用于实时进度推送
app.get('/api/progress/:taskId', (req, res) => {
    const taskId = req.params.taskId;
    
    console.log(`SSE连接建立: ${taskId}`);
    
    // 设置SSE响应头
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    // 发送初始连接消息
    res.write('data: {"type":"connected","taskId":"' + taskId + '"}\n\n');
    
    // 保存连接
    activeConnections.set(taskId, res);
    
    // 客户端断开连接时清理
    req.on('close', () => {
        console.log(`SSE连接关闭: ${taskId}`);
        activeConnections.delete(taskId);
    });
});

// 发送进度更新的辅助函数
function sendProgress(taskId, data) {
    const connection = activeConnections.get(taskId);
    if (connection) {
        connection.write(`data: ${JSON.stringify(data)}\n\n`);
    }
}

// 加密接口
app.post('/api/encrypt', upload.single('file'), (req, res) => {
    const taskId = 'task-' + Date.now();
    console.log(`收到加密请求 [${taskId}]`);
    
    const { k1, k2, k3, iv } = req.body;
    const inputFile = req.file.path;
    const outputFile = inputFile + '.enc';
    
    // 验证输入
    if (!k1 || !k2 || !k3 || !iv) {
        cleanupFile(inputFile);
        return res.status(400).json({ 
            success: false, 
            error: '缺少密钥或IV参数' 
        });
    }
    
    // 验证十六进制格式
    const hexRegex = /^[0-9A-Fa-f]{16}$/;
    if (!hexRegex.test(k1) || !hexRegex.test(k2) || !hexRegex.test(k3) || !hexRegex.test(iv)) {
        cleanupFile(inputFile);
        return res.status(400).json({ 
            success: false, 
            error: '密钥或IV格式错误，需要16位十六进制字符' 
        });
    }
    
    console.log(`加密文件: ${req.file.originalname}`);
    console.log(`文件大小: ${(req.file.size / 1024).toFixed(2)} KB`);
    
    // 返回taskId给客户端
    res.json({ 
        success: true, 
        taskId: taskId,
        message: '任务已创建，请连接SSE获取进度'
    });
    
    // 异步执行加密
    setTimeout(() => {
        executeEncryption(taskId, k1, k2, k3, iv, inputFile, outputFile, req.file.originalname);
    }, 100);
});

// 执行加密的函数
function executeEncryption(taskId, k1, k2, k3, iv, inputFile, outputFile, originalName) {
    const cppProgram = path.join(__dirname, '../DES/cmake-build-debug/DES');
    
    sendProgress(taskId, {
        type: 'status',
        status: '正在启动加密程序...',
        progress: 0
    });
    
    const process = spawn(cppProgram, [
        k1, k2, k3, iv, 
        'encrypt', 
        inputFile, 
        outputFile
    ]);
    
    let stdout_data = '';
    let hasError = false;
    
    // 捕获stdout（包含PROGRESS进度信息和SUCCESS标记）
    process.stdout.on('data', (data) => {
        const output = data.toString();
        stdout_data += output;
        console.log(`[${taskId}] stdout:`, output.trim());
        
        // 解析进度信息：PROGRESS:current:total:percentage
        const progressMatch = output.match(/PROGRESS:(\d+):(\d+):(\d+)/);
        if (progressMatch) {
            const current = parseInt(progressMatch[1]);
            const total = parseInt(progressMatch[2]);
            const percentage = parseInt(progressMatch[3]);
            
            console.log(`[${taskId}] 📊 进度更新: ${percentage}% (${current}/${total})`);
            
            sendProgress(taskId, {
                type: 'progress',
                current: current,
                total: total,
                progress: percentage,
                status: `正在加密... ${percentage}%`
            });
        }
    });
    
    // 捕获stderr（包含进度信息）
    process.stderr.on('data', (data) => {
        const output = data.toString();
        console.log(`[${taskId}] stderr:`, output.trim());
        
        // 解析进度信息：PROGRESS:current:total:percentage
        const progressMatch = output.match(/PROGRESS:(\d+):(\d+):(\d+)/);
        if (progressMatch) {
            const current = parseInt(progressMatch[1]);
            const total = parseInt(progressMatch[2]);
            const percentage = parseInt(progressMatch[3]);
            
            sendProgress(taskId, {
                type: 'progress',
                current: current,
                total: total,
                progress: percentage,
                status: `正在加密... ${percentage}%`
            });
        }
    });
    
    // 处理错误
    process.on('error', (error) => {
        console.error(`[${taskId}] 进程启动错误:`, error);
        hasError = true;
        
        sendProgress(taskId, {
            type: 'error',
            error: '加密程序启动失败: ' + error.message
        });
        
        cleanupFile(inputFile);
        cleanupFile(outputFile);
    });
    
    // 处理进程结束
    process.on('close', (code) => {
        console.log(`[${taskId}] 进程退出，代码: ${code}`);
        
        if (hasError) return;
        
        if (code !== 0 || !stdout_data.includes('SUCCESS')) {
            console.error(`[${taskId}] 加密失败`);
            
            sendProgress(taskId, {
                type: 'error',
                error: '加密失败'
            });
            
            cleanupFile(inputFile);
            cleanupFile(outputFile);
            return;
        }
        
        console.log(`[${taskId}] 加密成功，读取输出文件...`);
        
        // 读取加密后的文件
        fs.readFile(outputFile, (err, data) => {
            if (err) {
                console.error(`[${taskId}] 读取输出文件失败:`, err);
                
                sendProgress(taskId, {
                    type: 'error',
                    error: '读取加密文件失败'
                });
                
                cleanupFile(inputFile);
                cleanupFile(outputFile);
                return;
            }
            
            // 将文件转换为base64
            const fileBase64 = data.toString('base64');
            const fileName = originalName + '.enc';
            
            // 发送完成消息（包含文件数据）
            sendProgress(taskId, {
                type: 'complete',
                progress: 100,
                status: '加密完成！',
                fileData: fileBase64,
                fileName: fileName,
                fileSize: data.length
            });
            
            // 清理临时文件
            setTimeout(() => {
                cleanupFile(inputFile);
                cleanupFile(outputFile);
            }, 5000);
        });
    });
    
    // 设置超时（10分钟）
    setTimeout(() => {
        if (activeConnections.has(taskId)) {
            process.kill();
            cleanupFile(inputFile);
            cleanupFile(outputFile);
            
            sendProgress(taskId, {
                type: 'error',
                error: '加密超时'
            });
        }
    }, 600000);
}

// 解密接口
app.post('/api/decrypt', upload.single('file'), (req, res) => {
    const taskId = 'task-' + Date.now();
    console.log(`收到解密请求 [${taskId}]`);
    
    const { k1, k2, k3, iv, extension } = req.body;
    const inputFile = req.file.path;
    const outputFile = inputFile + '.dec';
    
    // 验证输入
    if (!k1 || !k2 || !k3 || !iv) {
        cleanupFile(inputFile);
        return res.status(400).json({ 
            success: false, 
            error: '缺少密钥或IV参数' 
        });
    }
    
    // 验证十六进制格式
    const hexRegex = /^[0-9A-Fa-f]{16}$/;
    if (!hexRegex.test(k1) || !hexRegex.test(k2) || !hexRegex.test(k3) || !hexRegex.test(iv)) {
        cleanupFile(inputFile);
        return res.status(400).json({ 
            success: false, 
            error: '密钥或IV格式错误，需要16位十六进制字符' 
        });
    }
    
    console.log(`解密文件: ${req.file.originalname}`);
    console.log(`文件大小: ${(req.file.size / 1024).toFixed(2)} KB`);
    
    // 返回taskId
    res.json({ 
        success: true, 
        taskId: taskId,
        message: '任务已创建，请连接SSE获取进度'
    });
    
    // 异步执行解密
    setTimeout(() => {
        executeDecryption(taskId, k1, k2, k3, iv, inputFile, outputFile, req.file.originalname, extension || 'txt');
    }, 100);
});

// 执行解密的函数
function executeDecryption(taskId, k1, k2, k3, iv, inputFile, outputFile, originalName, extension) {
    const cppProgram = path.join(__dirname, '../DES/cmake-build-debug/DES');
    
    sendProgress(taskId, {
        type: 'status',
        status: '正在启动解密程序...',
        progress: 0
    });
    
    const process = spawn(cppProgram, [
        k1, k2, k3, iv, 
        'decrypt', 
        inputFile, 
        outputFile,
        extension
    ]);
    
    let stdout_data = '';
    let hasError = false;
    
    process.stdout.on('data', (data) => {
        const output = data.toString();
        stdout_data += output;
        console.log(`[${taskId}] stdout:`, output.trim());
        
        // 解析进度信息
        const progressMatch = output.match(/PROGRESS:(\d+):(\d+):(\d+)/);
        if (progressMatch) {
            const current = parseInt(progressMatch[1]);
            const total = parseInt(progressMatch[2]);
            const percentage = parseInt(progressMatch[3]);
            
            console.log(`[${taskId}] 📊 进度更新: ${percentage}% (${current}/${total})`);
            
            sendProgress(taskId, {
                type: 'progress',
                current: current,
                total: total,
                progress: percentage,
                status: `正在解密... ${percentage}%`
            });
        }
    });
    
    process.stderr.on('data', (data) => {
        const output = data.toString();
        console.log(`[${taskId}] stderr:`, output.trim());
        
        // 解析进度
        const progressMatch = output.match(/PROGRESS:(\d+):(\d+):(\d+)/);
        if (progressMatch) {
            const current = parseInt(progressMatch[1]);
            const total = parseInt(progressMatch[2]);
            const percentage = parseInt(progressMatch[3]);
            
            sendProgress(taskId, {
                type: 'progress',
                current: current,
                total: total,
                progress: percentage,
                status: `正在解密... ${percentage}%`
            });
        }
    });
    
    process.on('error', (error) => {
        console.error(`[${taskId}] 进程启动错误:`, error);
        hasError = true;
        
        sendProgress(taskId, {
            type: 'error',
            error: '解密程序启动失败: ' + error.message
        });
        
        cleanupFile(inputFile);
        cleanupFile(outputFile);
    });
    
    process.on('close', (code) => {
        console.log(`[${taskId}] 进程退出，代码: ${code}`);
        
        if (hasError) return;
        
        if (code !== 0 || !stdout_data.includes('SUCCESS')) {
            console.error(`[${taskId}] 解密失败`);
            
            sendProgress(taskId, {
                type: 'error',
                error: '解密失败'
            });
            
            cleanupFile(inputFile);
            cleanupFile(outputFile);
            return;
        }
        
        console.log(`[${taskId}] 解密成功，读取输出文件...`);
        
        fs.readFile(outputFile, (err, data) => {
            if (err) {
                console.error(`[${taskId}] 读取输出文件失败:`, err);
                
                sendProgress(taskId, {
                    type: 'error',
                    error: '读取解密文件失败'
                });
                
                cleanupFile(inputFile);
                cleanupFile(outputFile);
                return;
            }
            
            // 生成文件名
            let fileName = originalName;
            if (fileName.endsWith('.enc')) {
                fileName = fileName.slice(0, -4);
            }
            fileName = `${fileName}_decrypted.${extension}`;
            
            // 将文件转换为base64
            const fileBase64 = data.toString('base64');
            
            sendProgress(taskId, {
                type: 'complete',
                progress: 100,
                status: '解密完成！',
                fileData: fileBase64,
                fileName: fileName,
                fileSize: data.length
            });
            
            setTimeout(() => {
                cleanupFile(inputFile);
                cleanupFile(outputFile);
            }, 5000);
        });
    });
    
    setTimeout(() => {
        if (activeConnections.has(taskId)) {
            process.kill();
            cleanupFile(inputFile);
            cleanupFile(outputFile);
            
            sendProgress(taskId, {
                type: 'error',
                error: '解密超时'
            });
        }
    }, 600000);
}

// 文本加密接口
app.post('/api/encrypt-text', express.json(), async (req, res) => {
    const { text, k1, k2, k3, iv } = req.body;
    
    // 验证输入
    if (!text || !k1 || !k2 || !k3 || !iv) {
        return res.status(400).json({ 
            success: false, 
            error: '缺少参数' 
        });
    }
    
    // 验证十六进制格式
    const hexRegex = /^[0-9A-Fa-f]{16}$/;
    if (!hexRegex.test(k1) || !hexRegex.test(k2) || !hexRegex.test(k3) || !hexRegex.test(iv)) {
        return res.status(400).json({ 
            success: false, 
            error: '密钥或IV格式错误' 
        });
    }
    
    // 创建临时文件
    const tempDir = './uploads';
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir);
    }
    
    const inputFile = path.join(tempDir, `text-${Date.now()}.txt`);
    const outputFile = inputFile + '.enc';
    
    try {
        // 写入文本到临时文件
        fs.writeFileSync(inputFile, text, 'utf8');
        
        const cppProgram = path.join(__dirname, '../DES/cmake-build-debug/DES');
        const process = spawn(cppProgram, [
            k1, k2, k3, iv,
            'encrypt',
            inputFile,
            outputFile
        ]);
        
        let stdout_data = '';
        let stderr_data = '';
        
        process.stdout.on('data', (data) => {
            stdout_data += data.toString();
        });
        
        process.stderr.on('data', (data) => {
            stderr_data += data.toString();
        });
        
        process.on('close', (code) => {
            // 清理临时文件
            cleanupFile(inputFile);
            
            if (code !== 0 || !stdout_data.includes('SUCCESS')) {
                cleanupFile(outputFile);
                return res.json({
                    success: false,
                    error: '加密失败'
                });
            }
            
            // 读取加密结果（十六进制）
            const encryptedData = fs.readFileSync(outputFile);
            const hexString = encryptedData.toString('hex').toUpperCase();
            
            // 清理输出文件
            cleanupFile(outputFile);
            
            res.json({
                success: true,
                result: hexString
            });
        });
        
    } catch (error) {
        cleanupFile(inputFile);
        cleanupFile(outputFile);
        res.json({
            success: false,
            error: error.message
        });
    }
});

// 文本解密接口
app.post('/api/decrypt-text', express.json(), async (req, res) => {
    const { hexString, k1, k2, k3, iv } = req.body;
    
    // 验证输入
    if (!hexString || !k1 || !k2 || !k3 || !iv) {
        return res.status(400).json({ 
            success: false, 
            error: '缺少参数' 
        });
    }
    
    // 验证十六进制格式
    const hexRegex = /^[0-9A-Fa-f]{16}$/;
    if (!hexRegex.test(k1) || !hexRegex.test(k2) || !hexRegex.test(k3) || !hexRegex.test(iv)) {
        return res.status(400).json({ 
            success: false, 
            error: '密钥或IV格式错误' 
        });
    }
    
    // 创建临时文件
    const tempDir = './uploads';
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir);
    }
    
    const inputFile = path.join(tempDir, `encrypted-${Date.now()}.enc`);
    const outputFile = inputFile + '.dec';
    
    try {
        // 将十六进制字符串转换为二进制并写入文件
        const buffer = Buffer.from(hexString, 'hex');
        fs.writeFileSync(inputFile, buffer);
        
        const cppProgram = path.join(__dirname, '../DES/cmake-build-debug/DES');
        const process = spawn(cppProgram, [
            k1, k2, k3, iv,
            'decrypt',
            inputFile,
            outputFile,
            'txt'
        ]);
        
        let stdout_data = '';
        let stderr_data = '';
        
        process.stdout.on('data', (data) => {
            stdout_data += data.toString();
        });
        
        process.stderr.on('data', (data) => {
            stderr_data += data.toString();
        });
        
        process.on('close', (code) => {
            // 清理临时文件
            cleanupFile(inputFile);
            
            if (code !== 0 || !stdout_data.includes('SUCCESS')) {
                cleanupFile(outputFile);
                return res.json({
                    success: false,
                    error: '解密失败'
                });
            }
            
            // 读取解密结果（文本）
            const decryptedText = fs.readFileSync(outputFile, 'utf8');
            
            // 清理输出文件
            cleanupFile(outputFile);
            
            res.json({
                success: true,
                result: decryptedText
            });
        });
        
    } catch (error) {
        cleanupFile(inputFile);
        cleanupFile(outputFile);
        res.json({
            success: false,
            error: error.message
        });
    }
});

// 健康检查接口
app.get('/api/health', (req, res) => {
    res.json({ 
        success: true, 
        message: '3DES-CBC 后端服务运行正常（支持实时进度）',
        timestamp: new Date().toISOString(),
        activeConnections: activeConnections.size
    });
});

// 启动服务器
app.listen(PORT, () => {
    console.log('=================================');
    console.log('  3DES-CBC 后端服务已启动');
    console.log(`  监听端口: ${PORT}`);
    console.log(`  支持功能: SSE实时进度`);
    console.log(`  访问地址: http://localhost:${PORT}`);
    console.log('=================================');
});