FROM mcr.microsoft.com/playwright:v1.63.0-noble

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .

ENV PORT=10000
ENV TESTSPHERE_HEADLESS=true
EXPOSE 10000
CMD ["node", "server.js"]
