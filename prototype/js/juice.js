/* juice.js — hitstop + shake co huong + vang no + xac bay theo vector.
   Tham so lay tu data/gamefeel.json (docs/13). Luat vang: hitstop + shake + hat
   phai trigger CUNG 1 FRAME, va shake phai tat theo ham mu. */

import * as THREE from 'three';
import { GD } from './data.js';

const GOLD_CAP = 400;      // gamefeel.globalRules.goldPhysicsCap
const CORPSE_CAP = 14;     // ragdollCap 12, +2 dem
const NUM_CAP = 14;        // damageNumberCap

export class Juice {
  constructor(scene, camera, hudEl, audio) {
    this.scene = scene;
    this.camera = camera;
    this.audio = audio;
    const g = GD.feel.globalRules;
    this.decay = g.shakeDecayPerFrame;
    this.ampCap = g.shakeTotalAmplitudeCapPx;
    this.refW = g.referenceScreenWidthPx;

    this.shake = { x: 0, y: 0, roll: 0, amp: 0 };
    this.hitstop = 0;
    this.slowmo = 0;
    this.slowmoScale = 1;
    this.slowmoCd = 0;

    /* ---- vang ---- */
    this.gold = [];
    for (let i = 0; i < GOLD_CAP; i++) this.gold.push({ on: false, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, t: 0, val: 1 });
    const gGeo = new THREE.OctahedronGeometry(0.085, 0);
    this.goldMesh = new THREE.InstancedMesh(gGeo, new THREE.MeshBasicMaterial({ color: 0xffc53d }), GOLD_CAP);
    this.goldMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.goldMesh.frustumCulled = false;
    scene.add(this.goldMesh);

    /* ---- xac ---- */
    this.corpses = [];
    for (let i = 0; i < CORPSE_CAP; i++) this.corpses.push({ on: false, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, spin: 0, rot: 0, t: 0, s: 1, c: 0x2a323c });
    const cGeo = new THREE.CapsuleGeometry(0.26, 0.5, 3, 6);
    this.corpseMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    this.corpseMesh = new THREE.InstancedMesh(cGeo, this.corpseMat, CORPSE_CAP);
    this.corpseMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.corpseMesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(CORPSE_CAP * 3), 3);
    this.corpseMesh.frustumCulled = false;
    scene.add(this.corpseMesh);

    /* ---- so damage (DOM, cap 14) ---- */
    this.nums = [];
    for (let i = 0; i < NUM_CAP; i++) {
      const d = document.createElement('div');
      d.style.cssText = 'position:absolute;font-family:var(--f-disp);font-size:15px;color:#fff;' +
        'text-shadow:0 2px 6px #000;pointer-events:none;opacity:0;will-change:transform,opacity';
      hudEl.appendChild(d);
      this.nums.push({ el: d, on: false, t: 0, x: 0, y: 0, z: 0 });
    }

