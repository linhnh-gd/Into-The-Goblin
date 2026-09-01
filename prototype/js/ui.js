/* ui.js — HUD portrait + man hinh Cong (the + Nga Ba Ham) + ket run.
   Layout theo docs/14: moi nut nam trong vung ngon cai (55-100% chieu cao). */

import { GD } from './data.js';

const $ = (id) => document.getElementById(id);

export class UI {
  constructor() {
    this.el = {
      hud: $('hud'), screen: $('screen'),
      sheetTitle: $('sheetTitle'), sheetGate: $('sheetGate'), sheetEnd: $('sheetEnd'),
      luckVal: $('luckVal'), luckChip: $('luckChip'), posVal: $('posVal'),
      distVal: $('distVal'), distFill: $('distFill'),
      hpFill: $('hpFill'), hpTxt: $('hpTxt'),
      stamWrap: $('staminaWrap'), stamFill: $('staminaFill'),
      goldVal: $('goldVal'), gold: document.querySelector('.gold'),
      banner: $('banner'), comboTag: $('comboTag'), mist: $('mistVignette'),
      // HUD dan gan tam ngam
      crosshair: $('crosshair'), cdRing: $('cdRing'), cdArc: $('cdRing')?.querySelector('.arc'),
      cdTime: $('cdTime'),
      ammoHud: $('ammoHud'), ammoStrip: $('ammoStrip'), ammoPips: $('ammoPips'),
      rlRing: $('rlRing'), rlSec: $('rlSec'),
      rlArc: $('rlRing')?.querySelector('.arc'), rlWin: $('rlRing')?.querySelector('.win'),
      ammoMag: $('ammoMag'), ammoRes: $('ammoRes'), ammoState: $('ammoState'),
      hurtFlash: $('hurtFlash'), lowHp: $('lowHp'), tapMark: $('tapMark'),
      btnReload: $('btnReload'), dbg: $('dbg'),
      cardRow: $('cardRow'), doorRow: $('doorRow'),
      gateLuck: $('gateLuck'), gateGold: $('gateGold'), gateEyebrow: $('gateEyebrow'),
      endTitle: $('endTitle'), endStats: $('endStats'), endStory: $('endStory'), endEyebrow: $('endEyebrow'),
    };
    this.bannerT = 0;
    this.showDbg = false;
    this._pips = -1;
    this._wasCharging = false;
    this._popT = 0;
    this.CIRC = 2 * Math.PI * 20;      // r=20 trong viewBox 48x48 cua #cdRing
    this.RL_CIRC = 2 * Math.PI * 26;   // r=26 trong viewBox 64x64 cua #rlRing
    this._hurtT = 0;
  }

  /** Chop do o ria man hinh khi trung don. Rung tay thi khong biet mat bao nhieu mau,
      con mot vien do quanh khung hinh thi ngoai vi doc duoc ngay. */
  hurt() { this._hurtT = 0.18; this.el.hurtFlash.classList.add('on'); }

  showHud() {
    this.el.hud.classList.remove('hidden');
    this.el.screen.classList.add('off');
  }

  /* ---------------- banner ---------------- */
  banner(main, sub) {
    const b = this.el.banner;
    b.innerHTML = main + (sub ? `<small>${sub}</small>` : '');
    b.classList.add('on');
    this.bannerT = 1.35;
  }

  /* Chuoi chem KHONG con nhan sat thuong nua, nen tag chi dem so nhat lien tiep.
     Du 5 nhat thi ban kinh hut vang no ra -- do la phan thuong duy nhat con lai. */
  combo(n) {
    const c = this.el.comboTag;
    if (n < 2) { c.classList.remove('on', 'max'); return; }
    c.textContent = n >= 5 ? `CHÉM x${n} · HÚT VÀNG` : `CHÉM x${n}`;
    c.classList.toggle('max', n >= 5);
    c.classList.add('on');
  }

