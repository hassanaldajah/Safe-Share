# SafeShare — Assumptions & Design Decisions

This document outlines the key assumptions, constraints, and design decisions made during the development of SafeShare.

---

## 1. Security & Encryption

| # | Assumption | Rationale |
|---|-----------|-----------|
| 1.1 | **Client-side encryption only** — All file encryption (AES-256-GCM) and key wrapping (RSA-OAEP) happens in the browser. The server never sees plaintext data or raw encryption keys. | Guarantees zero-knowledge architecture; even a compromised server cannot read user files. |
| 1.2 | **Server stores encrypted private keys** — The user's RSA private key is encrypted with a passphrase-derived key (PBKDF2) and stored server-side along with its salt and IV. | Enables cross-device access without requiring users to manually export/import keys. |
| 1.3 | **JWT tokens are stateless** — No server-side session store; all authentication state is carried in the JWT. Token validity is managed via expiration claims. | Simplifies horizontal scaling and aligns with RESTful stateless principles. |
| 1.4 | **OTP codes are time-limited** — Each OTP has a server-side expiry timestamp (`otp_expiry`). Expired OTPs are rejected. | Prevents replay attacks and ensures short-lived verification windows. |
| 1.5 | **Account lockout after repeated failures** — Brute-force protection locks accounts after a configurable number of failed login attempts (`failed_attempt_count`). | Mitigates credential-stuffing and brute-force attacks without rate-limiting infrastructure. |

---

## 2. Database & Data Model

| # | Assumption | Rationale |
|---|-----------|-----------|
| 2.1 | **Hibernate `ddl-auto: update`** — The schema is auto-managed by Hibernate in development. No manual migration scripts (e.g., Flyway/Liquibase) are used. | Speeds up development iteration. For production, a migration tool should be adopted. |
| 2.2 | **Soft deletes for files** — Files are never physically deleted from the database on user action. Instead, `is_deleted` is set to `true` and `deleted_at` is recorded. | Enables trash/restore functionality and protects against accidental data loss. |
| 2.3 | **Single PostgreSQL instance** — The application assumes a single database instance with no replication or sharding. | Sufficient for the current scale; read replicas can be added later if needed. |
| 2.4 | **Integer auto-increment IDs** — Most entities use `GenerationType.IDENTITY` (auto-increment integers) for primary keys. UUIDs are used for `FileVersion`, `Notification`, and `FileTransaction`. | Integer IDs are simpler and more performant for the current scale. UUIDs are used where external exposure or distributed generation is expected. |
| 2.5 | **No cascading hard deletes on User** — Deleting a user does not cascade-delete their files, shares, or group memberships at the database level. | Prevents accidental data loss; admin intervention is required for full account purge. |

---

## 3. File Storage & Management

| # | Assumption | Rationale |
|---|-----------|-----------|
| 3.1 | **AWS S3 for file storage** — Encrypted file blobs are stored in S3, while metadata (names, keys, paths) is stored in PostgreSQL. | Separates scalable blob storage from relational metadata. |
| 3.2 | **File versioning via S3** — Each file version is tracked with an `awsVersionId` in the `file_versions` table, relying on S3 versioning. | Leverages S3's built-in versioning rather than duplicating blobs. |
| 3.3 | **100 MB max upload size** — Spring Boot is configured with `max-file-size: 100MB` and `max-request-size: 100MB`. | Balances usability with server resource constraints. Can be adjusted per deployment. |
| 3.4 | **Local fallback storage** — A `backend/uploads/` directory exists for local file storage during development when S3 is not configured. | Allows offline development without AWS credentials. |
| 3.5 | **Download/view limits are optional** — `max_downloads` and `max_views` on files and shares are nullable. When `null`, access is unlimited. | Provides flexible sharing — not all files need access restrictions. |

---

## 4. Groups & Collaboration

