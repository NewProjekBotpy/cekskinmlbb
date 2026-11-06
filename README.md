# MLBB Account Checker

Website sederhana untuk menampilkan nickname, jumlah hero unik, jumlah skin, dan daftar skin.

## Deploy ke Vercel

1. Ekstrak ZIP ini.
2. Upload folder project ke GitHub.
3. Di Vercel pilih **Add New → Project**, lalu import repository tersebut.
4. Framework preset: **Other**. Build command dan output directory dapat dikosongkan.
5. Deploy.

## Mode awal

Website dapat dibuka dan tombol **Lihat contoh hasil** menampilkan data dummy agar tampilan bisa diperiksa.

Pencarian akun sungguhan belum aktif secara default.

## Konfigurasi API

File `api/check.js` memiliki adapter untuk alur endpoint yang terlihat pada frontend CekSkin:

- `POST /api/encrypt`
- `POST /api/players/{gameId}/lookup`
- `GET /api/players/{gameId}/skins`

Aktifkan hanya jika Anda telah memperoleh izin untuk menggunakan API penyedia dan penyedia mengizinkan permintaan server-to-server dari deployment Anda.

Di Vercel → Project → Settings → Environment Variables, tambahkan:

- `ENABLE_CEKSKIN_API` = `true`
- `CEKSKIN_BASE_URL` = `https://cekskin.com` (opsional; ini nilai default)

Kemudian redeploy.

**Penting:** kode ini tidak melewati login, kredit, signature, rate limit, atau pembatasan akses provider. Jika provider menolak permintaan karena membutuhkan sesi/cookie atau akses khusus, integrasi tidak akan berjalan. Jangan menyalin cookie, token, atau signature pribadi ke frontend.

## Catatan teknis

- Frontend: HTML, CSS, JavaScript vanilla.
- Backend: Vercel Serverless Function di `api/check.js`.
- Tidak menyimpan Game ID atau hasil pencarian ke database.
- Jumlah hero dihitung dari hero unik yang muncul pada daftar skin; ini bukan jumlah hero yang dimiliki akun jika provider tidak mengirimkan data hero terpisah.
- Rank dan statistik lain belum ditampilkan karena struktur respons aslinya belum diverifikasi.
