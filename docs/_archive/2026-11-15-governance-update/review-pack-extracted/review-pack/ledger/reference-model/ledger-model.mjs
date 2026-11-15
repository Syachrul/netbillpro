// Model referensi (oracle) ledger sesuai SPEC-LEDGER-001. Dalam memori, tanpa DB.
// Fungsi: (1) memverifikasi vektor uji; (2) pembanding pada uji properti implementasi nyata.
// BUKAN kode produksi. Jangan diimpor oleh aplikasi.

export class DomainError extends Error {
  constructor(code) { super(code); this.code = code; }
}

const SOURCE_TYPES = new Set(['PEMBAYARAN', 'PENYESUAIAN_KREDIT', 'SALDO_AWAL']);

export class CustomerModel {
  constructor() {
    this.ledger = [];            // {seq,id,type,debit,kredit,balanceAfter,refType,refId}
    this.invoices = new Map();   // id -> {id,total,dueDate,issuedSeq,allocated,status,voided}
    this.allocations = [];       // {sourceId,invoiceId|null,refundId|null,amount}
    this.payments = new Map();   // id -> {id,ledgerId,amount,voided,key,payload}
    this.reversals = new Set();  // ledger id asli yang sudah dibalik
    this.idem = new Map();       // key -> {payload,result}
    this._seq = 0; this._issued = 0; this._id = 0;
  }
  nid(p) { return `${p}${++this._id}`; }