  luckBump(v, why) {
    this.el.luckVal.textContent = v;
    this.el.luckChip.classList.remove('bump');
    void this.el.luckChip.offsetWidth;
    this.el.luckChip.classList.add('bump');
    if (why) this.banner('+LỘC', why);
  }

  goldBump(v) {
    this.el.goldVal.textContent = v.toLocaleString('vi-VN');
    this.el.gold.classList.remove('bump');
    void this.el.gold.offsetWidth;
    this.el.gold.classList.add('bump');
  }

  /** Cham nhung sung chua len dan xong: nhay vong nhip ban de tra loi cu cham do.
      Im lang la cach te nhat de tra loi mot input — nguoi choi se tuong may bi loi. */
  pulseCooldown() {
    const r = this.el.cdRing;
    r.classList.remove('blip');
    void r.offsetWidth;
    r.classList.add('blip');
  }

  /** Dau cham cua phat ban CO NHAM (tap). Vang = trung, xam = truot.
      Khong co dau nay thi "ban truot" va "game khong nhan input" nhin giong het nhau. */
  tapMark(x, y, hit) {
    const m = this.el.tapMark;
    m.style.left = `${x}px`;
    m.style.top = `${y}px`;
    m.classList.toggle('miss', !hit);
    m.classList.remove('on');
    void m.offsetWidth;
    m.classList.add('on');
  }

  showStamina() { this.el.stamWrap.classList.add('on'); this.stamHide = 0.7; }
  flashStamina() { this.showStamina(); this.el.stamWrap.classList.add('low'); }
  mist(level) { this.el.mist.style.opacity = String(level); }

  /* ---------------- reload ----------------
     Thanh nap chay NGAY DUOI TAM NGAM chu khong o nut goc phai: nguoi choi phai cham
     dung cua so xanh de "Nap Hoan Hao", ma cua so do chi rong ~0.25s -- bat ho nhin
     xuong goc man hinh dung luc dam quai dang toi la bat ho chon giua hai thu. */
  reloadStart(win) {
    const C = this.RL_CIRC;
    this.el.ammoHud.classList.add('rl');
    // vach xanh = cua so Nap Hoan Hao, ve dung doan [win0, win1] tren vong tron
    const w0 = Math.max(0, Math.min(1, win[0]));
    const w1 = Math.max(w0, Math.min(1, win[1]));
    this.el.rlWin.style.strokeDasharray = `${C * (w1 - w0)} ${C}`;
    this.el.rlWin.style.strokeDashoffset = String(-C * w0);
    this.el.rlArc.style.strokeDasharray = `0 ${C}`;
  }
  reloadProgress(p) {
    const C = this.RL_CIRC;
    const k = Math.max(0, Math.min(1, p));
    this.el.rlArc.style.strokeDasharray = `${C * k} ${C}`;
  }
  reloadEnd() {
    this.el.ammoHud.classList.remove('rl');
    this.el.rlArc.style.strokeDasharray = `0 ${this.RL_CIRC}`;
  }