| # | Assumption | Rationale |
|---|-----------|-----------|
| 4.1 | **Group limit per user** — A user can own a maximum of 5 groups. The `owner_id` on `GroupEntity` is used to enforce this limit. | Prevents abuse and keeps the platform manageable for free-tier users. |
| 4.2 | **Invite code join** — Groups are joined via a unique `invite_code` (format: `GRP-XXXX-XXXX`), not by direct invitation. | Simplifies the join flow and avoids a separate invitation/approval system. |
| 4.3 | **Three group roles only** — `ADMIN`, `EDITOR`, `VIEWER`. There is no "Owner" role at the membership level; ownership is tracked via the `owner_id` FK on the group. | Keeps the RBAC model simple while covering common collaboration patterns. |
| 4.4 | **Encrypted group keys** — Each `GroupMember` record stores an `encryptedGroupKey` — the group's shared AES key encrypted with that member's RSA public key. | Maintains zero-knowledge: the server distributes keys without ever knowing them. |

---

## 5. Frontend & UX

| # | Assumption | Rationale |
|---|-----------|-----------|
| 5.1 | **SPA with client-side routing** — The app is a single-page React application with `react-router-dom`. There is no server-side rendering. | Adequate for a dashboard-style app; SSR is not needed for this use case. |
| 5.2 | **Theme persisted in both local storage and database** — The selected theme (`light`/`dark`/`system`) is saved locally for instant loading and synced to the server for cross-device consistency. | Provides the best UX: no flash on reload + consistent experience across devices. |
| 5.3 | **Protected routes assume valid JWT** — Dashboard routes (`/dashboard`, `/MyFolders`, etc.) assume the user has a valid JWT stored in local storage. No route guard redirects are handled at the router level. | Simplifies routing; API calls will return 401 and the frontend handles re-authentication. |
| 5.4 | **SSE for real-time updates** — Server-Sent Events (not WebSocket) are used for real-time notifications and chat updates. | SSE is simpler, works over HTTP/1.1, and is sufficient for unidirectional server-to-client push. |

---

## 6. Infrastructure & Deployment

| # | Assumption | Rationale |
|---|-----------|-----------|
| 6.1 | **Docker Compose for local orchestration** — `docker-compose.yml` defines the `db` (PostgreSQL) and `api` (Spring Boot) services. The frontend is run separately via `npm run dev`. | Keeps the local dev experience simple while containerising the critical services. |
| 6.2 | **CORS restricted to known origins** — Only `localhost:5173`, `safe-share.site`, and `www.safe-share.site` are allowed. | Prevents unauthorised cross-origin requests in production. |
| 6.3 | **No HTTPS in local development** — Local dev uses plain HTTP. TLS termination is assumed to be handled by a reverse proxy (e.g., Nginx, AWS ALB) in production. | Standard practice; avoids self-signed certificate complexity during development. |
| 6.4 | **Sensitive config is git-ignored** — `application.yml` and `.env` are in `.gitignore`. Developers must create these files locally. | Prevents accidental credential leaks to version control. |
| 6.5 | **Gmail SMTP for email** — OTP delivery and notifications use Gmail SMTP with an app-specific password. | Quick to set up for development/demo. A dedicated transactional email service (SendGrid, SES) should be used in production. |

---

## 7. Limitations & Future Work

| Area | Current State | Future Improvement |
|------|--------------|-------------------|
| **Database migrations** | Hibernate `ddl-auto: update` | Adopt Flyway or Liquibase for versioned migrations |
| **Search** | Basic tag-based user search | Full-text search with Elasticsearch for files and content |
| **Virus scanning** | Status field tracked but scan not fully integrated | Integrate ClamAV or a cloud-based scanning API |
| **Payment/Billing** | Stripe webhook endpoint exists | Complete Stripe integration with subscription plans |
| **File compression** | Boolean flag exists on files | Implement server-side compression (gzip/brotli) before S3 upload |
| **Monitoring** | None | Add Spring Boot Actuator, Prometheus, and Grafana |
| **Testing** | Basic Spring Boot tests | Increase coverage with integration tests and Cypress E2E |
