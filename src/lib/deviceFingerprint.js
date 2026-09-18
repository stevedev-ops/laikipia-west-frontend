/**
 * Device Cryptographic Fingerprint
 * Generates a stable deterministic device signature using browser hardware traits.
 * Prevents stolen tokens from being replayed on foreign attacker machines.
 */

let cachedFingerprint = null;

export async function getDeviceFingerprint() {
  if (cachedFingerprint) return cachedFingerprint;

  try {
    const components = [
      navigator.userAgent,
      navigator.language,
      screen.colorDepth,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset(),
      Intl.DateTimeFormat().resolvedOptions().timeZone,
      navigator.hardwareConcurrency || 'unknown',
    ];

    const dataString = components.join('|||');
    const encoder = new TextEncoder();
    const data = encoder.encode(dataString);

    if (window.crypto && window.crypto.subtle) {
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      cachedFingerprint = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 32);
    } else {
      // Simple fallback hash
      let hash = 0;
      for (let i = 0; i < dataString.length; i++) {
        hash = (hash << 5) - hash + dataString.charCodeAt(i);
        hash |= 0;
      }
      cachedFingerprint = Math.abs(hash).toString(16);
    }
  } catch (err) {
    cachedFingerprint = 'device_default';
  }

  return cachedFingerprint;
}
