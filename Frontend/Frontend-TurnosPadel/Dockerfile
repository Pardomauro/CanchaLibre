FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci --only=production

COPY . .
ENV NODE_ENV=production
EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host"]

  