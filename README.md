# Searching On Road - Implementasi Algoritma A*



## 1. Tentang Aplikasi

Aplikasi **Searching On Road** adalah aplikasi web untuk mencari rute terpendek antara dua kota menggunakan algoritma A*.

## 2. Algoritma yang Digunakan

### Deskripsi Algoritma A*

Algoritma A* adalah algoritma pencarian jalur optimal yang menggunakan kombinasi biaya aktual dan heuristik untuk menemukan rute terpendek.

### Cara Kerja

- Mulai dari titik awal, evaluasi node tetangga.
- Hitung fungsi `f = g + h`, di mana:
  - `g` adalah biaya jalur dari awal ke node saat ini.
  - `h` adalah perkiraan jarak dari node saat ini ke tujuan.
- Pilih node dengan nilai `f` terkecil untuk diperiksa selanjutnya.
- Ulangi hingga tujuan tercapai.
- Rekonstruksi jalur optimal.

## 3. Fitur

- Pilihan kota asal dan tujuan.
- Menampilkan rute terpendek dan jaraknya.
- Tampilan user-friendly dan responsif.
- Pengaturan tingkat kesulitan dan tema (demo).

## 4. Komponen Agen Cerdas

| Komponen  | Penjelasan                                               |
|-----------|---------------------------------------------------------|
| Agen      | Robot pengantar paket yang bergerak otomatis di dalam labirin |
| Sensor    | Kemampuan mendeteksi tembok, jalan, dan tujuan          |
| Aktuator  | Mekanisme pergerakan robot (maju, belok, berhenti)      |
| Lingkungan| Labirin (maze) sebagai tempat interaksi agen            |

---