  /* ================= HUD DAN o gan tam ngam =================
     Ba lop thong tin, ba kenh doc khac nhau (docs/14 muc 7):
       HINH DANG  bang dan: mot vach = mot vien. Liec 0.1s la biet con nhieu hay sap het,
                  khong phai doc so. Vach chuyen cam < 30%, do + nhay khi het.
       SO         so vien to mau vang ngay duoi bang -- doc khi can chinh xac.
       CHUYEN DONG vong tron quanh tam ngam chay het = ban duoc phat nua. Voi shotgun
                  1.25s giua 2 phat day la thu duy nhat noi cho biet "bao gio".
     Khong cai nao nam o goc man hinh, va khong cai nao nam DE LEN vung 45-75% chieu
     cao (cho quai can chien dung). */
  ammoTick(g) {
    const e = this.el;
    const magMax = Math.max(1, g.magMax);
    const shown = Math.min(24, magMax);          // > 24 vien thi ve thanh lien, khong dem noi

    if (this._pips !== shown) {
      this._pips = shown;
      e.ammoPips.innerHTML = Array.from({ length: shown }, () => '<s></s>').join('');
      e.ammoStrip.classList.toggle('bar', magMax > 24);
    }
    const frac = g.mag / magMax;
    // con >0 vien thi luon con it nhat 1 vach sang: lam tron ve 0 la noi doi
    const filled = g.mag <= 0 ? 0 : Math.max(1, Math.round(frac * shown));
    const pips = e.ammoPips.children;
    for (let i = 0; i < pips.length; i++) pips[i].className = i < filled ? '' : 'spent';
    e.ammoPips.classList.toggle('low', g.mag > 0 && frac <= 0.3);
    e.ammoPips.classList.toggle('empty', g.mag <= 0);

    e.ammoMag.textContent = g.mag;
    e.ammoMag.className = g.mag <= 0 ? 'empty' : frac <= 0.3 ? 'low' : '';
    e.ammoRes.textContent = `/ ${g.reserve}`;

    if (g.reloading) {
      const left = Math.max(0, g.reloadDur - g.reloadT);
      e.rlSec.textContent = left.toFixed(1);
      // shotgun nap tung vien: noi ro dang nhet vien thu may vao o
      e.ammoState.textContent = g.shellReload
        ? `ĐANG NẠP VIÊN ${Math.min(magMax, g.mag + 1)}/${magMax}`
        : 'ĐANG NẠP';
      e.ammoState.className = 'rl';
    } else if (g.mag <= 0) {
      e.ammoState.textContent = g.reserve > 0 ? 'HẾT BĂNG' : 'HẾT SẠCH ĐẠN · CHÉM';
      e.ammoState.className = 'warn';
    } else {
      e.ammoState.textContent = '';
      e.ammoState.className = '';
    }

    /* ---- dong ho nhip ban quanh tam ngam ----
       Chi bat voi sung co nhip >= 0.25s: rifle 155 nhip/phut = 0.39s -> co ich;
       SMG 230 = 0.26s -> vua du; sung nhanh hon thi vong quay nhanh qua, thanh nhieu. */
    const iv = g.fireInterval || 0;
    const cd = Math.max(0, g.fireCd || 0);
    const charging = iv >= 0.25 && cd > 0.001;
    if (e.cdArc) {
      const p = iv > 0 ? Math.min(1, 1 - cd / iv) : 1;
      e.cdArc.style.strokeDashoffset = String(this.CIRC * (1 - p));
    }
    e.cdRing.classList.toggle('on', charging);
    e.crosshair.classList.toggle('charging', charging);
    e.crosshair.classList.toggle('empty', g.mag <= 0);

    // nhay mot cai luc sung san sang lai -- tin hieu "ban duoc roi" cho sung cham
    if (this._wasCharging && !charging) this._popT = 0.16;
    this._wasCharging = charging;
    if (this._popT > 0) {
      this._popT -= 1 / 60;
      e.crosshair.classList.add('pop');
      if (this._popT <= 0) e.crosshair.classList.remove('pop');
    }

    // so giay con lai: chi voi sung cham (shotgun 1.25s, no, launcher)
    const showTime = iv >= 0.5 && cd > 0.02;
    e.cdTime.classList.toggle('on', showTime);
    if (showTime) e.cdTime.textContent = `${cd.toFixed(1)}s`;
  }

