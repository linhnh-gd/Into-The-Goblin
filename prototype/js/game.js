/* game.js — trang thai nguoi choi + combat + vong khoa DAN <-> STAMINA (pillar P2).
   Moi hang so lay tu data/*.json qua balance.js. Xem docs/04, /05, /06, /16. */

import * as THREE from 'three';
import { GD, weapon } from './data.js';
import { goldPerKill, rollRarity, rngFrom, hashSeed, meleeBandDpsCap } from './balance.js';
import { EnemyPool, MELEE_BAND } from './enemies.js';
import { Director } from './director.js';
import { Juice } from './juice.js';
import { World, ROOM_SPACING, HALL_W } from './world.js';
import { InputRouter, GESTURE } from './input.js';

/* Chi dua vao pool nhung the DA CAI DAT hieu ung that trong prototype.
   The chua cai dat khong duoc phat -> tranh "the ma" khong lam gi. */
export const IMPLEMENTED_CARDS = [
  'cd_ranged_bangdoi', 'cd_ranged_taynhanh', 'cd_ranged_notdai', 'cd_melee_luoidai',
  'cd_melee_taynhe', 'cd_melee_luoisac', 'cd_stamina_hoidai', 'cd_ammo_tuisau',
  'cd_kb_vaikhoe', 'cd_gold_tuirach', 'cd_survival_datrau', 'cd_crit_diemyeu',
  'cd_ammo_kecuop', 'cd_melee_hoanhaode', 'cd_kb_songxung', 'cd_stamina_thothau',
  'cd_gold_namtu', 'cd_survival_giapxac', 'cd_luck_ketimloc', 'cd_gold_taitham',
  'cd_epic_hailuoi', 'cd_legend_saptham', 'cd_survival_chandai', 'cd_melee_chemsau',
];

const P = () => ({
  hpBase: 100, staminaMax: 100, staminaRegen: 18, staminaRegenDelay: 0.6,
  staminaLow: 0.5, scavengePerMag: 6, advanceSpeed: 2.4,
});

