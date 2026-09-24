FROM node:20-alpine AS base
WORKDIR /app

FROM base AS deps
COPY apps/dashboard/package.json ./apps/dashboard/package.json
WORKDIR /app/apps/dashboard
RUN npm install

FROM base AS build
COPY --from=deps /app/apps/dashboard/node_modules ./apps/dashboard/node_modules
COPY apps/dashboard ./apps/dashboard
WORKDIR /app/apps/dashboard
ARG NEXT_PUBLIC_API_URL=http://localhost:4000
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app/apps/dashboard
ENV NODE_ENV=production
COPY --from=build /app/apps/dashboard/node_modules ./node_modules
COPY --from=build /app/apps/dashboard/.next ./.next
COPY --from=build /app/apps/dashboard/public ./public
COPY --from=build /app/apps/dashboard/package.json ./package.json
COPY --from=build /app/apps/dashboard/next.config.js ./next.config.js
EXPOSE 3000
CMD ["npm", "start"]
