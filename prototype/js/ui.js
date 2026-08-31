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
      ammoVal: $('ammoVal'), magPips: $('magPips'),
      banner: $('banner'), comboTag: $('comboTag'), mist: $('mistVignette'),
      reloadBar: $('reloadBar'), reloadFill: $('reloadFill'), reloadPerfect: $('reloadPerfect'),
      btnReload: $('btnReload'), dbg: $('dbg'),
      cardRow: $('cardRow'), doorRow: $('doorRow'),
      gateLuck: $('gateLuck'), gateGold: $('gateGold'), gateEyebrow: $('gateEyebrow'),
      endTitle: $('endTitle'), endStats: $('endStats'), endStory: $('endStory'), endEyebrow: $('endEyebrow'),
    };
    this.bannerT = 0;
    this.showDbg = false;
    this._pips = -1;
  }

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

  combo(n) {
    const c = this.el.comboTag;
    if (n < 2) { c.classList.remove('on'); return; }
    c.textContent = `COMBO x${[1, 1.15, 1.3, 1.5, 1.8, 1.8][Math.min(5, n)].toFixed(2)}`;
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

  showStamina() { this.el.stamWrap.classList.add('on'); this.stamHide = 2.0; }
  flashStamina() { this.showStamina(); this.el.stamWrap.classList.add('low'); }
  mist(level) { this.el.mist.style.opacity = String(level); }

  /* ---------------- reload ---------------- */
  reloadStart(win) {
    this.el.reloadBar.classList.add('on');
    this.el.reloadPerfect.style.left = `${win[0] * 100}%`;
    this.el.reloadPerfect.style.width = `${(win[1] - win[0]) * 100}%`;
    this.el.btnReload.textContent = 'NẠP!';
    this.el.btnReload.appendChild(this.el.reloadBar);
  }
  reloadProgress(p) { this.el.reloadFill.style.width = `${Math.min(100, p * 100)}%`; }
  reloadEnd() {
    this.el.reloadBar.classList.remove('on');
    this.el.reloadFill.style.width = '0%';
    this.el.btnReload.textContent = 'NẠP';
    this.el.btnReload.appendChild(this.el.reloadBar);
  }

  /* ---------------- HUD tick ---------------- */
  tick(g) {
    const e = this.el;
    const hpPct = Math.max(0, g.hp / g.hpMax);
    e.hpFill.style.width = `${hpPct * 100}%`;
    e.hpTxt.textContent = Math.ceil(g.hp);
    e.posVal.textContent = `D${g.director.depth}-R${g.director.room}`;
    e.luckVal.textContent = g.luck;
    // quang duong da chay trong phong (mo hinh chay X met)
    const dRun = Math.floor(g.director.distRun || 0);
    const dTot = Math.round(g.director.roomDist || 0);
    e.distVal.textContent = dTot ? dRun + '/' + dTot : '--';
    e.distFill.style.width = dTot ? Math.min(100, (dRun / dTot) * 100) + '%' : '0%';
    e.ammoVal.textContent = `${g.mag} / ${g.reserve}`;
    e.stamFill.style.width = `${(g.stam / g.stamMax) * 100}%`;
    e.stamWrap.classList.toggle('low', g.stam < g.stamMax * 0.5);

    if (this._pips !== g.magMax) {
      this._pips = g.magMax;
      e.magPips.innerHTML = Array.from({ length: Math.min(30, g.magMax) }, () => '<s></s>').join('');
    }
    const pips = e.magPips.children;
    const shown = Math.min(30, g.magMax);
    const filled = Math.round((g.mag / g.magMax) * shown);
    for (let i = 0; i < pips.length; i++) pips[i].className = i < filled ? '' : 'spent';
    e.magPips.classList.toggle('empty', g.mag === 0);

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
        `stam ${Math.round(g.stam)}  cướp đạn ${g.scavenge}/${g.mods.scavengeNeed}`;
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
    e.gateEyebrow.textContent = `CỔNG D${game.director.depth}-R${game.director.room} · CHỌN 1 THẺ`;

    e.cardRow.innerHTML = '';
    this.pickedCard = false;
    for (const c of cards) {
      if (!c) continue;
      const b = document.createElement('button');
      b.className = `card ${c.rarity}`;
      b.innerHTML =
        `<div class="r">${c.rarity}</div><div class="n">${c.name}</div>` +
        `<div class="e">${c.effect}</div>` +
        (c.drawback ? `<div class="d">${c.drawback}</div>` : '');
      b.onclick = () => {
        if (this.pickedCard) return;
        this.pickedCard = true;
        game.applyCard(c);
        for (const el of e.cardRow.children) el.style.opacity = el === b ? '1' : '0.28';
        e.gateEyebrow.textContent = `ĐÃ LẤY: ${c.name.toUpperCase()}`;
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
