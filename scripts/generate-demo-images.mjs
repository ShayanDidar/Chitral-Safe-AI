// Generates the illustrated demo images in public/demo/*.svg.
// Run: node scripts/generate-demo-images.mjs
import { mkdirSync, writeFileSync } from "node:fs";

const W = 800;
const H = 500;

function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const PALETTES = {
  overcast: { skyTop: "#8e9aa4", skyBottom: "#d9dee1", far: "#8793a0", snow: "#f1f4f6", mid: "#5f6c63", near: "#4a5549", valley: "#78866a" },
  storm: { skyTop: "#4a5561", skyBottom: "#8f9aa3", far: "#65717c", snow: "#d5dce1", mid: "#4b5750", near: "#3b453e", valley: "#5e6b55" },
  clear: { skyTop: "#7fa9cc", skyBottom: "#e2edf4", far: "#94a7b8", snow: "#ffffff", mid: "#6b7a6e", near: "#566456", valley: "#8a9670" },
  dusk: { skyTop: "#6f7f99", skyBottom: "#e6cfae", far: "#8a8ea3", snow: "#f3eee8", mid: "#62675f", near: "#4d524a", valley: "#7f8467" },
  winter: { skyTop: "#9fb0bf", skyBottom: "#e8edf1", far: "#aab7c3", snow: "#ffffff", mid: "#8d9aa3", near: "#76828a", valley: "#e9eef1" },
};

function ridge(points, baseY = H) {
  const d = points.map(([x, y], i) => `${i ? "L" : "M"}${x},${y}`).join(" ");
  return `${d} L${W},${baseY} L0,${baseY} Z`;
}

function mountains(p, r, { farY = 230, midY = 300, snowCaps = true } = {}) {
  // Far range with snow caps
  const far = [];
  const caps = [];
  let x = -40;
  while (x < W + 60) {
    const peakH = farY - 40 - r() * 110;
    const w = 90 + r() * 120;
    far.push([x, farY + r() * 20], [x + w / 2, peakH]);
    if (snowCaps) {
      const cx = x + w / 2;
      const d = 18 + r() * 16;
      caps.push(
        `<path d="M${cx},${peakH} L${cx - d * 1.1},${peakH + d * 1.2} L${cx - d * 0.4},${peakH + d * 0.9} L${cx},${peakH + d * 1.4} L${cx + d * 0.5},${peakH + d * 0.95} L${cx + d},${peakH + d * 1.15} Z" fill="${p.snow}" opacity="0.92"/>`,
      );
    }
    x += w;
  }
  far.push([W + 60, farY]);
  const mid = [];
  x = -30;
  while (x < W + 60) {
    const w = 120 + r() * 160;
    mid.push([x, midY + 10 + r() * 20], [x + w / 2, midY - 50 - r() * 60]);
    x += w;
  }
  mid.push([W + 60, midY + 20]);
  return `
  <path d="${ridge(far)}" fill="${p.far}"/>
  ${caps.join("\n  ")}
  <rect x="0" y="${farY - 30}" width="${W}" height="120" fill="url(#haze)"/>
  <path d="${ridge(mid)}" fill="${p.mid}"/>`;
}

function sky(p) {
  return `
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${p.skyTop}"/><stop offset="1" stop-color="${p.skyBottom}"/>
    </linearGradient>
    <linearGradient id="haze" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${p.skyBottom}" stop-opacity="0"/><stop offset="1" stop-color="${p.skyBottom}" stop-opacity="0.55"/>
    </linearGradient>
    <linearGradient id="mud" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#9a7b55"/><stop offset="1" stop-color="#6d5238"/>
    </linearGradient>
    <linearGradient id="river" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#7f9aa6"/><stop offset="1" stop-color="#58717c"/>
    </linearGradient>
    <linearGradient id="lake" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#7cc4c4"/><stop offset="1" stop-color="#3f8f95"/>
    </linearGradient>
    <radialGradient id="vignette" cx="0.5" cy="0.45" r="0.75">
      <stop offset="0.6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.28"/>
    </radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#sky)"/>`;
}

