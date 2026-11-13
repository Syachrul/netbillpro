## Ringkasan

<apa dan mengapa>

**ID:** FR-___ / ADR-___ / FIX-___ / MOB-___
**Zona risiko:** MERAH / KUNING / HIJAU

## Spec dan dokumen

- [ ] Spec FR diperbarui/ada: <tautan>
- [ ] decisions.log / STATE.md diperbarui bila perlu

## Tes

- [ ] Tes ditulis lebih dulu dan ditinjau
- [ ] Unit/integrasi/properti/otorisasi/kontrak sesuai spec
- [ ] Tidak ada tes diubah/dinonaktifkan (jika ada, alasan: ___)

## Keamanan dan integritas

- [ ] Nominal integer, tanpa float
- [ ] Otorisasi dan kepemilikan data diperiksa
- [ ] Transaksi/kunci/idempotensi benar (zona merah)
- [ ] Tidak ada data sensitif di log/komit

## Perubahan berisiko

- [ ] Tidak ada dependensi baru (jika ada: nama/versi/alasan/lisensi: ___)
- [ ] Tidak ada perubahan skema/migrasi (jika ada: kompatibel mundur, rollback: ___)
- [ ] Tidak ada perubahan kontrak API/event (jika ada: versi: ___)

## Yang TIDAK diverifikasi / asumsi

<jujur>

## Bukti

<hasil CI, tangkapan layar S1-S8 bila relevan>