    this._m = new THREE.Matrix4();
    this._q = new THREE.Quaternion();
    this._v = new THREE.Vector3();
    this._c = new THREE.Color();
    this._proj = new THREE.Vector3();
    this._eu = new THREE.Euler();
  }

  /* ---------------- shake / hitstop ---------------- */
  addShake(amountPx, dirX = 0, dirY = 1, roll = 0) {
    const scale = (window.innerWidth || this.refW) / this.refW;
    const a = Math.min(this.ampCap, amountPx) * scale;
    this.shake.amp = Math.min(this.ampCap * scale, this.shake.amp + a);
    this.shake.x = dirX * this.shake.amp;
    this.shake.y = dirY * this.shake.amp;
    this.shake.roll = roll;
  }
  addHitstop(frames) { this.hitstop = Math.max(this.hitstop, frames / 60); }
  addSlowmo(sec, scale) {
    if (this.slowmoCd > 0) return;                 // cooldown 1.5s (docs/13)
    this.slowmo = sec; this.slowmoScale = scale;
    this.slowmoCd = GD.feel.globalRules.slowMoCooldownSec;
  }

  /* ---------------- vang ---------------- */
  burstGold(x, z, count, valuePer, dirX = 0, dirZ = -1) {
    let made = 0;
    for (const c of this.gold) {
      if (made >= count) break;
      if (c.on) continue;
      c.on = true;
      c.x = x; c.y = 0.9 + Math.random() * 0.3; c.z = z;
      const a = Math.random() * Math.PI * 2;
      const sp = 1.6 + Math.random() * 2.4;
      c.vx = Math.cos(a) * sp * 0.6 + dirX * 1.4;
      c.vz = Math.sin(a) * sp * 0.6 + dirZ * 1.4;
      c.vy = 2.4 + Math.random() * 2.2;
      c.t = 0;
      c.val = valuePer;
      made++;
    }
    return made;
  }

  /** Cot vang: 25x, cot sang 3m (docs/13). */
  goldPillar(x, z, value) {
    this.burstGold(x, z, 26, Math.max(1, Math.round(value / 26)), 0, 0);
    this.addShake(9, 0, 1);
  }

  /* ---------------- xac ---------------- */
  addCorpse(hit) {
    let slot = this.corpses.find((c) => !c.on);
    if (!slot) { slot = this.corpses.reduce((a, b) => (a.t > b.t ? a : b)); }
    slot.on = true;
    slot.x = hit.x; slot.y = 0.51 * hit.scale; slot.z = hit.z;
    slot.vx = hit.lx; slot.vz = hit.lz;
    slot.vy = 1.6 + Math.min(4.5, Math.hypot(hit.lx, hit.lz) * 0.35);
    slot.spin = (Math.random() - 0.5) * 9;
    slot.rot = 0;
    slot.t = 0;
    slot.s = hit.scale;
    slot.c = hit.color;
  }

  /* ---------------- so damage ---------------- */
  addNumber(x, y, z, text, crit) {
    const slot = this.nums.find((n) => !n.on) || this.nums[0];
    slot.on = true; slot.t = 0; slot.x = x; slot.y = y; slot.z = z;
    slot.el.textContent = text;
    slot.el.style.fontSize = crit ? '27px' : '15px';
    slot.el.style.color = crit ? '#FFC53D' : '#fff';
  }

  /* ---------------- update ---------------- */
  update(dt, px, pz, magnetR, onCollect) {
    // shake tat theo ham mu, camera ve goc <= 0.35s
    const steps = Math.max(1, Math.round(dt * 60));
    this.shake.amp *= Math.pow(this.decay, steps);
    if (this.shake.amp < 0.05) { this.shake.amp = 0; this.shake.x = 0; this.shake.y = 0; this.shake.roll = 0; }
    else {
      const j = () => (Math.random() * 2 - 1) * this.shake.amp;
      this.shake.x = j(); this.shake.y = j();
      this.shake.roll *= Math.pow(this.decay, steps);
    }
    if (this.slowmoCd > 0) this.slowmoCd -= dt;

    /* vang */
    let k = 0;
    const gf = GD.feel.gold;
    for (const c of this.gold) {
      if (!c.on) continue;
      c.t += dt;
      c.vy -= 11 * dt;
      c.x += c.vx * dt; c.y += c.vy * dt; c.z += c.vz * dt;
      if (c.y < 0.09) { c.y = 0.09; c.vy *= -0.34; c.vx *= 0.6; c.vz *= 0.6; }
      if (c.t > gf.magnetDelaySec) {
        const dx = px - c.x, dz = pz - c.z, dy = 1.1 - c.y;
        const d = Math.hypot(dx, dz);
        if (d < magnetR) {
          const pull = 13 * dt * (1 + (magnetR - d) / magnetR);
          c.x += dx * pull * 0.3; c.z += dz * pull * 0.3; c.y += dy * pull * 0.3;
          if (d < 0.75) { c.on = false; onCollect?.(c.val); this.audio?.coin(); continue; }
        }
      }
      if (c.t > 14) { c.on = false; continue; }
      this._m.makeRotationY(c.t * 6);
      this._m.setPosition(c.x, c.y, c.z);
      this.goldMesh.setMatrixAt(k++, this._m);
    }
    this.goldMesh.count = k;
    this.goldMesh.instanceMatrix.needsUpdate = true;

    /* xac */
    let m = 0;
    const ccol = this.corpseMesh.instanceColor.array;
    for (const c of this.corpses) {
      if (!c.on) continue;
      c.t += dt;
      c.vy -= 13 * dt;
      c.x += c.vx * dt; c.y += c.vy * dt; c.z += c.vz * dt;
      c.rot += c.spin * dt;
      c.vx *= Math.pow(0.25, dt); c.vz *= Math.pow(0.25, dt);
      if (c.y < 0.24 * c.s) { c.y = 0.24 * c.s; c.vy *= -0.22; c.spin *= 0.5; }
      if (c.t > 1.2) { c.on = false; continue; }
      this._eu.set(c.rot, c.rot * 0.4, Math.PI * 0.42);
      this._q.setFromEuler(this._eu);
      this._m.compose(this._v.set(c.x, c.y, c.z), this._q, { x: c.s, y: c.s, z: c.s });
      this.corpseMesh.setMatrixAt(m, this._m);
      this._c.setHex(c.c);
      const f = 1 - Math.max(0, (c.t - 0.9) / 0.3);
      ccol[m * 3] = this._c.r * f; ccol[m * 3 + 1] = this._c.g * f; ccol[m * 3 + 2] = this._c.b * f;
      m++;
    }
    this.corpseMesh.count = m;
    this.corpseMesh.instanceMatrix.needsUpdate = true;
    this.corpseMesh.instanceColor.needsUpdate = true;

    /* so damage */
    const w = window.innerWidth, h = window.innerHeight;
    for (const n of this.nums) {
      if (!n.on) { n.el.style.opacity = '0'; continue; }
      n.t += dt;
      if (n.t > 0.7) { n.on = false; n.el.style.opacity = '0'; continue; }
      this._proj.set(n.x, n.y + n.t * 1.1, n.z).project(this.camera);
      if (this._proj.z > 1) { n.el.style.opacity = '0'; continue; }
      n.el.style.transform = `translate(${(this._proj.x * 0.5 + 0.5) * w}px,${(-this._proj.y * 0.5 + 0.5) * h}px)`;
      n.el.style.opacity = String(1 - n.t / 0.7);
    }
  }

  /** dt hieu dung sau hitstop / slowmo. */
  timeScale(dt) {
    if (this.hitstop > 0) { this.hitstop -= dt; return 0; }
    if (this.slowmo > 0) { this.slowmo -= dt; return dt * this.slowmoScale; }
    return dt;
  }

  clearWorld() {
    for (const c of this.gold) c.on = false;
    for (const c of this.corpses) c.on = false;
    this.goldMesh.count = 0;
    this.corpseMesh.count = 0;
  }
}
