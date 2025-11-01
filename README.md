# Forum API (Studi Kasus Garuda Game)

Ini adalah implementasi API untuk aplikasi forum, dibangun sebagai studi kasus untuk Garuda Game - Backend Expert Course - Dicoding. Proyek ini menggunakan Node.js, Hapi, dan PostgreSQL, serta menerapkan prinsip-prinsip **Clean Architecture** dan **Automation Testing** (Unit, Integration, dan Endpoint).

## 🚀 Fitur

* Autentikasi Pengguna (Register, Login, Logout, Refresh Token)
* Manajemen Thread (Membuat Thread Baru, Melihat Detail Thread)
* Manajemen Komentar (Menambah Komentar, Menghapus Komentar)
* Manajemen Balasan (Menambah Balasan, Menghapus Balasan)

## 💻 Teknologi yang Digunakan

* **Runtime**: Node.js
* **Framework**: Hapi
* **Database**: PostgreSQL
* **Autentikasi**: @hapi/jwt (JWT)
* **Password Hashing**: bcrypt
* **Migrasi DB**: node-pg-migrate
* **Testing**: Jest
* **DI Container**: instances-container

---

## 🏁 Persiapan (Getting Started)

### 1. Prasyarat

* Node.js (v22 atau lebih baru)
* Layanan PostgreSQL yang sedang berjalan

### 2. Instalasi

1.  Clone repositori ini (atau gunakan file yang sudah Anda miliki).
2.  Install semua *dependency*:
    ```bash
    npm install
    ```

### 3. Konfigurasi Lingkungan

1.  Salin file `.env.example` menjadi `.env`.
    ```bash
    # (Untuk Mac/Linux)
    cp .env.example .env
    
    # (Untuk Windows)
    copy .env.example .env
    ```
2.  Buka dan edit file `.env` baru Anda. Isi semua variabel yang diperlukan, terutama untuk koneksi database (development dan test) dan kunci JWT.

### 4. Setup Database

Kami merekomendasikan untuk menambahkan skrip *helper* ke `package.json` Anda untuk mempermudah *setup*:

```json
  "scripts": {
    "start": "node src/app.js",
    "start:dev": "nodemon src/app.js",
    "test": "jest --setupFiles dotenv/config -i",
    "migrate": "node-pg-migrate",
    "migrate:test": "node-pg-migrate -f config/database/test.json",
    "db:create": "node config/database/create-db.js",
    "db:create:test": "node config/database/create-db-test.js"
  },
```
Setelah itu, jalankan perintah berikut secara berurutan:

1. Buat Database (menggunakan skrip yang kita buat):

```bash

npm run db:create
npm run db:create:test
```

2. Jalankan Migrasi (untuk membuat semua tabel):

```bash
npm run migrate
```

### 5. Menjalankan Server

Untuk mode development (dengan Nodemon):

```bash
npm run start:dev
```

Untuk mode production:

```bash
npm run start
```

## 🧪 Menjalankan Tes

Pastikan Anda telah membuat dan memigrasikan database tes. Untuk menjalankan semua suite tes (unit, integration, dan endpoint):

```bash
npm run test
```
## 📚 Dokumentasi API

### Autentikasi
- POST /authentications

Deskripsi: Login pengguna.

Body: { "username": "string", "password": "string" }

- PUT /authentications

Deskripsi: Memperbarui access token menggunakan refresh token.

Body: { "refreshToken": "string" }

- DELETE /authentications

Deskripsi: Logout pengguna (menghapus refresh token).

Body: { "refreshToken": "string" }

### Pengguna
- POST /users

Deskripsi: Registrasi pengguna baru.

Body: { "username": "string", "password": "string", "fullname": "string" }

### Threads
- POST /threads

Deskripsi: Membuat thread baru (Memerlukan Autentikasi).

Body: { "title": "string", "body": "string" }

- GET /threads/{threadId}

Deskripsi: Mendapatkan detail lengkap dari thread, termasuk komentar dan balasan.

### Komentar
- POST /threads/{threadId}/comments

Deskripsi: Menambah komentar baru pada thread (Memerlukan Autentikasi).

Body: { "content": "string" }

- DELETE /threads/{threadId}/comments/{commentId}

Deskripsi: Menghapus komentar (hanya pemilik, soft delete) (Memerlukan Autentikasi).

### Balasan (Replies)
- POST /threads/{threadId}/comments/{commentId}/replies

Deskripsi: Menambah balasan baru pada komentar (Memerlukan Autentikasi).

Body: { "content": "string" }

- DELETE /threads/{threadId}/comments/{commentId}/replies/{replyId}

Deskripsi: Menghapus balasan (hanya pemilik, soft delete) (Memerlukan Autentikasi).