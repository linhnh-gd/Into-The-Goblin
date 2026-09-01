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

    /* THOI (fore-end) — khoi truot doc theo nong. Voi sung nhip cham (shotgun 1.09s
       giua 2 phat) khoang trong giua 2 phat truoc day KHONG co gi xay ra: nguoi choi
       cham lien tuc, khong ra dan, doc ra nhu sung hong hoac input bi nuot. Cai thoi
       nay keo ve sau roi day len truoc dung trong khoang do -- delay khong doi, nhung
       gio no CO LY DO nhin thay duoc. */
    // mau sang hon than sung mot bac: bo phan DUY NHAT chuyen dong phai doc duoc o goc man hinh toi
    const steel = new THREE.MeshBasicMaterial({ color: 0x4a5462 });
    this.pump = new THREE.Mesh(new THREE.BoxGeometry(0.078, 0.068, 0.17), steel);
    this.pumpZ0 = -0.30;
    this.pump.position.set(0, -0.052, this.pumpZ0);
    this.group.add(this.pump);
    this.rackT = 0;
    this.rackDur = 0;

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

  /** LEN DAN. `dur` = dung bang khoang cach that giua 2 phat (60/rpm), khong phai mot
      con so rieng: animation chi la cai VE cho delay da co, no khong duoc dai hon hay
      ngan hon delay that. Goi voi sung nhip nhanh la vo nghia -> game.js loc bang
      gun.rackMinIntervalSec truoc khi goi. */
  rack(dur) { this.rackDur = dur; this.rackT = dur; }

  /** Bo animation len dan giua chung — dung khi nguoi choi chuyen sang chem.
      CHI bo phan NHIN THAY: fireCd trong game.js van chay het, delay khong doi. */
  cancelRack() { this.rackT = 0; this.rackDur = 0; }

  update(dt) {
    const G = this.G;
    const rate = this.out ? dt / Math.max(0.01, G.drawSec) : -dt / Math.max(0.01, G.holsterSec);
    this.t = Math.max(0, Math.min(1, this.t + rate));
    this.flashT = Math.max(0, this.flashT - dt);
    this.recoil = Math.max(0, this.recoil - dt * 9);
    if (this.rackT > 0) this.rackT = Math.max(0, this.rackT - dt);
    this._apply();
  }

  _apply() {
    const G = this.G;
    const k = this.t * this.t * (3 - 2 * this.t);          // smoothstep
    const y = G.holsterDropY + (G.restY - G.holsterDropY) * k;

    /* LEN DAN: thoi keo VE SAU trong rackBackFrac dau roi DAY LEN TRUOC o phan con lai
       (keo nhanh, day cham hon — dung nhip tay that). Ca khau nga len mot chut theo. */
    let pump = 0, kick = 0;
    if (this.rackT > 0 && this.rackDur > 0) {
      const p = 1 - this.rackT / this.rackDur;             // 0 vua ban -> 1 san sang
      const b = Math.max(0.05, Math.min(0.95, G.rackBackFrac ?? 0.42));
      const cyc = p < b ? p / b : 1 - (p - b) / (1 - b);   // tam giac 0 -> 1 -> 0
      const ease = cyc * cyc * (3 - 2 * cyc);
      pump = ease * (G.rackTravelM ?? 0.15);
      kick = ease * ((G.rackKickDeg ?? 9) * Math.PI) / 180;
    }
    this.pump.position.z = this.pumpZ0 + pump;

    this.group.position.set(G.offsetX, y - pump * 0.10, G.offsetZ + this.recoil * 0.06 + pump * 0.05);
    this.group.rotation.set(-0.06 + (1 - k) * 0.75 - kick, 0.05, (1 - k) * 0.38 + kick * 0.4);
    this.group.visible = this.t > 0.01;
    this.flashMesh.material.opacity = this.flashT > 0 ? 0.9 : 0;
    this.flashMesh.scale.setScalar(this.flashT > 0 ? 1 : 0.001);
  }
}
