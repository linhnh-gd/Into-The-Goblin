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
  /* GOBLIN VANG la con DUY NHAT khong phai bong den. Ca art direction (docs/15) dua tren
     "quai la bong den, VANG la mau am duy nhat" -- nen mot con quai mau vang nguyen khoi
     giua hanh lang toan bong den la thu choi ngay lap tuc, khong can icon hay mui ten. */
  en_special_goblinvang: { s: 0.92, c: 0xffc53d, eye: 0xfff3c4 },
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
        // giat nguoc khi trung don ma khong chet
        lurch: 0, lurchDur: 0, lurchAmt: 0, lurchX: 0, lurchZ: 0, kbBudget: 0,
        shimmer: false, shimPhase: 0,
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
    slot.lurch = 0; slot.lurchAmt = 0;
    slot.kbBudget = GD.feel.hitReaction.kbBudgetM;
    // con nao co dropsMagazines thi LAP LANH -- luat o data, khong hardcode id o day
    slot.shimmer = !!def.dropsMagazines;
    slot.shimPhase = Math.random() * Math.PI * 2;
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
    /* KHOA LA SO NGUYEN, khong phai chuoi. Ban cu dung `${cx},${cz}` -> moi frame de ra
       240 chuoi moi + 240 lan bam Map bang chuoi, o 60fps la 14.400 chuoi/giay chi de
       vut di. Do la nguon GC pause (frame xau nhat 3.9ms) va no chi lo ra dung luc dong
       quai -- tuc dung luc khong duoc phep giat. z co the am nen phai cong offset. */
    for (const e of this.list) {
      if (!e.alive) continue;
      const key = (Math.round(e.x / CELL) + 512) * 4096 + (Math.round(e.z / CELL) + 2048);
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
          const arr = grid.get((cx + ox + 512) * 4096 + (cz + oz + 2048));
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
      // quai dung yen: luon keo ve lan spawn, separation khong duoc lam lech lan
      e.x += (e.lane - e.x) * Math.min(1, RN.laneSpringPerSec * dt);
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
    const LN = GD.feel.lanes;
    let dmgToPlayer = 0;
    for (const e of this.list) {
      if (!e.alive) continue;

      // knockback decay + dem nguoc cu giat nguoc khi trung don
      const HR = GD.feel.hitReaction;
      e.x += e.vx * dt;
      e.z += e.vz * dt;
      const decay = Math.pow(HR ? HR.decayPerSec : 0.02, dt);
      e.vx *= decay;
      e.vz *= decay;
      if (e.lurch > 0) e.lurch = Math.max(0, e.lurch - dt);
      e.kbBudget = Math.min(HR.kbBudgetM, (e.kbBudget ?? HR.kbBudgetM) + HR.kbRefillMps * dt);

      const dx = px - e.x;
      const dzp = pz - e.z;
      const dist = Math.hypot(dx, dzp) || 1;

      /* ---- huong quay ----
         Quai DI THANG (docs/09 muc 2d): chung khong lai theo nguoi choi, nen huong
         cua chung la truc chay (+Z), khong phai huong toi nguoi choi.
         Ngoai le: quai DUNG LAI de danh (ranged / slam) co ngam, nen quay ve nguoi choi.
         Gioi han toc do quay van con y nghia cho Goblin Khien: nguoi choi o lan khac
         thi da tu dong danh vao suon khien no -- hinh hoc lo viec, khong can counter giay. */
      const want = Math.atan2(dx, dzp);      // dung yen cho nguoi choi -> luon huong ve phia no
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
      /* ---- QUAI DUNG YEN (docs/09 muc 2d) ----
         Quai khong di chuyen chut nao. Nguoi choi chay qua chung. He qua:
           - toc do tiep can = DUY NHAT toc do chay cua nguoi choi
           - "cua so phan ung" chi phu thuoc khoang cach spawn, khong phu thuoc speed quai
           - truong `speed` trong enemies.json khong con dieu khien gi (xem docs/09 muc 2d)

         BA LAN: chi quai o LAN GIUA moi va vao nguoi choi. Quai o hai lan ben dung
         yen cho nguoi choi chay qua va khong lam gi -- giet chung la vang THEM. */
      const zGap = pz - e.z;
      const inMidLane = Math.abs(e.x - px) <= LN.midHalfWidthM;
      const behind = -zGap;

      if (!e.holds && Math.abs(zGap) <= RN.contactM && inMidLane && !e.committed) {
        /* VA VAO NGUOI CHOI: dmg MOT lan roi BIEN MAT, khong roi vang
           (nguoi choi khong giet no, chi chay vao no). */
        dmgToPlayer += e.dmg;
        fx?.onContact?.(e);
        e.alive = false;
        continue;
      } else if (!e.holds || zGap > e.atkRange || behind > RN.contactM) {
        /* Dung yen: khong lam gi. Quai PLANT chua vao tam, hoac da bi chay qua
           (khong duoc ban tu phia sau man hinh -- nguoi choi khong the thay no). */
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
    this._t = (this._t || 0) + 1 / 60;        // dong ho rieng cho hieu ung lap lanh
    let k = 0, sh = 0;
    const bodyCol = this.bodies.instanceColor.array;
    const eyeCol = this.eyes.instanceColor.array;
    for (const e of this.list) {
      if (!e.alive) continue;
      const s = e.scale;
      const lean = e.tele > 0 ? Math.min(0.22, e.tele * 0.5) : 0;
      const fwdX = Math.sin(e.face), fwdZ = Math.cos(e.face);
      this._q.setFromAxisAngle(this._axisY, e.face);

      /* GIAT NGUOC khi trung don: dich ca than theo huong vien dan/luoi dao roi ve cho,
         kem NEN NGUOI. Day la thu duy nhat doc duoc o cu ly xa, vi 0.35m o 12m chi la
         vai pixel ngang nhung mot cu GIAT trong 0.16s thi mat bat duoc ngay. */
      let lx = 0, lz = 0, sqX = 1, sqY = 1;
      // Goblin Vang phinh nhe theo nhip lap lanh -- chuyen dong la thu ngoai vi bat duoc
      if (e.shimmer) {
        const p = 1 + 0.06 * Math.sin(this._t * 7.5 + e.shimPhase);
        sqX *= p; sqY *= p;
      }
      if (e.lurch > 0) {
        const HR = GD.feel.hitReaction;
        const p = e.lurch / (e.lurchDur || 1);            // 1 luc vua trung -> 0
        lx = (e.lurchX || 0) * (e.lurchAmt || 0) * p;
        lz = (e.lurchZ || 0) * (e.lurchAmt || 0) * p;
        sqY = 1 - HR.squash * p;
        sqX = 1 + HR.squash * 0.5 * p;
      }

      this._m.compose(
        this._v.set(e.x + lx, (0.51 * s - lean * 0.08) * sqY, e.z + lz),
        this._q, { x: s * sqX, y: s * (1 - lean * 0.3) * sqY, z: s * sqX }
      );
      this.bodies.setMatrixAt(k, this._m);

      this._c.setHex(e.color);
      /* LAP LANH: pha rieng cho tung con (`shimPhase`) nen ca dam khong nhap nhay cung
         nhip -- nhap nhay dong bo doc ra la "loi render", nhap nhay lech pha doc ra la
         "vang". Chi la lerp mau tren instanceColor, khong them draw call nao. */
      if (e.shimmer) {
        const s = 0.5 + 0.5 * Math.sin(this._t * 7.5 + e.shimPhase);
        this._c.lerp(this._white, 0.18 + 0.42 * s);
      }
      if (e.flash > 0) this._c.lerp(this._white, Math.min(1, e.flash));
      if (e.tele > 0.12) this._c.lerp(this._red, 0.5);
      bodyCol[k * 3] = this._c.r; bodyCol[k * 3 + 1] = this._c.g; bodyCol[k * 3 + 2] = this._c.b;

      this._m.compose(
        this._v.set(e.x + lx + fwdX * 0.23 * s, 0.86 * s * sqY, e.z + lz + fwdZ * 0.23 * s),
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
          this._v.set(e.x + lx + fwdX * 0.34 * s, 0.55 * s * sqY, e.z + lz + fwdZ * 0.34 * s),
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

  /* DAY QUAI, CO TRAN TOC DO.
     Knockback manh thi doi mot cau hoi: chem slide lien tuc co bien thanh tuong chan
     giu quai o ngoai tam mai mai khong? Co, neu khong co gi chan -- 1 nhat moi 0.22s
     x ~1.8m/nhat = 8 m/s, gap doi toc do chay 4.2 m/s.
     Tran o day KHONG phai la giam luc moi nhat (lam vay thi nhat dau tien cung yeu di,
     mat het cam giac "nay"), ma la NGAN SACH tinh bang MET: con quai co san kbBudgetM
     met de bi day, hoi lai kbRefillMps met/giay. Cu danh dau tien an nguyen luc; day
     lien tuc thi toc do lui bi keo ve dung kbRefillMps -- thap hon han toc do chay,
     nen nguoi choi LUON duoi kip. Het ngan sach thi van GIAT (lurch), chi khong lui. */
  _push(e, kx, kz, force) {
    const HR = GD.feel.hitReaction;
    const speed = force * HR.impulseMult;
    if (speed <= 0) return;
    // quang duong mot xung di duoc voi decay mu: v / ln(1/decay)
    const travel = speed / Math.log(1 / HR.decayPerSec);
    if (e.kbBudget == null) e.kbBudget = HR.kbBudgetM;
    const k = travel > 0 ? Math.min(1, e.kbBudget / travel) : 0;
    if (k <= 0) return;
    e.kbBudget = Math.max(0, e.kbBudget - travel * k);
    e.vx += kx * speed * k;
    e.vz += kz * speed * k;
  }

  /**
   * Gay damage.
   * @param {object} o {kx,kz,kbForce,source:'ranged'|'melee',archetype,heavy,weakPoint,px,pz}
   * @returns {object|false} object mo ta cai chet, hoac {alive:true,...}, hoac false
   */
  damage(e, amount, o) {
    if (!e.alive) return false;
    const kx = o.kx || 0, kz = o.kz || 0, kbForce = o.kbForce || 0;
    /* HUONG DAY LUI. Mac dinh: THANG RA SAU LUNG QUAI (doc hanh lang, ra xa nguoi choi),
       khong theo vector dan hay vector quet.
       Vi sao: hanh lang co BA LAN va chi lan giua gay damage. Day theo huong quet la day
       NGANG -- mot nhat chem ngang hat quai tu lan giua sang lan ben, tuc no am tham xoa
       moi de doa theo cach nguoi choi khong chu dinh va cung khong doc ra duoc. Day thang
       ra sau thi knockback chi lam dung mot viec: MUA THEM KHOANG CACH. Do cung la ca ly
       do ton tai cua shotgun (cong cu dan cach).
       XAC van bay theo vector quet -- xem cuoi ham. */
    const SB = GD.feel.hitReaction.pushStraightBack;
    const pkx = SB ? 0 : kx;
    const pkz = SB ? -1 : kz;

    if (e.invuln) {
      // Bong Ham: khong giet duoc, chi day duoc (docs/09)
      const r = 1 - e.kbResist;
      const HRi = GD.feel.hitReaction;
      this._push(e, pkx, pkz, kbForce * r * 2.4);
      e.lurchDur = e.lurch = HRi.lurchSec;
      e.lurchAmt = HRi.lurchDistM * Math.max(HRi.lurchMinFrac, r);
      e.lurchX = pkx; e.lurchZ = pkz;
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

    if (e.hp > 0) {
      /* TRUNG NHUNG KHONG CHET -- day la truong hop hay gap nhat va truoc day gan nhu
         khong co phan hoi nao ngoai flash trang. Hai lop:
           1. XUNG DAY THAT: nhan them impulseMult, vi xung goc (kbForce ~ 0.4-1.6) chi
              di duoc ~0.4m truoc khi tat, ma o cu ly 10m thi 0.4m la vai pixel.
           2. GIAT NGUOC (lurch): mot cu dich nguoi ngan 0.16s, doc lap voi decay va
              voi lane spring. Co san toi thieu lurchMinFrac nen ke ca Quy Ham
              (kbResist 0.90) van GIAT -- "khong day duoc" khac "khong phan ung". */
      const HR = GD.feel.hitReaction;
      e.lurchDur = HR.lurchSec;
      e.lurch = HR.lurchSec;
      e.lurchAmt = HR.lurchDistM * Math.max(HR.lurchMinFrac, r);
      e.lurchX = pkx; e.lurchZ = pkz;
      this._push(e, pkx, pkz, kbForce * r);
      return { alive: true, dmgDealt: dmg, blocked, weak, flanked };
    }

    // CHET: xac bay theo launch = kb * 2.2 * (1 - kbResist)  (docs/16 muc 4.9)
    e.alive = false;
    return {
      x: e.x, z: e.z, scale: e.scale, color: e.color, gold: e.gold, role: e.role,
      maxHp: e.maxHp, id: e.id, dmgDealt: dmg, blocked, weak, flanked, killed: true,
      lx: kx * kbForce * 2.2 * r, lz: kz * kbForce * 2.2 * r,
    };
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

  /** LUOI DAO KIEU CHEM HOA QUA: cat nhung con ma NGON TAY di qua tren man hinh.
      Thay cho hinh quat world-space. Ly do: hinh quat 110 do o tam 4.5m phu gan het
      chieu rong hanh lang, nen "chem lan trai" giet luon ca lan phai -- va trong che do
      chem lien tuc, moi doan ngon tay doi huong lai quet sang mot phia khac.
      Xem docs/18 loi #21. Model man hinh dung voi cai nguoi choi THAY. */
  queryBlade(camera, seg, reach, widthPx, max, w, h) {
    const out = [];
    const v = this._vb || (this._vb = new THREE.Vector3());
    const ax = seg.x0, ay = seg.y0;
    const abx = seg.x1 - ax, aby = seg.y1 - ay;
    const abLen2 = abx * abx + aby * aby;
    for (const e of this.list) {
      if (!e.alive) continue;
      const dwx = e.x - seg.px, dwz = e.z - seg.pz;
      const dw = Math.hypot(dwx, dwz);
      if (dw > reach + 0.27 * e.scale) continue;        // gioi han TAM trong world
      v.set(e.x, 0.62 * e.scale, e.z).project(camera);
      if (v.z > 1) continue;                             // sau lung camera
      const ex = (v.x * 0.5 + 0.5) * w;
      const ey = (-v.y * 0.5 + 0.5) * h;
      let t = abLen2 > 1e-6 ? ((ex - ax) * abx + (ey - ay) * aby) / abLen2 : 0;
      t = Math.max(0, Math.min(1, t));                   // ep vao trong DOAN, khong phai duong
      const dPx = Math.hypot(ex - (ax + abx * t), ey - (ay + aby * t));
      if (dPx <= widthPx + 26 * e.scale) out.push({ e, d: dw });
    }
    out.sort((a, b) => a.d - b.d);
    return out.slice(0, max).map((o) => o.e);
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
