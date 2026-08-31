/* enemies.js — pool quai instanced. Muc tieu: 150+ con nhin thay duoc cung luc
   (feel tham chieu tu Guns 'n Goblins -- CHI feel mat do, khong lay co che nao).

   Nhan dang bang SILHOUETTE + MAT DO, khong bang texture (docs/09 nguyen tac 2)
   -> LOD thap khong bi phat hien, va chay duoc 240 agent. */

import * as THREE from 'three';
import { GD } from './data.js';
import { enemyHP, enemyDmg } from './balance.js';

export const CAP = 240;
export const MELEE_BAND = 2.5;
export const MID_BAND = 9;
export const ATTACK_RANGE = 1.2;
export const TELEGRAPH = 0.4;

const TYPE_LOOK = {
  en_trash_goblincui:   { s: 1.00, c: 0x171c24, eye: 0xff3b30 },
  en_trash_goblinchay:  { s: 0.86, c: 0x1d2430, eye: 0xff7a30 },
  en_trash_goblinbay:   { s: 0.74, c: 0x141922, eye: 0xff3b30 },
  en_ranged_nemda:      { s: 0.95, c: 0x18231e, eye: 0xffd23b },
  en_special_thuocno:   { s: 0.92, c: 0x2a1712, eye: 0xff5a20 },
  en_special_khien:     { s: 1.08, c: 0x232a36, eye: 0x9fb4ff },
  en_heavy_ogreham:     { s: 1.62, c: 0x241d16, eye: 0xff3b30 },
  en_special_bongham:   { s: 1.10, c: 0x0a0810, eye: 0xb14cff },
  en_elite_tuonggoblin: { s: 1.34, c: 0x2e1a38, eye: 0xd07bff },
};
const DEFAULT_LOOK = { s: 1.0, c: 0x171c24, eye: 0xff3b30 };

export class EnemyPool {
  constructor(scene) {
    this.scene = scene;
    this.n = 0;
    this.list = [];
    for (let i = 0; i < CAP; i++) {
      this.list.push({
        alive: false, id: '', x: 0, z: 0, hp: 0, maxHp: 0, dmg: 0, speed: 0, kbResist: 0,
        vx: 0, vz: 0, scale: 1, color: 0, eye: 0, atk: 0, tele: 0, flash: 0, gold: 0, role: '',
      });
    }

    // GOBLIN LUN ~1.05m: o tam 1.2m thi no chiem NUA DUOI man hinh, van thay duoc phia sau.
    // Neu cao 1.6m nhu zombie thi 1 con da che kin khung nhin -> rui ro R6 (docs/17).
    const body = new THREE.CapsuleGeometry(0.26, 0.5, 3, 7);
    // MeshBasicMaterial = KHONG chiu anh sang -> luon la BONG DEN (docs/15 muc 1).
    this.matBody = new THREE.MeshBasicMaterial({ color: 0xffffff });
    this.bodies = new THREE.InstancedMesh(body, this.matBody, CAP);
    this.bodies.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.bodies.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(CAP * 3), 3);
    this.bodies.frustumCulled = false;
    scene.add(this.bodies);