function clouds(r, color, n = 5, y0 = 40, y1 = 140, opacity = 0.9) {
  let s = "";
  for (let i = 0; i < n; i++) {
    const cx = r() * W;
    const cy = y0 + r() * (y1 - y0);
    const w = 120 + r() * 160;
    s += `<g fill="${color}" opacity="${opacity}">
      <ellipse cx="${cx}" cy="${cy}" rx="${w / 2}" ry="${w / 7}"/>
      <ellipse cx="${cx - w / 5}" cy="${cy - w / 12}" rx="${w / 4}" ry="${w / 7}"/>
      <ellipse cx="${cx + w / 6}" cy="${cy - w / 10}" rx="${w / 3.5}" ry="${w / 6}"/>
    </g>`;
  }
  return s;
}

function rain(r, n = 220, opacity = 0.35) {
  let s = `<g stroke="#e6ecf0" stroke-width="1.4" stroke-linecap="round" opacity="${opacity}">`;
  for (let i = 0; i < n; i++) {
    const x = r() * (W + 100);
    const y = r() * H;
    const len = 14 + r() * 18;
    s += `<line x1="${x}" y1="${y}" x2="${x - len * 0.35}" y2="${y + len}"/>`;
  }
  return s + "</g>";
}

function snowflakes(r, n = 160) {
  let s = `<g fill="#fff">`;
  for (let i = 0; i < n; i++) {
    s += `<circle cx="${r() * W}" cy="${r() * H}" r="${0.8 + r() * 2.4}" opacity="${0.5 + r() * 0.5}"/>`;
  }
  return s + "</g>";
}

function rock(cx, cy, size, r, fill = "#6d6a64", shade = "#57544f") {
  const pts = [];
  const n = 7;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const rr = size * (0.7 + r() * 0.35);
    pts.push(`${(cx + Math.cos(a) * rr * 1.25).toFixed(1)},${(cy + Math.sin(a) * rr * 0.8).toFixed(1)}`);
  }
  return `<polygon points="${pts.join(" ")}" fill="${fill}"/><path d="M${cx - size * 0.9},${cy + size * 0.15} Q${cx},${cy + size * 0.8} ${cx + size},${cy + size * 0.1}" fill="none" stroke="${shade}" stroke-width="${Math.max(1, size / 5)}" opacity="0.7"/>`;
}

function trees(r, n, yMin, yMax, color = "#3d4b3a", xMin = 0, xMax = W, snowy = false) {
  let s = "";
  for (let i = 0; i < n; i++) {
    const x = xMin + r() * (xMax - xMin);
    const y = yMin + r() * (yMax - yMin);
    const h = 18 + r() * 22;
    s += `<polygon points="${x},${y - h} ${x - h / 3.2},${y} ${x + h / 3.2},${y}" fill="${color}"/>`;
    if (snowy) s += `<polygon points="${x},${y - h} ${x - h / 7},${y - h * 0.62} ${x + h / 7},${y - h * 0.62}" fill="#fff"/>`;
  }
  return s;
}

function road(y1, y2, { color = "#55595d", dash = true } = {}) {
  // Gently sloping road across the scene from left to right.
  return `<path d="M0,${y1} L${W},${y2} L${W},${y2 + 42} L0,${y1 + 36} Z" fill="${color}"/>
  <path d="M0,${y1} L${W},${y2}" stroke="#3f4245" stroke-width="3"/>
  ${dash ? `<path d="M0,${y1 + 18} L${W},${y2 + 21}" stroke="#e8e2c8" stroke-width="3" stroke-dasharray="26 22" opacity="0.8"/>` : ""}`;
}

