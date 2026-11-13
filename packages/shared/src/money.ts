/**
 * Money utilities — integer rupiah (bigint).
 *
 * ATURAN KERAS: dilarang memakai number (pecahan) untuk uang.
 * Semua nominal disimpan sebagai bigint.
 */

export type Rupiah = bigint;

export class MoneyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MoneyError';
  }
}

/** Bangun Rupiah dari string digit bulat (mis. "150000"). */
export function rupiah(value: string | number | bigint): Rupiah {
  if (typeof value === 'bigint') return value;
  if (typeof value === 'number') {
    if (!Number.isInteger(value)) {
      throw new MoneyError(`Bukan integer: ${value}. Uang harus integer rupiah.`);
    }
    return BigInt(value);
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!/^-?\d+$/.test(trimmed)) {
      throw new MoneyError(`Bukan string integer: "${value}"`);
    }
    return BigInt(trimmed);
  }
  throw new MoneyError(`Tipe tidak didukung untuk Rupiah: ${typeof value}`);
}

export const ZERO: Rupiah = 0n;

export function add(a: Rupiah, b: Rupiah): Rupiah {
  return a + b;
}

export function sub(a: Rupiah, b: Rupiah): Rupiah {
  return a - b;
}

export function max(a: Rupiah, b: Rupiah): Rupiah {
  return a > b ? a : b;
}

export function min(a: Rupiah, b: Rupiah): Rupiah {
  return a < b ? a : b;
}

export function isPositive(a: Rupiah): boolean {
  return a > 0n;
}

export function isNegative(a: Rupiah): boolean {
  return a < 0n;
}

export function isZero(a: Rupiah): boolean {
  return a === 0n;
}

/** Total yang harus dibayar = max(0, -saldo). SPEC-LEDGER BR-L3. */
export function totalDue(balance: Rupiah): Rupiah {
  return balance < 0n ? -balance : 0n;
}

/** Format tampilan: Rp 150.000. Dipakai di UI, log, dan PDF. */
export function formatRupiah(a: Rupiah): string {
  const negative = a < 0n;
  const abs = negative ? -a : a;
  const str = abs.toString();
  const withDot = str.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${negative ? '-' : ''}Rp ${withDot}`;
}

/** Parse dari input pengguna (mis. "150.000" atau "150000") ke Rupiah. */
export function parseRupiah(input: string): Rupiah {
  const cleaned = input.replace(/[^\d-]/g, '');
  if (cleaned === '' || cleaned === '-') {
    throw new MoneyError(`Input tidak valid: "${input}"`);
  }
  return rupiah(cleaned);
}

/** Cek kesetaraan untuk uji. */
export function eq(a: Rupiah, b: Rupiah): boolean {
  return a === b;
}
