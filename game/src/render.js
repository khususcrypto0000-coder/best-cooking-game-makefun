// render.js — menggambar Warung Kilat di canvas 2D: dapur, HUD, papan order,
// counter bahan, wajan, meja plating, jendela serving, koki, dan layar title/over.
// Semua gambar digambar dari bentuk canvas dan emoji — tanpa aset eksternal.
(function (global) {
  'use strict';

  var W = 1280;
  var H = 800;

  // Gambar latar dapur: dinding, lantai ubin, dan meja kayu.
  function drawWarungKitchen(ctx) {
    // Dinding krem dengan garis bata halus.
    ctx.fillStyle = '#f7e8c8';
    ctx.fillRect(0, 0, W, 190);
    ctx.strokeStyle = 'rgba(180,140,90,0.25)';
    ctx.lineWidth = 2;
    for (var y = 30; y < 190; y += 40) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }
    // Lantai ubin cokelat muda.
    ctx.fillStyle = '#e8cfa0';
    ctx.fillRect(0, 190, W, H - 190);
    ctx.strokeStyle = 'rgba(120,80,40,0.18)';
    for (var x = 0; x < W; x += 80) {
      ctx.beginPath(); ctx.moveTo(x, 190); ctx.lineTo(x, H); ctx.stroke();
    }
    for (var yy = 190; yy < H; yy += 80) {
      ctx.beginPath(); ctx.moveTo(0, yy); ctx.lineTo(W, yy); ctx.stroke();
    }
    // Jendela dapur di dinding kiri.
    ctx.fillStyle = '#bfe3f0';
    ctx.fillRect(24, 64, 150, 100);
    ctx.fillStyle = '#fff8d6';
    ctx.beginPath(); ctx.arc(140, 96, 22, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#8a5a2b';
    ctx.lineWidth = 6;
    ctx.strokeRect(24, 64, 150, 100);
    ctx.beginPath(); ctx.moveTo(99, 64); ctx.lineTo(99, 164); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(24, 114); ctx.lineTo(174, 114); ctx.stroke();
  }

  // Format detik menjadi MM:SS.
  function formatWarungClock(seconds) {
    var s = Math.max(0, Math.ceil(seconds));
    var m = Math.floor(s / 60);
    var r = s % 60;
    return (m < 10 ? '0' : '') + m + ':' + (r < 10 ? '0' : '') + r;
  }

  // Bar horizontal kecil (kesabaran, progres masak) dengan warna berubah.
  function drawWarungBar(ctx, x, y, w, h, frac, goodColor, badColor) {
    ctx.fillStyle = '#3a2a1a';
    ctx.fillRect(x - 2, y - 2, w + 4, h + 4);
    ctx.fillStyle = '#5a4632';
    ctx.fillRect(x, y, w, h);
    var f = Math.max(0, Math.min(1, frac));
    ctx.fillStyle = f > 0.5 ? goodColor : (f > 0.25 ? '#f2b13c' : badColor);
    ctx.fillRect(x, y, Math.round(w * f), h);
  }

  // HUD atas: nama warung, skor, koin, hari, timer shift, hati.
  function drawWarungHud(ctx, world) {
    ctx.fillStyle = '#7a3b12';
    ctx.fillRect(0, 0, W, 56);
    ctx.fillStyle = '#ffd98a';
    ctx.font = 'bold 26px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('🍳 WARUNG KILAT', 16, 30);
    ctx.font = 'bold 22px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('Skor ' + world.score, 300, 30);
    ctx.fillText('🪙 ' + world.coins, 470, 30);
    ctx.fillText('Hari ' + world.day, 620, 30);
    ctx.fillStyle = world.shiftLeft <= 20 ? '#ff6b5e' : '#ffffff';
    ctx.fillText('⏱ Shift ' + formatWarungClock(world.shiftLeft), 740, 30);
    ctx.fillStyle = '#ffffff';
    var hearts = '';
    for (var i = 0; i < WARUNG_CONFIG.maxHearts; i++) {
      hearts += i < world.hearts ? '❤️' : '🖤';
    }
    ctx.fillText(hearts, 950, 30);
    ctx.fillStyle = '#ffd98a';
    ctx.font = '18px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('Disajikan: ' + world.servedCount, 1264, 30);
    ctx.textAlign = 'left';
  }

  // Papan order: 3 tiket berisi nama hidangan, bahan yang dibutuhkan, dan bar kesabaran.
  function drawWarungOrders(ctx, world) {
    ctx.fillStyle = '#5b3a1e';
    ctx.fillRect(0, 60, W, 128);
    ctx.fillStyle = '#ffd98a';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText('📋 PAPAN ORDER — sajikan sebelum pelanggan pergi!', 16, 78);
    for (var s = 0; s < WARUNG_CONFIG.maxOrders; s++) {
      var x = 40 + s * 400;
      var y = 88;
      ctx.fillStyle = '#fff8e6';
      ctx.fillRect(x, y, 360, 88);
      ctx.strokeStyle = '#c98f4e';
      ctx.lineWidth = 3;
      ctx.strokeRect(x, y, 360, 88);
      var order = world.orders[s];
      if (!order) {
        ctx.fillStyle = '#9a7a52';
        ctx.font = '18px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('— menunggu pelanggan —', x + 180, y + 46);
        ctx.textAlign = 'left';
        continue;
      }
      var recipe = findWarungRecipe(order.recipeId);
      ctx.font = '34px sans-serif';
      ctx.fillText(recipe.icon, x + 12, y + 44);
      ctx.fillStyle = '#3a2a1a';
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText(recipe.name, x + 58, y + 30);
      ctx.font = '16px sans-serif';
      ctx.fillStyle = '#6b4a2f';
      var needNames = recipe.needs.map(function (id) {
        var ing = findWarungIngredient(id);
        return ing.icon + ' ' + ing.name;
      }).join(' + ');
      ctx.fillText(needNames, x + 58, y + 56);
      drawWarungBar(ctx, x + 12, y + 68, 336, 12, order.patience / order.maxPatience, '#7bc96f', '#d94f3d');
      ctx.fillStyle = '#d94f3d';
      ctx.font = 'bold 15px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText('⏱ ' + Math.ceil(order.patience) + ' dtk', x + 348, y + 30);
      ctx.textAlign = 'left';
    }
  }

  // Counter bahan: 10 kotak bahan yang bisa diklik untuk dimasukkan ke tray.
  function drawWarungBins(ctx, world, hover) {
    ctx.fillStyle = '#8a5a2b';
    ctx.fillRect(12, 196, 1256, 122);
    ctx.fillStyle = '#ffd98a';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText('🧺 COUNTER BAHAN — klik bahan / dekati lalu tekan E', 24, 212);
    for (var i = 0; i < WARUNG_INGREDIENTS.length; i++) {
      var ing = WARUNG_INGREDIENTS[i];
      var rect = warungBinRect(i);
      var isHover = hover && hover.x >= rect.x && hover.x <= rect.x + rect.w &&
                    hover.y >= rect.y && hover.y <= rect.y + rect.h;
      ctx.fillStyle = isHover ? '#fff3cf' : ing.color;
      ctx.fillRect(rect.x, rect.y + 22, rect.w, 74);
      ctx.strokeStyle = '#5b3a1e';
      ctx.lineWidth = 2;
      ctx.strokeRect(rect.x, rect.y + 22, rect.w, 74);
      ctx.font = '34px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(ing.icon, rect.x + rect.w / 2, rect.y + 62);
      ctx.fillStyle = '#3a2a1a';
      ctx.font = 'bold 15px sans-serif';
      ctx.fillText(ing.name, rect.x + rect.w / 2, rect.y + 88);
      ctx.textAlign = 'left';
    }
  }

  // Satu wajan: kompor, wajan, isi masakan, bar progres, atau tanda gosong.
  function drawWarungWok(ctx, wok, hover) {
    var rect = { x: wok.x, y: wok.y, w: 220, h: 150 };
    var isHover = hover && hover.x >= rect.x && hover.x <= rect.x + rect.w &&
                  hover.y >= rect.y && hover.y <= rect.y + rect.h;
    ctx.fillStyle = isHover ? '#a06a35' : '#8a5a2b';
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.fillStyle = '#ffd98a';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText('🍳 WAJAN ' + (wok.id + 1), rect.x + 12, rect.y + 22);
    // Kompor dan wajan bundar.
    ctx.fillStyle = '#444';
    ctx.fillRect(rect.x + 30, rect.y + 90, 160, 14);
    ctx.fillStyle = '#2b2b2b';
    ctx.beginPath();
    ctx.arc(rect.x + 110, rect.y + 98, 58, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = wok.burnt ? '#1a1a1a' : '#6b6b6b';
    ctx.beginPath();
    ctx.arc(rect.x + 110, rect.y + 98, 48, 0, Math.PI * 2);
    ctx.fill();
    if (wok.dish) {
      var recipe = findWarungRecipe(wok.dish);
      ctx.font = '40px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(wok.burnt ? '🔥' : recipe.icon, rect.x + 110, rect.y + 112);
      ctx.textAlign = 'left';
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 15px sans-serif';
      ctx.fillText(wok.burnt ? 'GOSONG! Tekan E' : recipe.name, rect.x + 12, rect.y + 128);
      if (!wok.burnt) {
        drawWarungBar(ctx, rect.x + 12, rect.y + 134, 196, 10,
          wok.progress / recipe.cookSeconds, '#7bc96f', '#d94f3d');
      }
    } else {
      ctx.fillStyle = '#e8cfa0';
      ctx.font = '15px sans-serif';
      ctx.fillText('kosong — bawa bahan resep', rect.x + 12, rect.y + 128);
    }
  }

  // Meja plating dan jendela serving berdampingan di sisi kanan dapur.
  function drawWarungPlatingAndServing(ctx, world, hover) {
    var zones = warungStationRects();
    var p = zones.plating;
    var s = zones.serving;
    var pHover = hover && hover.x >= p.x && hover.x <= p.x + p.w && hover.y >= p.y && hover.y <= p.y + p.h;
    ctx.fillStyle = pHover ? '#b57a3e' : '#9c6a30';
    ctx.fillRect(p.x, p.y, p.w, p.h);
    ctx.fillStyle = '#ffd98a';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText('🍽️ MEJA PLATING', p.x + 12, p.y + 22);
    if (world.plating) {
      var recipe = findWarungRecipe(world.plating);
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(p.x + 130, p.y + 92, 78, 34, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#c98f4e';
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.font = '44px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(recipe.icon, p.x + 130, p.y + 108);
      ctx.textAlign = 'left';
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 15px sans-serif';
      ctx.fillText('✅ ' + recipe.name + ' SIAP — ambil piringnya!', p.x + 12, p.y + 140);
    } else {
      ctx.fillStyle = '#e8cfa0';
      ctx.font = '15px sans-serif';
      ctx.fillText('belum ada hidangan matang', p.x + 12, p.y + 90);
    }
    var sHover = hover && hover.x >= s.x && hover.x <= s.x + s.w && hover.y >= s.y && hover.y <= s.y + s.h;
    ctx.fillStyle = sHover ? '#5e8f7a' : '#4a7a63';
    ctx.fillRect(s.x, s.y, s.w, s.h);
    ctx.fillStyle = '#eafff2';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText('🔔 JENDELA SERVING', s.x + 12, s.y + 22);
    ctx.font = '52px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🪟', s.x + 150, s.y + 96);
    ctx.textAlign = 'left';
    ctx.fillStyle = '#fff';
    ctx.font = '15px sans-serif';
    ctx.fillText('Antar piring ke sini untuk', s.x + 12, s.y + 128);
    ctx.fillText('menyajikan ke pelanggan.', s.x + 12, s.y + 146);
  }

  // Koki: topi putih, badan oranye, dan tray berisi bahan yang dibawa.
  function drawWarungChef(ctx, world) {
    var c = world.chef;
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath();
    ctx.ellipse(c.x, c.y + 34, 26, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    // Badan (celemek oranye).
    ctx.fillStyle = '#e8722a';
    ctx.fillRect(c.x - 20, c.y - 8, 40, 40);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(c.x - 20, c.y + 6, 40, 26);
    // Kepala dan topi koki.
    ctx.fillStyle = '#f2c89a';
    ctx.beginPath();
    ctx.arc(c.x, c.y - 20, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(c.x - 8, c.y - 30, 10, 0, Math.PI * 2);
    ctx.arc(c.x + 8, c.y - 30, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(c.x - 14, c.y - 34, 28, 8);
    // Tray di tangan: ikon bahan yang dibawa, atau piring hidangan.
    var items = [];
    for (var i = 0; i < world.tray.length; i++) {
      var ing = findWarungIngredient(world.tray[i]);
      if (ing) items.push(ing.icon);
    }
    if (world.carriedDish) {
      var dish = findWarungRecipe(world.carriedDish);
      items.push('🍽️' + dish.icon);
    }
    if (items.length > 0) {
      var tx = c.x + 24 * c.dir;
      ctx.fillStyle = '#c9a35a';
      ctx.fillRect(tx - 34, c.y - 2, 68, 8);
      ctx.font = '22px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(items.join(''), tx, c.y - 8);
      ctx.textAlign = 'left';
    }
  }

  // Panel resep di bawah dapur + pesan singkat di tengah layar.
  function drawWarungFooter(ctx, world) {
    ctx.fillStyle = '#5b3a1e';
    ctx.fillRect(0, 580, W, 220);
    ctx.fillStyle = '#ffd98a';
    ctx.font = 'bold 17px sans-serif';
    ctx.fillText('📖 RESEP — kumpulkan bahan, masak di wajan, plating, sajikan!', 24, 606);
    var x = 24;
    for (var r = 0; r < WARUNG_RECIPES.length; r++) {
      var recipe = WARUNG_RECIPES[r];
      ctx.fillStyle = '#fff8e6';
      ctx.fillRect(x, 620, 296, 76);
      ctx.font = '30px sans-serif';
      ctx.fillText(recipe.icon, x + 10, 662);
      ctx.fillStyle = '#3a2a1a';
      ctx.font = 'bold 17px sans-serif';
      ctx.fillText(recipe.name + '  •  ' + recipe.cookSeconds + ' dtk  •  ' + recipe.price + ' koin', x + 50, 646);
      ctx.font = '15px sans-serif';
      ctx.fillStyle = '#6b4a2f';
      ctx.fillText(recipe.needs.map(function (id) { return findWarungIngredient(id).name; }).join(' + '), x + 50, 672);
      x += 308;
    }
    ctx.fillStyle = '#ffd98a';
    ctx.font = '16px sans-serif';
    ctx.fillText('Gerak: WASD / panah  •  Interaksi: E atau Spasi  •  Klik: ambil bahan, wajan, plating, serving  •  M: suara', 24, 724);
    ctx.fillText('Tray: ' + (world.tray.length ? world.tray.map(function (id) { return findWarungIngredient(id).icon; }).join(' ') : '(kosong)') +
      (world.carriedDish ? '   •   Membawa: 🍽️ ' + findWarungRecipe(world.carriedDish).name : ''), 24, 752);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText('Koki: ' + (world.chef.dir > 0 ? '→' : '←') + '  •  Gagal: ' + world.failedOrders + ' order (3 = tutup!)', 24, 780);
    if (world.message && world.time < world.messageUntil) {
      ctx.font = 'bold 22px sans-serif';
      var tw = ctx.measureText(world.message).width;
      ctx.fillStyle = 'rgba(0,0,0,0.65)';
      ctx.fillRect((W - tw) / 2 - 16, 330, tw + 32, 40);
      ctx.fillStyle = '#ffe9a8';
      ctx.textAlign = 'center';
      ctx.fillText(world.message, W / 2, 357);
      ctx.textAlign = 'left';
    }
  }

  // Layar title: logo besar, cara main, dan tombol mulai.
  function drawWarungTitle(ctx, world) {
    drawWarungKitchen(ctx);
    ctx.fillStyle = 'rgba(60,30,5,0.55)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#fff8e6';
    ctx.fillRect(190, 110, 900, 560);
    ctx.strokeStyle = '#c98f4e';
    ctx.lineWidth = 6;
    ctx.strokeRect(190, 110, 900, 560);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#7a3b12';
    ctx.font = 'bold 84px sans-serif';
    ctx.fillText('🍳 WARUNG KILAT', 640, 240);
    ctx.font = 'bold 30px sans-serif';
    ctx.fillStyle = '#3a2a1a';
    ctx.fillText('Game masak time-management — warung makan Indonesia', 640, 300);
    ctx.font = '24px sans-serif';
    ctx.fillStyle = '#6b4a2f';
    ctx.fillText('Ambil bahan → masak di wajan → plating → sajikan sebelum pelanggan pergi!', 640, 350);
    ctx.fillText('🍛 Nasi Goreng   🍝 Mie Goreng   🍢 Sate Ayam   🥤 Es Teh', 640, 400);
    ctx.fillText('Gerak: WASD / panah  •  Interaksi: E / Spasi  •  Bisa juga klik mouse', 640, 450);
    var blink = Math.floor(world.time * 2) % 2 === 0;
    if (blink) {
      ctx.fillStyle = '#e8722a';
      ctx.font = 'bold 32px sans-serif';
      ctx.fillText('▶ TEKAN ENTER / KLIK UNTUK MULAI ◀', 640, 530);
    }
    ctx.fillStyle = '#9a7a52';
    ctx.font = '18px sans-serif';
    ctx.fillText('3 order gagal = warung tutup. Shift 150 detik per hari — makin lama makin ramai!', 640, 590);
    ctx.textAlign = 'left';
  }

  // Layar game over: skor akhir dan ajakan main lagi.
  function drawWarungGameOver(ctx, world) {
    drawWarungKitchen(ctx);
    ctx.fillStyle = 'rgba(40,10,5,0.6)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#fff8e6';
    ctx.fillRect(240, 130, 800, 520);
    ctx.strokeStyle = '#d94f3d';
    ctx.lineWidth = 6;
    ctx.strokeRect(240, 130, 800, 520);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#d94f3d';
    ctx.font = 'bold 72px sans-serif';
    ctx.fillText('🚪 WARUNG TUTUP!', 640, 250);
    ctx.fillStyle = '#3a2a1a';
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText('3 pelanggan pergi kecewa — shift berakhir.', 640, 310);
    ctx.font = '30px sans-serif';
    ctx.fillText('Skor akhir: ' + world.score + '   •   Koin: ' + world.coins, 640, 380);
    ctx.fillText('Hari tercapai: ' + world.day + '   •   Hidangan disajikan: ' + world.servedCount, 640, 430);
    var blink = Math.floor(world.time * 2) % 2 === 0;
    if (blink) {
      ctx.fillStyle = '#e8722a';
      ctx.font = 'bold 30px sans-serif';
      ctx.fillText('▶ TEKAN R / ENTER UNTUK MAIN LAGI ◀', 640, 520);
    }
    ctx.fillStyle = '#9a7a52';
    ctx.font = '18px sans-serif';
    ctx.fillText('Terima kasih sudah masak di Warung Kilat!', 640, 580);
    ctx.textAlign = 'left';
  }

  // Gambar satu frame penuh sesuai layar aktif.
  function drawWarungFrame(ctx, world, hover) {
    ctx.clearRect(0, 0, W, H);
    if (world.screen === 'title') {
      drawWarungTitle(ctx, world);
      return;
    }
    if (world.screen === 'over') {
      drawWarungGameOver(ctx, world);
      return;
    }
    drawWarungKitchen(ctx);
    drawWarungHud(ctx, world);
    drawWarungOrders(ctx, world);
    drawWarungBins(ctx, world, hover);
    drawWarungWok(ctx, world.woks[0], hover);
    drawWarungWok(ctx, world.woks[1], hover);
    drawWarungPlatingAndServing(ctx, world, hover);
    drawWarungFooter(ctx, world);
    drawWarungChef(ctx, world);
  }

  global.drawWarungFrame = drawWarungFrame;
  global.drawWarungHud = drawWarungHud;
  global.drawWarungOrders = drawWarungOrders;
  global.drawWarungBins = drawWarungBins;
  global.drawWarungWok = drawWarungWok;
  global.drawWarungPlatingAndServing = drawWarungPlatingAndServing;
  global.drawWarungChef = drawWarungChef;
  global.drawWarungFooter = drawWarungFooter;
  global.drawWarungTitle = drawWarungTitle;
  global.drawWarungGameOver = drawWarungGameOver;
  global.formatWarungClock = formatWarungClock;
})(typeof window !== 'undefined' ? window : globalThis);
