/* game.js — trang thai nguoi choi + combat + vong khoa DAN <-> STAMINA (pillar P2).
   Moi hang so lay tu data/*.json qua balance.js. Xem docs/04, /05, /06, /16. */

import * as THREE from 'three';
import { GD, weapon } from './data.js';
import { goldPerKill, rollRarity, rngFrom, hashSeed, meleeBandDpsCap } from './balance.js';
import { EnemyPool, MELEE_BAND } from './enemies.js';
import { Director } from './director.js';
import { Juice } from './juice.js';
import { World, ROOM_SPACING, HALL_W } from './world.js';
import { GunModel } from './gun.js';
import { Trail } from './trail.js';
import { Projectiles } from './projectiles.js';
import { InputRouter, GESTURE } from './input.js';

/* THE NANG CAP TRONG RUN — doc thang tu data/upgrades.json khoi `cards`.
   Yeu cau nguoi choi: KHONG co the nao co logic. Moi the la MOT con so cong vao mot
   chi so (`stat` + `step` + `kind`), khong dieu kien, khong danh doi, khong co che
   rieng. Nho vay applyCard() la mot bang tra cuu phang -- them the moi trong data
   khong phai sua mot dong code nao. */
const CARD_STAT_LABEL = {
  dmg: 'sát thương', mag: 'băng đạn', reload: 'thời gian nạp', rof: 'nhịp bắn',
  crit: 'chí mạng', reserve: 'đạn dự trữ', gold: 'vàng', magnet: 'hút vàng',
  stamRegen: 'hồi stamina', stamMax: 'stamina', hp: 'máu', kb: 'sức đẩy',
};

/** Tong hieu ung sau `n` the cung stat -- de in "dang co +39% sat thuong". */
function statTotalText(stat, kind, steps) {
  if (!steps.length) return '';
  const pct = (v) => `${Math.round(v * 100)}%`;
  const lbl = CARD_STAT_LABEL[stat] || stat;
  if (kind === 'mult') return `+${pct(steps.reduce((a, s) => a * (1 + s), 1) - 1)} ${lbl}`;
  if (kind === 'less') return `-${pct(1 - steps.reduce((a, s) => a * (1 - s), 1))} ${lbl}`;
  const sum = steps.reduce((a, s) => a + s, 0);
  return kind === 'addpct' ? `+${pct(sum)} ${lbl}` : `+${Math.round(sum)} ${lbl}`;
}

/** Cach mot phat dan cua archetype nay cham vao dam quai: single / spread / pierce / aoe. */
const hitCfgOf = (rw) => (GD.weapons.balance.archetypeSpec || {})[rw.archetype] || { style: 'single' };

const P = () => ({
  hpBase: 100, staminaMax: 100, staminaRegen: 18, staminaRegenDelay: 0.6,
  staminaLow: 0.5, advanceSpeed: 2.4,
});