function wrap(body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice">${body}
  <rect width="${W}" height="${H}" fill="url(#vignette)"/>
</svg>`;
}

// ---------------------------------------------------------------------------

const scenes = {
  "landslide-1": () => {
    const r = rng(11), p = PALETTES.overcast;
    let debris = "";
    for (let i = 0; i < 90; i++) {
      const t = r();
      const y = 230 + t * 200;
      const half = 20 + t * 160;
      const x = 560 + (r() - 0.5) * 2 * half;
      debris += rock(x, y, 3 + r() * (6 + t * 12), r, r() > 0.5 ? "#7a6a58" : "#8d8174", "#5e5246");
    }
    return wrap(`${sky(p)}${clouds(r, "#c9d0d5", 4, 30, 110, 0.8)}${mountains(p, r)}
  <path d="M0,340 L${W},320 L${W},${H} L0,${H} Z" fill="${p.near}"/>
  ${trees(r, 26, 330, 380, "#35412f", 0, 380)}
  <path d="M0,455 C200,440 500,470 ${W},450 L${W},${H} L0,${H} Z" fill="url(#river)"/>
  ${road(372, 392)}
  <path d="M520,210 C545,200 590,205 610,220 C660,300 740,380 790,440 L340,440 C420,390 480,300 520,210 Z" fill="#8a7560"/>
  <path d="M530,225 C560,280 600,340 640,420" stroke="#6f5d4b" stroke-width="5" fill="none" opacity="0.6"/>
  ${debris}`);
  },
  "landslide-2": () => {
    const r = rng(23), p = PALETTES.dusk;
    let debris = "";
    for (let i = 0; i < 26; i++) debris += rock(660 + r() * 110, 360 + r() * 30, 3 + r() * 8, r, "#8a7c6b", "#665a4d");
    return wrap(`${sky(p)}${clouds(r, "#f0e2cf", 3, 40, 120, 0.6)}${mountains(p, r)}
  <path d="M0,330 L${W},340 L${W},${H} L0,${H} Z" fill="${p.near}"/>
  <path d="M600,250 C630,240 660,250 670,265 C700,310 740,340 790,370 L630,372 C640,330 620,290 600,250 Z" fill="#8f7c66" opacity="0.85"/>
  ${debris}
  ${road(378, 370)}
  ${trees(r, 30, 430, 490, "#3a4234")}`);
  },
  "flood-1": () => {
    const r = rng(37), p = PALETTES.overcast;
    let waves = "";
    for (let i = 0; i < 26; i++) {
      const x = r() * W, y = 350 + r() * 140, w = 30 + r() * 60;
      waves += `<path d="M${x},${y} q${w / 4},-6 ${w / 2},0 t${w / 2},0" stroke="#c9b18c" stroke-width="2" fill="none" opacity="0.65"/>`;
    }
    return wrap(`${sky(p)}${clouds(r, "#b9c2c9", 5, 20, 120, 0.85)}${mountains(p, r)}
  <path d="M0,320 L${W},330 L${W},${H} L0,${H} Z" fill="${p.near}"/>
  ${trees(r, 18, 320, 350, "#34402f")}
  <path d="M0,360 L250,352 L250,392 L0,400 Z" fill="#55595d"/>
  <path d="M0,370 L250,362" stroke="#e8e2c8" stroke-width="3" stroke-dasharray="22 18" opacity="0.8"/>
  <path d="M0,345 C150,352 300,338 ${W},348 L${W},${H} L0,${H} Z" fill="url(#mud)" opacity="0.97"/>
  <path d="M170,386 L420,378" stroke="#55595d" stroke-width="8" opacity="0.35"/>
  <g stroke="#3b3f42" stroke-width="4"><line x1="320" y1="250" x2="320" y2="392"/><line x1="560" y1="262" x2="560" y2="390"/></g>
  <path d="M300,262 L340,262 M540,274 L580,274" stroke="#3b3f42" stroke-width="3"/>
  <path d="M320,258 Q440,280 560,270" stroke="#2f3336" stroke-width="1.2" fill="none"/>
  <g fill="#3a4a36"><circle cx="650" cy="360" r="22"/><circle cx="672" cy="352" r="18"/><circle cx="110" cy="372" r="16"/></g>
  <path d="M430,368 L470,340 L510,368 Z" fill="#7b4a3a"/><rect x="438" y="366" width="64" height="14" fill="#c9b79a"/>
  ${waves}${rain(r, 90, 0.2)}`);
  },
  "flood-2": () => {
    const r = rng(41), p = PALETTES.clear;
    let waves = "";
    for (let i = 0; i < 30; i++) {
      const x = 150 + r() * 500, y = 380 + r() * 110, w = 20 + r() * 40;
      waves += `<path d="M${x},${y} q${w / 4},-5 ${w / 2},0 t${w / 2},0" stroke="#e8f1f3" stroke-width="2" fill="none" opacity="0.55"/>`;
    }
    return wrap(`${sky(p)}${clouds(r, "#fff", 3, 40, 110, 0.7)}${mountains(p, r)}
  <path d="M0,330 L${W},320 L${W},${H} L0,${H} Z" fill="${p.valley}"/>
  ${trees(r, 40, 340, 420, "#3f5a3a", 0, 220)}${trees(r, 40, 340, 420, "#3f5a3a", 590, 800)}
  <path d="M330,330 C300,380 180,430 120,${H} L690,${H} C620,430 480,380 400,330 Z" fill="url(#river)"/>
  <path d="M345,330 C320,380 230,430 190,${H} L620,${H} C560,430 460,380 390,330 Z" fill="#8fa7a5" opacity="0.45"/>
  ${waves}`);
  },
  "road-1": () => {
    const r = rng(53), p = PALETTES.overcast;
    let boulders = "";
    const pos = [[360, 395, 34], [440, 410, 42], [300, 425, 26], [500, 380, 22], [410, 370, 18], [250, 450, 14], [540, 430, 16]];
    for (const [x, y, s] of pos) boulders += rock(x, y, s, r, "#77726a", "#5c5850");
    return wrap(`${sky(p)}${clouds(r, "#c8cfd4", 4, 30, 110)}${mountains(p, r, { farY: 250, midY: 310 })}
  <path d="M0,300 L260,340 L0,${H} Z" fill="${p.near}"/>
  <path d="M${W},290 L540,340 L${W},${H} Z" fill="${p.near}"/>
  <path d="M370,322 L430,322 L720,${H} L80,${H} Z" fill="#5a5e62"/>
  <path d="M400,325 L400,${H}" stroke="#e8e2c8" stroke-width="5" stroke-dasharray="24 22" opacity="0.75"/>
  ${boulders}
  <g transform="translate(610,410)"><polygon points="0,-44 14,0 -14,0" fill="#e8742a"/><rect x="-7" y="-30" width="14" height="6" fill="#fff"/><rect x="-11" y="-14" width="22" height="6" fill="#fff"/><rect x="-20" y="0" width="40" height="7" rx="2" fill="#333"/></g>
  <g transform="translate(150,420)"><rect x="-4" y="-40" width="6" height="42" fill="#555"/><rect x="100" y="-40" width="6" height="42" fill="#555"/><rect x="-8" y="-48" width="120" height="16" fill="#fff"/>
  ${[0, 1, 2, 3, 4].map((i) => `<polygon points="${-8 + i * 24},-48 ${4 + i * 24},-48 ${-8 + i * 24 + 16},-32 ${-8 + i * 24 + 4},-32" fill="#d23c2f"/>`).join("")}</g>`);
  },
  "road-2": () => {
    const r = rng(67), p = PALETTES.storm;
    return wrap(`${sky(p)}${clouds(r, "#6c7680", 6, 20, 130)}${mountains(p, r)}
  <path d="M0,330 L${W},320 L${W},${H} L0,${H} Z" fill="${p.near}"/>
  <path d="M0,382 L330,372 L350,392 L318,418 L0,420 Z" fill="#55595d"/>
  <path d="M470,370 L${W},362 L${W},404 L500,412 L455,392 Z" fill="#55595d"/>
  <path d="M0,392 L310,383 M520,382 L${W},374" stroke="#e8e2c8" stroke-width="3" stroke-dasharray="24 20" opacity="0.7"/>
  <path d="M300,380 C340,420 360,430 380,440 C420,430 460,410 480,375 L520,${H} L260,${H} Z" fill="url(#mud)"/>
  <path d="M0,430 C200,420 300,470 400,460 C520,450 650,440 ${W},450 L${W},${H} L0,${H} Z" fill="url(#mud)"/>
  ${Array.from({ length: 14 }, () => `<path d="M${260 + r() * 520},${440 + r() * 50} q12,-5 24,0 t24,0" stroke="#c7ad86" stroke-width="2" fill="none" opacity="0.6"/>`).join("")}
  ${rock(330, 405, 10, r)}${rock(470, 398, 8, r)}
  ${rain(r, 260, 0.35)}`);
  },
  "rain-1": () => {
    const r = rng(79), p = PALETTES.storm;
    let houses = "";
    for (let i = 0; i < 16; i++) {
      const x = 40 + i * 48 + r() * 12, y = 360 + r() * 30, w = 28 + r() * 18, h = 18 + r() * 14;
      houses += `<rect x="${x}" y="${y - h}" width="${w}" height="${h}" fill="${r() > 0.5 ? "#b9aa92" : "#a39684"}"/><rect x="${x - 3}" y="${y - h - 4}" width="${w + 6}" height="5" fill="#6d6155"/>`;
      if (r() > 0.5) houses += `<rect x="${x + 6}" y="${y - h + 6}" width="6" height="6" fill="#f1d9a0" opacity="0.8"/>`;
    }
    return wrap(`${sky(p)}${mountains(p, r, { farY: 250, midY: 320 })}${clouds(r, "#56606a", 8, 10, 200, 0.95)}
  <path d="M0,340 L${W},335 L${W},${H} L0,${H} Z" fill="${p.valley}"/>
  ${houses}
  ${trees(r, 20, 380, 400, "#34402f")}
  <path d="M0,420 L${W},410 L${W},${H} L0,${H} Z" fill="#4b5055"/>
  <g fill="#9eabb5" opacity="0.25">${Array.from({ length: 18 }, () => `<ellipse cx="${r() * W}" cy="${440 + r() * 55}" rx="${20 + r() * 40}" ry="3"/>`).join("")}</g>
  ${rain(r, 420, 0.45)}`);
  },
  "rain-2": () => {
    const r = rng(83), p = PALETTES.overcast;
    let fields = "";
    for (let i = 0; i < 6; i++) fields += `<path d="M0,${380 + i * 20} L${W},${370 + i * 21}" stroke="${i % 2 ? "#6f7d5c" : "#7f8c67"}" stroke-width="20"/>`;
    return wrap(`${sky(p)}${clouds(r, "#7b8691", 7, 10, 170, 0.9)}${mountains(p, r)}
  <path d="M0,340 L${W},330 L${W},${H} L0,${H} Z" fill="${p.valley}"/>
  ${fields}
  ${trees(r, 30, 350, 380, "#3b4a36")}
  <path d="M520,${H} C540,440 600,400 700,370 L730,372 C640,405 580,450 570,${H} Z" fill="url(#river)"/>
  ${rain(r, 300, 0.4)}`);
  },
  "glacier-1": () => {
    const r = rng(97), p = PALETTES.clear;
    return wrap(`${sky(p)}${clouds(r, "#fff", 3, 40, 100, 0.7)}
  <path d="M-20,300 L140,120 L260,210 L400,60 L540,200 L660,110 L820,290 L820,${H} L-20,${H} Z" fill="#8397a8"/>
  <path d="M400,60 L350,120 L380,115 L400,140 L420,112 L450,125 Z M140,120 L110,160 L135,150 L150,170 L165,150 Z M660,110 L630,150 L655,145 L670,165 L690,145 Z" fill="#fff"/>
  <path d="M290,150 C340,105 470,105 520,150 C470,200 450,270 438,336 L382,336 C368,270 340,200 290,150 Z" fill="#e8f1f6"/>
  <path d="M325,165 Q405,190 485,165 M350,215 Q405,238 462,215 M368,265 Q408,284 448,265 M378,305 Q410,318 440,305" stroke="#b8cfdc" stroke-width="3" fill="none"/>
  <path d="M300,152 C350,190 372,260 382,336" stroke="#9fb3c2" stroke-width="3" fill="none" opacity="0.7"/>
  <path d="M0,330 L${W},320 L${W},${H} L0,${H} Z" fill="#6f7466"/>
  <ellipse cx="410" cy="345" rx="120" ry="20" fill="url(#lake)"/>
  <path d="M470,352 C520,380 540,420 600,${H} L680,${H} C610,430 560,380 490,350 Z" fill="url(#mud)"/>
  ${Array.from({ length: 30 }, () => rock(460 + r() * 240, 360 + r() * 140, 3 + r() * 7, r, "#77706a", "#5c5650")).join("")}
  ${trees(r, 24, 380, 470, "#3d4b3a", 0, 380)}`);
  },
  "snow-1": () => {
    const r = rng(101), p = PALETTES.winter;
    return wrap(`${sky(p)}${mountains(p, r)}
  <path d="M0,330 L${W},320 L${W},${H} L0,${H} Z" fill="#eef2f5"/>
  ${trees(r, 40, 330, 400, "#46554b", 0, W, true)}
  <path d="M340,330 L460,330 L760,${H} L40,${H} Z" fill="#dfe5ea"/>
  <path d="M380,332 L230,${H} M420,332 L560,${H}" stroke="#b9c3cc" stroke-width="10" opacity="0.8"/>
  ${snowflakes(r, 220)}`);
  },
  "rockfall-1": () => {
    const r = rng(113), p = PALETTES.overcast;
    let falling = "";
    for (let i = 0; i < 7; i++) {
      const x = 250 + r() * 140, y = 150 + r() * 180, s = 5 + r() * 10;
      falling += `<path d="M${x - 8},${y - 26} L${x - 2},${y - 8}" stroke="#d8dde0" stroke-width="2" opacity="0.7"/>` + rock(x, y, s, r);
    }
    let onRoad = "";
    for (let i = 0; i < 14; i++) onRoad += rock(260 + r() * 260, 395 + r() * 30, 4 + r() * 10, r);
    return wrap(`${sky(p)}${clouds(r, "#c9d0d5", 3, 30, 100)}${mountains(p, r)}
  <path d="M0,0 L180,0 C220,80 250,160 240,260 C235,320 260,360 300,390 L0,${H} Z" fill="#6b6660"/>
  <path d="M60,40 L90,120 L70,180 M150,60 L170,150 L140,230 M200,200 L215,280" stroke="#4e4a45" stroke-width="3" fill="none"/>
  <path d="M0,300 L20,120 L60,0" stroke="#7e7872" stroke-width="10" fill="none" opacity="0.5"/>
  <path d="M240,360 L${W},340 L${W},${H} L200,${H} Z" fill="${p.near}"/>
  ${road(398, 380)}
  ${onRoad}${falling}
  <g transform="translate(680,330)"><rect x="-3" y="0" width="6" height="60" fill="#555"/><polygon points="0,-40 34,16 -34,16" fill="#f2c230" stroke="#1f1f1f" stroke-width="3"/><rect x="-3" y="-20" width="6" height="20" fill="#1f1f1f"/><rect x="-3" y="4" width="6" height="6" fill="#1f1f1f"/></g>`);
  },
};

mkdirSync(new URL("../public/demo/", import.meta.url), { recursive: true });
for (const [name, build] of Object.entries(scenes)) {
  writeFileSync(new URL(`../public/demo/${name}.svg`, import.meta.url), build());
  console.log("wrote", name);
}
