// Uji properti pada model referensi: urutan operasi acak, invarian I-1..I-8 diperiksa setelah SETIAP operasi.
// Pemakaian: node property-test.mjs [jumlahUrutan=3000] [panjang=40] [seed=1]
import { CustomerModel, DomainError } from './ledger-model.mjs';

const N = +process.argv[2] || 3000, LEN = +process.argv[3] || 40; let seed = +process.argv[4] || 1;
const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 2 ** 32; };
const pick = (a) => a[Math.floor(rnd() * a.length)];
const int = (lo, hi) => lo + Math.floor(rnd() * (hi - lo + 1));
const stats = {}; const bump = (k) => (stats[k] = (stats[k] ?? 0) + 1);
let bad = 0;

for (let n = 0; n < N && bad < 5; n++) {
  const m = new CustomerModel(); const trace = [];
  if (rnd() < 0.3) { const amt = pick([-300000, -50000, 80000, 120000]); m.openingBalance({ amount: amt, dueDate: '2026-11-30' }); trace.push(`opening ${amt}`); }
  for (let k = 0; k < LEN; k++) {
    const r = rnd(); let desc = '';
    try {
      if (r < 0.28) { const t = int(1, 6) * 50000; const d = `2027-${String(int(1, 12)).padStart(2, '0')}-10`; m.issueInvoice({ total: t, dueDate: d }); desc = `issue ${t} ${d}`; }
      else if (r < 0.62) { const a = int(1, 40) * 10000; const open = m.openInvoices(); const tg = open.length && rnd() < 0.3 ? pick(open).id : null; m.postPayment({ amount: a, target: tg }); desc = `pay ${a} target=${tg}`; }
      else if (r < 0.74) { const ps = [...m.payments.values()].filter(p => !p.voided); if (ps.length) { const p = pick(ps); m.voidPayment(p.id); desc = `voidPay ${p.id}`; } }
      else if (r < 0.86) { const is = [...m.invoices.values()].filter(i => !i.voided); if (is.length) { const i = pick(is); m.voidInvoice(i.id); desc = `voidInv ${i.id}`; } }
      else { if (m.freeCredit > 0) { const a = int(1, Math.max(1, Math.floor(m.freeCredit / 10000))) * 10000; if (a <= m.freeCredit) { m.refund({ amount: a }); desc = `refund ${a}`; } } }
      if (desc) bump(desc.split(' ')[0]);
    } catch (e) { if (e instanceof DomainError) { bump('ditolak:' + e.code); desc = `ditolak ${e.code}`; } else throw e; }
    trace.push(desc);
    const errs = m.checkInvariants();
    if (errs.length) { bad++; console.log(`PELANGGARAN urutan #${n} langkah ${k}: ${errs.join(' | ')}`); console.log(trace.slice(-8).join('\n')); break; }
  }
}
console.log(JSON.stringify(stats));
console.log(bad ? `GAGAL: ${bad} pelanggaran` : `LULUS: ${N} urutan x ${LEN} langkah, invarian terjaga`);
process.exit(bad ? 1 : 0);
