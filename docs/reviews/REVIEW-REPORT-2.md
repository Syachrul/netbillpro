# Laporan Review 2: Berkas `DEV-RTRW-2026-001_v1_0.md` ("AI Development Governance Artifact Baseline")

**Tanggal:** 15 November 2026    **Dokumen ditinjau:** berkas unggahan terakhir (658 baris, CRLF)

## 1. Apa berkas ini sebenarnya
Berkas ini **bukan Playbook**. Isinya teks usulan orang pertama ("Saya menetapkan lima prinsip...") yang tampaknya keluaran sesi AI lain, lengkap dengan sisa antarmuka ("Review artefak setiap checkpoint, Tap to set up") dan entitas HTML (`&#x20;`). Berkas ini memakai nama dan ID **DEV-RTRW-2026-001 v1.0**, sama dengan Playbook yang sudah ada.

**Penilaian umum:** gagasannya bernilai dan sebagian besar saya adopsi. Namun sebagai dokumen, ia belum layak disimpan sebagai artefak resmi. Ia bertabrakan ID dengan Playbook, bertentangan dengan `STATE.md` Anda, dan sebagian isinya sudah usang terhadap hasil verifikasi terbaru.

## 2. Temuan
| ID | Tingkat | Temuan | Bukti | Tindak lanjut |
| :--- | :---: | :--- | :--- | :--- |
| G-1 | 🔴 | **Tabrakan ID dokumen:** berkas ini dan Playbook sama-sama DEV-RTRW-2026-001 v1.0, dan tidak ada tanda pembeda. Salah satunya bisa menimpa yang lain | Nama berkas dan isi | Jangan simpan sebagai DEV-RTRW-2026-001. Isi yang layak dipertahankan ada di `governance-alignment.md` (GOV-NETBILL-001) dan `artifact-register.md` |
| G-2 | 🔴 | **Status proyek bertentangan dengan `STATE.md`:** di sini C2-2-1 menunggu review dan C2-3 "tidak diotorisasi"; di STATE C2-2 selesai (4/4 tes) dan 16 file tes C2-3 sudah dibuat | Bagian 4.2 vs STATE | Jangan memilih dari dokumen. Buktikan dengan `git log`, `git status`, dan hasil tes (`governance-alignment.md` §4). STATE kini diberi status BLOCKED |
| G-3 | 🟠 | **Usang terhadap hasil verifikasi:** menyebut invarian I-1..I-6 (kini I-1..I-8), skenario "T9-T20" (T-14 dan T-16..T-20 bukan vektor ledger), dan 16 tes (kini 18 vektor + N-13); tidak mengenal E-1..E-7 dan BR-V6 | CI-05, CI-06, bagian 5 | Dikoreksi pada register CI (`governance-alignment.md` §2) |
| G-4 | 🟠 | **Tiga skema ID keputusan** kini bersaing: `D-2026-11-13-OQ-n`, `D-NB-nnn` (usulan di sini), dan `D-001/D-101` (draf awal) | Addendum PRD, bagian 4.3 | Usulan satu ID kanonik + kolom Alias (`governance-alignment.md` §3). Owner memutuskan |
| G-5 | 🟠 | **Tabrakan huruf:** "Tahap A-F" tata kelola vs "Tahap A-C" pekerjaan repo | Bagian 8 vs STATE | Tata kelola dinamai GS-1..GS-6 |
| G-6 | 🟠 | **AG-00 menjadi daftar kesiapan ketiga** (selain Playbook §13 dan Checklist Pembukaan C3) | Bagian 9 | Disatukan: AG-00 = satu daftar |
| G-7 | 🟠 | Register artefak berstatus seragam "Perlu dilengkapi" tanpa bukti, padahal sebagian sudah ada | Bagian 2 | `artifact-register.md` dengan status berbasis bukti (37 artefak) |
| G-8 | 🟠 | Aturan "mengubah PRD/TDD/keputusan bisnis tidak diotorisasi" tidak menyediakan jalur bila **verifikasi menemukan kesalahan** (seperti S4 dan BR-V6) | Bagian 10 | Jalur: usulan `PROPOSED` → keputusan Owner → `decisions.log` → baru PRD/TDD (`governance-alignment.md` §6) |
| G-9 | 🟠 | **D-NB-008 (`TRUNCATE ... CASCADE`) vs trigger append-only:** trigger baris tidak menghalangi `TRUNCATE`. Tertulis "approved with qualification" tanpa menyebut kualifikasinya | Bagian 4.3 | Kualifikasi dirumuskan: peran produksi tanpa hak TRUNCATE, trigger `BEFORE TRUNCATE` (usulan), CASCADE hanya di DB tes |
| G-10 | 🟡 | Koreksi rujukan Playbook: **3 benar tetapi lokasinya keliru** (di §3/§5.1/§11, bukan §8), dan **2 terlewat** (template PR 14.5→14.4, CODEOWNERS 14.6→14.5) | Diperiksa pada berkas | `governance-alignment.md` §7 (9 koreksi) |
| G-11 | 🟡 | Empat dokumen uji terpisah (`ledger-scenarios.md`, `ledger-properties.md`, `concurrency.md`, `negative-cases.md`) menciptakan **empat tempat** yang bisa melenceng dari spec | Bagian 5 | Satu sumber (`ledger-vectors.json` + SPEC-LEDGER), tampilan markdown dihasilkan dari JSON |
| G-12 | 🟡 | Tidak menyebut model referensi/oracle, uji mutasi, atau pemeriksa cakupan vektor, padahal prinsipnya ("expected tidak boleh dari kode") butuh mekanisme | Bagian 5 | Sudah tersedia di paket (CI-16, CI-20) |
| G-13 | 🟡 | Lokasi README modul `docs/modules/<x>/` berbeda dari rancangan lain (`modules/<x>/`) | Bagian 3 | Pilih satu lokasi (dicatat di register) |
| G-14 | 🟡 | Contoh STATE memuat hash commit dan tanggal tanpa bukti; draf keputusan D-NB-001..009 belum dicek terhadap log asli | Bagian 4.2-4.3 | Ditandai UNVERIFIED |

