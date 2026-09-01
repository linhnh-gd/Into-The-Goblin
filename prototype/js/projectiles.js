/* projectiles.js — VIEN DAN BAY THAT, mot InstancedMesh cho tat ca.

   Vi sao can: truoc day ban la hitscan thuan -- quai mat mau ma khong co gi bay ra, nen
   shotgun va rifle nhin GIONG HET nhau du co che da khac. Vien dan la thu duy nhat cho
   nguoi choi THAY duoc su khac biet giua 9 vien ghem tan ra va 1 mui ten xuyen qua.

   Sat thuong van giai quyet ngay luc ban (hitscan) -- vien dan chi la hinh. Lam vay de
   khong sinh ra lech giua "cai da trung" va "cai dang bay", va de auto-aim khong bao gio
   ban truot vi vien dan bay cham. Toc do vien dan lay tu archetypeSpec.proj.speed.

   DAY LA TRACER, KHONG PHAI VIEN DAN. Ban dau no duoc dung dung ti le vat ly: rong 5cm,
   dai 42cm, bay 150 m/s. Do lai thi no song dung 6 FRAME (100ms) va be ngang tren man
   hinh la 36px o frame dau roi 9 / 5 / 3 / 2px -- tuc mot cai chop mot frame ngay duoi
   tam ngam roi bien mat. Dung vat ly, va vo hinh dung nhu dan that vo hinh.
   Nen no phai la mot VET SANG: dai gap nhieu lan, bay cham hon nhieu lan so voi dan that,
   va con nan lai mot chut sau khi toi noi roi moi tat. Khong phai mo phong vien dan --
   la ve lai duong no da di, du lau de mat kip doc (docs/18 loi #76). */

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
      this.list.push({ on: false, x: 0, y: 0, z: 0, dx: 0, dy: 0, dz: 1, sp: 100, left: 0,
        w: 0.05, l: 0.3, c: new THREE.Color(), duoi: 0, mo: 1 });
    }
    this._m = new THREE.Matrix4();
    this._q = new THREE.Quaternion();
    this._v = new THREE.Vector3();
    this._s = new THREE.Vector3();
    this._p = new THREE.Vector3();
    this._next = 0;
    // be ngang MUC TIEU tinh theo ti le chieu cao man hinh (~1.4% = 11px tren man 812)
    this.beNgangMan = 0.014;
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
    /* NAN LAI sau khi toi noi. Cu ly gan (quai sat mat) cho duong bay rat ngan -- khong
       co cai duoi nay thi ban gan gan nhu khong thay gi ca. */
    slot.duoi = (look && look.tailSec) || 0.07;
    slot.mo = 1;
  }

  /* @param cam camera -- CAN THIET: vet ban bay THANG RA XA nen nhin tu duoi, chieu dai
     cua no khong dong gop gi vao kich thuoc tren man hinh ca. Keo dai bao nhieu cung vo
     ich. Thu duy nhat doc duoc la BE NGANG, ma be ngang co dinh trong the gioi thi o xa
     lai teo di con 2-3px. Nen be ngang duoc tinh nguoc lai tu cu ly toi camera de no giu
     nguyen mot ti le man hinh -- dung cach moi game ve tracer (docs/18 loi #76). */
  update(dt, cam) {
    const heSo = cam ? 2 * Math.tan((cam.fov * Math.PI) / 360) * this.beNgangMan : 0;
    for (const p of this.list) {
      if (!p.on) continue;
      if (p.left > 0) {
        const step = Math.min(p.left, p.sp * dt);
        p.x += p.dx * step; p.y += p.dy * step; p.z += p.dz * step;
        p.left -= step;
      } else {
        p.duoi -= dt;                       // toi noi roi: nam yen va mo dan
        p.mo = Math.max(0, p.duoi / 0.07);
        if (p.duoi <= 0) p.on = false;
      }
      if (cam) {
        const d = Math.hypot(p.x - cam.position.x, p.y - cam.position.y, p.z - cam.position.z);
        p.wVe = Math.max(p.w, d * heSo);    // khong bao gio nho hon be ngang that
      } else p.wVe = p.w;
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
      const wv = (p.wVe || p.w) * (0.35 + 0.65 * p.mo);
      this._s.set(wv, wv, p.l);
      this._m.compose(this._p, this._q, this._s);
      this.mesh.setMatrixAt(k, this._m);
      // mo dan bang instanceColor: material la Basic nen mau nhan thang vao mau goc
      col[k * 3] = p.c.r * p.mo; col[k * 3 + 1] = p.c.g * p.mo; col[k * 3 + 2] = p.c.b * p.mo;
      k++;
      if (k >= this.cap) break;
    }
    this.mesh.count = k;
    this.mesh.instanceMatrix.needsUpdate = true;
    this.mesh.instanceColor.needsUpdate = true;
  }

  clear() { for (const p of this.list) p.on = false; this.mesh.count = 0; }
}
