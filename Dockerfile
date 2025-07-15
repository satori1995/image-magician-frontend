# 使用 Node.js 16 作为基础镜像（解决 crypto.hash 兼容性问题）
FROM node:16-alpine

# 设置工作目录
WORKDIR /app

# 复制依赖文件
COPY package*.json ./

# 安装依赖
RUN npm install

# 复制源代码
COPY . .

# 设置环境变量解决 crypto.hash 问题
ENV NODE_OPTIONS="--openssl-legacy-provider"

# 构建应用
RUN npm run build

# 暴露端口
EXPOSE 80

# 启动预览服务器
CMD ["npm", "run", "preview"]