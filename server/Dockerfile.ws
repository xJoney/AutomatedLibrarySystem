FROM oven/bun:1

WORKDIR /app

COPY package.json bun.lockb* ./
RUN bun install

COPY server ./server

EXPOSE 4000

CMD ["bun", "server/ws-server.ts"]
