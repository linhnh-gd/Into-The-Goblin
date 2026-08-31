/* trail.js — vet slash kieu chem hoa qua. Ve tren canvas 2D DE TREN canvas WebGL.

   Vi sao khong dung trong three.js: vet nay song o KHONG GIAN MAN HINH -- no la chinh
   duong ngon tay nguoi choi ke ra, cung mot doan thang ma queryBlade dung de quyet dinh
   con nao bi cat. Ve 2D thi hai thu do LUON khop nhau: nguoi choi thay dung cai da cat. */

import { GD } from './data.js';

export class Trail {
  constructor(canvas) {
    this.c = canvas;
    this.ctx = canvas ? canvas.getContext('2d') : null;
    this.segs = [];
    this.dpr = 1;
  }

  resize(w, h) {
    if (!this.c) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    this.c.width = Math.max(1, Math.round(w * dpr));
    this.c.height = Math.max(1, Math.round(h * dpr));
    this.dpr = dpr;
    this.w = w; this.h = h;
  }

  push(x0, y0, x1, y1) {
    this.segs.push({ x0, y0, x1, y1, t: GD.feel.melee.trailFadeSec });
    if (this.segs.length > 56) this.segs.shift();
  }

  clear() { this.segs.length = 0; }

  update(dt) {
    let n = 0;
    for (const s of this.segs) { s.t -= dt; if (s.t > 0) this.segs[n++] = s; }
    this.segs.length = n;
  }

  draw() {
    const ctx = this.ctx;
    if (!ctx) return;
    const dpr = this.dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, this.w || 0, this.h || 0);
    if (!this.segs.length) return;

    const M = GD.feel.melee;
    const base = (this.w || 1) * M.trailWidthFrac;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (const s of this.segs) {
      const k = Math.max(0, Math.min(1, s.t / M.trailFadeSec));
      // lop ngoai: quang vang rong, tat nhanh
      ctx.globalAlpha = 0.22 * k;
      ctx.strokeStyle = '#ffc53d';
      ctx.lineWidth = base * (0.6 + k * 1.6);
      ctx.beginPath(); ctx.moveTo(s.x0, s.y0); ctx.lineTo(s.x1, s.y1); ctx.stroke();
      // lop trong: loi trang sang, hep
      ctx.globalAlpha = 0.9 * k * k;
      ctx.strokeStyle = '#fff6e0';
      ctx.lineWidth = base * 0.4 * (0.35 + k);
      ctx.beginPath(); ctx.moveTo(s.x0, s.y0); ctx.lineTo(s.x1, s.y1); ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
}
