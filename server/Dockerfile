# syntax=docker/dockerfile:1

FROM node:20-bullseye-slim
WORKDIR /app
ENV NODE_ENV=development
ENV PORT=3001

RUN apt-get update \
  && apt-get install -y --no-install-recommends ffmpeg \
  && rm -rf /var/lib/apt/lists/*

RUN addgroup --system app && adduser --system --ingroup app app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY src ./src

RUN mkdir -p /app/uploads \
  && chown -R app:app /app
USER app

EXPOSE 3001
CMD ["node", "./src/server.js"]
