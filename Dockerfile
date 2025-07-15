FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY src ./src
COPY public ./public
EXPOSE 3000 4840
CMD ["node", "src/server.js"]