  /* ---------------- HUD tick ---------------- */
  tick(g) {
    const e = this.el;
    const hpPct = Math.max(0, g.hp / g.hpMax);
    e.hpFill.style.width = `${hpPct * 100}%`;
    e.hpTxt.textContent = Math.ceil(g.hp);
    // sap chet -> vien do quanh khung hinh: khong ai doc thanh HP 10px o goc luc dong quai
    e.lowHp.classList.toggle('on', g.running && hpPct > 0 && hpPct < 0.35);
    if (this._hurtT > 0) {
      this._hurtT -= 1 / 60;
      if (this._hurtT <= 0) e.hurtFlash.classList.remove('on');
    }
    e.posVal.textContent = `D${g.director.depth}-R${g.director.room}`;
    e.luckVal.textContent = g.luck;
    // quang duong da chay trong phong (mo hinh chay X met)
    const dRun = Math.floor(g.director.distRun || 0);
    const dTot = Math.round(g.director.roomDist || 0);
    e.distVal.textContent = dTot ? dRun + '/' + dTot : '--';
    e.distFill.style.width = dTot ? Math.min(100, (dRun / dTot) * 100) + '%' : '0%';
    /* Thanh stamina hien SUOT LUC CHUA DAY, chi an khi da day lai.
       Truoc day no fade sau 2s ke tu nhat cuoi -- tuc no bien mat DUNG LUC nguoi choi
       dang cho hoi de chem tiep, giau di dung cai duy nhat ho dang doi. Con dang hoi
       thi no con la thong tin. */
    e.stamFill.style.width = `${(g.stam / g.stamMax) * 100}%`;
    e.stamWrap.classList.toggle('low', g.stam < g.stamMax * 0.5);
    if (g.running && g.stam < g.stamMax - 0.01) { e.stamWrap.classList.add('on'); this.stamHide = 0.7; }

    this.ammoTick(g);

    if (this.bannerT > 0) {
      this.bannerT -= 1 / 60;
      if (this.bannerT <= 0) e.banner.classList.remove('on');
    }
    if (this.stamHide > 0) {
      this.stamHide -= 1 / 60;
      if (this.stamHide <= 0) e.stamWrap.classList.remove('on');
    }

    if (this.showDbg) {
      const s = g.input.stats;
      const rate = (g.input.cancelRate() * 100).toFixed(1);
      e.dbg.textContent =
        `fps ${g.perf.fps}   quái ${g.pool.aliveCount}\n` +
        `gesture ${s.last}  v=${s.lastVel}px/s  góc=${s.lastAngle}°\n` +
        `tap ${s.tap}  hold ${s.hold}  chém ${s.melee}  né ${s.move}\n` +
        `HUỶ ${s.cancelled}/${s.total} = ${rate}%  (ngưỡng Sprint 0 < 8%)\n` +
        `TP R${g.director.R} w${g.director.waveIdx}  phase ${g.director.phase}\n` +
        `stam ${Math.round(g.stam)}  đạn ${g.reserve}/${g.reserveMax}`;
    }
  }

  /* ---------------- Cong: the + Nga Ba ---------------- */
  openGate(cards, fork, game) {
    const e = this.el;
    e.screen.classList.remove('off');
    e.sheetTitle.classList.add('hidden');
    e.sheetEnd.classList.add('hidden');
    e.sheetGate.classList.remove('hidden');
    e.gateLuck.textContent = game.luck;
    e.gateGold.textContent = game.gold.toLocaleString('vi-VN');
    e.gateEyebrow.textContent = `CỔNG D${game.director.depth}-R${game.director.room} · CHỌN 1 NÂNG CẤP`;

    e.cardRow.innerHTML = '';
    this.pickedCard = false;
    for (const c of cards) {
      if (!c) continue;
      const b = document.createElement('button');
      b.className = `card ${c.rarity}`;
      // MOT dong hieu ung, mot con so. Dong duoi chi noi tong da cong don duoc bao nhieu.
      const RAR_VI = { common: 'THƯỜNG', rare: 'HIẾM', epic: 'CỰC HIẾM', legendary: 'HUYỀN THOẠI' };
      b.innerHTML =
        `<div class="r">${RAR_VI[c.rarity] || c.rarity}</div>` +
        `<div class="n">${c.name}</div>` +
        `<div class="e">${c.effect}</div>` +
        (c.total ? `<div class="tot">đang có ${c.total}</div>` : '');
      b.onclick = () => {
        if (this.pickedCard) return;
        this.pickedCard = true;
        game.applyCard(c);
        for (const el of e.cardRow.children) el.style.opacity = el === b ? '1' : '0.28';
        e.gateEyebrow.textContent = `ĐÃ LẤY: ${c.name.toUpperCase()} — ${c.effect}`;
      };
      e.cardRow.appendChild(b);
    }

    e.doorRow.innerHTML = '';
    if (!fork) {
      const b = document.createElement('button');
      b.className = 'door calm';
      b.innerHTML = `<div class="t">ĐI TIẾP</div><div class="m">Phòng tiếp theo đã định sẵn.</div>`;
      b.onclick = () => game.chooseDoor(null);
      e.doorRow.appendChild(b);
      return;
    }
    const TYPE_VI = {
      combat: 'PHÒNG CHIẾN', elite: 'PHÒNG ELITE', shop: 'LÃO BUÔN XÁC',
      shrine: 'MIẾU MỎ', treasure: 'KHO BÁU', event: 'PHÒNG SỰ KIỆN', gauntlet: 'LÒ VÀNG',
    };
    for (const d of fork) {
      const b = document.createElement('button');
      b.className = `door ${d.hot ? 'hot' : 'calm'}`;
      const est = d.est ? `<br />~${d.est} quái` : '';
      const gm = d.goldMult > 1 ? `<br />vàng x${d.goldMult}` : '';
      b.innerHTML =
        `<div class="t">${TYPE_VI[d.type] || d.type.toUpperCase()}</div>` +
        `<span class="tag">${d.tag}</span>` +
        `<div class="m">${d.meaning}${est}${gm}</div>`;
      b.onclick = () => game.chooseDoor(d);
      e.doorRow.appendChild(b);
    }
  }

