FROM python:3.11-slim

ENV DEBIAN_FRONTEND=noninteractive

# Install Chromium and matching driver for Selenium
RUN apt-get update \
 && apt-get install -y --no-install-recommends \
    chromium \
    chromium-driver \
    fonts-liberation \
    libnss3 \
    libatk-bridge2.0-0 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    libgbm1 \
    libgtk-3-0 \
    libasound2 \
 && rm -rf /var/lib/apt/lists/*  

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Default output dir can be overridden at runtime via OUTPUT_DIR or --output-dir
ENV OUTPUT_DIR=/data/output
VOLUME ["/data/output"]

ENTRYPOINT ["python", "scrape_all_to_csv.py"]
