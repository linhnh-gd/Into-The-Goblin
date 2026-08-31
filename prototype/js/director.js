/* director.js — Wave Director theo Threat Points + chuoi phong + Suong Den + Nga Ba Ham.
   Do kho TU TANG theo R (phong) va w (wave). KHONG co dial cho nguoi choi (docs/08). */

import { GD } from './data.js';
import { tpBudget, countPerTP, hashSeed, rngFrom, pickWeighted } from './balance.js';
import { HALL_W } from './world.js';

export const HARD = () => GD.waves.directorRules.hardCaps;

export class Director {
  constructor(pool, juice, audio) {
    this.pool = pool;
    this.juice = juice;
    this.audio = audio;
    this.reset(1);
  }

  reset(depth) {
    this.depth = depth;
    this.room = 1;
    this.waveIdx = 0;
    this.wavesInRoom = 1;
    this.phase = 'idle';       // idle | spawning | fighting | cleared
    this.spawnQueue = [];
    this.spawnTimer = 0;
    this.waveDelay = 0;
    this.roomTime = 0;
    this.mistOn = false;
    this.mistLevel = 0;
    this.mistTimer = 0;
    this.doorTag = null;
    this.runIndex = Math.floor(Math.random() * 1e9);
  }

  get R() { return (this.depth - 1) * 10 + this.room; }
  get layout() { return GD.rooms.depthLayout[this.room - 1]; }
  get roomType() {
    const t = this.layout.type;
    if (t === 'random') return this.doorTag?.type || 'event';
    return t;
  }
  get isCombatRoom() {
    const t = this.roomType;
    return t === 'combat' || t === 'elite' || t === 'boss' || t === 'gauntlet';
  }
  get mistTriggerSec() {
    const bm = GD.waves.directorRules.blackMist;
    let s = this.room >= bm.deepRoomThreshold ? bm.triggerSecDeep : bm.triggerSec;
    if (this.doorTag?.tag === 'tối') s = bm.triggerSecDeep;
    if (this.mistBoost) s = 20;                  // the SAP HAM
    return s;
  }

  /* ---------------- bat dau 1 phong ----------------
     MO HINH QUANG DUONG (docs/07 muc 3.5): phong khong con "diet het moi qua" ma la
     CHAY HET roomDistanceM. Quai ra lien tuc doc duong, khong giet het cung khong sao.
     So wave = quang duong / waveSegmentM, va tpBudget(R, w) tang theo w
     -> wave sau tu dong dong hon, khong can dial. */
  beginRoom() {
    this.waveIdx = 0;
    this.roomTime = 0;
    this.mistOn = false;
    this.mistLevel = 0;
    this.mistTimer = 0;
    const RN = GD.feel.run;
    this.roomDist = RN.roomDistanceM;
    this.waveSegM = RN.waveSegmentM;
    this.roomStartZ = null;      // gan o lan update dau tien
    this.distRun = 0;
    const note = this.layout.note || '';
    if (!this.isCombatRoom) { this.wavesInRoom = 0; this.phase = 'cleared'; return; }
    // elite/boss: MOT wave lon trai dai ca quang duong. Con lai: chia theo doan.
    this.wavesInRoom = (this.roomType === 'elite' || this.roomType === 'boss')
      ? 1
      : Math.max(1, Math.round(this.roomDist / this.waveSegM));
    if (note.includes('3 wave')) this.wavesInRoom = Math.max(3, this.wavesInRoom);
    this.nextWave();
  }

