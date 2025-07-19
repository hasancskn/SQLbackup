FROM python:3.11-slim

# Sistem araçları ve migration araçları
RUN apt-get update && apt-get install -y \
    curl \
    gnupg \
    lsb-release \
    mysql-client \
    postgresql-client \
    sqlite3 \
    mongo-tools \
    sbcl \
    make \
    gcc \
    git \
    libdbd-pg-perl \
    libdbi-perl \
    libexpat1-dev \
    libpq-dev \
    libdbd-mysql-perl \
    cpanminus \
    && rm -rf /var/lib/apt/lists/*

# pgloader kurulumu
RUN curl -fsSL https://github.com/dimitri/pgloader/releases/download/v3.6.3/pgloader-bundle-3.6.3.tgz | tar xz -C /opt && \
    ln -s /opt/pgloader*/bin/pgloader /usr/local/bin/pgloader

# ora2pg kurulumu
RUN curl -fsSL https://github.com/darold/ora2pg/archive/refs/tags/v24.1.tar.gz | tar xz -C /opt && \
    cd /opt/ora2pg-* && perl Makefile.PL && make && make install

# pg2mysql kurulumu (Python tabanlı örnek script)
RUN pip install pg2mysql

WORKDIR /app
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY app ./app
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"] 