/* projectiles.js — VIEN DAN BAY THAT, mot InstancedMesh cho tat ca.

   Vi sao can: truoc day ban la hitscan thuan -- quai mat mau ma khong co gi bay ra, nen
   shotgun va rifle nhin GIONG HET nhau du co che da khac. Vien dan la thu duy nhat cho
   nguoi choi THAY duoc su khac biet giua 9 vien ghem tan ra va 1 mui ten xuyen qua.

   Sat thuong van giai quyet ngay luc ban (hitscan) -- vien dan chi la hinh. Lam vay de
   khong sinh ra lech giua "cai da trung" va "cai dang bay", va de auto-aim khong bao gio
   ban truot vi vien dan bay cham. Toc do vien dan lay tu archetypeSpec.proj.speed. */

import * as THREE from 'three';

const UP = new THREE.Vector3(0, 0, 1);

export class Projectiles {
  constructor(scene, cap = 320) {
    this.cap = cap;
    const geo = new THREE.BoxGeometry(1, 1, 1);
    const mat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.95 });
    this.mesh = new THREE.InstancedMesh(geo, mat, cap);
    this.mesh.frustumCulled = false;
    this.mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(cap * 3), 3);
    scene.add(this.mesh);

    this.list = [];
    for (let i = 0; i < cap; i++) {
      this.list.push({ on: false, x: 0, y: 0, z: 0, dx: 0, dy: 0, dz: 1, sp: 100, left: 0, w: 0.05, l: 0.3, c: new THREE.Color() });
    }
    this._m = new THREE.Matrix4();
    this._q = new THREE.Quaternion();
    this._v = new THREE.Vector3();
    this._s = new THREE.Vector3();
    this._p = new THREE.Vector3();
    this._next = 0;
  }

  /** Ban mot vien tu (x0,y0,z0) toi (x1,y1,z1). `look` = archetypeSpec.proj. */
  fire(x0, y0, z0, x1, y1, z1, look) {
    let slot = null;
    for (let i = 0; i < this.cap; i++) {
      const k = (this._next + i) % this.cap;
      if (!this.list[k].on) { slot = this.list[k]; this._next = (k + 1) % this.cap; break; }
    }
    if (!slot) return;
    const dx = x1 - x0, dy = y1 - y0, dz = z1 - z0;
    const d = Math.hypot(dx, dy, dz) || 1;
    slot.on = true;
    slot.x = x0; slot.y = y0; slot.z = z0;
    slot.dx = dx / d; slot.dy = dy / d; slot.dz = dz / d;
    slot.sp = (look && look.speed) || 120;
    slot.left = d;
    slot.w = (look && look.sizeM) || 0.05;
    slot.l = (look && look.lenM) || 0.3;
    slot.c.set((look && look.color) || '#ffd27a');
  }

  update(dt) {
    for (const p of this.list) {
      if (!p.on) continue;
      const step = p.sp * dt;
      p.x += p.dx * step; p.y += p.dy * step; p.z += p.dz * step;
      p.left -= step;
      if (p.left <= 0) p.on = false;
    }
    this._write();
  }

  _write() {
    let k = 0;
    const col = this.mesh.instanceColor.array;
    for (const p of this.list) {
      if (!p.on) continue;
      this._v.set(p.dx, p.dy, p.dz);
      this._q.setFromUnitVectors(UP, this._v);
      this._p.set(p.x, p.y, p.z);
      this._s.set(p.w, p.w, p.l);
      this._m.compose(this._p, this._q, this._s);
      this.mesh.setMatrixAt(k, this._m);
      col[k * 3] = p.c.r; col[k * 3 + 1] = p.c.g; col[k * 3 + 2] = p.c.b;
      k++;
      if (k >= this.cap) break;
    }
    this.mesh.count = k;
    this.mesh.instanceMatrix.needsUpdate = true;
    this.mesh.instanceColor.needsUpdate = true;
  }

  clear() { for (const p of this.list) p.on = false; this.mesh.count = 0; }
}
