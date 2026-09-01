/* world.js — hanh lang ham, biome theo Depth, duoc + suong mu.
   Art direction docs/15: nen gan nhu den, VANG la mau am duy nhat,
   quai o dai Xa chi thay bong + mat do (suong mu che LOD). */

import * as THREE from 'three';
import { GD } from './data.js';

export const ROOM_SPACING = 22;   // m giua 2 diem dung
// Chieu rong hanh lang: doc tu data (lanes.hallWidthM). Day la con so quyet dinh bao nhieu
// phan khung nhin la lan giua, nen audit phai tinh duoc tu no.
export const hallW = () => GD.feel.lanes.hallWidthM;
export const HALL_W = 6.5;        // chi dung khi data chua nap
export const HALL_H = 4.6;

/** Biome 7 Depth — lay tu data/depths.json (name/biome) nhung mau thi o day. */
const BIOMES = [
  { fog: 0x0b0d10, wall: 0x2b3038, floor: 0x1a1e24, light: 0xffc53d, i: 34 }, // D1 Ham Da
  { fog: 0x0a0b0d, wall: 0x2e2a26, floor: 0x1c1917, light: 0xffb45c, i: 31 }, // D2 Mo Cu
  { fog: 0x070d10, wall: 0x24343a, floor: 0x16211f, light: 0x7fe3ff, i: 29 }, // D3 Hang Nam
  { fog: 0x120a08, wall: 0x3a2a22, floor: 0x241612, light: 0xff8a3d, i: 40 }, // D4 Xuong Ren
  { fog: 0x08090c, wall: 0x262a33, floor: 0x14161b, light: 0xffd08a, i: 24 }, // D5 Nha Tu
  { fog: 0x0e0a12, wall: 0x332b3d, floor: 0x1e1826, light: 0xffc53d, i: 37 }, // D6 Den Vang
  { fog: 0x140606, wall: 0x40201c, floor: 0x270f0d, light: 0xff5a3c, i: 44 },  // D7 Loi Do
];

export class World {
  constructor(renderer) {
    this.renderer = renderer;
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x0b0d10, 0.055);

    // Hinh hoc khung nhin lay tu data/gamefeel.json khoi "camera": audit TU TINH tu day
    // xem quai o tapNearM roi vao bao nhieu %% chieu cao man hinh (hop dong docs/03 muc 5).
    const CAM = GD.feel.camera;
    this.CAM = CAM;
    this.camera = new THREE.PerspectiveCamera(CAM.fovDegVertical, 1, 0.1, 90);
    this.camera.position.set(0, CAM.heightM, 0);
    this.camPitch = THREE.MathUtils.degToRad(-CAM.pitchDegDown);

    // three r155+ dung don vi vat ly: PointLight intensity la candela va giam theo 1/d^decay.
    // Gia tri 1.35 nhu ban dau cho ra hanh lang DEN THUI -- phai la hang chuc.
    this.scene.add(new THREE.AmbientLight(0x3a4250, 0.42));
    this.torch = new THREE.PointLight(0xffc53d, 34, 30, 1.7);
    this.torch.position.set(0, 1.9, 0.4);
    this.scene.add(this.torch);

