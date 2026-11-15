// Menjalankan docs/test-pl../ledger-vectors.json terhadap model referensi.
// Pemakaian: node run-vectors.mjs
import { readFileSync } from 'node:fs';
import { CustomerModel, DomainError } from './ledger-model.mjs';

const vectors = JSON.parse(readFileSync(new URL('../ledger-vectors.json', import.meta.url), 'utf8'));
let failed = 0;

function runVector(v) {
  const errors = [];
  const custs = {};  const labels = {};   // labels: label -> {cust, id}
  const get = (name = 'default') => (custs[name] ??= new CustomerModel());
  for (const [name, c] of Object.entries(v.customers ?? {})) get(name).openingBalance({ amount: c.openingBalance, dueDate: c.dueDate ?? '2026-11-30' });
  const ref = (label) => labels[label];

  const exec = (st) => {
    const m = get(st.customer);
    switch (st.op) {
      case 'issueInvoice': { const inv = m.issueInvoice({ total: st.total, dueDate: st.dueDate }); if (st.as) labels[st.as] = { m, id: inv.id }; break; }
      case 'postPayment': {
        const target = st.target ? ref(st.target).id : null;
        try {
          const pay = m.postPayment({ amount: st.amount, target, key: st.idempotencyKey ?? null });
          if (st.expectError) errors.push(`harus error ${st.expectError}`);
          if (st.as) labels[st.as] = { m, id: pay.id };
          if (st.expectSameResponseAs && ref(st.expectSameResponseAs).id !== pay.id) errors.push('respons idempoten berbeda');
        } catch (e) {
          if (!(e instanceof DomainError) || e.code !== st.expectError) errors.push(`error tak terduga: ${e.message}`);
        }
        break;
      }
      case 'voidPayment': case 'voidInvoice': {
        try {
          st.op === 'voidPayment' ? m.voidPayment(ref(st.target).id) : m.voidInvoice(ref(st.target).id);
          if (st.expectError) errors.push(`harus error ${st.expectError}`);
        } catch (e) { if (!(e instanceof DomainError) || e.code !== st.expectError) errors.push(`error tak terduga: ${e.message}`); }
        break;
      }
      case 'refund': m.refund({ amount: st.amount }); break;
      case 'parallel': for (let i = 0; i < st.repeat; i++) exec(st.step); break;   // model sekuensial; hasil akhir harus sama
      default: throw new Error('op tidak dikenal ' + st.op);
    }
    for (const [n, c] of Object.entries(custs)) { const inv = c.checkInvariants(); if (inv.length) errors.push(`invarian ${n}: ${inv.join(',')}`); }
  };
  v.steps.forEach(exec);

  const check = (m, exp, prefix = '') => {
    for (const k of ['balance', 'freeCredit', 'totalDue']) if (k in exp && m[k] !== exp[k]) errors.push(`${prefix}${k}: ${m[k]} != ${exp[k]}`);
    if ('ledgerEntryCount' in exp && m.ledger.length !== exp.ledgerEntryCount) errors.push(`${prefix}ledgerEntryCount: ${m.ledger.length} != ${exp.ledgerEntryCount}`);
    if ('paymentCount' in exp && m.payments.size !== exp.paymentCount) errors.push(`${prefix}paymentCount: ${m.payments.size} != ${exp.paymentCount}`);
    if (exp.balanceAfterStrictlySequential) m.ledger.forEach((l, i) => { if (i && l.seq !== m.ledger[i - 1].seq + 1) errors.push('seq tidak berurutan'); });
    for (const [lbl, e] of Object.entries(exp.invoices ?? {})) {
      const inv = m.invoices.get(ref(lbl).id);
      if (inv.allocated !== e.allocated) errors.push(`${prefix}${lbl}.allocated: ${inv.allocated} != ${e.allocated}`);
      if (inv.status !== e.status) errors.push(`${prefix}${lbl}.status: ${inv.status} != ${e.status}`);
    }
    for (const [lbl, e] of Object.entries(exp.payments ?? {})) if (e.voided !== undefined && m.payments.get(ref(lbl).id).voided !== e.voided) errors.push(`${lbl}.voided`);
    const net = m.netAllocations();
    for (const a of exp.allocations ?? []) {
      const s = m.payments.get(ref(a.source).id).ledgerId, i = ref(a.invoice).id;   // sumber = entri ledger milik pembayaran
      const hit = net.find(x => x.s === s && x.i === i);
      if (!hit || hit.amount !== a.amount) errors.push(`${prefix}alokasi ${a.source}>${a.invoice}: ${hit?.amount ?? 'tidak ada'} != ${a.amount}`);
    }
  };
  if (v.customers) for (const [n, exp] of Object.entries(v.expect)) check(get(n), exp, `${n}.`);
  else check(get(), v.expect);
  return errors;
}

for (const v of vectors) {
  const errs = runVector(v);
  console.log(`${errs.length ? 'GAGAL' : 'lulus'}  ${v.id}`);
  errs.forEach(e => console.log('        - ' + e));
  failed += errs.length ? 1 : 0;
}
console.log(`\n${vectors.length - failed}/${vectors.length} vektor lulus`);
process.exit(failed ? 1 : 0);