export class Game {
  constructor(canvas, hudEl, audio, ui) {
    this.audio = audio;
    this.ui = ui;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));

    this.world = new World(this.renderer);
    this.canvas = canvas;
    this.trail = new Trail(document.getElementById('fxTrail'));
    this.proj = new Projectiles(this.world.scene);
    this.gun = new GunModel(this.world.camera);
    this.gunWanted = false;
    this.gunTimer = 0;
    this.slicing = false;
    this.pool = new EnemyPool(this.world.scene);
    this.juice = new Juice(this.world.scene, this.world.camera, hudEl, audio);
    this.director = new Director(this.pool, this.juice, audio);

    this.input = new InputRouter(canvas, {
      onTap: (x, y) => { if (this.gunUp()) { this.shootAt(x, y, true); this.gunRelease(); } },
      /* Tra ve FALSE de tu choi vao che do giu-ban. Het sach dan thi phai tu choi:
         nhan hold luc do la nhot ngon tay o mot trang thai khong lam gi ca. Va KHONG
         goi gunUp() o day khi dang nap voi bang rong -- gunUp() co tac dung phu la
         tinh mot cu Nap Hoan Hao, ma _enterHold() con duoc thu lai nhieu lan thi cu
         nap do bi tieu mat vao mot thoi diem ngau nhien. Nap Hoan Hao la viec cua TAP. */
      onHoldStart: (x, y) => {
        if (this.reloading && this.mag <= 0) return false;
        if (!this.gunUp()) return false;
        this.holdPt = { x, y };
        return true;
      },
      onHoldMove: (x, y) => { if (this.holdPt) this.holdPt = { x, y }; },
      onHoldEnd: () => { this.holdPt = null; this.gunRelease(); },
      onMelee: (s) => this.slash(s),
      // CHEM LIEN TUC: moi doan quet la mot nhat nua, giu ngon tay thi drain stamina
      onSlideStart: () => { this.slicing = true; this.holdPt = null; this.gunAway(); },
      onSlideMove: (s) => this.sliceTick(s),
      onSlideEnd: () => { this.slicing = false; },
      onCancelled: () => { if (navigator.vibrate) navigator.vibrate(8); },
    });

    this.running = false;
    this.perf = { frames: 0, acc: 0, fps: 60, worst: 0 };
    this._onResize = () => this.resize();
    window.addEventListener('resize', this._onResize);
    this.resize();
  }

  resize() {
    // MOT nguon kich thuoc duy nhat cho renderer, luoi dao va vet slash.
    // Dung canvas.clientWidth thi co luc no ra 0 (pane an, layout chua xong) va luoi dao
    // IM LANG khong trung gi ca -- loi khong bao gio thay duoc trong log.
    const w = window.innerWidth, h = window.innerHeight;
    this.vw = w; this.vh = h;
    this.renderer.setSize(w, h, false);
    this.world.resize(w, h);
    this.trail.resize(w, h);
  }

  /* =============================== RUN =============================== */
  /**
   * @param {number} startDepth Depth khoi dau (Trai Mo: Gieng Sau, docs/10) — o prototype
   *        dung de test quai tu Depth 3+ ma khong phai choi lai tu dau.
   * @param {string} meleeId id vu khi can chien khoi dau (Bua Da bo qua khien).
   */
  newRun(startDepth = 1, meleeId = 'mw_dagger_daogam', rangedId = null) {
    const c = P();
    this.const = c;
    const rw = weapon(rangedId || (startDepth >= 3 ? 'rw_rifle_gongsat' : 'rw_pistol_kendong'));
    const mw = weapon(meleeId);
    this.rw = rw; this.mw = mw;

    this.mods = {
      magMult: 1, reloadMult: 1, reserveMult: 1, meleeDmg: 1, rangedDmg: 1,
      kb: 1, corpseLaunch: 1, gold: 1, hpAdd: 0, hpMult: 1, staminaAdd: 0, staminaRegenAdd: 0,
      staminaCostMult: 1, reachAdd: 0, arcAdd: 0, crit: 0.05, critMult: rw.critMult,
      scavengeMult: 1, perfectNeed: 3, magnetMult: 1, dmgTakenMult: 1,
      aimCone: 4, dodgeCdMult: 1, heavyLen: null, noLowPenalty: false,
      dmgPerLuck4: 0, dmgPer1000Gold: 0, twoBlades: false, collapse: false, rofMult: 1,
    };
    this.cards = [];
    this.statLv = {};               // chi so -> so the da lay (chan boi maxStackPerStat)
    this.statSteps = {};            // chi so -> danh sach step, de in tong dang co

    this.hpMax = c.hpBase;
    this.hp = this.hpMax;
    this.stamMax = c.staminaMax;
    this.stam = this.stamMax;
    this.staminaIdle = 0;
    this.mag = rw.mag; this.magMax = rw.mag;
    this.reserveMax = rw.reserveMax; this.reserve = rw.reserveMax;
    this.scavenge = 0;          // so le vien dan da cuop duoc, chua du 1 vien
    this.scavBanner = 0;        // da cuop bao nhieu vien ke tu lan bao gan nhat
    /* Mot mang chem = scavengeReserveFracPerKill cua KHO DAN GOC cua khau dang cam.
       Dung `rw.reserveMax` (GOC trong data, khong phai `this.reserveMax` da nang cap):
         1. the Dan Du Tru chi nang TRAN chua, khong nang TOC DO HOI;
         2. ti gia nay khong the lech khoi co kho dan -- doi `reserveMagsTarget` bao
            nhieu thi no tu dong theo bay nhieu (docs/18 loi #64). */
    this.scavPerKill = rw.reserveMax * GD.feel.melee.scavengeReserveFracPerKill;
    this.luck = 0;
    this.gold = 0;
    this.combo = 0; this.comboT = 0;
    this.chain = 0;
    this.perfectSlashes = 0;
    this.kills = 0;
    this.roomNoHit = true;
    this.buffNextShot = 0;
    this.buffNextSlash = 0;

    this.reloading = false; this.reloadT = 0; this.reloadDur = 0;
    this.reloadWin = [0, 0]; this.reloadTapped = false; this.perfectMag = false;
    this.fireCd = 0;
    /* NHIP BAN: giay giua 2 phat. HUD doc thang tu day de ve dong ho quanh tam ngam
       (shotgun 48 nhip/phut = 1.25s -- khong hien thi thi nguoi choi tuong sung ket). */
    this.fireInterval = 60 / rw.rpm;
    // shotgun nap TUNG VIEN (archetypeSpec.reloadStyle) -- xem startReload()
    this.shellReload =
      ((GD.weapons.balance.archetypeSpec || {})[rw.archetype] || {}).reloadStyle === 'shell';
    this.swingCd = 0;

    this.dodgeCd = 0; this.dashCd = 0; this.iframe = 0;
    this.dmgBudget = undefined;
    this.roomClearSweep = 0;
    this.blockHintShown = false;
    this.flankHintShown = false;
    this.dodgeHintShown = false;
    this.walked = 0;
    this.playerZ = 0;
    this.advancing = null;
    this.bob = 0; this.bobT = 0;

    this.director.reset(startDepth);
    this.pool.clear();
    this.juice.clearWorld();
    this.world.setDepth(startDepth);
    this.world.setDark(false);
    this.startedAt = performance.now();

    this.director.beginRoom();
    this.running = true;
    this.ui.showHud();
    this.ui.banner(`D${startDepth} · PHÒNG 1`, startDepth > 1 ? 'có quái phá chiến thuật' : 'chạm vào nó');
  }

  /* ========================= NANG CAP TRONG RUN ========================= */
  /** 3 lua chon o moi Cong. Bac the do LOC keo len (rarityWeights), khong phai do
   *  so lan da lay. Mot chi so da chong du maxStackPerStat lan thi thoi khong roll. */
  rollCards() {
    const rnd = rngFrom(hashSeed('card', this.director.runIndex, this.director.depth, this.director.room));
    const maxStack = GD.upgrades.stackRules?.maxStackPerStat ?? 8;
    const pool = GD.upgrades.cards.filter((c) => (this.statLv[c.stat] || 0) < maxStack);
    const taken = new Set();
    const out = [];
    for (let i = 0; i < 3; i++) {
      const rar = rollRarity(this.luck, rnd);
      let bucket = pool.filter((c) => c.rarity === rar && !taken.has(c.id) && !taken.has(c.stat));
      if (!bucket.length) bucket = pool.filter((c) => !taken.has(c.id) && !taken.has(c.stat));
      if (!bucket.length) break;
      const c = bucket[Math.floor(rnd() * bucket.length)];
      taken.add(c.id); taken.add(c.stat);        // khong bay 2 the cung chi so
      out.push({ ...c, total: statTotalText(c.stat, c.kind, this.statSteps[c.stat] || []) });
    }
    return out;
  }

  /** Ap mot the. Bang tra cuu PHANG theo `stat` — khong the nao co nhanh rieng. */
  applyCard(u) {
    const m = this.mods;
    this.cards.push(u.id);
    this.statLv[u.stat] = (this.statLv[u.stat] || 0) + 1;
    (this.statSteps[u.stat] = this.statSteps[u.stat] || []).push(u.step);
    switch (u.stat) {
      case 'dmg': m.rangedDmg *= 1 + u.step; m.meleeDmg *= 1 + u.step; break;
      case 'mag': m.magMult *= 1 + u.step; break;
      case 'reload': m.reloadMult *= 1 - u.step; break;
      case 'rof': m.rofMult *= 1 + u.step; break;
      case 'crit': m.crit += u.step; break;
      case 'reserve': m.reserveMult *= 1 + u.step; break;
      case 'gold': m.gold *= 1 + u.step; break;
      case 'magnet': m.magnetMult *= 1 + u.step; break;
      case 'stamRegen': m.staminaRegenAdd += u.step; break;
      case 'stamMax': m.staminaAdd += u.step; break;
      case 'hp': m.hpAdd += u.step; break;
      case 'kb': m.kb *= 1 + u.step; break;
    }
    // ap lai cac tran; phan tang them duoc CONG THANG vao chi so hien tai
    this.stamMax = Math.max(30, P().staminaMax + m.staminaAdd);
    this.stam = Math.min(this.stamMax, this.stam + Math.max(0, u.stat === 'stamMax' ? u.step : 0));
    const oldHpMax = this.hpMax;
    this.hpMax = Math.max(20, Math.round((P().hpBase + m.hpAdd) * m.hpMult));
    this.hp = Math.max(1, Math.min(this.hpMax, this.hp + (this.hpMax - oldHpMax)));

    const oldMag = this.magMax;
    this.magMax = Math.max(1, Math.round(this.rw.mag * m.magMult));
    this.mag = Math.min(this.magMax, this.mag + Math.max(0, this.magMax - oldMag));

    const oldRes = this.reserveMax;
    this.reserveMax = Math.round(this.rw.reserveMax * m.reserveMult);
    this.reserve = Math.min(this.reserveMax, this.reserve + Math.max(0, this.reserveMax - oldRes));

    this.fireInterval = 60 / this.rw.rpm / m.rofMult;
  }

  /* =========================== BUFF TONG HOP =========================== */
  get dmgBuff() {
    const m = this.mods;
    let b = 1;
    b += m.dmgPerLuck4 * Math.floor(this.luck / 4);
    b += Math.min(0.4, m.dmgPer1000Gold * Math.floor(this.gold / 1000));
    return b;
  }
  /* CHUOI CHEM khong con NHAN SAT THUONG (yeu cau nguoi choi: bo bonus dmg can chien).
     Dao gio la sat thuong PHANG: mw.dmg x the nang cap, khong co bac thang an theo
     so nhat lien tiep. Bien `combo` chi con dung cho ban kinh hut vang (combo >= 5). */
  get chainMult() { return this.chain >= 15 ? 1.4 : this.chain >= 8 ? 1.25 : this.chain >= 4 ? 1.1 : 1; }

  /* ============================= BAN =============================== */
  /** Diem ra dan trong the gioi (dau nong sung), de vien dan bay tu dung cho. */
  muzzle() {
    const G = GD.feel.gun, cam = this.world.camera;
    return this._muz ? this._muz.set(G.offsetX, G.restY + 0.06, G.offsetZ - 0.35).applyMatrix4(cam.matrixWorld)
                     : (this._muz = new THREE.Vector3(G.offsetX, G.restY + 0.06, G.offsetZ - 0.35)).applyMatrix4(cam.matrixWorld);
  }

  /** DAN GHEM TAN THEO GOC THAT (docs/04 muc 5c).
      Moi vien lay mot goc ngau nhien trong non `spreadDeg` roi tim con gan tia do nhat.
      Gan thi nhieu vien chum vao MOT con (thua sat thuong), xa thi tan ra hoac truot --
      dung nhu shotgun that, va tu no can bang thay vi phai chia deu N muc tieu. */
  spreadTargets(nPellets, spreadDeg, cfg = {}, centerAng = 0, unit = 1, rnd = Math.random) {
    const cand = [];
    const far = GD.feel.run.tapFarM;
    const radius = cfg.pelletRadiusM != null ? cfg.pelletRadiusM : 0.42;
    for (const e of this.pool.list) {
      if (!e.alive) continue;
      const zGap = this.playerZ - e.z;
      if (zGap <= 0.3) continue;
      const d = Math.hypot(e.x, zGap);
      if (d > far) continue;
      cand.push({ e, d, ang: Math.atan2(e.x, zGap) });
    }
    // gan truoc xa sau: mot lan sort cho ca loat, thay vi do lai cho tung vien
    cand.sort((p, q) => p.d - q.d);

    /* MOI VIEN GHEM LA MOT TIA, DI TU GAN RA XA (docs/04 muc 5c-ter).
       LOI CU (docs/18 loi #53): chon con co SAI LECH NGANG NHO NHAT thay vi con GAN
       NHAT tren tia. Mot con o 12m nam dung tia (lech 0.05m) thang mot con o 4m nam
       lech 0.5m -- nen mot phat ban giet con DANG SAU trong khi may con truoc mat
       khong xay ra gi. Doc ra nhu dan xuyen qua nguoi song.

       Mo hinh dung, lay tu cac game horde (Left 4 Dead / Killing Floor):
         - vien ghem cham con DAU TIEN tren tia,
         - neu vien do GIET duoc no thi dan DI XUYEN QUA (con penetrationMult sat
           thuong) sang con ke tiep, toi da penetrateMax con,
         - neu KHONG giet duoc thi vien dan DUNG LAI o do.
       Luat "chi xuyen khi giet" bao dam khong bao gio co canh con dang sau chet ma con
       truoc mat con song, ma van giu duoc fantasy "mot phat don sach mot hang". */
    const half = (spreadDeg * Math.PI) / 180 / 2;
    const maxPen = Math.max(0, cfg.penetrateMax || 0);
    const penMult = cfg.penetrationMult != null ? cfg.penetrationMult : 0.6;
    const hp = new Map();                       // HP mo phong trong ca loat ban
    const dmgOut = new Map();                   // con -> tong sat thuong loat nay
    const firstHit = [];                        // con dau tien cua tung vien, de ve vien dan

    for (let i = 0; i < nPellets; i++) {
      // non dan ghem xoay theo huong NGAM (tap: diem cham; hold: con tu nham)
      const a = centerAng + (rnd() * 2 - 1) * half;
      let mult = 1;
      let through = 0;
      let first = null;
      for (const c of cand) {
        // sai lech NGANG cua vien dan tai do sau cua con do
        const err = Math.abs(Math.tan(a - c.ang)) * c.d;
        if (err >= radius + 0.3 * c.e.scale) continue;      // tia di lot qua ben canh
        if (!first) first = c.e;
        const dmg = unit * mult * this.rangeFalloff(cfg, c.d);
        dmgOut.set(c.e, (dmgOut.get(c.e) || 0) + dmg);
        const left = (hp.has(c.e) ? hp.get(c.e) : c.e.hp) - dmg;
        hp.set(c.e, left);
        if (left > 0 || through >= maxPen) break;           // khong giet duoc -> dan dung lai
        through++;
        mult *= penMult;                                     // xuyen qua thi yeu di
      }
      firstHit.push(first);
    }
    return { dmgOut, firstHit };
  }

  /** Tat dan theo tam (dan ghem): nguyen luc toi falloffStartM, con falloffMin o
   *  falloffEndM. Day la thu giu cho mot khau "don sach mot vung" khong bien thanh
   *  khau ban tia dam dong o dai Xa -- no phai la vu khi CU LY GAN. */
  rangeFalloff(cfg, dist) {
    const s = cfg.falloffStartM, e = cfg.falloffEndM;
    if (s == null || e == null || e <= s || dist <= s) return 1;
    const min = cfg.falloffMin != null ? cfg.falloffMin : 0.4;
    const k = Math.min(1, (dist - s) / (e - s));
    return 1 - (1 - min) * k;
  }
  /** Danh sach muc tieu tu nham, gan nhat truoc, uu tien LAN GIUA (docs/04 muc 2b). */
  pickAutoList(n) {
    const LN = GD.feel.lanes, far = GD.feel.run.tapFarM;
    const mid = [], side = [];
    for (const e of this.pool.list) {
      if (!e.alive) continue;
      const zGap = this.playerZ - e.z;
      if (zGap <= 0.1) continue;
      const d = Math.hypot(e.x, zGap);
      if (d > far) continue;
      (Math.abs(e.x) <= LN.midHalfWidthM ? mid : side).push({ e, d });
    }
    mid.sort((a, b) => a.d - b.d);
    side.sort((a, b) => a.d - b.d);
    return mid.concat(side).slice(0, n).map((o) => o.e);
  }

  /** Goc ngang (radian, so voi truc chay) ung voi mot diem cham tren man hinh.
   *  Suy tu hinh hoc camera, khong hardcode: ndc ngang -> tang goc -> goc yaw. */
  tapAngle(sx) {
    const cam = this.world.camera;
    const w = this.vw || window.innerWidth || 1;
    const ndc = (sx / w) * 2 - 1;
    return Math.atan(ndc * Math.tan((cam.fov * Math.PI) / 360) * cam.aspect);
  }

  /** TAP -> BAN DUNG CHO CHAM (docs/04 muc 2b).
   *  Lay con nam duoi ngon trong non tro giup `aimCone`. Khong co con nao thi tra ve
   *  null va vien dan van bay ra huong do -- tap la phat ban CO NHAM, tra gia bang
   *  viec ban truot duoc. Doi lai: chi tap moi cham dung YEU DIEM (bung Ogre). */
  pickAimed(sx, sy) {
    const w = this.vw || window.innerWidth || 1;
    const h = this.vh || window.innerHeight || 1;
    const hit = this.pool.pickByScreen(this.world.camera, sx, sy, w, h, this.mods.aimCone);
    if (!hit) return null;
    const zGap = this.playerZ - hit.e.z;
    if (zGap <= 0.1) return null;                                  // da bi chay qua
    if (Math.hypot(hit.e.x, zGap) > GD.feel.run.tapFarM) return null;
    return hit;
  }

  /** HOLD -> TU NHAM: con gan nhat o LAN GIUA, khong can tap trung nguoi no.
      Lan giua trong thi lay con gan nhat bat ky -- quai lan ben van giet duoc lay vang,
      dung nhu "giet la vang them" o docs/09 muc 2c.
      KHONG BAO GIO an yeu diem: yeu diem la phan thuong cua viec NHAM, ma tu nham thi
      nguoi choi co nham gi dau. Muon x2 vao bung Ogre thi phai tap dung cho. */
  pickAuto() {
    const LN = GD.feel.lanes;
    let bestMid = null, bestMidD = Infinity, bestAny = null, bestAnyD = Infinity;
    for (const e of this.pool.list) {
      if (!e.alive) continue;
      const zGap = this.playerZ - e.z;
      if (zGap <= 0.1) continue;                       // da bi chay qua
      const d = Math.hypot(e.x, zGap);
      if (d > GD.feel.run.tapFarM) continue;
      if (d < bestAnyD) { bestAnyD = d; bestAny = e; }
      if (Math.abs(e.x) <= LN.midHalfWidthM && d < bestMidD) { bestMidD = d; bestMid = e; }
    }
    const e = bestMid || bestAny;
    return e ? { e, weakPoint: false } : null;
  }

  shootAt(sx, sy, single) {
    if (!this.running || this.advancing) return;
    /* Con dan -> tap HUY reload va ban tiep. Het sach dan -> KHONG huy duoc. */
    if (this.reloading) {
      if (this.mag > 0) this.cancelReload();
      else return;
    }
    if (this.mag <= 0) { this.startReload(); return; }
    /* CHUA LEN DAN XONG. Truoc day day la `return` cam lang: nguoi choi cam shotgun cham
       lien tuc, khong ra vien nao, khong tieng nao, khong gi nhuc nhich -- doc ra nhu
       sung hong hoac may nuot input. Gio no tra ve mot tieng CO KHAN. */
    // epsilon: fireInterval 0.1s tru 6 frame x 1/60 ra mot so duong ti hon, du de nuot
    // mot nhip ban -- rifle 600 rpm mat 1 phat moi giay chi vi sai so dau phay dong.
    if (this.fireCd > 1e-6) { if (single) this._dryClick(); return; }

    const rw = this.rw;
    /* CONG DON thay vi gan cung: giu lai phan am cua fireCd (da qua han bao nhieu).
       Gan cung `= fireInterval` thi moi phat bi lam tron len boi frame — SMG nhip
       0.0857s (5.14 frame) chi ban duoc moi 6 frame, tuc 10 phat/giay thay vi 12.
       Ca mo hinh vu khi dung rpm THAT nen nhip do duoc phai khop voi rpm trong data.
       Chan phan bu o nua nhip de sau mot khoang nghi dai khong ban don mot luc. */
    this.fireCd = this.fireInterval +
      Math.max(-this.fireInterval * 0.5, Math.min(0, this.fireCd));
    this.mag--;
    this.gun.flash();
    /* LEN DAN: animation chay dung bang khoang cach that giua 2 phat, khong phai mot con
       so rieng. Chi voi sung cham -- rifle 0.1s thi cai thoi rung 10 lan/giay, thanh
       nhieu chu khong thanh thong tin. */
    if (this.fireInterval >= (GD.feel.gun.rackMinIntervalSec ?? 0.35)) this.gun.rack(this.fireInterval);
    this.audio.shot(rw.pellets > 1);
    const fk = GD.feel.shake.find((s) => s.event.includes('súng lục')) || { amplitudePx: 3 };
    this.juice.addShake(rw.pellets > 1 ? 14 : fk.amplitudePx, 0, 1);

    /* HAI CHE DO NGAM (docs/04 muc 2b):
         TAP  -> ban DUNG CHO CHAM. Chon con nam duoi ngon (non tro giup `aimCone`),
                 va vi biet chinh xac cham vao dau nen an duoc YEU DIEM.
         HOLD -> TU NHAM con gan nhat o lan giua. Tien, nhung khong duoc chon muc tieu
                 va KHONG bao gio an yeu diem.
       Do la doi lay: tap = chinh xac va co quyen chon; hold = nhieu dan va khong phai nghi. */
    const picked = single ? this.pickAimed(sx, sy) : this.pickAuto();
    // Huong ban: tap thi theo diem cham THAT (ke ca khi khong co con nao o do),
    // hold thi theo con da tu nham.
    const aimAng = single
      ? this.tapAngle(sx)
      : (picked ? Math.atan2(picked.e.x, this.playerZ - picked.e.z) : 0);
    if (single) this.ui.tapMark(sx, sy, !!picked);

    if (!picked && hitCfgOf(rw).style !== 'spread') {
      // BAN TRUOT: van cho vien dan bay ra huong da nham, khong im lang nuot mat phat ban
      const m0 = this.muzzle();
      const d0 = GD.feel.run.tapFarM;
      this.proj.fire(m0.x, m0.y, m0.z, Math.sin(aimAng) * d0, 0.7,
        this.playerZ - Math.cos(aimAng) * d0, hitCfgOf(rw).proj);
      this.chain = 0;
      if (this.mag <= 0) this.startReload();
      return;
    }
    const target = picked ? picked.e : null;

    /* MOT PHAT DAN CHAM VAO DAM QUAI THEO DAC DIEM TUNG LOAI SUNG (docs/04 muc 5c).
       Truoc day moi sung deu dung `dmg * pellets` DON HET vao mot con -- nen shotgun
       4 vien ghem chi giet duoc 1 quai, khong khac gi khau rifle. Xem docs/18 loi #33. */
    const hitCfg = hitCfgOf(rw);
    const crit = Math.random() < this.mods.crit;
    let unit = rw.dmg * this.mods.rangedDmg * this.dmgBuff * this.chainMult;
    if (this.perfectMag) unit *= 1.15;
    if (this.buffNextShot > 0) { unit *= 1.6; this.buffNextShot = 0; }
    if (crit) unit *= this.mods.critMult;

    const pellets = Math.max(1, rw.pellets || 1);
    const look = hitCfg.proj;
    const mz = this.muzzle();
    let victims = [];          // { e, mult }
    if (hitCfg.style === 'spread') {
      /* Moi vien ghem la mot TIA di tu gan ra xa, dung o con dau tien no cham, va chi
         XUYEN TIEP khi no giet duoc con do. spreadTargets() lo phan mo phong; o day chi
         con ve vien dan va quy doi ra danh sach nan nhan. */
      const { dmgOut, firstHit } = this.spreadTargets(pellets, rw.spreadDeg || 10, hitCfg, aimAng, unit);
      const half = ((rw.spreadDeg || 10) * Math.PI) / 180 / 2;
      for (const e of firstHit) {
        if (e) {
          this.proj.fire(mz.x, mz.y, mz.z, e.x, 0.62 * e.scale, e.z, look);
        } else {
          // vien truot: van bay ra cho nguoi choi thay do tan
          const a = aimAng + (Math.random() * 2 - 1) * half;
          const d = 9 + Math.random() * 5;
          this.proj.fire(mz.x, mz.y, mz.z, Math.sin(a) * d, 0.5, this.playerZ - Math.cos(a) * d, look);
        }
      }
      // dmgOut da tinh ca falloff va he so xuyen -> quy ve `mult` cua mot vien don vi
      victims = [...dmgOut].map(([e, dmg]) => ({ e, mult: unit > 0 ? dmg / unit : 0 }));
    } else if (hitCfg.style === 'pierce') {
      // xuyen qua: con dau + n con phia sau no tren cung truc chay
      const extra = [];
      for (const e of this.pool.list) {
        if (!e.alive || e === target) continue;
        if (e.z >= target.z) continue;                        // phai o SAU muc tieu
        if (Math.abs(e.x - target.x) > 1.1) continue;         // cung mot truc
        extra.push({ e, d: target.z - e.z });
      }
      extra.sort((a, b) => a.d - b.d);
      victims = [{ e: target, mult: pellets }]
        .concat(extra.slice(0, hitCfg.pierce || 0).map((o) => ({ e: o.e, mult: pellets })));
    } else if (hitCfg.style === 'aoe') {
      const r = hitCfg.aoeRadiusM || 2.0;
      victims = this.pool.list
        .filter((e) => e.alive && Math.hypot(e.x - target.x, e.z - target.z) <= r)
        .map((e) => ({ e, mult: pellets }));
      if (!victims.length) victims = [{ e: target, mult: pellets }];
      this.juice.addRing(target.x, target.z, r, 0.22, false);
    } else {
      victims = [{ e: target, mult: pellets }];
    }

    if (hitCfg.style !== "spread") {
      // mot vien duy nhat bay toi muc tieu chinh; kieu pierce/aoe dung chung vien do
      const t0 = victims[0] && victims[0].e;
      if (t0) this.proj.fire(mz.x, mz.y, mz.z, t0.x, 0.62 * t0.scale, t0.z, look);
    }

    for (const v of victims) {
      const dx = v.e.x - 0, dz = v.e.z - this.playerZ;
      const len = Math.hypot(dx, dz) || 1;
      this.hitEnemy(v.e, Math.round(unit * v.mult), {
        kx: dx / len, kz: dz / len, kbForce: rw.knockback * this.mods.kb,
        source: 'ranged', archetype: rw.archetype, heavy: false,
        weakPoint: v.e === target && !!picked?.weakPoint, crit,
      });
    }

    this.chain++;
    if (this.mods.twoBlades) this.buffNextSlash = 1;
    if (this.mag <= 0) this.startReload();
  }

  /* ============================= CHEM ============================== */
  slash(s) {
    if (!this.running || this.advancing) return;
    const mw = this.mw;
    const heavy = s.heavy;
    const lowPen = !this.mods.noLowPenalty && this.stam < this.stamMax * this.const.staminaLow;
    if (this.swingCd > 0) return;

    let cost = mw.staminaCost * this.mods.staminaCostMult * (heavy ? 2 : 1);
    if (this.stam < cost * 0.5) { this.ui.flashStamina(); return; }
    this.stam = Math.max(0, this.stam - cost);
    this.staminaIdle = 0;
    this.swingCd = mw.swingTime * (heavy ? 1.35 : 1) * (lowPen ? 2 : 1);
    this.audio.slash(heavy);
    this.ui.showStamina();

    // vector quet tren man hinh -> huong trong the gioi (camera.right / camera.forward)
    const nx = s.dx / (Math.hypot(s.dx, s.dy) || 1);
    const ny = -s.dy / (Math.hypot(s.dx, s.dy) || 1);
    const dirX = nx * 0.92 + 0;
    const dirZ = -(0.42 + Math.abs(ny) * 0.32);          // luon huong ra truoc mat
    const reach = mw.reachM + this.mods.reachAdd;
    const arc = Math.min(200, mw.arcDeg + this.mods.arcAdd + (heavy ? 30 : 0));
    const maxT = mw.targets + (heavy ? 2 : 0);

    const hits = this._blade(s, reach, arc, maxT);
    const sh = GD.feel.shake.find((x) => x.event === (heavy ? 'Chém nặng' : 'Chém nhẹ')) || { amplitudePx: 6 };
    this.juice.addShake(sh.amplitudePx, nx, ny);
    // CHEM TRUOT thi khong dong bang: dung han man hinh de thong bao "ban vua truot"
    // la lay thu dat nhat trong game (mot frame song) de tra cho thu re nhat.
    if (hits.length) this.juice.addHitstop(heavy ? 5 : 3);

    if (!hits.length) { this.combo = 0; this.comboT = 0; return; }

    let dmg = mw.dmg * this.mods.meleeDmg * this.dmgBuff * (heavy ? 2 : 1);
    if (this.buffNextSlash > 0) { dmg *= 1.6; this.buffNextSlash = 0; }
    dmg = Math.round(dmg);

    let killed = 0;
    for (const e of hits) {
      const crit = Math.random() < this.mods.crit;
      const d = crit ? Math.round(dmg * this.mods.critMult) : dmg;
      // xac VANG THEO CHIEU SLIDE (docs) — dung chinh vector quet
      const ok = this.hitEnemy(e, d, {
        kx: nx, kz: dirZ * 0.6 + (ny < 0 ? 0.25 : -0.25),
        kbForce: mw.knockback * this.mods.kb * (heavy ? 2.2 : 1),
        source: 'melee', archetype: mw.archetype, heavy, weakPoint: false, crit,
      });
      if (ok) killed++;
    }
    this.audio.hitFlesh();

    // combo: moi nhat TRUNG len 1 bac (docs/05 muc 4)
    this.combo = Math.min(5, this.combo + 1);
    this.comboT = 1.2;
    this.ui.combo(this.combo);

    // CHEM HOAN HAO: trung >= perfectNeed con
    if (hits.length >= this.mods.perfectNeed) {
      this.perfectSlashes++;
      this.stam = Math.min(this.stamMax, this.stam + 12);
      this.combo = Math.min(5, this.combo + 1);
      this.scavengeKills(killed);                           // tinh x2
      this.juice.addSlowmo(0.12, 0.35);
      this.juice.addShake(20, nx, ny);
      this.audio.duck(0.6, 0.12);
      this.audio.perfect();
      this.ui.banner('CHÉM HOÀN HẢO', '+stamina +đạn');
      if (this.perfectSlashes % 10 === 0) this.addLuck(1, 'Chém Hoàn Hảo x10');
    }

    this.scavengeKills(killed);
    if (this.mods.twoBlades) this.buffNextShot = 1;
  }

  /* CUOP DAN — do bang GIAY BAN, khong bang "mot bang dan".
     "Mot bang" khong phai mot don vi co dinh: the Bang Dan cong toi +95% `magMax`, nen
     cung 16 mang chem ma cuoi run doi duoc gan gap doi dan so voi dau run. The do AN HAI
     LAN -- vua cho bang to hon, vua nhan so dan cuop duoc (docs/18 loi #55).
     Neo vao GIAY BAN thi khong the nao cham toi: no suy tu `rw.rpm` GOC, ma rpm goc
     khong co the nao nang cap duoc (`rofMult` chi doi `fireInterval`, khong doi rw.rpm).
     He qua: toc do hoi dan PHANG tu dau den cuoi run, va giong nhau giua moi khau.
     Cong don theo SO LE roi tra tung vien -> thanh dan nhich len deu trong luc chem,
     thay vi nhay mot cuc moi 16 mang. */
  scavengeKills(killed) {
    if (killed <= 0 || this.reserve >= this.reserveMax) return;
    this.scavenge += killed * this.scavPerKill * (this.mods.scavengeMult || 1);
    const whole = Math.floor(this.scavenge);
    if (whole <= 0) return;
    this.scavenge -= whole;
    const before = this.reserve;
    this.reserve = Math.min(this.reserveMax, this.reserve + whole);
    // moc bao: cu du MOT BANG GOC thi keu mot tieng, de nhip thuong van con
    this.scavBanner += this.reserve - before;
    if (this.scavBanner >= this.rw.mag) {
      this.scavBanner = 0;
      this.ui.banner('CƯỚP ĐẠN', `+${this.rw.mag} viên`);
    }
  }

  /** @param {object} o {kx,kz,kbForce,source,archetype,heavy,weakPoint,crit}
   *  @returns {boolean} co giet duoc khong */
  hitEnemy(e, dmg, o) {
    const scale = e.scale;
    const res = this.pool.damage(e, dmg, { ...o, px: 0, pz: this.playerZ });
    if (!res) return false;

    // so damage doi mau theo ket qua: khien chan (xam nho) / yeu diem (cam to)
    const style = res.blocked ? 'blocked' : res.weak ? 'weak' : o.crit ? 'crit' : 'normal';
    this.juice.addNumber(e.x, 1.05 * scale, e.z, String(res.dmgDealt), style);
    if (o.source === 'ranged') this.juice.addHitstop(o.crit || res.weak ? 4 : res.blocked ? 1 : 2);

    if (res.blocked && !this.blockHintShown) {
      this.blockHintShown = true;
      this.ui.banner('KHIÊN CHẶN', 'chờ nó hở khiên · búa · chém nặng · vòng ra sau');
    }
    if (res.weak) this.audio.perfect();
    if (res.flanked && !this.flankHintShown) {
      this.flankHintShown = true;
      this.ui.banner('SAU LƯNG', 'khiên không cứu nó được');
    }
    if (!res.killed) return false;

    this.kills++;
    const kx = o.kx, kz = o.kz;
    const D = this.director.depth;
    const def = GD.byId[e.id];
    const tagMult = this.director.doorTag?.goldMult || 1;
    // Tong vang cua 1 mang = DUNG cong thuc docs/16 muc 4.5. So dong xu chi la HINH ANH
    // ("bung ra nhieu vang" trong docs goc) -- moi dong = total/coins, cong don dang float.
    const total = goldPerKill(def, D, tagMult) * this.mods.gold;
    const coins = Math.max(3, Math.min(14, Math.round(3 + def.goldDrop * 0.6)));

    res.lx *= this.mods.corpseLaunch;
    res.lz *= this.mods.corpseLaunch;
    this.juice.addCorpse(res);

    // Cot vang: chance = 0.04 + 0.004*Loc, mo tu Depth 3 (docs/16 muc 4.6)
    const gp = GD.feel.gold;
    if (D >= gp.goldPillarMinDepth && Math.random() < gp.goldPillarChance + gp.goldPillarChancePerLuck * this.luck) {
      this.juice.goldPillar(res.x, res.z, total * 25);
    } else {
      this.juice.burstGold(res.x, res.z, coins, total / coins, kx, kz);
    }

    if (this.mods.collapse) {
      const aoe = Math.round(e.maxHp * 0.15);
      for (const n of this.pool.queryArc(res.x, res.z, 0, -1, 3.2, 360, 8)) {
        this.pool.damage(n, aoe, { kx: 0, kz: -1, kbForce: 0.4, source: o.source, px: 0, pz: this.playerZ });
      }
    }
    if (def.role === 'elite') this.addLuck(2, 'Elite');
    return true;
  }

  addLuck(n, why) {
    const cap = 20;
    const before = this.luck;
    this.luck = Math.min(cap, this.luck + n);
    if (this.luck !== before) this.ui.luckBump(this.luck, why);
  }

  /* ============================ RELOAD ============================ */

  /* ================= SUNG: rut ra / cat di / huy reload =================
     Luat (yeu cau nguoi choi):
       tap hoac hold  -> RUT sung ra ban; giu tiep thi ban lien tuc
       nha tay        -> CAT sung di roi RELOAD
       con dan        -> tap tiep HUY reload va ban ngay
       het sach dan   -> KHONG huy duoc, phai doi reload xong
     gunHoldSec: sung o ngoai them mot nhip sau phat cuoi, neu khong thi mot cai tap
     chi thay sung nhap nhay 0.1s -- doc khong ra trang thai. */


  /** Luoi dao = DOAN NGON TAY tren man hinh (docs/05 muc 7c).
      `arcAdd` cua the nang cap van co tac dung: no lam luoi day them. */
  _blade(s, reach, arc, maxT) {
    const M = GD.feel.melee;
    const w = this.vw || window.innerWidth || 1, h = this.vh || window.innerHeight || 1;
    const widthPx = w * M.bladeWidthFrac * (1 + (this.mods.arcAdd || 0) / 110);
    const from = s.from || { x: 0, y: h * 0.5 };
    const to = s.to || { x: w, y: h * 0.5 };
    this.trail?.push(from.x, from.y, to.x, to.y);
    return this.pool.queryBlade(this.world.camera,
      { x0: from.x, y0: from.y, x1: to.x, y1: to.y, px: 0, pz: this.playerZ },
      reach, widthPx, maxT, w, h);
  }

  /** @returns {boolean} co ban duoc khong */
  gunUp() {
    if (!this.running) return false;
    if (this.reloading) {
      if (this.mag > 0) this.cancelReload();      // con dan -> huy reload, ban tiep
      else {
        /* Het sach dan: khong huy reload duoc, nhung cai cham do KHONG bi vut di --
           no thanh cu NAP HOAN HAO. Truoc day muon nap hoan hao phai bam trung nut
           o goc duoi ben phai, tuc phai roi mat khoi dam quai dung luc dong nhat. */
        this.tryPerfectReload();
        return false;
      }
    }
    this.slicing = false;
    this.gunWanted = true;
    this.gunTimer = GD.feel.gun.gunHoldSec;
    this.gun.setOut(true);
    return true;
  }

  /** Nha tay: bat dau dem nguoc roi cat sung + reload. */
  gunRelease() { this.gunWanted = false; }

  /** Cham nhung sung chua len dan xong. Khong phat gi ca, chi TRA LOI: mot tieng co khan
      + nhay vong nhip ban quanh tam ngam. Co cooldown rieng vi nguoi choi hoang loan se
      cham 5 lan mot giay, ma 5 tieng co chong len nhau thi thanh tieng ken ket. */
  _dryClick() {
    if (this.fireInterval < (GD.feel.gun.rackMinIntervalSec ?? 0.35)) return;
    if ((this.dryClickCd || 0) > 0) return;
    this.dryClickCd = GD.feel.gun.dryClickCooldownSec ?? 0.28;
    this.audio.reloadClick(false);
    this.ui.pulseCooldown();
  }

  /* CHUYEN SANG CHEM GIUA CHUNG (yeu cau nguoi choi):
       - nhat chem ra NGAY, khong doi gi ca
       - sung cat di NGAY va animation len dan bi bo -> khong con hai thu tranh man hinh
       - nhung fireCd VAN CHAY: delay giua 2 phat la delay THAT cua khau sung, khong phai
         do animation quyet dinh. Rut dao ra khong lam sung len dan nhanh hon. */
  gunAway() {
    this.gunWanted = false;
    this.gunTimer = 0;
    this.gun.cancelRack();
    this._holsterAndReload();
  }

  _holsterAndReload() {
    this.gun.setOut(false);
    this.startReload();
  }

  cancelReload() {
    if (!this.reloading) return;
    this.reloading = false;
    this.reloadT = 0;
    this.reloadTapped = false;
    this.ui.reloadEnd();
    this.audio.reloadClick(false);
  }

  /* ================= CHEM LIEN TUC (kieu chem hoa qua) =================
     Nhat DAU TIEN di qua slash() nguyen gia. Cac doan quet tiep theo goi vao day:
     dmg thap hon (slideTickDamageMult) va MOI CON chi an duoc mot lan moi
     slideHitCooldownSec -- neu khong thi rung ngon tay tai cho la dmg vo han. */
  sliceTick(s) {
    if (!this.running || !this.slicing) return;
    const M = GD.feel.melee;
    const mw = this.mw;
    if (this.stam <= 0) { this.ui.flashStamina(); return; }

    const nx = s.dx / (Math.hypot(s.dx, s.dy) || 1);
    const ny = -s.dy / (Math.hypot(s.dx, s.dy) || 1);
    const dirX = nx * 0.92;
    const dirZ = -(0.42 + Math.abs(ny) * 0.32);
    const reach = mw.reachM + this.mods.reachAdd;
    const arc = Math.min(200, mw.arcDeg + this.mods.arcAdd);
    const maxT = mw.targets;

    const hits = this._blade(s, reach, arc, maxT).filter((e) => (e.sliceCd || 0) <= 0);
    this.juice.addShake(4, nx, ny);
    if (!hits.length) return;

    let dmg = Math.round(mw.dmg * this.mods.meleeDmg * this.dmgBuff * M.slideTickDamageMult);
    let killed = 0;
    for (const e of hits) {
      e.sliceCd = M.slideHitCooldownSec;
      const crit = Math.random() < this.mods.crit;
      const d = crit ? Math.round(dmg * this.mods.critMult) : dmg;
      if (this.hitEnemy(e, d, {
        kx: nx, kz: dirZ * 0.6 + (ny < 0 ? 0.25 : -0.25),
        // nhat slide yeu hon nhat dau (slideKbMult); tran that su nam o ngan sach day trong enemies._push
        kbForce: mw.knockback * this.mods.kb * M.slideKbMult,
        source: 'melee', archetype: mw.archetype, heavy: false, weakPoint: false, crit,
      })) killed++;
    }
    // Nhat slide chi dong bang khi CO MANG. Moi doan re tay la mot tick, ma dong bang
    // moi tick thi ca man hinh giat lien tuc suot cu quet -- do la cai "giat" do duoc.
    if (killed) this.juice.addHitstop(2);
    this.audio.hitFlesh();
    if (killed) { this.combo = Math.min(5, this.combo + 1); this.comboT = 1.2; this.ui.combo(this.combo); }
  }
  /* NAP DAN. Hai kieu, doc tu archetypeSpec[archetype].reloadStyle:
       "mag"   (mac dinh) — thay ca bang, xong het mot lan.
       "shell" (shotgun)  — NAP TUNG VIEN. Moi vien mat reloadTime/magMax giay; nap
                 xong mot vien la co ngay mot vien de ban. Nap day ca bang van ton
                 dung reloadTime -- khong nhanh hon -- nhung nguoi choi duoc quyen
                 CAT NGANG bat cu luc nao: con 1 vien trong o ma dam quai toi sat thi
                 ban luon, khong phai dung im cho het bang. Do la ca tinh cua shotgun.
     @param {boolean} continuing true = vien tiep theo cua chuoi nap tung vien */
  startReload(continuing = false) {
    if (this.reloading || this.mag >= this.magMax || this.reserve <= 0) return;
    this.reloading = true;
    const full = this.rw.reloadTime * this.mods.reloadMult;
    this.reloadDur = this.shellReload ? full / Math.max(1, this.magMax) : full;
    this.reloadT = 0;
    this.reloadTapped = false;
    // Nap Hoan Hao tinh lai tu dau moi lan nap MOI (khong phai moi vien ghem)
    if (!continuing) this.perfectMag = false;
    const start = 0.45 + Math.random() * 0.35;
    this.reloadWin = [start, Math.min(0.97, start + 0.25 / this.reloadDur)];
    this.ui.reloadStart(this.reloadWin);
  }
  tryPerfectReload() {
    if (!this.reloading || this.reloadTapped) return;
    const p = this.reloadT / this.reloadDur;
    /* 20% dau bang dan chua ra khoi sung -- cham trong khoang do la cai cham cuoi cua
       loat ban vua roi, khong phai y dinh nap. Vi cham o dau la bam BAT KY DAU tren
       man hinh nen phai bo qua, neu khong moi lan het dan la an phat +30% thoi gian. */
    if (p < 0.2) return;
    this.reloadTapped = true;
    const ok = p >= this.reloadWin[0] && p <= this.reloadWin[1];
    this.audio.reloadClick(ok);
    if (ok) { this.reloadDur *= 0.55; this.perfectMag = true; this.ui.banner('NẠP HOÀN HẢO', '+15% damage'); }
    else { this.reloadDur *= 1.3; this.juice.addShake(8, 0, 1); }
    this.reloadStats = this.reloadStats || { ok: 0, total: 0 };
    this.reloadStats.total++; if (ok) this.reloadStats.ok++;
  }
  _finishReload() {
    if (this.shellReload) {
      this.mag += 1;
      this.reserve -= 1;
      this.reloading = false;
      this.ui.reloadEnd();
      this.audio.reloadClick(true);                 // tieng "cach" moi vien vao o
      // con cho va con dan du tru -> nap tiep vien nua; nguoi choi cham la cat ngang
      if (this.mag < this.magMax && this.reserve > 0) this.startReload(true);
      return;
    }
    const need = this.magMax - this.mag;
    const take = Math.min(need, this.reserve);
    this.mag += take;
    this.reserve -= take;
    this.reloading = false;
    this.ui.reloadEnd();
  }

  /* ============================= NE ============================== */
  /* KHONG con gesture nao goi ham nay: quet doc len/xuong da bi bo (docs/03 muc 2c).
     Giu lai vi the nang cap va boss co the con dung toi. */
  dodge(dir) {
    if (this.advancing) return;
    const c = GD.ctrl;
    if (dir === 'back') {
      if (this.dodgeCd > 0) return;
      this.dodgeCd = c.dodgeCooldown * this.mods.dodgeCdMult;
      this.iframe = 0.15;
      // Buoc Lui lay tu data: hop dong voi aoeRadius cua Ogre (docs/09 muc 2b).
      // Chay tien 2.4 m/s x telegraph 0.6s = 1.44m bi an mat, nen 1.2m KHONG con ne duoc.
      this.playerZ += GD.feel.run.dodgeBackM;
      this.juice.addShake(6, 0, -1);
    } else {
      if (this.dashCd > 0) return;
      this.dashCd = c.dashCooldown * this.mods.dodgeCdMult;
      this.playerZ -= 2.0;
      // xoc toi day vang quai tren duong
      for (const e of this.pool.queryArc(0, this.playerZ, 0, -1, 2.2, 120, 6)) {
        e.vz -= 5; e.vx += (e.x - 0) * 1.5;
      }
      this.juice.addShake(9, 0, 1);
    }
  }

  /* ============================ UPDATE ============================ */
  step(dtRaw) {
    if (!this.running) return;
    const raw = Math.min(0.05, dtRaw);
    const dt = this.juice.timeScale(raw);

    /* DONG HO CUA NGUOI CHOI CHAY THEO THOI GIAN THUC KHI DANG HITSTOP.
       Hitstop lam dt = 0, va truoc day MOI dong ho deu nam trong `if (dt > 0)` --
       ke ca nhip ban, thoi gian nap va cooldown ne. He qua nguoc doi: cang trung
       nhieu quai thi cang nhieu hitstop, cang nhieu hitstop thi sung cang BAN CHAM.
       Do duoc: rifle nhip ly thuyet 10 phat/giay chi ra 7-8 phat, va con so do bam
       theo ti le dong bang tung giay -- nguoi choi doc ra la "may giay dau ban cham
       hon luc sau" (docs/18 loi #59).
       Hitstop la hieu ung TRINH DIEN, no khong duoc phep danh thue len nhip ban.
       Slow-mo thi KHAC: do la mot nhip kich duoc thiet ke, cham lai la co y -- nen
       no van scale binh thuong. */
    const dtCd = this.juice.frozen ? raw : dt;
    this.fireCd = Math.max(0, this.fireCd - dtCd);
    this.swingCd = Math.max(0, this.swingCd - dtCd);
    this.dodgeCd = Math.max(0, this.dodgeCd - dtCd);
    this.dryClickCd = Math.max(0, (this.dryClickCd || 0) - dtCd);
    this.dashCd = Math.max(0, this.dashCd - dtCd);
    this.iframe = Math.max(0, this.iframe - dtCd);
    if (this.reloading) {
      this.reloadT += dtCd;
      this.ui.reloadProgress(this.reloadT / this.reloadDur);
      if (this.reloadT >= this.reloadDur) this._finishReload();
    }

    if (dt > 0) {
      // stamina hoi sau 0.6s
      this.staminaIdle += dt;
      if (this.staminaIdle > this.const.staminaRegenDelay) {
        this.stam = Math.min(this.stamMax, this.stam + (this.const.staminaRegen + this.mods.staminaRegenAdd) * dt);
      }
      if (this.comboT > 0) { this.comboT -= dt; if (this.comboT <= 0) { this.combo = 0; this.ui.combo(0); } }

      // giu de ban lien tuc
      if (this.holdPt && !this.reloading && this.mag > 0) this.shootAt(this.holdPt.x, this.holdPt.y, false);


      /* CHAY LIEN TUC ve phia truoc (mo hinh Into the Dead).
         Quai KHONG chan duong: con nao toi duoc thi gay dmg roi bi don sang ben ra sau.
         Phong ket thuc khi da chay het run.roomDistanceM, khong phai khi diet het quai. */
      if (this.director.isCombatRoom && this.director.phase !== 'cleared') {
        this.playerZ -= GD.feel.run.speedMps * dt;
        this.bobT += dt * 9;
        this.bob = Math.sin(this.bobT) * 0.045;
      } else {
        this.bob *= 0.9;
      }

      /* ---- SUNG: rut ra / cat di ----
         Con giu tay (hoac vua ban) -> sung o ngoai. Het gunHoldSec ma khong co input
         -> cat sung roi RELOAD. Day la vong "ban -> cat -> nap" ma nguoi choi yeu cau. */
      if (this.gunWanted || this.holdPt) {
        this.gunTimer = GD.feel.gun.gunHoldSec;
        this.gun.setOut(true);
      } else if (this.gunTimer > 0) {
        this.gunTimer -= dt;
        if (this.gunTimer <= 0) this._holsterAndReload();
      }
      this.gun.update(dt);

      /* ---- CHEM LIEN TUC: giu ngon tay thi drain stamina ---- */
      if (this.slicing) {
        this.stam = Math.max(0, this.stam - GD.feel.melee.slideStaminaPerSec * dt);
        this.staminaIdle = 0;
        this.ui.showStamina();
        if (this.stam <= 0) this.ui.flashStamina();
      }

      // quai + hieu ung hanh vi rieng (vong canh bao AoE, tieng ho khien)
      const dmgIn = this.pool.update(dt, 0, this.playerZ, {
        onTelegraph: (e) => {
          this.juice.addRing(e.x, e.z, e.behav.aoeRadiusM, e.behav.telegraphSec, true);
          this.audio.reloadClick(false);
        },
        onSlam: (e, hit) => {
          this.juice.addRing(e.x, e.z, e.behav.aoeRadiusM, 0.3, false);
          this.juice.addShake(hit ? 26 : 14, 0, 1);
          this.juice.addHitstop(hit ? 8 : 3);
          this.audio.shot(true);
          if (!hit && !this.dodgeHintShown) {
            this.dodgeHintShown = true;
            this.ui.banner('NÉ ĐƯỢC', 'quẹt dọc xuống để ra khỏi vòng');
          }
        },
        onShieldOpen: (e) => this.audio.reloadClick(true),
        // quai va vao nguoi choi roi bien mat: rung nhe + xac bay nguoc lai
        onContact: (e) => {
          this.juice.addShake(13, e.x > 0 ? 7 : -7, 0.6);
          this.juice.addHitstop(3);
          this.juice.addCorpse({ x: e.x, z: e.z, scale: e.scale, color: e.color,
            lx: e.x > 0 ? 3.2 : -3.2, lz: 2.6 });
          this.audio.shot(false);
        },
      });
      /* TRAN DPS O DAI CAN CHIEN (docs/16 muc 5):
         <= min(0.55, 0.28 + 0.0045*(R-1)) * hpBase moi giay.
         Khong co tran nay thi 18 con x 6 dmg / 1.15s = ~94 HP/s -> chet trong 1 giay
         va nguoi choi khong hieu vi sao. Token bucket: burst toi da nua tran. */
      const cap = meleeBandDpsCap(this.director.R, this.hpMax);
      this.dmgBudget = Math.min(cap * 0.5, (this.dmgBudget ?? cap * 0.5) + cap * dt);
      if (dmgIn > 0 && this.iframe <= 0) {
        const applied = Math.min(dmgIn, this.dmgBudget);
        this.dmgBudget -= applied;
        if (applied > 0) this.takeDamage(applied);
      }

      // director
      const ev = this.director.update(dt, 0, this.playerZ, () => {});
      if (ev?.cleared) this._roomCleared();
      if (ev?.newWave) this.ui.banner(`WAVE ${ev.newWave.wave}/${ev.newWave.of}`, `${ev.newWave.name} · ~${ev.newWave.count} con`);

      // juice
      if (this.roomClearSweep > 0) this.roomClearSweep -= dt;
      const magnetR = GD.feel.gold.magnetRadiusM * this.mods.magnetMult *
        (this.combo >= 5 ? GD.feel.gold.magnetRadiusComboMult : 1) *
        (this.roomClearSweep > 0 ? GD.feel.gold.magnetRadiusRoomClearMult * 4 : 1);
      this.juice.update(dt, 0, this.playerZ, magnetR, (v) => { this.gold += v; this.ui.goldBump(Math.floor(this.gold)); });

      this.world.setDark(this.director.doorTag?.tag === 'tối');
      this.ui.mist(this.director.mistOn ? Math.max(0.12, this.director.mistLevel) : 0);
    }

    this.world.update(this.playerZ, this.bob, this.juice.shake);
    this.renderer.render(this.world.scene, this.world.camera);
    this.proj.update(dtRaw);
    this.trail.update(dtRaw);
    this.trail.draw();

    this.perf.frames++;
    this.perf.acc += dtRaw;
    if (this.perf.acc >= 0.5) {
      this.perf.fps = Math.round(this.perf.frames / this.perf.acc);
      this.perf.frames = 0; this.perf.acc = 0;
    }
    this.ui.tick(this);
  }

  takeDamage(amount) {
    const d = amount * this.mods.dmgTakenMult;
    this.hp -= d;
    this.roomNoHit = false;
    this.combo = 0;
    if (d > 1.2) {
      this.juice.addShake(12, (Math.random() - 0.5) * 2, -1);
      this.juice.addHitstop(3);
      this.audio.hurt();
      this.ui.hurt();
      if (navigator.vibrate) navigator.vibrate(40);
    }
    if (this.hp <= 0) { this.hp = 0; this.endRun(false); }
  }

  /* ======================= CHUYEN PHONG ======================= */
  _roomCleared() {
    if (this.roomNoHit) this.addLuck(1, 'phòng không mất máu');
    // docs/11: don sach phong -> ban kinh hut vang x3, "tat ca bay ve"
    this.roomClearSweep = 1.4;
    this.juice.addSlowmo(GD.waves.directorRules.roomClearSlowMo.durationSec,
      GD.waves.directorRules.roomClearSlowMo.timescale);
    // hut het vang ve
    setTimeout(() => this.openGate(), 700);
  }

  openGate() {
    if (!this.running) return;
    this.trail.clear();
    const fork = this.director.makeFork({
      hp: this.hp, hpMax: this.hpMax, reserve: this.reserve, reserveMax: this.reserveMax,
    });
    this.ui.openGate(this.rollCards(), fork, this);
  }

  chooseDoor(door) {
    const r = this.director.advance(door);
    if (r.newDepth) this.world.setDepth(r.newDepth);
    this.walked++;
    // Khong con tween 1.7s "di sang phong sau": quang duong DA la gameplay.
    this.pool.clear();
    this.ui.closeGate();
    this._enterRoom();
  }

  _enterRoom() {
    // playerZ chay lien tuc, khong reset -- hanh lang tu tai su dung (world.js)
    this.roomNoHit = true;
    this.director.beginRoom();
    const d = this.director;
    if (!d.isCombatRoom) {
      // phong "yen": ap hieu ung roi mo Cong ngay
      this._applyRestRoom();
      setTimeout(() => this.openGate(), 900);
    } else {
      this.ui.banner(`D${d.depth} · PHÒNG ${d.room}`, d.doorTag ? `cửa [${d.doorTag.tag}]` : '');
    }
  }

  _applyRestRoom() {
    const t = this.director.roomType;
    if (t === 'shop') {
      const heal = Math.round(this.hpMax * 0.3);
      const cost = 180;
      if (this.gold >= cost && this.hp < this.hpMax) { this.gold -= cost; this.hp = Math.min(this.hpMax, this.hp + heal); }
      const ammoCost = 60;
      if (this.gold >= ammoCost) { this.gold -= ammoCost; this.reserve = Math.min(this.reserveMax, this.reserve + this.magMax); }
      this.ui.banner('LÃO BUÔN XÁC', 'tự mua máu + đạn');
    } else if (t === 'shrine') {
      if (this.luck >= 4 && this.gold >= 200) { this.luck -= 4; this.gold -= 200; this.shrineEpic = true; this.ui.banner('MIẾU MỎ', 'đổi 4 Lộc → thẻ epic'); }
      else { this.hp = Math.min(this.hpMax, this.hp + this.hpMax * 0.25); this.ui.banner('MIẾU MỎ', 'hồi 25% HP'); }
    } else if (t === 'treasure') {
      this.addLuck(1, 'hòm');
      this.juice.burstGold(0, this.playerZ - 4, 40, Math.round(20 * Math.pow(1.15, this.director.depth - 1)), 0, 0);
      this.ui.banner('KHO BÁU', 'vàng + 1 Lộc');
    } else {
      this.hp = Math.min(this.hpMax, this.hp + this.hpMax * 0.6);
      this.ui.banner('SUỐI MÁU', 'hồi 60% HP');
    }
  }

  endRun(won) {
    this.running = false;
    this.holdPt = null;
    const secs = (performance.now() - this.startedAt) / 1000;
    this.ui.showEnd({
      won,
      depth: this.director.depth,
      room: this.director.room,
      globalRoom: this.director.R,
      gold: this.gold,
      luck: this.luck,
      kills: this.kills,
      perfects: this.perfectSlashes,
      secs,
      cancelRate: this.input.cancelRate(),
      inputs: this.input.stats,
      reload: this.reloadStats || { ok: 0, total: 0 },
      fps: this.perf.fps,
      alive: this.pool.aliveCount,
    });
  }

  dispose() {
    window.removeEventListener('resize', this._onResize);
    this.input.dispose();
  }
}
