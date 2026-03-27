/**
 * cryptoService.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * All client-side E2EE cryptography for SafeShare.
 *
 * Registration flow (one call → buildRegistrationPayload):
 *   1. generateAsymmetricKeyPair()      → RSA-OAEP-2048 { publicKey, privateKey }
 *   2. exportPublicKey(publicKey)       → Base64 SPKI   → stored in User.publicKey
 *   3. exportPrivateKey(privateKey)     → PKCS#8 ArrayBuffer (never stored raw)
 *   4. random salt (16 B) + IV (12 B)
 *   5. deriveKeyFromPassword(pwd, salt) → AES-GCM-256 CryptoKey (in-memory only)
 *   6. encryptPrivateKey(buf, key, iv)  → Base64 ciphertext → User.encryptedPrivateKey
 *   7. Base64-encode salt + IV          → User.keySalt / User.keyIv
 *
 * Login flow (one call → decryptPrivateKeyFromServer):
 *   A. Backend returns encryptedPrivateKey + keySalt + keyIv in its JWT response
 *   B. deriveKeyFromPassword(password, salt) → same AES key as step 5
 *   C. AES-GCM decrypt → raw PKCS#8 ArrayBuffer
 *   D. importPrivateKey(buffer)         → in-memory CryptoKey ready for file decryption
 *
 * Backend User entity fields used here:
 *   searchTag           ← unique @handle
 *   fullName            ← display name
 *   email               ← login credential
 *   password            ← BCrypt-hashed by backend (we send plaintext over HTTPS)
 *   publicKey           ← Base64 SPKI (TEXT column)
 *   encryptedPrivateKey ← Base64 AES-GCM ciphertext (TEXT column)
 *   keySalt             ← Base64 16-byte PBKDF2 salt  ⚠️ ADD TO User.java
 *   keyIv               ← Base64 12-byte AES-GCM IV   ⚠️ ADD TO User.java
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface KeyPairResult {
  publicKey: CryptoKey;
  privateKey: CryptoKey;
}

/**
 * The JSON object POSTed to /api/auth/register.
 * Field names map 1-to-1 to the Spring Boot RegisterRequest DTO.
 *
 * ⚠️  Backend checklist before wiring up:
 *   □ Add `keySalt` (TEXT) column to the _user table / User.java
 *   □ Add `keyIv`   (TEXT) column to the _user table / User.java
 *   □ Create RegisterRequest DTO with all 8 fields below
 *   □ BCrypt-hash `password` before persisting; store everything else as-is
 */
export interface RegistrationPayload {
  /** User.searchTag — unique @handle */
  searchTag: string;
  /** User.fullName */
  fullName: string;
  /** User.email */
  email: string;
  /** User.password — backend BCrypts this before storing */
  password: string;
  /** User.publicKey — Base64 SPKI RSA public key */
  publicKey: string;
  /** User.encryptedPrivateKey — Base64 AES-GCM ciphertext of the PKCS#8 private key */
  encryptedPrivateKey: string;
  /** User.keySalt — Base64 PBKDF2 salt (16 bytes) needed to re-derive the AES key on login */
  keySalt: string;
  /** User.keyIv — Base64 AES-GCM IV (12 bytes) needed to decrypt the private key on login */
  keyIv: string;
}

// ─── Step 1: RSA Key Generation ───────────────────────────────────────────────

/**
 * Generates an RSA-OAEP-2048 key pair.
 *   Public key  → uploaded to backend; other users encrypt file-access keys with it.
 *   Private key → encrypted locally and stored on the backend; decrypted on login.
 */
export async function generateAsymmetricKeyPair(): Promise<KeyPairResult> {
  const keyPair = await window.crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]), // 65537
      hash: "SHA-256",
    },
    true, // extractable — we must export both keys
    ["encrypt", "decrypt"]
  );
  return keyPair as KeyPairResult;
}

// ─── Steps 2 & 3: Key Export ──────────────────────────────────────────────────

/**
 * Exports the public key as a Base64-encoded SPKI string.
 *
 * Java backend decodes it with:
 *   KeyFactory.getInstance("RSA")
 *     .generatePublic(new X509EncodedKeySpec(Base64.getDecoder().decode(spkiBase64)));
 */
export async function exportPublicKey(publicKey: CryptoKey): Promise<string> {
  const buf = await window.crypto.subtle.exportKey("spki", publicKey);
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}

/**
 * Exports the private key as a raw PKCS#8 ArrayBuffer.
 * ⚠️  Unencrypted — pass directly to encryptPrivateKey(); never log or store it.
 */
export async function exportPrivateKey(privateKey: CryptoKey): Promise<ArrayBuffer> {
  return window.crypto.subtle.exportKey("pkcs8", privateKey);
}

// ─── Step 5: PBKDF2 Key Derivation ───────────────────────────────────────────

/**
 * Derives a non-extractable AES-GCM-256 key from a plaintext password + salt.
 *
 * 100 000 PBKDF2-SHA-256 iterations (OWASP 2023 minimum) makes each brute-force
 * guess 100 000× more expensive than a plain hash.
 *
 * @param password - User's plaintext password. Never stored.
 * @param salt     - Unique random Uint8Array(16) per user. Stored in User.keySalt.
 */
