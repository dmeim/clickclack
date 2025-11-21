FROM node:20-alpine

WORKDIR /app

# 1. Install dependencies
COPY package*.json ./
RUN npm install

# 2. Copy source code
COPY . .

# 3. Build the app
RUN npm run build

# 4. Remove development dependencies (optional, keeps image smaller)
RUN npm prune --production

# 5. Start the app
ENV NODE_ENV=production
EXPOSE 3000
CMD ["npm", "start"]
