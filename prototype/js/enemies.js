/* enemies.js — pool quai instanced + HANH VI RIENG doc tu data/enemies.json.
   (feel mat do quai tham chieu tu Guns 'n Goblins -- CHI feel, khong lay co che nao)

   Nhan dang bang SILHOUETTE + MAT DO, khong bang texture (docs/09 nguyen tac 2)
   -> LOD thap khong bi phat hien, va chay duoc 240 agent.

   Hanh vi rieng (docs/09, field `behavior` trong data):
     kind "shield" -> Goblin Khien: khien chan chinh dien, ho 0.8s moi 4s, quay CHAM
                      nen vong ra sau lung (Xoc Toi) la counter that. Bua/axit/chem
                      nang bo qua khien.
     kind "slam"   -> Ogre Ham: don AoE co vong canh bao tren san, telegraph 0.6s,
                      yeu diem o bung (tap vao nua duoi hitbox = x2.0). */

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
const D2R = Math.PI / 180;
const RUNCFG = () => GD.feel.run;

function wrapAngle(a) {
  while (a > Math.PI) a -= Math.PI * 2;
  while (a < -Math.PI) a += Math.PI * 2;
  return a;
}

export class EnemyPool {
  constructor(scene) {
    this.scene = scene;
    this.list = [];
    for (let i = 0; i < CAP; i++) {
      this.list.push({
        alive: false, id: '', role: '', x: 0, z: 0, hp: 0, maxHp: 0, dmg: 0, speed: 0, kbResist: 0,
        vx: 0, vz: 0, scale: 1, color: 0, eye: 0, atk: 0, tele: 0, flash: 0, gold: 0,
        face: 0, turnRate: 6, behav: null, atkRange: ATTACK_RANGE, teleTime: TELEGRAPH,
        holds: false, acquired: false, sliceCd: 0, hx: 0, hz: 1, lane: 0,
        shieldUp: true, bcycle: 0, invuln: false, ringShown: false, committed: false,
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

    /* Khien: chi ve khi dang GIUONG. Bien mat trong 0.8s "ho" -> day chinh la
       tin hieu cho nguoi choi biet cua so tan cong (readability, docs/06 muc 4). */
    const SHIELD_CAP = 48;
    const shield = new THREE.BoxGeometry(0.66, 0.78, 0.09);
    this.matShield = new THREE.MeshBasicMaterial({ color: 0x6d7a92 });
    this.shields = new THREE.InstancedMesh(shield, this.matShield, SHIELD_CAP);
    this.shields.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.shields.frustumCulled = false;
    this.shields.count = 0;
    this.shieldCap = SHIELD_CAP;
    scene.add(this.shields);

    this._m = new THREE.Matrix4();
    this._q = new THREE.Quaternion();
    this._v = new THREE.Vector3();
    this._c = new THREE.Color();
    this._axisY = new THREE.Vector3(0, 1, 0);
    this._white = new THREE.Color(1, 1, 1);
    this._red = new THREE.Color(0.55, 0.09, 0.06);
    this._openEye = new THREE.Color(1, 0.9, 0.35);
  }

  get aliveCount() {
    let k = 0;
    for (const e of this.list) if (e.alive) k++;
    return k;
  }

  countOf(id) {
    let k = 0;
    for (const e of this.list) if (e.alive && e.id === id) k++;
    return k;
  }

  spawn(typeId, x, z, R, w) {
    const def = GD.byId[typeId];
    if (!def) return null;
    const slot = this.list.find((e) => !e.alive);
    if (!slot) return null;
    const look = TYPE_LOOK[typeId] || DEFAULT_LOOK;
    const b = def.behavior || null;

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
    slot.scale = def.scale != null ? def.scale : look.s;
    slot.color = look.c;
    slot.eye = look.eye;
    slot.tele = 0;
    slot.flash = 0;
    slot.invuln = (def.tags || []).includes('invulnerable');
    slot.ringShown = false;
    slot.committed = false;

    slot.behav = b;
    slot.face = 0;                                   // 0 = nhin ve +Z (ve phia nguoi choi)
    slot.turnRate = (b && b.turnRateDeg ? b.turnRateDeg : 360) * D2R;
    /* Quai DUNG LAI de danh (ranged + slam) phai dung o khoang con TAP DUOC:
       clamp len run.tapNearM. Quai ranged khong co truong tam ban trong data nen
       truoc day dung ATTACK_RANGE 1.2m -- tuc "quai nem da" di tan sat mat moi nem. */
    slot.holds = def.role === 'ranged' || !!(b && b.kind === 'slam');
    slot.acquired = false;
    slot.hx = 0; slot.hz = 1;                          // huong DI THANG, co dinh tu luc spawn
    slot.lane = x;                                     // lan spawn: separation khong duoc pha vo no
    slot.sliceCd = 0;
    const rawRange = b && b.attackRangeM ? b.attackRangeM
      : def.role === 'ranged' ? RUNCFG().rangedStandoffM : ATTACK_RANGE;
    slot.atkRange = slot.holds ? Math.max(rawRange, RUNCFG().tapNearM) : rawRange;
    slot.teleTime = b && b.telegraphSec ? b.telegraphSec : TELEGRAPH;
    slot.atk = (b && b.cooldownSec ? b.cooldownSec : 1.15) * (0.5 + Math.random() * 0.5);
    slot.bcycle = b && b.kind === 'shield' ? Math.random() * b.cycleSec : 0;
    slot.shieldUp = true;
    return slot;
  }

  /** Day cac con dang chong len nhau ra xa.
      LUC DAY NGANG BI GIAM (sepLateralMult) va co LANE SPRING keo ve lan cu: quai di
      thang theo lan, ma separation day ngang manh thi lan bi xoa sach -- do thuc te
      cho thay 5 con cach nhau 0.7m bi day tu x=1.5 sang x=-0.21. Khi do co che
      "quai o ria di thang qua" khong con dung nua. Day doc (+-z) thi giu nguyen:
      quai cung lan xep hang sau nhau, dung nhu mong muon. */
  _separate(dt) {
    const RN = GD.feel.run;
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
            e.x += (dx / d) * f * RN.sepLateralMult;
            e.z += (dz / d) * f;
          }
        }
      }
      // keo ve lan cu (chi voi quai di song song hanh lang; quai cheo giu nguyen duong cheo)
      if (e.hx === 0) e.x += (e.lane - e.x) * Math.min(1, RN.laneSpringPerSec * dt);
      const lim = 4.0;
      if (e.x < -lim) e.x = -lim;
      if (e.x > lim) e.x = lim;
    }
  }

  /**
   * @param {object} fx { onTelegraph(e), onSlam(e, hitPlayer), onShieldOpen(e) }
   * @returns {number} tong damage giang vao nguoi choi trong frame nay
   */
  update(dt, px, pz, fx) {
    const RN = GD.feel.run;
    let dmgToPlayer = 0;
    for (const e of this.list) {
      if (!e.alive) continue;

      // knockback decay
      e.x += e.vx * dt;
      e.z += e.vz * dt;
      e.vx *= Math.pow(0.02, dt);
      e.vz *= Math.pow(0.02, dt);

      const dx = px - e.x;
      const dzp = pz - e.z;
      const dist = Math.hypot(dx, dzp) || 1;

      /* ---- huong quay ----
         Quai DI THANG (docs/09 muc 2d): chung khong lai theo nguoi choi, nen huong
         cua chung la truc chay (+Z), khong phai huong toi nguoi choi.
         Ngoai le: quai DUNG LAI de danh (ranged / slam) co ngam, nen quay ve nguoi choi.
         Gioi han toc do quay van con y nghia cho Goblin Khien: nguoi choi o lan khac
         thi da tu dong danh vao suon khien no -- hinh hoc lo viec, khong can counter giay. */
      const want = e.holds ? Math.atan2(dx, dzp) : Math.atan2(e.hx, e.hz);
      const diff = wrapAngle(want - e.face);
      const maxTurn = e.turnRate * dt;
      e.face = wrapAngle(e.face + Math.max(-maxTurn, Math.min(maxTurn, diff)));

      /* ---- chu ky khien ---- */
      if (e.behav && e.behav.kind === 'shield') {
        e.bcycle = (e.bcycle + dt) % e.behav.cycleSec;
        const wasUp = e.shieldUp;
        e.shieldUp = e.bcycle > e.behav.openSec;
        if (wasUp && !e.shieldUp) fx?.onShieldOpen?.(e);
      }

      /* ---- di chuyen / tan cong ----
         HAI KIEU TIEN (docs/09 muc 2c):
           DUNG LAI (holds): quai ranged va quai co don AoE telegraph (slam). Chung
             PLANT o atkRange roi danh tu do. atkRange luon >= run.tapNearM.
           XONG TOI (charger): moi loai con lai, tien den contactM.

         NHUNG DIEU NAY AP CHO CA HAI: nguoi choi luon chay tien, nen moi con roi cung
         bi vuot qua. Con nao khong bi giet kip thi VA vao nguoi choi, gay dmg mot lan
         roi BIEN MAT -- khong con nao duoc phep dung lai chan duong chay.

         Truoc day moi con dung o atkRange 1.2m, ma o 1.2m diem tap roi vao 92.7% chieu
         cao man hinh (duoi nut NAP) -> khong the tan cong. Xem docs/18 muc 4 loi #9.

         COMMIT: quai dang trong telegraph thi KHONG bien mat -- don cua no van ra, dung
         nhu hop dong o docs/09 muc 2b. Khong co ngoai le nay thi chay tien se HUY don
         AoE thay vi phai NE no. */
      /* zGap = khoang cach DOC theo truc chay. Duong = quai con o phia truoc. */
      const zGap = pz - e.z;
      const laneHalf = RN.contactHalfWidthM + 0.30 * e.scale;
      const inLane = Math.abs(e.x - px) <= laneHalf;
      const stopAt = e.holds ? e.atkRange : RN.contactM;
      const behind = -zGap;

      if (!e.holds && Math.abs(zGap) <= RN.contactM && inLane && !e.committed) {
        /* VA VAO NGUOI CHOI: gay dmg MOT lan roi BIEN MAT.
           CHI khi cung LAN (inLane). Quai di o hai ben ria di thang qua nguoi choi va
           khong lam gi ca -- giet chung la vang THEM, khong phai bat buoc (docs/09 muc 2d).
           Khong roi vang khi va: nguoi choi khong giet no, chi bi no huc phai. */
        dmgToPlayer += e.dmg;
        fx?.onContact?.(e);
        e.alive = false;
        continue;
      } else if (!e.holds || zGap > stopAt) {
        /* DI THANG. Quai KHONG lai theo nguoi choi: x giu nguyen, chi tien theo +Z.
           Day la ly do quai o ria bo qua duoc, va cung la ly do dam quai trai deu ra
           ca chieu rong hanh lang thay vi don thanh mot cuc truoc mat. */
        e.x += e.hx * e.speed * dt;
        e.z += e.hz * e.speed * dt;
        e.tele = 0;
        e.ringShown = false;
      } else if (behind > RN.contactM && !e.committed) {
        /* Quai PLANT da bi vuot qua: di thang tiep, va KHONG duoc ban tu phia sau man
           hinh -- cho nguoi choi khong the thay va khong the giet no. */
        e.x += e.hx * e.speed * dt;
        e.z += e.hz * e.speed * dt;
        e.tele = 0;
        e.ringShown = false;
      } else {
        /* Quai PLANT vua vao tam: bat dau telegraph NGAY.
           Cua so tu luc vao tam den luc bi don chi la (atkRange - contactM)/speed.
           Neu de atk khoi tao ngau nhien 1.3-2.6s thi nguoi choi chay qua TRUOC khi
           no kip vung -> don dac trung cua Ogre khong bao gio thay duoc. */
        if (!e.acquired) { e.acquired = true; e.atk = Math.min(e.atk, e.teleTime); }
        e.atk -= dt;
        e.tele = e.atk <= e.teleTime ? Math.max(0, e.teleTime - e.atk) : 0;
        if (e.tele > 0) e.committed = true;

        // vong canh bao tren san cho don AoE — ve NGAY khi telegraph bat dau
        if (e.behav && e.behav.kind === 'slam' && e.tele > 0 && !e.ringShown) {
          e.ringShown = true;
          fx?.onTelegraph?.(e);
        }

        if (e.atk <= 0) {
          e.atk = e.behav && e.behav.cooldownSec ? e.behav.cooldownSec : 1.15;
          e.tele = 0;
          e.ringShown = false;
          e.committed = false;
          if (e.behav && e.behav.kind === 'slam') {
            /* Hop dong so (docs/09 muc 2b): contactM <= aoeRadius < contactM + dodgeM.
               Nho vay dung im la AN don, va Buoc Lui dung luc thi LUON ne duoc. */
            const hit = dist <= e.behav.aoeRadiusM;
            if (hit) dmgToPlayer += e.dmg;
            fx?.onSlam?.(e, hit);
          } else {
            dmgToPlayer += e.dmg;
          }
        }
      }

      // bo con da bi vuot qua qua xa (khong roi vang: nguoi choi khong giet chung)
      if (behind > RN.despawnBehindM) { e.alive = false; continue; }
      if (e.sliceCd > 0) e.sliceCd -= dt;
      if (e.flash > 0) e.flash = Math.max(0, e.flash - dt * 6);
    }
    this._separate(dt);
    this._writeInstances();
    return dmgToPlayer;
  }

  _writeInstances() {
    let k = 0, sh = 0;
    const bodyCol = this.bodies.instanceColor.array;
    const eyeCol = this.eyes.instanceColor.array;
    for (const e of this.list) {
      if (!e.alive) continue;
      const s = e.scale;
      const lean = e.tele > 0 ? Math.min(0.22, e.tele * 0.5) : 0;
      const fwdX = Math.sin(e.face), fwdZ = Math.cos(e.face);
      this._q.setFromAxisAngle(this._axisY, e.face);

      this._m.compose(
        this._v.set(e.x, 0.51 * s - lean * 0.08, e.z),
        this._q, { x: s, y: s * (1 - lean * 0.3), z: s }
      );
      this.bodies.setMatrixAt(k, this._m);

      this._c.setHex(e.color);
      if (e.flash > 0) this._c.lerp(this._white, Math.min(1, e.flash));
      if (e.tele > 0.12) this._c.lerp(this._red, 0.5);
      bodyCol[k * 3] = this._c.r; bodyCol[k * 3 + 1] = this._c.g; bodyCol[k * 3 + 2] = this._c.b;

      this._m.compose(
        this._v.set(e.x + fwdX * 0.23 * s, 0.86 * s, e.z + fwdZ * 0.23 * s),
        this._q, { x: s, y: s, z: s }
      );
      this.eyes.setMatrixAt(k, this._m);
      // khien dang HO -> mat sang vang: tin hieu "danh duoc bay gio"
      const openWindow = e.behav && e.behav.kind === 'shield' && !e.shieldUp;
      this._c.setHex(e.eye);
      if (openWindow) this._c.lerp(this._openEye, 0.85);
      eyeCol[k * 3] = this._c.r; eyeCol[k * 3 + 1] = this._c.g; eyeCol[k * 3 + 2] = this._c.b;
      k++;

      if (e.behav && e.behav.kind === 'shield' && e.shieldUp && sh < this.shieldCap) {
        this._m.compose(
          this._v.set(e.x + fwdX * 0.34 * s, 0.55 * s, e.z + fwdZ * 0.34 * s),
          this._q, { x: s, y: s, z: s }
        );
        this.shields.setMatrixAt(sh++, this._m);
      }
    }
    this.bodies.count = k;
    this.eyes.count = k;
    this.shields.count = sh;
    this.bodies.instanceMatrix.needsUpdate = true;
    this.eyes.instanceMatrix.needsUpdate = true;
    this.shields.instanceMatrix.needsUpdate = true;
    this.bodies.instanceColor.needsUpdate = true;
    this.eyes.instanceColor.needsUpdate = true;
  }

  /**
   * Gay damage.
   * @param {object} o {kx,kz,kbForce,source:'ranged'|'melee',archetype,heavy,weakPoint,px,pz}
   * @returns {object|false} object mo ta cai chet, hoac {alive:true,...}, hoac false
   */
  damage(e, amount, o) {
    if (!e.alive) return false;
    const kx = o.kx || 0, kz = o.kz || 0, kbForce = o.kbForce || 0;

    if (e.invuln) {
      // Bong Ham: khong giet duoc, chi day duoc (docs/09)
      const r = 1 - e.kbResist;
      e.vx += kx * kbForce * r * 2.4;
      e.vz += kz * kbForce * r * 2.4;
      e.flash = 0.5;
      return { alive: true, dmgDealt: 0, blocked: true, invuln: true };
    }

    let dmg = amount;
    let kbResist = e.kbResist;
    let blocked = false;
    let flanked = false;
    const b = e.behav;

    /* ---------- KHIEN ---------- */
    if (b && b.kind === 'shield') {
      const toPX = (o.px ?? 0) - e.x, toPZ = (o.pz ?? 0) - e.z;
      const len = Math.hypot(toPX, toPZ) || 1;
      const dot = (toPX / len) * Math.sin(e.face) + (toPZ / len) * Math.cos(e.face);
      const frontal = dot > b.frontalDot;
      const bypass =
        (b.bypassArchetypes || []).includes(o.archetype) ||
        (b.bypassHeavySlash && o.heavy);

      if (e.shieldUp && frontal && !bypass) {
        if (o.source === 'ranged') { dmg *= b.frontRangedMult; blocked = true; }
        kbResist = e.kbResist;                     // khien chan luc day
      } else {
        kbResist = b.kbResistBack;                 // ho khien / sau lung / bi pha
        flanked = !frontal;
      }
    }

    /* ---------- YEU DIEM (Ogre: bung, x2.0) ---------- */
    let weak = false;
    if (b && b.weakPointMult && o.weakPoint) { dmg *= b.weakPointMult; weak = true; }

    dmg = Math.max(1, Math.round(dmg));
    e.hp -= dmg;
    e.flash = 1;
    const r = 1 - kbResist;

    if (e.hp <= 0) {
      e.alive = false;
      // launch = kb * 2.2 * (1 - kbResist)  (docs/16 muc 4.9)
      return {
        x: e.x, z: e.z, scale: e.scale, color: e.color, gold: e.gold, role: e.role,
        maxHp: e.maxHp, id: e.id, dmgDealt: dmg, blocked, weak, flanked, killed: true,
        lx: kx * kbForce * 2.2 * r, lz: kz * kbForce * 2.2 * r,
      };
    }
    e.vx += kx * kbForce * r;
    e.vz += kz * kbForce * r;
    return { alive: true, dmgDealt: dmg, blocked, weak, flanked };
  }

  /** Nhat quai gan diem tap nhat trong hinh non aim-assist (do bang goc).
   *  weakPoint = tap vao NUA DUOI hitbox (bung) — dung cho Ogre. */
  pickByScreen(camera, sx, sy, w, h, coneDeg) {
    let best = null, bestD = Infinity, bestLow = false;
    const v = new THREE.Vector3();
    for (const e of this.list) {
      if (!e.alive) continue;
      v.set(e.x, 0.62 * e.scale, e.z).project(camera);
      if (v.z > 1) continue;
      const ex = (v.x * 0.5 + 0.5) * w;
      const ey = (-v.y * 0.5 + 0.5) * h;
      const dist = Math.hypot(ex - sx, ey - sy);
      const tol = (coneDeg / camera.fov) * h + 26 * e.scale;
      if (dist < tol && dist < bestD) {
        bestD = dist; best = e;
        bestLow = sy > ey + 6 * e.scale;
      }
    }
    return best ? { e: best, weakPoint: bestLow } : null;
  }

  /** Moi con trong hinh quat quanh huong quet (world space). */
  queryArc(px, pz, dirX, dirZ, reach, arcDeg, max) {
    const out = [];
    const half = (arcDeg / 2) * D2R;
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
