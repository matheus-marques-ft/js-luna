import * as CryptoJS from 'crypto-js';
import { getCookie } from '@app/utils/common';
import { Buffer } from 'buffer';
import { JSEncrypt } from 'jsencrypt';
import { sm2, sm4 } from 'sm-crypto';

export function fillKey(key: string): Buffer | string {
  const KeyLength = 16;
  if (key.length > KeyLength) {
    key = key.slice(0, KeyLength);
  }
  const filledKey = Buffer.alloc(KeyLength);
  const keys = Buffer.from(key);
  for (let i = 0; i < keys.length; i++) {
    filledKey[i] = keys[i];
  }
  return filledKey;
}

function aesEncrypt(text: string, originKey: string) {
  const key = CryptoJS.enc.Utf8.parse(fillKey(originKey));
  return CryptoJS.AES.encrypt(text, key, {
    mode: CryptoJS.mode.ECB,
    padding: CryptoJS.pad.ZeroPadding
  }).toString();
}

function rsaEncrypt(text: string, pubKey: string) {
  if (!text) {
    return text;
  }
  const jsEncrypt = new JSEncrypt();
  jsEncrypt.setPublicKey(pubKey);
  return jsEncrypt.encrypt(text);
}

function rsaDecrypt(cipher: string, pkey: string) {
  const jsEncrypt = new JSEncrypt();
  jsEncrypt.setPrivateKey(pkey);
  return jsEncrypt.decrypt(cipher);
}

function hexToBytes(hex: string) {
  if (!hex) return new Uint8Array([]);
  hex = hex.toString().trim().toLowerCase();
  if (hex.startsWith('0x')) {
    hex = hex.slice(2);
  }
  // Ensure the length is even
  const len = Math.floor(hex.length / 2);
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return bytes;
}

function bytesToBase64(bytes: Uint8Array) {
  // Uint8Array -> base64 (standard base64)
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function rsaEncryptPassword(password: string, rsaPublicKey: string) {
  const aesKey = (Math.random() + 1).toString(36).substring(2);
  // public key is stored as base64
  const keyCipher = rsaEncrypt(aesKey, rsaPublicKey);
  const passwordCipher = aesEncrypt(password, aesKey);
  return `${keyCipher}:${passwordCipher}`;
}

function ensureSm2PublicKey(sm2PublicKey: string) {
  // sm2.min.js's doEncrypt needs a public key that can be parsed by decodePointHex:
  // usually an uncompressed point hex, in the format `04||x||y` (total length 130).
  // But the public key generated/issued by the backend is sometimes `x||y` (length 128); this normalizes it by prepending the `04` prefix.
  if (typeof sm2PublicKey === 'string') {
    sm2PublicKey = sm2PublicKey.replace(/"/g, '').trim();
    if (sm2PublicKey.startsWith('0x')) {
      sm2PublicKey = sm2PublicKey.slice(2);
    }
    // The SM2 public key issued by the backend is commonly x||y (128 hex); sm-crypto needs 04||x||y (130 hex)
    if (sm2PublicKey.length === 128 && !sm2PublicKey.startsWith('04')) {
      sm2PublicKey = '04' + sm2PublicKey;
    }
  }
  return sm2PublicKey;
}

function gmEncryptPassword(password: string, sm2PublicKey: string) {
  sm2PublicKey = ensureSm2PublicKey(sm2PublicKey);
  // Adapt only the frontend, without changing the backend:
  // directly generate a 16-character key (the backend padding_key stays as-is, no longer padded)
  const sm4KeyRaw = randomString(16);
  const sm4KeyHex = Buffer.from(sm4KeyRaw).toString('hex');

  let keyCipher = '';
  try {
    // Aligned with the mode used by the backend's default gmssl.sm2.CryptSM2 decrypt:
    // gmssl parses the format C1C2C3 (mode=0), so the frontend output here also uses mode=0.
    keyCipher = sm2.doEncrypt(sm4KeyRaw, sm2PublicKey, 0);
  } catch (e) {
    console.error('gmEncryptPassword sm2.doEncrypt failed:', e);
    // Avoid crashing the frontend: on failure, return the plaintext, and let the backend handle it via the original value flow (at least allows continuing to log in / see the error)
    return password;
  }

  const passwordCipher = sm4.encrypt(password, sm4KeyHex);
  // sm2/sm4 default output is hex, but the backend gm.py/session.py needs base64:
  // - sm2_decrypt: base64.b64decode
  // - sm4 decrypt: base64.urlsafe_b64decode
  const keyCipherB64 = bytesToBase64(hexToBytes(keyCipher));
  const passwordCipherB64 = bytesToBase64(hexToBytes(passwordCipher));
  return `${keyCipherB64}:${passwordCipherB64}`;
}

export function encryptPassword(password: string) {
  if (!password) {
    console.log('password is empty');
    return '';
  }
  let publicKeyText = getCookie('jms_public_key');
  if (!publicKeyText) {
    console.log('publicKeyText is empty');
    return password;
  }
  publicKeyText = publicKeyText.replace(/"/g, '');
  publicKeyText = atob(publicKeyText);
  let cipher = '';
  let jmsGMSSL = getCookie('jms_gm_ssl');
  if (publicKeyText.includes('PUBLIC KEY')) {
    jmsGMSSL = '0';
  }
  if (jmsGMSSL === '1') {
    cipher = gmEncryptPassword(password, publicKeyText);
  } else {
    cipher = rsaEncryptPassword(password, publicKeyText);
  }

  return cipher;
}

export function randomString(length: number) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }

  return result;
}
