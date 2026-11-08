import {
  CreatorBuildingItem,
  CreatorNpcConfig,
  CreatorPropItem,
  CreatorAnimalItem,
  CreatorTerrainType,
  CreatorFenceItem,
} from '../types/index.ts';

type ProjectFn = (wx: number, wy: number, wz: number) => { x: number; y: number };

// ============================================================================
// SHARED SPRITE ATLAS FOR THE 16 REFERENCE TERRAIN TEXTURES (4x4 GRID)
// ============================================================================
const TERRAIN_SPRITE_GRID_MAP: Partial<Record<CreatorTerrainType, { row: number; col: number }>> = {
  img_paving_herringbone_red: { row: 0, col: 0 },
  img_paving_basketweave_brown: { row: 0, col: 1 },
  img_paving_herringbone_grey: { row: 0, col: 2 },
  img_paving_hex_blue: { row: 0, col: 3 },
  img_stone_river_grey: { row: 1, col: 0 },
  img_stone_pebble_cream: { row: 1, col: 1 },
  img_stone_flagstone_brown: { row: 1, col: 2 },
  img_tile_dotted_grey: { row: 1, col: 3 },
  img_brick_running_pastel: { row: 2, col: 0 },
  img_paving_parquet_taupe: { row: 2, col: 1 },
  img_wood_plank_terracotta: { row: 2, col: 2 },
  img_brick_checker_red: { row: 2, col: 3 },
  img_cobble_rounded_cream: { row: 3, col: 0 },
  img_brick_classic_orange: { row: 3, col: 1 },
  img_paving_lattice_red: { row: 3, col: 2 },
  img_tile_diamond_gold: { row: 3, col: 3 },
};

// Exact crop rects (normalized 0..1 of the 626x626 reference image) for each of the 4 rows & 4 columns
// In the reference image, the 4 squares are arranged with white margins at:
// Cols: [0.041..0.242], [0.281..0.481], [0.520..0.721], [0.760..0.961]
// Rows: [0.040..0.241], [0.280..0.481], [0.520..0.721], [0.760..0.961]
const COL_CROP_NORM = [
  { start: 0.043, size: 0.196 },
  { start: 0.283, size: 0.196 },
  { start: 0.522, size: 0.196 },
  { start: 0.762, size: 0.196 },
];
const ROW_CROP_NORM = [
  { start: 0.042, size: 0.196 },
  { start: 0.282, size: 0.196 },
  { start: 0.522, size: 0.196 },
  { start: 0.762, size: 0.196 },
];

let terrainAtlasImg: HTMLImageElement | null = null;
let terrainAtlasLoaded = false;

function getTerrainAtlasImage(): HTMLImageElement | null {
  if (typeof window === 'undefined' || typeof Image === 'undefined') return null;
  if (!terrainAtlasImg) {
    terrainAtlasImg = new Image();
    terrainAtlasImg.crossOrigin = 'anonymous';
    terrainAtlasImg.onload = () => {
      terrainAtlasLoaded = true;
    };
    terrainAtlasImg.src = '/assets/aistudio/Jenis_Tanah_Tambahan_d5b803e2.jpg';
  }
  return terrainAtlasLoaded ? terrainAtlasImg : null;
}

export function shadeHex(hex: string, percent: number): string {
  const clean = (hex || '#38bdf8').replace('#', '');
  const num = parseInt(clean.length === 3 ? clean.replace(/(.)/g, '$1$1') : clean, 16);
  if (Number.isNaN(num)) return hex;
  const r = Math.min(255, Math.max(0, ((num >> 16) & 0xff) + percent));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + percent));
  const b = Math.min(255, Math.max(0, (num & 0xff) + percent));
  return `rgb(${r},${g},${b})`;
}

function drawIsoPrism(
  ctx: CanvasRenderingContext2D,
  project: ProjectFn,
  wx: number,
  wy: number,
  wz: number,
  dx: number,
  dy: number,
  dz: number,
  topColor: string,
  leftColor: string,
  rightColor: string,
  strokeColor = 'rgba(15,23,42,0.35)'
) {
  const x0 = wx - dx / 2;
  const x1 = wx + dx / 2;
  const y0 = wy - dy / 2;
  const y1 = wy + dy / 2;
  const z0 = wz;
  const z1 = wz + dz;

  const b10 = project(x1, y0, z0);
  const b11 = project(x1, y1, z0);
  const b01 = project(x0, y1, z0);

  const t00 = project(x0, y0, z1);
  const t10 = project(x1, y0, z1);
  const t11 = project(x1, y1, z1);
  const t01 = project(x0, y1, z1);

  // Left visible face: (x0, y1) -> (x1, y1)
  ctx.beginPath();
  ctx.moveTo(b01.x, b01.y);
  ctx.lineTo(b11.x, b11.y);
  ctx.lineTo(t11.x, t11.y);
  ctx.lineTo(t01.x, t01.y);
  ctx.closePath();
  ctx.fillStyle = leftColor;
  ctx.fill();
  if (strokeColor) {
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 0.8;
    ctx.stroke();
  }

  // Right visible face: (x1, y1) -> (x1, y0)
  ctx.beginPath();
  ctx.moveTo(b11.x, b11.y);
  ctx.lineTo(b10.x, b10.y);
  ctx.lineTo(t10.x, t10.y);
  ctx.lineTo(t11.x, t11.y);
  ctx.closePath();
  ctx.fillStyle = rightColor;
  ctx.fill();
  if (strokeColor) {
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 0.8;
    ctx.stroke();
  }

  // Top face
  ctx.beginPath();
  ctx.moveTo(t00.x, t00.y);
  ctx.lineTo(t10.x, t10.y);
  ctx.lineTo(t11.x, t11.y);
  ctx.lineTo(t01.x, t01.y);
  ctx.closePath();
  ctx.fillStyle = topColor;
  ctx.fill();
  if (strokeColor) {
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 0.8;
    ctx.stroke();
  }
}

function drawIsoPyramidRoof(
  ctx: CanvasRenderingContext2D,
  project: ProjectFn,
  wx: number,
  wy: number,
  wz: number,
  dx: number,
  dy: number,
  dz: number,
  baseColor: string
) {
  const x0 = wx - dx / 2;
  const x1 = wx + dx / 2;
  const y0 = wy - dy / 2;
  const y1 = wy + dy / 2;

  const p00 = project(x0, y0, wz);
  const p10 = project(x1, y0, wz);
  const p11 = project(x1, y1, wz);
  const p01 = project(x0, y1, wz);
  const apex = project(wx, wy, wz + dz);

  // Back-left
  ctx.beginPath();
  ctx.moveTo(p00.x, p00.y);
  ctx.lineTo(p01.x, p01.y);
  ctx.lineTo(apex.x, apex.y);
  ctx.closePath();
  ctx.fillStyle = shadeHex(baseColor, -15);
  ctx.fill();

  // Back-right
  ctx.beginPath();
  ctx.moveTo(p00.x, p00.y);
  ctx.lineTo(p10.x, p10.y);
  ctx.lineTo(apex.x, apex.y);
  ctx.closePath();
  ctx.fillStyle = shadeHex(baseColor, -5);
  ctx.fill();

  // Front-left
  ctx.beginPath();
  ctx.moveTo(p01.x, p01.y);
  ctx.lineTo(p11.x, p11.y);
  ctx.lineTo(apex.x, apex.y);
  ctx.closePath();
  ctx.fillStyle = shadeHex(baseColor, 18);
  ctx.fill();
  ctx.strokeStyle = 'rgba(15,23,42,0.28)';
  ctx.lineWidth = 0.7;
  ctx.stroke();

  // Front-right
  ctx.beginPath();
  ctx.moveTo(p11.x, p11.y);
  ctx.lineTo(p10.x, p10.y);
  ctx.lineTo(apex.x, apex.y);
  ctx.closePath();
  ctx.fillStyle = shadeHex(baseColor, -22);
  ctx.fill();
  ctx.stroke();
}

// Helper to draw isometric window grids on left-front (y1) and right-front (x1) faces
function drawBuildingWindowGrid(
  ctx: CanvasRenderingContext2D,
  project: ProjectFn,
  wx: number,
  wy: number,
  dx: number,
  dy: number,
  zStart: number,
  zEnd: number,
  rows: number,
  cols: number,
  windowColor: string,
  litColor: string,
  now: number
) {
  const x0 = wx - dx / 2;
  const x1 = wx + dx / 2;
  const y0 = wy - dy / 2;
  const y1 = wy + dy / 2;

  for (let r = 0; r < rows; r++) {
    const zBot = zStart + ((zEnd - zStart) * (r + 0.22)) / rows;
    const zTop = zStart + ((zEnd - zStart) * (r + 0.78)) / rows;

    // Left-front face windows (along x from x0 to x1 at y = y1)
    for (let c = 0; c < cols; c++) {
      const u0 = (c + 0.22) / cols;
      const u1 = (c + 0.78) / cols;
      const wxA = x0 + (x1 - x0) * u0;
      const wxB = x0 + (x1 - x0) * u1;

      const p0 = project(wxA, y1, zBot);
      const p1 = project(wxB, y1, zBot);
      const p2 = project(wxB, y1, zTop);
      const p3 = project(wxA, y1, zTop);

      const isWarmLit = ((r * 7 + c * 3 + Math.floor(now * 0.0005)) % 5) === 0;
      ctx.fillStyle = isWarmLit ? litColor : windowColor;
      ctx.beginPath();
      ctx.moveTo(p0.x, p0.y);
      ctx.lineTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.lineTo(p3.x, p3.y);
      ctx.closePath();
      ctx.fill();
    }

    // Right-front face windows (along y from y1 to y0 at x = x1)
    for (let c = 0; c < cols; c++) {
      const v0 = (c + 0.22) / cols;
      const v1 = (c + 0.78) / cols;
      const wyA = y1 + (y0 - y1) * v0;
      const wyB = y1 + (y0 - y1) * v1;

      const p0 = project(x1, wyA, zBot);
      const p1 = project(x1, wyB, zBot);
      const p2 = project(x1, wyB, zTop);
      const p3 = project(x1, wyA, zTop);

      const isWarmLit = ((r * 5 + c * 4 + Math.floor(now * 0.0004)) % 4) === 0;
      ctx.fillStyle = isWarmLit ? shadeHex(litColor, -15) : shadeHex(windowColor, -18);
      ctx.beginPath();
      ctx.moveTo(p0.x, p0.y);
      ctx.lineTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.lineTo(p3.x, p3.y);
      ctx.closePath();
      ctx.fill();
    }
  }
}

// Helper to draw front entrance door, canopy & steps on left-front face (y1)
function drawBuildingEntrance(
  ctx: CanvasRenderingContext2D,
  project: ProjectFn,
  wx: number,
  wy: number,
  dy: number,
  zBase: number,
  sc: number,
  canopyColor: string
) {
  const yFront = wy + dy / 2;
  // Entrance steps
  drawIsoPrism(
    ctx,
    project,
    wx,
    yFront + 0.07 * sc,
    0,
    0.26 * sc,
    0.14 * sc,
    zBase * 0.85,
    '#f1f5f9',
    '#cbd5e1',
    '#94a3b8'
  );

  // Double glass door on front-left face
  const dL = project(wx - 0.1 * sc, yFront + 0.005, zBase);
  const dR = project(wx + 0.1 * sc, yFront + 0.005, zBase);
  const dTR = project(wx + 0.1 * sc, yFront + 0.005, zBase + 0.22 * sc);
  const dTL = project(wx - 0.1 * sc, yFront + 0.005, zBase + 0.22 * sc);

  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.moveTo(dL.x, dL.y);
  ctx.lineTo(dR.x, dR.y);
  ctx.lineTo(dTR.x, dTR.y);
  ctx.lineTo(dTL.x, dTL.y);
  ctx.closePath();
  ctx.fill();

  // Warm welcoming light inside doorway
  ctx.fillStyle = 'rgba(253, 224, 71, 0.78)';
  ctx.beginPath();
  ctx.moveTo(dL.x + 1.5, dL.y - 1);
  ctx.lineTo(dR.x - 1.5, dR.y - 1);
  ctx.lineTo(dTR.x - 1.5, dTR.y + 1);
  ctx.lineTo(dTL.x + 1.5, dTL.y + 1);
  ctx.closePath();
  ctx.fill();

  // Door canopy awning
  drawIsoPrism(
    ctx,
    project,
    wx,
    yFront + 0.05 * sc,
    zBase + 0.22 * sc,
    0.28 * sc,
    0.12 * sc,
    0.04 * sc,
    shadeHex(canopyColor, 20),
    canopyColor,
    shadeHex(canopyColor, -20)
  );
}

