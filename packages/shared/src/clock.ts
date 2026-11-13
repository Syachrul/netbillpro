/**
 * Clock — abstraksi waktu. Domain tidak boleh memanggil `new Date()` langsung.
 * Simpan UTC, tampilkan WIB.
 */

export interface Clock {
  /** Waktu sekarang sebagai Date (UTC). */
  now(): Date;
  /** Tanggal hari ini dalam zona Asia/Jakarta (YYYY-MM-DD). */
  todayJakarta(): string;
  /** Periode YYYY-MM saat ini dalam zona Asia/Jakarta. */
  currentPeriodJakarta(): string;
}

/** Implementasi produksi: memakai Date sistem. */
export class SystemClock implements Clock {
  now(): Date {
    return new Date();
  }

  todayJakarta(): string {
    return toJakartaDateStr(this.now());
  }

  currentPeriodJakarta(): string {
    return toJakartaPeriod(this.now());
  }
}

/** Implementasi uji: waktu tetap, bisa dimajukan. */
export class FakeClock implements Clock {
  private current: Date;

  constructor(initial: Date | string = '2026-11-13T00:00:00Z') {
    this.current = typeof initial === 'string' ? new Date(initial) : initial;
  }

  now(): Date {
    return new Date(this.current);
  }

  todayJakarta(): string {
    return toJakartaDateStr(this.current);
  }

  currentPeriodJakarta(): string {
    return toJakartaPeriod(this.current);
  }

  advance(ms: number): void {
    this.current = new Date(this.current.getTime() + ms);
  }

  set(date: Date | string): void {
    this.current = typeof date === 'string' ? new Date(date) : date;
  }
}

function toJakartaDateStr(d: Date): string {
  // Gunakan Intl agar tidak bergantung pada timezone sistem.
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return fmt.format(d); // en-CA menghasilkan YYYY-MM-DD
}

function toJakartaPeriod(d: Date): string {
  return toJakartaDateStr(d).slice(0, 7);
}
