import {
  CreatorBuildingItem,
  CreatorNpcConfig,
  CreatorPropItem,
  CreatorAnimalItem,
  CreatorTerrainType,
  CreatorFenceItem,
} from '../types/index.ts';

type ProjectFn = (wx: number, wy: number, wz: number) => { x: number; y: number };

function shadeHex(hex: string, percent: number): string {
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

  const b00 = project(x0, y0, z0);
  const b10 = project(x1, y0, z0);
  const b11 = project(x1, y1, z0);
  const b01 = project(x0, y1, z0);

  const t00 = project(x0, y0, z1);
  const t10 = project(x1, y0, z1);
  const t11 = project(x1, y1, z1);
  const t01 = project(x0, y1, z1);

  // Left-front face (x0..x1 at y1, wait: in iso (wx - wy), front-left is x0->x0..y1, front-right is x1->y1)
  // Standard isometric: +wx goes right-down, +wy goes left-down.
  // Front-most corner is (x1, y1).
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

  // Front-right
  ctx.beginPath();
  ctx.moveTo(p11.x, p11.y);
  ctx.lineTo(p10.x, p10.y);
  ctx.lineTo(apex.x, apex.y);
  ctx.closePath();
  ctx.fillStyle = shadeHex(baseColor, -22);
  ctx.fill();
}

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

  const baseCenter = project(wx, wy, 0);

  ctx.save();

  // 1. Ground Shadow & Base Pad
  ctx.beginPath();
  ctx.ellipse(
    baseCenter.x,
    baseCenter.y + tileW * 0.06 * sc,
    tileW * 0.55 * sc,
    tileW * 0.28 * sc,
    0,
    0,
    Math.PI * 2
  );
  ctx.fillStyle = 'rgba(15, 23, 42, 0.28)';
  ctx.fill();

  // Highlight ring if selected in studio, hovered, or near player
  if (isSelectedInStudio || isHovered || isNearPlayer) {
    ctx.beginPath();
    ctx.ellipse(
      baseCenter.x,
      baseCenter.y + tileW * 0.03 * sc,
      tileW * 0.62 * sc,
      tileW * 0.32 * sc,
      0,
      0,
      Math.PI * 2
    );
    ctx.strokeStyle = isSelectedInStudio
      ? '#fbbf24'
      : isNearPlayer
      ? '#34d399'
      : accentColor;
    ctx.lineWidth = isSelectedInStudio ? 3 : 2;
    if (isSelectedInStudio) {
      ctx.setLineDash([6, 4]);
    }
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Foundation platform
  drawIsoPrism(
    ctx,
    project,
    wx,
    wy,
    0,
    0.92 * sc,
    0.92 * sc,
    0.08 * sc,
    '#e2e8f0',
    '#cbd5e1',
    '#94a3b8'
  );

  // 2. Model-specific 3D Low-Poly Geometry
  switch (modelType) {
    case 'modern_tower': {
      // Sleek glass skyscraper with tiered setbacks & helipad
      drawIsoPrism(
        ctx,
        project,
        wx,
        wy,
        0.08 * sc,
        0.68 * sc,
        0.68 * sc,
        1.25 * sc,
        shadeHex(accentColor, 25),
        shadeHex(accentColor, 5),
        shadeHex(accentColor, -25)
      );
      drawIsoPrism(
        ctx,
        project,
        wx,
        wy,
        1.33 * sc,
        0.48 * sc,
        0.48 * sc,
        0.45 * sc,
        shadeHex(roofColor, 20),
        shadeHex(roofColor, 0),
        shadeHex(roofColor, -25)
      );
      // Glowing horizontal window strips
      for (let i = 1; i <= 4; i++) {
        const zBand = (0.22 + i * 0.24) * sc;
        const pL = project(wx - 0.32 * sc, wy + 0.35 * sc, zBand);
        const pM = project(wx + 0.35 * sc, wy + 0.35 * sc, zBand);
        const pR = project(wx + 0.35 * sc, wy - 0.32 * sc, zBand);
        ctx.beginPath();
        ctx.moveTo(pL.x, pL.y);
        ctx.lineTo(pM.x, pM.y);
        ctx.lineTo(pR.x, pR.y);
        ctx.strokeStyle = 'rgba(224, 242, 254, 0.85)';
        ctx.lineWidth = 2 * sc;
        ctx.stroke();
      }
      // Spire
      const topC = project(wx, wy, 1.78 * sc);
      const spireTop = project(wx, wy, 2.15 * sc);
      ctx.beginPath();
      ctx.moveTo(topC.x, topC.y);
      ctx.lineTo(spireTop.x, spireTop.y);
      ctx.strokeStyle = '#f8fafc';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(spireTop.x, spireTop.y, 3.2, 0, Math.PI * 2);
      ctx.fillStyle = pulse > 0.5 ? '#f43f5e' : '#fda4af';
      ctx.fill();
      break;
    }

    case 'innovation_lab': {
      // Science lab base + observatory dome + energy ring
      drawIsoPrism(
        ctx,
        project,
        wx,
        wy,
        0.08 * sc,
        0.78 * sc,
        0.72 * sc,
        0.62 * sc,
        '#f8fafc',
        '#e2e8f0',
        '#cbd5e1'
      );
      drawIsoPrism(
        ctx,
        project,
        wx,
        wy,
        0.35 * sc,
        0.82 * sc,
        0.76 * sc,
        0.12 * sc,
        shadeHex(accentColor, 15),
        accentColor,
        shadeHex(accentColor, -25)
      );
      const domeBase = project(wx, wy, 0.7 * sc);
      ctx.beginPath();
      ctx.arc(domeBase.x, domeBase.y - tileW * 0.08 * sc, tileW * 0.25 * sc, Math.PI, 0);
      ctx.closePath();
      ctx.fillStyle = roofColor;
      ctx.fill();
      ctx.strokeStyle = '#f8fafc';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      break;
    }

    case 'school_pavilion': {
      // Warm academic hall with pitched roof & clock tower
      drawIsoPrism(
        ctx,
        project,
        wx,
        wy,
        0.08 * sc,
        0.82 * sc,
        0.68 * sc,
        0.58 * sc,
        '#fef3c7',
        '#fde68a',
        '#f59e0b'
      );
      drawIsoPyramidRoof(
        ctx,
        project,
        wx,
        wy,
        0.66 * sc,
        0.92 * sc,
        0.78 * sc,
        0.42 * sc,
        roofColor
      );
      // Mini clock tower
      drawIsoPrism(
        ctx,
        project,
        wx,
        wy,
        0.92 * sc,
        0.26 * sc,
        0.26 * sc,
        0.38 * sc,
        '#fffbeb',
        '#fef3c7',
        '#d97706'
      );
      break;
    }

    case 'creative_studio': {
      // Modern studio with LED billboard on roof
      drawIsoPrism(
        ctx,
        project,
        wx,
        wy,
        0.08 * sc,
        0.76 * sc,
        0.72 * sc,
        0.65 * sc,
        shadeHex(roofColor, 10),
         '#1e293b',
        '#0f172a'
      );
      // Neon accent trim
      drawIsoPrism(
        ctx,
        project,
        wx,
        wy,
        0.73 * sc,
        0.8 * sc,
        0.76 * sc,
        0.09 * sc,
         shadeHex(accentColor, 20),
        accentColor,
        shadeHex(accentColor, -20)
      );
      // Billboard screen
      const bb = project(wx, wy, 1.05 * sc);
      ctx.fillStyle = '#0f172a';
      ctx.strokeStyle = accentColor;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(bb.x - 22 * sc, bb.y - 16 * sc, 44 * sc, 24 * sc, 4);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#f472b6';
      ctx.font = `900 ${Math.round(9 * sc)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText('ON STUDIO', bb.x, bb.y - 1 * sc);
      break;
    }

    case 'office_hq': {
      // Twin office towers with skybridge
      drawIsoPrism(
        ctx,
        project,
        wx - 0.2 * sc,
        wy,
        0.08 * sc,
        0.36 * sc,
        0.58 * sc,
        1.05 * sc,
        shadeHex(accentColor, 20),
        accentColor,
        shadeHex(accentColor, -25)
      );
      drawIsoPrism(
        ctx,
        project,
        wx + 0.2 * sc,
        wy,
        0.08 * sc,
        0.36 * sc,
        0.58 * sc,
        0.9 * sc,
        shadeHex(roofColor, 25),
        roofColor,
        shadeHex(roofColor, -25)
      );
      // Skybridge
      drawIsoPrism(
        ctx,
        project,
        wx,
        wy,
        0.58 * sc,
        0.5 * sc,
        0.28 * sc,
        0.14 * sc,
        '#f8fafc',
        '#e2e8f0',
        '#94a3b8'
      );
      break;
    }

    case 'arcade_arena': {
      // Neon arcade hall with glowing portal & rooftop crown
      drawIsoPrism(
        ctx,
        project,
        wx,
        wy,
        0.08 * sc,
        0.78 * sc,
        0.78 * sc,
        0.7 * sc,
        '#1e1b4b',
        '#312e81',
        '#0f172a'
      );
      drawIsoPrism(
        ctx,
        project,
        wx,
        wy,
        0.78 * sc,
        0.84 * sc,
        0.84 * sc,
        0.14 * sc,
        shadeHex(accentColor, 25),
        accentColor,
        shadeHex(roofColor, -10)
      );
      const topP = project(wx, wy, 1.15 * sc);
      ctx.beginPath();
      ctx.arc(topP.x, topP.y, (10 + pulse * 3) * sc, 0, Math.PI * 2);
      ctx.fillStyle = accentColor;
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
      break;
    }

    case 'concert_stage': {
      // Open festival stage with truss & speakers
      drawIsoPrism(
        ctx,
        project,
        wx,
        wy,
        0.08 * sc,
        0.88 * sc,
        0.78 * sc,
        0.18 * sc,
        '#334155',
        '#1e293b',
        '#0f172a'
      );
      // Backdrop wall
      drawIsoPrism(
        ctx,
        project,
        wx - 0.25 * sc,
        wy - 0.25 * sc,
        0.26 * sc,
        0.72 * sc,
        0.16 * sc,
        0.72 * sc,
        shadeHex(accentColor, 15),
        accentColor,
        roofColor
      );
      // Canopy roof
      drawIsoPrism(
        ctx,
        project,
        wx,
        wy,
        0.95 * sc,
        0.86 * sc,
        0.76 * sc,
        0.1 * sc,
        shadeHex(roofColor, 20),
        roofColor,
        shadeHex(roofColor, -25)
      );
      break;
    }

    case 'ferris_park': {
      // Animated Ferris Wheel
      drawIsoPrism(
        ctx,
        project,
        wx,
        wy,
        0.08 * sc,
        0.65 * sc,
        0.55 * sc,
        0.16 * sc,
        '#fce7f3',
        '#fbcfe8',
        '#f472b6'
      );
      const hub = project(wx, wy, 0.98 * sc);
      const baseL = project(wx - 0.25 * sc, wy + 0.15 * sc, 0.2 * sc);
      const baseR = project(wx + 0.25 * sc, wy - 0.15 * sc, 0.2 * sc);

      // A-frame legs
      ctx.beginPath();
      ctx.moveTo(baseL.x, baseL.y);
      ctx.lineTo(hub.x, hub.y);
      ctx.lineTo(baseR.x, baseR.y);
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 3 * sc;
      ctx.stroke();

      // Wheel rim
      const wheelR = tileW * 0.42 * sc;
      ctx.beginPath();
      ctx.arc(hub.x, hub.y, wheelR, 0, Math.PI * 2);
      ctx.strokeStyle = accentColor;
      ctx.lineWidth = 3 * sc;
      ctx.stroke();

      // Rotating spokes & cabins
      const angleBase = now * 0.0008;
      for (let i = 0; i < 8; i++) {
        const a = angleBase + (i * Math.PI) / 4;
        const cx = hub.x + Math.cos(a) * wheelR;
        const cy = hub.y + Math.sin(a) * wheelR;
        ctx.beginPath();
        ctx.moveTo(hub.x, hub.y);
        ctx.lineTo(cx, cy);
        ctx.strokeStyle = 'rgba(255,255,255,0.55)';
        ctx.lineWidth = 1.2;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(cx, cy, 4.2 * sc, 0, Math.PI * 2);
        ctx.fillStyle = i % 2 === 0 ? accentColor : '#facc15';
        ctx.fill();
      }
      break;
    }

    case 'esports_dome': {
      // Cyber stadium dome
      drawIsoPrism(
        ctx,
        project,
        wx,
        wy,
        0.08 * sc,
        0.85 * sc,
        0.85 * sc,
        0.35 * sc,
        '#0f172a',
        '#1e293b',
        '#020617'
      );
      const domeP = project(wx, wy, 0.42 * sc);
      ctx.beginPath();
      ctx.ellipse(
        domeP.x,
        domeP.y - tileW * 0.06 * sc,
        tileW * 0.42 * sc,
        tileW * 0.28 * sc,
        0,
        Math.PI,
        0
      );
      ctx.closePath();
      ctx.fillStyle = roofColor;
      ctx.fill();
      ctx.strokeStyle = accentColor;
      ctx.lineWidth = 2.5 * sc;
      ctx.stroke();
      break;
    }

    case 'open_cafe': {
      // Cozy cafe kiosk with striped awning
      drawIsoPrism(
        ctx,
        project,
        wx,
        wy,
        0.08 * sc,
        0.62 * sc,
        0.58 * sc,
        0.52 * sc,
        '#fffbeb',
        '#fef3c7',
        '#fde68a'
      );
      drawIsoPyramidRoof(
        ctx,
        project,
        wx,
        wy,
        0.6 * sc,
        0.76 * sc,
        0.72 * sc,
        0.32 * sc,
        accentColor
      );
      break;
    }

    case 'reading_gazebo': {
      // Tropical wooden gazebo with pillars & pyramid roof
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
          0.08 * sc,
          0.08 * sc,
          0.08 * sc,
          0.52 * sc,
          '#d97706',
          '#b45309',
          '#78350f'
        );
      });
      drawIsoPyramidRoof(
        ctx,
        project,
        wx,
        wy,
        0.6 * sc,
        0.84 * sc,
        0.84 * sc,
        0.38 * sc,
        roofColor
      );
      break;
    }

    case 'fountain_plaza': {
      // Tiered marble water fountain
      drawIsoPrism(
        ctx,
        project,
        wx,
        wy,
        0.08 * sc,
        0.86 * sc,
        0.86 * sc,
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
        0.24 * sc,
        0.46 * sc,
        0.46 * sc,
        0.22 * sc,
        '#7dd3fc',
        '#e2e8f0',
        '#cbd5e1'
      );
      const jetTop = project(wx, wy, (0.72 + pulse * 0.12) * sc);
      const jetBase = project(wx, wy, 0.46 * sc);
      ctx.beginPath();
      ctx.moveTo(jetBase.x, jetBase.y);
      ctx.lineTo(jetTop.x, jetTop.y);
      ctx.strokeStyle = '#e0f2fe';
      ctx.lineWidth = 3 * sc;
      ctx.stroke();
      break;
    }

    case 'info_kiosk': {
      // Smart digital totem
      drawIsoPrism(
        ctx,
        project,
        wx,
        wy,
        0.08 * sc,
        0.42 * sc,
        0.32 * sc,
        0.85 * sc,
        shadeHex(accentColor, 20),
        '#1e293b',
        '#0f172a'
      );
      drawIsoPrism(
        ctx,
        project,
        wx,
        wy,
        0.93 * sc,
        0.52 * sc,
        0.42 * sc,
        0.1 * sc,
        accentColor,
        roofColor,
        shadeHex(roofColor, -20)
      );
      break;
    }

    case 'sakura_park':
    default: {
      // Sakura park with pink blossom canopy
      drawIsoPrism(
        ctx,
        project,
        wx,
        wy,
        0.08 * sc,
        0.16 * sc,
        0.16 * sc,
        0.55 * sc,
        '#78350f',
        '#713f12',
        '#451a03'
      );
      const canopyCenter = project(wx, wy, 0.85 * sc);
      ctx.beginPath();
      ctx.arc(canopyCenter.x, canopyCenter.y, tileW * 0.34 * sc, 0, Math.PI * 2);
      ctx.fillStyle = accentColor || '#f472b6';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(
        canopyCenter.x - tileW * 0.16 * sc,
        canopyCenter.y + tileW * 0.06 * sc,
        tileW * 0.24 * sc,
        0,
        Math.PI * 2
      );
      ctx.fillStyle = shadeHex(accentColor || '#f472b6', 20);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(
        canopyCenter.x + tileW * 0.16 * sc,
        canopyCenter.y + tileW * 0.05 * sc,
        tileW * 0.24 * sc,
        0,
        Math.PI * 2
      );
      ctx.fillStyle = roofColor || '#db2777';
      ctx.fill();
      break;
    }
  }

  // 3. Floating Building Label Badge
  const labelZ =
    modelType === 'modern_tower'
      ? 2.25 * sc
      : modelType === 'ferris_park' || modelType === 'office_hq'
      ? 1.55 * sc
      : 1.28 * sc;
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
    ? 'rgba(120, 53, 15, 0.92)'
    : 'rgba(15, 23, 42, 0.88)';
  ctx.strokeStyle = isSelectedInStudio
    ? '#fbbf24'
    : isHovered || isNearPlayer
    ? '#38bdf8'
    : building.accentColor;
  ctx.lineWidth = isSelectedInStudio ? 2 : 1.3;

  ctx.beginPath();
  ctx.roundRect(bx, by, boxW, boxH, 8);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.font = '800 10.5px "Inter", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(badgeTitle, labelAnchor.x, by + (building.tagline ? 10 : 10));

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

    // Coordinate pill below object
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

  // 3. Hover placement ghost when placing a new stock building
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
// 4. CUSTOM PROPS 3D RENDERER (TREES, BENCHES, SWINGS, CAMPFIRES)
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
  const breeze = Math.sin(elapsed * 2.2 + wx * 0.7 + wy * 0.5) * 1.4 * sc;

  ctx.save();

  // Selection ring in Creator Studio
  if (isSelectedInStudio) {
    ctx.beginPath();
    ctx.ellipse(pt.x, pt.y + 2 * sc, 20 * sc, 10 * sc, 0, 0, Math.PI * 2);
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2.2;
    ctx.setLineDash([5, 3]);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Soft shadow
  ctx.fillStyle = 'rgba(15, 23, 42, 0.24)';
  ctx.beginPath();
  ctx.ellipse(pt.x, pt.y + 2 * sc, 13 * sc, 6.5 * sc, 0, 0, Math.PI * 2);
  ctx.fill();

  switch (propModel) {
    // ---------------- POHON (6 MODEL) ----------------
    case 'tree_oak_apple': {
      // Trunk
      ctx.fillStyle = '#78350f';
      ctx.fillRect(pt.x - 3 * sc, pt.y - 24 * sc, 6 * sc, 24 * sc);
      // Lush canopy
      ctx.fillStyle = '#15803d';
      ctx.beginPath();
      ctx.arc(pt.x - 7 * sc + breeze, pt.y - 26 * sc, 11 * sc, 0, Math.PI * 2);
      ctx.arc(pt.x + 7 * sc + breeze, pt.y - 26 * sc, 11 * sc, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.arc(pt.x + breeze, pt.y - 34 * sc, 13 * sc, 0, Math.PI * 2);
      ctx.fill();
      // Red apples
      const apples = [
        [-6, -28],
        [5, -31],
        [0, -23],
        [-3, -37],
        [6, -24],
      ];
      ctx.fillStyle = '#ef4444';
      apples.forEach(([ax, ay]) => {
        ctx.beginPath();
        ctx.arc(pt.x + ax * sc + breeze, pt.y + ay * sc, 2.3 * sc, 0, Math.PI * 2);
        ctx.fill();
      });
      break;
    }

    case 'tree_pine_spruce': {
      ctx.fillStyle = '#5c280b';
      ctx.fillRect(pt.x - 2.6 * sc, pt.y - 16 * sc, 5.2 * sc, 16 * sc);
      const tiers = [
        { y: -12, w: 16, h: 16, c: '#065f46' },
        { y: -23, w: 13, h: 15, c: '#047857' },
        { y: -33, w: 9.5, h: 14, c: '#10b981' },
      ];
      tiers.forEach((t) => {
        ctx.fillStyle = t.c;
        ctx.beginPath();
        ctx.moveTo(pt.x + breeze * 0.7, pt.y + (t.y - t.h) * sc);
        ctx.lineTo(pt.x - t.w * sc, pt.y + t.y * sc);
        ctx.lineTo(pt.x + t.w * sc, pt.y + t.y * sc);
        ctx.closePath();
        ctx.fill();
      });
      break;
    }

    case 'tree_sakura_pink': {
      ctx.fillStyle = '#5b21b6';
      ctx.fillRect(pt.x - 2.8 * sc, pt.y - 23 * sc, 5.6 * sc, 23 * sc);
      ctx.fillStyle = '#ec4899';
      ctx.beginPath();
      ctx.arc(pt.x - 8 * sc + breeze, pt.y - 25 * sc, 11 * sc, 0, Math.PI * 2);
      ctx.arc(pt.x + 8 * sc + breeze, pt.y - 25 * sc, 11 * sc, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f9a8d4';
      ctx.beginPath();
      ctx.arc(pt.x + breeze, pt.y - 33 * sc, 13 * sc, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 'tree_banyan_shady': {
      ctx.fillStyle = '#692f0b';
      ctx.fillRect(pt.x - 4.5 * sc, pt.y - 25 * sc, 9 * sc, 25 * sc);
      // Aerial hanging roots
      ctx.strokeStyle = '#92400e';
      ctx.lineWidth = 1.2 * sc;
      [-8, -4, 4, 8].forEach((rx) => {
        ctx.beginPath();
        ctx.moveTo(pt.x + rx * sc, pt.y - 22 * sc);
        ctx.lineTo(pt.x + rx * 0.9 * sc, pt.y - 5 * sc);
        ctx.stroke();
      });
      ctx.fillStyle = '#166534';
      ctx.beginPath();
      ctx.ellipse(pt.x + breeze, pt.y - 28 * sc, 20 * sc, 11 * sc, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.ellipse(pt.x + breeze, pt.y - 34 * sc, 15 * sc, 9 * sc, 0, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 'tree_palm_tropical': {
      // Curved trunk
      ctx.strokeStyle = '#92400e';
      ctx.lineWidth = 4.5 * sc;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(pt.x, pt.y);
      ctx.quadraticCurveTo(pt.x + 4 * sc, pt.y - 16 * sc, pt.x + 2 * sc + breeze, pt.y - 32 * sc);
      ctx.stroke();
      // Palm fronds
      const topX = pt.x + 2 * sc + breeze;
      const topY = pt.y - 32 * sc;
      ctx.strokeStyle = '#16a34a';
      ctx.lineWidth = 3 * sc;
      [-14, -8, 0, 8, 14].forEach((dx, idx) => {
        ctx.beginPath();
        ctx.moveTo(topX, topY);
        ctx.quadraticCurveTo(
          topX + dx * 0.7 * sc,
          topY - (6 + (idx % 2) * 3) * sc,
          topX + dx * 1.25 * sc,
          topY + 5 * sc
        );
        ctx.stroke();
      });
      break;
    }

    case 'tree_autumn_maple': {
      ctx.fillStyle = '#78350f';
      ctx.fillRect(pt.x - 3 * sc, pt.y - 23 * sc, 6 * sc, 23 * sc);
      ctx.fillStyle = '#ea580c';
      ctx.beginPath();
      ctx.arc(pt.x - 7 * sc + breeze, pt.y - 25 * sc, 11 * sc, 0, Math.PI * 2);
      ctx.arc(pt.x + 7 * sc + breeze, pt.y - 25 * sc, 11 * sc, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(pt.x + breeze, pt.y - 33 * sc, 12.5 * sc, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    // ---------------- TEMPAT DUDUK / BANGKU (5 MODEL) ----------------
    case 'bench_wood_classic':
    case 'bench_white_minimal':
    case 'bench_stone_marble':
    case 'bench_royal_gold': {
      const seatColor =
        propModel === 'bench_white_minimal'
          ? '#f8fafc'
          : propModel === 'bench_stone_marble'
          ? '#cbd5e1'
          : propModel === 'bench_royal_gold'
          ? '#fbbf24'
          : '#b45309';
      const legColor =
        propModel === 'bench_royal_gold'
          ? '#78350f'
          : propModel === 'bench_white_minimal'
          ? '#475569'
          : '#334155';

      // Legs
      ctx.fillStyle = legColor;
      ctx.fillRect(pt.x - 10 * sc, pt.y - 5 * sc, 2.5 * sc, 6 * sc);
      ctx.fillRect(pt.x + 7.5 * sc, pt.y - 5 * sc, 2.5 * sc, 6 * sc);
      // Seat plank
      ctx.fillStyle = seatColor;
      ctx.beginPath();
      ctx.roundRect(pt.x - 12 * sc, pt.y - 8 * sc, 24 * sc, 4.5 * sc, 2 * sc);
      ctx.fill();
      ctx.strokeStyle = 'rgba(15,23,42,0.4)';
      ctx.lineWidth = 0.9 * sc;
      ctx.stroke();
      // Backrest
      ctx.fillStyle = shadeHex(seatColor, -14);
      ctx.beginPath();
      ctx.roundRect(pt.x - 11.5 * sc, pt.y - 14 * sc, 23 * sc, 4.5 * sc, 2 * sc);
      ctx.fill();
      ctx.stroke();
      break;
    }

    case 'bench_picnic_table': {
      // Side benches
      ctx.fillStyle = '#92400e';
      ctx.fillRect(pt.x - 15 * sc, pt.y - 5 * sc, 30 * sc, 3 * sc);
      // Main wooden table top
      ctx.fillStyle = '#d97706';
      ctx.beginPath();
      ctx.roundRect(pt.x - 12 * sc, pt.y - 11 * sc, 24 * sc, 5.5 * sc, 2 * sc);
      ctx.fill();
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 1 * sc;
      ctx.stroke();
      // Legs
      ctx.fillStyle = '#78350f';
      ctx.fillRect(pt.x - 9 * sc, pt.y - 6 * sc, 2.5 * sc, 7 * sc);
      ctx.fillRect(pt.x + 6.5 * sc, pt.y - 6 * sc, 2.5 * sc, 7 * sc);
      break;
    }

    // ---------------- AYUNAN (2 MODEL) ----------------
    case 'swing_wood_garden':
    case 'swing_cyan_modern': {
      const frameColor = propModel === 'swing_cyan_modern' ? '#06b6d4' : '#92400e';
      const barColor = propModel === 'swing_cyan_modern' ? '#22d3ee' : '#b45309';
      const swingSway = Math.sin(elapsed * 2.8 + wx) * 2.2 * sc;

      ctx.strokeStyle = frameColor;
      ctx.lineWidth = 2.6 * sc;
      ctx.lineCap = 'round';
      // Left A-frame & Right A-frame + Top crossbar
      ctx.beginPath();
      ctx.moveTo(pt.x - 15 * sc, pt.y + 2 * sc);
      ctx.lineTo(pt.x - 11 * sc, pt.y - 24 * sc);
      ctx.lineTo(pt.x + 11 * sc, pt.y - 24 * sc);
      ctx.lineTo(pt.x + 15 * sc, pt.y + 2 * sc);
      ctx.stroke();

      // Top canopy bar
      ctx.strokeStyle = barColor;
      ctx.lineWidth = 3.2 * sc;
      ctx.beginPath();
      ctx.moveTo(pt.x - 12 * sc, pt.y - 24 * sc);
      ctx.lineTo(pt.x + 12 * sc, pt.y - 24 * sc);
      ctx.stroke();

      // Two hanging seats
      [-5.5, 5.5].forEach((sx) => {
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 1.1 * sc;
        ctx.beginPath();
        ctx.moveTo(pt.x + (sx - 2) * sc, pt.y - 24 * sc);
        ctx.lineTo(pt.x + (sx - 2) * sc + swingSway, pt.y - 8 * sc);
        ctx.moveTo(pt.x + (sx + 2) * sc, pt.y - 24 * sc);
        ctx.lineTo(pt.x + (sx + 2) * sc + swingSway, pt.y - 8 * sc);
        ctx.stroke();

        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(pt.x + (sx - 3.2) * sc + swingSway, pt.y - 8.5 * sc, 6.4 * sc, 2.4 * sc);
      });
      break;
    }

    // ---------------- API UNGGUN (2 MODEL) ----------------
    case 'campfire_stone_ring':
    case 'campfire_royal_brazier': {
      if (propModel === 'campfire_royal_brazier') {
        // Golden iron brazier bowl
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.ellipse(pt.x, pt.y - 3 * sc, 10 * sc, 5 * sc, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 1.6 * sc;
        ctx.stroke();
      } else {
        // Stone circle + crossed logs
        ctx.fillStyle = '#78350f';
        ctx.fillRect(pt.x - 8 * sc, pt.y - 3 * sc, 16 * sc, 3 * sc);
        for (let i = 0; i < 8; i++) {
          const ang = (i / 8) * Math.PI * 2;
          ctx.fillStyle = i % 2 === 0 ? '#64748b' : '#94a3b8';
          ctx.beginPath();
          ctx.arc(
            pt.x + Math.cos(ang) * 9.5 * sc,
            pt.y + Math.sin(ang) * 4.8 * sc,
            2.4 * sc,
            0,
            Math.PI * 2
          );
          ctx.fill();
        }
      }

      // Animated fire glow & flames
      const flicker = Math.sin(elapsed * 10 + wx) * 1.8 * sc;
      const glow = ctx.createRadialGradient(pt.x, pt.y - 8 * sc, 1 * sc, pt.x, pt.y - 8 * sc, 18 * sc);
      glow.addColorStop(0, 'rgba(251, 191, 36, 0.55)');
      glow.addColorStop(0.6, 'rgba(239, 68, 68, 0.22)');
      glow.addColorStop(1, 'rgba(239, 68, 68, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y - 8 * sc, 18 * sc, 0, Math.PI * 2);
      ctx.fill();

      // Outer orange flame
      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.moveTo(pt.x - 6.5 * sc, pt.y - 2 * sc);
      ctx.quadraticCurveTo(pt.x - 7 * sc, pt.y - 12 * sc, pt.x + flicker * 0.5, pt.y - 19 * sc + flicker);
      ctx.quadraticCurveTo(pt.x + 7 * sc, pt.y - 12 * sc, pt.x + 6.5 * sc, pt.y - 2 * sc);
      ctx.closePath();
      ctx.fill();

      // Inner yellow flame
      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.moveTo(pt.x - 3.5 * sc, pt.y - 2 * sc);
      ctx.quadraticCurveTo(pt.x - 3 * sc, pt.y - 9 * sc, pt.x - flicker * 0.4, pt.y - 13 * sc - flicker * 0.5);
      ctx.quadraticCurveTo(pt.x + 3 * sc, pt.y - 9 * sc, pt.x + 3.5 * sc, pt.y - 2 * sc);
      ctx.closePath();
      ctx.fill();
      break;
    }

    // ---------------- PLAYGROUND ANAK (4 MODEL) ----------------
    case 'playground_slide_colorful': {
      // Soft rubber mat base
      ctx.fillStyle = '#fef08a';
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 1.2 * sc;
      ctx.beginPath();
      ctx.ellipse(pt.x, pt.y + 1 * sc, 20 * sc, 10 * sc, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Tower posts (left side)
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(pt.x - 13 * sc, pt.y - 23 * sc, 2.5 * sc, 23 * sc);
      ctx.fillRect(pt.x - 4 * sc, pt.y - 23 * sc, 2.5 * sc, 23 * sc);

      // Climbing ladder steps (left)
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 1.8 * sc;
      for (let i = 0; i < 4; i++) {
        const ly = pt.y - (4 + i * 4) * sc;
        ctx.beginPath();
        ctx.moveTo(pt.x - 16 * sc + i * 1 * sc, ly);
        ctx.lineTo(pt.x - 11 * sc, ly);
        ctx.stroke();
      }

      // Platform deck
      ctx.fillStyle = '#2563eb';
      ctx.fillRect(pt.x - 14 * sc, pt.y - 18 * sc, 12 * sc, 3.5 * sc);

      // Yellow pyramid roof over tower
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.moveTo(pt.x - 8 * sc, pt.y - 31 * sc);
      ctx.lineTo(pt.x - 16 * sc, pt.y - 22 * sc);
      ctx.lineTo(pt.x, pt.y - 22 * sc);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#ea580c';
      ctx.lineWidth = 1.1 * sc;
      ctx.stroke();

      // Curved slide chute (sky blue & cyan)
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 6.5 * sc;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(pt.x - 4 * sc, pt.y - 16 * sc);
      ctx.bezierCurveTo(pt.x + 3 * sc, pt.y - 15 * sc, pt.x + 7 * sc, pt.y - 3 * sc, pt.x + 15 * sc, pt.y);
      ctx.stroke();

      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 4.2 * sc;
      ctx.beginPath();
      ctx.moveTo(pt.x - 4 * sc, pt.y - 16 * sc);
      ctx.bezierCurveTo(pt.x + 3 * sc, pt.y - 15 * sc, pt.x + 7 * sc, pt.y - 3 * sc, pt.x + 15 * sc, pt.y);
      ctx.stroke();
      break;
    }

    case 'playground_seesaw_dual': {
      const tilt = Math.sin(elapsed * 2.4 + wx) * 4.2 * sc;
      // Base pad
      ctx.fillStyle = '#dcfce7';
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 1.2 * sc;
      ctx.beginPath();
      ctx.ellipse(pt.x, pt.y + 1 * sc, 18 * sc, 8.5 * sc, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Center fulcrum triangle
      ctx.fillStyle = '#2563eb';
      ctx.beginPath();
      ctx.moveTo(pt.x, pt.y - 9 * sc);
      ctx.lineTo(pt.x - 4.5 * sc, pt.y + 1 * sc);
      ctx.lineTo(pt.x + 4.5 * sc, pt.y + 1 * sc);
      ctx.closePath();
      ctx.fill();

      // Tilting plank
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 3.6 * sc;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(pt.x - 15 * sc, pt.y - 8 * sc - tilt);
      ctx.lineTo(pt.x + 15 * sc, pt.y - 8 * sc + tilt);
      ctx.stroke();

      // Seats & handles on both ends
      ctx.fillStyle = '#facc15';
      ctx.fillRect(pt.x - 16 * sc, pt.y - 11 * sc - tilt, 4.5 * sc, 2.5 * sc);
      ctx.fillRect(pt.x + 11.5 * sc, pt.y - 11 * sc + tilt, 4.5 * sc, 2.5 * sc);

      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1.5 * sc;
      ctx.beginPath();
      ctx.moveTo(pt.x - 11 * sc, pt.y - 8 * sc - tilt * 0.75);
      ctx.lineTo(pt.x - 11 * sc, pt.y - 13 * sc - tilt * 0.75);
      ctx.moveTo(pt.x + 11 * sc, pt.y - 8 * sc + tilt * 0.75);
      ctx.lineTo(pt.x + 11 * sc, pt.y - 13 * sc + tilt * 0.75);
      ctx.stroke();
      break;
    }

    case 'playground_spring_rider': {
      const bounce = Math.sin(elapsed * 4.2 + wy) * 1.8 * sc;
      // Merry-go-round / spring base
      ctx.fillStyle = '#e0f2fe';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.4 * sc;
      ctx.beginPath();
      ctx.ellipse(pt.x, pt.y + 1 * sc, 15 * sc, 7.5 * sc, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Spiral spring
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 2.2 * sc;
      ctx.beginPath();
      ctx.moveTo(pt.x, pt.y);
      ctx.lineTo(pt.x - 2 * sc, pt.y - 4 * sc);
      ctx.lineTo(pt.x + 2 * sc, pt.y - 8 * sc);
      ctx.lineTo(pt.x, pt.y - 11 * sc + bounce);
      ctx.stroke();

      // Colorful pony/rider body
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.ellipse(pt.x, pt.y - 13 * sc + bounce, 7 * sc, 4 * sc, 0, 0, Math.PI * 2);
      ctx.arc(pt.x + 5.5 * sc, pt.y - 18 * sc + bounce, 3.5 * sc, 0, Math.PI * 2);
      ctx.fill();
      // Red saddle
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(pt.x - 3 * sc, pt.y - 16 * sc + bounce, 5 * sc, 2.5 * sc);
      break;
    }

    case 'playground_combo_castle': {
      // Multi-tower castle playground
      ctx.fillStyle = '#fef3c7';
      ctx.beginPath();
      ctx.ellipse(pt.x, pt.y + 2 * sc, 25 * sc, 12 * sc, 0, 0, Math.PI * 2);
      ctx.fill();

      // Left & Right towers
      [-10, 8].forEach((tx, idx) => {
        ctx.fillStyle = idx === 0 ? '#3b82f6' : '#10b981';
        ctx.fillRect(pt.x + tx * sc, pt.y - 22 * sc, 8 * sc, 20 * sc);
        // Castle roof
        ctx.fillStyle = idx === 0 ? '#ef4444' : '#f59e0b';
        ctx.beginPath();
        ctx.moveTo(pt.x + (tx + 4) * sc, pt.y - 31 * sc);
        ctx.lineTo(pt.x + (tx - 2) * sc, pt.y - 22 * sc);
        ctx.lineTo(pt.x + (tx + 10) * sc, pt.y - 22 * sc);
        ctx.closePath();
        ctx.fill();
      });

      // Bridge connecting towers
      ctx.fillStyle = '#b45309';
      ctx.fillRect(pt.x - 2 * sc, pt.y - 14 * sc, 10 * sc, 3.5 * sc);

      // Dual slides
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 4.5 * sc;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(pt.x - 9 * sc, pt.y - 12 * sc);
      ctx.lineTo(pt.x - 20 * sc, pt.y + 1 * sc);
      ctx.moveTo(pt.x + 15 * sc, pt.y - 12 * sc);
      ctx.lineTo(pt.x + 23 * sc, pt.y + 1 * sc);
      ctx.stroke();
      break;
    }

    // ---------------- LAPANGAN OLAHRAGA & HAMPARAN TERBUKA (4 MODEL) ----------------
    case 'court_basketball_full':
    case 'court_futsal_green':
    case 'court_badminton_pro':
    case 'open_green_field': {
      const halfW = 1.45 * (scale || 1.0);
      const halfH = 0.95 * (scale || 1.0);
      const cNW = project(wx - halfW, wy - halfH, 0.01);
      const cNE = project(wx + halfW, wy - halfH, 0.01);
      const cSE = project(wx + halfW, wy + halfH, 0.01);
      const cSW = project(wx - halfW, wy + halfH, 0.01);
      const midN = { x: (cNW.x + cNE.x) * 0.5, y: (cNW.y + cNE.y) * 0.5 };
      const midS = { x: (cSW.x + cSE.x) * 0.5, y: (cSW.y + cSE.y) * 0.5 };
      const midW = { x: (cNW.x + cSW.x) * 0.5, y: (cNW.y + cSW.y) * 0.5 };
      const midE = { x: (cNE.x + cSE.x) * 0.5, y: (cNE.y + cSE.y) * 0.5 };

      // Court surface polygon
      if (propModel === 'court_basketball_full') {
        ctx.fillStyle = '#c2410c'; // Terracotta orange basketball court
        ctx.strokeStyle = '#ffffff';
      } else if (propModel === 'court_futsal_green') {
        ctx.fillStyle = '#15803d'; // Deep futsal turf green
        ctx.strokeStyle = '#ffffff';
      } else if (propModel === 'court_badminton_pro') {
        ctx.fillStyle = '#0f766e'; // Tournament teal-green badminton mat
        ctx.strokeStyle = '#ffffff';
      } else {
        ctx.fillStyle = '#4ade80'; // Lush open green meadow field
        ctx.strokeStyle = '#16a34a';
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

      if (propModel === 'open_green_field') {
        // Inner lawn stripes & corner stones
        ctx.strokeStyle = 'rgba(22, 163, 74, 0.35)';
        ctx.lineWidth = 1.4 * sc;
        ctx.beginPath();
        ctx.moveTo(midN.x, midN.y);
        ctx.lineTo(midS.x, midS.y);
        ctx.stroke();
        [cNW, cNE, cSE, cSW].forEach((corner) => {
          ctx.fillStyle = '#e2e8f0';
          ctx.beginPath();
          ctx.arc(corner.x, corner.y, 2.8 * sc, 0, Math.PI * 2);
          ctx.fill();
        });
      } else {
        // Center line & center circle for courts
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.lineWidth = 1.4 * sc;
        ctx.beginPath();
        ctx.moveTo(midN.x, midN.y);
        ctx.lineTo(midS.x, midS.y);
        ctx.stroke();

        ctx.beginPath();
        ctx.ellipse(pt.x, pt.y, 10 * sc, 5 * sc, 0, 0, Math.PI * 2);
        if (propModel === 'court_basketball_full') {
          ctx.fillStyle = '#2563eb';
          ctx.fill();
        }
        ctx.stroke();
      }

      // 3D Fixtures per sport
      if (propModel === 'court_basketball_full') {
        // Left & Right Basketball Hoops (poles + backboards + orange rims)
        [midW, midE].forEach((hoopBase, idx) => {
          ctx.strokeStyle = '#334155';
          ctx.lineWidth = 2.4 * sc;
          ctx.beginPath();
          ctx.moveTo(hoopBase.x, hoopBase.y);
          ctx.lineTo(hoopBase.x, hoopBase.y - 22 * sc);
          ctx.stroke();

          // White backboard
          ctx.fillStyle = '#f8fafc';
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 1.1 * sc;
          ctx.fillRect(hoopBase.x - 4.5 * sc, hoopBase.y - 26 * sc, 9 * sc, 6 * sc);
          ctx.strokeRect(hoopBase.x - 4.5 * sc, hoopBase.y - 26 * sc, 9 * sc, 6 * sc);

          // Orange rim
          const rimOffset = idx === 0 ? 3 * sc : -3 * sc;
          ctx.strokeStyle = '#ea580c';
          ctx.lineWidth = 1.6 * sc;
          ctx.beginPath();
          ctx.ellipse(hoopBase.x + rimOffset, hoopBase.y - 20 * sc, 3.2 * sc, 1.6 * sc, 0, 0, Math.PI * 2);
          ctx.stroke();
        });
      } else if (propModel === 'court_futsal_green') {
        // Left & Right Futsal Goalposts
        [midW, midE].forEach((goalBase) => {
          ctx.strokeStyle = '#f8fafc';
          ctx.lineWidth = 2.2 * sc;
          ctx.beginPath();
          ctx.moveTo(goalBase.x - 5 * sc, goalBase.y + 3 * sc);
          ctx.lineTo(goalBase.x - 5 * sc, goalBase.y - 10 * sc);
          ctx.lineTo(goalBase.x + 5 * sc, goalBase.y - 13 * sc);
          ctx.lineTo(goalBase.x + 5 * sc, goalBase.y - 1 * sc);
          ctx.stroke();
        });
      } else if (propModel === 'court_badminton_pro') {
        // Center Badminton Net & Posts
        ctx.strokeStyle = '#f8fafc';
        ctx.lineWidth = 1.8 * sc;
        ctx.beginPath();
        ctx.moveTo(midN.x, midN.y);
        ctx.lineTo(midN.x, midN.y - 11 * sc);
        ctx.moveTo(midS.x, midS.y);
        ctx.lineTo(midS.x, midS.y - 11 * sc);
        ctx.stroke();

        // Net mesh between midN and midS
        ctx.fillStyle = 'rgba(255, 255, 255, 0.42)';
        ctx.beginPath();
        ctx.moveTo(midN.x, midN.y - 10 * sc);
        ctx.lineTo(midS.x, midS.y - 10 * sc);
        ctx.lineTo(midS.x, midS.y - 4 * sc);
        ctx.lineTo(midN.x, midN.y - 4 * sc);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5 * sc;
        ctx.beginPath();
        ctx.moveTo(midN.x, midN.y - 10 * sc);
        ctx.lineTo(midS.x, midS.y - 10 * sc);
        ctx.stroke();
      }
      break;
    }

    // ---------------- SEMAK & TANAMAN HIAS (5 MODEL) ----------------
    case 'shrub_flowering_azalea': {
      ctx.fillStyle = '#15803d';
      ctx.beginPath();
      ctx.arc(pt.x - 6 * sc, pt.y - 6 * sc, 7.5 * sc, 0, Math.PI * 2);
      ctx.arc(pt.x + 6 * sc, pt.y - 6 * sc, 7.5 * sc, 0, Math.PI * 2);
      ctx.arc(pt.x, pt.y - 10 * sc, 8.5 * sc, 0, Math.PI * 2);
      ctx.fill();
      // Pink & magenta azalea blossoms
      const flowers = [
        [-6, -8, '#f472b6'],
        [0, -13, '#ec4899'],
        [6, -7, '#f43f5e'],
        [-2, -5, '#fbcfe8'],
        [4, -11, '#f472b6'],
      ] as const;
      flowers.forEach(([fx, fy, fc]) => {
        ctx.fillStyle = fc;
        ctx.beginPath();
        ctx.arc(pt.x + fx * sc, pt.y + fy * sc, 2.2 * sc, 0, Math.PI * 2);
        ctx.fill();
      });
      break;
    }

    case 'shrub_topiary_spiral': {
      // Terracotta / stone planter pot
      ctx.fillStyle = '#b45309';
      ctx.fillRect(pt.x - 5.5 * sc, pt.y - 7 * sc, 11 * sc, 7 * sc);
      ctx.fillStyle = '#d97706';
      ctx.fillRect(pt.x - 6.5 * sc, pt.y - 8.5 * sc, 13 * sc, 2 * sc);
      // 3-tier manicured topiary spheres
      [
        { y: -13, r: 7, c: '#15803d' },
        { y: -21, r: 5.2, c: '#16a34a' },
        { y: -27.5, r: 3.5, c: '#22c55e' },
      ].forEach((tier) => {
        ctx.fillStyle = tier.c;
        ctx.beginPath();
        ctx.arc(pt.x + breeze * 0.3, pt.y + tier.y * sc, tier.r * sc, 0, Math.PI * 2);
        ctx.fill();
      });
      break;
    }

    case 'plant_monstera_pot': {
      // Ceramic pot
      ctx.fillStyle = '#f8fafc';
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1 * sc;
      ctx.beginPath();
      ctx.roundRect(pt.x - 5 * sc, pt.y - 8 * sc, 10 * sc, 8 * sc, 2 * sc);
      ctx.fill();
      ctx.stroke();

      // Broad tropical monstera leaves
      const leaves = [
        [-8, -15, -0.5],
        [8, -15, 0.5],
        [-4, -20, -0.2],
        [4, -20, 0.2],
        [0, -23, 0],
      ];
      leaves.forEach(([lx, ly, rot], idx) => {
        ctx.fillStyle = idx % 2 === 0 ? '#16a34a' : '#15803d';
        ctx.beginPath();
        ctx.ellipse(
          pt.x + lx * sc + breeze * 0.4,
          pt.y + ly * sc,
          4.5 * sc,
          2.6 * sc,
          rot,
          0,
          Math.PI * 2
        );
        ctx.fill();
      });
      break;
    }

    case 'plant_flower_bed_trio': {
      // Wooden planter box
      ctx.fillStyle = '#78350f';
      ctx.beginPath();
      ctx.roundRect(pt.x - 14 * sc, pt.y - 6 * sc, 28 * sc, 6.5 * sc, 2 * sc);
      ctx.fill();
      // Rich soil & foliage
      ctx.fillStyle = '#166534';
      ctx.fillRect(pt.x - 12.5 * sc, pt.y - 8 * sc, 25 * sc, 3 * sc);
      // Colorful flower row
      const bedColors = ['#facc15', '#f43f5e', '#a855f7', '#38bdf8', '#fb923c'];
      bedColors.forEach((col, i) => {
        const fx = pt.x + (-10 + i * 5) * sc;
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.arc(fx + breeze * 0.3, pt.y - 10 * sc, 2.8 * sc, 0, Math.PI * 2);
        ctx.fill();
      });
      break;
    }

    case 'shrub_bamboo_zen': {
      // Zen stones at base
      ctx.fillStyle = '#94a3b8';
      ctx.beginPath();
      ctx.arc(pt.x - 5 * sc, pt.y - 2 * sc, 3.5 * sc, 0, Math.PI * 2);
      ctx.arc(pt.x + 5 * sc, pt.y - 1.5 * sc, 3 * sc, 0, Math.PI * 2);
      ctx.fill();
      // 4 Green bamboo stalks
      [-6, -2, 2, 6].forEach((bx, i) => {
        const h = (24 + (i % 2) * 5) * sc;
        ctx.strokeStyle = '#16a34a';
        ctx.lineWidth = 2.4 * sc;
        ctx.beginPath();
        ctx.moveTo(pt.x + bx * sc, pt.y);
        ctx.lineTo(pt.x + bx * sc + breeze * 0.6, pt.y - h);
        ctx.stroke();

        // Leaf tufts
        ctx.fillStyle = '#4ade80';
        ctx.beginPath();
        ctx.ellipse(
          pt.x + (bx + 2.5) * sc + breeze * 0.6,
          pt.y - h + 3 * sc,
          4 * sc,
          1.6 * sc,
          0.3,
          0,
          Math.PI * 2
        );
        ctx.fill();
      });
      break;
    }

    // ---------------- KOLAM, AIR MANCUR & ELEMEN AIR (4 MODEL) ----------------
    case 'water_fountain_tiered': {
      // Outer marble basin
      ctx.fillStyle = '#cbd5e1';
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1.6 * sc;
      ctx.beginPath();
      ctx.ellipse(pt.x, pt.y, 19 * sc, 9.5 * sc, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Sparkling blue water pool
      ctx.fillStyle = '#0ea5e9';
      ctx.beginPath();
      ctx.ellipse(pt.x, pt.y - 1 * sc, 16.5 * sc, 8 * sc, 0, 0, Math.PI * 2);
      ctx.fill();

      // 3-tier pedestal
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(pt.x - 3 * sc, pt.y - 22 * sc, 6 * sc, 21 * sc);
      ctx.beginPath();
      ctx.ellipse(pt.x, pt.y - 10 * sc, 10 * sc, 4.5 * sc, 0, 0, Math.PI * 2);
      ctx.ellipse(pt.x, pt.y - 18 * sc, 6.5 * sc, 3 * sc, 0, 0, Math.PI * 2);
      ctx.fill();

      // Animated water arcs spraying from top
      const sprayH = (26 + Math.sin(elapsed * 8) * 2.5) * sc;
      ctx.strokeStyle = '#bae6fd';
      ctx.lineWidth = 1.6 * sc;
      [-8, -4, 4, 8].forEach((sx) => {
        ctx.beginPath();
        ctx.moveTo(pt.x, pt.y - 22 * sc);
        ctx.quadraticCurveTo(pt.x + sx * 0.6 * sc, pt.y - sprayH, pt.x + sx * sc, pt.y - 6 * sc);
        ctx.stroke();
      });
      break;
    }

    case 'water_koi_pond_lotus': {
      // Natural stone rim
      ctx.fillStyle = '#64748b';
      ctx.beginPath();
      ctx.ellipse(pt.x, pt.y, 21 * sc, 10.5 * sc, 0, 0, Math.PI * 2);
      ctx.fill();

      // Clear aqua pond water
      ctx.fillStyle = '#0284c7';
      ctx.beginPath();
      ctx.ellipse(pt.x, pt.y - 0.5 * sc, 18.5 * sc, 9 * sc, 0, 0, Math.PI * 2);
      ctx.fill();

      // Swimming orange/white Koi fish
      const koiAng = elapsed * 1.4;
      const kx = pt.x + Math.cos(koiAng) * 8 * sc;
      const ky = pt.y - 1 * sc + Math.sin(koiAng) * 3.8 * sc;
      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.ellipse(kx, ky, 3.2 * sc, 1.5 * sc, koiAng + Math.PI / 2, 0, Math.PI * 2);
      ctx.fill();

      // Green lotus pads & pink lotus flower
      [
        [-7, -2],
        [6, 2],
        [2, -4],
      ].forEach(([lx, ly], idx) => {
        ctx.fillStyle = '#16a34a';
        ctx.beginPath();
        ctx.ellipse(pt.x + lx * sc, pt.y + ly * sc, 3.8 * sc, 2 * sc, 0, 0, Math.PI * 2);
        ctx.fill();
        if (idx === 0) {
          ctx.fillStyle = '#f472b6';
          ctx.beginPath();
          ctx.arc(pt.x + lx * sc, pt.y + (ly - 1.5) * sc, 2.1 * sc, 0, Math.PI * 2);
          ctx.fill();
        }
      });
      break;
    }

    case 'water_mini_waterfall': {
      // Bottom pool
      ctx.fillStyle = '#0284c7';
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 2 * sc;
      ctx.beginPath();
      ctx.ellipse(pt.x, pt.y + 1 * sc, 18 * sc, 8.5 * sc, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Stacked rock cliff at back
      ctx.fillStyle = '#475569';
      ctx.beginPath();
      ctx.arc(pt.x - 6 * sc, pt.y - 12 * sc, 8 * sc, 0, Math.PI * 2);
      ctx.arc(pt.x + 6 * sc, pt.y - 11 * sc, 7.5 * sc, 0, Math.PI * 2);
      ctx.arc(pt.x, pt.y - 18 * sc, 8.5 * sc, 0, Math.PI * 2);
      ctx.fill();

      // Cascading water stream
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(pt.x - 4.5 * sc, pt.y - 20 * sc, 9 * sc, 19 * sc);
      // Animated white foam lines
      const foamOffset = (elapsed * 18) % 16;
      ctx.strokeStyle = '#e0f2fe';
      ctx.lineWidth = 1.4 * sc;
      ctx.beginPath();
      ctx.moveTo(pt.x - 3 * sc, pt.y - (18 - foamOffset) * sc);
      ctx.lineTo(pt.x + 3 * sc, pt.y - (18 - foamOffset) * sc);
      ctx.stroke();
      break;
    }

    case 'water_dancing_jets': {
      // Modern plaza circular pad
      ctx.fillStyle = '#1e293b';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5 * sc;
      ctx.beginPath();
      ctx.ellipse(pt.x, pt.y, 17 * sc, 8.5 * sc, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // 5 Dancing water jets with staggered heights
      [-10, -5, 0, 5, 10].forEach((jx, idx) => {
        const jh = (10 + Math.abs(Math.sin(elapsed * 4.5 + idx * 0.9)) * 16) * sc;
        ctx.strokeStyle = idx % 2 === 0 ? '#7dd3fc' : '#e0f2fe';
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
// 5. CUSTOM ANIMALS + ACTIVITY & TIME CYCLES
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
  // 1. Check Time Cycle (Diurnal vs Nocturnal vs All Day)
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
  const phaseSlot = Math.floor(phaseTime / cycleLen) % 3; // 0: move, 1: feed/graze, 2: move/play
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

  // Default: 'graze_wander' (Natural cycle: Walk -> Graze/Feed -> Rest)
  if (phaseSlot === 1) {
    // Feeding / Grazing at current spot
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
      ? Math.abs(Math.sin(elapsedSec * 7.5)) * 4.5 * sc
      : 0;
  const stepLeg = pose.isMoving ? Math.sin(elapsedSec * 9.0) * 2.2 * sc : 0;
  const headGraze = pose.isFeeding ? Math.abs(Math.sin(elapsedSec * 4.5)) * 2.8 * sc : 0;

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
  ctx.ellipse(pt.x, pt.y + 1.5 * sc, 7.5 * sc, 3.5 * sc, 0, 0, Math.PI * 2);
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
      // Legs
      ctx.strokeStyle = '#451a03';
      ctx.lineWidth = 1.4 * sc;
      ctx.beginPath();
      ctx.moveTo(-4 * sc, -4 * sc);
      ctx.lineTo(-4 * sc - stepLeg, 1 * sc);
      ctx.moveTo(4 * sc, -4 * sc);
      ctx.lineTo(4 * sc + stepLeg, 1 * sc);
      ctx.stroke();
      // Body
      ctx.fillStyle = coat;
      ctx.beginPath();
      ctx.ellipse(0, -6.5 * sc, 6.5 * sc, 4 * sc, 0, 0, Math.PI * 2);
      ctx.fill();
      // Neck & Head
      ctx.beginPath();
      ctx.arc(5.5 * sc, -10.5 * sc + headGraze, 2.8 * sc, 0, Math.PI * 2);
      ctx.fill();
      // Antlers for stag
      if (animal.species === 'deer_stag') {
        ctx.strokeStyle = '#fde68a';
        ctx.lineWidth = 1.2 * sc;
        ctx.beginPath();
        ctx.moveTo(5 * sc, -12.5 * sc + headGraze);
        ctx.lineTo(3.5 * sc, -17 * sc + headGraze);
        ctx.moveTo(5.8 * sc, -12.5 * sc + headGraze);
        ctx.lineTo(7.5 * sc, -16.5 * sc + headGraze);
        ctx.stroke();
      }
      break;
    }

    case 'rabbit': {
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.ellipse(0, -4.5 * sc, 4.8 * sc, 3.4 * sc, 0, 0, Math.PI * 2);
      ctx.arc(4 * sc, -6.5 * sc + headGraze * 0.6, 2.5 * sc, 0, Math.PI * 2);
      ctx.fill();
      // Long ears
      ctx.fillStyle = '#fbcfe8';
      ctx.beginPath();
      ctx.ellipse(3.5 * sc, -10.5 * sc + headGraze * 0.6, 1 * sc, 3 * sc, -0.2, 0, Math.PI * 2);
      ctx.ellipse(4.8 * sc, -10.2 * sc + headGraze * 0.6, 1 * sc, 2.8 * sc, 0.15, 0, Math.PI * 2);
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
      // Bushy tail
      ctx.fillStyle = shadeHex(bodyCol, -15);
      ctx.beginPath();
      ctx.ellipse(-5.5 * sc, -6.5 * sc, 4.2 * sc, 2.2 * sc, -0.6, 0, Math.PI * 2);
      ctx.fill();
      // Body & head
      ctx.fillStyle = bodyCol;
      ctx.beginPath();
      ctx.ellipse(0, -4.8 * sc, 5.2 * sc, 3.2 * sc, 0, 0, Math.PI * 2);
      ctx.arc(4.5 * sc, -7 * sc + headGraze * 0.6, 2.6 * sc, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 'swan':
    case 'ground_bird': {
      const birdCol = animal.species === 'swan' ? '#ffffff' : '#38bdf8';
      ctx.fillStyle = birdCol;
      ctx.beginPath();
      ctx.ellipse(0, -4.5 * sc, 5 * sc, 3.2 * sc, 0, 0, Math.PI * 2);
      ctx.arc(4.2 * sc, -8 * sc + headGraze * 0.5, 2.1 * sc, 0, Math.PI * 2);
      ctx.fill();
      // Beak
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.moveTo(6 * sc, -8.5 * sc + headGraze * 0.5);
      ctx.lineTo(8.5 * sc, -7.8 * sc + headGraze * 0.5);
      ctx.lineTo(6 * sc, -7.2 * sc + headGraze * 0.5);
      ctx.closePath();
      ctx.fill();
      break;
    }

    case 'butterfly_flock':
    default: {
      const colors = ['#f472b6', '#38bdf8', '#fbbf24'];
      colors.forEach((col, idx) => {
        const bx = Math.cos(elapsedSec * 3 + idx * 2.1) * 6 * sc;
        const by = -12 * sc + Math.sin(elapsedSec * 4.5 + idx) * 4 * sc;
        const wing = Math.abs(Math.sin(elapsedSec * 12 + idx)) * 3.5 * sc;
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.ellipse(bx - 1.5 * sc, by, wing, 2.2 * sc, 0.3, 0, Math.PI * 2);
        ctx.ellipse(bx + 1.5 * sc, by, wing, 2.2 * sc, -0.3, 0, Math.PI * 2);
        ctx.fill();
      });
      break;
    }
  }

  ctx.restore();

  // Floating Animal Name & Cycle Badge when selected in Studio or sleeping
  if (isSelectedInStudio || pose.isSleeping) {
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
    // 16 Jenis Tanah & Paving dari Gambar Referensi
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
  ctx.fillStyle = fill;
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  ctx.moveTo(pN.x, pN.y);
  ctx.lineTo(pE.x, pE.y);
  ctx.lineTo(pS.x, pS.y);
  ctx.lineTo(pW.x, pW.y);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Detail markings per terrain type
  if (terrainType === 'road_asphalt') {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(cx - (pE.x - pW.x) * 0.14, cy - (pS.y - pN.y) * 0.14);
    ctx.lineTo(cx + (pE.x - pW.x) * 0.14, cy + (pS.y - pN.y) * 0.14);
    ctx.stroke();
  } else if (terrainType === 'road_cobble') {
    ctx.fillStyle = isNight ? '#64748b' : '#cbd5e1';
    ctx.beginPath();
    ctx.arc(cx - 4, cy - 1, 2.2, 0, Math.PI * 2);
    ctx.arc(cx + 4, cy + 1, 2.2, 0, Math.PI * 2);
    ctx.fill();
  } else if (terrainType === 'flower_garden') {
    const cols = ['#f43f5e', '#facc15', '#ec4899', '#38bdf8'];
    cols.forEach((c, i) => {
      const ang = (i / 4) * Math.PI * 2;
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.arc(cx + Math.cos(ang) * 5.5, cy + Math.sin(ang) * 2.8, 1.8, 0, Math.PI * 2);
      ctx.fill();
    });
  } else if (terrainType === 'water_pond') {
    const rWave = 3.5 + Math.sin(elapsedSec * 3.2) * 1.5;
    ctx.strokeStyle = 'rgba(224, 242, 254, 0.65)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rWave * 1.8, rWave * 0.9, 0, 0, Math.PI * 2);
    ctx.stroke();
  } else if (
    terrainType === 'img_paving_herringbone_red' ||
    terrainType === 'img_brick_checker_red' ||
    terrainType === 'img_paving_lattice_red'
  ) {
    // Alternating grey/cream & red brick pattern
    ctx.fillStyle = '#c8c6bd';
    ctx.fillRect(cx - 6, cy - 2.5, 4.5, 2.5);
    ctx.fillRect(cx + 1.5, cy + 0.5, 4.5, 2.5);
    ctx.fillRect(cx - 2, cy - 4, 4, 2);
  } else if (
    terrainType === 'img_paving_basketweave_brown' ||
    terrainType === 'img_wood_plank_terracotta' ||
    terrainType === 'img_brick_classic_orange'
  ) {
    // Terracotta / orange brick & wood plank joints
    ctx.fillStyle = '#d48236';
    ctx.fillRect(cx - 6.5, cy - 2, 5, 2.5);
    ctx.fillRect(cx + 1.5, cy - 2, 5, 2.5);
    ctx.strokeStyle = 'rgba(69, 26, 3, 0.55)';
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.moveTo((pN.x + pW.x) * 0.5, (pN.y + pW.y) * 0.5);
    ctx.lineTo((pE.x + pS.x) * 0.5, (pE.y + pS.y) * 0.5);
    ctx.stroke();
  } else if (
    terrainType === 'img_paving_herringbone_grey' ||
    terrainType === 'img_paving_parquet_taupe' ||
    terrainType === 'img_brick_running_pastel'
  ) {
    // Interlocking stone / pastel brick blocks
    ctx.fillStyle = terrainType === 'img_brick_running_pastel' ? '#93a2ad' : '#d6d3cd';
    ctx.fillRect(cx - 5.5, cy - 2.5, 4.5, 2.2);
    ctx.fillStyle = '#e5dccb';
    ctx.fillRect(cx + 1, cy + 0.5, 4.5, 2.2);
  } else if (terrainType === 'img_paving_hex_blue') {
    // Blue hexagon & brown star/triangle mosaic
    ctx.fillStyle = '#9db7db';
    ctx.beginPath();
    ctx.arc(cx - 4, cy, 2.8, 0, Math.PI * 2);
    ctx.arc(cx + 4, cy, 2.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#8b6543';
    ctx.beginPath();
    ctx.arc(cx, cy - 2.5, 1.6, 0, Math.PI * 2);
    ctx.arc(cx, cy + 2.5, 1.6, 0, Math.PI * 2);
    ctx.fill();
  } else if (
    terrainType === 'img_stone_river_grey' ||
    terrainType === 'img_stone_pebble_cream' ||
    terrainType === 'img_stone_flagstone_brown' ||
    terrainType === 'img_cobble_rounded_cream'
  ) {
    // River pebbles, flagstones, or rounded cream cobblestones
    const stoneCol1 =
      terrainType === 'img_stone_river_grey'
        ? '#9ca3af'
        : terrainType === 'img_stone_pebble_cream'
        ? '#c7b897'
        : terrainType === 'img_cobble_rounded_cream'
        ? '#dfd1bd'
        : '#d3bd97';
    const stoneCol2 =
      terrainType === 'img_stone_river_grey'
        ? '#a89f81'
        : terrainType === 'img_stone_pebble_cream'
        ? '#988f7a'
        : '#bda07e';
    ctx.fillStyle = stoneCol1;
    ctx.beginPath();
    ctx.ellipse(cx - 4.5, cy - 1, 3.6, 2.1, 0.2, 0, Math.PI * 2);
    ctx.ellipse(cx + 4.2, cy + 1.2, 3.5, 2.0, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = stoneCol2;
    ctx.beginPath();
    ctx.ellipse(cx + 0.5, cy - 2.5, 2.8, 1.6, 0, 0, Math.PI * 2);
    ctx.ellipse(cx - 0.5, cy + 2.5, 2.8, 1.6, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (terrainType === 'img_tile_dotted_grey') {
    // Grey grid with cream dots at intersections
    ctx.fillStyle = '#e7dec8';
    [
      [-4.5, -1.5],
      [4.5, -1.5],
      [0, 2],
    ].forEach(([dx, dy]) => {
      ctx.beginPath();
      ctx.arc(cx + dx, cy + dy, 2.0, 0, Math.PI * 2);
      ctx.fill();
    });
  } else if (terrainType === 'img_tile_diamond_gold') {
    // Golden diamond tiles
    ctx.fillStyle = '#c8b27c';
    ctx.beginPath();
    ctx.moveTo(cx, cy - 3.5);
    ctx.lineTo(cx + 6, cy);
    ctx.lineTo(cx, cy + 3.5);
    ctx.lineTo(cx - 6, cy);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

// ============================================================================
// 7. CUSTOM FENCES 3D RENDERER
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
    // Leafy green hedge fence
    const steps = Math.max(3, Math.round(len * 4));
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const hx = p1.x + (p2.x - p1.x) * t;
      const hy = p1.y + (p2.y - p1.y) * t;
      ctx.fillStyle = i % 2 === 0 ? '#15803d' : '#16a34a';
      ctx.beginPath();
      ctx.arc(hx, hy - 6 * sc, 6.5 * sc, 0, Math.PI * 2);
      ctx.fill();
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

    // Top and bottom rails
    ctx.strokeStyle = railCol;
    ctx.lineWidth = fence.fenceModel === 'fence_stone_brick' ? 5.5 * sc : 2.2 * sc;
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y - 9 * sc);
    ctx.lineTo(p2.x, p2.y - 9 * sc);
    ctx.moveTo(p1.x, p1.y - 4 * sc);
    ctx.lineTo(p2.x, p2.y - 4 * sc);
    ctx.stroke();

    // Posts along segment
    const postCount = Math.max(2, Math.round(len * 2) + 1);
    for (let i = 0; i < postCount; i++) {
      const t = i / (postCount - 1);
      const px = p1.x + (p2.x - p1.x) * t;
      const py = p1.y + (p2.y - p1.y) * t;
      ctx.fillStyle = postCol;
      ctx.fillRect(px - 1.8 * sc, py - 13 * sc, 3.6 * sc, 13 * sc);
      if (fence.fenceModel === 'fence_iron_gold') {
        ctx.fillStyle = '#fde047';
        ctx.beginPath();
        ctx.arc(px, py - 14 * sc, 2 * sc, 0, Math.PI * 2);
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

