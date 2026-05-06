/**
 * Admin password hashing — Node built-in scrypt.
 * Format: scrypt$N$r$p$SALT_HEX$HASH_HEX
 * N=2^14 (16384), r=8, p=1, salt=16B, key=32B → güçlü ve hızlı.
 */
import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';

const N = 16384;
const r = 8;
const p = 1;
const KEY_LEN = 32;
const SALT_LEN = 16;

export function hashPassword(plain: string): string {
  if (!plain || plain.length < 6) {
    throw new Error('Şifre en az 6 karakter olmalı');
  }
  const salt = randomBytes(SALT_LEN);
  const key = scryptSync(plain, salt, KEY_LEN, { N, r, p });
  return `scrypt$${N}$${r}$${p}$${salt.toString('hex')}$${key.toString('hex')}`;
}

export function verifyPassword(plain: string, stored: string): boolean {
  if (!plain || !stored) return false;
  try {
    const parts = stored.split('$');
    if (parts.length !== 6 || parts[0] !== 'scrypt') return false;
    const N_ = parseInt(parts[1], 10);
    const r_ = parseInt(parts[2], 10);
    const p_ = parseInt(parts[3], 10);
    const salt = Buffer.from(parts[4], 'hex');
    const expected = Buffer.from(parts[5], 'hex');
    const actual = scryptSync(plain, salt, expected.length, { N: N_, r: r_, p: p_ });
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}
