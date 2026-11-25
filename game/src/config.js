// config.js — konstanta, daftar bahan, resep, dan aturan level Warung Kilat.
// Satu-satunya sumber kebenaran untuk angka-angka game; file lain hanya membaca.
(function (global) {
  'use strict';

  var WARUNG_CONFIG = {
    canvasWidth: 1280,
    canvasHeight: 800,
    shiftSeconds: 150,
    maxHearts: 3,
    maxOrders: 3,
    traySize: 4,
    orderSpawnEvery: 12,
    burnGraceSeconds: 9,
    serveScore: 100,
    serveCoins: 15,
    dayBonusCoins: 20
  };

  // Bahan yang tersedia di counter. icon digambar sebagai emoji teks di canvas.
  var WARUNG_INGREDIENTS = [
    { id: 'nasi',  name: 'Nasi',  icon: '🍚', color: '#fff3d6' },
    { id: 'telur', name: 'Telur', icon: '🥚', color: '#ffe9a8' },
    { id: 'ayam',  name: 'Ayam',  icon: '🍗', color: '#f2b880' },
    { id: 'sayur', name: 'Sayur', icon: '🥬', color: '#9ed69a' },
    { id: 'mie',   name: 'Mie',   icon: '🍜', color: '#f7d774' },
    { id: 'kecap', name: 'Kecap', icon: '🧂', color: '#6b4a2f' },
    { id: 'cabai', name: 'Cabai', icon: '🌶️', color: '#d94f3d' },
    { id: 'teh',   name: 'Teh',   icon: '🍵', color: '#c98f4e' },
    { id: 'gula',  name: 'Gula',  icon: '🍬', color: '#f4f4f4' },
    { id: 'es',    name: 'Es',    icon: '🧊', color: '#bfe6f5' }
  ];

  // Resep: hidangan, bahan yang dibutuhkan, lama masak di wajan, dan ikon sajian.
  var WARUNG_RECIPES = [
    { id: 'nasi-goreng', name: 'Nasi Goreng', icon: '🍛', needs: ['nasi', 'telur', 'kecap'], cookSeconds: 5, price: 15 },
    { id: 'mie-goreng',  name: 'Mie Goreng',  icon: '🍝', needs: ['mie', 'sayur', 'ayam'],  cookSeconds: 6, price: 18 },
    { id: 'sate-ayam',   name: 'Sate Ayam',   icon: '🍢', needs: ['ayam', 'cabai', 'kecap'], cookSeconds: 7, price: 20 },
    { id: 'es-teh',      name: 'Es Teh',      icon: '🥤', needs: ['teh', 'gula', 'es'],     cookSeconds: 3, price: 8 }
  ];

  // Kecepatan datangnya order dan kesabaran pelanggan per hari.
  var WARUNG_LEVELS = [
    { day: 1, spawnEvery: 14, patience: 50, orderPool: ['nasi-goreng', 'mie-goreng', 'es-teh'] },
    { day: 2, spawnEvery: 11, patience: 45, orderPool: ['nasi-goreng', 'mie-goreng', 'sate-ayam', 'es-teh'] },
    { day: 3, spawnEvery: 9,  patience: 40, orderPool: ['nasi-goreng', 'mie-goreng', 'sate-ayam', 'es-teh'] },
    { day: 4, spawnEvery: 8,  patience: 36, orderPool: ['nasi-goreng', 'mie-goreng', 'sate-ayam', 'es-teh'] }
  ];

  global.WARUNG_CONFIG = WARUNG_CONFIG;
  global.WARUNG_INGREDIENTS = WARUNG_INGREDIENTS;
  global.WARUNG_RECIPES = WARUNG_RECIPES;
  global.WARUNG_LEVELS = WARUNG_LEVELS;

  // Cari resep berdasarkan id hidangan.
  global.findWarungRecipe = function (recipeId) {
    for (var i = 0; i < WARUNG_RECIPES.length; i++) {
      if (WARUNG_RECIPES[i].id === recipeId) return WARUNG_RECIPES[i];
    }
    return null;
  };

  // Cari bahan berdasarkan id.
  global.findWarungIngredient = function (ingredientId) {
    for (var i = 0; i < WARUNG_INGREDIENTS.length; i++) {
      if (WARUNG_INGREDIENTS[i].id === ingredientId) return WARUNG_INGREDIENTS[i];
    }
    return null;
  };

  // Aturan level untuk hari tertentu (hari di atas tabel memakai aturan terakhir).
  global.levelForWarungDay = function (day) {
    var picked = WARUNG_LEVELS[0];
    for (var i = 0; i < WARUNG_LEVELS.length; i++) {
      if (WARUNG_LEVELS[i].day <= day) picked = WARUNG_LEVELS[i];
    }
    return picked;
  };
})(typeof window !== 'undefined' ? window : globalThis);
