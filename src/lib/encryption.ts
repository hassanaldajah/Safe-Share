// src/lib/encryption.ts

/**
 * Helper: Convert ArrayBuffer to Base64 String
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

/**
 * Helper: Convert Base64 String to ArrayBuffer
 */
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = window.atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Step 1: Generate a random AES-256 key for a specific file
 */
export async function generateFileKey(): Promise<CryptoKey> {
  return await window.crypto.subtle.generateKey(
    {
      name: "AES-GCM",
      length: 256,
    },
    true, // extractable (so we can encrypt it with RSA later)
    ["encrypt", "decrypt"]
  );
}

/**
 * Step 2: Encrypt the actual file using the AES-256 key
 * Returns the encrypted file as a Blob, and the IV used to encrypt it.
 */
export async function encryptFile(
  file: File,
  aesKey: CryptoKey
): Promise<{ encryptedBlob: Blob; iv: string }> {
  // Read file as ArrayBuffer
  const fileBuffer = await file.arrayBuffer();

  // Generate a random Initialization Vector (IV)
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  // Encrypt the file buffer
  const encryptedBuffer = await window.crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    aesKey,
    fileBuffer
  );

  return {
    encryptedBlob: new Blob([encryptedBuffer], { type: "application/octet-stream" }),
    iv: arrayBufferToBase64(iv.buffer),
  };
}

/**
 * Step 3: Encrypt the AES File Key using the User's RSA Public Key
 * This way, only the user (who holds the private key) can ever unlock this file.
 */
export async function encryptKeyWithRSA(
  aesKey: CryptoKey,
  publicKeyBase64: string
): Promise<string> {
  // 1. Export the AES key to raw bytes
  const exportedAesKey = await window.crypto.subtle.exportKey("raw", aesKey);

  // 2. Import the User's RSA Public Key
  const publicKeyBuffer = base64ToArrayBuffer(publicKeyBase64);
  const rsaPublicKey = await window.crypto.subtle.importKey(
    "spki",
    publicKeyBuffer,
    {
      name: "RSA-OAEP",
      hash: "SHA-256",
    },
    false,
    ["encrypt"]
  );

  // 3. Encrypt the AES key with the RSA Public Key
  const encryptedAesKeyBuffer = await window.crypto.subtle.encrypt(
    {
      name: "RSA-OAEP",
    },
    rsaPublicKey,
    exportedAesKey
  );

  // 4. Return as Base64 string to safely send to Spring Boot
  return arrayBufferToBase64(encryptedAesKeyBuffer);
}