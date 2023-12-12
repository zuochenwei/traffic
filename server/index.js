const express = require('express');
const cors = require('cors'); // 跨域资源共享中间件
const apiRoutes = require('./api/userApi'); // 导入API路由
const bodyParser = require('body-parser');

const app = express();
const port = process.env.PORT || 3000; // 指定端口号
const ipAddress = '192.168.8.96'; // 设置要监听的IP地址
app.use(bodyParser.json());
// 中间件配置
app.use(express.json()); // 解析JSON请求主体
app.use(express.urlencoded({ extended: false })); // 解析表单数据
app.use(cors()); // 启用CORS中间件
// API路由配置
app.use('/', apiRoutes);
// 启动服务器
app.listen(port, () => {
  console.log(`Server is running on http://${ipAddress}:${port}`);
});
