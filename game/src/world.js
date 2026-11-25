// world.js — state dan logika inti Warung Kilat: order, resep, masak, plating, sajikan.
// Tidak menggambar apa pun; render.js yang membaca state ini untuk digambar.
(function (global) {
  'use strict';

  var ORDER_SLOT_X = [40, 400, 760];
  var BIN_Y = 210;
  var BIN_W = 112;
  var BIN_GAP = 12;

  // Buat state awal permainan baru dari seed.
  function createWarungWorld(seed) {
    var rng = seedWarungRandom(seed || 1);
    return {
      screen: 'title', // title | play | over
      rng: rng,
      score: 0,
      coins: 0,
      day: 1,
      hearts: WARUNG_CONFIG.maxHearts,
      shiftLeft: WARUNG_CONFIG.shiftSeconds,
      time: 0,
      spawnIn: 4,
      orders: [],
      nextOrderId: 1,
      tray: [],        // id bahan yang dibawa koki (maks 4)
      carriedDish: null, // id resep hidangan yang dibawa setelah plating
      woks: [
        { id: 0, x: 150, y: 400, dish: null, progress: 0, burnt: false },
        { id: 1, x: 420, y: 400, dish: null, progress: 0, burnt: false }
      ],
      plating: null,   // id resep hidangan matang yang menunggu di meja plating
      chef: { x: 640, y: 540, dir: 1 },
      message: '',
      messageUntil: 0,
      failedOrders: 0,
      servedCount: 0,
      muted: false
    };
  }

  // Posisi kotak tiap bahan di counter (dipakai render dan klik).
  function warungBinRect(index) {
    return { x: 24 + index * (BIN_W + BIN_GAP), y: BIN_Y, w: BIN_W, h: 96 };
  }

  // Zona stasiun di dapur: wajan, meja plating, jendela serving.
  function warungStationRects() {
    return {
      wok0: { x: 80, y: 400, w: 220, h: 150 },
      wok1: { x: 350, y: 400, w: 220, h: 150 },
      plating: { x: 620, y: 400, w: 260, h: 150 },
      serving: { x: 940, y: 400, w: 300, h: 150 }
    };
  }

  // Pesan singkat di layar (mis. "Nasi Goreng matang!") selama beberapa detik.
  function setWarungMessage(world, text) {
    world.message = text;
    world.messageUntil = world.time + 2.5;
  }

  // Cocokkan isi tray dengan sebuah resep (urutan bahan bebas).
  function matchWarungRecipe(tray) {
    for (var r = 0; r < WARUNG_RECIPES.length; r++) {
      var recipe = WARUNG_RECIPES[r];
      if (recipe.needs.length !== tray.length) continue;
      var ok = true;
      for (var i = 0; i < recipe.needs.length; i++) {
        if (tray.indexOf(recipe.needs[i]) === -1) { ok = false; break; }
      }
      if (ok) return recipe;
    }
    return null;
  }

  // Ambil satu bahan dari counter ke tray koki.
  function takeWarungIngredient(world, ingredientId) {
    if (world.screen !== 'play') return false;
    if (world.tray.length >= WARUNG_CONFIG.traySize) {
      setWarungMessage(world, 'Tray penuh! Masak dulu di wajan.');
      return false;
    }
    world.tray.push(ingredientId);
    playWarungSound('pickup');
    return true;
  }

  // Mulai memasak di wajan kosong: tray harus pas dengan satu resep.
  function startWarungCooking(world, wokIndex) {
    var wok = world.woks[wokIndex];
    if (!wok || wok.dish) return false;
    var recipe = matchWarungRecipe(world.tray);
    if (!recipe) {
      setWarungMessage(world, 'Bahan belum pas resep — cek papan resep!');
      return false;
    }
    wok.dish = recipe.id;
    wok.progress = 0;
    wok.burnt = false;
    world.tray = [];
    playWarungSound('cookStart');
    setWarungMessage(world, 'Memasak ' + recipe.name + '...');
    return true;
  }

  // Ambil hidangan matang dari wajan ke meja plating; wajan gosong dibersihkan.
  function collectWarungWok(world, wokIndex) {
    var wok = world.woks[wokIndex];
    if (!wok || !wok.dish) return false;
    var recipe = findWarungRecipe(wok.dish);
    if (wok.burnt) {
      wok.dish = null;
      wok.progress = 0;
      wok.burnt = false;
      playWarungSound('burnt');
      setWarungMessage(world, 'Gosong! Wajan dibersihkan.');
      return true;
    }
    if (wok.progress < recipe.cookSeconds) {
      setWarungMessage(world, 'Belum matang — tunggu bar masaknya penuh!');
      return false;
    }
    if (world.plating) {
      setWarungMessage(world, 'Meja plating masih ada hidangan!');
      return false;
    }
    world.plating = wok.dish;
    wok.dish = null;
    wok.progress = 0;
    playWarungSound('dishReady');
    setWarungMessage(world, recipe.name + ' matang! Ambil di meja plating.');
    return true;
  }

  // Ambil piring dari meja plating untuk dibawa ke jendela serving.
  function takeWarungPlate(world) {
    if (!world.plating || world.carriedDish) return false;
    world.carriedDish = world.plating;
    world.plating = null;
    playWarungSound('pickup');
    return true;
  }

  // Sajikan hidangan yang dibawa ke order yang cocok di papan order.
  function serveWarungDish(world) {
    if (!world.carriedDish) {
      setWarungMessage(world, 'Bawa piring dulu dari meja plating!');
      return false;
    }
    var recipe = findWarungRecipe(world.carriedDish);
    for (var i = 0; i < world.orders.length; i++) {
      if (world.orders[i].recipeId === world.carriedDish) {
        var order = world.orders[i];
        var bonus = Math.round(50 * (order.patience / order.maxPatience));
        world.score += WARUNG_CONFIG.serveScore + bonus;
        world.coins += recipe.price;
        world.servedCount++;
        world.orders.splice(i, 1);
        world.carriedDish = null;
        playWarungSound('serveGood');
        setWarungMessage(world, recipe.name + ' tersaji! +' + (WARUNG_CONFIG.serveScore + bonus) + ' poin, +' + recipe.price + ' koin.');
        return true;
      }
    }
    setWarungMessage(world, 'Tidak ada yang pesan ' + recipe.name + ' — cek tiket order!');
    return false;
  }

  // Buat satu order baru dari pool resep hari ini.
  function spawnWarungOrder(world) {
    if (world.orders.length >= WARUNG_CONFIG.maxOrders) return;
    var level = levelForWarungDay(world.day);
    var recipeId = world.rng.pick(level.orderPool);
    world.orders.push({
      id: world.nextOrderId++,
      recipeId: recipeId,
      patience: level.patience,
      maxPatience: level.patience
    });
  }

  // Order yang kesabarannya habis: pelanggan pergi, satu hati hilang.
  function expireWarungOrder(world, order) {
    var idx = world.orders.indexOf(order);
    if (idx !== -1) world.orders.splice(idx, 1);
    world.hearts--;
    world.failedOrders++;
    playWarungSound('orderLost');
    var recipe = findWarungRecipe(order.recipeId);
    setWarungMessage(world, 'Pelanggan ' + (recipe ? recipe.name : '') + ' pergi! Hati berkurang.');
    if (world.hearts <= 0) {
      world.screen = 'over';
      playWarungSound('orderLost');
    }
  }

  // Majukan waktu game: masak di wajan, kesabaran order, timer shift, spawn order.
  function updateWarungWorld(world, dt) {
    if (world.screen !== 'play') return;
    world.time += dt;
    world.shiftLeft -= dt;
    if (world.shiftLeft <= 0) {
      world.day++;
      world.shiftLeft = WARUNG_CONFIG.shiftSeconds;
      world.coins += WARUNG_CONFIG.dayBonusCoins;
      setWarungMessage(world, 'Hari ' + world.day + '! Bonus +' + WARUNG_CONFIG.dayBonusCoins + ' koin.');
    }
    // Wajan: progres masak, lalu gosong kalau dibiarkan.
    for (var w = 0; w < world.woks.length; w++) {
      var wok = world.woks[w];
      if (!wok.dish || wok.burnt) continue;
      var recipe = findWarungRecipe(wok.dish);
      wok.progress += dt;
      if (wok.progress > recipe.cookSeconds + WARUNG_CONFIG.burnGraceSeconds) {
        wok.burnt = true;
        playWarungSound('burnt');
        setWarungMessage(world, 'Wajan gosong! Bersihkan dulu.');
      }
    }
    // Kesabaran tiap order menipis; yang habis membuat pelanggan pergi.
    var level = levelForWarungDay(world.day);
    for (var i = world.orders.length - 1; i >= 0; i--) {
      world.orders[i].patience -= dt;
      if (world.orders[i].patience <= 0) expireWarungOrder(world, world.orders[i]);
      if (world.screen !== 'play') return;
    }
    // Order baru datang berkala.
    world.spawnIn -= dt;
    if (world.spawnIn <= 0) {
      spawnWarungOrder(world);
      world.spawnIn = level.spawnEvery;
    }
  }

  // Interaksi dengan stasiun terdekat dari posisi koki (tombol E / Spasi).
  function interactWarungNearest(world) {
    var zones = warungStationRects();
    var cx = world.chef.x;
    var cy = world.chef.y;
    function near(rect) {
      return cx >= rect.x - 60 && cx <= rect.x + rect.w + 60 &&
             cy >= rect.y - 60 && cy <= rect.y + rect.h + 60;
    }
    if (near(zones.wok0)) return wokInteract(world, 0);
    if (near(zones.wok1)) return wokInteract(world, 1);
    if (near(zones.plating)) return takeWarungPlate(world);
    if (near(zones.serving)) return serveWarungDish(world);
    return false;
  }

  // Satu tombol untuk wajan: masak kalau kosong, ambil kalau matang, bersihkan kalau gosong.
  function wokInteract(world, wokIndex) {
    var wok = world.woks[wokIndex];
    if (!wok.dish) return startWarungCooking(world, wokIndex);
    return collectWarungWok(world, wokIndex);
  }

  // Gerakkan koki, dijaga tetap di dalam lantai dapur.
  function moveWarungChef(world, dx, dy, dt) {
    var speed = 260;
    world.chef.x += dx * speed * dt;
    world.chef.y += dy * speed * dt;
    if (dx !== 0) world.chef.dir = dx > 0 ? 1 : -1;
    if (world.chef.x < 30) world.chef.x = 30;
    if (world.chef.x > 1250) world.chef.x = 1250;
    if (world.chef.y < 330) world.chef.y = 330;
    if (world.chef.y > 565) world.chef.y = 565;
  }

  // Adegan deterministik untuk screenshot: satu frame mid-game yang lengkap —
  // papan order berisi tiket, bahan di counter, hidangan sedang dirakit di tray,
  // wajan sedang memasak, timer terlihat, dan satu piring siap disajikan.
  function stageWarungShotPlay(world) {
    world.screen = 'play';
    world.score = 350;
    world.coins = 45;
    world.day = 1;
    world.hearts = 3;
    world.shiftLeft = 92;
    world.time = 58;
    world.tray = ['nasi', 'telur'];
    world.carriedDish = null;
    world.plating = 'nasi-goreng';
    world.orders = [
      { id: 1, recipeId: 'nasi-goreng', patience: 35, maxPatience: 50 },
      { id: 2, recipeId: 'mie-goreng', patience: 22, maxPatience: 45 },
      { id: 3, recipeId: 'es-teh', patience: 42, maxPatience: 50 }
    ];
    world.woks[0].dish = 'sate-ayam';
    world.woks[0].progress = 4.2;
    world.woks[0].burnt = false;
    world.woks[1].dish = null;
    world.woks[1].progress = 0;
    world.woks[1].burnt = false;
    world.chef.x = 950;
    world.chef.y = 365;
    world.chef.dir = -1;
    world.message = 'Nasi Goreng matang! Ambil di meja plating.';
    world.messageUntil = 999999;
  }

  // Adegan title untuk screenshot start.
  function stageWarungShotStart(world) {
    world.screen = 'title';
    world.score = 0;
    world.coins = 0;
    world.day = 1;
    world.hearts = 3;
    world.shiftLeft = WARUNG_CONFIG.shiftSeconds;
  }

  // Adegan game over untuk screenshot end.
  function stageWarungShotEnd(world) {
    world.screen = 'over';
    world.score = 1240;
    world.coins = 96;
    world.day = 3;
    world.hearts = 0;
    world.failedOrders = 3;
    world.servedCount = 11;
    world.shiftLeft = 0;
  }

  global.createWarungWorld = createWarungWorld;
  global.warungBinRect = warungBinRect;
  global.warungStationRects = warungStationRects;
  global.setWarungMessage = setWarungMessage;
  global.matchWarungRecipe = matchWarungRecipe;
  global.takeWarungIngredient = takeWarungIngredient;
  global.startWarungCooking = startWarungCooking;
  global.collectWarungWok = collectWarungWok;
  global.takeWarungPlate = takeWarungPlate;
  global.serveWarungDish = serveWarungDish;
  global.spawnWarungOrder = spawnWarungOrder;
  global.updateWarungWorld = updateWarungWorld;
  global.interactWarungNearest = interactWarungNearest;
  global.moveWarungChef = moveWarungChef;
  global.stageWarungShotPlay = stageWarungShotPlay;
  global.stageWarungShotStart = stageWarungShotStart;
  global.stageWarungShotEnd = stageWarungShotEnd;
})(typeof window !== 'undefined' ? window : globalThis);

