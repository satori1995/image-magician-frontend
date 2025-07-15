# 使用 Node.js 20 最新版本
FROM node:20-alpine

# 设置工作目录
WORKDIR /app

# 复制依赖文件和源代码
COPY . .

# 清理并安装依赖
RUN rm -rf node_modules package-lock.json
RUN npm install

# 构建应用
RUN npm run build

# 暴露端口
EXPOSE 80

# 启动预览服务器（生产模式）
CMD ["npm", "run", "preview"]