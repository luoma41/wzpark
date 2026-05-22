# wz park - 旅行相册

个人旅行照片管理工具，支持批量上传、自动位置分类、中国地图高亮、密码分享。

## 技术栈

- 前端: HTML + Tailwind CSS v3 (CDN) + 原生 JavaScript
- 后端: Vercel Serverless Functions (Node.js)
- 存储: 腾讯云 COS
- 数据库: MongoDB Atlas
- 地图: Leaflet.js

## 部署步骤

### 1. 准备工作

- 注册 [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) 账号，创建免费集群
- 注册 [腾讯云](https://cloud.tencent.com/) 账号，开通 COS 服务
- 注册 [Vercel](https://vercel.com/) 账号

### 2. MongoDB 配置

1. 在 Atlas 创建数据库 `wzpark`
2. 创建集合: `photos`, `albums`, `shares`, `users`
3. 在 `albums` 集合创建唯一索引:
   ```javascript
   db.albums.createIndex({ city: 1 }, { unique: true })
   ```

### 3. 腾讯云 COS 配置

1. 创建存储桶，名称格式: `{appid}-{bucketname}`
2. 配置 CORS:
   ```xml
   <CORSConfiguration>
     <CORSRule>
       <AllowedOrigin>*</AllowedOrigin>
       <AllowedMethod>PUT</AllowedMethod>
       <AllowedMethod>POST</AllowedMethod>
       <AllowedMethod>GET</AllowedMethod>
       <AllowedMethod>DELETE</AllowedMethod>
       <AllowedHeader>*</AllowedHeader>
       <MaxAgeSeconds>300</MaxAgeSeconds>
       <ExposeHeader>ETag</ExposeHeader>
     </CORSRule>
   </CORSConfiguration>
   ```
3. 在 CAM 创建子账号，赋予 COS 读写权限，用于生成 STS 临时凭证

### 4. 本地开发

```bash
npm install
```

复制 `.env.example` 为 `.env.local` 并填写所有环境变量。

生成管理员密码哈希:
```bash
node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('your-password', 10).then(console.log)"
```

### 5. Vercel 部署

```bash
vercel --prod
```

部署后在 Vercel Dashboard 设置所有环境变量。

## 使用说明

1. 访问 `/#/admin` 登录管理后台
2. 点击"上传照片"批量上传旅行照片
3. 系统自动按城市分类，无 GPS 照片可手动补充位置
4. 在相册详情页点击"分享"生成带密码的分享链接
