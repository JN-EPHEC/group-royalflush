FROM node:22-alpine

WORKDIR /usr/src/app

# prisma.config.ts lit DATABASE_URL au `prisma generate` (postinstall) — valeur factice, remplacée au run
ENV DATABASE_URL="postgresql://build:build@127.0.0.1:5432/postgres"

COPY package*.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./

RUN npm install

COPY . .

RUN npx prisma generate
RUN npm run build

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
