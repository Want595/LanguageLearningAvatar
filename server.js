import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 7860;
// 将HOST从'0.0.0.0'改为'127.0.0.1'
const HOST = process.env.HOST || '127.0.0.1';

// 提供静态文件服务
app.use(express.static(path.join(__dirname, 'dist')));

// 处理 SPA 路由
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, HOST, () => {
  // 修改日志输出中的地址显示
  console.log(`Server running at http://localhost:${PORT}/`);
});