// ============================================================================
// 1. CUSTOM BUILDINGS 3D RENDERER (14 HIGH-DETAIL ARCHITECTURAL MODELS)
// ============================================================================
export function drawCustomCreatorBuilding3D(
  ctx: CanvasRenderingContext2D,
  project: ProjectFn,
  tileW: number,
  building: CreatorBuildingItem,
  now: number,
  isHovered: boolean,
  isSelectedInStudio: boolean,
  isNearPlayer: boolean
) {
  const { wx, wy, modelType, accentColor, roofColor } = building;
  const sc = Math.max(0.55, Math.min(2.0, building.scale || 1.0));
  const pulse = 0.5 + 0.5 * Math.sin(now * 0.004);
  const elapsed = now * 0.001;

  const baseCenter = project(wx, wy, 0);

  ctx.save();

  // 1. Multi-layered Ground Shadow & Plaza Courtyard Base
  ctx.beginPath();
  ctx.ellipse(
    baseCenter.x,
    baseCenter.y + tileW * 0.06 * sc,
    tileW * 0.62 * sc,
    tileW * 0.32 * sc,
    0,
    0,
    Math.PI * 2
  );
  ctx.fillStyle = 'rgba(15, 23, 42, 0.30)';
  ctx.fill();

  // Highlight ring if selected in studio, hovered, or near player
  if (isSelectedInStudio || isHovered || isNearPlayer) {
    ctx.beginPath();
    ctx.ellipse(
      baseCenter.x,
      baseCenter.y + tileW * 0.03 * sc,
      tileW * 0.66 * sc,
      tileW * 0.34 * sc,
      0,
      0,
      Math.PI * 2
    );
    ctx.strokeStyle = isSelectedInStudio
      ? '#fbbf24'
      : isNearPlayer
      ? '#34d399'
      : accentColor;
    ctx.lineWidth = isSelectedInStudio ? 3 : 2.2;
    if (isSelectedInStudio) {
      ctx.setLineDash([6, 4]);
    }
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Two-tier Stone Courtyard Foundation Platform with Corner Shrubs
  drawIsoPrism(
    ctx,
    project,
    wx,
    wy,
    0,
    0.98 * sc,
    0.98 * sc,
    0.05 * sc,
    '#cbd5e1',
    '#94a3b8',
    '#64748b'
  );
  drawIsoPrism(
    ctx,
    project,
    wx,
    wy,
    0.05 * sc,
    0.9 * sc,
    0.9 * sc,
    0.04 * sc,
    '#f1f5f9',
    '#e2e8f0',
    '#cbd5e1'
  );

  // Corner ornamental hedges & lamp posts on building courtyard
  const cornerPosts = [
    [-0.41, 0.41],
    [0.41, 0.41],
    [0.41, -0.41],
  ];
  cornerPosts.forEach(([cx, cy], idx) => {
    const cp = project(wx + cx * sc, wy + cy * sc, 0.09 * sc);
    ctx.fillStyle = '#15803d';
    ctx.beginPath();
    ctx.arc(cp.x, cp.y - 3 * sc, 3.6 * sc, 0, Math.PI * 2);
    ctx.fill();
    if (idx < 2) {
      // Courtyard warm streetlamp at front corners
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1.4 * sc;
      ctx.beginPath();
      ctx.moveTo(cp.x, cp.y - 3 * sc);
      ctx.lineTo(cp.x, cp.y - 12 * sc);
      ctx.stroke();
      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.arc(cp.x, cp.y - 13 * sc, 2.4 * sc, 0, Math.PI * 2);
      ctx.fill();
    }
  });

  // 2. Model-specific Complex 3D Architecture & Refleksia Life Elements
  switch (modelType) {
    case 'modern_tower': {
      // Tier 1 Podium Lobby
      drawIsoPrism(
        ctx,
        project,
        wx,
        wy,
        0.09 * sc,
        0.78 * sc,
        0.78 * sc,
        0.32 * sc,
        shadeHex(accentColor, 30),
        shadeHex(accentColor, 10),
        shadeHex(accentColor, -18)
      );
      // Tier 2 Glass Curtain Wall Tower
      drawIsoPrism(
        ctx,
        project,
        wx,
        wy,
        0.41 * sc,
        0.64 * sc,
        0.64 * sc,
        1.05 * sc,
        shadeHex(accentColor, 22),
        shadeHex(accentColor, 2),
        shadeHex(accentColor, -26)
      );
      drawBuildingWindowGrid(
        ctx,
        project,
        wx,
        wy,
        0.64 * sc,
        0.64 * sc,
        0.44 * sc,
        1.42 * sc,
        6,
        3,
        'rgba(186, 230, 253, 0.85)',
        '#fef08a',
        now
      );
      // Tier 3 Penthouse Crown & Helipad Deck
      drawIsoPrism(
        ctx,
        project,
        wx,
        wy,
        1.46 * sc,
        0.48 * sc,
        0.48 * sc,
        0.42 * sc,
        shadeHex(roofColor, 24),
        shadeHex(roofColor, 0),
        shadeHex(roofColor, -24)
      );
      drawBuildingWindowGrid(
        ctx,
        project,
        wx,
        wy,
        0.48 * sc,
        0.48 * sc,
        1.5 * sc,
        1.84 * sc,
        2,
        2,
        'rgba(224, 242, 254, 0.9)',
        '#fde047',
        now
      );
      // Rooftop Helipad Circle + 'H' + Solar Array
      const heliC = project(wx, wy, 1.89 * sc);
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 1.4 * sc;
      ctx.beginPath();
      ctx.ellipse(heliC.x, heliC.y, 10 * sc, 5 * sc, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.font = `900 ${Math.round(7 * sc)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText('H', heliC.x, heliC.y + 2 * sc);

      // Communication Spire & Aircraft Warning Beacon
      const spireTop = project(wx - 0.12 * sc, wy - 0.12 * sc, 2.32 * sc);
      const spireBase = project(wx - 0.12 * sc, wy - 0.12 * sc, 1.88 * sc);
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 2 * sc;
      ctx.beginPath();
      ctx.moveTo(spireBase.x, spireBase.y);
      ctx.lineTo(spireTop.x, spireTop.y);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(spireTop.x, spireTop.y, (3.2 + pulse * 1.5) * sc, 0, Math.PI * 2);
      ctx.fillStyle = pulse > 0.5 ? '#ef4444' : '#fda4af';
      ctx.fill();

      drawBuildingEntrance(ctx, project, wx, wy, 0.78 * sc, 0.09 * sc, sc, roofColor);
      break;
    }

    case 'innovation_lab': {
      // Main Research Wing
      drawIsoPrism(
        ctx,
        project,
        wx,
        wy,
        0.09 * sc,
        0.8 * sc,
        0.74 * sc,
        0.62 * sc,
        '#f8fafc',
        '#e2e8f0',
        '#cbd5e1'
      );
      // Cyan/Accent Energy Belt
      drawIsoPrism(
        ctx,
        project,
        wx,
        wy,
        0.38 * sc,
        0.84 * sc,
        0.78 * sc,
        0.11 * sc,
        shadeHex(accentColor, 18),
        accentColor,
        shadeHex(accentColor, -22)
      );
      drawBuildingWindowGrid(
        ctx,
        project,
        wx,
        wy,
        0.8 * sc,
        0.74 * sc,
        0.14 * sc,
        0.66 * sc,
        2,
        3,
        '#38bdf8',
        '#a5f3fc',
        now
      );

      // Rooftop Solar Panels (Left Wing)
      drawIsoPrism(
        ctx,
        project,
        wx - 0.22 * sc,
        wy + 0.16 * sc,
        0.71 * sc,
        0.24 * sc,
        0.22 * sc,
        0.05 * sc,
        '#1e3a8a',
        '#1e40af',
        '#172554'
      );

      // Observatory Geodesic Dome + Telescope Slit + Rotating Atom Ring
      const domeBase = project(wx + 0.06 * sc, wy - 0.04 * sc, 0.71 * sc);
      ctx.beginPath();
      ctx.arc(domeBase.x, domeBase.y - tileW * 0.06 * sc, tileW * 0.25 * sc, Math.PI, 0);
      ctx.closePath();
      ctx.fillStyle = roofColor;
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.6 * sc;
      ctx.stroke();

      // Telescope barrel peeking out
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 3 * sc;
      ctx.beginPath();
      ctx.moveTo(domeBase.x + 3 * sc, domeBase.y - 10 * sc);
      ctx.lineTo(domeBase.x + 12 * sc, domeBase.y - 19 * sc);
      ctx.stroke();

      // Animated Orbiting Atom Electrons above Lab
      const atomCenter = project(wx, wy, 1.08 * sc);
      for (let i = 0; i < 2; i++) {
        const rot = (i === 0 ? 0.45 : -0.45) + Math.sin(elapsed * 1.5) * 0.15;
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.65)';
        ctx.lineWidth = 1.2 * sc;
        ctx.beginPath();
        ctx.ellipse(atomCenter.x, atomCenter.y, 13 * sc, 5 * sc, rot, 0, Math.PI * 2);
        ctx.stroke();
        const eAng = elapsed * 3.2 + i * Math.PI;
        const ex = atomCenter.x + Math.cos(eAng) * 12 * sc * Math.cos(rot);
        const ey = atomCenter.y + Math.sin(eAng) * 5 * sc;
        ctx.fillStyle = '#fde047';
        ctx.beginPath();
        ctx.arc(ex, ey, 2.2 * sc, 0, Math.PI * 2);
        ctx.fill();
      }

      drawBuildingEntrance(ctx, project, wx, wy, 0.74 * sc, 0.09 * sc, sc, accentColor);
      break;
    }

    case 'school_pavilion': {
      // Warm Academic Brick Hall
      drawIsoPrism(
        ctx,
        project,
        wx,
        wy,
        0.09 * sc,
        0.84 * sc,
        0.7 * sc,
        0.58 * sc,
        '#fef3c7',
        '#fde68a',
        '#f59e0b'
      );
      drawBuildingWindowGrid(
        ctx,
        project,
        wx,
        wy,
        0.84 * sc,
        0.7 * sc,
        0.16 * sc,
        0.62 * sc,
        2,
        4,
        '#0284c7',
        '#fef08a',
        now
      );
      // Pitched Terracotta/Accent Roof
      drawIsoPyramidRoof(
        ctx,
        project,
        wx,
        wy,
        0.67 * sc,
        0.94 * sc,
        0.8 * sc,
        0.4 * sc,
        roofColor
      );
      // Central Clock Tower & Belfry
      drawIsoPrism(
        ctx,
        project,
        wx,
        wy,
        0.92 * sc,
        0.28 * sc,
        0.28 * sc,
        0.38 * sc,
        '#fffbeb',
        '#fef3c7',
        '#d97706'
      );
      drawIsoPyramidRoof(
        ctx,
        project,
        wx,
        wy,
        1.3 * sc,
        0.34 * sc,
        0.34 * sc,
        0.22 * sc,
        accentColor
      );
      // Clock face with hands
      const clk = project(wx, wy + 0.14 * sc, 1.12 * sc);
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 1.2 * sc;
      ctx.beginPath();
      ctx.arc(clk.x, clk.y, 4.5 * sc, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(clk.x, clk.y);
      ctx.lineTo(clk.x, clk.y - 3 * sc);
      ctx.moveTo(clk.x, clk.y);
      ctx.lineTo(clk.x + 2.5 * sc, clk.y);
      ctx.stroke();

      // Schoolyard Flagpole with Fluttering Red-White Flag
      const fpBase = project(wx - 0.36 * sc, wy + 0.42 * sc, 0.09 * sc);
      const fpTop = project(wx - 0.36 * sc, wy + 0.42 * sc, 0.85 * sc);
      ctx.strokeStyle = '#f8fafc';
      ctx.lineWidth = 1.6 * sc;
      ctx.beginPath();
      ctx.moveTo(fpBase.x, fpBase.y);
      ctx.lineTo(fpTop.x, fpTop.y);
      ctx.stroke();
      const wave = Math.sin(elapsed * 5) * 1.8 * sc;
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(fpTop.x, fpTop.y, 9 * sc, 3 * sc + wave * 0.2);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(fpTop.x, fpTop.y + 3 * sc, 9 * sc, 3 * sc + wave * 0.2);

      drawBuildingEntrance(ctx, project, wx, wy, 0.7 * sc, 0.09 * sc, sc, roofColor);
      break;
    }

    case 'creative_studio': {
      // Sleek Dark Media Production Hub
      drawIsoPrism(
        ctx,
        project,
        wx,
        wy,
        0.09 * sc,
        0.78 * sc,
        0.74 * sc,
        0.66 * sc,
        shadeHex(roofColor, 12),
        '#1e293b',
        '#0f172a'
      );
      drawBuildingWindowGrid(
        ctx,
        project,
        wx,
        wy,
        0.78 * sc,
        0.74 * sc,
        0.16 * sc,
        0.68 * sc,
        2,
        3,
        '#a855f7',
        '#f472b6',
        now
      );
      // Neon Crown Trim
      drawIsoPrism(
        ctx,
        project,
        wx,
        wy,
        0.75 * sc,
        0.82 * sc,
        0.78 * sc,
        0.09 * sc,
        shadeHex(accentColor, 20),
        accentColor,
        shadeHex(accentColor, -20)
      );
      // Satellite Dish on Right Roof
      const dishP = project(wx + 0.24 * sc, wy - 0.18 * sc, 0.88 * sc);
      ctx.fillStyle = '#cbd5e1';
      ctx.beginPath();
      ctx.arc(dishP.x, dishP.y - 4 * sc, 5.5 * sc, 0.2, Math.PI + 0.2);
      ctx.fill();

      // Giant Rooftop LED Billboard with Animated Audio Equalizer Bars
      const bb = project(wx, wy, 1.08 * sc);
      ctx.fillStyle = '#090d16';
      ctx.strokeStyle = accentColor;
      ctx.lineWidth = 2 * sc;
      ctx.beginPath();
      ctx.roundRect(bb.x - 24 * sc, bb.y - 18 * sc, 48 * sc, 26 * sc, 4 * sc);
      ctx.fill();
      ctx.stroke();

      // Equalizer bars inside billboard
      const eqCols = ['#f472b6', '#38bdf8', '#facc15', '#4ade80', '#a855f7', '#fb7185'];
      eqCols.forEach((col, i) => {
        const bh = (4 + Math.abs(Math.sin(elapsed * 6 + i * 1.1)) * 10) * sc;
        ctx.fillStyle = col;
        ctx.fillRect(bb.x + (-18 + i * 6.2) * sc, bb.y + 4 * sc - bh, 4.2 * sc, bh);
      });
      ctx.fillStyle = '#ffffff';
      ctx.font = `900 ${Math.round(7.5 * sc)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText('● ON AIR', bb.x, bb.y - 10 * sc);

      drawBuildingEntrance(ctx, project, wx, wy, 0.74 * sc, 0.09 * sc, sc, accentColor);
      break;
    }

    case 'office_hq': {
      // Twin Executive Towers + Glass Skybridge + Rooftop Garden
      drawIsoPrism(
        ctx,
        project,
        wx - 0.21 * sc,
        wy,
        0.09 * sc,
        0.36 * sc,
        0.6 * sc,
        1.08 * sc,
        shadeHex(accentColor, 22),
        accentColor,
        shadeHex(accentColor, -25)
      );
      drawBuildingWindowGrid(
        ctx,
        project,
        wx - 0.21 * sc,
        wy,
        0.36 * sc,
        0.6 * sc,
        0.15 * sc,
        1.1 * sc,
        5,
        2,
        '#e0f2fe',
        '#fef08a',
        now
      );

      drawIsoPrism(
        ctx,
        project,
        wx + 0.21 * sc,
        wy,
        0.09 * sc,
        0.36 * sc,
        0.6 * sc,
        0.92 * sc,
        shadeHex(roofColor, 25),
        roofColor,
        shadeHex(roofColor, -25)
      );
      drawBuildingWindowGrid(
        ctx,
        project,
        wx + 0.21 * sc,
        wy,
        0.36 * sc,
        0.6 * sc,
        0.15 * sc,
        0.95 * sc,
        4,
        2,
        '#bae6fd',
        '#fde047',
        now
      );

      // Panoramic Glass Skybridge connecting the twin towers
      drawIsoPrism(
        ctx,
        project,
        wx,
        wy,
        0.6 * sc,
        0.52 * sc,
        0.28 * sc,
        0.15 * sc,
        '#e0f2fe',
        '#7dd3fc',
        '#0284c7'
      );

      // Green Rooftop Eco-Garden on East Tower
      const roofGarden = project(wx + 0.21 * sc, wy, 1.02 * sc);
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.arc(roofGarden.x - 3 * sc, roofGarden.y, 3.2 * sc, 0, Math.PI * 2);
      ctx.arc(roofGarden.x + 3 * sc, roofGarden.y, 2.8 * sc, 0, Math.PI * 2);
      ctx.fill();

      drawBuildingEntrance(ctx, project, wx, wy, 0.6 * sc, 0.09 * sc, sc, accentColor);
      break;
    }

    case 'arcade_arena': {
      // Cyber Arcade Hall with Pixel Invader / Joystick Crown
      drawIsoPrism(
        ctx,
        project,
        wx,
        wy,
        0.09 * sc,
        0.8 * sc,
        0.8 * sc,
        0.7 * sc,
        '#1e1b4b',
        '#312e81',
        '#0f172a'
      );
      drawBuildingWindowGrid(
        ctx,
        project,
        wx,
        wy,
        0.8 * sc,
        0.8 * sc,
        0.16 * sc,
        0.72 * sc,
        2,
        3,
        '#f43f5e',
        '#38bdf8',
        now
      );
      drawIsoPrism(
        ctx,
        project,
        wx,
        wy,
        0.79 * sc,
        0.86 * sc,
        0.86 * sc,
        0.14 * sc,
        shadeHex(accentColor, 25),
        accentColor,
        shadeHex(roofColor, -10)
      );
      // Giant 3D Arcade Joystick & Glowing Orb on Roof
      const topP = project(wx, wy, 1.02 * sc);
      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.ellipse(topP.x, topP.y + 4 * sc, 11 * sc, 5.5 * sc, 0, 0, Math.PI * 2);
      ctx.fill();
      const stickTilt = Math.sin(elapsed * 3.5) * 3.5 * sc;
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 3 * sc;
      ctx.beginPath();
      ctx.moveTo(topP.x, topP.y + 3 * sc);
      ctx.lineTo(topP.x + stickTilt, topP.y - 10 * sc);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(topP.x + stickTilt, topP.y - 12 * sc, (6.5 + pulse * 1.5) * sc, 0, Math.PI * 2);
      ctx.fillStyle = accentColor;
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.6 * sc;
      ctx.stroke();

      drawBuildingEntrance(ctx, project, wx, wy, 0.8 * sc, 0.09 * sc, sc, accentColor);
      break;
    }

    case 'concert_stage': {
      // Festival Main Stage Deck
      drawIsoPrism(
        ctx,
        project,
        wx,
        wy,
        0.09 * sc,
        0.9 * sc,
        0.82 * sc,
        0.18 * sc,
        '#334155',
        '#1e293b',
        '#0f172a'
      );
      // LED Backdrop Wall
      drawIsoPrism(
        ctx,
        project,
        wx - 0.24 * sc,
        wy - 0.24 * sc,
        0.27 * sc,
        0.74 * sc,
        0.16 * sc,
        0.72 * sc,
        shadeHex(accentColor, 15),
        accentColor,
        roofColor
      );
      // Left & Right Line-Array Speaker Towers
      [
        [-0.36, 0.28],
        [0.36, -0.28],
      ].forEach(([sx, sy]) => {
        drawIsoPrism(
          ctx,
          project,
          wx + sx * sc,
          wy + sy * sc,
          0.27 * sc,
          0.16 * sc,
          0.16 * sc,
          0.55 * sc,
          '#1e293b',
          '#0f172a',
          '#020617'
        );
      });
      // Stage Canopy Roof Rig
      drawIsoPrism(
        ctx,
        project,
        wx,
        wy,
        0.96 * sc,
        0.88 * sc,
        0.78 * sc,
        0.1 * sc,
        shadeHex(roofColor, 20),
        roofColor,
        shadeHex(roofColor, -25)
      );
      // Sweeping Laser Spotlights
      const spotOrigin1 = project(wx - 0.25 * sc, wy + 0.2 * sc, 0.96 * sc);
      const spotOrigin2 = project(wx + 0.25 * sc, wy - 0.2 * sc, 0.96 * sc);
      const sway1 = Math.sin(elapsed * 2.8) * 14 * sc;
      const sway2 = Math.cos(elapsed * 2.8) * 14 * sc;
      ctx.strokeStyle = 'rgba(250, 204, 21, 0.45)';
      ctx.lineWidth = 4 * sc;
      ctx.beginPath();
      ctx.moveTo(spotOrigin1.x, spotOrigin1.y);
      ctx.lineTo(spotOrigin1.x + sway1, spotOrigin1.y + 24 * sc);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
      ctx.beginPath();
      ctx.moveTo(spotOrigin2.x, spotOrigin2.y);
      ctx.lineTo(spotOrigin2.x + sway2, spotOrigin2.y + 24 * sc);
      ctx.stroke();
      break;
    }

    case 'ferris_park': {
      // Ticket Booth & Boarding Platform
      drawIsoPrism(
        ctx,
        project,
        wx,
        wy,
        0.09 * sc,
        0.68 * sc,
        0.58 * sc,
        0.16 * sc,
        '#fce7f3',
        '#fbcfe8',
        '#f472b6'
      );
      const hub = project(wx, wy, 1.02 * sc);
      const baseL = project(wx - 0.28 * sc, wy + 0.18 * sc, 0.22 * sc);
      const baseR = project(wx + 0.28 * sc, wy - 0.18 * sc, 0.22 * sc);

      // A-frame support legs
      ctx.beginPath();
      ctx.moveTo(baseL.x, baseL.y);
      ctx.lineTo(hub.x, hub.y);
      ctx.lineTo(baseR.x, baseR.y);
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 3.2 * sc;
      ctx.stroke();

      // Outer & Inner Wheel rims
      const wheelR = tileW * 0.44 * sc;
      ctx.beginPath();
      ctx.arc(hub.x, hub.y, wheelR, 0, Math.PI * 2);
      ctx.strokeStyle = accentColor;
      ctx.lineWidth = 3 * sc;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(hub.x, hub.y, wheelR * 0.62, 0, Math.PI * 2);
      ctx.strokeStyle = '#fde047';
      ctx.lineWidth = 1.4 * sc;
      ctx.stroke();

      // Rotating spokes & Detailed Gondola Cabins
      const angleBase = now * 0.00085;
      const cabinColors = ['#f43f5e', '#facc15', '#38bdf8', '#4ade80', '#a855f7', '#fb923c', '#ec4899', '#2dd4bf'];
      for (let i = 0; i < 8; i++) {
        const a = angleBase + (i * Math.PI) / 4;
        const cx = hub.x + Math.cos(a) * wheelR;
        const cy = hub.y + Math.sin(a) * wheelR;
        ctx.beginPath();
        ctx.moveTo(hub.x, hub.y);
        ctx.lineTo(cx, cy);
        ctx.strokeStyle = 'rgba(255,255,255,0.65)';
        ctx.lineWidth = 1.2 * sc;
        ctx.stroke();

        // Hanging gondola cabin
        ctx.fillStyle = cabinColors[i % cabinColors.length];
        ctx.beginPath();
        ctx.roundRect(cx - 4.2 * sc, cy - 1 * sc, 8.4 * sc, 7 * sc, 2.5 * sc);
        ctx.fill();
        ctx.fillStyle = '#e0f2fe';
        ctx.fillRect(cx - 2.6 * sc, cy + 0.5 * sc, 5.2 * sc, 2.5 * sc);
      }
      // Hub star
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(hub.x, hub.y, 4.5 * sc, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 'esports_dome': {
      // Cyber Stadium Base
      drawIsoPrism(
        ctx,
        project,
        wx,
        wy,
        0.09 * sc,
        0.86 * sc,
        0.86 * sc,
        0.36 * sc,
        '#0f172a',
        '#1e293b',
        '#020617'
      );
      const domeP = project(wx, wy, 0.44 * sc);
      ctx.beginPath();
      ctx.ellipse(
        domeP.x,
        domeP.y - tileW * 0.06 * sc,
        tileW * 0.44 * sc,
        tileW * 0.29 * sc,
        0,
        Math.PI,
        0
      );
      ctx.closePath();
      ctx.fillStyle = roofColor;
      ctx.fill();
      ctx.strokeStyle = accentColor;
      ctx.lineWidth = 2.6 * sc;
      ctx.stroke();

      // Geodesic Neon Ribs across the Dome
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.7)';
      ctx.lineWidth = 1.3 * sc;
      [-0.22, 0, 0.22].forEach((rib) => {
        ctx.beginPath();
        ctx.ellipse(
          domeP.x + rib * tileW * sc,
          domeP.y - tileW * 0.06 * sc,
          tileW * 0.14 * sc,
          tileW * 0.27 * sc,
          0,
          Math.PI,
          0
        );
        ctx.stroke();
      });

      // Floating Trophy Hologram above Dome
      const holoP = project(wx, wy, 0.98 * sc + Math.sin(elapsed * 3) * 0.04 * sc);
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(holoP.x, holoP.y, 4.5 * sc, 0, Math.PI * 2);
      ctx.fill();

      drawBuildingEntrance(ctx, project, wx, wy, 0.86 * sc, 0.09 * sc, sc, accentColor);
      break;
    }

    case 'open_cafe': {
      // Cozy Artisan Bakery & Coffee House
      drawIsoPrism(
        ctx,
        project,
        wx,
        wy,
        0.09 * sc,
        0.64 * sc,
        0.58 * sc,
        0.52 * sc,
        '#fffbeb',
        '#fef3c7',
        '#fde68a'
      );
      drawBuildingWindowGrid(
        ctx,
        project,
        wx,
        wy,
        0.64 * sc,
        0.58 * sc,
        0.18 * sc,
        0.54 * sc,
        1,
        2,
        '#fde047',
        '#fef08a',
        now
      );
      drawIsoPyramidRoof(
        ctx,
        project,
        wx,
        wy,
        0.61 * sc,
        0.78 * sc,
        0.74 * sc,
        0.34 * sc,
        accentColor
      );

      // Outdoor Patio Umbrella + Bistro Table + Steaming Coffee Cup
      const patioP = project(wx + 0.26 * sc, wy + 0.34 * sc, 0.09 * sc);
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(patioP.x, patioP.y - 4 * sc, 5.5 * sc, 2.8 * sc, 0, 0, Math.PI * 2);
      ctx.fill();
      // Umbrella pole & canopy
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 1.4 * sc;
      ctx.beginPath();
      ctx.moveTo(patioP.x, patioP.y);
      ctx.lineTo(patioP.x, patioP.y - 14 * sc);
      ctx.stroke();
      ctx.fillStyle = roofColor;
      ctx.beginPath();
      ctx.arc(patioP.x, patioP.y - 12 * sc, 7.5 * sc, Math.PI, 0);
      ctx.closePath();
      ctx.fill();

      // Rooftop Coffee Cup Sign with Rising Steam
      const cupP = project(wx, wy, 0.96 * sc);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(cupP.x - 3.5 * sc, cupP.y - 4 * sc, 7 * sc, 5 * sc);
      ctx.strokeStyle = 'rgba(255,255,255,0.75)';
      ctx.lineWidth = 1.1 * sc;
      const steamShift = Math.sin(elapsed * 4) * 1.5 * sc;
      ctx.beginPath();
      ctx.moveTo(cupP.x - 1.5 * sc, cupP.y - 5 * sc);
      ctx.lineTo(cupP.x - 1.5 * sc + steamShift, cupP.y - 10 * sc);
      ctx.moveTo(cupP.x + 1.5 * sc, cupP.y - 5 * sc);
      ctx.lineTo(cupP.x + 1.5 * sc - steamShift, cupP.y - 10 * sc);
      ctx.stroke();

      drawBuildingEntrance(ctx, project, wx, wy, 0.58 * sc, 0.09 * sc, sc, roofColor);
      break;
    }

    case 'reading_gazebo': {
      // Wooden Deck Base
      drawIsoPrism(
        ctx,
        project,
        wx,
        wy,
        0.09 * sc,
        0.74 * sc,
        0.74 * sc,
        0.06 * sc,
        '#d97706',
        '#b45309',
        '#78350f'
      );
      // Center Bookshelf & Reading Table inside Gazebo
      drawIsoPrism(
        ctx,
        project,
        wx,
        wy,
        0.15 * sc,
        0.28 * sc,
        0.24 * sc,
        0.26 * sc,
        '#fde68a',
        '#b45309',
        '#92400e'
      );
      // 4 Corner Timber Pillars
      const pillarOffsets = [
        [-0.3, -0.3],
        [0.3, -0.3],
        [0.3, 0.3],
        [-0.3, 0.3],
      ];
      pillarOffsets.forEach(([ox, oy]) => {
        drawIsoPrism(
          ctx,
          project,
          wx + ox * sc,
          wy + oy * sc,
          0.15 * sc,
          0.08 * sc,
          0.08 * sc,
          0.48 * sc,
          '#d97706',
          '#b45309',
          '#78350f'
        );
      });
      // Hanging Warm Lantern in Center
      const lanternP = project(wx, wy, 0.54 * sc);
      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.arc(lanternP.x, lanternP.y, 3.2 * sc, 0, Math.PI * 2);
      ctx.fill();

      drawIsoPyramidRoof(
        ctx,
        project,
        wx,
        wy,
        0.63 * sc,
        0.86 * sc,
        0.86 * sc,
        0.38 * sc,
        roofColor
      );
      break;
    }

    case 'fountain_plaza': {
      // Grand Marble Plaza Basin
      drawIsoPrism(
        ctx,
        project,
        wx,
        wy,
        0.09 * sc,
        0.88 * sc,
        0.88 * sc,
        0.16 * sc,
        '#38bdf8',
        '#cbd5e1',
        '#94a3b8'
      );
      drawIsoPrism(
        ctx,
        project,
        wx,
        wy,
        0.25 * sc,
        0.48 * sc,
        0.48 * sc,
        0.22 * sc,
        '#7dd3fc',
        '#e2e8f0',
        '#cbd5e1'
      );
      drawIsoPrism(
        ctx,
        project,
        wx,
        wy,
        0.47 * sc,
        0.22 * sc,
        0.22 * sc,
        0.18 * sc,
        '#e0f2fe',
        '#f8fafc',
        '#cbd5e1'
      );
      // Main geyser & 4 parabolic water arcs
      const jetTop = project(wx, wy, (0.86 + pulse * 0.14) * sc);
      const jetBase = project(wx, wy, 0.65 * sc);
      ctx.beginPath();
      ctx.moveTo(jetBase.x, jetBase.y);
      ctx.lineTo(jetTop.x, jetTop.y);
      ctx.strokeStyle = '#e0f2fe';
      ctx.lineWidth = 3.2 * sc;
      ctx.stroke();

      [-10, -5, 5, 10].forEach((arcX) => {
        ctx.strokeStyle = 'rgba(186, 230, 253, 0.85)';
        ctx.lineWidth = 1.5 * sc;
        ctx.beginPath();
        ctx.moveTo(jetBase.x, jetBase.y);
        ctx.quadraticCurveTo(
          jetBase.x + arcX * 0.6 * sc,
          jetTop.y - 4 * sc,
          jetBase.x + arcX * 1.2 * sc,
          jetBase.y + 14 * sc
        );
        ctx.stroke();
      });
      break;
    }

    case 'info_kiosk': {
      // Smart Interactive City Totem
      drawIsoPrism(
        ctx,
        project,
        wx,
        wy,
        0.09 * sc,
        0.44 * sc,
        0.34 * sc,
        0.86 * sc,
        shadeHex(accentColor, 20),
        '#1e293b',
        '#0f172a'
      );
      // Glowing Touch Screen Display on Front
      const scrP = project(wx, wy + 0.18 * sc, 0.52 * sc);
      ctx.fillStyle = '#0284c7';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.4 * sc;
      ctx.beginPath();
      ctx.roundRect(scrP.x - 8 * sc, scrP.y - 12 * sc, 16 * sc, 22 * sc, 2 * sc);
      ctx.fill();
      ctx.stroke();
      // Screen UI lines
      ctx.fillStyle = '#e0f2fe';
      ctx.fillRect(scrP.x - 5 * sc, scrP.y - 8 * sc, 10 * sc, 2 * sc);
      ctx.fillRect(scrP.x - 5 * sc, scrP.y - 4 * sc, 7 * sc, 2 * sc);
      ctx.fillStyle = '#facc15';
      ctx.fillRect(scrP.x - 5 * sc, scrP.y + 1 * sc, 10 * sc, 4 * sc);

      drawIsoPrism(
        ctx,
        project,
        wx,
        wy,
        0.95 * sc,
        0.54 * sc,
        0.44 * sc,
        0.1 * sc,
        accentColor,
        roofColor,
        shadeHex(roofColor, -20)
      );
      break;
    }

    case 'sakura_park':
    default: {
      // Japanese Stone Lantern (Toro) + Red Torii/Bridge Accent + Sakura Blossom Tree
      const lanternBase = project(wx - 0.25 * sc, wy + 0.22 * sc, 0.09 * sc);
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(lanternBase.x - 2.5 * sc, lanternBase.y - 10 * sc, 5 * sc, 10 * sc);
      ctx.fillStyle = '#fde047';
      ctx.fillRect(lanternBase.x - 2 * sc, lanternBase.y - 8 * sc, 4 * sc, 3 * sc);
      ctx.fillStyle = '#64748b';
      ctx.beginPath();
      ctx.moveTo(lanternBase.x, lanternBase.y - 14 * sc);
      ctx.lineTo(lanternBase.x - 5 * sc, lanternBase.y - 9 * sc);
      ctx.lineTo(lanternBase.x + 5 * sc, lanternBase.y - 9 * sc);
      ctx.closePath();
      ctx.fill();

      // Main Sakura Trunk
      drawIsoPrism(
        ctx,
        project,
        wx,
        wy,
        0.09 * sc,
        0.16 * sc,
        0.16 * sc,
        0.58 * sc,
        '#78350f',
        '#713f12',
        '#451a03'
      );
      const canopyCenter = project(wx, wy, 0.88 * sc);
      ctx.beginPath();
      ctx.arc(canopyCenter.x, canopyCenter.y, tileW * 0.35 * sc, 0, Math.PI * 2);
      ctx.fillStyle = accentColor || '#f472b6';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(
        canopyCenter.x - tileW * 0.17 * sc,
        canopyCenter.y + tileW * 0.06 * sc,
        tileW * 0.25 * sc,
        0,
        Math.PI * 2
      );
      ctx.fillStyle = shadeHex(accentColor || '#f472b6', 22);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(
        canopyCenter.x + tileW * 0.17 * sc,
        canopyCenter.y + tileW * 0.05 * sc,
        tileW * 0.25 * sc,
        0,
        Math.PI * 2
      );
      ctx.fillStyle = roofColor || '#db2777';
      ctx.fill();

      // Falling Pink Sakura Petals
      for (let i = 0; i < 5; i++) {
        const pPhase = (elapsed * 0.9 + i * 0.35) % 1;
        const px = canopyCenter.x + Math.sin(elapsed * 2 + i * 1.7) * 14 * sc;
        const py = canopyCenter.y + pPhase * 26 * sc;
        ctx.fillStyle = '#fbcfe8';
        ctx.beginPath();
        ctx.ellipse(px, py, 2 * sc, 1.1 * sc, pPhase * Math.PI, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
  }

  // 3. Floating Building Label Badge + Interactive Template Tag
  const labelZ =
    modelType === 'modern_tower'
      ? 2.38 * sc
      : modelType === 'ferris_park' || modelType === 'office_hq'
      ? 1.62 * sc
      : 1.32 * sc;
  const labelAnchor = project(wx, wy, labelZ);

  const badgeTitle = `${building.icon} ${building.name}`;
  ctx.font = '800 11px "Inter", system-ui, sans-serif';
  const titleW = ctx.measureText(badgeTitle).width;
  ctx.font = '600 9px "Inter", system-ui, sans-serif';
  const subW = building.tagline ? ctx.measureText(building.tagline).width : 0;

  const boxW = Math.max(titleW, subW) + 18;
  const boxH = building.tagline ? 30 : 20;
  const bx = labelAnchor.x - boxW / 2;
  const by = labelAnchor.y - boxH;

  ctx.fillStyle = isSelectedInStudio
    ? 'rgba(120, 53, 15, 0.94)'
    : 'rgba(15, 23, 42, 0.90)';
  ctx.strokeStyle = isSelectedInStudio
    ? '#fbbf24'
    : isHovered || isNearPlayer
    ? '#38bdf8'
    : building.accentColor;
  ctx.lineWidth = isSelectedInStudio ? 2 : 1.4;

  ctx.beginPath();
  ctx.roundRect(bx, by, boxW, boxH, 8);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.font = '800 10.5px "Inter", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(badgeTitle, labelAnchor.x, by + 10);

  if (building.tagline) {
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '600 8.5px "Inter", system-ui, sans-serif';
    ctx.fillText(building.tagline, labelAnchor.x, by + 22);
  }

  ctx.restore();
}

export function drawCreatorStudioMapGizmos(
  ctx: CanvasRenderingContext2D,
  project: ProjectFn,
  tileW: number,
  params: {
    selectedCoords: { wx: number; wy: number; label: string } | null;
    selectedNpcConfig: CreatorNpcConfig | null;
    hoverGhostCoords: { wx: number; wy: number; icon: string; name: string } | null;
    now: number;
  }
) {
  const { selectedCoords, selectedNpcConfig, hoverGhostCoords, now } = params;

  ctx.save();

  // 1. If an NPC is selected, draw its home anchor + wander radius or patrol waypoints
  if (selectedNpcConfig) {
    const homeP = project(selectedNpcConfig.homeWx, selectedNpcConfig.homeWy, 0.02);

    if (selectedNpcConfig.movementMode === 'wander') {
      const rPx = Math.max(18, selectedNpcConfig.wanderRadius * tileW * 0.45);
      ctx.beginPath();
      ctx.ellipse(homeP.x, homeP.y, rPx, rPx * 0.52, 0, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.75)';
      ctx.fillStyle = 'rgba(16, 185, 129, 0.08)';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.fill();
      ctx.stroke();
      ctx.setLineDash([]);
    } else if (
      selectedNpcConfig.movementMode === 'patrol' &&
      Array.isArray(selectedNpcConfig.patrolWaypoints) &&
      selectedNpcConfig.patrolWaypoints.length > 0
    ) {
      const pts = selectedNpcConfig.patrolWaypoints.map((wp) =>
        project(wp.wx, wp.wy, 0.05)
      );
      ctx.beginPath();
      ctx.moveTo(homeP.x, homeP.y);
      pts.forEach((p) => ctx.lineTo(p.x, p.y));
      ctx.strokeStyle = '#e879f9';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([5, 3]);
      ctx.stroke();
      ctx.setLineDash([]);

      pts.forEach((p, idx) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 7, 0, Math.PI * 2);
        ctx.fillStyle = '#a21caf';
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.font = '800 9px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(idx + 1), p.x, p.y);
      });
    }
  }

  // 2. Selected object gizmo ring & drag badge
  if (selectedCoords) {
    const p = project(selectedCoords.wx, selectedCoords.wy, 0.03);
    const pulseR = 1 + 0.08 * Math.sin(now * 0.006);
    ctx.beginPath();
    ctx.ellipse(
      p.x,
      p.y,
      tileW * 0.55 * pulseR,
      tileW * 0.28 * pulseR,
      0,
      0,
      Math.PI * 2
    );
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2.5;
    ctx.setLineDash([6, 4]);
    ctx.stroke();
    ctx.setLineDash([]);

    const coordStr = `✥ Geser: ${selectedCoords.label} (${selectedCoords.wx.toFixed(1)}, ${selectedCoords.wy.toFixed(1)})`;
    ctx.font = '800 10px monospace';
    const cw = ctx.measureText(coordStr).width + 14;
    ctx.fillStyle = 'rgba(245, 158, 11, 0.95)';
    ctx.beginPath();
    ctx.roundRect(p.x - cw / 2, p.y + 12, cw, 18, 6);
    ctx.fill();
    ctx.fillStyle = '#0f172a';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(coordStr, p.x, p.y + 21);
  }

  // 3. Hover placement ghost
  if (hoverGhostCoords) {
    const gp = project(hoverGhostCoords.wx, hoverGhostCoords.wy, 0.04);
    ctx.beginPath();
    ctx.ellipse(gp.x, gp.y, tileW * 0.55, tileW * 0.28, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(251, 191, 36, 0.28)';
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2;
    ctx.fill();
    ctx.stroke();

    ctx.font = '800 11px sans-serif';
    ctx.fillStyle = '#fef08a';
    ctx.textAlign = 'center';
    ctx.fillText(
      `Klik untuk taruh ${hoverGhostCoords.icon} ${hoverGhostCoords.name} (${hoverGhostCoords.wx.toFixed(1)}, ${hoverGhostCoords.wy.toFixed(1)})`,
      gp.x,
      gp.y - 16
    );
  }

  ctx.restore();
}

// ============================================================================
// 4. CUSTOM PROPS 3D RENDERER (32 DETAILED MODELS SUPPORTING REFLEKSIA LIFE)
// ============================================================================
export function drawCustomCreatorProp3D(
  ctx: CanvasRenderingContext2D,
  project: ProjectFn,
  tileW: number,
  prop: CreatorPropItem,
  now: number,
  isSelectedInStudio: boolean
) {
  const { wx, wy, propModel, scale = 1.0 } = prop;
  const sc = Math.max(0.5, Math.min(2.2, scale)) * (tileW / 38);
  const pt = project(wx, wy, 0);
  const elapsed = now * 0.001;
  const breeze = Math.sin(elapsed * 2.2 + wx * 0.7 + wy * 0.5) * 1.5 * sc;

  ctx.save();

  // Selection ring in Creator Studio
  if (isSelectedInStudio) {
    const ringR = prop.propCategory === 'sports_court' ? 42 * sc : 22 * sc;
    ctx.beginPath();
    ctx.ellipse(pt.x, pt.y + 2 * sc, ringR, ringR * 0.5, 0, 0, Math.PI * 2);
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2.4;
    ctx.setLineDash([5, 3]);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Soft Ground Shadow (Courts draw their own full surface)
  if (prop.propCategory !== 'sports_court') {
    ctx.fillStyle = 'rgba(15, 23, 42, 0.26)';
    ctx.beginPath();
    ctx.ellipse(pt.x, pt.y + 2 * sc, 15 * sc, 7.5 * sc, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  switch (propModel) {
    // ---------------- POHON (6 MODEL BERDETAIL TINGGI) ----------------
    case 'tree_oak_apple': {
      // Stone tree ring planter + grass tuft
      ctx.fillStyle = '#94a3b8';
      ctx.beginPath();
      ctx.ellipse(pt.x, pt.y + 1 * sc, 9 * sc, 4.2 * sc, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#15803d';
      ctx.beginPath();
      ctx.ellipse(pt.x, pt.y + 0.5 * sc, 7 * sc, 3 * sc, 0, 0, Math.PI * 2);
      ctx.fill();

      // Sculpted trunk with root flares & branches
      ctx.fillStyle = '#78350f';
      ctx.beginPath();
      ctx.moveTo(pt.x - 5 * sc, pt.y + 1 * sc);
      ctx.lineTo(pt.x - 3 * sc, pt.y - 24 * sc);
      ctx.lineTo(pt.x + 3 * sc, pt.y - 24 * sc);
      ctx.lineTo(pt.x + 5 * sc, pt.y + 1 * sc);
      ctx.closePath();
      ctx.fill();
      // Bark highlight
      ctx.fillStyle = '#92400e';
      ctx.fillRect(pt.x - 1.5 * sc, pt.y - 22 * sc, 2 * sc, 20 * sc);

      // Wooden birdhouse hanging on right branch
      ctx.fillStyle = '#fef3c7';
      ctx.fillRect(pt.x + 5 * sc, pt.y - 18 * sc, 4.5 * sc, 4.5 * sc);
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.moveTo(pt.x + 7.25 * sc, pt.y - 21 * sc);
      ctx.lineTo(pt.x + 4 * sc, pt.y - 18 * sc);
      ctx.lineTo(pt.x + 10.5 * sc, pt.y - 18 * sc);
      ctx.closePath();
      ctx.fill();

      // Multi-layered 3D canopy clusters (Shadow -> Mid -> Highlight)
      ctx.fillStyle = '#14532d';
      ctx.beginPath();
      ctx.arc(pt.x - 9 * sc + breeze, pt.y - 25 * sc, 11 * sc, 0, Math.PI * 2);
      ctx.arc(pt.x + 9 * sc + breeze, pt.y - 25 * sc, 11 * sc, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#16a34a';
      ctx.beginPath();
      ctx.arc(pt.x - 6 * sc + breeze, pt.y - 30 * sc, 11.5 * sc, 0, Math.PI * 2);
      ctx.arc(pt.x + 6 * sc + breeze, pt.y - 30 * sc, 11.5 * sc, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#4ade80';
      ctx.beginPath();
      ctx.arc(pt.x + breeze, pt.y - 36 * sc, 12.5 * sc, 0, Math.PI * 2);
      ctx.fill();

      // Glossy red apples with leaf stems
      const apples = [
        [-8, -27],
        [7, -30],
        [0, -24],
        [-4, -38],
        [6, -24],
        [2, -34],
      ];
      apples.forEach(([ax, ay]) => {
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(pt.x + ax * sc + breeze, pt.y + ay * sc, 2.5 * sc, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fca5a5';
        ctx.beginPath();
        ctx.arc(pt.x + (ax - 0.7) * sc + breeze, pt.y + (ay - 0.7) * sc, 0.8 * sc, 0, Math.PI * 2);
        ctx.fill();
      });
      break;
    }

    case 'tree_pine_spruce': {
      // Base boulders & ferns
      ctx.fillStyle = '#64748b';
      ctx.beginPath();
      ctx.arc(pt.x - 5 * sc, pt.y, 3.2 * sc, 0, Math.PI * 2);
      ctx.arc(pt.x + 5 * sc, pt.y + 0.5 * sc, 2.6 * sc, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#5c280b';
      ctx.fillRect(pt.x - 3 * sc, pt.y - 18 * sc, 6 * sc, 18 * sc);

      const tiers = [
        { y: -10, w: 18, h: 15, cDark: '#064e3b', cLight: '#047857' },
        { y: -20, w: 15, h: 15, cDark: '#065f46', cLight: '#059669' },
        { y: -30, w: 11.5, h: 14, cDark: '#047857', cLight: '#10b981' },
        { y: -39, w: 8, h: 12, cDark: '#059669', cLight: '#34d399' },
      ];
      tiers.forEach((t) => {
        // Left shaded side
        ctx.fillStyle = t.cLight;
        ctx.beginPath();
        ctx.moveTo(pt.x + breeze * 0.7, pt.y + (t.y - t.h) * sc);
        ctx.lineTo(pt.x - t.w * sc, pt.y + t.y * sc);
        ctx.lineTo(pt.x, pt.y + (t.y + 2) * sc);
        ctx.closePath();
        ctx.fill();
        // Right darker side
        ctx.fillStyle = t.cDark;
        ctx.beginPath();
        ctx.moveTo(pt.x + breeze * 0.7, pt.y + (t.y - t.h) * sc);
        ctx.lineTo(pt.x, pt.y + (t.y + 2) * sc);
        ctx.lineTo(pt.x + t.w * sc, pt.y + t.y * sc);
        ctx.closePath();
        ctx.fill();
      });

      // Pinecones
      ctx.fillStyle = '#92400e';
      [
        [-5, -15],
        [5, -24],
        [-3, -32],
      ].forEach(([px, py]) => {
        ctx.beginPath();
        ctx.ellipse(pt.x + px * sc + breeze * 0.5, pt.y + py * sc, 1.4 * sc, 2.2 * sc, 0, 0, Math.PI * 2);
        ctx.fill();
      });
      break;
    }

    case 'tree_sakura_pink': {
      // Dropped sakura petals ring on ground
      ctx.fillStyle = 'rgba(244, 114, 182, 0.35)';
      ctx.beginPath();
      ctx.ellipse(pt.x, pt.y + 1.5 * sc, 14 * sc, 6.5 * sc, 0, 0, Math.PI * 2);
      ctx.fill();

      // Gnarled cherry wood trunk & branches
      ctx.strokeStyle = '#4c1d95';
      ctx.lineWidth = 5 * sc;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(pt.x, pt.y + 1 * sc);
      ctx.quadraticCurveTo(pt.x - 2 * sc, pt.y - 12 * sc, pt.x + breeze * 0.4, pt.y - 25 * sc);
      ctx.stroke();

      // Blossom layers
      ctx.fillStyle = '#db2777';
      ctx.beginPath();
      ctx.arc(pt.x - 9 * sc + breeze, pt.y - 25 * sc, 11 * sc, 0, Math.PI * 2);
      ctx.arc(pt.x + 9 * sc + breeze, pt.y - 25 * sc, 11 * sc, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f472b6';
      ctx.beginPath();
      ctx.arc(pt.x - 5 * sc + breeze, pt.y - 31 * sc, 11.5 * sc, 0, Math.PI * 2);
      ctx.arc(pt.x + 5 * sc + breeze, pt.y - 31 * sc, 11.5 * sc, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fbcfe8';
      ctx.beginPath();
      ctx.arc(pt.x + breeze, pt.y - 36 * sc, 12 * sc, 0, Math.PI * 2);
      ctx.fill();

      // Drifting sakura petals
      for (let i = 0; i < 4; i++) {
        const fall = ((elapsed * 0.8 + i * 0.25) % 1) * 26 * sc;
        const sx = pt.x + Math.sin(elapsed * 2.5 + i * 2) * 11 * sc;
        ctx.fillStyle = '#f9a8d4';
        ctx.beginPath();
        ctx.arc(sx, pt.y - 28 * sc + fall, 1.5 * sc, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }

    case 'tree_banyan_shady': {
      // Stone circular bench around the banyan base
      ctx.fillStyle = '#cbd5e1';
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 1.2 * sc;
      ctx.beginPath();
      ctx.ellipse(pt.x, pt.y + 1 * sc, 13 * sc, 6 * sc, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Massive multi-root trunk
      ctx.fillStyle = '#5c280b';
      ctx.fillRect(pt.x - 5.5 * sc, pt.y - 26 * sc, 11 * sc, 26 * sc);
      // Aerial hanging roots & warm hanging lantern
      ctx.strokeStyle = '#92400e';
      ctx.lineWidth = 1.3 * sc;
      [-11, -7, -3, 4, 8, 11].forEach((rx) => {
        ctx.beginPath();
        ctx.moveTo(pt.x + rx * sc + breeze * 0.5, pt.y - 23 * sc);
        ctx.lineTo(pt.x + rx * 0.85 * sc, pt.y - 4 * sc);
        ctx.stroke();
      });
      // Hanging lantern on left bough
      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.arc(pt.x - 11 * sc + breeze * 0.5, pt.y - 15 * sc, 2.5 * sc, 0, Math.PI * 2);
      ctx.fill();

      // Expansive shady banyan crown
      ctx.fillStyle = '#14532d';
      ctx.beginPath();
      ctx.ellipse(pt.x + breeze, pt.y - 27 * sc, 22 * sc, 11.5 * sc, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#16a34a';
      ctx.beginPath();
      ctx.ellipse(pt.x + breeze, pt.y - 33 * sc, 18 * sc, 10 * sc, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#4ade80';
      ctx.beginPath();
      ctx.ellipse(pt.x + breeze, pt.y - 38 * sc, 13 * sc, 7.5 * sc, 0, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 'tree_palm_tropical': {
      // Sandy island base + shells
      ctx.fillStyle = '#fde68a';
      ctx.beginPath();
      ctx.ellipse(pt.x, pt.y + 1 * sc, 10 * sc, 4.8 * sc, 0, 0, Math.PI * 2);
      ctx.fill();

      // Segmented curved trunk
      ctx.strokeStyle = '#92400e';
      ctx.lineWidth = 5 * sc;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(pt.x, pt.y);
      ctx.quadraticCurveTo(pt.x + 5 * sc, pt.y - 16 * sc, pt.x + 2 * sc + breeze, pt.y - 33 * sc);
      ctx.stroke();

      const topX = pt.x + 2 * sc + breeze;
      const topY = pt.y - 33 * sc;

      // Cluster of 3 Coconuts under fronds
      ctx.fillStyle = '#78350f';
      [
        [-2.2, 2],
        [2.2, 2],
        [0, 3.5],
      ].forEach(([cx, cy]) => {
        ctx.beginPath();
        ctx.arc(topX + cx * sc, topY + cy * sc, 2.3 * sc, 0, Math.PI * 2);
        ctx.fill();
      });

      // Lush arched palm fronds
      [-16, -10, -4, 4, 10, 16].forEach((dx, idx) => {
        ctx.strokeStyle = idx % 2 === 0 ? '#16a34a' : '#22c55e';
        ctx.lineWidth = 3.2 * sc;
        ctx.beginPath();
        ctx.moveTo(topX, topY);
        ctx.quadraticCurveTo(
          topX + dx * 0.65 * sc,
          topY - (7 + (idx % 2) * 3) * sc,
          topX + dx * 1.3 * sc,
          topY + 6 * sc
        );
        ctx.stroke();
      });
      break;
    }

    case 'tree_autumn_maple': {
      // Fallen golden-orange leaves carpet
      ctx.fillStyle = 'rgba(249, 115, 22, 0.32)';
      ctx.beginPath();
      ctx.ellipse(pt.x, pt.y + 1.5 * sc, 13 * sc, 6 * sc, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#78350f';
      ctx.fillRect(pt.x - 3.2 * sc, pt.y - 24 * sc, 6.4 * sc, 24 * sc);

      ctx.fillStyle = '#c2410c';
      ctx.beginPath();
      ctx.arc(pt.x - 8 * sc + breeze, pt.y - 25 * sc, 11 * sc, 0, Math.PI * 2);
      ctx.arc(pt.x + 8 * sc + breeze, pt.y - 25 * sc, 11 * sc, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.arc(pt.x - 4 * sc + breeze, pt.y - 31 * sc, 11 * sc, 0, Math.PI * 2);
      ctx.arc(pt.x + 4 * sc + breeze, pt.y - 31 * sc, 11 * sc, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(pt.x + breeze, pt.y - 36 * sc, 11.5 * sc, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    // ---------------- TEMPAT DUDUK / BANGKU (5 MODEL + PROPERTI KEHIDUPAN) ----------------
    case 'bench_wood_classic':
    case 'bench_white_minimal':
    case 'bench_stone_marble':
    case 'bench_royal_gold': {
      const seatColor =
        propModel === 'bench_white_minimal'
          ? '#f8fafc'
          : propModel === 'bench_stone_marble'
          ? '#e2e8f0'
          : propModel === 'bench_royal_gold'
          ? '#dc2626' // Royal crimson velvet cushion with gold trim
          : '#d97706';
      const frameColor =
        propModel === 'bench_royal_gold'
          ? '#fbbf24'
          : propModel === 'bench_white_minimal'
          ? '#475569'
          : '#1e293b';

      // Paved stone pad under bench
      ctx.fillStyle = 'rgba(148, 163, 184, 0.45)';
      ctx.beginPath();
      ctx.ellipse(pt.x, pt.y + 1.5 * sc, 16 * sc, 7 * sc, 0, 0, Math.PI * 2);
      ctx.fill();

      // Side flower pot next to bench (Supporting Refleksia park life)
      ctx.fillStyle = '#b45309';
      ctx.fillRect(pt.x + 13.5 * sc, pt.y - 5 * sc, 4.5 * sc, 5 * sc);
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.arc(pt.x + 15.7 * sc, pt.y - 7 * sc, 3.2 * sc, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f43f5e';
      ctx.beginPath();
      ctx.arc(pt.x + 15.7 * sc, pt.y - 8.5 * sc, 1.5 * sc, 0, Math.PI * 2);
      ctx.fill();

      // Bench Legs & Armrests
      ctx.fillStyle = frameColor;
      ctx.fillRect(pt.x - 11 * sc, pt.y - 6 * sc, 2.5 * sc, 7 * sc);
      ctx.fillRect(pt.x + 8.5 * sc, pt.y - 6 * sc, 2.5 * sc, 7 * sc);

      // Seat Planks (3D layered)
      ctx.fillStyle = seatColor;
      ctx.beginPath();
      ctx.roundRect(pt.x - 12.5 * sc, pt.y - 8.5 * sc, 25 * sc, 5 * sc, 2 * sc);
      ctx.fill();
      ctx.strokeStyle = frameColor;
      ctx.lineWidth = 1 * sc;
      ctx.stroke();

      // Backrest with slat lines
      ctx.fillStyle = shadeHex(seatColor, -12);
      ctx.beginPath();
      ctx.roundRect(pt.x - 12 * sc, pt.y - 15 * sc, 24 * sc, 5.5 * sc, 2 * sc);
      ctx.fill();
      ctx.stroke();

      // Open book / journal left on bench by a Refleksia citizen
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(pt.x - 7 * sc, pt.y - 8 * sc, 4.5 * sc, 3 * sc);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(pt.x - 6.5 * sc, pt.y - 7.6 * sc, 3.5 * sc, 2.2 * sc);
      break;
    }

    case 'bench_picnic_table': {
      // Grass/stone pad
      ctx.fillStyle = 'rgba(148, 163, 184, 0.38)';
      ctx.beginPath();
      ctx.ellipse(pt.x, pt.y + 2 * sc, 19 * sc, 9 * sc, 0, 0, Math.PI * 2);
      ctx.fill();

      // Back & Front Benches
      ctx.fillStyle = '#92400e';
      ctx.beginPath();
      ctx.roundRect(pt.x - 15 * sc, pt.y - 10 * sc, 30 * sc, 3 * sc, 1.5 * sc);
      ctx.roundRect(pt.x - 16 * sc, pt.y - 3.5 * sc, 32 * sc, 3.5 * sc, 1.5 * sc);
      ctx.fill();

      // A-Frame Legs
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 2.4 * sc;
      ctx.beginPath();
      ctx.moveTo(pt.x - 10 * sc, pt.y + 1 * sc);
      ctx.lineTo(pt.x - 7 * sc, pt.y - 11 * sc);
      ctx.moveTo(pt.x + 10 * sc, pt.y + 1 * sc);
      ctx.lineTo(pt.x + 7 * sc, pt.y - 11 * sc);
      ctx.stroke();

      // Main Table Top with wood plank lines
      ctx.fillStyle = '#d97706';
      ctx.beginPath();
      ctx.roundRect(pt.x - 13.5 * sc, pt.y - 12.5 * sc, 27 * sc, 6.5 * sc, 2 * sc);
      ctx.fill();
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 1 * sc;
      ctx.stroke();

      // Picnic Basket & Drink Pitcher on Table
      ctx.fillStyle = '#fef3c7';
      ctx.strokeStyle = '#92400e';
      ctx.fillRect(pt.x - 6 * sc, pt.y - 15 * sc, 6 * sc, 4.2 * sc);
      ctx.strokeRect(pt.x - 6 * sc, pt.y - 15 * sc, 6 * sc, 4.2 * sc);
      // Red checkered cloth peek
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(pt.x - 6.2 * sc, pt.y - 15.5 * sc, 6.4 * sc, 1.4 * sc);
      // Orange juice pitcher
      ctx.fillStyle = '#fb923c';
      ctx.fillRect(pt.x + 3 * sc, pt.y - 15 * sc, 3.2 * sc, 4.2 * sc);
      break;
    }

    // ---------------- AYUNAN (2 MODEL) ----------------
    case 'swing_wood_garden':
    case 'swing_cyan_modern': {
      const frameColor = propModel === 'swing_cyan_modern' ? '#0891b2' : '#92400e';
      const barColor = propModel === 'swing_cyan_modern' ? '#22d3ee' : '#15803d';
      const swingSway1 = Math.sin(elapsed * 2.8 + wx) * 2.8 * sc;
      const swingSway2 = Math.sin(elapsed * 2.8 + wx + 1.4) * 2.4 * sc;

      // Soft safety rubber/sand mat under swing
      ctx.fillStyle = propModel === 'swing_cyan_modern' ? 'rgba(56, 189, 248, 0.25)' : 'rgba(253, 230, 138, 0.45)';
      ctx.beginPath();
      ctx.ellipse(pt.x, pt.y + 1.5 * sc, 18 * sc, 8 * sc, 0, 0, Math.PI * 2);
      ctx.fill();

      // Double A-frame legs (3D depth)
      ctx.strokeStyle = frameColor;
      ctx.lineWidth = 2.8 * sc;
      ctx.lineCap = 'round';
      ctx.beginPath();
      // Left A-frame
      ctx.moveTo(pt.x - 16 * sc, pt.y + 2 * sc);
      ctx.lineTo(pt.x - 12 * sc, pt.y - 25 * sc);
      ctx.lineTo(pt.x - 9 * sc, pt.y + 1 * sc);
      // Right A-frame
      ctx.moveTo(pt.x + 9 * sc, pt.y + 1 * sc);
      ctx.lineTo(pt.x + 12 * sc, pt.y - 25 * sc);
      ctx.lineTo(pt.x + 16 * sc, pt.y + 2 * sc);
      // Top crossbar
      ctx.moveTo(pt.x - 13 * sc, pt.y - 25 * sc);
      ctx.lineTo(pt.x + 13 * sc, pt.y - 25 * sc);
      ctx.stroke();

      // Decorative Canopy Awning / Leaf Garland on top bar
      ctx.fillStyle = barColor;
      ctx.beginPath();
      ctx.roundRect(pt.x - 14 * sc, pt.y - 28 * sc, 28 * sc, 4 * sc, 2 * sc);
      ctx.fill();

      // Two independent swinging seats with backrests
      [
        { sx: -5.5, sway: swingSway1, col: '#fbbf24' },
        { sx: 5.5, sway: swingSway2, col: '#f43f5e' },
      ].forEach(({ sx, sway, col }) => {
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 1.2 * sc;
        ctx.beginPath();
        ctx.moveTo(pt.x + (sx - 2.2) * sc, pt.y - 24 * sc);
        ctx.lineTo(pt.x + (sx - 2.2) * sc + sway, pt.y - 8 * sc);
        ctx.moveTo(pt.x + (sx + 2.2) * sc, pt.y - 24 * sc);
        ctx.lineTo(pt.x + (sx + 2.2) * sc + sway, pt.y - 8 * sc);
        ctx.stroke();

        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.roundRect(pt.x + (sx - 3.6) * sc + sway, pt.y - 9 * sc, 7.2 * sc, 2.8 * sc, 1 * sc);
        ctx.fill();
      });
      break;
    }

    // ---------------- API UNGGUN (2 MODEL + PARTIKEL BARA & KETTLE) ----------------
    case 'campfire_stone_ring':
    case 'campfire_royal_brazier': {
      if (propModel === 'campfire_royal_brazier') {
        // Ornate pedestal & golden iron brazier bowl
        ctx.fillStyle = '#475569';
        ctx.fillRect(pt.x - 4 * sc, pt.y - 4 * sc, 8 * sc, 5 * sc);
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.ellipse(pt.x, pt.y - 4 * sc, 11 * sc, 5.5 * sc, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 2 * sc;
        ctx.stroke();
      } else {
        // Ash bed
        ctx.fillStyle = '#334155';
        ctx.beginPath();
        ctx.ellipse(pt.x, pt.y, 10 * sc, 5 * sc, 0, 0, Math.PI * 2);
        ctx.fill();
        // Crossed firewood logs
        ctx.strokeStyle = '#78350f';
        ctx.lineWidth = 3.2 * sc;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(pt.x - 8 * sc, pt.y - 1 * sc);
        ctx.lineTo(pt.x + 8 * sc, pt.y - 4 * sc);
        ctx.moveTo(pt.x - 7 * sc, pt.y - 4 * sc);
        ctx.lineTo(pt.x + 7 * sc, pt.y - 1 * sc);
        ctx.stroke();

        // 10 River Stones in ring
        for (let i = 0; i < 10; i++) {
          const ang = (i / 10) * Math.PI * 2;
          ctx.fillStyle = i % 2 === 0 ? '#64748b' : '#94a3b8';
          ctx.beginPath();
          ctx.arc(
            pt.x + Math.cos(ang) * 10.5 * sc,
            pt.y + Math.sin(ang) * 5.2 * sc,
            2.5 * sc,
            0,
            Math.PI * 2
          );
          ctx.fill();
        }

        // Campfire Cooking Tripod above fire
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 1.3 * sc;
        ctx.beginPath();
        ctx.moveTo(pt.x - 11 * sc, pt.y + 2 * sc);
        ctx.lineTo(pt.x, pt.y - 23 * sc);
        ctx.lineTo(pt.x + 11 * sc, pt.y + 2 * sc);
        ctx.stroke();
      }

      // Warm radial firelight glow on ground
      const flicker = Math.sin(elapsed * 10 + wx) * 1.8 * sc;
      const glow = ctx.createRadialGradient(pt.x, pt.y - 8 * sc, 1 * sc, pt.x, pt.y - 8 * sc, 21 * sc);
      glow.addColorStop(0, 'rgba(251, 191, 36, 0.62)');
      glow.addColorStop(0.55, 'rgba(239, 68, 68, 0.26)');
      glow.addColorStop(1, 'rgba(239, 68, 68, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y - 8 * sc, 21 * sc, 0, Math.PI * 2);
      ctx.fill();

      // Outer red-orange flame
      ctx.fillStyle = '#ea580c';
      ctx.beginPath();
      ctx.moveTo(pt.x - 7 * sc, pt.y - 2 * sc);
      ctx.quadraticCurveTo(pt.x - 8 * sc, pt.y - 13 * sc, pt.x + flicker * 0.5, pt.y - 20 * sc + flicker);
      ctx.quadraticCurveTo(pt.x + 8 * sc, pt.y - 13 * sc, pt.x + 7 * sc, pt.y - 2 * sc);
      ctx.closePath();
      ctx.fill();

      // Inner bright yellow-white core flame
      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.moveTo(pt.x - 4 * sc, pt.y - 2 * sc);
      ctx.quadraticCurveTo(pt.x - 3.5 * sc, pt.y - 10 * sc, pt.x - flicker * 0.4, pt.y - 14 * sc - flicker * 0.5);
      ctx.quadraticCurveTo(pt.x + 3.5 * sc, pt.y - 10 * sc, pt.x + 4 * sc, pt.y - 2 * sc);
      ctx.closePath();
      ctx.fill();

      // Rising animated ember sparks
      for (let s = 0; s < 4; s++) {
        const sparkT = (elapsed * 1.6 + s * 0.25) % 1;
        const sx = pt.x + Math.sin(elapsed * 4 + s * 2) * 5 * sc;
        const sy = pt.y - (10 + sparkT * 18) * sc;
        ctx.fillStyle = `rgba(253, 224, 71, ${1 - sparkT})`;
        ctx.beginPath();
        ctx.arc(sx, sy, 1.3 * sc, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }

    // ---------------- PLAYGROUND ANAK (4 MODEL KOMPLEKS & INTERAKTIF) ----------------
    case 'playground_slide_colorful': {
      // Soft safety rubber puzzle mat
      ctx.fillStyle = '#fef08a';
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 1.4 * sc;
      ctx.beginPath();
      ctx.ellipse(pt.x, pt.y + 1 * sc, 22 * sc, 11 * sc, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // 4 Tower Posts (Left side)
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(pt.x - 14 * sc, pt.y - 24 * sc, 2.5 * sc, 24 * sc);
      ctx.fillRect(pt.x - 4.5 * sc, pt.y - 24 * sc, 2.5 * sc, 24 * sc);

      // Climbing Ladder + Handrails (Left)
      ctx.strokeStyle = '#eab308';
      ctx.lineWidth = 1.8 * sc;
      for (let i = 0; i < 5; i++) {
        const ly = pt.y - (3 + i * 3.5) * sc;
        ctx.beginPath();
        ctx.moveTo(pt.x - 17 * sc + i * 0.8 * sc, ly);
        ctx.lineTo(pt.x - 12 * sc, ly);
        ctx.stroke();
      }

      // Platform Deck & Guardrails
      ctx.fillStyle = '#2563eb';
      ctx.fillRect(pt.x - 15 * sc, pt.y - 18.5 * sc, 13 * sc, 3.8 * sc);
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 1.6 * sc;
      ctx.strokeRect(pt.x - 14 * sc, pt.y - 22.5 * sc, 11 * sc, 4 * sc);

      // Pitched Roof + Fluttering Pennant Flag
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.moveTo(pt.x - 8.5 * sc, pt.y - 32 * sc);
      ctx.lineTo(pt.x - 17 * sc, pt.y - 23 * sc);
      ctx.lineTo(pt.x, pt.y - 23 * sc);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#ea580c';
      ctx.lineWidth = 1.2 * sc;
      ctx.stroke();

      // Pennant flag on apex
      ctx.fillStyle = '#ec4899';
      ctx.beginPath();
      ctx.moveTo(pt.x - 8.5 * sc, pt.y - 32 * sc);
      ctx.lineTo(pt.x - 8.5 * sc, pt.y - 37 * sc);
      ctx.lineTo(pt.x - 3 * sc, pt.y - 35 * sc);
      ctx.lineTo(pt.x - 8.5 * sc, pt.y - 33 * sc);
      ctx.fill();

      // Curved Wave Slide Chute (3D rails + glossy slide bed)
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 7.2 * sc;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(pt.x - 4 * sc, pt.y - 16.5 * sc);
      ctx.bezierCurveTo(pt.x + 4 * sc, pt.y - 16 * sc, pt.x + 7 * sc, pt.y - 2 * sc, pt.x + 16 * sc, pt.y);
      ctx.stroke();

      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 4.6 * sc;
      ctx.beginPath();
      ctx.moveTo(pt.x - 4 * sc, pt.y - 16.5 * sc);
      ctx.bezierCurveTo(pt.x + 4 * sc, pt.y - 16 * sc, pt.x + 7 * sc, pt.y - 2 * sc, pt.x + 16 * sc, pt.y);
      ctx.stroke();
      break;
    }

    case 'playground_seesaw_dual': {
      const tilt = Math.sin(elapsed * 2.5 + wx) * 4.5 * sc;
      // Two-tone green safety pad
      ctx.fillStyle = '#dcfce7';
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 1.4 * sc;
      ctx.beginPath();
      ctx.ellipse(pt.x, pt.y + 1 * sc, 20 * sc, 9.5 * sc, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Shock absorber rubber tires under both ends
      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.ellipse(pt.x - 13 * sc, pt.y + 1 * sc, 3 * sc, 1.5 * sc, 0, 0, Math.PI * 2);
      ctx.ellipse(pt.x + 13 * sc, pt.y + 1 * sc, 3 * sc, 1.5 * sc, 0, 0, Math.PI * 2);
      ctx.fill();

      // Center Fulcrum A-frame & Heavy Spring
      ctx.fillStyle = '#2563eb';
      ctx.beginPath();
      ctx.moveTo(pt.x, pt.y - 10 * sc);
      ctx.lineTo(pt.x - 5 * sc, pt.y + 1 * sc);
      ctx.lineTo(pt.x + 5 * sc, pt.y + 1 * sc);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(pt.x, pt.y - 8.5 * sc, 2.2 * sc, 0, Math.PI * 2);
      ctx.fill();

      // Tilting Seesaw Beam
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 4 * sc;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(pt.x - 16 * sc, pt.y - 8.5 * sc - tilt);
      ctx.lineTo(pt.x + 16 * sc, pt.y - 8.5 * sc + tilt);
      ctx.stroke();

      // Molded Ergonomic Seats with Backrests & Loop Handles
      ctx.fillStyle = '#facc15';
      ctx.fillRect(pt.x - 17 * sc, pt.y - 12 * sc - tilt, 5 * sc, 3 * sc);
      ctx.fillRect(pt.x + 12 * sc, pt.y - 12 * sc + tilt, 5 * sc, 3 * sc);

      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1.6 * sc;
      ctx.beginPath();
      ctx.moveTo(pt.x - 11.5 * sc, pt.y - 8.5 * sc - tilt * 0.72);
      ctx.lineTo(pt.x - 11.5 * sc, pt.y - 14 * sc - tilt * 0.72);
      ctx.moveTo(pt.x + 11.5 * sc, pt.y - 8.5 * sc + tilt * 0.72);
      ctx.lineTo(pt.x + 11.5 * sc, pt.y - 14 * sc + tilt * 0.72);
      ctx.stroke();
      break;
    }

    case 'playground_spring_rider': {
      const bounce = Math.sin(elapsed * 4.5 + wy) * 2 * sc;
      const rock = Math.cos(elapsed * 4.5 + wy) * 1.2 * sc;

      // Star-patterned playground safety pad
      ctx.fillStyle = '#e0f2fe';
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 1.5 * sc;
      ctx.beginPath();
      ctx.ellipse(pt.x, pt.y + 1 * sc, 15.5 * sc, 7.5 * sc, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Heavy steel coil spring
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 2.4 * sc;
      ctx.beginPath();
      ctx.moveTo(pt.x, pt.y);
      ctx.lineTo(pt.x - 2.5 * sc, pt.y - 3.5 * sc);
      ctx.lineTo(pt.x + 2.5 * sc, pt.y - 7 * sc);
      ctx.lineTo(pt.x - 2 * sc, pt.y - 10 * sc + bounce * 0.5);
      ctx.lineTo(pt.x + rock, pt.y - 12 * sc + bounce);
      ctx.stroke();

      // Detailed Pony Rider Body, Mane, Tail, Saddle & Handles
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.ellipse(pt.x + rock, pt.y - 14 * sc + bounce, 7.5 * sc, 4.2 * sc, 0, 0, Math.PI * 2);
      ctx.arc(pt.x + 6 * sc + rock, pt.y - 19 * sc + bounce, 3.8 * sc, 0, Math.PI * 2);
      ctx.fill();
      // White flowing tail & mane
      ctx.fillStyle = '#fef3c7';
      ctx.beginPath();
      ctx.ellipse(pt.x - 7.5 * sc + rock, pt.y - 15 * sc + bounce, 3 * sc, 1.6 * sc, -0.4, 0, Math.PI * 2);
      ctx.fill();
      // Red saddle & blue handlebar
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(pt.x - 3 * sc + rock, pt.y - 17 * sc + bounce, 5.5 * sc, 2.8 * sc);
      ctx.strokeStyle = '#2563eb';
      ctx.lineWidth = 1.6 * sc;
      ctx.beginPath();
      ctx.moveTo(pt.x + 4.5 * sc + rock, pt.y - 18 * sc + bounce);
      ctx.lineTo(pt.x + 4.5 * sc + rock, pt.y - 22.5 * sc + bounce);
      ctx.stroke();
      break;
    }

    case 'playground_combo_castle': {
      // Grand Playground Safety Mulch Arena
      ctx.fillStyle = '#fef3c7';
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 1.5 * sc;
      ctx.beginPath();
      ctx.ellipse(pt.x, pt.y + 2 * sc, 27 * sc, 13 * sc, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Left & Right Castle Play Towers with Windows & Flags
      [
        { tx: -11, col: '#2563eb', roof: '#ef4444' },
        { tx: 7, col: '#059669', roof: '#f59e0b' },
      ].forEach(({ tx, col, roof }) => {
        ctx.fillStyle = col;
        ctx.fillRect(pt.x + tx * sc, pt.y - 23 * sc, 9 * sc, 21 * sc);
        // Round castle window
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(pt.x + (tx + 4.5) * sc, pt.y - 17 * sc, 2.2 * sc, 0, Math.PI * 2);
        ctx.fill();
        // Pyramid Castle Roof
        ctx.fillStyle = roof;
        ctx.beginPath();
        ctx.moveTo(pt.x + (tx + 4.5) * sc, pt.y - 33 * sc);
        ctx.lineTo(pt.x + (tx - 2) * sc, pt.y - 23 * sc);
        ctx.lineTo(pt.x + (tx + 11) * sc, pt.y - 23 * sc);
        ctx.closePath();
        ctx.fill();
        // Flag on top
        ctx.fillStyle = '#ec4899';
        ctx.fillRect(pt.x + (tx + 4.5) * sc, pt.y - 37 * sc, 4.5 * sc, 2.5 * sc);
      });

      // Suspension Rope Bridge connecting the two towers
      ctx.fillStyle = '#b45309';
      ctx.fillRect(pt.x - 2 * sc, pt.y - 14.5 * sc, 9 * sc, 3.5 * sc);
      ctx.strokeStyle = '#fde047';
      ctx.lineWidth = 1.2 * sc;
      ctx.strokeRect(pt.x - 2 * sc, pt.y - 18 * sc, 9 * sc, 3.5 * sc);

      // Dual Slides (Left Yellow Wave Slide + Right Cyan Tube Slide)
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 5 * sc;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(pt.x - 9.5 * sc, pt.y - 12 * sc);
      ctx.lineTo(pt.x - 21 * sc, pt.y + 1 * sc);
      ctx.stroke();

      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 5.5 * sc;
      ctx.beginPath();
      ctx.moveTo(pt.x + 15 * sc, pt.y - 12 * sc);
      ctx.bezierCurveTo(pt.x + 21 * sc, pt.y - 10 * sc, pt.x + 19 * sc, pt.y - 3 * sc, pt.x + 24 * sc, pt.y + 1 * sc);
      ctx.stroke();
      break;
    }

    // ---------------- LAPANGAN OLAHRAGA & HAMPARAN TERBUKA (4 MODEL SUPER DETAIL) ----------------
    case 'court_basketball_full':
    case 'court_futsal_green':
    case 'court_badminton_pro':
    case 'open_green_field': {
      const halfW = 1.52 * (scale || 1.0);
      const halfH = 0.98 * (scale || 1.0);
      const cNW = project(wx - halfW, wy - halfH, 0.01);
      const cNE = project(wx + halfW, wy - halfH, 0.01);
      const cSE = project(wx + halfW, wy + halfH, 0.01);
      const cSW = project(wx - halfW, wy + halfH, 0.01);
      const midN = { x: (cNW.x + cNE.x) * 0.5, y: (cNW.y + cNE.y) * 0.5 };
      const midS = { x: (cSW.x + cSE.x) * 0.5, y: (cSW.y + cSE.y) * 0.5 };
      const midW = { x: (cNW.x + cSW.x) * 0.5, y: (cNW.y + cSW.y) * 0.5 };
      const midE = { x: (cNE.x + cSE.x) * 0.5, y: (cNE.y + cSE.y) * 0.5 };

      // Helper for bilinear interpolation on the isometric court surface (u: 0..1 W->E, v: 0..1 N->S)
      const courtPt = (u: number, v: number) => {
        const topX = cNW.x + (cNE.x - cNW.x) * u;
        const topY = cNW.y + (cNE.y - cNW.y) * u;
        const botX = cSW.x + (cSE.x - cSW.x) * u;
        const botY = cSW.y + (cSE.y - cSW.y) * u;
        return {
          x: topX + (botX - topX) * v,
          y: topY + (botY - topY) * v,
        };
      };

      // Outer Concrete Apron / Perimeter Border
      const apNW = project(wx - halfW * 1.08, wy - halfH * 1.08, 0.005);
      const apNE = project(wx + halfW * 1.08, wy - halfH * 1.08, 0.005);
      const apSE = project(wx + halfW * 1.08, wy + halfH * 1.08, 0.005);
      const apSW = project(wx - halfW * 1.08, wy + halfH * 1.08, 0.005);
      ctx.fillStyle = propModel === 'open_green_field' ? '#15803d' : '#334155';
      ctx.beginPath();
      ctx.moveTo(apNW.x, apNW.y);
      ctx.lineTo(apNE.x, apNE.y);
      ctx.lineTo(apSE.x, apSE.y);
      ctx.lineTo(apSW.x, apSW.y);
      ctx.closePath();
      ctx.fill();

      // Main Court Surface Polygon
      if (propModel === 'court_basketball_full') {
        ctx.fillStyle = '#c2410c'; // Streetball terracotta court
        ctx.strokeStyle = '#ffffff';
      } else if (propModel === 'court_futsal_green') {
        ctx.fillStyle = '#15803d'; // Futsal synthetic turf
        ctx.strokeStyle = '#ffffff';
      } else if (propModel === 'court_badminton_pro') {
        ctx.fillStyle = '#0f766e'; // Pro BWF tournament mat
        ctx.strokeStyle = '#ffffff';
      } else {
        ctx.fillStyle = '#4ade80'; // Lush open green meadow
        ctx.strokeStyle = '#22c55e';
      }

      ctx.lineWidth = 2 * sc;
      ctx.beginPath();
      ctx.moveTo(cNW.x, cNW.y);
      ctx.lineTo(cNE.x, cNE.y);
      ctx.lineTo(cSE.x, cSE.y);
      ctx.lineTo(cSW.x, cSW.y);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Alternating mowed turf stripes for Futsal & Open Green Field
      if (propModel === 'court_futsal_green' || propModel === 'open_green_field') {
        ctx.fillStyle =
          propModel === 'court_futsal_green'
            ? 'rgba(34, 197, 94, 0.22)'
            : 'rgba(22, 163, 74, 0.18)';
        for (let s = 0; s < 6; s += 2) {
          const u0 = s / 6;
          const u1 = (s + 1) / 6;
          const p0 = courtPt(u0, 0);
          const p1 = courtPt(u1, 0);
          const p2 = courtPt(u1, 1);
          const p3 = courtPt(u0, 1);
          ctx.beginPath();
          ctx.moveTo(p0.x, p0.y);
          ctx.lineTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.lineTo(p3.x, p3.y);
          ctx.closePath();
          ctx.fill();
        }
      }

      if (propModel === 'open_green_field') {
        // Corner wildflower patches, picnic blanket & fluttering community flags
        [cNW, cNE, cSE, cSW].forEach((corner, i) => {
          ctx.fillStyle = i % 2 === 0 ? '#facc15' : '#f472b6';
          ctx.beginPath();
          ctx.arc(corner.x, corner.y, 3 * sc, 0, Math.PI * 2);
          ctx.fill();
        });
        // Picnic blanket in meadow
        const picP = courtPt(0.32, 0.55);
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.ellipse(picP.x, picP.y, 8 * sc, 4 * sc, 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(picP.x, picP.y, 4 * sc, 2 * sc, 0.2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Center line & Center circle for sports courts
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.92)';
        ctx.lineWidth = 1.5 * sc;
        ctx.beginPath();
        ctx.moveTo(midN.x, midN.y);
        ctx.lineTo(midS.x, midS.y);
        ctx.stroke();

        ctx.beginPath();
        ctx.ellipse(pt.x, pt.y, 10 * sc, 5 * sc, 0, 0, Math.PI * 2);
        if (propModel === 'court_basketball_full') {
          ctx.fillStyle = '#1d4ed8';
          ctx.fill();
        }
        ctx.stroke();
      }

      // SPORT-SPECIFIC COURT LINES, 3D FIXTURES & LIVE BALL ANIMATIONS
      if (propModel === 'court_basketball_full') {
        // Left & Right Key Lanes (Blue Paint)
        [
          [0, 0.22],
          [0.78, 1.0],
        ].forEach(([uA, uB]) => {
          const k0 = courtPt(uA, 0.32);
          const k1 = courtPt(uB, 0.32);
          const k2 = courtPt(uB, 0.68);
          const k3 = courtPt(uA, 0.68);
          ctx.fillStyle = 'rgba(29, 78, 216, 0.82)';
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.2 * sc;
          ctx.beginPath();
          ctx.moveTo(k0.x, k0.y);
          ctx.lineTo(k1.x, k1.y);
          ctx.lineTo(k2.x, k2.y);
          ctx.lineTo(k3.x, k3.y);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        });

        // Left & Right 3D Basketball Hoops (Padded Stanchion + Glass Backboard + Rim + Net)
        [midW, midE].forEach((hoopBase, idx) => {
          ctx.strokeStyle = '#1e293b';
          ctx.lineWidth = 2.8 * sc;
          ctx.beginPath();
          ctx.moveTo(hoopBase.x, hoopBase.y);
          ctx.lineTo(hoopBase.x, hoopBase.y - 23 * sc);
          ctx.stroke();

          // Tempered glass backboard with shooter's square
          ctx.fillStyle = 'rgba(248, 250, 252, 0.92)';
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 1.2 * sc;
          ctx.fillRect(hoopBase.x - 5 * sc, hoopBase.y - 27 * sc, 10 * sc, 6.5 * sc);
          ctx.strokeRect(hoopBase.x - 5 * sc, hoopBase.y - 27 * sc, 10 * sc, 6.5 * sc);

          // Orange rim & white net mesh
          const rimOffset = idx === 0 ? 3.2 * sc : -3.2 * sc;
          ctx.strokeStyle = '#ea580c';
          ctx.lineWidth = 1.7 * sc;
          ctx.beginPath();
          ctx.ellipse(hoopBase.x + rimOffset, hoopBase.y - 20.5 * sc, 3.4 * sc, 1.7 * sc, 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.strokeStyle = 'rgba(255,255,255,0.8)';
          ctx.lineWidth = 0.9 * sc;
          ctx.beginPath();
          ctx.moveTo(hoopBase.x + rimOffset - 2.5 * sc, hoopBase.y - 20 * sc);
          ctx.lineTo(hoopBase.x + rimOffset - 1.5 * sc, hoopBase.y - 16 * sc);
          ctx.moveTo(hoopBase.x + rimOffset + 2.5 * sc, hoopBase.y - 20 * sc);
          ctx.lineTo(hoopBase.x + rimOffset + 1.5 * sc, hoopBase.y - 16 * sc);
          ctx.stroke();
        });

        // Sideline Digital Scoreboard
        ctx.fillStyle = '#0f172a';
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 1.1 * sc;
        ctx.fillRect(midN.x - 9 * sc, midN.y - 13 * sc, 18 * sc, 7.5 * sc);
        ctx.strokeRect(midN.x - 9 * sc, midN.y - 13 * sc, 18 * sc, 7.5 * sc);
        ctx.fillStyle = '#4ade80';
        ctx.font = `900 ${Math.round(5.5 * sc)}px monospace`;
        ctx.textAlign = 'center';
        ctx.fillText('88 : 86', midN.x, midN.y - 8 * sc);

        // Animated Bouncing Basketball on Court!
        const bPhase = (elapsed * 0.9) % 1;
        const bPos = courtPt(0.35 + Math.sin(elapsed * 1.4) * 0.25, 0.5);
        const bJump = Math.abs(Math.sin(bPhase * Math.PI * 2)) * 12 * sc;
        ctx.fillStyle = '#ea580c';
        ctx.beginPath();
        ctx.arc(bPos.x, bPos.y - 3 * sc - bJump, 3 * sc, 0, Math.PI * 2);
        ctx.fill();
      } else if (propModel === 'court_futsal_green') {
        // Penalty boxes on both ends
        [
          [0, 0.18],
          [0.82, 1.0],
        ].forEach(([uA, uB]) => {
          const p0 = courtPt(uA, 0.28);
          const p1 = courtPt(uB, 0.28);
          const p2 = courtPt(uB, 0.72);
          const p3 = courtPt(uA, 0.72);
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.3 * sc;
          ctx.beginPath();
          ctx.moveTo(p0.x, p0.y);
          ctx.lineTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.lineTo(p3.x, p3.y);
          ctx.stroke();
        });

        // Left & Right 3D Futsal Goalposts with Netting
        [midW, midE].forEach((goalBase) => {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.28)';
          ctx.beginPath();
          ctx.rect(goalBase.x - 5.5 * sc, goalBase.y - 12 * sc, 11 * sc, 12 * sc);
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2.2 * sc;
          ctx.beginPath();
          ctx.moveTo(goalBase.x - 5.5 * sc, goalBase.y + 2 * sc);
          ctx.lineTo(goalBase.x - 5.5 * sc, goalBase.y - 11 * sc);
          ctx.lineTo(goalBase.x + 5.5 * sc, goalBase.y - 14 * sc);
          ctx.lineTo(goalBase.x + 5.5 * sc, goalBase.y - 1 * sc);
          ctx.stroke();
        });

        // Animated Rolling Futsal Ball
        const ballPos = courtPt(0.5 + Math.sin(elapsed * 2.1) * 0.32, 0.5 + Math.cos(elapsed * 1.5) * 0.22);
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 1 * sc;
        ctx.beginPath();
        ctx.arc(ballPos.x, ballPos.y - 2.5 * sc, 2.8 * sc, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      } else if (propModel === 'court_badminton_pro') {
        // Short & Long Service Lines for Badminton
        [0.15, 0.36, 0.64, 0.85].forEach((uLine) => {
          const s0 = courtPt(uLine, 0);
          const s1 = courtPt(uLine, 1);
          ctx.strokeStyle = 'rgba(255,255,255,0.75)';
          ctx.lineWidth = 1 * sc;
          ctx.beginPath();
          ctx.moveTo(s0.x, s0.y);
          ctx.lineTo(s1.x, s1.y);
          ctx.stroke();
        });

        // Center Badminton Net & Posts
        ctx.strokeStyle = '#f8fafc';
        ctx.lineWidth = 2 * sc;
        ctx.beginPath();
        ctx.moveTo(midN.x, midN.y);
        ctx.lineTo(midN.x, midN.y - 12 * sc);
        ctx.moveTo(midS.x, midS.y);
        ctx.lineTo(midS.x, midS.y - 12 * sc);
        ctx.stroke();

        // Net mesh between midN and midS
        ctx.fillStyle = 'rgba(255, 255, 255, 0.42)';
        ctx.beginPath();
        ctx.moveTo(midN.x, midN.y - 11 * sc);
        ctx.lineTo(midS.x, midS.y - 11 * sc);
        ctx.lineTo(midS.x, midS.y - 4 * sc);
        ctx.lineTo(midN.x, midN.y - 4 * sc);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.6 * sc;
        ctx.beginPath();
        ctx.moveTo(midN.x, midN.y - 11 * sc);
        ctx.lineTo(midS.x, midS.y - 11 * sc);
        ctx.stroke();

        // Animated Shuttlecock (Kok) arcing back and forth over the net!
        const shuttleU = 0.5 + Math.sin(elapsed * 2.8) * 0.28;
        const shuttleArc = Math.cos( (shuttleU - 0.5) * Math.PI * 1.6 ) * 15 * sc;
        const sPt = courtPt(shuttleU, 0.5);
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(sPt.x, sPt.y - 6 * sc - shuttleArc, 2.2 * sc, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }

    // ---------------- SEMAK & TANAMAN HIAS (5 MODEL) ----------------
    case 'shrub_flowering_azalea': {
      // Stone garden border
      ctx.fillStyle = '#94a3b8';
      ctx.beginPath();
      ctx.ellipse(pt.x, pt.y + 1 * sc, 13 * sc, 5.5 * sc, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#14532d';
      ctx.beginPath();
      ctx.arc(pt.x - 6.5 * sc + breeze * 0.3, pt.y - 6 * sc, 8 * sc, 0, Math.PI * 2);
      ctx.arc(pt.x + 6.5 * sc + breeze * 0.3, pt.y - 6 * sc, 8 * sc, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#16a34a';
      ctx.beginPath();
      ctx.arc(pt.x + breeze * 0.4, pt.y - 10.5 * sc, 9 * sc, 0, Math.PI * 2);
      ctx.fill();

      const flowers = [
        [-7, -8, '#f472b6'],
        [0, -14, '#ec4899'],
        [7, -7, '#f43f5e'],
        [-3, -5, '#fbcfe8'],
        [4, -11, '#f472b6'],
        [0, -8, '#fde047'],
      ] as const;
      flowers.forEach(([fx, fy, fc]) => {
        ctx.fillStyle = fc;
        ctx.beginPath();
        ctx.arc(pt.x + fx * sc + breeze * 0.3, pt.y + fy * sc, 2.4 * sc, 0, Math.PI * 2);
        ctx.fill();
      });
      break;
    }

    case 'shrub_topiary_spiral': {
      // Ornate Terracotta Planter Box with Gold Band
      ctx.fillStyle = '#b45309';
      ctx.fillRect(pt.x - 6 * sc, pt.y - 8 * sc, 12 * sc, 8 * sc);
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(pt.x - 6 * sc, pt.y - 5 * sc, 12 * sc, 1.5 * sc);
      ctx.fillStyle = '#d97706';
      ctx.fillRect(pt.x - 7 * sc, pt.y - 9.5 * sc, 14 * sc, 2.2 * sc);

      // Central wood stem
      ctx.fillStyle = '#78350f';
      ctx.fillRect(pt.x - 1.2 * sc, pt.y - 28 * sc, 2.4 * sc, 20 * sc);

      // 3-tier manicured topiary spheres with highlight
      [
        { y: -13.5, r: 7.5, c: '#15803d', hi: '#22c55e' },
        { y: -21.5, r: 5.6, c: '#16a34a', hi: '#4ade80' },
        { y: -28, r: 3.8, c: '#22c55e', hi: '#86efac' },
      ].forEach((tier) => {
        ctx.fillStyle = tier.c;
        ctx.beginPath();
        ctx.arc(pt.x + breeze * 0.3, pt.y + tier.y * sc, tier.r * sc, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = tier.hi;
        ctx.beginPath();
        ctx.arc(pt.x - 1.5 * sc + breeze * 0.3, pt.y + (tier.y - 1.5) * sc, tier.r * 0.45 * sc, 0, Math.PI * 2);
        ctx.fill();
      });
      break;
    }

    case 'plant_monstera_pot': {
      // Ribbed White Ceramic Designer Pot + Wood Stand
      ctx.fillStyle = '#92400e';
      ctx.fillRect(pt.x - 4.5 * sc, pt.y - 2 * sc, 2 * sc, 3 * sc);
      ctx.fillRect(pt.x + 2.5 * sc, pt.y - 2 * sc, 2 * sc, 3 * sc);
      ctx.fillStyle = '#f8fafc';
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1.2 * sc;
      ctx.beginPath();
      ctx.roundRect(pt.x - 5.5 * sc, pt.y - 9.5 * sc, 11 * sc, 8.5 * sc, 2.5 * sc);
      ctx.fill();
      ctx.stroke();

      // Broad tropical monstera leaves
      const leaves = [
        [-9, -15, -0.5],
        [9, -15, 0.5],
        [-5, -21, -0.25],
        [5, -21, 0.25],
        [0, -24, 0],
      ];
      leaves.forEach(([lx, ly, rot], idx) => {
        ctx.strokeStyle = '#15803d';
        ctx.lineWidth = 1.4 * sc;
        ctx.beginPath();
        ctx.moveTo(pt.x, pt.y - 9 * sc);
        ctx.lineTo(pt.x + lx * sc + breeze * 0.4, pt.y + ly * sc);
        ctx.stroke();

        ctx.fillStyle = idx % 2 === 0 ? '#16a34a' : '#15803d';
        ctx.beginPath();
        ctx.ellipse(
          pt.x + lx * sc + breeze * 0.4,
          pt.y + ly * sc,
          5 * sc,
          3 * sc,
          rot,
          0,
          Math.PI * 2
        );
        ctx.fill();
      });
      break;
    }

    case 'plant_flower_bed_trio': {
      // Raised Timber Planter Box
      ctx.fillStyle = '#78350f';
      ctx.strokeStyle = '#451a03';
      ctx.lineWidth = 1 * sc;
      ctx.beginPath();
      ctx.roundRect(pt.x - 15 * sc, pt.y - 6.5 * sc, 30 * sc, 7 * sc, 2 * sc);
      ctx.fill();
      ctx.stroke();
      // Rich foliage bed
      ctx.fillStyle = '#15803d';
      ctx.fillRect(pt.x - 13.5 * sc, pt.y - 9 * sc, 27 * sc, 3.5 * sc);
      // Colorful Tulip & Marigold Blooms
      const bedColors = ['#facc15', '#f43f5e', '#a855f7', '#38bdf8', '#fb923c', '#ec4899'];
      bedColors.forEach((col, i) => {
        const fx = pt.x + (-11 + i * 4.4) * sc;
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.arc(fx + breeze * 0.3, pt.y - 11 * sc, 2.8 * sc, 0, Math.PI * 2);
        ctx.fill();
      });
      break;
    }

    case 'shrub_bamboo_zen': {
      // White Zen gravel & mossy river stones
      ctx.fillStyle = '#e2e8f0';
      ctx.beginPath();
      ctx.ellipse(pt.x, pt.y + 1 * sc, 12 * sc, 5 * sc, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#64748b';
      ctx.beginPath();
      ctx.arc(pt.x - 5 * sc, pt.y - 1.5 * sc, 3.5 * sc, 0, Math.PI * 2);
      ctx.arc(pt.x + 5 * sc, pt.y - 1 * sc, 3 * sc, 0, Math.PI * 2);
      ctx.fill();

      // 5 Segmented Bamboo Stalks with nodes & leaves
      [-7, -3.5, 0, 3.5, 7].forEach((bx, i) => {
        const h = (24 + (i % 3) * 4) * sc;
        ctx.strokeStyle = i % 2 === 0 ? '#16a34a' : '#15803d';
        ctx.lineWidth = 2.5 * sc;
        ctx.beginPath();
        ctx.moveTo(pt.x + bx * sc, pt.y);
        ctx.lineTo(pt.x + bx * sc + breeze * 0.6, pt.y - h);
        ctx.stroke();

        ctx.fillStyle = '#4ade80';
        ctx.beginPath();
        ctx.ellipse(
          pt.x + (bx + 2.6) * sc + breeze * 0.6,
          pt.y - h + 3 * sc,
          4.2 * sc,
          1.7 * sc,
          0.3,
          0,
          Math.PI * 2
        );
        ctx.fill();
      });
      break;
    }

    // ---------------- KOLAM, AIR MANCUR & ELEMEN AIR (4 MODEL HIDUP) ----------------
    case 'water_fountain_tiered': {
      // Sculpted Marble Basin
      ctx.fillStyle = '#cbd5e1';
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 1.8 * sc;
      ctx.beginPath();
      ctx.ellipse(pt.x, pt.y, 20 * sc, 10 * sc, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Sparkling Blue Water + Expanding Ripple Ring
      ctx.fillStyle = '#0284c7';
      ctx.beginPath();
      ctx.ellipse(pt.x, pt.y - 1 * sc, 17.5 * sc, 8.5 * sc, 0, 0, Math.PI * 2);
      ctx.fill();

      const ripR = (6 + ((elapsed * 8) % 10)) * sc;
      ctx.strokeStyle = 'rgba(224, 242, 254, 0.55)';
      ctx.lineWidth = 1 * sc;
      ctx.beginPath();
      ctx.ellipse(pt.x, pt.y - 1 * sc, ripR, ripR * 0.48, 0, 0, Math.PI * 2);
      ctx.stroke();

      // 3-Tier Marble Pedestal & Bowls
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(pt.x - 3.2 * sc, pt.y - 24 * sc, 6.4 * sc, 23 * sc);
      ctx.beginPath();
      ctx.ellipse(pt.x, pt.y - 10 * sc, 11 * sc, 5 * sc, 0, 0, Math.PI * 2);
      ctx.ellipse(pt.x, pt.y - 18 * sc, 7 * sc, 3.2 * sc, 0, 0, Math.PI * 2);
      ctx.fill();

      // Animated Water Arcs Spraying from Crown
      const sprayH = (28 + Math.sin(elapsed * 8) * 2.5) * sc;
      ctx.strokeStyle = '#e0f2fe';
      ctx.lineWidth = 1.7 * sc;
      [-9, -4.5, 4.5, 9].forEach((sx) => {
        ctx.beginPath();
        ctx.moveTo(pt.x, pt.y - 23 * sc);
        ctx.quadraticCurveTo(pt.x + sx * 0.6 * sc, pt.y - sprayH, pt.x + sx * sc, pt.y - 5 * sc);
        ctx.stroke();
      });
      break;
    }

    case 'water_koi_pond_lotus': {
      // Natural Mossy Boulder Rim
      ctx.fillStyle = '#64748b';
      ctx.beginPath();
      ctx.ellipse(pt.x, pt.y, 22 * sc, 11 * sc, 0, 0, Math.PI * 2);
      ctx.fill();

      // Deep Aqua Koi Pond Water
      ctx.fillStyle = '#0369a1';
      ctx.beginPath();
      ctx.ellipse(pt.x, pt.y - 0.5 * sc, 19 * sc, 9.2 * sc, 0, 0, Math.PI * 2);
      ctx.fill();

      // 3 Swimming Koi Fish (Orange Kohaku, Gold Ogon, White-Red Sanke)
      const koiPalette = ['#f97316', '#facc15', '#f8fafc'];
      koiPalette.forEach((kCol, idx) => {
        const koiAng = elapsed * (1.2 + idx * 0.25) + idx * 2.1;
        const rx = (6 + idx * 3.2) * sc;
        const ry = (2.8 + idx * 1.4) * sc;
        const kx = pt.x + Math.cos(koiAng) * rx;
        const ky = pt.y - 1 * sc + Math.sin(koiAng) * ry;
        ctx.fillStyle = kCol;
        ctx.beginPath();
        ctx.ellipse(kx, ky, 3.2 * sc, 1.4 * sc, koiAng + Math.PI / 2, 0, Math.PI * 2);
        ctx.fill();
      });

      // Green Lily Pads & Blooming Pink Lotus Flowers
      [
        [-8, -2.5],
        [7, 2.5],
        [3, -4.5],
        [-3, 3.5],
      ].forEach(([lx, ly], idx) => {
        ctx.fillStyle = '#16a34a';
        ctx.beginPath();
        ctx.ellipse(pt.x + lx * sc, pt.y + ly * sc, 4 * sc, 2.1 * sc, 0, 0, Math.PI * 2);
        ctx.fill();
        if (idx < 2) {
          ctx.fillStyle = idx === 0 ? '#f472b6' : '#fbcfe8';
          ctx.beginPath();
          ctx.arc(pt.x + lx * sc, pt.y + (ly - 1.5) * sc, 2.2 * sc, 0, Math.PI * 2);
          ctx.fill();
        }
      });
      break;
    }

    case 'water_mini_waterfall': {
      // Plunge Pool with Stone Rim
      ctx.fillStyle = '#0284c7';
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 2.2 * sc;
      ctx.beginPath();
      ctx.ellipse(pt.x, pt.y + 1 * sc, 19 * sc, 9 * sc, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Multi-tiered Slate Cliff Rocks + Moss Tufts
      ctx.fillStyle = '#475569';
      ctx.beginPath();
      ctx.arc(pt.x - 7 * sc, pt.y - 12 * sc, 8.5 * sc, 0, Math.PI * 2);
      ctx.arc(pt.x + 7 * sc, pt.y - 11 * sc, 8 * sc, 0, Math.PI * 2);
      ctx.arc(pt.x, pt.y - 19 * sc, 9 * sc, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#16a34a';
      ctx.beginPath();
      ctx.arc(pt.x - 8 * sc, pt.y - 17 * sc, 3.5 * sc, 0, Math.PI * 2);
      ctx.arc(pt.x + 8 * sc, pt.y - 16 * sc, 3.2 * sc, 0, Math.PI * 2);
      ctx.fill();

      // Cascading Waterfall Stream + Splash Mist
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(pt.x - 5 * sc, pt.y - 21 * sc, 10 * sc, 20 * sc);
      for (let f = 0; f < 3; f++) {
        const foamOffset = ((elapsed * 16 + f * 6) % 18);
        ctx.strokeStyle = '#e0f2fe';
        ctx.lineWidth = 1.5 * sc;
        ctx.beginPath();
        ctx.moveTo(pt.x - 3.8 * sc, pt.y - (19 - foamOffset) * sc);
        ctx.lineTo(pt.x + 3.8 * sc, pt.y - (19 - foamOffset) * sc);
        ctx.stroke();
      }
      // White splash foam at base of waterfall
      ctx.fillStyle = 'rgba(240, 249, 255, 0.85)';
      ctx.beginPath();
      ctx.ellipse(pt.x, pt.y - 0.5 * sc, (6 + Math.sin(elapsed * 9) * 1.5) * sc, 2.5 * sc, 0, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 'water_dancing_jets': {
      // Illuminated Granite Plaza Pad
      ctx.fillStyle = '#1e293b';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.6 * sc;
      ctx.beginPath();
      ctx.ellipse(pt.x, pt.y, 18 * sc, 9 * sc, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // 7 Choreographed Dancing Water Jets with LED Glow
      [-12, -8, -4, 0, 4, 8, 12].forEach((jx, idx) => {
        const jh = (8 + Math.abs(Math.sin(elapsed * 4.5 + idx * 0.75)) * 18) * sc;
        // LED base ring
        ctx.fillStyle = idx % 2 === 0 ? '#38bdf8' : '#f472b6';
        ctx.beginPath();
        ctx.arc(pt.x + jx * sc, pt.y, 1.8 * sc, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = idx % 2 === 0 ? '#bae6fd' : '#f0f9ff';
        ctx.lineWidth = 2.2 * sc;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(pt.x + jx * sc, pt.y);
        ctx.lineTo(pt.x + jx * sc, pt.y - jh);
        ctx.stroke();
      });
      break;
    }
  }

  ctx.restore();
}

// ============================================================================
// 5. CUSTOM ANIMALS + ACTIVITY & TIME CYCLES (10 DETAILED SPECIES)
// ============================================================================
export function computeCreatorAnimalLivePose(
  animal: CreatorAnimalItem,
  elapsedSec: number,
  isNight: boolean
): {
  wx: number;
  wy: number;
  facingDir: 1 | -1;
  isMoving: boolean;
  isSleeping: boolean;
  isFeeding: boolean;
  cycleBadge: string;
} {
  const isSleeping =
    (animal.timeCycle === 'diurnal' && isNight) ||
    (animal.timeCycle === 'nocturnal' && !isNight);

  if (isSleeping) {
    return {
      wx: animal.homeWx,
      wy: animal.homeWy,
      facingDir: 1,
      isMoving: false,
      isSleeping: true,
      isFeeding: false,
      cycleBadge: '💤 Tidur',
    };
  }

  const cycleLen = Math.max(4, animal.cycleDurationSec || 8);
  const seed =
    animal.id.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0) * 0.37;
  const phaseTime = elapsedSec + seed;
  const phaseSlot = Math.floor(phaseTime / cycleLen) % 3;
  const radius = Math.max(0.2, animal.wanderRadius || 1.4);
  const spd = Math.max(0.2, animal.speed || 0.7);

  if (animal.behaviorCycle === 'stay_nest') {
    const gentleLook = Math.sin(phaseTime * 0.8) >= 0 ? 1 : -1;
    return {
      wx: animal.homeWx,
      wy: animal.homeWy,
      facingDir: gentleLook,
      isMoving: false,
      isSleeping: false,
      isFeeding: phaseSlot === 1,
      cycleBadge: phaseSlot === 1 ? '🌿 Makan' : '🏡 Jaga Sarang',
    };
  }

  if (animal.behaviorCycle === 'orbit_patrol') {
    const ang = phaseTime * spd * 0.48;
    const wx = animal.homeWx + Math.cos(ang) * radius;
    const wy = animal.homeWy + Math.sin(ang) * radius * 0.75;
    const dx = -Math.sin(ang);
    return {
      wx,
      wy,
      facingDir: dx >= 0 ? 1 : -1,
      isMoving: true,
      isSleeping: false,
      isFeeding: false,
      cycleBadge: '🔄 Patroli Area',
    };
  }

  if (animal.behaviorCycle === 'playful_hop') {
    const ang = phaseTime * spd * 0.65;
    const wx = animal.homeWx + Math.cos(ang) * radius * Math.sin(phaseTime * 0.35);
    const wy = animal.homeWy + Math.sin(ang) * radius * 0.8;
    const nextWx =
      animal.homeWx + Math.cos(ang + 0.08) * radius * Math.sin((phaseTime + 0.1) * 0.35);
    return {
      wx,
      wy,
      facingDir: nextWx >= wx ? 1 : -1,
      isMoving: true,
      isSleeping: false,
      isFeeding: false,
      cycleBadge: '⚡ Melompat Lincah',
    };
  }

  if (phaseSlot === 1) {
    const stopAngle = Math.floor(phaseTime / cycleLen) * 1.9 + seed;
    const wx = animal.homeWx + Math.cos(stopAngle) * (radius * 0.65);
    const wy = animal.homeWy + Math.sin(stopAngle) * (radius * 0.55);
    return {
      wx,
      wy,
      facingDir: Math.cos(stopAngle) >= 0 ? 1 : -1,
      isMoving: false,
      isSleeping: false,
      isFeeding: true,
      cycleBadge: '🌿 Merumput',
    };
  }

  const moveT = (phaseTime % cycleLen) / cycleLen;
  const wpIndex = Math.floor(phaseTime / cycleLen);
  const a0 = wpIndex * 1.9 + seed;
  const a1 = (wpIndex + 1) * 1.9 + seed;
  const x0 = animal.homeWx + Math.cos(a0) * (radius * 0.65);
  const y0 = animal.homeWy + Math.sin(a0) * (radius * 0.55);
  const x1 = animal.homeWx + Math.cos(a1) * (radius * 0.65);
  const y1 = animal.homeWy + Math.sin(a1) * (radius * 0.55);
  const smooth = moveT * moveT * (3 - 2 * moveT);
  const wx = x0 + (x1 - x0) * smooth;
  const wy = y0 + (y1 - y0) * smooth;

  return {
    wx,
    wy,
    facingDir: x1 - x0 >= 0 ? 1 : -1,
    isMoving: true,
    isSleeping: false,
    isFeeding: false,
    cycleBadge: '🐾 Berkeliling',
  };
}

export function drawCustomCreatorAnimal3D(
  ctx: CanvasRenderingContext2D,
  project: ProjectFn,
  tileW: number,
  animal: CreatorAnimalItem,
  elapsedSec: number,
  isNight: boolean,
  isSelectedInStudio: boolean
) {
  const pose = computeCreatorAnimalLivePose(animal, elapsedSec, isNight);
  const sc = Math.max(0.55, Math.min(2.2, animal.scale || 1.0)) * (tileW / 38);
  const pt = project(pose.wx, pose.wy, 0);
  const hopY =
    pose.isMoving && animal.behaviorCycle === 'playful_hop'
      ? Math.abs(Math.sin(elapsedSec * 7.5)) * 4.8 * sc
      : 0;
  const stepLeg = pose.isMoving ? Math.sin(elapsedSec * 9.0) * 2.4 * sc : 0;
  const headGraze = pose.isFeeding ? Math.abs(Math.sin(elapsedSec * 4.5)) * 3 * sc : 0;

  ctx.save();

  if (isSelectedInStudio) {
    const homePt = project(animal.homeWx, animal.homeWy, 0);
    const rPx = Math.max(16, (animal.wanderRadius || 1.4) * tileW * 0.45);
    ctx.beginPath();
    ctx.ellipse(homePt.x, homePt.y, rPx, rPx * 0.5, 0, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(52, 211, 153, 0.75)';
    ctx.fillStyle = 'rgba(16, 185, 129, 0.08)';
    ctx.lineWidth = 1.8;
    ctx.setLineDash([5, 4]);
    ctx.fill();
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Ground shadow
  ctx.fillStyle = 'rgba(15, 23, 42, 0.25)';
  ctx.beginPath();
  ctx.ellipse(pt.x, pt.y + 1.5 * sc, 8 * sc, 3.8 * sc, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.translate(pt.x, pt.y - hopY);
  ctx.scale(pose.facingDir, 1);

  switch (animal.species) {
    case 'deer_stag':
    case 'deer_doe':
    case 'kancil': {
      const coat =
        animal.species === 'deer_stag'
          ? '#9a3412'
          : animal.species === 'deer_doe'
          ? '#c2410c'
          : '#b45309';
      // 4 Animated Legs
      ctx.strokeStyle = '#451a03';
      ctx.lineWidth = 1.5 * sc;
      ctx.beginPath();
      ctx.moveTo(-4.5 * sc, -4 * sc);
      ctx.lineTo(-4.5 * sc - stepLeg, 1 * sc);
      ctx.moveTo(-2.2 * sc, -4 * sc);
      ctx.lineTo(-2.2 * sc + stepLeg * 0.7, 1 * sc);
      ctx.moveTo(2.2 * sc, -4 * sc);
      ctx.lineTo(2.2 * sc - stepLeg * 0.7, 1 * sc);
      ctx.moveTo(4.5 * sc, -4 * sc);
      ctx.lineTo(4.5 * sc + stepLeg, 1 * sc);
      ctx.stroke();

      // Body & White Tail
      ctx.fillStyle = coat;
      ctx.beginPath();
      ctx.ellipse(0, -6.8 * sc, 6.8 * sc, 4 * sc, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fef3c7';
      ctx.beginPath();
      ctx.arc(-6.5 * sc, -7.8 * sc, 1.6 * sc, 0, Math.PI * 2);
      ctx.fill();

      // White spots on deer_doe
      if (animal.species === 'deer_doe') {
        ctx.fillStyle = '#ffedd5';
        [
          [-2.5, -7.5],
          [0, -6.5],
          [2, -7.8],
        ].forEach(([sx, sy]) => {
          ctx.beginPath();
          ctx.arc(sx * sc, sy * sc, 0.9 * sc, 0, Math.PI * 2);
          ctx.fill();
        });
      }

      // Neck, Head, Eye & Ear
      ctx.fillStyle = coat;
      ctx.beginPath();
      ctx.arc(5.8 * sc, -10.8 * sc + headGraze, 3 * sc, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(6.8 * sc, -11.2 * sc + headGraze, 0.8 * sc, 0, Math.PI * 2);
      ctx.fill();

      // Branched Golden Antlers for Stag
      if (animal.species === 'deer_stag') {
        ctx.strokeStyle = '#fde68a';
        ctx.lineWidth = 1.3 * sc;
        ctx.beginPath();
        ctx.moveTo(5 * sc, -13 * sc + headGraze);
        ctx.lineTo(3.2 * sc, -18 * sc + headGraze);
        ctx.moveTo(4 * sc, -15.5 * sc + headGraze);
        ctx.lineTo(2 * sc, -16.5 * sc + headGraze);
        ctx.moveTo(6 * sc, -13 * sc + headGraze);
        ctx.lineTo(8 * sc, -17.5 * sc + headGraze);
        ctx.stroke();
      }
      break;
    }

    case 'rabbit': {
      // Fluffy Cotton Tail + Plump Body + Head + Eye + Pink Ears
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(-5 * sc, -4 * sc, 1.8 * sc, 0, Math.PI * 2);
      ctx.ellipse(0, -4.5 * sc, 5 * sc, 3.5 * sc, 0, 0, Math.PI * 2);
      ctx.arc(4.2 * sc, -6.8 * sc + headGraze * 0.6, 2.7 * sc, 0, Math.PI * 2);
      ctx.fill();
      // Long ears
      ctx.fillStyle = '#fbcfe8';
      ctx.beginPath();
      ctx.ellipse(3.5 * sc, -11 * sc + headGraze * 0.6, 1.1 * sc, 3.2 * sc, -0.2, 0, Math.PI * 2);
      ctx.ellipse(4.8 * sc, -10.8 * sc + headGraze * 0.6, 1.1 * sc, 3 * sc, 0.15, 0, Math.PI * 2);
      ctx.fill();
      // Ruby/dark eye
      ctx.fillStyle = '#e11d48';
      ctx.beginPath();
      ctx.arc(5.2 * sc, -7.2 * sc + headGraze * 0.6, 0.7 * sc, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 'squirrel':
    case 'fox':
    case 'cat': {
      const bodyCol =
        animal.species === 'fox'
          ? '#ea580c'
          : animal.species === 'cat'
          ? '#f59e0b'
          : '#b45309';
      // Animated wagging bushy tail (with white tip for fox)
      const tailWag = Math.sin(elapsedSec * 5) * 0.15;
      ctx.fillStyle = shadeHex(bodyCol, -12);
      ctx.beginPath();
      ctx.ellipse(-5.8 * sc, -6.8 * sc, 4.5 * sc, 2.3 * sc, -0.6 + tailWag, 0, Math.PI * 2);
      ctx.fill();
      if (animal.species === 'fox') {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(-8.5 * sc, -8.5 * sc, 1.8 * sc, 0, Math.PI * 2);
        ctx.fill();
      }
      // Legs
      ctx.strokeStyle = shadeHex(bodyCol, -35);
      ctx.lineWidth = 1.4 * sc;
      ctx.beginPath();
      ctx.moveTo(-3 * sc, -3 * sc);
      ctx.lineTo(-3 * sc - stepLeg, 1 * sc);
      ctx.moveTo(3 * sc, -3 * sc);
      ctx.lineTo(3 * sc + stepLeg, 1 * sc);
      ctx.stroke();

      // Body, Head, Pointed Ears & Eye
      ctx.fillStyle = bodyCol;
      ctx.beginPath();
      ctx.ellipse(0, -4.8 * sc, 5.4 * sc, 3.3 * sc, 0, 0, Math.PI * 2);
      ctx.arc(4.6 * sc, -7.2 * sc + headGraze * 0.6, 2.8 * sc, 0, Math.PI * 2);
      ctx.fill();
      // Ears
      ctx.beginPath();
      ctx.moveTo(3.5 * sc, -9 * sc + headGraze * 0.6);
      ctx.lineTo(4.2 * sc, -11.8 * sc + headGraze * 0.6);
      ctx.lineTo(5.2 * sc, -9 * sc + headGraze * 0.6);
      ctx.fill();
      // Eye
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(5.6 * sc, -7.6 * sc + headGraze * 0.6, 0.7 * sc, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 'swan':
    case 'ground_bird': {
      const birdCol = animal.species === 'swan' ? '#ffffff' : '#38bdf8';
      // Body & folded wing
      ctx.fillStyle = birdCol;
      ctx.beginPath();
      ctx.ellipse(0, -4.6 * sc, 5.2 * sc, 3.3 * sc, 0, 0, Math.PI * 2);
      ctx.arc(4.4 * sc, -8.2 * sc + headGraze * 0.5, 2.2 * sc, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = shadeHex(birdCol, -15);
      ctx.beginPath();
      ctx.ellipse(-0.5 * sc, -4.8 * sc, 3.2 * sc, 1.8 * sc, -0.15, 0, Math.PI * 2);
      ctx.fill();
      // Beak
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.moveTo(6.2 * sc, -8.7 * sc + headGraze * 0.5);
      ctx.lineTo(8.8 * sc, -8 * sc + headGraze * 0.5);
      ctx.lineTo(6.2 * sc, -7.3 * sc + headGraze * 0.5);
      ctx.closePath();
      ctx.fill();
      break;
    }

    case 'butterfly_flock':
    default: {
      const colors = ['#f472b6', '#38bdf8', '#fbbf24'];
      colors.forEach((col, idx) => {
        const bx = Math.cos(elapsedSec * 3 + idx * 2.1) * 6.5 * sc;
        const by = -12 * sc + Math.sin(elapsedSec * 4.5 + idx) * 4.2 * sc;
        const wing = Math.abs(Math.sin(elapsedSec * 12 + idx)) * 3.8 * sc;
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.ellipse(bx - 1.6 * sc, by, wing, 2.4 * sc, 0.3, 0, Math.PI * 2);
        ctx.ellipse(bx + 1.6 * sc, by, wing, 2.4 * sc, -0.3, 0, Math.PI * 2);
        ctx.fill();
      });
      break;
    }
  }

  ctx.restore();

  // Floating Animal Name & Cycle Badge
  if (isSelectedInStudio || pose.isSleeping || pose.isFeeding) {
    ctx.save();
    const labelText = `${animal.name} • ${pose.cycleBadge}`;
    ctx.font = '700 9.5px "Inter", sans-serif';
    const tw = ctx.measureText(labelText).width + 12;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.strokeStyle = isSelectedInStudio ? '#fbbf24' : '#34d399';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.roundRect(pt.x - tw / 2, pt.y - 26 * sc, tw, 15, 6);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#f8fafc';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(labelText, pt.x, pt.y - 26 * sc + 7.5);
    ctx.restore();
  }
}

// ============================================================================
// 6. CUSTOM TERRAIN / ROAD TILE OVERRIDE RENDERER
//    (SUPPORTS HIGH-RESOLUTION AFFINE TEXTURE MAPPING FROM REFERENCE IMAGE)
// ============================================================================
export function drawCustomCreatorTerrainTile(
  ctx: CanvasRenderingContext2D,
  pN: { x: number; y: number },
  pE: { x: number; y: number },
  pS: { x: number; y: number },
  pW: { x: number; y: number },
  terrainType: CreatorTerrainType,
  isNight: boolean,
  elapsedSec: number
) {
  const cx = (pN.x + pS.x) * 0.5;
  const cy = (pE.y + pW.y) * 0.5;

  let fill = '#22c55e';
  let stroke = '#16a34a';

  switch (terrainType) {
    case 'road_asphalt':
      fill = isNight ? '#1e293b' : '#334155';
      stroke = isNight ? '#334155' : '#475569';
      break;
    case 'road_cobble':
      fill = isNight ? '#475569' : '#94a3b8';
      stroke = isNight ? '#334155' : '#64748b';
      break;
    case 'road_dirt':
      fill = isNight ? '#78350f' : '#d97706';
      stroke = isNight ? '#451a03' : '#b45309';
      break;
    case 'wood_deck':
      fill = isNight ? '#713f12' : '#b45309';
      stroke = isNight ? '#451a03' : '#78350f';
      break;
    case 'plaza_marble':
      fill = isNight ? '#cbd5e1' : '#f8fafc';
      stroke = isNight ? '#94a3b8' : '#cbd5e1';
      break;
    case 'sand_golden':
      fill = isNight ? '#a16207' : '#fde047';
      stroke = isNight ? '#854d0e' : '#facc15';
      break;
    case 'flower_garden':
      fill = isNight ? '#065f46' : '#22c55e';
      stroke = isNight ? '#047857' : '#16a34a';
      break;
    case 'grass_emerald':
      fill = isNight ? '#047857' : '#4ade80';
      stroke = isNight ? '#065f46' : '#22c55e';
      break;
    case 'grass_open_meadow':
      fill = isNight ? '#15803d' : '#86efac';
      stroke = isNight ? '#166534' : '#4ade80';
      break;
    case 'water_pond':
      fill = isNight ? '#0369a1' : '#38bdf8';
      stroke = isNight ? '#0284c7' : '#0ea5e9';
      break;
    case 'img_paving_herringbone_red':
      fill = isNight ? '#7f1d1d' : '#b45346';
      stroke = '#57534e';
      break;
    case 'img_paving_basketweave_brown':
      fill = isNight ? '#78350f' : '#9a6b47';
      stroke = '#5c4028';
      break;
    case 'img_paving_herringbone_grey':
      fill = isNight ? '#64748b' : '#c7c6c1';
      stroke = '#78716c';
      break;
    case 'img_paving_hex_blue':
      fill = isNight ? '#475569' : '#93afd3';
      stroke = '#7c5836';
      break;
    case 'img_stone_river_grey':
      fill = isNight ? '#44403c' : '#787572';
      stroke = '#57534e';
      break;
    case 'img_stone_pebble_cream':
      fill = isNight ? '#a8a29e' : '#f3dfa8';
      stroke = '#c2b280';
      break;
    case 'img_stone_flagstone_brown':
      fill = isNight ? '#57534e' : '#735742';
      stroke = '#453222';
      break;
    case 'img_tile_dotted_grey':
      fill = isNight ? '#475569' : '#94999c';
      stroke = '#52525b';
      break;
    case 'img_brick_running_pastel':
      fill = isNight ? '#78716c' : '#cbb89d';
      stroke = '#57534e';
      break;
    case 'img_paving_parquet_taupe':
      fill = isNight ? '#78716c' : '#b89f8d';
      stroke = '#57534e';
      break;
    case 'img_wood_plank_terracotta':
      fill = isNight ? '#9a3412' : '#c87d44';
      stroke = '#7c2d12';
      break;
    case 'img_brick_checker_red':
      fill = isNight ? '#7f1d1d' : '#a94e45';
      stroke = '#57534e';
      break;
    case 'img_cobble_rounded_cream':
      fill = isNight ? '#57534e' : '#7c624c';
      stroke = '#44403c';
      break;
    case 'img_brick_classic_orange':
      fill = isNight ? '#9a3412' : '#e07a2a';
      stroke = '#7c2d12';
      break;
    case 'img_paving_lattice_red':
      fill = isNight ? '#7f1d1d' : '#a85148';
      stroke = '#57534e';
      break;
    case 'img_tile_diamond_gold':
      fill = isNight ? '#a16207' : '#ebd086';
      stroke = '#785c2a';
      break;
  }

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(pN.x, pN.y);
  ctx.lineTo(pE.x, pE.y);
  ctx.lineTo(pS.x, pS.y);
  ctx.lineTo(pW.x, pW.y);
  ctx.closePath();

  // Check if this tile belongs to the 16 Reference Image Textures and can be affine-mapped
  const gridCell = TERRAIN_SPRITE_GRID_MAP[terrainType];
  const atlas = gridCell ? getTerrainAtlasImage() : null;

  if (gridCell && atlas && atlas.naturalWidth > 0) {
    ctx.save();
    ctx.clip();

    // Map unit square [0,1]x[0,1] to isometric diamond (pN -> pE, pN -> pW)
    const ux = pE.x - pN.x;
    const uy = pE.y - pN.y;
    const vx = pW.x - pN.x;
    const vy = pW.y - pN.y;
    ctx.transform(ux, uy, vx, vy, pN.x, pN.y);

    const colSpec = COL_CROP_NORM[gridCell.col];
    const rowSpec = ROW_CROP_NORM[gridCell.row];
    const sx = colSpec.start * atlas.naturalWidth;
    const sy = rowSpec.start * atlas.naturalHeight;
    const sw = colSpec.size * atlas.naturalWidth;
    const sh = rowSpec.size * atlas.naturalHeight;

    ctx.drawImage(atlas, sx, sy, sw, sh, 0, 0, 1, 1);

    if (isNight) {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.35)';
      ctx.fillRect(0, 0, 1, 1);
    }
    ctx.restore();

    ctx.strokeStyle = stroke;
    ctx.lineWidth = 0.85;
    ctx.stroke();
    ctx.restore();
    return;
  }

  // Fallback / Procedural Vector Tile Rendering
  ctx.fillStyle = fill;
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 1.1;
  ctx.fill();
  ctx.stroke();

  if (terrainType === 'road_asphalt') {
    ctx.strokeStyle = 'rgba(250, 204, 21, 0.85)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx - (pE.x - pW.x) * 0.15, cy - (pS.y - pN.y) * 0.15);
    ctx.lineTo(cx + (pE.x - pW.x) * 0.15, cy + (pS.y - pN.y) * 0.15);
    ctx.stroke();
  } else if (terrainType === 'road_cobble') {
    ctx.fillStyle = isNight ? '#64748b' : '#cbd5e1';
    ctx.beginPath();
    ctx.arc(cx - 4, cy - 1, 2.2, 0, Math.PI * 2);
    ctx.arc(cx + 4, cy + 1, 2.2, 0, Math.PI * 2);
    ctx.arc(cx, cy - 2.2, 2.0, 0, Math.PI * 2);
    ctx.fill();
  } else if (terrainType === 'grass_open_meadow' || terrainType === 'grass_emerald') {
    // Delicate grass blades
    ctx.strokeStyle = '#15803d';
    ctx.lineWidth = 1;
    [-4, 0, 4].forEach((gx) => {
      ctx.beginPath();
      ctx.moveTo(cx + gx, cy + 1);
      ctx.lineTo(cx + gx - 1, cy - 2.5);
      ctx.stroke();
    });
  } else if (terrainType === 'flower_garden') {
    const cols = ['#f43f5e', '#facc15', '#ec4899', '#38bdf8'];
    cols.forEach((c, i) => {
      const ang = (i / 4) * Math.PI * 2;
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.arc(cx + Math.cos(ang) * 5.5, cy + Math.sin(ang) * 2.8, 1.9, 0, Math.PI * 2);
      ctx.fill();
    });
  } else if (terrainType === 'water_pond') {
    const rWave = 3.5 + Math.sin(elapsedSec * 3.2) * 1.5;
    ctx.strokeStyle = 'rgba(224, 242, 254, 0.68)';
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rWave * 1.8, rWave * 0.9, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

// ============================================================================
// 7. CUSTOM FENCES 3D RENDERER (5 DETAILED ARCHITECTURAL FENCES)
// ============================================================================
export function drawCustomCreatorFence3D(
  ctx: CanvasRenderingContext2D,
  project: ProjectFn,
  tileW: number,
  fence: CreatorFenceItem,
  isSelectedInStudio: boolean
) {
  const len = Math.max(0.5, Math.min(8, fence.lengthTiles || 1.5));
  const half = len * 0.5;
  const wx1 = fence.axis === 'x' ? fence.wx - half : fence.wx;
  const wy1 = fence.axis === 'y' ? fence.wy - half : fence.wy;
  const wx2 = fence.axis === 'x' ? fence.wx + half : fence.wx;
  const wy2 = fence.axis === 'y' ? fence.wy + half : fence.wy;

  const sc = tileW / 38;
  const p1 = project(wx1, wy1, 0);
  const p2 = project(wx2, wy2, 0);

  ctx.save();

  if (fence.fenceModel === 'fence_hedge_bush') {
    // Leafy Green Hedge Fence with Blooming Flowers
    const steps = Math.max(3, Math.round(len * 4));
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const hx = p1.x + (p2.x - p1.x) * t;
      const hy = p1.y + (p2.y - p1.y) * t;
      ctx.fillStyle = i % 2 === 0 ? '#15803d' : '#16a34a';
      ctx.beginPath();
      ctx.arc(hx, hy - 6.5 * sc, 6.8 * sc, 0, Math.PI * 2);
      ctx.fill();
      if (i % 2 === 1) {
        ctx.fillStyle = '#f472b6';
        ctx.beginPath();
        ctx.arc(hx, hy - 9 * sc, 1.8 * sc, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  } else {
    const postCol =
      fence.fenceModel === 'fence_white_picket'
        ? '#f8fafc'
        : fence.fenceModel === 'fence_iron_gold'
        ? '#1e293b'
        : fence.fenceModel === 'fence_stone_brick'
        ? '#64748b'
        : '#78350f';
    const railCol =
      fence.fenceModel === 'fence_white_picket'
        ? '#e2e8f0'
        : fence.fenceModel === 'fence_iron_gold'
        ? '#fbbf24'
        : fence.fenceModel === 'fence_stone_brick'
        ? '#94a3b8'
        : '#b45309';

    // Top and bottom horizontal rails
    ctx.strokeStyle = railCol;
    ctx.lineWidth = fence.fenceModel === 'fence_stone_brick' ? 6 * sc : 2.4 * sc;
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y - 9.5 * sc);
    ctx.lineTo(p2.x, p2.y - 9.5 * sc);
    ctx.moveTo(p1.x, p1.y - 4 * sc);
    ctx.lineTo(p2.x, p2.y - 4 * sc);
    ctx.stroke();

    // Posts along segment with post caps & end-post warm lanterns
    const postCount = Math.max(2, Math.round(len * 2) + 1);
    for (let i = 0; i < postCount; i++) {
      const t = i / (postCount - 1);
      const px = p1.x + (p2.x - p1.x) * t;
      const py = p1.y + (p2.y - p1.y) * t;
      ctx.fillStyle = postCol;
      ctx.fillRect(px - 2 * sc, py - 13.5 * sc, 4 * sc, 13.5 * sc);

      if (fence.fenceModel === 'fence_iron_gold') {
        ctx.fillStyle = '#fde047';
        ctx.beginPath();
        ctx.arc(px, py - 14.5 * sc, 2.2 * sc, 0, Math.PI * 2);
        ctx.fill();
      } else if (i === 0 || i === postCount - 1) {
        // Warm post-cap lantern on end posts
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(px, py - 15 * sc, 2 * sc, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  if (isSelectedInStudio) {
    const mid = project(fence.wx, fence.wy, 0);
    ctx.beginPath();
    ctx.arc(mid.x, mid.y - 6 * sc, 10 * sc, 0, Math.PI * 2);
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 3]);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  ctx.restore();
}