## 3. Yang Diadopsi, Diubah, dan Tidak Diadopsi
| Gagasan | Keputusan | Wujud |
| :--- | :--- | :--- |
| Otorisasi DESIGN / IMPLEMENTATION / RELEASE | **Diadopsi** | `CLAUDE.md` v2, `governance-alignment.md` §1 |
| Tiga bukti terpisah (CI PASS, Review ACCEPTED, Release GRANTED) | **Diadopsi** | idem |
| ID gerbang CI-01..CI-15 | **Diadopsi + diperluas** CI-16..21 | `governance-alignment.md` §2 |
| Status keterlacakan (NOT STARTED...ACCEPTED) + matriks induk | **Diadopsi** | `traceability-matrix.md` (67 FR/MOB dihasilkan dari PRD) |
| Master Artifact Register | **Diadopsi, diisi berbasis bukti** | `artifact-register.md` |
| Protected constraints, aturan Evidence | **Diadopsi** | `CLAUDE.md` v2, `do-not-do.md` |
| Template README 12 bagian | **Opsional** (lebih kaya dari README modul saat ini) | Boleh dipakai bila modul sudah ada |
| Prinsip "expected tidak boleh diisi dari hasil kode" | **Diadopsi** | CI-16 (model independen) |
| Bedakan tes fixture (infrastruktur) dari tes perilaku | **Diadopsi** (pernyataan tepat) | Catatan di `governance-alignment.md` §5 |
| AG-00 sebagai gerbang tambahan | **Diubah:** disatukan dengan daftar yang ada | §5 |
| Tahap A-F tata kelola | **Diubah:** GS-1..GS-6 | §5 |
| ID keputusan `D-NB-nnn` | **Diubah:** kanonik + Alias | §3 |
| Empat dokumen uji terpisah | **Tidak diadopsi:** risiko drift | G-11 |
| "Mengubah PRD/TDD tidak diotorisasi" | **Diubah:** ditambah jalur usulan | G-8 |

## 4. Catatan Kejujuran atas Pekerjaan Saya Sebelumnya
Review sebelumnya memuat koreksi aturan bisnis (S4, BR-V6, `total > 0`) dan dua draf catatan keputusan yang saya beri status "FINAL" di folder parsial `netbill-pro/`. **Itu melampaui kewenangan:** persetujuan adalah milik Owner. Perbaikannya: koreksi tersebut kini berstatus **PROPOSED/USULAN** di PRD v1.2, STATE, dan `governance-alignment.md` §6, dan folder parsial tidak boleh dipakai sebagai sumber kebenaran. Bila Anda sudah menerapkan sesuatu dari paket sebelumnya sebagai keputusan, mohon tandai ulang sebagai `PROPOSED` sampai Anda menyetujuinya.

## 5. Yang Masih Dibutuhkan untuk Finalisasi
Berkas ini meminta lima bukti. Status per saat ini:
| Bukti | Status |
| :--- | :--- |
| PRD | Tersedia (v1.1; saya terbitkan v1.2 usulan) |
| OQ-1..11 dan statusnya | Ada di PRD v1.2 §15 (FINAL: 1, 3, 5, 6; lainnya DEFAULT) |
| ADR dan keputusan | Ada di `ADR-Register.md` (22 ADR). `decisions.log` asli **belum** diunggah |
| **TDD** | **Belum diunggah.** Amandemen diberikan sebagai catatan |
| **Struktur repositori + `git log` terkini** | **Belum ada.** Dibutuhkan untuk menyelesaikan G-2 |
