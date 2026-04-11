// src/lib/encryption.ts
// Zero-Knowledge architecture works

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
export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const cleanBase64 = base64
    .replace(/-----BEGIN[^-]+-----/g, '')
    .replace(/-----END[^-]+-----/g, '')
    .replace(/[\s\n\r]+/g, '');

  const binaryString = window.atob(cleanBase64);
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
 */
export async function encryptFile(
  file: File,
  aesKey: CryptoKey
): Promise<{ encryptedBlob: Blob; iv: string }> {
  const fileBuffer = await file.arrayBuffer();
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

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
 */
export async function encryptKeyWithRSA(
  aesKey: CryptoKey,
  publicKeyBase64: string
): Promise<string> {
  const exportedAesKey = await window.crypto.subtle.exportKey("raw", aesKey);
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

  const encryptedAesKeyBuffer = await window.crypto.subtle.encrypt(
    { name: "RSA-OAEP" },
    rsaPublicKey,
    exportedAesKey
  );

  return arrayBufferToBase64(encryptedAesKeyBuffer);
}

/**
 * Step 4: Decrypt the AES File Key using the User's RSA Private Key
 */
export async function decryptKeyWithRSA(
  encryptedKeyBase64: string,
  privateKeyBase64: string
): Promise<CryptoKey> {
  const privateKeyBuffer = base64ToArrayBuffer(privateKeyBase64);
  
  const rsaPrivateKey = await window.crypto.subtle.importKey(
    "pkcs8",
    privateKeyBuffer,
    {
      name: "RSA-OAEP",
      hash: "SHA-256",
    },
    false,
    ["decrypt"]
  );

  const encryptedAesKeyBuffer = base64ToArrayBuffer(encryptedKeyBase64);

  const rawAesKey = await window.crypto.subtle.decrypt(
    { name: "RSA-OAEP" },
    rsaPrivateKey,
    encryptedAesKeyBuffer
  );

  // ---> THE FIX IS HERE <---
  return await window.crypto.subtle.importKey(
    "raw",
    rawAesKey,
    { name: "AES-GCM" },
    true, // CHANGED TO TRUE: We MUST extract it to share files!
    ["encrypt", "decrypt"] // Added 'encrypt' so it mirrors file generation perfectly
  );
}

/**
 * Step 5: Decrypt the actual file using the unlocked AES-256 key
 */
export async function decryptFile(
  encryptedBuffer: ArrayBuffer,
  aesKey: CryptoKey,
  ivBase64: string
): Promise<Blob> {
  const iv = base64ToArrayBuffer(ivBase64);

  const decryptedBuffer = await window.crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: new Uint8Array(iv),
    },
    aesKey,
    encryptedBuffer
  );

  return new Blob([decryptedBuffer]);
}