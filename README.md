# SafeShare 🔐

**Zero-Knowledge End-to-End Encrypted File Sharing & Collaboration**

SafeShare is a privacy-first file sharing and collaboration platform built with a zero-knowledge architecture. Files are encrypted in the browser with AES-256-GCM before they leave it, and the encryption keys are wrapped with RSA-OAEP, so the server and its administrators never see file contents.

> A graduation project. See [Credits](#-credits).

---

## 🏗️ Architecture

| Layer        | Technology                                            |
|--------------|-------------------------------------------------------|
| **Frontend** | React 19 (TypeScript), Vite, Tailwind CSS, shadcn/ui  |
| **Backend**  | Spring Boot 4 (Java 17), Spring Security, Spring Data JPA |
| **Database** | PostgreSQL 15                                         |
| **Storage**  | Encrypted blobs on local disk (default) or Amazon S3  |
| **Auth**     | JWT + e-mail OTP verification                         |
| **AI**       | Google Gemini 2.5 Flash (in-app assistant, optional)  |
| **DevOps**   | Docker & Docker Compose                               |

## 🚀 Features

- 🔒 **End-to-end encryption**: AES-256-GCM + RSA-OAEP, zero-knowledge
- 📁 **Files and folders**: upload, organise, rename, soft-delete, restore
- 👥 **Roles**: Viewer, Editor, Co-Owner
- 🔑 **OTP-protected sign-in** with brute-force protection
- 📥 **Download and view limits** per file
- 📊 **Audit log** of who did what and when
- 🗂️ **Groups** with invite codes and role-based membership
- 💬 **Live chat and notifications** (Server-Sent Events)
- 🤖 **AI assistant** (Gemini)
- 💾 **Backups** (needs Amazon S3)
- 🌙 Light, dark and system themes, responsive layout

---

## ⚡ Quick start (Docker, nothing else to install)

You only need [Docker](https://www.docker.com/products/docker-desktop/).

```bash
git clone <this repository>
cd SafeShare

cp .env.example .env
# Open .env and set JWT_SECRET (generate one with: openssl rand -base64 32)

docker compose up --build
```

Open **http://localhost:5173**.

The first build takes a few minutes. Stop with `Ctrl+C`; your data is kept in Docker volumes.

### Verification codes (OTP)

Sign-up and sign-in send a 6-digit code by e-mail. Two ways to get it working:

1. **Real e-mail**: set `MAIL_USERNAME` and `MAIL_PASSWORD` in `.env` (a Gmail address with an
   [App Password](https://myaccount.google.com/apppasswords)).
2. **Local demo without e-mail**: set `DEV_LOG_OTP=true` in `.env`. Codes are then printed in the API log:
   `docker compose logs -f api`. **Never use this on a public server.**

---

## 🔧 Configuration

Everything is set with environment variables (in `.env`). No secrets live in the code.

| Variable | Required | Description |
|---|---|---|
| `JWT_SECRET` | ✅ | Signs login tokens. Base64, at least 256 bits. |
| `MAIL_USERNAME`, `MAIL_PASSWORD` | for real e-mail | Gmail address and App Password |
| `DEV_LOG_OTP` | no | `true` prints OTPs in the log when e-mail is not configured (demos only) |
| `GCP_API_KEY` | no | Gemini key for the AI assistant |
| `DB_USERNAME`, `DB_PASSWORD` | no | Database login (defaults are for local use) |
| `STORAGE_TYPE` | no | `local` (default) or `s3` |
| `CORS_ALLOWED_ORIGINS` | no | Allowed browser origins, comma separated |
| `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `AWS_S3_BUCKET_FILES` | for S3 | Only for `STORAGE_TYPE=s3`, profile pictures and backups |

Without AWS keys the app works normally. Only profile pictures and backups need S3.

---

## 🛠️ Development setup (without Docker for the app)

Requirements: Node.js ≥ 18, Java 17, Docker (for the database).

```bash
# 1. database
docker compose up -d db          # PostgreSQL on localhost:5433

# 2. backend (http://localhost:8080)
cd backend
export JWT_SECRET=$(openssl rand -base64 32)
export DB_URL=jdbc:postgresql://localhost:5433/safeshare_db
export DEV_LOG_OTP=true          # codes appear in this terminal
./mvnw spring-boot:run

# 3. frontend (http://localhost:5173), in another terminal
npm install
npm run dev
```

The Vite dev server proxies `/api` to the backend (`API_PROXY_TARGET` changes the target).

Tests: `cd backend && ./mvnw test`

---

## 🔐 Security notes

What is in place:

- Client-side encryption (AES-256-GCM, RSA-OAEP); the server stores only ciphertext.
- Passwords hashed with BCrypt; the login token (JWT) expires after 30 minutes and its key comes from the environment.
- Account lock after 5 wrong passwords (15 minutes).
- OTP codes: generated with `SecureRandom`, single use, valid for 10 minutes, burned after 5 wrong guesses, one new code per 60 seconds.
- Rate limit on sign-up and password-reset requests (10 per 10 minutes per visitor), so the e-mail account cannot be flooded.
- Owner and share checks on every file action.
- No OTPs, passwords or tokens in the logs (the only exception is the explicit `DEV_LOG_OTP` demo switch).

Known limitations (deliberate trade-offs, or future work):

- The private key is kept in the browser's `localStorage` so users do not retype their password constantly. A cross-site-scripting bug would expose it.
- The live-updates stream (`/api/v1/sse/subscribe`) takes the token in the URL because the browser `EventSource` cannot send headers.
- Sign-up tells the user when an e-mail is already registered.
- Only one version of a file is kept when using local storage.

If you find a security problem, please open a private security advisory instead of a public issue.

---

## 🗂️ Project structure

```
SafeShare/
├── backend/                     # Spring Boot API
│   └── src/main/java/com/motasem/safeshare/
│       ├── config/              # Security, S3
│       ├── controller/          # REST controllers
│       ├── model/               # JPA entities
│       ├── repository/          # Spring Data repositories
│       ├── security/            # JWT filter and service, rate limit
│       └── services/            # Business logic, file storage (local / S3)
├── src/                         # React frontend
├── docker/                      # nginx config and frontend Dockerfile
├── docker-compose.yml           # database + API + web
└── .env.example                 # configuration template
```

## 🌐 API summary

### Authentication (`/api/v1/auth`)
| Method | Endpoint           | Description                |
|--------|--------------------|----------------------------|
| POST   | `/register`        | Register a new user        |
| POST   | `/authenticate`    | Sign in (sends an OTP)     |
| POST   | `/verify-otp`      | Verify the OTP, get a JWT  |
| POST   | `/resend-otp`      | Send a new OTP             |
| POST   | `/forgot-password` | Request a reset code       |
| POST   | `/reset-password`  | Reset the password         |

### Files (`/api/v1/files`)
| Method | Endpoint          | Description                |
|--------|-------------------|----------------------------|
| POST   | `/upload`         | Upload an encrypted file   |
| GET    |                   | List the user's files      |
| GET    | `/{id}/download`  | Download an encrypted file |
| DELETE | `/{id}`           | Soft-delete a file         |

Groups, folders, chat, notifications and backups have their own controllers under `/api/v1`.

---

## 👤 Credits

- **Original author: Motasem Alatawna** ([MutasimAlatawneh](https://github.com/MutasimAlatawneh)). Designed and built SafeShare. The full commit history is kept here, and the original repository is <https://github.com/MutasimAlatawneh/SafeShare>.
- **Hassan Aldajah**: security review and fixes, configuration through environment variables, local file storage, Docker packaging and this README.

## 📄 License

No license has been chosen yet. Until the authors add one, all rights are reserved and the project is shared for academic and assessment purposes.
