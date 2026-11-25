// main.js — loop utama Warung Kilat: baca input, majukan dunia, gambar frame.
// Mendukung mode screenshot deterministik lewat query param:
//   ?shot=start | ?shot=play | ?shot=end  (dengan &seed=N opsional)
// Dalam mode shot, game me-render satu adegan beku tanpa butuh input pengguna.
(function (global) {
  'use strict';

  // Baca parameter dari URL halaman.
  function readWarungParams() {
    var params = {};
    try {
      var search = new URLSearchParams(global.location.search);
      params.shot = search.get('shot');
      var seed = parseInt(search.get('seed') || '1', 10);
      params.seed = isNaN(seed) ? 1 : seed;
    } catch (e) {
      params.shot = null;
      params.seed = 1;
    }
    return params;
  }

  // Tentukan stasiun apa yang diklik (bahan, wajan, plating, serving).
  function handleWarungClick(world, click) {
    if (world.screen !== 'play') return;
    for (var i = 0; i < WARUNG_INGREDIENTS.length; i++) {
      var rect = warungBinRect(i);
      if (click.x >= rect.x && click.x <= rect.x + rect.w &&
          click.y >= rect.y && click.y <= rect.y + rect.h) {
        takeWarungIngredient(world, WARUNG_INGREDIENTS[i].id);
        return;
      }
    }
    var zones = warungStationRects();
    function inside(rect) {
      return click.x >= rect.x && click.x <= rect.x + rect.w &&
             click.y >= rect.y && click.y <= rect.y + rect.h;
    }
    if (inside(zones.wok0)) { wokClick(world, 0); return; }
    if (inside(zones.wok1)) { wokClick(world, 1); return; }
    if (inside(zones.plating)) { takeWarungPlate(world); return; }
    if (inside(zones.serving)) { serveWarungDish(world); return; }
  }

  // Klik wajan: masak kalau kosong, ambil/bersihkan kalau terisi.
  function wokClick(world, wokIndex) {
    var wok = world.woks[wokIndex];
    if (!wok.dish) startWarungCooking(world, wokIndex);
    else collectWarungWok(world, wokIndex);
  }

  // Mulai permainan baru dari layar title / game over.
  function startWarungGame(world, seed) {
    var fresh = createWarungWorld(seed);
    fresh.screen = 'play';
    fresh.time = world.time;
    spawnWarungOrder(fresh);
    spawnWarungOrder(fresh);
    return fresh;
  }

  // Titik masuk: siapkan canvas, input, dunia, lalu jalankan loop animasi.
  function bootWarungGame() {
    var canvas = document.getElementById('game');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var params = readWarungParams();
    var world = createWarungWorld(params.seed);
    initWarungInput(canvas);

    var shotMode = params.shot === 'start' || params.shot === 'play' || params.shot === 'end';
    if (params.shot === 'start') stageWarungShotStart(world);
    else if (params.shot === 'play') stageWarungShotPlay(world);
    else if (params.shot === 'end') stageWarungShotEnd(world);

    // Dalam mode shot, gambar sekali dan berhenti — frame deterministik.
    if (shotMode) {
      drawWarungFrame(ctx, world, null);
      global.__warungWorld = world;
      return;
    }

    var last = performance.now();
    function frame(now) {
      var dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      world.time += dt;

      // Tombol mulai / main lagi.
      if (world.screen === 'title' &&
          (warungKeyJustPressed('enter') || warungKeyJustPressed(' '))) {
        world = startWarungGame(world, params.seed);
        global.__warungWorld = world;
      } else if (world.screen === 'over' &&
          (warungKeyJustPressed('r') || warungKeyJustPressed('enter'))) {
        world = startWarungGame(world, params.seed + 7);
        global.__warungWorld = world;
      }

      // Klik pada title / game over juga memulai permainan.
      var clicks = drainWarungClicks();
      if (world.screen !== 'play' && clicks.length > 0) {
        ensureWarungAudio();
        world = startWarungGame(world, params.seed);
        global.__warungWorld = world;
      }

      if (world.screen === 'play') {
        var dir = warungMoveDirection();
        moveWarungChef(world, dir.x, dir.y, dt);
        if (warungKeyJustPressed('e') || warungKeyJustPressed(' ')) {
          ensureWarungAudio();
          interactWarungNearest(world);
        }
        if (warungKeyJustPressed('m')) {
          world.muted = !world.muted;
          setWarungSoundEnabled(!world.muted);
        }
        for (var i = 0; i < clicks.length; i++) {
          ensureWarungAudio();
          handleWarungClick(world, clicks[i]);
        }
        updateWarungWorld(world, dt);
      }

      drawWarungFrame(ctx, world, warungMousePos());
      clearWarungJustPressed();
      requestAnimationFrame(frame);
    }

    global.__warungWorld = world;
    requestAnimationFrame(frame);
  }

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', bootWarungGame);
    } else {
      bootWarungGame();
    }
  }
})(typeof window !== 'undefined' ? window : globalThis);