export class Game {
  constructor(canvas, hudEl, audio, ui) {
    this.audio = audio;
    this.ui = ui;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));

    this.world = new World(this.renderer);
    this.pool = new EnemyPool(this.world.scene);
    this.juice = new Juice(this.world.scene, this.world.camera, hudEl, audio);
    this.director = new Director(this.pool, this.juice, audio);

    this.input = new InputRouter(canvas, {
      onTap: (x, y) => this.shootAt(x, y, true),
      onHoldStart: (x, y) => { this.holdPt = { x, y }; },
      onHoldMove: (x, y) => { this.holdPt = { x, y }; },
      onHoldEnd: () => { this.holdPt = null; },
      onMelee: (s) => this.slash(s),
      onMove: (dir) => this.dodge(dir),
      onCancelled: () => { if (navigator.vibrate) navigator.vibrate(8); },
    });

    this.running = false;
    this.perf = { frames: 0, acc: 0, fps: 60, worst: 0 };
    this._onResize = () => this.resize();
    window.addEventListener('resize', this._onResize);
    this.resize();
  }

  resize() {
    const w = window.innerWidth, h = window.innerHeight;
    this.renderer.setSize(w, h, false);
    this.world.resize(w, h);
  }

  /* =============================== RUN =============================== */
  newRun() {
    const c = P();
    this.const = c;
    const rw = weapon('rw_pistol_kendong');
    const mw = weapon('mw_dagger_daogam');
    this.rw = rw; this.mw = mw;

    this.mods = {
      magMult: 1, reloadMult: 1, reserveMult: 1, meleeDmg: 1, rangedDmg: 1,
      kb: 1, corpseLaunch: 1, gold: 1, hpAdd: 0, hpMult: 1, staminaAdd: 0, staminaRegenAdd: 0,
      staminaCostMult: 1, reachAdd: 0, arcAdd: 0, crit: 0.05, critMult: rw.critMult,
      scavengeNeed: c.scavengePerMag, perfectNeed: 3, magnetMult: 1, dmgTakenMult: 1,
      aimCone: 4, dodgeCdMult: 1, heavyLen: null, noLowPenalty: false,
      dmgPerLuck4: 0, dmgPer1000Gold: 0, twoBlades: false, collapse: false,
    };
    this.cards = [];

    this.hpMax = c.hpBase;
    this.hp = this.hpMax;
    this.stamMax = c.staminaMax;
    this.stam = this.stamMax;
    this.staminaIdle = 0;
    this.mag = rw.mag; this.magMax = rw.mag;
    this.reserveMax = rw.reserveMax; this.reserve = rw.reserveMax;
    this.scavenge = 0;
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
    this.swingCd = 0;

    this.dodgeCd = 0; this.dashCd = 0; this.iframe = 0;
    this.dmgBudget = undefined;
    this.roomClearSweep = 0;
    this.walked = 0;
    this.playerZ = 0;
    this.advancing = null;
    this.bob = 0; this.bobT = 0;

    this.director.reset(1);
    this.pool.clear();
    this.juice.clearWorld();
    this.world.setDepth(1);
    this.world.setDark(false);
    this.startedAt = performance.now();

    this.director.beginRoom();
    this.running = true;
    this.ui.showHud();
    this.ui.banner('PHÒNG 1', 'chạm vào nó');
  }

  /* =============================== THE =============================== */
  rollCards() {
    const rnd = rngFrom(hashSeed('card', this.director.runIndex, this.director.depth, this.director.room));
    const pool = GD.upgrades.cards.filter((c) => IMPLEMENTED_CARDS.includes(c.id) && !this.cards.includes(c.id));
    const out = [];
    for (let i = 0; i < 3 && pool.length; i++) {
      const rar = rollRarity(this.luck, rnd);
      let bucket = pool.filter((c) => c.rarity === rar && !out.includes(c));
      if (!bucket.length) bucket = pool.filter((c) => !out.includes(c));
      out.push(bucket[Math.floor(rnd() * bucket.length)]);
    }
    return out;
  }

  applyCard(card) {
    this.cards.push(card.id);
    const m = this.mods;
    switch (card.id) {
      case 'cd_ranged_bangdoi': m.magMult *= 2; m.reloadMult *= 1.3; break;
      case 'cd_ranged_taynhanh': m.reloadMult *= 0.78; break;
      case 'cd_ranged_notdai': m.aimCone += 2.5; break;
      case 'cd_melee_luoidai': m.reachAdd += 0.8; m.arcAdd += 20; break;
      case 'cd_melee_taynhe': m.staminaCostMult *= 0.8; break;
      case 'cd_melee_luoisac': m.meleeDmg *= 1.18; break;
      case 'cd_stamina_hoidai': m.staminaAdd += 40; m.staminaRegenAdd += 6; break;
      case 'cd_ammo_tuisau': m.reserveMult *= 1.6; break;
      case 'cd_kb_vaikhoe': m.kb *= 1.35; break;
      case 'cd_gold_tuirach': m.gold *= 1.4; m.hpMult *= 0.85; break;
      case 'cd_survival_datrau': m.hpAdd += 50; break;
      case 'cd_crit_diemyeu': m.crit += 0.18; break;
      case 'cd_ammo_kecuop': m.scavengeNeed = 4; break;
      case 'cd_melee_hoanhaode': m.perfectNeed = 2; break;
      case 'cd_kb_songxung': m.kb *= 1.6; m.corpseLaunch *= 2; break;
      case 'cd_stamina_thothau': m.noLowPenalty = true; m.staminaAdd -= 20; break;
      case 'cd_gold_namtu': m.magnetMult *= 3; break;
      case 'cd_survival_giapxac': m.dmgTakenMult *= 0.75; break;
      case 'cd_luck_ketimloc': m.dmgPerLuck4 += 0.06; break;
      case 'cd_gold_taitham': m.dmgPer1000Gold += 0.04; break;
      case 'cd_epic_hailuoi': m.twoBlades = true; break;
      case 'cd_legend_saptham': m.collapse = true; this.director.mistBoost = true; m.gold *= 1.5; break;
      case 'cd_survival_chandai': m.dodgeCdMult *= 0.65; break;
      case 'cd_melee_chemsau': m.heavyLen = 0.35; this.input.P.heavyLen = 0.35; break;
    }
    // ap lai cac tran
    const oldMax = this.hpMax;
    this.hpMax = Math.max(20, Math.round((P().hpBase + m.hpAdd) * m.hpMult));
    this.hp = Math.max(1, Math.min(this.hpMax, this.hp + (this.hpMax - oldMax)));
    this.stamMax = Math.max(30, P().staminaMax + m.staminaAdd);
    this.stam = Math.min(this.stam, this.stamMax);
    this.magMax = Math.max(1, Math.round(this.rw.mag * m.magMult));
    this.reserveMax = Math.round(this.rw.reserveMax * m.reserveMult);
  }

  /* =========================== BUFF TONG HOP =========================== */
  get dmgBuff() {
    const m = this.mods;
    let b = 1;
    b += m.dmgPerLuck4 * Math.floor(this.luck / 4);
    b += Math.min(0.4, m.dmgPer1000Gold * Math.floor(this.gold / 1000));
    return b;
  }
  get comboMult() { return [1.0, 1.15, 1.3, 1.5, 1.8, 1.8][Math.min(5, this.combo)]; }
  get chainMult() { return this.chain >= 15 ? 1.4 : this.chain >= 8 ? 1.25 : this.chain >= 4 ? 1.1 : 1; }

  /* ============================= BAN =============================== */
  shootAt(sx, sy, single) {
    if (!this.running || this.advancing) return;
    if (this.reloading) { this.tryPerfectReload(); return; }
    if (this.mag <= 0) { this.startReload(); return; }
    if (this.fireCd > 0) return;

    const rw = this.rw;
    this.fireCd = 60 / rw.rpm;
    this.mag--;
    this.audio.shot(rw.pellets > 1);
    const fk = GD.feel.shake.find((s) => s.event.includes('súng lục')) || { amplitudePx: 3 };
    this.juice.addShake(rw.pellets > 1 ? 14 : fk.amplitudePx, 0, 1);

    const w = window.innerWidth, h = window.innerHeight;
    const target = this.pool.pickByScreen(this.world.camera, sx, sy, w, h, this.mods.aimCone);
    if (!target) { this.chain = 0; if (this.mag <= 0) this.startReload(); return; }

    const crit = Math.random() < this.mods.crit;
    let dmg = rw.dmg * rw.pellets * this.mods.rangedDmg * this.dmgBuff * this.chainMult;
    if (this.perfectMag) dmg *= 1.15;
    if (this.buffNextShot > 0) { dmg *= 1.6; this.buffNextShot = 0; }
    if (crit) dmg *= this.mods.critMult;
    dmg = Math.round(dmg);

    // vector dan: tu nguoi choi tới quái -> xac bay NGUOC VE SAU (docs)
    const dx = target.x - 0, dz = target.z - this.playerZ;
    const len = Math.hypot(dx, dz) || 1;
    this.hitEnemy(target, dmg, dx / len, dz / len, rw.knockback * this.mods.kb, crit, 'ranged');

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

    const hits = this.pool.queryArc(0, this.playerZ, dirX, dirZ, reach, arc, maxT);
    const sh = GD.feel.shake.find((x) => x.event === (heavy ? 'Chém nặng' : 'Chém nhẹ')) || { amplitudePx: 6 };
    this.juice.addShake(sh.amplitudePx, nx, ny);
    this.juice.addHitstop(hits.length ? (heavy ? 5 : 3) : 1);

    if (!hits.length) { this.combo = 0; this.comboT = 0; return; }

    let dmg = mw.dmg * this.mods.meleeDmg * this.dmgBuff * this.comboMult * (heavy ? 2 : 1);
    if (this.buffNextSlash > 0) { dmg *= 1.6; this.buffNextSlash = 0; }
    dmg = Math.round(dmg);

    let killed = 0;
    for (const e of hits) {
      const crit = Math.random() < this.mods.crit;
      const d = crit ? Math.round(dmg * this.mods.critMult) : dmg;
      // xac VANG THEO CHIEU SLIDE (docs) — dung chinh vector quet
      const ok = this.hitEnemy(e, d, nx, dirZ * 0.6 + (ny < 0 ? 0.25 : -0.25), mw.knockback * this.mods.kb * (heavy ? 2.2 : 1), crit, 'melee');
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
      this.scavenge += killed;                              // tinh x2
      this.juice.addSlowmo(0.12, 0.35);
      this.juice.addShake(20, nx, ny);
      this.audio.duck(0.6, 0.12);
      this.audio.perfect();
      this.ui.banner('CHÉM HOÀN HẢO', '+stamina +đạn');
      if (this.perfectSlashes % 10 === 0) this.addLuck(1, 'Chém Hoàn Hảo x10');
    }

    // Cuop Dan: N mang chem = 1 bang dan
    this.scavenge += killed;
    while (this.scavenge >= this.mods.scavengeNeed) {
      this.scavenge -= this.mods.scavengeNeed;
      this.reserve = Math.min(this.reserveMax, this.reserve + this.magMax);
      this.ui.banner('CƯỚP ĐẠN', '+1 băng');
    }
    if (this.mods.twoBlades) this.buffNextShot = 1;
  }

  /** @returns {boolean} co giet duoc khong */
  hitEnemy(e, dmg, kx, kz, kbForce, crit, source) {
    const res = this.pool.damage(e, dmg, kx, kz, kbForce);
    this.juice.addNumber(e.x, 1.05 * e.scale, e.z, String(dmg), crit);
    if (source === 'ranged') this.juice.addHitstop(crit ? 4 : 2);
    if (!res) return false;

    this.kills++;
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
        this.pool.damage(n, aoe, 0, -1, 0.4);
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
  startReload() {
    if (this.reloading || this.mag >= this.magMax || this.reserve <= 0) return;
    this.reloading = true;
    this.reloadDur = this.rw.reloadTime * this.mods.reloadMult;
    this.reloadT = 0;
    this.reloadTapped = false;
    const start = 0.45 + Math.random() * 0.35;
    this.reloadWin = [start, Math.min(0.97, start + 0.25 / this.reloadDur)];
    this.ui.reloadStart(this.reloadWin);
  }
  tryPerfectReload() {
    if (!this.reloading || this.reloadTapped) return;
    this.reloadTapped = true;
    const p = this.reloadT / this.reloadDur;
    const ok = p >= this.reloadWin[0] && p <= this.reloadWin[1];
    this.audio.reloadClick(ok);
    if (ok) { this.reloadDur *= 0.55; this.perfectMag = true; this.ui.banner('NẠP HOÀN HẢO', '+15% damage'); }
    else { this.reloadDur *= 1.3; this.juice.addShake(8, 0, 1); }
    this.reloadStats = this.reloadStats || { ok: 0, total: 0 };
    this.reloadStats.total++; if (ok) this.reloadStats.ok++;
  }
  _finishReload() {
    const need = this.magMax - this.mag;
    const take = Math.min(need, this.reserve);
    this.mag += take;
    this.reserve -= take;
    this.reloading = false;
    this.ui.reloadEnd();
  }

  /* ============================= NE ============================== */
  dodge(dir) {
    if (this.advancing) return;
    const c = GD.ctrl;
    if (dir === 'back') {
      if (this.dodgeCd > 0) return;
      this.dodgeCd = c.dodgeCooldown * this.mods.dodgeCdMult;
      this.iframe = 0.15;
      this.playerZ += 1.2;
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
    const dt = this.juice.timeScale(Math.min(0.05, dtRaw));

    if (dt > 0) {
      this.fireCd = Math.max(0, this.fireCd - dt);
      this.swingCd = Math.max(0, this.swingCd - dt);
      this.dodgeCd = Math.max(0, this.dodgeCd - dt);
      this.dashCd = Math.max(0, this.dashCd - dt);
      this.iframe = Math.max(0, this.iframe - dt);

      // stamina hoi sau 0.6s
      this.staminaIdle += dt;
      if (this.staminaIdle > this.const.staminaRegenDelay) {
        this.stam = Math.min(this.stamMax, this.stam + (this.const.staminaRegen + this.mods.staminaRegenAdd) * dt);
      }
      if (this.comboT > 0) { this.comboT -= dt; if (this.comboT <= 0) { this.combo = 0; this.ui.combo(0); } }

      if (this.reloading) {
        this.reloadT += dt;
        this.ui.reloadProgress(this.reloadT / this.reloadDur);
        if (this.reloadT >= this.reloadDur) this._finishReload();
      }

      // giu de ban lien tuc
      if (this.holdPt && !this.reloading && this.mag > 0) this.shootAt(this.holdPt.x, this.holdPt.y, false);

      // di chuyen sang phong sau
      if (this.advancing) {
        this.advancing.t += dt;
        const k = Math.min(1, this.advancing.t / this.advancing.dur);
        this.playerZ = this.advancing.from + (this.advancing.to - this.advancing.from) * (k * k * (3 - 2 * k));
        this.bobT += dt * 9;
        this.bob = Math.sin(this.bobT) * 0.045;
        if (k >= 1) { this.advancing = null; this.bob = 0; this._enterRoom(); }
      } else {
        this.bob *= 0.9;
      }

      // quai
      const dmgIn = this.pool.update(dt, 0, this.playerZ, () => {});
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
    const fork = this.director.makeFork({
      hp: this.hp, hpMax: this.hpMax, reserve: this.reserve, reserveMax: this.reserveMax,
    });
    this.ui.openGate(this.rollCards(), fork, this);
  }

  chooseDoor(door) {
    const r = this.director.advance(door);
    if (r.newDepth) this.world.setDepth(r.newDepth);
    this.walked++;
    this.advancing = { t: 0, dur: 1.7, from: this.playerZ, to: this.world.standZ(this.walked) };
    this.pool.clear();
    this.ui.closeGate();
  }

  _enterRoom() {
    this.playerZ = this.world.standZ(this.walked);
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
