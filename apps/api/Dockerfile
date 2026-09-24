FROM node:20-alpine AS base
WORKDIR /app

FROM base AS deps
COPY apps/api/package.json ./apps/api/package.json
WORKDIR /app/apps/api
RUN npm install

FROM base AS build
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY apps/api ./apps/api
WORKDIR /app/apps/api
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app/apps/api
ENV NODE_ENV=production
COPY --from=build /app/apps/api/node_modules ./node_modules
COPY --from=build /app/apps/api/dist ./dist
COPY --from=build /app/apps/api/prisma ./prisma
COPY --from=build /app/apps/api/package.json ./package.json
RUN mkdir -p storage-data
EXPOSE 4000
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
