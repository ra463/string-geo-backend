FROM node:21.4.0-alpine
RUN apk update && \
    apk add --no-cache chromium 
WORKDIR /app
COPY package.json .
RUN npm install --omit=dev
COPY . .

CMD ["npm", "start"]
