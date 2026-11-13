import { describe, expect, it } from 'vitest';
import {
  ZERO,
  add,
  formatRupiah,
  isNegative,
  isPositive,
  isZero,
  max,
  min,
  MoneyError,
  parseRupiah,
  rupiah,
  sub,
  totalDue,
} from './money';

describe('money — rupiah()', () => {
  it('menerima bigint apa adanya', () => {
    expect(rupiah(150000n)).toBe(150000n);
  });

  it('menerima integer number', () => {
    expect(rupiah(150000)).toBe(150000n);
  });

  it('menerima string digit bulat', () => {
    expect(rupiah('150000')).toBe(150000n);
    expect(rupiah('-50000')).toBe(-50000n);
  });

  it('menolak number pecahan', () => {
    expect(() => rupiah(150000.5)).toThrow(MoneyError);
  });

  it('menolak string bukan digit', () => {
    expect(() => rupiah('150.000')).toThrow(MoneyError);
    expect(() => rupiah('abc')).toThrow(MoneyError);
  });
});

describe('money — aritmetika', () => {
  it('add/sub', () => {
    expect(add(150000n, 50000n)).toBe(200000n);
    expect(sub(150000n, 100000n)).toBe(50000n);
  });

  it('max/min', () => {
    expect(max(150000n, 200000n)).toBe(200000n);
    expect(min(150000n, 200000n)).toBe(150000n);
  });

  it('isPositive/isNegative/isZero', () => {
    expect(isPositive(1n)).toBe(true);
    expect(isNegative(-1n)).toBe(true);
    expect(isZero(ZERO)).toBe(true);
  });
});

describe('money — totalDue (SPEC-LEDGER BR-L3)', () => {
  it('saldo positif => 0', () => {
    expect(totalDue(50000n)).toBe(0n);
  });

  it('saldo nol => 0', () => {
    expect(totalDue(0n)).toBe(0n);
  });

  it('saldo negatif => positif', () => {
    expect(totalDue(-200000n)).toBe(200000n);
  });
});

describe('money — formatRupiah', () => {
  it('format positif', () => {
    expect(formatRupiah(150000n)).toBe('Rp 150.000');
    expect(formatRupiah(1500000n)).toBe('Rp 1.500.000');
  });

  it('format nol', () => {
    expect(formatRupiah(0n)).toBe('Rp 0');
  });

  it('format negatif', () => {
    expect(formatRupiah(-50000n)).toBe('-Rp 50.000');
  });
});

describe('money — parseRupiah', () => {
  it('parse dengan titik', () => {
    expect(parseRupiah('150.000')).toBe(150000n);
  });

  it('parse tanpa titik', () => {
    expect(parseRupiah('150000')).toBe(150000n);
  });

  it('parse dengan Rp', () => {
    expect(parseRupiah('Rp 150.000')).toBe(150000n);
  });

  it('parse kosong ditolak', () => {
    expect(() => parseRupiah('')).toThrow(MoneyError);
    expect(() => parseRupiah('-')).toThrow(MoneyError);
  });
});
