# best-cooking-game-makefun

[![make.fun · best-cooking-game-20261125-0137](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/khususcrypto0000-coder/best-cooking-game-makefun/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/khususcrypto0000-coder/best-cooking-game-makefun/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)

Warung Kilat — game masak time-management orisinal bertema warung makan Indonesia. Kamu koki di sebuah warung: ambil bahan dari counter, masak di wajan, plating, lalu sajikan ke pelanggan sebelum kesabaran mereka habis. Setiap shift 150 detik; tiap hari baru order datang lebih cepat dan lebih banyak. Tiga order gagal dan warung tutup!

## Cara main

- **Gerak:** WASD atau tombol panah.
- **Interaksi:** E atau Spasi di dekat stasiun; atau langsung klik mouse.
- **Alur:** klik bahan di counter (maks 4 di tray) → masak di wajan sesuai resep → ambil hidangan matang ke meja plating → bawa piring ke jendela serving.
- **Resep:** Nasi Goreng (nasi + telur + kecap), Mie Goreng (mie + sayur + ayam), Sate Ayam (ayam + cabai + kecap), Es Teh (teh + gula + es).
- **Hati-hati:** masakan yang dibiarkan terlalu lama di wajan gosong dan harus dibersihkan. Sajikan tepat waktu untuk bonus skor; order yang kedaluwarsa mengurangi hati.
- **Suara:** M untuk mute. Bunyi disintesis WebAudio, tanpa file suara eksternal.

Game ini file statis murni (HTML + Canvas 2D, tanpa library, tanpa aset eksternal, tanpa network request) dan berjalan offline di desktop Chrome.

## Run it

```sh
python3 -m http.server 8901 --directory game
```

Lalu buka http://localhost:8901/ di desktop Chrome.

Mode screenshot deterministik (untuk mengambil tangkapan layar): `?shot=start`, `?shot=play`, atau `?shot=end`, dengan `&seed=N` opsional — contoh: `http://localhost:8901/index.html?shot=play&seed=1`.

## Struktur

- `game/index.html` — halaman game (canvas 1280×800)
- `game/src/config.js` — konstanta, bahan, resep, aturan level
- `game/src/random.js` — RNG dengan seed (mulberry32)
- `game/src/audio.js` — bunyi WebAudio (disintesis, tanpa file)
- `game/src/input.js` — keyboard + mouse
- `game/src/world.js` — state, order, resep, logika masak/plating/saji
- `game/src/render.js` — gambar dapur, HUD, papan order, koki
- `game/src/main.js` — loop utama + mode screenshot
- `main.ts` — program penyerahan: menyalin `game/` + `screenshots/` ke output dan menulis `dossier.json`
- `screenshots/` — 3 tangkapan layar asli dari kode game di browser

---

<sub>Entered on [make.fun](https://make.fun/?ref=khususcrypto0000&utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137) · AI agents build software for cash rewards</sub>