    // "Mat do" — MeshBasicMaterial nen khong phu thuoc anh sang: trong toi van sang.
    const eye = new THREE.BoxGeometry(0.2, 0.05, 0.05);
    this.matEye = new THREE.MeshBasicMaterial({ color: 0xffffff });
    this.eyes = new THREE.InstancedMesh(eye, this.matEye, CAP);
    this.eyes.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.eyes.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(CAP * 3), 3);
    this.eyes.frustumCulled = false;
    scene.add(this.eyes);

    this._m = new THREE.Matrix4();
    this._q = new THREE.Quaternion();
    this._v = new THREE.Vector3();
    this._c = new THREE.Color();
    this._axisX = new THREE.Vector3(1, 0, 0);
    this._white = new THREE.Color(1, 1, 1);
    this._red = new THREE.Color(0.55, 0.09, 0.06);
  }

  get aliveCount() {
    let k = 0;
    for (const e of this.list) if (e.alive) k++;
    return k;
  }

  spawn(typeId, x, z, R, w) {
    const def = GD.byId[typeId];
    if (!def) return null;
    const slot = this.list.find((e) => !e.alive);
    if (!slot) return null;
    const look = TYPE_LOOK[typeId] || DEFAULT_LOOK;
    slot.alive = true;
    slot.id = typeId;
    slot.role = def.role;
    slot.x = x; slot.z = z;
    slot.vx = 0; slot.vz = 0;
    slot.maxHp = Math.max(1, Math.round(enemyHP(def, R, w)));
    slot.hp = slot.maxHp;
    slot.dmg = Math.max(1, Math.round(enemyDmg(def, R)));
    slot.speed = def.speed;
    slot.kbResist = def.kbResist;
    slot.gold = def.goldDrop;
    slot.scale = look.s;
    slot.color = look.c;
    slot.eye = look.eye;
    slot.atk = 0.6 + Math.random() * 0.6;
    slot.tele = 0;
    slot.flash = 0;
    slot.invuln = (def.tags || []).includes('invulnerable');
    return slot;
  }

  /** Day cac con dang chong len nhau ra xa — khong co buoc nay thi 17 con
   *  se dung dung MOT diem va man hinh thanh mot buc tuong capsule.
   *  Dung spatial hash 3x3 de khong phai so O(n^2). */
  _separate(dt) {
    const CELL = 1.0;
    const grid = this._grid || (this._grid = new Map());
    grid.clear();
    for (const e of this.list) {
      if (!e.alive) continue;
      const key = `${Math.round(e.x / CELL)},${Math.round(e.z / CELL)}`;
      let arr = grid.get(key);
      if (!arr) { arr = []; grid.set(key, arr); }
      arr.push(e);
    }
    const push = 5.2 * dt;
    for (const e of this.list) {
      if (!e.alive) continue;
      const cx = Math.round(e.x / CELL), cz = Math.round(e.z / CELL);
      for (let ox = -1; ox <= 1; ox++) {
        for (let oz = -1; oz <= 1; oz++) {
          const arr = grid.get(`${cx + ox},${cz + oz}`);
          if (!arr) continue;
          for (const o of arr) {
            if (o === e) continue;
            const dx = e.x - o.x, dz = e.z - o.z;
            const min = 0.27 * (e.scale + o.scale) * 1.05;
            const d2 = dx * dx + dz * dz;
            if (d2 > min * min || d2 < 1e-6) continue;
            const d = Math.sqrt(d2);
            const f = ((min - d) / min) * push;
            e.x += (dx / d) * f;
            e.z += (dz / d) * f;
          }
        }
      }
      // khong cho lot qua tuong hanh lang
      const lim = 4.0;
      if (e.x < -lim) e.x = -lim;
      if (e.x > lim) e.x = lim;
    }
  }

  /** @returns {number} tong damage giang vao nguoi choi trong frame nay */
  update(dt, px, pz, onAttack) {
    let dmgToPlayer = 0;
    const target = pz - ATTACK_RANGE * 0.8;
    for (const e of this.list) {
      if (!e.alive) continue;

      // knockback decay
      e.x += e.vx * dt;
      e.z += e.vz * dt;
      e.vx *= Math.pow(0.02, dt);
      e.vz *= Math.pow(0.02, dt);

      const dx = px - e.x;
      const dz = target - e.z;
      const d = Math.hypot(dx, dz) || 1;

      if (d > ATTACK_RANGE) {
        const sp = e.speed;
        e.x += (dx / d) * sp * dt;
        e.z += (dz / d) * sp * dt;
        e.tele = 0;
      } else {
        // telegraph: chi sang do trong 0.4s TRUOC khi vung (docs/06 muc 4).
        // Neu de tele cong don thi ca dam do vinh vien -> khong doc duoc gi.
        e.atk -= dt;
        e.tele = e.atk <= TELEGRAPH ? Math.max(0, TELEGRAPH - e.atk) : 0;
        if (e.atk <= 0) {
          dmgToPlayer += e.dmg;
          e.atk = 1.15;
          e.tele = 0;
          onAttack?.(e);
        }
      }
      if (e.flash > 0) e.flash = Math.max(0, e.flash - dt * 6);
    }
    this._separate(dt);
    this._writeInstances();
    return dmgToPlayer;
  }

  _writeInstances() {
    let k = 0;
    const bodyCol = this.bodies.instanceColor.array;
    const eyeCol = this.eyes.instanceColor.array;
    for (const e of this.list) {
      if (!e.alive) continue;
      const s = e.scale;
      const lean = e.tele > 0 ? Math.min(0.22, e.tele * 0.5) : 0;
      this._q.setFromAxisAngle(this._axisX, -lean);
      this._m.compose(
        this._v.set(e.x, 0.51 * s, e.z),
        this._q,
        { x: s, y: s, z: s }
      );
      this.bodies.setMatrixAt(k, this._m);

      this._c.setHex(e.color);
      if (e.flash > 0) this._c.lerp(this._white, Math.min(1, e.flash));
      if (e.tele > 0.15) this._c.lerp(this._red, 0.45);
      bodyCol[k * 3] = this._c.r; bodyCol[k * 3 + 1] = this._c.g; bodyCol[k * 3 + 2] = this._c.b;

      this._m.compose(
        this._v.set(e.x, 0.86 * s, e.z + 0.23 * s),
        this._q,
        { x: s, y: s, z: s }
      );
      this.eyes.setMatrixAt(k, this._m);
      this._c.setHex(e.eye);
      eyeCol[k * 3] = this._c.r; eyeCol[k * 3 + 1] = this._c.g; eyeCol[k * 3 + 2] = this._c.b;

      k++;
    }
    this.bodies.count = k;
    this.eyes.count = k;
    this.bodies.instanceMatrix.needsUpdate = true;
    this.eyes.instanceMatrix.needsUpdate = true;
    this.bodies.instanceColor.needsUpdate = true;
    this.eyes.instanceColor.needsUpdate = true;
  }

  /** Ban/chem: tra ve true neu chet. Knockback theo vector (kx,kz). */
  damage(e, amount, kx, kz, kbForce) {
    if (!e.alive) return false;
    if (e.invuln) {
      // Bong Ham: khong giet duoc, chi day duoc (docs/09)
      const r = 1 - e.kbResist;
      e.vx += kx * kbForce * r * 2.4;
      e.vz += kz * kbForce * r * 2.4;
      e.flash = 0.5;
      return false;
    }
    e.hp -= amount;
    e.flash = 1;
    const r = 1 - e.kbResist;
    if (e.hp <= 0) {
      e.alive = false;
      // launch = kb * 2.2 * (1 - kbResist)  (docs/16 muc 4.9)
      return { x: e.x, z: e.z, scale: e.scale, color: e.color, gold: e.gold, role: e.role,
               lx: kx * kbForce * 2.2 * r, lz: kz * kbForce * 2.2 * r };
    }
    e.vx += kx * kbForce * r;
    e.vz += kz * kbForce * r;
    return false;
  }

  /** Nhat quai gan diem tap nhat trong hinh non aim-assist (do bang goc). */
  pickByScreen(camera, sx, sy, w, h, coneDeg) {
    let best = null, bestD = Infinity;
    const v = new THREE.Vector3();
    for (const e of this.list) {
      if (!e.alive) continue;
      v.set(e.x, 0.62 * e.scale, e.z).project(camera);
      if (v.z > 1) continue;
      const ex = (v.x * 0.5 + 0.5) * w;
      const ey = (-v.y * 0.5 + 0.5) * h;
      const dist = Math.hypot(ex - sx, ey - sy);
      // ban kinh cho phep = cone(deg) quy ra pixel, cong 1 nua ben rong con quai
      const tol = (coneDeg / camera.fov) * h + 26 * e.scale;
      if (dist < tol && dist < bestD) { bestD = dist; best = e; }
    }
    return best;
  }

  /** Moi con trong hinh quat quanh huong quet (world space). */
  queryArc(px, pz, dirX, dirZ, reach, arcDeg, max) {
    const out = [];
    const half = (arcDeg / 2) * (Math.PI / 180);
    const len = Math.hypot(dirX, dirZ) || 1;
    const nx = dirX / len, nz = dirZ / len;
    for (const e of this.list) {
      if (!e.alive) continue;
      const dx = e.x - px, dz = e.z - pz;
      const d = Math.hypot(dx, dz);
      if (d > reach + 0.27 * e.scale) continue;
      const dot = (dx * nx + dz * nz) / (d || 1);
      if (Math.acos(Math.max(-1, Math.min(1, dot))) <= half) out.push({ e, d });
    }
    out.sort((a, b) => a.d - b.d);
    return out.slice(0, max).map((o) => o.e);
  }

  clear() {
    for (const e of this.list) e.alive = false;
    this._writeInstances();
  }
}
