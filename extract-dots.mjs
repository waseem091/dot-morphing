import { readFileSync, writeFileSync } from 'fs';

const BASE = String.raw`C:\Users\muham\.claude\projects\c--Users-muham-projects-dot-morphing\fa57be58-f20e-4938-b01e-07bf9a188e28\tool-results`;

function readJsx(filename) {
  const raw = readFileSync(`${BASE}\\${filename}`, 'utf8');
  const arr = JSON.parse(raw);
  return arr[0].text;
}

// Parse dots from absolute-positioned JSX (left/top in px)
function parseAbsoluteDots(jsxText) {
  const dots = [];
  const re = /left:\s*(\d+(?:\.\d+)?),\s*position:\s*'absolute',\s*top:\s*(\d+(?:\.\d+)?)/g;
  let m;
  while ((m = re.exec(jsxText)) !== null) {
    dots.push({ x: parseFloat(m[1]), y: parseFloat(m[2]) });
  }
  return dots;
}

// Parse dot-grid: flex grid with gap:2, dot size 6
// Count columns from JSX, each has 16 dots
function parseDotGrid(jsxText) {
  // Count column divs: each column has flexDirection:'column'
  const colMatches = [...jsxText.matchAll(/flexDirection:\s*'column'/g)];
  const numCols = colMatches.length;
  const numRows = 16;
  const dots = [];
  for (let c = 0; c < numCols; c++) {
    for (let r = 0; r < numRows; r++) {
      dots.push({ x: c * 8, y: r * 8 });
    }
  }
  return dots;
}

// Parse waseem: flex row of letter groups, each letter is a relative container
// with absolute-positioned dots inside
function parseFlexGroupDots(jsxText) {
  // Extract container groups: position:relative with width/height
  // Then extract dots within each group

  // Strategy: find all absolute-positioned dots with their left/top
  // and the containing group's left offset in the flex row

  // The flex row has gap: 20px between letter groups
  // Each group is a positioned div with width, and dots are absolute inside

  // Extract group widths and then dots per group
  const groups = [];

  // Find each group block: look for flexShrink:'0' position:relative blocks
  const groupRe = /height:\s*'(\d+)px'[^}]*position:\s*'relative'[^}]*width:\s*'(\d+)px'/g;
  let gm;
  while ((gm = groupRe.exec(jsxText)) !== null) {
    groups.push({ h: parseFloat(gm[1]), w: parseFloat(gm[2]), start: gm.index });
  }

  if (groups.length === 0) {
    // Fallback: just extract all absolute dots globally
    return parseAbsoluteDots(jsxText);
  }

  // Find end of each group (next group start or end of string)
  const dots = [];
  const gap = 20; // flex gap between letter groups

  let xOffset = 0;
  // Determine alignment — waseem groups are align-end (bottom-aligned)
  // So y offset for each group = maxH - groupH
  const maxH = Math.max(...groups.map(g => g.h));

  for (let i = 0; i < groups.length; i++) {
    const g = groups[i];
    const end = i + 1 < groups.length ? groups[i + 1].start : jsxText.length;
    const slice = jsxText.slice(g.start, end);

    const re = /left:\s*(\d+(?:\.\d+)?),\s*position:\s*'absolute',\s*top:\s*(\d+(?:\.\d+)?)/g;
    let m;
    while ((m = re.exec(slice)) !== null) {
      const localX = parseFloat(m[1]);
      const localY = parseFloat(m[2]);
      dots.push({ x: xOffset + localX, y: (maxH - g.h) + localY });
    }

    xOffset += g.w + gap;
  }

  return dots;
}

// Center dots in design space (630×360)
function center(dots, W = 630, H = 360) {
  if (dots.length === 0) return dots;
  const xs = dots.map(d => d.x), ys = dots.map(d => d.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
  const offX = W / 2 - cx, offY = H / 2 - cy;
  return dots.map(d => ({ x: d.x + offX, y: d.y + offY }));
}

// Normalize all shapes to same dot count N by stacking extra dots at existing positions
function normalize(dots, N) {
  if (dots.length >= N) return dots.slice(0, N);
  const out = [...dots];
  let i = 0;
  while (out.length < N) {
    out.push({ ...dots[i % dots.length] });
    i++;
  }
  return out;
}

// ── Load all shapes ──────────────────────────────────────────
const gridJsx  = readJsx('mcp-paper-get_jsx-1786588943853.txt');
const wtcJsx   = readJsx('toolu_01KW58DJfyjiYGnkxL1PbKc6.json');
const vkJsx    = readJsx('mcp-paper-get_jsx-1786589043030.txt');
const jetJsx   = readJsx('mcp-paper-get_jsx-1786589043792.txt');
const waseemJsx= readJsx('mcp-paper-get_jsx-1786589044814.txt');
const ikhtcJsx = readJsx('toolu_01BVqjaCf23JnH5rkvDP8BRT.json');

const rawGrid   = parseDotGrid(gridJsx);
const rawWtc    = parseAbsoluteDots(wtcJsx);
const rawVk     = parseAbsoluteDots(vkJsx);
const rawJet    = parseAbsoluteDots(jetJsx);
const rawWaseem = parseFlexGroupDots(waseemJsx);
const rawIkhtc  = parseFlexGroupDots(ikhtcJsx);

console.log('Raw counts:', {
  grid: rawGrid.length,
  wtc: rawWtc.length,
  vk: rawVk.length,
  jet: rawJet.length,
  waseem: rawWaseem.length,
  ikhtc: rawIkhtc.length,
});

// Center each shape
const cGrid   = center(rawGrid);
const cWtc    = center(rawWtc);
const cVk     = center(rawVk);
const cJet    = center(rawJet);
const cWaseem = center(rawWaseem);
const cIkhtc  = center(rawIkhtc);

// Find max dot count
const N = Math.max(
  cGrid.length, cWtc.length, cVk.length,
  cJet.length, cWaseem.length, cIkhtc.length
);
console.log('N (max dots):', N);

// Normalize to N dots
const shapes = {
  grid:   normalize(cGrid,   N),
  waseem: normalize(cWaseem, N),
  wtc:    normalize(cWtc,    N),
  vk:     normalize(cVk,     N),
  jet:    normalize(cJet,    N),
  ikhtc:  normalize(cIkhtc,  N),
};

// Output as TypeScript data file
const toArr = (dots) =>
  dots.map(d => `[${d.x.toFixed(1)},${d.y.toFixed(1)}]`).join(',');

const out = `// Auto-generated dot positions — design space 630×360
// Each entry: [x, y] in px
export const DOT_COUNT = ${N};

export const SHAPES: Record<string, [number,number][]> = {
  grid:   [${toArr(shapes.grid)}],
  waseem: [${toArr(shapes.waseem)}],
  wtc:    [${toArr(shapes.wtc)}],
  vk:     [${toArr(shapes.vk)}],
  jet:    [${toArr(shapes.jet)}],
  ikhtc:  [${toArr(shapes.ikhtc)}],
};

export const SEQUENCE = ['grid','waseem','wtc','vk','jet','ikhtc'] as const;
`;

writeFileSync('src/dots.ts', out, 'utf8');
console.log('Written src/dots.ts');
