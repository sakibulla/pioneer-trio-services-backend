FROM node:20-alpine

WORKDIR /app

# Install build dependencies for sharp/native modules and curl
RUN apk add --no-cache libc6-compat curl python3 make g++

COPY package*.json ./
RUN npm install

COPY . .

RUN npx prisma generate

EXPOSE 5000

CMD ["npm", "run", "dev"]
