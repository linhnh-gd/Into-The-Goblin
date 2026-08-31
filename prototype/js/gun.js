/* gun.js — model sung gan vao camera. Rut ra khi tap/hold, cat di khi nha tay.
   Ly do ton tai: TRANG THAI phai nhin thay duoc. Nguoi choi can phan biet ngay
   "dang cam sung" vs "dang cam dao" vs "dang reload" ma khong phai doc HUD.
   Moi so lay tu data/gamefeel.json khoi "gun". */

import * as THREE from 'three';
import { GD } from './data.js';

export class GunModel {
  constructor(camera) {
    this.G = GD.feel.gun;
    this.group = new THREE.Group();
    const mat = new THREE.MeshBasicMaterial({ color: 0x2b323c });
    const dark = new THREE.MeshBasicMaterial({ color: 0x12161c });

    const body = new THREE.Mesh(new THREE.BoxGeometry(0.095, 0.105, 0.42), mat);
    body.position.set(0, 0, -0.10);
    const barrel = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.30), dark);
    barrel.position.set(0, 0.016, -0.40);
    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.17, 0.10), dark);
    grip.position.set(0, -0.115, 0.07);
    grip.rotation.x = -0.22;
    this.group.add(body, barrel, grip);

    this.flashMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(0.36, 0.36),
      new THREE.MeshBasicMaterial({ color: 0xffd070, transparent: true, opacity: 0 }));
    this.flashMesh.position.set(0, 0.016, -0.60);
    this.group.add(this.flashMesh);

    camera.add(this.group);
    this.t = 0;            // 0 = cat han, 1 = rut han
    this.out = false;
    this.flashT = 0;
    this.recoil = 0;
    this._apply();
  }

  setOut(on) { this.out = on; }
  flash() { this.flashT = 0.055; this.recoil = 1; }
  get ready() { return this.t > 0.55; }

  update(dt) {
    const G = this.G;
    const rate = this.out ? dt / Math.max(0.01, G.drawSec) : -dt / Math.max(0.01, G.holsterSec);
    this.t = Math.max(0, Math.min(1, this.t + rate));
    this.flashT = Math.max(0, this.flashT - dt);
    this.recoil = Math.max(0, this.recoil - dt * 9);
    this._apply();
  }

  _apply() {
    const G = this.G;
    const k = this.t * this.t * (3 - 2 * this.t);          // smoothstep
    const y = G.holsterDropY + (G.restY - G.holsterDropY) * k;
    this.group.position.set(G.offsetX, y, G.offsetZ + this.recoil * 0.06);
    this.group.rotation.set(-0.06 + (1 - k) * 0.75, 0.05, (1 - k) * 0.38);
    this.group.visible = this.t > 0.01;
    this.flashMesh.material.opacity = this.flashT > 0 ? 0.9 : 0;
    this.flashMesh.scale.setScalar(this.flashT > 0 ? 1 : 0.001);
  }
}