  nextWave() {
    this.waveIdx++;
    const w = this.waveIdx;
    const seed = hashSeed('itg', this.runIndex, this.depth, this.room, w);
    const rnd = rngFrom(seed);

    const pool = GD.waves.waveTemplates.filter((t) => {
      if (t.minDepth > this.depth) return false;
      // Phong 1-2 cua moi Depth la WARM-UP (docs/07 muc 3.4): khong cho roll wave dong.
      // Prototype cho thay D1-R1 roll ra "Thuy Trieu" 29 con -> nguoi moi chet ngay.
      if (this.room <= 2 && t.tpMult > 1.05) return false;
      if (this.roomType === 'elite') return t.tpMult >= 1.4 && t.composition.some((c) => GD.byId[c.enemy]?.role === 'elite');
      if (this.roomType === 'gauntlet') return t.spawnPattern === 'flood' && t.tpMult >= 2;
      return t.tpMult < 1.4 && !t.composition.some((c) => GD.byId[c.enemy]?.role === 'elite');
    });
    let tpl = pool.length ? pickWeighted(pool, () => 1, rnd) : GD.waves.waveTemplates[0];
    // wave dau tien cua ca run: luon la wave day nham co ban
    if (this.depth === 1 && this.room === 1 && w === 1) {
      tpl = GD.waves.waveTemplates.find((t) => t.id === 'wv_dongchay') || tpl;
    }
    this.template = tpl;

    const tp = tpBudget(this.R, w, this.roomType, this.doorTag?.tag === 'đông');
    const target = Math.min(HARD().maxTotalAlive, Math.round(tp * countPerTP(tpl)));

    // phan bo so luong theo weight/tpCost, giu thu tu de gioi thieu 1 loai moi/phong
    this.spawnQueue = [];
    const parts = tpl.composition.map((c) => {
      const e = GD.byId[c.enemy];
      return { id: c.enemy, share: e && e.tpCost > 0 ? c.weight / e.tpCost : 0 };
    });
    const shareSum = parts.reduce((a, b) => a + b.share, 0) || 1;
    for (const p of parts) {
      const n = Math.max(1, Math.round((p.share / shareSum) * target));
      for (let i = 0; i < n; i++) this.spawnQueue.push(p.id);
    }
    // xao tron on dinh theo seed
    for (let i = this.spawnQueue.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      [this.spawnQueue[i], this.spawnQueue[j]] = [this.spawnQueue[j], this.spawnQueue[i]];
    }

    this.waveTargetCount = this.spawnQueue.length;
    this.waveQueueTotal = this.spawnQueue.length;
    this.waveStartDist = this.distRun;
    this.spawnPattern = tpl.spawnPattern;
    this.spawnRnd = rnd;
    this.phase = 'spawning';
    this.audio?.crowd(this.waveTargetCount);
    return { name: tpl.name, count: this.waveTargetCount, wave: w, of: this.wavesInRoom };
  }

  /* ---------------- update ---------------- */
  update(dt, px, pz, onMistHit) {
    this.roomTime += dt;
    if (this.roomStartZ === null) this.roomStartZ = pz;
    // huong tien la -z, nen quang duong da chay = roomStartZ - pz
    this.distRun = Math.max(0, (this.roomStartZ ?? pz) - pz);

    if (this.phase === 'spawning' || this.phase === 'fighting') {
      /* Ra quai theo QUANG DUONG, khong theo dong ho: chay nhanh thi gap quai som.
         Luy thua densityRampEnd > 1 -> cuoi doan dong hon dau doan (crescendo). */
      const seg = Math.max(0.001, this.waveSegM);
      const f = Math.min(1, Math.max(0, (this.distRun - this.waveStartDist) / seg));
      const want = Math.ceil(this.waveQueueTotal * Math.pow(f, GD.feel.run.densityRampEnd));
      const spawned = this.waveQueueTotal - this.spawnQueue.length;
      let budget = Math.max(0, want - spawned);
      while (budget-- > 0 && this.spawnQueue.length) {
        if (this.pool.aliveCount >= HARD().maxTotalAlive) break;
        this._spawnOne(this.spawnQueue.shift(), px, pz);
      }
      this.phase = this.spawnQueue.length ? 'spawning' : 'fighting';

      // HET QUANG DUONG = xong phong. KHONG con doi "diet het".
      if (this.distRun >= this.roomDist) {
        this.phase = 'cleared';
        this.mistOn = false;
        return { cleared: true, dist: this.distRun };
      }
      // sang doan sau
      if (f >= 1 && this.waveIdx < this.wavesInRoom) {
        return { newWave: this.nextWave() };
      }
    }

    /* ---- Suong Den ----
       Trong mo hinh quang duong nguoi choi KHONG THE cam phong, nen Suong Den mat ly do
       ton tai o phong thuong (xem docs/08 muc 4). Chi con hieu luc o phong tinh (boss). */
    const mistRooms = ['boss'];
    if (mistRooms.includes(this.roomType)) {
      if (this.phase !== 'cleared' && this.mistDelay > 0) this.mistDelay -= dt;
      const trigger = this.mistTriggerSec + Math.max(0, this.mistDelay || 0);
      if (this.phase !== 'cleared' && this.roomTime > trigger) {
        if (!this.mistOn) { this.mistOn = true; this.audio?.mist(); }
        const bm = GD.waves.directorRules.blackMist;
        this.mistLevel = Math.min(1, (this.roomTime - trigger) / (bm.vignetteStepSec * 12));
        this.mistTimer -= dt;
        if (this.mistTimer <= 0) {
          this.mistTimer = bm.spawnIntervalSec;
          const e = this.pool.spawn(bm.spawnEnemy, (Math.random() - 0.5) * (HALL_W - 2), pz + 6, this.R, 1);
          if (e) { e.z = pz + 7; onMistHit?.(); }
        }
      }
    }
    return null;
  }

