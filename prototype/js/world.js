/* world.js — hanh lang ham, biome theo Depth, duoc + suong mu.
   Art direction docs/15: nen gan nhu den, VANG la mau am duy nhat,
   quai o dai Xa chi thay bong + mat do (suong mu che LOD). */

import * as THREE from 'three';
import { GD } from './data.js';

export const ROOM_SPACING = 22;   // m giua 2 diem dung
export const HALL_W = 9;          // chieu rong hanh lang
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
    // Hanh lang TAI SU DUNG: nguoi choi chay lien tuc nen z tang khong gioi han.
    // Truoc day standZ(20) = -440 da nam NGOAI san dai 420m -> roi ra ngoai the gioi.
    const g = (this.tunnelGroup = new THREE.Group());
    this.scene.add(g);
    this.RIB_STEP = 5.5;
    const mkMat = (c) => new THREE.MeshLambertMaterial({ color: c });
    this.matWall = mkMat(0x2b3038);
    this.matFloor = mkMat(0x1a1e24);

    const floor = new THREE.Mesh(new THREE.PlaneGeometry(HALL_W, LEN), this.matFloor);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, 0, -LEN / 2 + 20);
    g.add(floor);

    const ceil = new THREE.Mesh(new THREE.PlaneGeometry(HALL_W, LEN), this.matWall);
    ceil.rotation.x = Math.PI / 2;
    ceil.position.set(0, HALL_H, -LEN / 2 + 20);
    g.add(ceil);

    for (const sx of [-1, 1]) {
      const w = new THREE.Mesh(new THREE.PlaneGeometry(LEN, HALL_H), this.matWall);
      w.rotation.y = sx > 0 ? -Math.PI / 2 : Math.PI / 2;
      w.position.set((sx * HALL_W) / 2, HALL_H / 2, -LEN / 2 + 20);
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
        if (t < 0.4) { x = -HALL_W / 2 + 0.25; y = t / 0.4 * HALL_H; }
        else if (t < 0.6) { x = -HALL_W / 2 + 0.25 + ((t - 0.4) / 0.2) * (HALL_W - 0.5); y = HALL_H - 0.2; }
        else { x = HALL_W / 2 - 0.25; y = (1 - (t - 0.6) / 0.4) * HALL_H; }
        m.makeTranslation(x, y, z);
        this.ribs.setMatrixAt(k++, m);
      }
    }
    this.ribs.count = k;
    this.ribs.instanceMatrix.needsUpdate = true;
    g.add(this.ribs);
  }

  setDepth(d) {
    const b = BIOMES[Math.min(BIOMES.length, Math.max(1, d)) - 1];
    this.scene.fog.color.setHex(b.fog);
    this.renderer.setClearColor(b.fog, 1);
    this.matWall.color.setHex(b.wall);
    this.matFloor.color.setHex(b.floor);
    this.torch.color.setHex(b.light);
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

  resize(w, h) {
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }
}
