/* data.js — nap dung data/*.json cua GDD. KHONG hardcode so trong code.
   File trong prototype/data/ do build_pages.ps1 copy tu data/ (nguon chan ly). */

const FILES = ['weapons', 'enemies', 'waves', 'depths', 'rooms', 'upgrades', 'controls', 'gamefeel', 'economy'];

export const GD = {};

export async function loadData() {
  const results = await Promise.all(
    FILES.map(async (name) => {
      const res = await fetch(`data/${name}.json`, { cache: 'no-cache' });
      if (!res.ok) throw new Error(`data/${name}.json -> HTTP ${res.status}`);
      return [name, await res.json()];
    })
  );
  for (const [name, json] of results) GD[name] = json;

  // --- index tra cuu nhanh ---
  GD.byId = {};
  for (const w of GD.weapons.weapons) GD.byId[w.id] = w;
  for (const e of GD.enemies.enemies) GD.byId[e.id] = e;
  for (const c of GD.upgrades.cards) GD.byId[c.id] = c;

  GD.ctrl = {};
  for (const p of GD.controls.params) GD.ctrl[p.key] = Number(p.value);

  GD.feel = GD.gamefeel;
  return GD;
}

/** Lay 1 vu khi theo id, nem loi ro rang neu sai id (bat loi som). */
export function weapon(id) {
  const w = GD.byId[id];
  if (!w) throw new Error(`weapon id khong ton tai: ${id}`);
  return w;
}

export function enemy(id) {
  const e = GD.byId[id];
  if (!e) throw new Error(`enemy id khong ton tai: ${id}`);
  return e;
}

export function waveTemplate(id) {
  const v = GD.waves.waveTemplates.find((t) => t.id === id);
  if (!v) throw new Error(`wave id khong ton tai: ${id}`);
  return v;
}
