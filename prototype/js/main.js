/* main.js — bootstrap: nap data -> dung game -> vong lap. */

import { loadData } from './data.js';
import { UI } from './ui.js';
import { Audio } from './audio.js';
import { Game } from './game.js';

const canvas = document.getElementById('view');
const hud = document.getElementById('hud');
const note = document.getElementById('loadNote');

const ui = new UI();
const audio = new Audio();
let game = null;

function fail(err) {
  console.error(err);
  note.innerHTML = `<b style="color:#FF4438">Lỗi nạp:</b> ${err.message}` +
    `<br />Prototype cần chạy qua HTTP (không mở bằng file://). Xem prototype/README.md.`;
}

(async () => {
  try {
    const gd = await loadData();
    note.textContent =
      `Đã nạp ${gd.weapons.weapons.length} vũ khí · ${gd.enemies.enemies.length} loại quái · ` +
      `${gd.upgrades.cards.length} thẻ · ${gd.waves.waveTemplates.length} wave template từ data/*.json`;
    document.getElementById('btnStart').disabled = false;
  } catch (e) { fail(e); return; }

  const start = () => {
    audio.unlock();
    ui.showDbg = document.getElementById('optDbg').checked;
    document.getElementById('dbg').classList.toggle('hidden', !ui.showDbg);
    if (!game) game = new Game(canvas, hud, audio, ui);
    game.input.twoZone = document.getElementById('optTwoZone').checked;
    const depth = parseInt(document.getElementById('optDepth').value, 10) || 1;
    const melee = document.getElementById('optMelee').value;
    game.newRun(depth, melee);
  };

  document.getElementById('btnStart').onclick = start;
  document.getElementById('btnAgain').onclick = () => { ui.showTitle(); };
  document.getElementById('btnReload').onclick = (ev) => {
    ev.stopPropagation();
    if (!game) return;
    if (game.reloading) game.tryPerfectReload();
    else game.startReload();
  };
  document.getElementById('btnPause').onclick = () => {
    if (game?.running) game.endRun(false);
  };

  // ban phim de test tren desktop
  window.addEventListener('keydown', (e) => {
    if (!game?.running) return;
    if (e.code === 'KeyR') game.reloading ? game.tryPerfectReload() : game.startReload();
    if (e.code === 'KeyS') game.dodge('back');
    if (e.code === 'KeyW') game.dodge('forward');
  });

  /* ---- vong lap ----
     requestAnimationFrame KHONG chay khi tab bi an (document.visibilityState = hidden).
     Trong moi truong test tu dong (pane an) dieu do lam game dung han, nen co
     fallback bang setTimeout khi phat hien rAF bi bo doi. */
  let last = performance.now();
  let lastRaf = 0;                 // lan cuoi rAF thuc su fire
  function step(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (game) game.step(dt);
  }
  function frame(now) {
    lastRaf = now;
    step(now);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  /* Fallback: rAF co the fire 1-2 frame luc load roi TAT HAN khi tab bi an.
     Neu chi kiem tra "da tung fire chua" thi fallback se khong bao gio bat lai
     va game dong bang. Phai kiem tra co frame GAN DAY hay khong. */
  setInterval(() => {
    if (performance.now() - lastRaf < 250) return;   // rAF dang khoe
    step(performance.now());
  }, 16);

  // hook debug: cho phep dieu khien tu console / test tu dong
  window.ITG = {
    get game() { return game; },
    ui, audio,
    start,
    step,
    /** chay N frame o dt co dinh — dung de test khong can rAF */
    run(frames = 60, dt = 1 / 60) {
      for (let i = 0; i < frames; i++) { last = performance.now(); if (game) game.step(dt); }
      return game ? { hp: game.hp, gold: game.gold, alive: game.pool.aliveCount, phase: game.director.phase } : null;
    },
  };
})();
