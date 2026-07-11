# SafeShare 🔐

**Zero-Knowledge End-to-End Encrypted File Sharing & Collaboration**

SafeShare is a privacy-first file sharing and collaboration platform built with a zero-knowledge architecture. All files are encrypted client-side using AES-256-GCM before leaving the browser, and encryption keys are wrapped with RSA-OAEP — meaning no server or administrator can ever read user files.

---

## 🏗️ Architecture Overview

| Layer       | Technology                                          |
|-------------|-----------------------------------------------------|
| **Frontend** | React 19 (TypeScript), Vite, Tailwind CSS, shadcn/ui |
| **Backend**  | Spring Boot 4.0.3 (Java 17), Spring Security, Spring Data JPA |
| **Database** | PostgreSQL 15                                        |
| **Storage**  | AWS S3 (encrypted file blobs)                       |
| **Auth**     | JWT (JSON Web Tokens) + OTP email verification      |
| **AI**       | Google Gemini 2.5 Flash (in-app AI assistant)       |
| **Email**    | Gmail SMTP (OTP delivery, notifications)            |
| **DevOps**   | Docker & Docker Compose                             |

---

## 🚀 Features

- 🔒 **End-to-End Encryption** — AES-256-GCM + RSA-OAEP zero-knowledge architecture
- 📁 **Secure File & Folder Management** — Upload, organise, rename, and soft-delete
- 👥 **Role-Based Permissions** — Viewer, Editor, Co-Owner with granular access controls
- 🔑 **OTP-Protected Authentication** — Email-based one-time password verification
- 📥 **Download & View Limits** — Configurable max downloads/views per file
- 📊 **Audit Logs** — Full activity trail (who did what, when)
- 🗂️ **Collaborative Groups** — Create groups, invite via code, role-based membership
- 💬 **Real-Time Chat** — Built-in messaging with SSE (Server-Sent Events)
- 🛡️ **Virus Scanning** — File scan status tracked on upload
- ♻️ **Trash & Restore** — Soft-delete with time-stamped recovery
- 🤖 **AI Assistant** — Gemini-powered help and FAQ
- 💾 **Backup Management** — Full and incremental backup jobs
- 🔔 **Notifications** — Real-time in-app notifications
- 🌙 **Theme Support** — Light, dark, and system theme preferences
- 📱 **Responsive Design** — Fully responsive across devices

---

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

| Tool           | Version  | Purpose                    |
|----------------|----------|----------------------------|
| **Node.js**    | ≥ 18     | Frontend runtime           |
| **npm** or **Bun** | Latest   | Package manager        |
| **Java JDK**   | 17       | Backend runtime            |
| **Maven**      | ≥ 3.8    | Backend build tool         |
| **PostgreSQL** | ≥ 15     | Database                   |
| **Docker** *(optional)* | Latest | Containerised setup |

---

## ⚙️ Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/MutasimAlatawneh/SafeShare.git
cd SafeShare
```

### 2. Database Setup

#### Option A: Local PostgreSQL

Create the database manually:

```sql
CREATE DATABASE safeshare_dp;
```

#### Option B: Docker (Recommended)

```bash
docker-compose up -d db
```

This starts a PostgreSQL 15 container on port **5433** with:
- Database: `safeshare_db`
- User: `safeshare_user`
- Password: `safeshare_password`

---

### 3. Backend Setup (Spring Boot)

#### 3.1 Configure Environment

Create / update the application config at:

```
backend/src/main/resources/application.yml
```

```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/safeshare_dp
    username: postgres
    password: <YOUR_PASSWORD>
    driver-class-name: org.postgresql.Driver

  jpa:
    hibernate:
      ddl-auto: update       # Auto-creates/updates tables
    show-sql: true
    database: postgresql

  mail:
    host: smtp.gmail.com
    port: 587
    username: <YOUR_EMAIL>
    password: <YOUR_APP_PASSWORD>

gemini:
  api:
    key: ${GCP_API_KEY}

aws:
  accessKeyId: ${AWS_ACCESS_KEY_ID}
  secretKey: ${AWS_SECRET_ACCESS_KEY}
  region: ${AWS_REGION}
  s3:
    bucket:
      files: <YOUR_BUCKET_NAME>
