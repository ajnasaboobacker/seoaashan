# Use official Node.js runtime as parent image
FROM node:20-bookworm-slim

# Install system dependencies for Python, WeasyPrint, and general tools
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    python3-venv \
    python3-dev \
    build-essential \
    libffi-dev \
    libssl-dev \
    libpango-1.0-0 \
    libpangoft2-1.0-0 \
    libjpeg-dev \
    libopenjp2-7-dev \
    shared-mime-info \
    brotli \
    curl \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Set up virtual environment for Python and add to PATH
ENV VIRTUAL_ENV=/opt/venv
RUN python3 -m venv $VIRTUAL_ENV
ENV PATH="$VIRTUAL_ENV/bin:$PATH"

# Set working directory
WORKDIR /app

# Copy package files and install backend dependencies
COPY package.json ./
RUN npm install

# Copy Python requirements file and install dependencies
COPY requirements.txt ./
RUN pip3 install --no-cache-dir -r requirements.txt

# Install Playwright browser and system dependencies for Chromium
RUN npx playwright install chromium
RUN npx playwright install-deps chromium

# Copy remaining backend source code
COPY . .

# Set up non-root user (Hugging Face Spaces runs as user ID 1000)
# Node base image pre-creates the 'node' user with UID 1000.
# Give 'node' user write permission to /app and the python venv
RUN chown -R node:node /app $VIRTUAL_ENV

# Switch to the non-root user
USER node

# Expose backend port (Hugging Face routing default)
EXPOSE 7860

# Set environment variables
ENV PORT=7860
ENV NODE_ENV=production

# Start Express server
CMD ["node", "server.js"]
