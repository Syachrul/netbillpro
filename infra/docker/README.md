# Infra lokal (Docker Compose)

Menjalankan Postgres 16 + Redis 7 untuk pengembangan.

## Setup sekali

Salin env example:

    cp infra/docker/.env.example infra/docker/.env

Sesuaikan nilai di `.env` bila perlu.

## Jalankan

    docker compose -f infra/docker/docker-compose.yml --env-file infra/docker/.env up -d

## Cek status

    docker compose -f infra/docker/docker-compose.yml ps

Postgres harus healthy sebelum aplikasi start.

## Hentikan

    docker compose -f infra/docker/docker-compose.yml down

## Hapus data (reset total)

    docker compose -f infra/docker/docker-compose.yml down -v

Gunakan dengan hati-hati, semua data lokal hilang.

## Koneksi default (development)

| Layanan | URL |
| :--- | :--- |
| PostgreSQL | postgresql://netbill:netbill_dev@localhost:5432/netbill |
| Redis | redis://localhost:6379 |
