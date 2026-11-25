// random.js — generator angka acak dengan seed (mulberry32) untuk Warung Kilat.
// Dipakai supaya mode screenshot (?shot=...&seed=N) selalu me-render adegan yang sama.
(function (global) {
  'use strict';

  // Ubah seed angka menjadi state awal mulberry32.
  function seedWarungRandom(seed) {
    var state = (seed >>> 0) || 1;
    return {
      // Angka acak berikutnya di rentang [0, 1).
      next: function () {
        state = (state + 0x6D2B79F5) >>> 0;
        var t = state;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      },
      // Bilangan bulat acak di rentang [min, max).
      nextInt: function (min, max) {
        return min + Math.floor(this.next() * (max - min));
      },
      // Satu elemen acak dari sebuah daftar.
      pick: function (list) {
        return list[Math.floor(this.next() * list.length)];
      },
      // Acak-acak urutan salinan daftar (Fisher-Yates) tanpa mengubah aslinya.
      shuffle: function (list) {
        var copy = list.slice();
        for (var i = copy.length - 1; i > 0; i--) {
          var j = Math.floor(this.next() * (i + 1));
          var tmp = copy[i];
          copy[i] = copy[j];
          copy[j] = tmp;
        }
        return copy;
      }
    };
  }

  global.seedWarungRandom = seedWarungRandom;
})(typeof window !== 'undefined' ? window : globalThis);