  closeGate() {
    this.el.screen.classList.add('off');
    this.el.sheetGate.classList.add('hidden');
  }

  /* ---------------- ket run ---------------- */
  showEnd(r) {
    const e = this.el;
    e.screen.classList.remove('off');
    e.sheetTitle.classList.add('hidden');
    e.sheetGate.classList.add('hidden');
    e.sheetEnd.classList.remove('hidden');
    e.endEyebrow.textContent = r.won ? 'CLEAR' : 'HẾT RUN';
    e.endTitle.textContent = r.won
      ? `Xuống hết Depth ${r.depth}`
      : `Chết ở D${r.depth} · phòng ${r.room}`;

    const cells = [
      ['VÀNG', r.gold.toLocaleString('vi-VN')],
      ['LỘC', r.luck],
      ['MẠNG GIẾT', r.kills],
      ['CHÉM HOÀN HẢO', r.perfects],
      ['PHÒNG (R)', r.globalRoom],
      ['THỜI GIAN', `${r.secs.toFixed(0)}s`],
      ['INPUT HUỶ', `${(r.cancelRate * 100).toFixed(1)}%`],
      ['NẠP HOÀN HẢO', r.reload.total ? `${Math.round((r.reload.ok / r.reload.total) * 100)}%` : '—'],
    ];
    e.endStats.innerHTML = cells.map(([k, v]) => `<div><b>${v}</b><span>${k}</span></div>`).join('');

    const story = r.depth >= 4
      ? `Ngươi xuống tới phòng ${r.globalRoom}. Xác ngươi giờ là mốc cho kẻ sau.`
      : `Hầm mới ăn của ngươi ${r.kills} nhát. Nó còn sâu lắm.`;
    const gate = r.cancelRate < 0.08
      ? `Input huỷ ${(r.cancelRate * 100).toFixed(1)}% — dưới ngưỡng 8% của Sprint 0.`
      : `Input huỷ ${(r.cancelRate * 100).toFixed(1)}% — TRÊN ngưỡng 8%: cân nhắc Chế độ Hai Vùng.`;
    e.endStory.innerHTML = `${story}<br /><span style="color:var(--muted)">${gate} · ${r.fps} fps</span>`;
  }

  showTitle() {
    this.el.screen.classList.remove('off');
    this.el.sheetEnd.classList.add('hidden');
    this.el.sheetGate.classList.add('hidden');
    this.el.sheetTitle.classList.remove('hidden');
  }
}
