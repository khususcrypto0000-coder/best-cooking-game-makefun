// input.js — keyboard (WASD/panah + E/Spasi/Enter) dan mouse untuk Warung Kilat.
// Menyimpan tombol yang sedang ditekan dan antrean klik; game membaca lewat
// fungsi-fungsi kecil, bukan langsung dari event listener.
(function (global) {
  'use strict';

  var pressedKeys = {};
  var justPressedKeys = {};
  var clickQueue = [];
  var mousePos = { x: 0, y: 0 };

  // Pasang listener sekali pada window dan canvas.
  function initWarungInput(canvas) {
    global.addEventListener('keydown', function (ev) {
      var key = ev.key.toLowerCase();
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].indexOf(key) !== -1) {
        ev.preventDefault();
      }
      if (!pressedKeys[key]) justPressedKeys[key] = true;
      pressedKeys[key] = true;
    });
    global.addEventListener('keyup', function (ev) {
      pressedKeys[ev.key.toLowerCase()] = false;
    });
    canvas.addEventListener('mousemove', function (ev) {
      var rect = canvas.getBoundingClientRect();
      mousePos.x = (ev.clientX - rect.left) * (canvas.width / rect.width);
      mousePos.y = (ev.clientY - rect.top) * (canvas.height / rect.height);
    });
    canvas.addEventListener('mousedown', function (ev) {
      var rect = canvas.getBoundingClientRect();
      var x = (ev.clientX - rect.left) * (canvas.width / rect.width);
      var y = (ev.clientY - rect.top) * (canvas.height / rect.height);
      clickQueue.push({ x: x, y: y, button: ev.button });
      mousePos.x = x;
      mousePos.y = y;
    });
  }

  // Arah gerak dari tombol yang ditekan: {x:-1..1, y:-1..1}, dinormalisasi.
  function warungMoveDirection() {
    var dx = 0;
    var dy = 0;
    if (pressedKeys['a'] || pressedKeys['arrowleft']) dx -= 1;
    if (pressedKeys['d'] || pressedKeys['arrowright']) dx += 1;
    if (pressedKeys['w'] || pressedKeys['arrowup']) dy -= 1;
    if (pressedKeys['s'] || pressedKeys['arrowdown']) dy += 1;
    if (dx !== 0 && dy !== 0) {
      dx *= 0.7071;
      dy *= 0.7071;
    }
    return { x: dx, y: dy };
  }

  // Benar sekali saat tombol baru saja ditekan di frame ini (lalu dibersihkan).
  function warungKeyJustPressed(key) {
    return !!justPressedKeys[key.toLowerCase()];
  }

  // Bersihkan tombol "baru ditekan" di akhir tiap frame.
  function clearWarungJustPressed() {
    justPressedKeys = {};
  }

  // Ambil dan kosongkan antrean klik sejak frame terakhir.
  function drainWarungClicks() {
    var out = clickQueue;
    clickQueue = [];
    return out;
  }

  global.initWarungInput = initWarungInput;
  global.warungMoveDirection = warungMoveDirection;
  global.warungKeyJustPressed = warungKeyJustPressed;
  global.clearWarungJustPressed = clearWarungJustPressed;
  global.drainWarungClicks = drainWarungClicks;
  global.warungMousePos = function () { return { x: mousePos.x, y: mousePos.y }; };
})(typeof window !== 'undefined' ? window : globalThis);
