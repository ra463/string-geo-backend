FROM node:21.4.0-alpine
RUN apt-get update && apt-get install -y chromium-browser 
WORKDIR /app
COPY package.json .
RUN npm install --omit=dev
COPY . .

CMD ["npm", "start"]