  // ---------- util ----------
  get balance() { return this.ledger.length ? this.ledger.at(-1).balanceAfter : 0; }
  append({ type, debit = 0, kredit = 0, refType = null, refId = null }) {
    if (!Number.isInteger(debit) || !Number.isInteger(kredit)) throw new Error('uang harus integer');
    if (debit < 0 || kredit < 0 || (debit === 0) === (kredit === 0)) throw new Error('tepat satu sisi > 0');
    const e = { seq: ++this._seq, id: this.nid('L'), type, debit, kredit,
                balanceAfter: this.balance + kredit - debit, refType, refId };
    this.ledger.push(e); return e;
  }
  allocatedTo(invoiceId) {
    return this.allocations.filter(a => a.invoiceId === invoiceId).reduce((s, a) => s + a.amount, 0);
  }
  allocatedFrom(sourceId) {
    return this.allocations.filter(a => a.sourceId === sourceId).reduce((s, a) => s + a.amount, 0);
  }
  statusOf(inv) {
    if (inv.voided) return 'BATAL';
    if (inv.allocated === 0) return 'BELUM_LUNAS';
    if (inv.allocated < inv.total) return 'DIBAYAR_SEBAGIAN';
    return 'LUNAS';
  }
  refresh(inv) { inv.allocated = this.allocatedTo(inv.id); inv.status = this.statusOf(inv); }
  addAlloc({ sourceId, invoiceId = null, refundId = null, amount }) {
    this.allocations.push({ sourceId, invoiceId, refundId, amount });
    if (invoiceId) this.refresh(this.invoices.get(invoiceId));
  }
  freeSources() {   // BR-A1, urut seq
    return this.ledger
      .filter(l => l.kredit > 0 && SOURCE_TYPES.has(l.type) && !this.reversals.has(l.id))
      .map(l => ({ id: l.id, free: l.kredit - this.allocatedFrom(l.id) }))
      .filter(s => s.free > 0);
  }
  openInvoices() {  // BR-A2/A3
    return [...this.invoices.values()]
      .filter(i => !i.voided && i.allocated < i.total)
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate) || a.issuedSeq - b.issuedSeq);
  }
  get freeCredit() { return this.freeSources().reduce((s, x) => s + x.free, 0); }
  get totalDue() { return Math.max(0, -this.balance); }

  // ---------- inti tunggal ----------
  reallocate() {
    const sources = this.freeSources(); const targets = this.openInvoices();
    let i = 0, j = 0;
    while (i < sources.length && j < targets.length) {
      const remaining = targets[j].total - targets[j].allocated;
      const use = Math.min(sources[i].free, remaining);
      this.addAlloc({ sourceId: sources[i].id, invoiceId: targets[j].id, amount: use });
      sources[i].free -= use;                               // addAlloc sudah me-refresh invoice target
      if (sources[i].free === 0) i++;
      if (targets[j].allocated >= targets[j].total) j++;
    }
  }

  // ---------- operasi ----------
  issueInvoice({ total, dueDate, type = 'BULANAN' }) {
    if (!Number.isInteger(total) || total <= 0) throw new DomainError('VALIDATION_FAILED');
    const id = this.nid('I');
    const inv = { id, total, dueDate, issuedSeq: ++this._issued, allocated: 0, status: 'BELUM_LUNAS', voided: false, type };
    this.invoices.set(id, inv);
    const e = this.append({ type: type === 'SALDO_AWAL' ? 'SALDO_AWAL' : 'TAGIHAN', debit: total, refType: 'INVOICE', refId: id });
    inv.ledgerId = e.id;
    this.reallocate();
    return inv;
  }
  openingBalance({ amount, dueDate }) {
    if (amount < 0) return this.issueInvoice({ total: -amount, dueDate, type: 'SALDO_AWAL' });
    if (amount > 0) { this.append({ type: 'SALDO_AWAL', kredit: amount }); this.reallocate(); }
  }
  postPayment({ amount, target = null, key = null, payloadForHash = null }) {
    if (key) {
      const prior = this.idem.get(key);
      const hash = JSON.stringify(payloadForHash ?? { amount, target });
      if (prior) { if (prior.hash !== hash) throw new DomainError('IDEMPOTENCY_CONFLICT'); return prior.result; }
    }
    if (!Number.isInteger(amount) || amount <= 0) throw new DomainError('PAYMENT_AMOUNT_INVALID');
    if (target) {
      const t = this.invoices.get(target);
      if (!t) throw new DomainError('NOT_FOUND');
      if (t.voided) throw new DomainError('INVOICE_VOIDED');
    }
    const pid = this.nid('P');
    const e = this.append({ type: 'PEMBAYARAN', kredit: amount, refType: 'PAYMENT', refId: pid });
    const pay = { id: pid, ledgerId: e.id, amount, voided: false };
    this.payments.set(pid, pay);
    if (target) {                                         // BR-A5
      const t = this.invoices.get(target); const room = t.total - t.allocated;
      const use = Math.min(amount, room);
      if (use > 0) this.addAlloc({ sourceId: e.id, invoiceId: target, amount: use });
    }
    this.reallocate();
    if (key) this.idem.set(key, { hash: JSON.stringify(payloadForHash ?? { amount, target }), result: pay });
    return pay;
  }
  netAllocBy(sourceId, field) {
    const m = new Map();
    for (const a of this.allocations.filter(x => x.sourceId === sourceId)) {
      const k = a[field]; if (!k) continue; m.set(k, (m.get(k) ?? 0) + a.amount);
    }
    return m;
  }
  voidPayment(paymentId) {
    const pay = this.payments.get(paymentId);
    if (!pay) throw new DomainError('NOT_FOUND');
    if (pay.voided) throw new DomainError('ALREADY_VOIDED');
    // BR-V6: dana yang sudah dikembalikan lewat refund tidak dapat dibatalkan
    if ([...this.netAllocBy(pay.ledgerId, 'refundId').values()].some(v => v > 0)) throw new DomainError('PAYMENT_PARTIALLY_REFUNDED');
    const rev = this.append({ type: 'REVERSAL', debit: pay.amount, refType: 'PAYMENT', refId: pay.id });
    this.reversals.add(pay.ledgerId);
    for (const [invId, net] of this.netAllocBy(pay.ledgerId, 'invoiceId'))
      if (net !== 0) this.addAlloc({ sourceId: pay.ledgerId, invoiceId: invId, amount: -net });
    pay.voided = true; this.reallocate(); return rev;
  }
  voidInvoice(invoiceId) {
    const inv = this.invoices.get(invoiceId);
    if (!inv) throw new DomainError('NOT_FOUND');
    if (inv.voided) throw new DomainError('ALREADY_VOIDED');
    this.append({ type: 'REVERSAL', kredit: inv.total, refType: 'INVOICE', refId: inv.id });
    this.reversals.add(inv.ledgerId);
    const bySource = new Map();
    for (const a of this.allocations.filter(x => x.invoiceId === inv.id)) bySource.set(a.sourceId, (bySource.get(a.sourceId) ?? 0) + a.amount);
    for (const [src, net] of bySource) if (net !== 0) this.addAlloc({ sourceId: src, invoiceId: inv.id, amount: -net });
    inv.voided = true; this.refresh(inv); this.reallocate();
  }
  refund({ amount }) {
    if (!Number.isInteger(amount) || amount <= 0) throw new DomainError('VALIDATION_FAILED');
    if (this.freeCredit < amount) throw new DomainError('INSUFFICIENT_DEPOSIT');
    const e = this.append({ type: 'REFUND_DEPOSIT', debit: amount, refType: 'REFUND' });
    let need = amount;
    for (const s of this.freeSources()) {
      if (need === 0) break; const use = Math.min(s.free, need);
      this.addAlloc({ sourceId: s.id, refundId: e.id, amount: use }); need -= use;
    }
  }

  // ---------- invarian I-1..I-8 ----------
  checkInvariants() {
    const errs = [];
    const sumK = this.ledger.reduce((s, l) => s + l.kredit, 0), sumD = this.ledger.reduce((s, l) => s + l.debit, 0);
    if (this.ledger.length && this.balance !== sumK - sumD) errs.push('I-1');
    for (let k = 1; k < this.ledger.length; k++)
      if (this.ledger[k].balanceAfter !== this.ledger[k - 1].balanceAfter + this.ledger[k].kredit - this.ledger[k].debit) errs.push('I-1seq');
    for (const inv of this.invoices.values()) {
      const a = this.allocatedTo(inv.id);
      if (inv.allocated !== a || a < 0 || a > inv.total) errs.push(`I-2/I-5:${inv.id}`);
      if (inv.voided && a !== 0) errs.push(`I-5 batal:${inv.id}`);
      if (inv.status !== this.statusOf(inv)) errs.push(`I-8:${inv.id}`);
    }
    for (const l of this.ledger.filter(x => x.kredit > 0)) {
      const a = this.allocatedFrom(l.id); if (a < 0 || a > l.kredit) errs.push(`I-4:${l.id}`);
    }
    const remaining = this.openInvoices().reduce((s, i) => s + (i.total - i.allocated), 0);
    if (this.balance !== this.freeCredit - remaining) errs.push(`I-3 (saldo ${this.balance} != free ${this.freeCredit} - remaining ${remaining})`);
    if (this.freeCredit > 0 && this.openInvoices().length > 0) errs.push('I-7');
    return errs;
  }
  netAllocations() {
    const m = new Map();
    for (const a of this.allocations) if (a.invoiceId) {
      const k = `${a.sourceId}>${a.invoiceId}`; m.set(k, (m.get(k) ?? 0) + a.amount);
    }
    return [...m].filter(([, v]) => v !== 0).map(([k, amount]) => { const [s, i] = k.split('>'); return { s, i, amount }; });
  }
}
