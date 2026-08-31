/* balance.js — cai dat DUNG cac cong thuc o docs/16-data-schema-balancing.md.
   Neu doi cong thuc: sua docs/16 + data/*.json TRUOC, roi sua file nay. */

import { GD } from './data.js';

/* ---------- 4.2 Scaling quai (khong co dial nguoi choi) ---------- */
export function enemyHP(e, R, w) {
  const s = GD.enemies.scaling;
  return e.hp * Math.pow(s.hpPerRoom, R - 1) * (1 + s.hpPerWave * (w - 1));
}
export function enemyDmg(e, R) {
  return e.dmg * Math.pow(GD.enemies.scaling.dmgPerRoom, R - 1);
}

/* ---------- 4.4 Wave director ---------- */
export function tpBudget(R, w, roomType, doorHot) {
  const mult = GD.waves.directorRules.roomTypeMult[roomType] ?? 1.0;
  const hot = doorHot ? 1.25 : 1.0;
  return Math.round((14 + 4.2 * R) * (1 + 0.18 * (w - 1)) * mult * hot);
}

/** So quai thuc cua 1 wave = TP * SUM(weight_i / tpCost_i) * tpMult.
 *  KHONG duoc dung tpCost trung binh toan pool -- xem docs/16 muc 4.4. */
export function countPerTP(template) {
  let f = 0;
  for (const c of template.composition) {
    const e = GD.byId[c.enemy];
    if (e && e.tpCost > 0) f += c.weight / e.tpCost;
  }
  return f * template.tpMult;
}

/* ---------- 4.1 Vu khi ---------- */
export function dpsSustained(w) {
  const cycle = w.mag / (w.rpm / 60) + w.reloadTime;
  return (w.dmg * w.pellets * w.mag) / cycle;
}
export function meleeInterval(w) {
  return Math.max(w.swingTime, w.staminaCost / GD.weapons.balance.staminaRegen);
}

/* ---------- 4.5 Vang ---------- */
export function goldPerKill(e, D, doorTagMult = 1) {
  return Math.max(1, Math.round(e.goldDrop * Math.pow(1.15, D - 1) * doorTagMult));
}

/* ---------- 4.6 Rarity the theo Loc ---------- */
export function rarityWeights(L) {
  const w = {
    common: Math.max(6, 60 - 2.6 * L),
    rare: 28 + 1.3 * L,
    epic: 10 + 1.0 * L,
    legendary: 2 + 0.4 * L,
  };
  const sum = w.common + w.rare + w.epic + w.legendary;
  for (const k in w) w[k] = w[k] / sum;
  return w;
}
export function rollRarity(L, rnd) {
  const w = rarityWeights(L);
  let r = rnd();
  for (const k of ['legendary', 'epic', 'rare', 'common']) {
    if ((r -= w[k]) <= 0) return k;
  }
  return 'common';
}

/* ---------- muc 5: tran DPS quai o dai Can chien ---------- */
/* Tran DPS o dai Can chien. Base ha tu 0.28 -> 0.16 sau khi prototype cho thay:
   o R1 voi 18 quai vay quanh, 0.28 x 100 HP = 28 HP/s tuc chet sau 3.6s tiep xuc
   -- khong con cho de hoc. 0.16 cho ~6.3s. Con so nay CAN human playtest xac nhan. */
export function meleeBandDpsCap(R, hpBase) {
  return Math.min(0.55, 0.16 + 0.0055 * (R - 1)) * hpBase;
}

/* ---------- muc 6: randomness co seed ---------- */
export function hashSeed(...parts) {
  let h = 2166136261 >>> 0;
  const s = parts.join('|');
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}
/** mulberry32 — deterministic, du cho prototype. */
export function rngFrom(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function pickWeighted(items, weightOf, rnd) {
  let total = 0;
  for (const it of items) total += weightOf(it);
  let r = rnd() * total;
  for (const it of items) {
    r -= weightOf(it);
    if (r <= 0) return it;
  }
  return items[items.length - 1];
}
