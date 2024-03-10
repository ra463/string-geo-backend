FROM node:21.4.0-alpine
RUN apk update && \
    apk upgrade && \
    apk add --no-cache \
        udev \
        ttf-freefont \
        chromium \
        nss \
        freetype \
        freetype-dev \
        harfbuzz \
        ca-certificates \
        git \
        curl



# Install Google Chrome Stable
RUN apk add --no-cache \
    chromium-chromedriver \
    chromium-browser \
    && rm -rf /var/cache/apk/*

# Install fonts for better compatibility
RUN apk add --update --no-cache \
    ttf-freefont \
    fontconfig

# Cleanup unnecessary files
RUN rm -rf /var/cache/* && \
    rm -rf /tmp/* && \
    rm -rf /var/tmp/*



WORKDIR /app
COPY package.json .
RUN npm install --omit=dev
COPY . .

CMD ["npm", "start"]
