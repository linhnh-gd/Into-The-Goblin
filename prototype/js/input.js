/* input.js — MAY TRANG THAI PHAN GIAI GESTURE.
   Day la rui ro ky thuat #1 cua du an (docs/17 muc 1). Cai dat dung docs/03 muc 2.

   Luat khoa (latching): MOT lan cham chi duoc la MOT loai hanh dong.
     - Da vao HOLD_FIRE -> quet nhanh cung khong ra dao.
     - Da vao SLIDE     -> giu lai cung khong ra sung.
   Vung chet 55-65 do: BO QUA input, tha mat input con hon lam sai input.

   Moi tham so doc tu data/controls.json, khong hardcode. */

import { GD } from './data.js';

export const GESTURE = {
  TAP: 'tap',
  HOLD: 'hold',
  SLIDE_LIGHT: 'slide_light',
  SLIDE_HEAVY: 'slide_heavy',
  DODGE_BACK: 'dodge_back',
  DASH_FWD: 'dash_fwd',
  CANCELLED: 'cancelled',
};

const ST = { IDLE: 0, PENDING: 1, SLIDE: 2, HOLD_FIRE: 3, CONSUMED: 4, SLIDE_CONT: 5 };

export class InputRouter {
  /**
   * @param {HTMLElement} el
   * @param {{onTap,onHoldStart,onHoldMove,onHoldEnd,onMelee,onMove,onCancelled}} h handlers
   */
  constructor(el, h) {
    this.el = el;
    this.h = h;
    this.twoZone = false;

    const c = GD.ctrl;
    this.P = {
      tapMaxDuration: c.tapMaxDuration,
      tapMaxTravel: c.tapMaxTravel,
      slideVel: c.slideVelocityThreshold,
      slideWindow: c.slideDetectWindow,
      slideMinLen: c.slideMinLength,
      heavyLen: c.heavySlideLength,
      meleeAngleMax: c.meleeAngleMax,
      moveAngleMin: c.moveAngleMin,
      slideResolveMax: 400,
      slideMinSegPx: GD.feel.melee.slideMinSegPx,
    };

    this.state = ST.IDLE;
    this.id = null;
    this.t0 = 0;
    this.p0 = { x: 0, y: 0 };
    this.p = { x: 0, y: 0 };
    this.prev = { x: 0, y: 0, t: 0 };
    this.peakVel = 0;

    // do luong cho Sprint 0
    this.stats = { total: 0, tap: 0, hold: 0, melee: 0, move: 0, cancelled: 0, lastVel: 0, lastAngle: 0, last: '-' };

    this._down = this._down.bind(this);
    this._move = this._move.bind(this);
    this._up = this._up.bind(this);
    el.addEventListener('pointerdown', this._down, { passive: false });
    el.addEventListener('pointermove', this._move, { passive: false });
    el.addEventListener('pointerup', this._up, { passive: false });
    el.addEventListener('pointercancel', this._up, { passive: false });
    el.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  get screenW() { return this.el.clientWidth || 1; }

  _down(e) {
    e.preventDefault();
    if (this.id !== null) return;           // chi ngon DAU TIEN dieu khien combat
    this.id = e.pointerId;
    this.state = ST.PENDING;
    this.t0 = performance.now();
    this.p0 = { x: e.clientX, y: e.clientY };
    this.p = { ...this.p0 };
    this.prev = { ...this.p0, t: this.t0 };
    this.peakVel = 0;
  }

  _move(e) {
    if (e.pointerId !== this.id) return;
    e.preventDefault();
    const now = performance.now();
    const x = e.clientX, y = e.clientY;
    const dt = Math.max(1, now - this.prev.t);
    const vel = (Math.hypot(x - this.prev.x, y - this.prev.y) / dt) * 1000;
    this.peakVel = Math.max(this.peakVel, vel);
    this.prev = { x, y, t: now };
    this.p = { x, y };
    const elapsed = now - this.t0;

    if (this.state === ST.PENDING) {
      // Hai Vung: bo qua phan giai, quyet dinh theo nua man hinh (accessibility / fallback R1)
      if (this.twoZone) {
        if (this._inMeleeZone(this.p0.y) && vel >= this.P.slideVel * 0.5) this.state = ST.SLIDE;
        else if (elapsed >= this.P.tapMaxDuration && !this._inMeleeZone(this.p0.y)) this._enterHold();
        return;
      }
      if (elapsed <= this.P.slideWindow && vel >= this.P.slideVel) {
        this.state = ST.SLIDE;                       // KHOA sang nhanh chem
      } else if (elapsed >= this.P.tapMaxDuration) {
        this._enterHold();                           // KHOA sang nhanh sung
      }
      return;
    }
    if (this.state === ST.HOLD_FIRE) {
      this.h.onHoldMove?.(x, y);
      return;
    }
    if (this.state === ST.SLIDE) {
      // phan giai huong som nhat co the: du dai la quyet dinh luon, khong doi het 400ms
      const tdx = x - this.p0.x, tdy = y - this.p0.y;
      if (Math.hypot(tdx, tdy) / this.screenW >= this.P.slideMinLen ||
          elapsed >= this.P.slideResolveMax) this._resolveSlide();
      return;
    }
    if (this.state === ST.SLIDE_CONT) {
      // moi doan >= slideMinSegPx la MOT nhat nua (chem hoa qua)
      const sx = x - this.seg.x, sy = y - this.seg.y;
      const segLen = Math.hypot(sx, sy);
      if (segLen >= this.P.slideMinSegPx) {
        const total = Math.hypot(x - this.p0.x, y - this.p0.y) / this.screenW;
        this.h.onSlideMove?.({
          dx: sx, dy: sy, lenPx: segLen, len: total,
          heavy: total > this.P.heavyLen, from: { ...this.seg }, to: { x, y },
        });
        this.seg = { x, y };
      }
      return;
    }
  }

  _up(e) {
    if (e.pointerId !== this.id) return;
    e.preventDefault();
    const now = performance.now();
    const elapsed = now - this.t0;
    const travel = Math.hypot(this.p.x - this.p0.x, this.p.y - this.p0.y);

    if (this.state === ST.PENDING) {
      if (elapsed < this.P.tapMaxDuration && travel < this.P.tapMaxTravel * this.screenW) {
        this._emit(GESTURE.TAP);
        this.h.onTap?.(this.p0.x, this.p0.y);
      } else if (this.twoZone && this._inMeleeZone(this.p0.y)) {
        this._resolveSlide();                        // Hai Vung: nua duoi luon la chem
      } else {
        // giu lau nhung khong du van toc -> coi la 1 phat ban don
        this._emit(GESTURE.TAP);
        this.h.onTap?.(this.p.x, this.p.y);
      }
    } else if (this.state === ST.HOLD_FIRE) {
      this.h.onHoldEnd?.();
    } else if (this.state === ST.SLIDE_CONT) {
      this.h.onSlideEnd?.();
    } else if (this.state === ST.SLIDE) {
      this._resolveSlide();
      if (this.state === ST.SLIDE_CONT) this.h.onSlideEnd?.();
    }
    this.state = ST.IDLE;
    this.id = null;
  }

  _enterHold() {
    this.state = ST.HOLD_FIRE;
    this._emit(GESTURE.HOLD);
    this.h.onHoldStart?.(this.p.x, this.p.y);
  }

  _inMeleeZone(y) {
    return y > this.el.clientHeight * 0.5;
  }

  /** Phan giai HUONG cua mot lan quet. Neu la chem thi KHOA sang che do chem lien tuc. */
  _resolveSlide() {
    const dx = this.p.x - this.p0.x;
    const dy = this.p.y - this.p0.y;
    const lenPx = Math.hypot(dx, dy);
    const len = lenPx / this.screenW;

    // goc lech khoi truc NGANG, 0..90
    const a = Math.abs((Math.atan2(dy, dx) * 180) / Math.PI);
    const devH = Math.min(a, 180 - a);
    this.stats.lastAngle = Math.round(devH);
    this.stats.lastVel = Math.round(this.peakVel);

    if (len < this.P.slideMinLen) {              // qua ngan -> coi la tap (docs/03)
      this.state = ST.CONSUMED;
      this._emit(GESTURE.TAP);
      this.h.onTap?.(this.p0.x, this.p0.y);
      return;
    }

    if (this.twoZone || devH <= this.P.meleeAngleMax) {
      /* CHEM LIEN TUC (kieu chem hoa qua): khong ket thuc sau mot nhat. Giu ngon tay
         va re tiep thi moi doan duong tren man hinh la mot nhat nua, va stamina bi
         drain lien tuc. Nha tay moi ket thuc. */
      this.state = ST.SLIDE_CONT;
      this.seg = { ...this.p };
      const heavy = len > this.P.heavyLen;
      this._emit(heavy ? GESTURE.SLIDE_HEAVY : GESTURE.SLIDE_LIGHT);
      this.h.onSlideStart?.();
      this.h.onMelee?.({ dx, dy, len, heavy, from: { ...this.p0 }, to: { ...this.p } });
      return;
    }
    this.state = ST.CONSUMED;
    if (devH >= this.P.moveAngleMin) {
      const down = dy > 0;                        // y tang xuong duoi
      this._emit(down ? GESTURE.DODGE_BACK : GESTURE.DASH_FWD);
      this.h.onMove?.(down ? 'back' : 'forward');
      return;
    }
    // VUNG CHET 55-65 do
    this._emit(GESTURE.CANCELLED);
    this.h.onCancelled?.();
  }

  _emit(g) {
    const s = this.stats;
    s.total++;
    s.last = g;
    if (g === GESTURE.TAP) s.tap++;
    else if (g === GESTURE.HOLD) s.hold++;
    else if (g === GESTURE.SLIDE_LIGHT || g === GESTURE.SLIDE_HEAVY) s.melee++;
    else if (g === GESTURE.DODGE_BACK || g === GESTURE.DASH_FWD) s.move++;
    else if (g === GESTURE.CANCELLED) s.cancelled++;
  }

  /** Ti le input bi huy — nguong go/no-go cua Sprint 0 la < 8% (docs/17). */
  cancelRate() {
    return this.stats.total ? this.stats.cancelled / this.stats.total : 0;
  }

  isHolding() { return this.state === ST.HOLD_FIRE; }
  isSlicing() { return this.state === ST.SLIDE_CONT; }
  holdPoint() { return this.p; }

  dispose() {
    this.el.removeEventListener('pointerdown', this._down);
    this.el.removeEventListener('pointermove', this._move);
    this.el.removeEventListener('pointerup', this._up);
    this.el.removeEventListener('pointercancel', this._up);
  }
}
