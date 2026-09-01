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
   * @param {{onTap,onHoldStart,onHoldMove,onHoldEnd,onMelee,onSlideStart,onSlideMove,onSlideEnd}} h handlers
   */
  constructor(el, h) {
    this.el = el;
    this.h = h;

    const c = GD.ctrl;
    this.P = {
      tapMaxDuration: c.tapMaxDuration,
      tapMaxTravel: c.tapMaxTravel,
      slideVel: c.slideVelocityThreshold,
      slideWindow: c.slideDetectWindow,
      slideMinLen: c.slideMinLength,
      slideCommitLen: c.slideCommitLength,
      tapStillMs: c.tapStillMs,
      heavyLen: c.heavySlideLength,
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
    this.fromHoldEscape = false;
    /* HEN GIO vao HOLD_FIRE. Truoc day _enterHold() CHI duoc goi trong pointermove, nen
       giu ngon tay DUNG YEN thi khong co su kien move nao va sung khong bao gio ban lien
       tuc -- phai re tay moi ra dan. Do la "hold bi delay" ma nguoi choi gap. */
    clearTimeout(this._holdTimer);
    this._holdTimer = setTimeout(() => {
      if (this.state === ST.PENDING && this.id !== null) this._enterHold();
    }, this.P.tapMaxDuration);
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

    this.lastVel = vel;
    this.lastMoveT = now;

    if (this.state === ST.PENDING) {
      /* Khoa sang chem phai co CA van toc LAN quang duong. Chi nhin van toc thoi thi
         moi cu tap hoi truot tay deu bi nuot -- ngon cai bam nhanh bao gio cung xe
         dich vai chuc pixel, ma 50px tren man 375 da du vuot nguong (docs/18 loi #56). */
      const travel = Math.hypot(x - this.p0.x, y - this.p0.y) / this.screenW;
      if (elapsed <= this.P.slideWindow && vel >= this.P.slideVel && travel > this.P.tapMaxTravel) {
        clearTimeout(this._holdTimer);
        this.state = ST.SLIDE;                       // KHOA sang nhanh chem
      } else if (elapsed >= this.P.tapMaxDuration) {
        this._enterHold();                           // KHOA sang nhanh sung
      }
      return;
    }
    if (this.state === ST.HOLD_FIRE) {
      /* THOAT KHOA sung -> dao.
         Luat khoa sinh ra de MOT cu cham khong ra HAI hanh dong -- van dung. Nhung
         cach cu bat nguoi choi NHAC TAY moi lan doi tu ban sang chem, va o mot game
         quai toi lien tuc thi mot lan nhac tay la mot nhip mat trang. Do chinh la cho
         "chuyen doi giua can chien va ban xa khong muot".
         Gio mot cu quet DUT KHOAT (nhanh hon nguong thuong 1.35 lan VA di du dai) pha
         duoc khoa va ra dao ngay. Nguong cao hon nguong nhan dang binh thuong nen mot
         cu re tay vo tinh trong luc giu ban khong the pha nham. */
      if (vel < this.P.slideVel * 0.5) this.holdAnchor = { x, y };   // re cham -> dat lai moc
      const tdx = x - this.holdAnchor.x, tdy = y - this.holdAnchor.y;
      /* Quang duong chi can bang `tapMaxTravel` (19px) chu khong phai `slideMinLen`
         (45px): VAN TOC moi la thu quyet dinh o day. Giu de ban thi ngon tay hoac dung
         yen hoac re CHAM (hold-and-drag), khong bao gio dat 1.15x nguong quet -- nen
         khong the pha khoa nham. Bat 45px lam cu vay tay dut khoat van bi nuot. */
      if (vel >= this.P.slideVel * 1.15 &&
          Math.hypot(tdx, tdy) / this.screenW >= this.P.tapMaxTravel) {
        /* Chuyen sang SLIDE roi DE NO TU CHAY, khong goi `_resolveSlide()` ngay tai day.
           Goi ngay thi quang duong moi co 19-25px, duoi `slideMinLen`, va _resolveSlide
           se roi vao nhanh "qua ngan -> coi la tap" — nuot luon ca cu cham, khong ban
           cung khong chem. Cho no chay tiep thi vai frame nua la du dai de thanh nhat
           chem that (docs/18 loi #57). t0 dat lai de dong ho 400ms tinh tu day. */
        this.h.onHoldEnd?.();
        this.p0 = { x: this.holdAnchor.x, y: this.holdAnchor.y };
        this.t0 = now;
        this.state = ST.SLIDE;
        // y do da duoc chung minh bang VAN TOC -> khong phai doi du slideCommitLen nua
        this.fromHoldEscape = true;
        return;
      }
      this.h.onHoldMove?.(x, y);
      return;
    }
    if (this.state === ST.SLIDE) {
      /* Chot som khi da di DU DAI de khong the la mot cu tap truot tay (slideCommitLen).
         Duoi nguong do thi doi toi luc nhac tay moi quyet dinh -- xem `_up`. */
      const tdx = x - this.p0.x, tdy = y - this.p0.y;
      // `slideCommitLen` sinh ra de bao ve CU TAP truot tay. Mot cu quet thoat ra tu
      // che do giu ban thi khong phai tap, y do da ro tu van toc -> chot som hon.
      const chot = this.fromHoldEscape ? this.P.slideMinLen : this.P.slideCommitLen;
      if (Math.hypot(tdx, tdy) / this.screenW >= chot ||
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
    clearTimeout(this._holdTimer);
    const now = performance.now();
    const elapsed = now - this.t0;
    const travel = Math.hypot(this.p.x - this.p0.x, this.p.y - this.p0.y);

    if (this.state === ST.PENDING) {
      if (elapsed < this.P.tapMaxDuration && travel < this.P.tapMaxTravel * this.screenW) {
        this._emit(GESTURE.TAP);
        this.h.onTap?.(this.p0.x, this.p0.y);
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
      /* NGON TAY DA DUNG hay CON DANG BAY luc nhac?
         Tap truot tay va ve nhanh co the di CUNG mot quang duong; khac nhau duy nhat o
         cho mot cai da dung lai roi moi nhac, mot cai van con dang chuyen dong. Do la
         thu tach duoc hai cai ma quang duong khong tach duoc. */
      const dung = (now - (this.lastMoveT || 0)) > this.P.tapStillMs ||
                   (this.lastVel || 0) < this.P.slideVel;
      if (travel / this.screenW < this.P.slideCommitLen && dung) {
        this.state = ST.CONSUMED;
        this._emit(GESTURE.TAP);
        this.h.onTap?.(this.p0.x, this.p0.y);
      } else {
        this._resolveSlide();
        if (this.state === ST.SLIDE_CONT) this.h.onSlideEnd?.();
      }
    }
    this.state = ST.IDLE;
    this.id = null;
  }

  _enterHold() {
    this.state = ST.HOLD_FIRE;
    this.holdAnchor = { x: this.p.x, y: this.p.y };   // moc do quang duong de thoat khoa
    this._emit(GESTURE.HOLD);
    this.h.onHoldStart?.(this.p.x, this.p.y);
  }

  /** Phan giai mot lan quet. BO quet doc len/xuong (yeu cau nguoi choi), nen MOI cu quet
      deu la chem -- va vung chet 55-65 do khong con ly do ton tai: no sinh ra de tach
      "quet de chem" khoi "quet de di chuyen", ma gio khong con quet de di chuyen nua.
      Xem docs/03 muc 2c va docs/18 loi #34. */
  _resolveSlide() {
    const dx = this.p.x - this.p0.x;
    const dy = this.p.y - this.p0.y;
    const len = Math.hypot(dx, dy) / this.screenW;
    const a = Math.abs((Math.atan2(dy, dx) * 180) / Math.PI);
    this.stats.lastAngle = Math.round(Math.min(a, 180 - a));
    this.stats.lastVel = Math.round(this.peakVel);

    if (len < this.P.slideMinLen) {              // qua ngan -> coi la tap (docs/03)
      this.state = ST.CONSUMED;
      this._emit(GESTURE.TAP);
      this.h.onTap?.(this.p0.x, this.p0.y);
      return;
    }

    /* CHEM LIEN TUC (kieu chem hoa qua): khong ket thuc sau mot nhat. Giu ngon tay va re
       tiep thi moi doan duong tren man hinh la mot nhat nua. Nha tay moi ket thuc. */
    this.state = ST.SLIDE_CONT;
    this.seg = { ...this.p };
    const heavy = len > this.P.heavyLen;
    this._emit(heavy ? GESTURE.SLIDE_HEAVY : GESTURE.SLIDE_LIGHT);
    this.h.onSlideStart?.();
    this.h.onMelee?.({ dx, dy, len, heavy, from: { ...this.p0 }, to: { ...this.p } });
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
    clearTimeout(this._holdTimer);
    this.el.removeEventListener('pointerdown', this._down);
    this.el.removeEventListener('pointermove', this._move);
    this.el.removeEventListener('pointerup', this._up);
    this.el.removeEventListener('pointercancel', this._up);
  }
}