```

> **Note:** `application.yml` is git-ignored for security. You must create it locally.

#### 3.2 Build & Run

```bash
cd backend
./mvnw clean install -DskipTests
./mvnw spring-boot:run
```

The backend API will start on **http://localhost:8080**.

---

### 4. Frontend Setup (React + Vite)

#### 4.1 Configure Environment

Create a `.env` file in the project root:

```env
VITE_API_URL=http://localhost:8080/api
```

#### 4.2 Install & Run

```bash
# Using npm
npm install
npm run dev

# OR using Bun
bun install
bun run dev
```

The frontend will start on **http://localhost:5173**.

---

### 5. Full Docker Setup (Optional)

To run the entire stack in Docker:

```bash
# Build the backend JAR first
cd backend
./mvnw clean package -DskipTests
cd ..

# Start all services
docker-compose up --build
```

Services:
- **PostgreSQL** → `localhost:5433`
- **Backend API** → `localhost:8080`

---

## 🔑 Environment Variables

| Variable               | Description                        | Required |
|------------------------|------------------------------------|----------|
| `VITE_API_URL`         | Backend API base URL               | ✅       |
| `GCP_API_KEY`          | Google Gemini API key              | ✅       |
| `AWS_ACCESS_KEY_ID`    | AWS access key for S3              | ✅       |
| `AWS_SECRET_ACCESS_KEY`| AWS secret key for S3              | ✅       |
| `AWS_REGION`           | AWS region (e.g., `eu-west-2`)     | ✅       |

---

## 🗂️ Project Structure

```
SafeShare/
├── backend/                        # Spring Boot API
│   ├── src/main/java/com/motasem/safeshare/
│   │   ├── config/                 # Security, CORS, S3 configuration
│   │   ├── controller/             # REST API controllers
│   │   ├── model/                  # JPA entity classes
│   │   ├── repository/             # Spring Data repositories
│   │   ├── security/               # JWT filter & service
│   │   ├── services/               # Business logic layer
│   │   └── transaction/            # File transaction entities
│   ├── Dockerfile
│   └── pom.xml
├── src/                            # React frontend
│   ├── components/
│   │   ├── dashboard/              # Dashboard feature components
│   │   ├── auth/                   # Authentication components
│   │   └── ui/                     # shadcn/ui components
│   ├── context/                    # Auth & Theme providers
│   ├── pages/                      # Route page components
│   ├── services/                   # API service layer
│   └── hooks/                      # Custom React hooks
├── docker-compose.yml
├── package.json
└── README.md
```

---

## 🌐 API Endpoints Summary

### Authentication (`/api/v1/auth`)
| Method | Endpoint                  | Description               |
|--------|---------------------------|---------------------------|
| POST   | `/register`               | Register a new user       |
| POST   | `/authenticate`           | Login (returns JWT)       |
| POST   | `/verify-otp`             | Verify OTP code           |
| POST   | `/forgot-password`        | Request password reset    |
| POST   | `/reset-password`         | Reset password with OTP   |

### Files (`/api/v1/files`)
| Method | Endpoint                  | Description               |
|--------|---------------------------|---------------------------|
| POST   | `/upload`                 | Upload encrypted file     |
| GET    | `/my-files`               | List user's files         |
| GET    | `/download/{id}`          | Download & decrypt file   |
| DELETE | `/{id}`                   | Soft-delete a file        |
| POST   | `/share`                  | Share file with user      |
| GET    | `/shared-with-me`         | List files shared with me |

### Groups (`/api/v1/groups`)
| Method | Endpoint                  | Description               |
|--------|---------------------------|---------------------------|
| POST   | `/create`                 | Create a new group        |
| POST   | `/join`                   | Join via invite code      |
| GET    | `/my-groups`              | List user's groups        |
| POST   | `/{id}/upload`            | Upload file to group      |
| GET    | `/{id}/files`             | List group files          |

### Folders (`/api/v1/folders`)
| Method | Endpoint                  | Description               |
|--------|---------------------------|---------------------------|
| POST   | `/create`                 | Create a new folder       |
| GET    | `/my-folders`             | List user's folders       |
| DELETE | `/{id}`                   | Delete a folder           |

---

## 🧪 Running Tests

```bash
cd backend
./mvnw test
```

---

## 👤 Author

**Mutasim Alatawneh**  
Full-Stack Developer

---

## 📄 License

This project is for academic / assessment purposes.
