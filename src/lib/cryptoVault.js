/**
 * Cryptographic Offline Storage Vault for PWA
 * Uses Web Crypto API (AES-GCM 256-bit) to ensure all sensitive records
 * stored in browser localStorage or offline caches are encrypted at rest.
 */

const VAULT_PREFIX = 'dcp_vault_';
const KEY_STORAGE_NAME = 'dcp_device_key';

// Initialize or retrieve persistent local device key
async function getDeviceKey() {
  if (typeof window === 'undefined' || !window.crypto || !window.crypto.subtle) {
    return null;
  }

  try {
    let rawKey = localStorage.getItem(KEY_STORAGE_NAME);
    if (!rawKey) {
      // Generate a new 256-bit random key
      const key = await window.crypto.subtle.generateKey(
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
      );
      const exported = await window.crypto.subtle.exportKey('jwk', key);
      localStorage.setItem(KEY_STORAGE_NAME, JSON.stringify(exported));
      return key;
    } else {
      const jwk = JSON.parse(rawKey);
      return await window.crypto.subtle.importKey(
        'jwk',
        jwk,
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
      );
    }
  } catch (err) {
    console.warn('CryptoVault key error, fallback to unencrypted:', err);
    return null;
  }
}

export const cryptoVault = {
  /**
   * Encrypts and stores data
   */
  setItem: async (key, value) => {
    const storageKey = `${VAULT_PREFIX}${key}`;
    try {
      const cryptoKey = await getDeviceKey();
      const stringValue = JSON.stringify(value);

      if (!cryptoKey) {
        localStorage.setItem(storageKey, stringValue);
        return;
      }

      // Generate 12-byte initialization vector (IV)
      const iv = window.crypto.getRandomValues(new Uint8Array(12));
      const encoded = new TextEncoder().encode(stringValue);

      const ciphertext = await window.crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        cryptoKey,
        encoded
      );

      // Store IV + Ciphertext as Base64
      const combined = new Uint8Array(iv.length + ciphertext.byteLength);
      combined.set(iv, 0);
      combined.set(new Uint8Array(ciphertext), iv.length);

      const base64 = btoa(String.fromCharCode.apply(null, combined));
      localStorage.setItem(storageKey, `enc:${base64}`);
    } catch (err) {
      console.error('Vault set error:', err);
      localStorage.setItem(storageKey, JSON.stringify(value));
    }
  },

  /**
   * Retrieves and decrypts data
   */
  getItem: async (key) => {
    const storageKey = `${VAULT_PREFIX}${key}`;
    const raw = localStorage.getItem(storageKey);
    if (!raw) return null;

    if (!raw.startsWith('enc:')) {
      try { return JSON.parse(raw); } catch { return raw; }
    }

    try {
      const cryptoKey = await getDeviceKey();
      if (!cryptoKey) return null;

      const base64 = raw.slice(4);
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }

      const iv = bytes.slice(0, 12);
      const ciphertext = bytes.slice(12);

      const decrypted = await window.crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        cryptoKey,
        ciphertext
      );

      const decoded = new TextDecoder().decode(decrypted);
      return JSON.parse(decoded);
    } catch (err) {
      console.error('Vault decryption error:', err);
      return null;
    }
  },

  /**
   * Removes item from vault
   */
  removeItem: (key) => {
    localStorage.removeItem(`${VAULT_PREFIX}${key}`);
  }
};