export async function deriveKeyFromPassword(
  password: string,
  salt: Uint8Array
): Promise<CryptoKey> {
  const keyMaterial = await window.crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits", "deriveKey"]
  );

  return window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt:salt as BufferSource,
      iterations: 100_000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false, // non-extractable — lives in browser memory only
    ["encrypt", "decrypt"]
  );
}

// ─── Step 6: AES-GCM Encryption / Decryption ─────────────────────────────────

/**
 * Encrypts the raw PKCS#8 private key buffer with AES-GCM.
 * Returns a Base64 string → stored in User.encryptedPrivateKey.
 *
 * @param rawPrivateKey - ArrayBuffer from exportPrivateKey().
 * @param symmetricKey  - CryptoKey from deriveKeyFromPassword().
 * @param iv            - Unique random Uint8Array(12). Stored in User.keyIv.
 */
export async function encryptPrivateKey(
  rawPrivateKey: ArrayBuffer,
  symmetricKey: CryptoKey,
  iv: Uint8Array
): Promise<string> {
  const cipherBuf = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv : iv as BufferSource },
    symmetricKey,
    rawPrivateKey
  );
  return btoa(String.fromCharCode(...new Uint8Array(cipherBuf)));
}

/**
 * Decrypts the Base64 AES-GCM ciphertext back into a raw PKCS#8 ArrayBuffer.
 * Used during login after re-deriving the AES key with the user's password.
 */
export async function decryptPrivateKeyBuffer(
  encryptedPrivateKeyBase64: string,
  symmetricKey: CryptoKey,
  iv: Uint8Array
): Promise<ArrayBuffer> {
  const cipherBuf = Uint8Array.from(atob(encryptedPrivateKeyBase64), (c) => c.charCodeAt(0));
  return window.crypto.subtle.decrypt({ name: "AES-GCM", iv:iv as BufferSource }, symmetricKey, cipherBuf);
}

/**
 * Imports a raw PKCS#8 ArrayBuffer as an in-memory, non-extractable RSA-OAEP CryptoKey.
 * This is the final login step — the returned key decrypts file-access keys.
 */
export async function importPrivateKey(pkcs8Buffer: ArrayBuffer): Promise<CryptoKey> {
  return window.crypto.subtle.importKey(
    "pkcs8",
    pkcs8Buffer,
    { name: "RSA-OAEP", hash: "SHA-256" },
    false,       // non-extractable once imported
    ["decrypt"]
  );
}

// ─── Combined Flows ───────────────────────────────────────────────────────────

/**
 * REGISTRATION — runs Steps 1–7 and returns a ready-to-POST RegistrationPayload.
 *
 * @param searchTag - Chosen @handle (→ User.searchTag).
 * @param fullName  - Display name  (→ User.fullName).
 * @param email     - Email address (→ User.email).
 * @param password  - Plaintext password; backend BCrypts it.
 */
export async function buildRegistrationPayload(
  searchTag: string,
  fullName: string,
  email: string,
  password: string
): Promise<RegistrationPayload> {
  // Steps 1–3
  const { publicKey, privateKey } = await generateAsymmetricKeyPair();
  const [publicKeyBase64, rawPrivateKey] = await Promise.all([
    exportPublicKey(publicKey),
    exportPrivateKey(privateKey),
  ]);

  // Step 4: cryptographically random salt + IV
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const iv   = window.crypto.getRandomValues(new Uint8Array(12));

  // Step 5: derive AES key from password + salt
  const symmetricKey = await deriveKeyFromPassword(password, salt);

  // Step 6: encrypt the private key
  const encryptedPrivateKey = await encryptPrivateKey(rawPrivateKey, symmetricKey, iv);

  // Step 7: Base64-encode salt + IV for JSON transport
  const keySalt = btoa(String.fromCharCode(...salt));
  const keyIv   = btoa(String.fromCharCode(...iv));

  return {
    searchTag,
    fullName,
    email,
    password,            // backend BCrypts this; never stored as plaintext
    publicKey: publicKeyBase64,
    encryptedPrivateKey,
    keySalt,
    keyIv,
  };
}

/**
 * LOGIN — re-derives the AES key from the password and decrypts the private key.
 *
 * Call this after a successful backend login response.
 * The backend's AuthResponse DTO must include: encryptedPrivateKey, keySalt, keyIv.
 *
 * @param password                  - Plaintext password just entered by the user.
 * @param encryptedPrivateKeyBase64 - User.encryptedPrivateKey from the backend response.
 * @param keySaltBase64             - User.keySalt from the backend response.
 * @param keyIvBase64               - User.keyIv from the backend response.
 *
 * @returns An in-memory RSA-OAEP CryptoKey ready to decrypt file-access keys.
 */
export async function decryptPrivateKeyFromServer(
  password: string,
  encryptedPrivateKeyBase64: string,
  keySaltBase64: string,
  keyIvBase64: string
): Promise<CryptoKey> {
  const salt = Uint8Array.from(atob(keySaltBase64), (c) => c.charCodeAt(0));
  const iv   = Uint8Array.from(atob(keyIvBase64),   (c) => c.charCodeAt(0));

  const symmetricKey = await deriveKeyFromPassword(password, salt);
  const pkcs8Buffer  = await decryptPrivateKeyBuffer(encryptedPrivateKeyBase64, symmetricKey, iv);

  return importPrivateKey(pkcs8Buffer);
}