  /* BA LAN (docs/09 muc 2d). Quai DUNG YEN nen x luc spawn la vinh vien:
       lan GIUA  (|x| <= lanes.midHalfWidthM) -> se va vao nguoi choi
       hai lan BEN                            -> nguoi choi chay qua, khong cham duoc

     Quai lan giua spawn quanh truc (jitter +-midSpawnJitterM) chu khong trai het ca
     lan: neu de mot con dung o x = 1.9 ma van gay dmg thi nguoi choi thay no di qua
     canh minh 1.9m roi mat mau -- doc ra nhu loi. Giua 0.9 va 2.0 la vung TRONG.

     KHOANG SPAWN: quai dung yen nen toc do tiep can = toc do chay. Moi pattern phai
     spawn xa hon tapNearM + minReactionSec * speedMps (audit co gate). */
  _spawnOne(id, px, pz) {
    const rnd = this.spawnRnd || Math.random;
    const LN = GD.feel.lanes;
    const pat = GD.waves.directorRules.spawnPatterns[this.spawnPattern] || {};
    const dist = pat.spawnDistM || [12, 21];

    const sideX = () => {
      const side = rnd() < 0.5 ? -1 : 1;
      return px + side * (LN.midHalfWidthM + 0.3 + rnd() * Math.max(0.1, LN.sideWidthM - 0.6));
    };
    const x = pat.lane === 'sides'
      ? sideX()
      : (rnd() < LN.midSpawnFrac ? px + (rnd() - 0.5) * 2 * LN.midSpawnJitterM : sideX());

    const z = pz - (dist[0] + rnd() * Math.max(0, dist[1] - dist[0]));

    const e = this.pool.spawn(id, x, z, this.R, this.waveIdx);
    if (!e) return e;
    e.lane = e.x;
    return e;
  }

  /* ---------------- Nga Ba Ham ---------------- */
  /** Sinh 2 cua theo forkPool + 4 rang buoc an (docs/08 muc 3). */
  makeFork(state) {
    const nextRoom = this.room + 1;
    const layout = GD.rooms.depthLayout[nextRoom - 1];
    if (!layout || !layout.forkPool) return null;

    const meta = {};
    for (const t of GD.rooms.fork.signTags) meta[t.tag] = t.meaning;

    let opts = layout.forkPool.map((s) => {
      const [type, tag] = s.split('+');
      return { type, tag, meaning: meta[tag] || '' };
    });

    const healTags = ['có suối', 'yên'];
    const shopTags = ['yên', 'có hòm'];
    const needHeal = state.hp / state.hpMax < 0.35;
    const needAmmo = state.reserve / state.reserveMax < 0.25;

    const rnd = rngFrom(hashSeed('fork', this.runIndex, this.depth, nextRoom));
    const shuffled = [...opts].sort(() => rnd() - 0.5);
    let a = shuffled[0];
    let b = shuffled.find((o) => o.tag !== a.tag) || shuffled[1] || shuffled[0];

    if (needHeal && ![a, b].some((o) => healTags.includes(o.tag))) {
      const heal = opts.find((o) => healTags.includes(o.tag));
      if (heal) b = heal; else b = { type: 'event', tag: 'có suối', meaning: meta['có suối'] };
    }
    if (needAmmo && ![a, b].some((o) => shopTags.includes(o.tag))) {
      const shop = opts.find((o) => shopTags.includes(o.tag));
      if (shop) b = shop; else b = { type: 'shop', tag: 'yên', meaning: meta['yên'] };
    }
    if (a.tag === b.tag) b = { type: 'event', tag: 'có suối', meaning: meta['có suối'] };

    // du bao so quai cua moi cua (talent Ban Do Ham bac 1)
    for (const o of [a, b]) {
      if (o.type === 'combat' || o.type === 'elite' || o.type === 'gauntlet') {
        const tpl = GD.waves.waveTemplates.find((t) => t.minDepth <= this.depth && t.tpMult < 1.4) || GD.waves.waveTemplates[0];
        const tp = tpBudget((this.depth - 1) * 10 + nextRoom, 1, o.type, o.tag === 'đông');
        o.est = Math.min(HARD().maxTotalAlive, Math.round(tp * countPerTP(tpl)));
      }
      o.goldMult = o.tag === 'đông' ? 1.25 : o.tag === 'tối' ? 1.3 : 1.0;
      o.hot = ['đông', 'tối', 'hẹp', 'có Elite'].includes(o.tag);
    }
    return [a, b];
  }

  advance(door) {
    this.doorTag = door || null;
    this.room++;
    if (this.room > 10) { this.room = 1; this.depth++; return { newDepth: this.depth }; }
    return {};
  }
}