    this.scene.add(this.camera);   // bat buoc: con cua camera (model sung) moi duoc render
    this._buildTunnel();
    this.setDepth(1);
  }

  _buildTunnel() {
    const LEN = 420;
    const HW = hallW();
    // Hanh lang TAI SU DUNG: nguoi choi chay lien tuc nen z tang khong gioi han.
    // Truoc day standZ(20) = -440 da nam NGOAI san dai 420m -> roi ra ngoai the gioi.
    const g = (this.tunnelGroup = new THREE.Group());
    this.scene.add(g);
    this.RIB_STEP = 5.5;
    const mkMat = (c) => new THREE.MeshLambertMaterial({ color: c });
    this.matWall = mkMat(0x2b3038);
    this.matFloor = mkMat(0x1a1e24);

    const floor = new THREE.Mesh(new THREE.PlaneGeometry(HW, LEN), this.matFloor);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, 0, -LEN / 2 + 20);
    g.add(floor);

    const ceil = new THREE.Mesh(new THREE.PlaneGeometry(HW, LEN), this.matWall);
    ceil.rotation.x = Math.PI / 2;
    ceil.position.set(0, HALL_H, -LEN / 2 + 20);
    g.add(ceil);

    for (const sx of [-1, 1]) {
      const w = new THREE.Mesh(new THREE.PlaneGeometry(LEN, HALL_H), this.matWall);
      w.rotation.y = sx > 0 ? -Math.PI / 2 : Math.PI / 2;
      w.position.set((sx * HW) / 2, HALL_H / 2, -LEN / 2 + 20);
      g.add(w);
    }

    // Vong chong ham moi 5.5m: cho cam giac DI CHUYEN doc theo truc Z.
    const ribGeo = new THREE.BoxGeometry(0.42, 0.42, 0.42);
    this.matRib = new THREE.MeshLambertMaterial({ color: 0x4a4034 });
    const per = 14;
    const n = Math.floor(LEN / 5.5);
    this.ribs = new THREE.InstancedMesh(ribGeo, this.matRib, n * per);
    const m = new THREE.Matrix4();
    let k = 0;
    for (let i = 0; i < n; i++) {
      const z = 20 - i * 5.5;
      for (let j = 0; j < per; j++) {
        const t = j / (per - 1);
        let x, y;
        if (t < 0.4) { x = -HW / 2 + 0.25; y = t / 0.4 * HALL_H; }
        else if (t < 0.6) { x = -HW / 2 + 0.25 + ((t - 0.4) / 0.2) * (HW - 0.5); y = HALL_H - 0.2; }
        else { x = HW / 2 - 0.25; y = (1 - (t - 0.6) / 0.4) * HALL_H; }
        m.makeTranslation(x, y, z);
        this.ribs.setMatrixAt(k++, m);
      }
    }
    this.ribs.count = k;
    this.ribs.instanceMatrix.needsUpdate = true;
    g.add(this.ribs);
    /* VACH LAN tren san. Bat buoc phai co: luat "chi quai lan giua gay dmg" chi cong
       bang khi nguoi choi NHIN THAY duoc ranh gioi lan. Khong co vach thi viec con nao
       nguy hiem la thong tin an. */
    const LN = GD.feel.lanes;
    this.matLane = new THREE.MeshBasicMaterial({ color: 0xffc53d, transparent: true, opacity: LN.markerOpacity });
    for (const sx of [-1, 1]) {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(LN.markerWidthM, LEN), this.matLane);
      m.rotation.x = -Math.PI / 2;
      m.position.set(sx * LN.midHalfWidthM, 0.012, -LEN / 2 + 20);
      g.add(m);
    }
  }

  setDepth(d) {
    const b = BIOMES[Math.min(BIOMES.length, Math.max(1, d)) - 1];
    this.scene.fog.color.setHex(b.fog);
    this.renderer.setClearColor(b.fog, 1);
    this.matWall.color.setHex(b.wall);
    this.matFloor.color.setHex(b.floor);
    this.torch.color.setHex(b.light);
    this.matLane.color.setHex(b.light);
    this.torchBase = b.i;
    this.torch.intensity = b.i;
  }

  /** Cua "toi": dai Xa chi con mat do, duoc thu ban kinh 40% (docs/15 muc 3). */
  setDark(on) {
    this.dark = on;
    this.torch.distance = on ? 14 : 30;
    this.torch.intensity = this.torchBase * (on ? 0.5 : 1);
    this.scene.fog.density = on ? 0.12 : 0.055;
  }

  /** z cua diem dung o phong thu i (0-based). */
  standZ(i) { return -i * ROOM_SPACING; }

  /** Cap nhat camera: vi tri + lac lu khi di + rung. */
  update(playerZ, bob, shake) {
    // treadmill: keo ca hanh lang theo nguoi choi; ribs dich theo boi so RIB_STEP
    // nen chung dung YEN trong the gioi -> van thay minh dang di chuyen.
    this.tunnelGroup.position.z = playerZ;
    this.ribs.position.z = -playerZ + Math.round(playerZ / this.RIB_STEP) * this.RIB_STEP;
    const c = this.camera;
    c.position.z = playerZ;
    c.position.y = this.CAM.heightM + bob;
    c.rotation.set(this.camPitch + shake.y * 0.0016, shake.x * 0.0012, shake.roll || 0);
    this.torch.position.set(shake.x * 0.004, 1.9, playerZ + 0.4);
  }

  /* ===================== HAI CANH CUA O VACH DICH =====================
     Truoc day chay het 150m la nguoi choi DUNG SUNG lai giua mot dam quai con song, roi
     mot lop UI phu len tren -- vach dich khong he co hinh hai gi trong the gioi. Nguoi
     choi khong "toi" dau ca, ho chi bi mot cai menu chan lai.
     Gio cuoi hanh lang la mot BUC TUONG CO HAI CUA: nhin thay tu xa, chay toi duoc, va
     no cho dam quai mot ly do de giai tan. Nga Ba Ham von da la mot lua chon KHONG GIAN
     (docs/12) -- de no song trong khong gian that thi khong phai day gi ca. */
  showDoors(z, nhanA, nhanB) {
    this.hideDoors();
    const HW = hallW(), H = 4.2;
    const g = (this.doorGroup = new THREE.Group());
    g.position.z = z;
    this.scene.add(g);

    const matTuong = new THREE.MeshLambertMaterial({ color: this.matWall.color.getHex() });
    const matKhung = new THREE.MeshLambertMaterial({ color: 0x2a2018 });
    /* HAI CUA PHAI CUNG NAM TRONG MOT KHUNG NHIN. Man dung: fov 72 do la fov DOC, con
       be ngang thi hep hon nhieu (ti le ~0.46) -- o 3m truoc tuong chi thay duoc 2.1m
       be ngang, tuc khong thay noi mot canh cua chu dung noi hai. Nen cua phai ke sat
       nhau hon va nguoi choi phai dung XA hon (doorStopGapM). */
    const DW = 2.2, DH = 2.9, DX = 1.8;             // tam cua cach truc 1.8m
    const beRong = HW / 2 - DX - DW / 2;            // manh tuong ngoai cung
    const truGiua = 2 * (DX - DW / 2);              // tru giua hai cua

    const tuong = (w, h, x, y) => {
      if (w <= 0.01) return;
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.6), matTuong);
      m.position.set(x, y, 0); g.add(m);
    };
    tuong(beRong, H, -HW / 2 + beRong / 2, H / 2);
    tuong(beRong, H, HW / 2 - beRong / 2, H / 2);
    tuong(truGiua, H, 0, H / 2);
    tuong(HW, H - DH, 0, DH + (H - DH) / 2);        // xa tren dau hai cua

    for (const [sx, nhan] of [[-1, nhanA], [1, nhanB]]) {
      const x = sx * DX;
      // khung cua
      for (const dx of [-DW / 2, DW / 2]) {
        const m = new THREE.Mesh(new THREE.BoxGeometry(0.16, DH, 0.7), matKhung);
        m.position.set(x + dx, DH / 2, 0.06); g.add(m);
      }
      const tren = new THREE.Mesh(new THREE.BoxGeometry(DW + 0.32, 0.18, 0.7), matKhung);
      tren.position.set(x, DH, 0.06); g.add(tren);
      /* LONG CUA SANG: mot o toi giua mot buc tuong toi thi khong doc ra la "di duoc".
         Anh sang la thu duy nhat noi duoc "loi di o day" ma khong can chu. */
      /* MAU: `15` dat luat vang la MAU AM DUY NHAT cua game, nen khong duoc bia them mot
         mau thu hai cho cua "nguy hiem" -- no se pha chinh cai luat lam Goblin Vang doc
         duoc. Hai cua deu vang, cua NONG chi lech sang phia do hon: van trong ho vang,
         nhung mat doc ra ngay la khong giong nhau. */
      const mau = nhan?.hot ? 0xff8a2b : 0xffc53d;
      /* `fog: false` -- va day moi la thu lam cua nhin thay duoc tu xa. Suong o mat do
         0.055 thi o 31m da che 94%: cua co dung do that nhung nguoi choi khong thay gi
         ca, va "hien ra som" thanh vo nghia. Long cua la mot NGON DEN, khong phai mot
         mang tuong -- den thi phai xuyen qua suong (docs/18 loi #81). */
      const long = new THREE.Mesh(new THREE.PlaneGeometry(DW, DH),
        new THREE.MeshBasicMaterial({ color: mau, transparent: true, opacity: 0.34, fog: false }));
      long.position.set(x, DH / 2, -0.25); g.add(long);
      const khung2 = new THREE.Mesh(new THREE.PlaneGeometry(DW + 0.5, DH + 0.3),
        new THREE.MeshBasicMaterial({ color: mau, transparent: true, opacity: 0.10, fog: false }));
      khung2.position.set(x, DH / 2, -0.3); g.add(khung2);
      const den = new THREE.PointLight(mau, 26, 16, 1.6);
      den.position.set(x, DH * 0.75, 1.2); g.add(den);
    }
    this.doorZ = z;
  }

  hideDoors() {
    if (!this.doorGroup) return;
    this.scene.remove(this.doorGroup);
    this.doorGroup.traverse((o) => { o.geometry?.dispose(); });
    this.doorGroup = null;
  }

  resize(w, h) {
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }
}
