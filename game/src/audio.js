// audio.js — bunyi-bunyian kecil Warung Kilat lewat WebAudio oscillator.
// Tanpa file suara eksternal; semua bunyi disintesis saat runtime.
// AudioContext baru dibuat setelah interaksi pertama (aturan autoplay browser).
(function (global) {
  'use strict';

  var audioContext = null;
  var soundEnabled = true;

  // Buat (atau pakai ulang) AudioContext setelah ada interaksi pengguna.
  function ensureWarungAudio() {
    if (audioContext) return audioContext;
    var Ctor = global.AudioContext || global.webkitAudioContext;
    if (!Ctor) return null;
    audioContext = new Ctor();
    return audioContext;
  }

  // Mainkan satu nada pendek: frekuensi, durasi detik, jenis gelombang, volume.
  function playWarungTone(freq, seconds, wave, volume) {
    if (!soundEnabled) return;
    var ctx = ensureWarungAudio();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume();
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.type = wave || 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(volume || 0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + seconds);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + seconds);
  }

  // Bunyi-bunyi bernama yang dipakai game: ambil, masak, gosong, sajikan, gagal.
  var WARUNG_SOUNDS = {
    pickup: function () { playWarungTone(520, 0.09, 'triangle', 0.07); },
    cookStart: function () { playWarungTone(300, 0.12, 'sawtooth', 0.05); playWarungTone(450, 0.12, 'sine', 0.05); },
    dishReady: function () { playWarungTone(660, 0.1, 'sine', 0.08); setTimeout(function () { playWarungTone(880, 0.14, 'sine', 0.08); }, 110); },
    serveGood: function () { playWarungTone(523, 0.1, 'triangle', 0.08); setTimeout(function () { playWarungTone(659, 0.1, 'triangle', 0.08); }, 100); setTimeout(function () { playWarungTone(784, 0.16, 'triangle', 0.08); }, 200); },
    burnt: function () { playWarungTone(180, 0.25, 'square', 0.06); },
    orderLost: function () { playWarungTone(220, 0.2, 'sawtooth', 0.06); setTimeout(function () { playWarungTone(165, 0.3, 'sawtooth', 0.06); }, 180); },
    click: function () { playWarungTone(700, 0.05, 'square', 0.04); }
  };

  global.WARUNG_SOUNDS = WARUNG_SOUNDS;
  global.ensureWarungAudio = ensureWarungAudio;
  global.setWarungSoundEnabled = function (on) { soundEnabled = !!on; };
  // Mainkan bunyi berdasarkan nama; nama tak dikenal diabaikan diam-diam.
  global.playWarungSound = function (name) {
    var fn = WARUNG_SOUNDS[name];
    if (typeof fn === 'function') fn();
  };
})(typeof window !== 'undefined' ? window : globalThis);
