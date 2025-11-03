FROM node:18-slim

RUN apt-get update && apt-get install -y \
    chromium \
    chromium-sandbox \
    fonts-liberation \
    libappindicator3-1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    xdg-utils \
    procps \
    && rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app

COPY package.json yarn.lock ./

RUN yarn install --frozen-lockfile

COPY . .

RUN mkdir -p .wwebjs_auth

# Criar script de inicialização
RUN echo '#!/bin/bash\n\
set -e\n\
echo "Limpando processos e locks antigos..."\n\
pkill -9 chromium 2>/dev/null || true\n\
pkill -9 chrome 2>/dev/null || true\n\
rm -rf /tmp/.org.chromium.Chromium.* 2>/dev/null || true\n\
rm -rf /root/.config/chromium/SingletonLock 2>/dev/null || true\n\
rm -rf /home/*/.config/chromium/SingletonLock 2>/dev/null || true\n\
echo "Limpeza concluída. Iniciando aplicação..."\n\
exec yarn start' > /app/entrypoint.sh && chmod +x /app/entrypoint.sh

CMD ["/app/entrypoint.sh"]