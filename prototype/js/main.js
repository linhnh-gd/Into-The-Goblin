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

/* Danh sach sung sinh TU data: rpm/bang/co che deu doc thang tu weapons.json, va
   moi dong noi ro DELAY GIUA 2 PHAT (60/rpm) -- cau hoi dau tien nguoi choi hoi khi
   cam khau shotgun la "sao no ban cham the". Viet tay danh sach nay thi no lech ngay
   lan tune ke tiep. */
const GUN_IDS = [
  'rw_rifle_gongsat', 'rw_shotgun_mienghang', 'rw_smg_ochuot',
  'rw_pistol_kendong', 'rw_crossbow_gaimuc',
];
const ARCH_VI = {
  rifle: 'súng trường', shotgun: 'súng ghém', smg: 'tiểu liên',
  pistol: 'súng lục', crossbow: 'nỏ', marksman: 'bắn tỉa nhẹ', sniper: 'bắn tỉa',
  launcher: 'phóng lựu', lmg: 'trung liên', minigun: 'minigun',
};

function buildGunPicker(gd) {
  const sel = document.getElementById('optRanged');
  const spec = gd.weapons.balance.archetypeSpec || {};
  sel.innerHTML = GUN_IDS.map((id) => {
    const w = gd.byId[id];
    if (!w) return '';
    const gap = 60 / w.rpm;                       // giay giua 2 phat
    const st = spec[w.archetype] || {};
    const how = st.style === 'spread' ? `${w.pellets} viên ghém tản`
      : st.style === 'pierce' ? `xuyên ${1 + (st.pierce || 0)} con`
      : st.style === 'aoe' ? `nổ ${st.aoeRadiusM}m` : '1 mục tiêu';
    const rate = gap >= 0.25 ? `${gap.toFixed(2)}s giữa 2 phát` : 'bắn liên thanh';
    return `<option value="${id}">${w.name} · ${ARCH_VI[w.archetype] || w.archetype}` +
      ` — ${rate}, băng ${w.mag}, ${how}</option>`;
  }).join('');
  sel.value = 'rw_rifle_gongsat';
}

(async () => {
  try {
    const gd = await loadData();
    note.textContent =
      `Đã nạp ${gd.weapons.weapons.length} vũ khí · ${gd.enemies.enemies.length} loại quái · ` +
      `${gd.upgrades.cards.length} thẻ · ${gd.waves.waveTemplates.length} wave template từ data/*.json`;
    buildGunPicker(gd);
    document.getElementById('btnStart').disabled = false;
  } catch (e) { fail(e); return; }

  const start = () => {
    audio.unlock();
    ui.showDbg = false;
    document.getElementById('dbg').classList.toggle('hidden', !ui.showDbg);
    if (!game) game = new Game(canvas, hud, audio, ui);
    const depth = parseInt(document.getElementById('optDepth').value, 10) || 1;
    const melee = document.getElementById('optMelee').value;
    const ranged = document.getElementById('optRanged').value;
    game.newRun(depth, melee, ranged);
  };

  document.getElementById('btnStart').onclick = start;
  document.getElementById('btnAgain').onclick = () => { ui.showTitle(); };
  document.getElementById('btnReload').onclick = (ev) => {
    ev.stopPropagation();
    if (!game) return;
    game.startReload();
  };
  document.getElementById('btnPause').onclick = () => {
    if (game?.running) game.endRun(false);
  };

  // ban phim de test tren desktop
  window.addEventListener('keydown', (e) => {
    if (!game?.running) return;
    if (e.code === 'KeyR') game.startReload();
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
