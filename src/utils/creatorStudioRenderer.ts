import {
  CreatorBuildingItem,
  CreatorNpcConfig,
  CreatorPropItem,
  CreatorAnimalItem,
  CreatorTerrainType,
  CreatorTerrainTile,
  CreatorFenceItem,
} from '../types/index.ts';

type ProjectFn = (wx: number, wy: number, wz: number) => { x: number; y: number };

// ============================================================================
// INTERACTIVE AVATAR ACTIONS FOR ALL 32 PROP MODELS (POHON & TAMAN)
// ============================================================================
export interface PropAvatarActionOption {
  id: string;
  label: string;
  icon: string;
  speechText: string;
  toastText: string;
  xpReward: number;
  emoteType: 'sit' | 'swing' | 'cheer' | 'sport' | 'warm' | 'care' | 'water';
}

export interface CreatorPropInteractionState {
  propId: string;
  actionId: string;
  emoteType: 'sit' | 'swing' | 'cheer' | 'sport' | 'warm' | 'care' | 'water';
  startTime: number;
  durationMs: number;
}

export interface CustomSwingSeatMetric {
  anchorX: number;
  anchorY: number;
  seatX: number;
  seatY: number;
  shadowX: number;
  shadowY: number;
  shadowScale: number;
  isOccupied: boolean;
  sway: number;
}

export interface CustomPropRideMetrics {
  kind: 'swing' | 'seesaw' | 'spring' | 'slide' | 'bench' | 'none';
  swingLeft?: CustomSwingSeatMetric;
  swingRight?: CustomSwingSeatMetric;
  riderSeatX?: number;
  riderSeatY?: number;
  riderHandX?: number;
  riderHandY?: number;
  tiltOrBounce?: number;
  rockX?: number;
  slideAvatarX?: number;
  slideAvatarY?: number;
  slidePhase?: 'climb' | 'top_cheer' | 'slide_down' | 'done';
  slideProgress?: number;
}

export function computeCustomPropSwingAndRideMetrics(
  prop: CreatorPropItem,
  project: ProjectFn,
  tileW: number,
  now: number,
  activeInteraction?: CreatorPropInteractionState | null,
  occupiedSeatIds?: string[]
): CustomPropRideMetrics {
  const { wx, wy, propModel, propCategory, scale = 1.0 } = prop;
  const sc = Math.max(0.5, Math.min(2.2, scale)) * (tileW / 38);
  const pt = project(wx, wy, 0);
  const elapsed = now * 0.001;
  const isInteractingThisProp = Boolean(
    activeInteraction &&
      activeInteraction.propId === prop.id &&
      now < activeInteraction.startTime + activeInteraction.durationMs
  );

  // 1. SWINGS (swing_builtin_city, swing_wood_garden, swing_cyan_modern)
  if (propCategory === 'swing') {
    const leftId = `custom_swing:${prop.id}:left`;
    const rightId = `custom_swing:${prop.id}:right`;
    const leftOcc = Boolean(occupiedSeatIds?.includes(leftId));
    const rightOcc = Boolean(occupiedSeatIds?.includes(rightId));
    const isHighJoy =
      isInteractingThisProp && activeInteraction?.actionId === 'swing_high_joy';

    const buildSeat = (isLeft: boolean, isOccupied: boolean): CustomSwingSeatMetric => {
      const sxOffset =
        propModel === 'swing_builtin_city'
          ? isLeft
            ? -3.5 * sc
            : 3.5 * sc
          : isLeft
          ? -5.5 * sc
          : 5.5 * sc;
      const anchorX = pt.x + sxOffset;
      const anchorY =
        propModel === 'swing_builtin_city' ? pt.y - 16.2 * sc : pt.y - 24 * sc;
      const restSeatY =
        propModel === 'swing_builtin_city' ? pt.y - 6.0 * sc : pt.y - 8.5 * sc;

      const phaseOffset = isLeft ? 0 : 1.15;
      const freq = isOccupied || isInteractingThisProp ? (isHighJoy ? 4.3 : 3.4) : 1.8;
      const amp =
        isOccupied || isInteractingThisProp
          ? (isHighJoy ? 10.2 : 6.8) * sc
          : 1.15 * sc;
      const phase = elapsed * freq + wx * 0.7 + phaseOffset;
      const sway = Math.sin(phase) * amp;
      const lift =
        (1 - Math.cos(Math.sin(phase) * (isOccupied || isInteractingThisProp ? 0.52 : 0.1))) *
        (isHighJoy ? 5.2 : 3.2) *
        sc;

      const seatX = anchorX + sway;
      const seatY = restSeatY - lift;
      const shadowX = anchorX + sway * 0.92;
      const shadowY = pt.y + 1.8 * sc + sway * 0.18;
      const shadowScale = isOccupied ? Math.max(0.7, 1 - lift / (16 * sc)) : 0.85;

      return {
        anchorX,
        anchorY,
        seatX,
        seatY,
        shadowX,
        shadowY,
        shadowScale,
        isOccupied,
        sway,
      };
    };

    return {
      kind: 'swing',
      swingLeft: buildSeat(true, leftOcc || isInteractingThisProp),
      swingRight: buildSeat(false, rightOcc),
    };
  }

  // 2. SEESAW (playground_seesaw_dual)
  if (propModel === 'playground_seesaw_dual') {
    const isRiding =
      Boolean(occupiedSeatIds?.includes(`custom_seesaw:${prop.id}`)) ||
      isInteractingThisProp;
    const speed = isRiding ? 3.8 : 2.2;
    const amp = (isRiding ? 6.2 : 3.2) * sc;
    const tilt = Math.sin(elapsed * speed + wx) * amp;
    return {
      kind: 'seesaw',
      tiltOrBounce: tilt,
      riderSeatX: pt.x - 14.5 * sc,
      riderSeatY: pt.y - 11.2 * sc - tilt,
      riderHandX: pt.x - 11.5 * sc,
      riderHandY: pt.y - 13.5 * sc - tilt * 0.72,
    };
  }

  // 3. SPRING RIDER (playground_spring_rider)
  if (propModel === 'playground_spring_rider') {
    const isRiding =
      Boolean(occupiedSeatIds?.includes(`custom_spring:${prop.id}`)) ||
      isInteractingThisProp;
    const speed = isRiding ? 6.2 : 4.0;
    const bounce = Math.sin(elapsed * speed + wy) * (isRiding ? 3.4 : 1.8) * sc;
    const rock = Math.cos(elapsed * speed + wy) * (isRiding ? 3.8 : 1.2) * sc;
    return {
      kind: 'spring',
      tiltOrBounce: bounce,
      rockX: rock,
      riderSeatX: pt.x - 0.5 * sc + rock,
      riderSeatY: pt.y - 16.2 * sc + bounce,
      riderHandX: pt.x + 4.5 * sc + rock,
      riderHandY: pt.y - 21.5 * sc + bounce,
    };
  }

  // 4. SLIDES & CASTLE PLAYGROUND (playground_slide_colorful, playground_combo_castle)
  if (
    propModel === 'playground_slide_colorful' ||
    propModel === 'playground_combo_castle'
  ) {
    if (isInteractingThisProp && activeInteraction) {
      const ageSec = Math.max(0, (now - activeInteraction.startTime) * 0.001);
      const isCastle = propModel === 'playground_combo_castle';
      if (ageSec < 1.05) {
        // Phase 1: Climbing up the ladder steps
        const p = Math.min(1, ageSec / 1.05);
        const startX = pt.x + (isCastle ? -11 * sc : -14.5 * sc);
        const startY = pt.y;
        const topX = pt.x + (isCastle ? -6.5 * sc : -8.5 * sc);
        const topY = pt.y - (isCastle ? 18.5 * sc : 19.5 * sc);
        return {
          kind: 'slide',
          slidePhase: 'climb',
          slideProgress: p,
          slideAvatarX: startX + (topX - startX) * p,
          slideAvatarY: startY + (topY - startY) * p,
        };
      }
      if (ageSec < 1.55) {
        // Phase 2: Cheering at the top platform
        const p = (ageSec - 1.05) / 0.5;
        const topX = pt.x + (isCastle ? 10.5 * sc : -5.5 * sc);
        const topY = pt.y - (isCastle ? 16.5 * sc : 18.5 * sc);
        return {
          kind: 'slide',
          slidePhase: 'top_cheer',
          slideProgress: p,
          slideAvatarX: topX,
          slideAvatarY: topY - Math.abs(Math.sin(p * Math.PI * 2)) * 3 * sc,
        };
      }
      if (ageSec < 2.85) {
        // Phase 3: Sliding rapidly down the chute!
        const p = Math.min(1, (ageSec - 1.55) / 1.3);
        const easeP = p * p * (3 - 2 * p);
        const startX = pt.x + (isCastle ? 14 * sc : -4 * sc);
        const startY = pt.y - (isCastle ? 14 * sc : 17.5 * sc);
        const endX = pt.x + (isCastle ? 24 * sc : 16.5 * sc);
        const endY = pt.y + 1 * sc;
        return {
          kind: 'slide',
          slidePhase: 'slide_down',
          slideProgress: easeP,
          slideAvatarX: startX + (endX - startX) * easeP,
          slideAvatarY:
            startY + (endY - startY) * easeP - Math.sin(easeP * Math.PI) * 2.2 * sc,
        };
      }
    }
    return { kind: 'slide', slidePhase: 'done', slideProgress: 1 };
  }

  // 5. BENCHES (bench_*)
  if (propCategory === 'bench') {
    return {
      kind: 'bench',
      riderSeatX: pt.x - 3.2 * sc,
      riderSeatY: pt.y - 7.5 * sc,
    };
  }

  return { kind: 'none' };
}

export function getCreatorPropInteractiveActions(prop: CreatorPropItem): PropAvatarActionOption[] {
  const { propCategory, propModel, name } = prop;

  switch (propCategory) {
    case 'tree': {
      const harvestLabel =
        propModel === 'tree_oak_apple' || propModel === 'tree_builtin_city_emerald'
          ? 'Petik Buah Apel Segar'
          : propModel === 'tree_palm_tropical'
          ? 'Panen Kelapa Muda Segar'
          : propModel === 'tree_sakura_pink'
          ? 'Kumpulkan Kelopak Sakura'
          : propModel === 'tree_autumn_maple' || propModel === 'tree_builtin_city_autumn'
          ? 'Koleksi Daun Musim Gugur'
          : propModel === 'tree_pine_spruce' || propModel === 'tree_builtin_forest_pine'
          ? 'Ambil Biji Pinus Hutan'
          : 'Gantungkan Harapan di Pohon';
      const harvestIcon =
        propModel === 'tree_oak_apple' || propModel === 'tree_builtin_city_emerald'
          ? '🍎'
          : propModel === 'tree_palm_tropical'
          ? '🥥'
          : propModel === 'tree_sakura_pink'
          ? '🌸'
          : propModel === 'tree_autumn_maple' || propModel === 'tree_builtin_city_autumn'
          ? '🍂'
          : propModel === 'tree_pine_spruce' || propModel === 'tree_builtin_forest_pine'
          ? '🌲'
          : '🌿';
      return [
        {
          id: 'tree_shade_read',
          label: 'Berteduh & Baca Buku',
          icon: '📖',
          speechText: `📖 Duduk berteduh sambil membaca buku inspirasi di bawah ${name}...`,
          toastText: `📖 Berteduh & membaca buku di bawah ${name}`,
          xpReward: 2,
          emoteType: 'sit',
        },
        {
          id: 'tree_harvest',
          label: harvestLabel,
          icon: harvestIcon,
          speechText: `${harvestIcon} Wah segar sekali! Berhasil ${harvestLabel.toLowerCase()} dari ${name}!`,
          toastText: `${harvestIcon} ${harvestLabel} di ${name} (+3 XP)`,
          xpReward: 3,
          emoteType: 'cheer',
        },
        {
          id: 'tree_water_care',
          label: 'Siram & Rawat Pohon',
          icon: '🚿',
          speechText: `🚿 Menyiram dan memberi nutrisi pada ${name} agar Refleksia makin rindang!`,
          toastText: `🌱 Merawat kelestarian ${name} (+3 XP)`,
          xpReward: 3,
          emoteType: 'care',
        },
      ];
    }

    case 'bench': {
      return [
        {
          id: 'bench_sit_relax',
          label: 'Duduk Santai & Istirahat',
          icon: '🪑',
          speechText: `🪑 Duduk santai menikmati suasana kota di ${name}...`,
          toastText: `🪑 Duduk beristirahat di ${name}`,
          xpReward: 2,
          emoteType: 'sit',
        },
        {
          id: 'bench_picnic_snack',
          label: 'Santap Bekal & Minuman',
          icon: '🥐',
          speechText: `🥐🍹 Menikmati bekal roti hangat & minuman segar bersama warga di ${name}!`,
          toastText: `🥐 Menikmati bekal piknik di ${name} (+3 XP)`,
          xpReward: 3,
          emoteType: 'sit',
        },
        {
          id: 'bench_write_journal',
          label: 'Tulis Catatan & Ide',
          icon: '✍️',
          speechText: `✍️ Menulis ide kreatif dan refleksi harian di atas ${name}...`,
          toastText: `✍️ Menulis catatan refleksi di ${name} (+3 XP)`,
          xpReward: 3,
          emoteType: 'sit',
        },
      ];
    }

    case 'swing': {
      return [
        {
          id: 'swing_gentle',
          label: 'Duduk & Berayun Santai',
          icon: '🎠',
          speechText: `🎠 Berayun perlahan sambil menikmati semilir angin di ${name}...`,
          toastText: `🎠 Berayun santai di ${name}`,
          xpReward: 2,
          emoteType: 'swing',
        },
        {
          id: 'swing_high_joy',
          label: 'Ayunan Tinggi Gembira!',
          icon: '🤩',
          speechText: `🤩 Wuuuush! Berayun tinggi penuh semangat di ${name}!`,
          toastText: `🤩 Berayun tinggi gembira di ${name} (+3 XP)`,
          xpReward: 3,
          emoteType: 'swing',
        },
        {
          id: 'swing_chat_friend',
          label: 'Ngobrol Seru di Ayunan',
          icon: '💬',
          speechText: `💬 Ayo warga, duduk di kursi sebelah ${name} dan mengobrol bersama!`,
          toastText: `💬 Mengajak warga mengobrol di ${name} (+2 XP)`,
          xpReward: 2,
          emoteType: 'swing',
        },
      ];
    }

    case 'campfire': {
      return [
        {
          id: 'fire_warm_hands',
          label: 'Hangatkan Badan',
          icon: '🔥',
          speechText: `🔥 Menghangatkan tangan di dekat nyala ${name} yang nyaman...`,
          toastText: `🔥 Menghangatkan diri di ${name} (+2 XP)`,
          xpReward: 2,
          emoteType: 'warm',
        },
        {
          id: 'fire_roast_marshmallow',
          label: 'Bakar Marshmallow & Jagung',
          icon: '🍡',
          speechText: `🍡🌽 Memanggang marshmallow dan jagung bakar manis di atas ${name}!`,
          toastText: `🍡 Bakar marshmallow & jagung di ${name} (+3 XP)`,
          xpReward: 3,
          emoteType: 'cheer',
        },
        {
          id: 'fire_story_circle',
          label: 'Duduk & Cerita Malam Warga',
          icon: '🎸',
          speechText: `🎸🎶 Duduk melingkar berbagi cerita inspiratif di sekitar ${name}...`,
          toastText: `🎸 Berbagi cerita warga di ${name} (+3 XP)`,
          xpReward: 3,
          emoteType: 'sit',
        },
      ];
    }

    case 'playground': {
      const mainRideLabel =
        propModel === 'playground_slide_colorful'
          ? 'Meluncur dari Perosotan!'
          : propModel === 'playground_seesaw_dual'
          ? 'Main Jungkat-Jungkit Naik-Turun!'
          : propModel === 'playground_spring_rider'
          ? 'Tunggangi Kuda Pegas Membal!'
          : 'Jelajahi Menara & Jembatan Istana!';
      return [
        {
          id: 'play_ride_main',
          label: mainRideLabel,
          icon: '🛝',
          speechText: `🛝🎉 Seru sekali! ${mainRideLabel} di ${name}!`,
          toastText: `🛝 ${mainRideLabel} (+3 XP)`,
          xpReward: 3,
          emoteType: 'cheer',
        },
        {
          id: 'play_agility_game',
          label: 'Tantangan Ketangkasan Taman',
          icon: '🏅',
          speechText: `🏅 Melatih ketangkasan dan keseimbangan tubuh di wahana ${name}!`,
          toastText: `🏅 Tantangan ketangkasan di ${name} (+3 XP)`,
          xpReward: 3,
          emoteType: 'sport',
        },
        {
          id: 'play_sit_rest',
          label: 'Duduk Santai di Tepi Wahana',
          icon: '😊',
          speechText: `😊 Beristirahat sejenak sambil melihat keceriaan taman di ${name}...`,
          toastText: `😊 Bersantai di area ${name} (+2 XP)`,
          xpReward: 2,
          emoteType: 'sit',
        },
      ];
    }

    case 'sports_court': {
      const mainSportLabel =
        propModel === 'court_basketball_full'
          ? 'Tembakan Three-Point & Slam Dunk!'
          : propModel === 'court_futsal_green'
          ? 'Dribble & Tendangan Gol Futsal!'
          : propModel === 'court_badminton_pro'
          ? 'Jumping Smash Bulu Tangkis!'
          : 'Lari Sprint & Senam Kebugaran!';
      const sportIcon =
        propModel === 'court_basketball_full'
          ? '🏀'
          : propModel === 'court_futsal_green'
          ? '⚽'
          : propModel === 'court_badminton_pro'
          ? '🏸'
          : '🏃';
      return [
        {
          id: 'sport_score_action',
          label: mainSportLabel,
          icon: sportIcon,
          speechText: `${sportIcon}🔥 MASUK! ${mainSportLabel} di ${name}!`,
          toastText: `${sportIcon} ${mainSportLabel} (+4 XP Olahraga)`,
          xpReward: 4,
          emoteType: 'sport',
        },
        {
          id: 'sport_warmup',
          label: 'Pemanasan & Latihan Fisik',
          icon: '💪',
          speechText: `💪 Melakukan pemanasan dan latihan kebugaran tubuh di ${name}!`,
          toastText: `💪 Latihan fisik sehat di ${name} (+3 XP)`,
          xpReward: 3,
          emoteType: 'cheer',
        },
        {
          id: 'sport_friendly_match',
          label: 'Tanding Persahabatan Warga',
          icon: '🏆',
          speechText: `🏆 Ayo warga Refleksia, kita mulai pertandingan persahabatan sportif di ${name}!`,
          toastText: `🏆 Pertandingan sportif di ${name} (+4 XP)`,
          xpReward: 4,
          emoteType: 'sport',
        },
      ];
    }

    case 'shrub_plant': {
      return [
        {
          id: 'plant_water_prune',
          label: 'Siram & Pangkas Tanaman',
          icon: '🪴',
          speechText: `🪴 Menyiram dan merapikan daun ${name} agar taman kota tampak asri!`,
          toastText: `🪴 Merawat tanaman ${name} (+3 XP)`,
          xpReward: 3,
          emoteType: 'care',
        },
        {
          id: 'plant_botany_observe',
          label: 'Observasi Botani & Aroma Bunga',
          icon: '🔍',
          speechText: `🌺🔍 Mengamati keindahan tekstur daun dan menghirup kesegaran ${name}...`,
          toastText: `🔍 Observasi botani di ${name} (+3 XP)`,
          xpReward: 3,
          emoteType: 'cheer',
        },
        {
          id: 'plant_zen_relax',
          label: 'Duduk Meditasi Hijau',
          icon: '🧘',
          speechText: `🧘 Menenangkan pikiran di dekat keasrian ${name}...`,
          toastText: `🧘 Relaksasi hijau di dekat ${name} (+2 XP)`,
          xpReward: 2,
          emoteType: 'sit',
        },
      ];
    }

    case 'water_feature':
    default: {
      const feedLabel =
        propModel === 'water_koi_pond_lotus'
          ? 'Beri Makan Ikan Koi & Teratai'
          : propModel === 'water_mini_waterfall'
          ? 'Rasakan Embun Segar Air Terjun'
          : 'Buat Harapan Positif di Air Mancur';
      return [
        {
          id: 'water_main_interact',
          label: feedLabel,
          icon: '🪷',
          speechText: `🪷✨ ${feedLabel} di ${name}, suasana hati jadi damai dan jernih!`,
          toastText: `🪷 ${feedLabel} (+3 XP)`,
          xpReward: 3,
          emoteType: 'water',
        },
        {
          id: 'water_splash_play',
          label: 'Sentuh Gemericik Air Jernih',
          icon: '💦',
          speechText: `💦 Segarnya percikan air jernih di ${name}!`,
          toastText: `💦 Menikmati kesegaran air di ${name} (+2 XP)`,
          xpReward: 2,
          emoteType: 'cheer',
        },
        {
          id: 'water_sit_reflect',
          label: 'Duduk Tenang di Tepi Air',
          icon: '🧘‍♂️',
          speechText: `🧘‍♂️ Duduk merenung mendengarkan suara gemericik air ${name}...`,
          toastText: `🧘‍♂️ Refleksi tenang di tepi ${name} (+3 XP)`,
          xpReward: 3,
          emoteType: 'sit',
        },
      ];
    }
  }
}

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

  ctx.beginPath();
  ctx.moveTo(p00.x, p00.y);
  ctx.lineTo(p01.x, p01.y);
  ctx.lineTo(apex.x, apex.y);
  ctx.closePath();
  ctx.fillStyle = shadeHex(baseColor, -15);
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(p00.x, p00.y);
  ctx.lineTo(p10.x, p10.y);
  ctx.lineTo(apex.x, apex.y);
  ctx.closePath();
  ctx.fillStyle = shadeHex(baseColor, -5);
  ctx.fill();

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

  ctx.beginPath();
  ctx.moveTo(p11.x, p11.y);
  ctx.lineTo(p10.x, p10.y);
  ctx.lineTo(apex.x, apex.y);
  ctx.closePath();
  ctx.fillStyle = shadeHex(baseColor, -22);
  ctx.fill();
  ctx.stroke();
}

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

  ctx.fillStyle = 'rgba(253, 224, 71, 0.78)';
  ctx.beginPath();
  ctx.moveTo(dL.x + 1.5, dL.y - 1);
  ctx.lineTo(dR.x - 1.5, dR.y - 1);
  ctx.lineTo(dTR.x - 1.5, dTR.y + 1);
  ctx.lineTo(dTL.x + 1.5, dTL.y + 1);
  ctx.closePath();
  ctx.fill();

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
// 1. CUSTOM BUILDINGS 3D RENDERER (29 MODELS: 14 CREATOR + 15 BUILT-IN CITY MODELS)
// ============================================================================
export function drawCustomCreatorBuilding3D(
  ctx: CanvasRenderingContext2D,
  project: ProjectFn,
  tileW: number,
  building: CreatorBuildingItem,
  now: number,
  isHovered: boolean,
  isSelectedInStudio: boolean,
  isNearPlayer: boolean,
  overheadTagAlpha: number = 1.0
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

  // Two-tier Stone Courtyard Foundation Platform with Corner Shrubs & Lamps
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

  // 2. Model-specific Complex 3D Architecture
  switch (modelType) {
    case 'modern_tower':
    case 'builtin_pencakar_langit': {
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
      drawIsoPrism(
        ctx,
        project,
        wx,
        wy,
        0.41 * sc,
        0.64 * sc,
        0.64 * sc,
        1.15 * sc,
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
        1.52 * sc,
        6,
        3,
        'rgba(186, 230, 253, 0.85)',
        '#fef08a',
        now
      );
      drawIsoPrism(
        ctx,
        project,
        wx,
        wy,
        1.56 * sc,
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
        1.6 * sc,
        1.94 * sc,
        2,
        2,
        'rgba(224, 242, 254, 0.9)',
        '#fde047',
        now
      );
      const heliC = project(wx, wy, 1.99 * sc);
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 1.4 * sc;
      ctx.beginPath();
      ctx.ellipse(heliC.x, heliC.y, 10 * sc, 5 * sc, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.font = `900 ${Math.round(7 * sc)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText('H', heliC.x, heliC.y + 2 * sc);

      const spireTop = project(wx - 0.12 * sc, wy - 0.12 * sc, 2.42 * sc);
      const spireBase = project(wx - 0.12 * sc, wy - 0.12 * sc, 1.98 * sc);
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

    case 'builtin_balai_kota': {
      // Grand Classical City Hall with Golden Dome & Columns
      drawIsoPrism(
        ctx,
        project,
        wx,
        wy,
        0.09 * sc,
        0.86 * sc,
        0.76 * sc,
        0.64 * sc,
        '#f8fafc',
        '#e2e8f0',
        '#cbd5e1'
      );
      drawBuildingWindowGrid(
        ctx,
        project,
        wx,
        wy,
        0.86 * sc,
        0.76 * sc,
        0.16 * sc,
        0.65 * sc,
        2,
        4,
        '#38bdf8',
        '#fef08a',
        now
      );
      // 4 White Classical Columns at Front Portico
      [-0.3, -0.1, 0.1, 0.3].forEach((colX) => {
        drawIsoPrism(
          ctx,
          project,
          wx + colX * sc,
          wy + 0.4 * sc,
          0.09 * sc,
          0.06 * sc,
          0.06 * sc,
          0.58 * sc,
          '#ffffff',
          '#f1f5f9',
          '#cbd5e1'
        );
      });
      // Drum & Grand Golden Dome
      drawIsoPrism(
        ctx,
        project,
        wx,
        wy,
        0.73 * sc,
        0.52 * sc,
        0.52 * sc,
        0.2 * sc,
        '#fef3c7',
        '#fde68a',
        '#f59e0b'
      );
      const domeP = project(wx, wy, 0.93 * sc);
      ctx.beginPath();
      ctx.arc(domeP.x, domeP.y - 2 * sc, tileW * 0.28 * sc, Math.PI, 0);
      ctx.closePath();
      ctx.fillStyle = '#eab308';
      ctx.fill();
      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 1.6 * sc;
      ctx.stroke();
      // Spire finial
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 2 * sc;
      ctx.beginPath();
      ctx.moveTo(domeP.x, domeP.y - tileW * 0.28 * sc);
      ctx.lineTo(domeP.x, domeP.y - tileW * 0.42 * sc);
      ctx.stroke();
      drawBuildingEntrance(ctx, project, wx, wy, 0.76 * sc, 0.09 * sc, sc, '#eab308');
      break;
    }

    case 'builtin_masjid': {
      // Masjid Al-Hikmah with Emerald Green Dome & Tall Minaret
      drawIsoPrism(
        ctx,
        project,
        wx,
        wy,
        0.09 * sc,
        0.82 * sc,
        0.78 * sc,
        0.6 * sc,
        '#f0fdf4',
        '#dcfce7',
        '#bbf7d0'
      );
      drawBuildingWindowGrid(
        ctx,
        project,
        wx,
        wy,
        0.82 * sc,
        0.78 * sc,
        0.16 * sc,
        0.62 * sc,
        2,
        3,
        '#059669',
        '#fef08a',
        now
      );
      // Tall Minaret Tower on Right Corner
      drawIsoPrism(
        ctx,
        project,
        wx + 0.34 * sc,
        wy - 0.28 * sc,
        0.09 * sc,
        0.16 * sc,
        0.16 * sc,
        1.18 * sc,
        '#ffffff',
        '#e2e8f0',
        '#cbd5e1'
      );
      const minTop = project(wx + 0.34 * sc, wy - 0.28 * sc, 1.27 * sc);
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(minTop.x, minTop.y, 4.5 * sc, Math.PI, 0);
      ctx.fill();

      // Main Emerald Mosque Dome + Golden Crescent Finial
      const mDome = project(wx - 0.04 * sc, wy + 0.04 * sc, 0.69 * sc);
      ctx.beginPath();
      ctx.arc(mDome.x, mDome.y - 2 * sc, tileW * 0.31 * sc, Math.PI, 0);
      ctx.closePath();
      ctx.fillStyle = '#059669';
      ctx.fill();
      ctx.strokeStyle = '#34d399';
      ctx.lineWidth = 1.6 * sc;
      ctx.stroke();

      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(mDome.x, mDome.y - tileW * 0.36 * sc, 3 * sc, 0, Math.PI * 2);
      ctx.fill();

      drawBuildingEntrance(ctx, project, wx, wy, 0.78 * sc, 0.09 * sc, sc, '#059669');
      break;
    }

    case 'builtin_studio_onair': {
      // Studio ON AIR with Red-White Broadcast Lattice Tower
      drawIsoPrism(
        ctx,
        project,
        wx,
        wy,
        0.09 * sc,
        0.78 * sc,
        0.74 * sc,
        0.64 * sc,
        '#1e293b',
        '#334155',
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
        0.66 * sc,
        2,
        3,
        '#38bdf8',
        '#f43f5e',
        now
      );
      // Red-and-white Radio Antenna Tower on Roof
      const antBase = project(wx, wy, 0.73 * sc);
      const antTop = project(wx, wy, 1.55 * sc);
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2.6 * sc;
      ctx.beginPath();
      ctx.moveTo(antBase.x - 6 * sc, antBase.y);
      ctx.lineTo(antTop.x, antTop.y);
      ctx.lineTo(antBase.x + 6 * sc, antBase.y);
      ctx.stroke();
      // Pulsing Radio Wave Rings
      ctx.strokeStyle = `rgba(244, 63, 94, ${0.85 - pulse * 0.5})`;
      ctx.lineWidth = 1.4 * sc;
      ctx.beginPath();
      ctx.arc(antTop.x, antTop.y, (5 + pulse * 8) * sc, 0, Math.PI * 2);
      ctx.stroke();

      drawBuildingEntrance(ctx, project, wx, wy, 0.74 * sc, 0.09 * sc, sc, '#ef4444');
      break;
    }

    case 'builtin_perpustakaan':
    case 'builtin_bank_materi': {
      // Classical Blue Library / Bank Materi with Pillars & Pediment
      const wallTop = modelType === 'builtin_perpustakaan' ? '#dbeafe' : '#f1f5f9';
      const wallLeft = modelType === 'builtin_perpustakaan' ? '#93c5fd' : '#e2e8f0';
      const wallRight = modelType === 'builtin_perpustakaan' ? '#3b82f6' : '#94a3b8';
      const rCol = modelType === 'builtin_perpustakaan' ? '#1d4ed8' : '#0f766e';
      drawIsoPrism(
        ctx,
        project,
        wx,
        wy,
        0.09 * sc,
        0.84 * sc,
        0.74 * sc,
        0.62 * sc,
        wallTop,
        wallLeft,
        wallRight
      );
      drawBuildingWindowGrid(
        ctx,
        project,
        wx,
        wy,
        0.84 * sc,
        0.74 * sc,
        0.16 * sc,
        0.64 * sc,
        2,
        4,
        '#e0f2fe',
        '#fef08a',
        now
      );
      drawIsoPyramidRoof(
        ctx,
        project,
        wx,
        wy,
        0.71 * sc,
        0.92 * sc,
        0.82 * sc,
        0.36 * sc,
        rCol
      );
      drawBuildingEntrance(ctx, project, wx, wy, 0.74 * sc, 0.09 * sc, sc, rCol);
      break;
    }

    case 'builtin_pasar_prestasi':
    case 'builtin_kantor_pos':
    case 'builtin_taman_refleksi': {
      drawIsoPrism(
        ctx,
        project,
        wx,
        wy,
        0.09 * sc,
        0.8 * sc,
        0.74 * sc,
        0.58 * sc,
        shadeHex(accentColor, 35),
        shadeHex(accentColor, 15),
        shadeHex(accentColor, -15)
      );
      drawBuildingWindowGrid(
        ctx,
        project,
        wx,
        wy,
        0.8 * sc,
        0.74 * sc,
        0.16 * sc,
        0.6 * sc,
        2,
        3,
        '#ffffff',
        '#fef08a',
        now
      );
      drawIsoPyramidRoof(
        ctx,
        project,
        wx,
        wy,
        0.67 * sc,
        0.88 * sc,
        0.82 * sc,
        0.35 * sc,
        roofColor
      );
      // Iconic Rooftop Emblem (Trophy / Globe / Post Box)
      const topEmb = project(wx, wy, 1.08 * sc);
      ctx.fillStyle = modelType === 'builtin_taman_refleksi' ? '#38bdf8' : '#facc15';
      ctx.beginPath();
      ctx.arc(topEmb.x, topEmb.y, 5.5 * sc, 0, Math.PI * 2);
      ctx.fill();
      drawBuildingEntrance(ctx, project, wx, wy, 0.74 * sc, 0.09 * sc, sc, roofColor);
      break;
    }

    case 'builtin_bandara': {
      // Airport Terminal + Air Traffic Control Tower + Mini Jet on Apron
      drawIsoPrism(
        ctx,
        project,
        wx - 0.1 * sc,
        wy,
        0.09 * sc,
        0.68 * sc,
        0.68 * sc,
        0.48 * sc,
        '#e0f2fe',
        '#bae6fd',
        '#0284c7'
      );
      // Control Tower
      drawIsoPrism(
        ctx,
        project,
        wx + 0.25 * sc,
        wy - 0.22 * sc,
        0.09 * sc,
        0.22 * sc,
        0.22 * sc,
        1.15 * sc,
        '#f8fafc',
        '#cbd5e1',
        '#64748b'
      );
      drawIsoPrism(
        ctx,
        project,
        wx + 0.25 * sc,
        wy - 0.22 * sc,
        1.24 * sc,
        0.3 * sc,
        0.3 * sc,
        0.18 * sc,
        '#38bdf8',
        '#0ea5e9',
        '#0369a1'
      );
      // Mini White Jet Plane on Front Apron
      const jetP = project(wx + 0.15 * sc, wy + 0.32 * sc, 0.1 * sc);
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(jetP.x, jetP.y, 8 * sc, 2.8 * sc, -0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 2 * sc;
      ctx.beginPath();
      ctx.moveTo(jetP.x - 4 * sc, jetP.y - 4 * sc);
      ctx.lineTo(jetP.x + 4 * sc, jetP.y + 4 * sc);
      ctx.stroke();

      drawBuildingEntrance(ctx, project, wx - 0.1 * sc, wy, 0.68 * sc, 0.09 * sc, sc, '#0284c7');
      break;
    }

    case 'builtin_beringin_rumah_pohon': {
      // Giant Sacred Banyan with Treehouse Deck in Canopy
      drawIsoPrism(
        ctx,
        project,
        wx,
        wy,
        0.09 * sc,
        0.26 * sc,
        0.26 * sc,
        0.68 * sc,
        '#78350f',
        '#713f12',
        '#451a03'
      );
      const bCanopy = project(wx, wy, 0.95 * sc);
      ctx.fillStyle = '#14532d';
      ctx.beginPath();
      ctx.ellipse(bCanopy.x, bCanopy.y, 26 * sc, 14 * sc, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#16a34a';
      ctx.beginPath();
      ctx.ellipse(bCanopy.x, bCanopy.y - 6 * sc, 22 * sc, 12 * sc, 0, 0, Math.PI * 2);
      ctx.fill();
      // Wooden Treehouse Cabin perched in canopy
      drawIsoPrism(
        ctx,
        project,
        wx + 0.12 * sc,
        wy + 0.12 * sc,
        0.68 * sc,
        0.38 * sc,
        0.34 * sc,
        0.28 * sc,
        '#fde68a',
        '#d97706',
        '#92400e'
      );
      drawIsoPyramidRoof(
        ctx,
        project,
        wx + 0.12 * sc,
        wy + 0.12 * sc,
        0.96 * sc,
        0.44 * sc,
        0.4 * sc,
        0.2 * sc,
        '#b45309'
      );
      break;
    }

    case 'innovation_lab':
    case 'builtin_lab_dkv': {
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

      const domeBase = project(wx + 0.06 * sc, wy - 0.04 * sc, 0.71 * sc);
      ctx.beginPath();
      ctx.arc(domeBase.x, domeBase.y - tileW * 0.06 * sc, tileW * 0.25 * sc, Math.PI, 0);
      ctx.closePath();
      ctx.fillStyle = roofColor;
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.6 * sc;
      ctx.stroke();

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
      const clk = project(wx, wy + 0.14 * sc, 1.12 * sc);
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 1.2 * sc;
      ctx.beginPath();
      ctx.arc(clk.x, clk.y, 4.5 * sc, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

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
      const bb = project(wx, wy, 1.08 * sc);
      ctx.fillStyle = '#090d16';
      ctx.strokeStyle = accentColor;
      ctx.lineWidth = 2 * sc;
      ctx.beginPath();
      ctx.roundRect(bb.x - 24 * sc, bb.y - 18 * sc, 48 * sc, 26 * sc, 4 * sc);
      ctx.fill();
      ctx.stroke();

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

      drawBuildingEntrance(ctx, project, wx, wy, 0.6 * sc, 0.09 * sc, sc, accentColor);
      break;
    }

    case 'arcade_arena': {
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
      break;
    }

    case 'ferris_park': {
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

      ctx.beginPath();
      ctx.moveTo(baseL.x, baseL.y);
      ctx.lineTo(hub.x, hub.y);
      ctx.lineTo(baseR.x, baseR.y);
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 3.2 * sc;
      ctx.stroke();

      const wheelR = tileW * 0.44 * sc;
      ctx.beginPath();
      ctx.arc(hub.x, hub.y, wheelR, 0, Math.PI * 2);
      ctx.strokeStyle = accentColor;
      ctx.lineWidth = 3 * sc;
      ctx.stroke();

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

        ctx.fillStyle = cabinColors[i % cabinColors.length];
        ctx.beginPath();
        ctx.roundRect(cx - 4.2 * sc, cy - 1 * sc, 8.4 * sc, 7 * sc, 2.5 * sc);
        ctx.fill();
      }
      break;
    }

    case 'esports_dome': {
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
      drawBuildingEntrance(ctx, project, wx, wy, 0.86 * sc, 0.09 * sc, sc, accentColor);
      break;
    }

    case 'open_cafe':
    case 'builtin_lapak_cafe': {
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

      const patioP = project(wx + 0.26 * sc, wy + 0.34 * sc, 0.09 * sc);
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(patioP.x, patioP.y - 4 * sc, 5.5 * sc, 2.8 * sc, 0, 0, Math.PI * 2);
      ctx.fill();
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

      drawBuildingEntrance(ctx, project, wx, wy, 0.58 * sc, 0.09 * sc, sc, roofColor);
      break;
    }

    case 'reading_gazebo':
    case 'builtin_sudut_literasi': {
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
      drawIsoPrism(
        ctx,
        project,
        wx,
        wy,
        0.15 * sc,
        0.32 * sc,
        0.24 * sc,
        0.32 * sc,
        '#fde68a',
        '#b45309',
        '#92400e'
      );
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
      const jetTop = project(wx, wy, (0.86 + pulse * 0.14) * sc);
      const jetBase = project(wx, wy, 0.65 * sc);
      ctx.beginPath();
      ctx.moveTo(jetBase.x, jetBase.y);
      ctx.lineTo(jetTop.x, jetTop.y);
      ctx.strokeStyle = '#e0f2fe';
      ctx.lineWidth = 3.2 * sc;
      ctx.stroke();
      break;
    }

    case 'info_kiosk':
    case 'builtin_papan_pengumuman': {
      drawIsoPrism(
        ctx,
        project,
        wx,
        wy,
        0.09 * sc,
        0.54 * sc,
        0.28 * sc,
        0.78 * sc,
        shadeHex(accentColor, 20),
        '#78350f',
        '#451a03'
      );
      const scrP = project(wx, wy + 0.15 * sc, 0.48 * sc);
      ctx.fillStyle = modelType === 'builtin_papan_pengumuman' ? '#fef3c7' : '#0284c7';
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 1.5 * sc;
      ctx.beginPath();
      ctx.roundRect(scrP.x - 11 * sc, scrP.y - 11 * sc, 22 * sc, 18 * sc, 2 * sc);
      ctx.fill();
      ctx.stroke();
      drawIsoPyramidRoof(
        ctx,
        project,
        wx,
        wy,
        0.87 * sc,
        0.66 * sc,
        0.42 * sc,
        0.24 * sc,
        roofColor
      );
      break;
    }

    case 'sakura_park':
    default: {
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
      break;
    }
  }

  // 3. Floating Building Label Badge (opens when avatar approaches building, disappears after 5s stationary)
  const effectiveTagAlpha = isSelectedInStudio ? 1.0 : overheadTagAlpha;
  if ((isSelectedInStudio || isNearPlayer || isHovered) && effectiveTagAlpha > 0.005) {
    ctx.save();
    ctx.globalAlpha = (ctx.globalAlpha || 1.0) * effectiveTagAlpha;
    const labelZ =
      modelType === 'modern_tower' || modelType === 'builtin_pencakar_langit'
        ? 2.48 * sc
        : modelType === 'ferris_park' || modelType === 'office_hq' || modelType === 'builtin_studio_onair'
        ? 1.66 * sc
        : 1.35 * sc;
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
  isSelectedInStudio: boolean,
  activeInteraction?: CreatorPropInteractionState | null,
  occupiedSeatIds?: string[]
) {
  const { wx, wy, propModel, scale = 1.0 } = prop;
  const sc = Math.max(0.5, Math.min(2.2, scale)) * (tileW / 38);
  const pt = project(wx, wy, 0);
  const elapsed = now * 0.001;
  const breeze = Math.sin(elapsed * 2.2 + wx * 0.7 + wy * 0.5) * 1.5 * sc;

  const isInteractingThisProp = Boolean(
    activeInteraction &&
      activeInteraction.propId === prop.id &&
      now < activeInteraction.startTime + activeInteraction.durationMs
  );
  const interactionAgeSec =
    isInteractingThisProp && activeInteraction
      ? Math.max(0, (now - activeInteraction.startTime) * 0.001)
      : 0;
  const interactionProgress =
    isInteractingThisProp && activeInteraction
      ? Math.min(1, (now - activeInteraction.startTime) / Math.max(1, activeInteraction.durationMs))
      : 0;
  const rideMetrics = computeCustomPropSwingAndRideMetrics(
    prop,
    project,
    tileW,
    now,
    activeInteraction,
    occupiedSeatIds
  );

  ctx.save();

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

  if (prop.propCategory !== 'sports_court') {
    ctx.fillStyle = 'rgba(15, 23, 42, 0.26)';
    ctx.beginPath();
    ctx.ellipse(pt.x, pt.y + 2 * sc, 15 * sc, 7.5 * sc, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  switch (propModel) {
    // =========================================================================
    // AUTHENTIC BUILT-IN REFLEKSIA CITY TREES (100% IDENTICAL TO ThreeTownCanvas)
    // =========================================================================
    case 'tree_builtin_city_emerald':
    case 'tree_builtin_city_autumn': {
      const isAutumnTree = propModel === 'tree_builtin_city_autumn';

      // Soft ambient tree shadow on lawn
      ctx.fillStyle = 'rgba(0, 0, 0, 0.24)';
      ctx.beginPath();
      ctx.ellipse(pt.x + 6 * sc, pt.y + 3 * sc, 21 * sc, 10.5 * sc, 0, 0, Math.PI * 2);
      ctx.fill();

      // Sturdy two-tone brown trunk (exact match to ThreeTownCanvas line 12770)
      ctx.fillStyle = '#6a2f0c';
      ctx.fillRect(pt.x - 4 * sc, pt.y - 24 * sc, 8 * sc, 24 * sc);
      ctx.fillStyle = '#451a03';
      ctx.fillRect(pt.x, pt.y - 24 * sc, 4 * sc, 24 * sc);

      // Sphere 1 (Lower Large Canopy)
      ctx.fillStyle = isAutumnTree ? '#ea580c' : '#16a34a';
      ctx.beginPath();
      ctx.arc(pt.x + breeze * 0.55, pt.y - 28 * sc, 22 * sc, 0, Math.PI * 2);
      ctx.fill();

      // Sphere 1 Highlight
      ctx.fillStyle = isAutumnTree ? '#f97316' : '#22c55e';
      ctx.beginPath();
      ctx.arc(pt.x - 4 * sc + breeze * 0.55, pt.y - 31 * sc, 16 * sc, 0, Math.PI * 2);
      ctx.fill();

      // Sphere 2 (Upper Medium Canopy)
      ctx.fillStyle = isAutumnTree ? '#f97316' : '#22c55e';
      ctx.beginPath();
      ctx.arc(pt.x + breeze * 0.85, pt.y - 45 * sc, 16 * sc, 0, Math.PI * 2);
      ctx.fill();

      // Sphere 2 Highlight
      ctx.fillStyle = isAutumnTree ? '#fb923c' : '#4ade80';
      ctx.beginPath();
      ctx.arc(pt.x - 3 * sc + breeze * 0.85, pt.y - 48 * sc, 11 * sc, 0, Math.PI * 2);
      ctx.fill();

      // Top Foliage Bud
      ctx.fillStyle = isAutumnTree ? '#fdba74' : '#86efac';
      ctx.beginPath();
      ctx.arc(pt.x + breeze, pt.y - 59 * sc, 6 * sc, 0, Math.PI * 2);
      ctx.fill();

      if (!isAutumnTree) {
        // 7 Red Apples on Canopy + Ground (exact match to ThreeTownCanvas line 12805)
        const applePositions = [
          { dx: -11, dy: -26 },
          { dx: 10, dy: -23 },
          { dx: -4, dy: -41 },
          { dx: 7, dy: -46 },
          { dx: 0, dy: -19 },
          { dx: -12, dy: 2 },
          { dx: 11, dy: 4 },
        ];
        applePositions.forEach((ap) => {
          const ax = pt.x + ap.dx * sc + (ap.dy < 0 ? breeze * 0.6 : 0);
          const ay = pt.y + ap.dy * sc;
          ctx.fillStyle = '#dc2626';
          ctx.beginPath();
          ctx.arc(ax, ay, 2.5 * sc, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#fca5a5';
          ctx.beginPath();
          ctx.arc(ax - 0.7 * sc, ay - 0.7 * sc, 0.8 * sc, 0, Math.PI * 2);
          ctx.fill();
        });
      } else {
        // 5 Fallen Dry Leaves around the base of the Autumn Tree (exact match to ThreeTownCanvas line 12858)
        const leafPositions = [
          { dx: -13, dy: 2, rot: 0.4, col: '#ea580c' },
          { dx: -6, dy: 5, rot: -0.5, col: '#d97706' },
          { dx: 8, dy: 4, rot: 0.8, col: '#f97316' },
          { dx: 14, dy: 1, rot: -0.3, col: '#b45309' },
          { dx: 2, dy: 6, rot: 0.2, col: '#f59e0b' },
        ];
        leafPositions.forEach((lf) => {
          const lx = pt.x + lf.dx * sc;
          const ly = pt.y + lf.dy * sc;
          ctx.save();
          ctx.translate(lx, ly);
          ctx.rotate(lf.rot);
          ctx.fillStyle = lf.col;
          ctx.beginPath();
          ctx.ellipse(0, 0, 2.8 * sc, 1.4 * sc, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        });
      }
      break;
    }

    case 'tree_builtin_forest_pine': {
      // Exact Built-in Wilderness 3-Tiered Evergreen Pine Tree (ThreeTownCanvas line 12990)
      ctx.fillStyle = 'rgba(0, 0, 0, 0.24)';
      ctx.beginPath();
      ctx.ellipse(pt.x + 2 * sc, pt.y + 2 * sc, 12 * sc, 6 * sc, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#5d4037';
      ctx.fillRect(pt.x - 2.6 * sc, pt.y - 15 * sc, 5.2 * sc, 15 * sc);

      const pineTiers = [
        { baseY: -11 * sc, tipY: -29 * sc, halfW: 14 * sc, fill: '#14532d' },
        { baseY: -21 * sc, tipY: -39 * sc, halfW: 11 * sc, fill: '#15803d' },
        { baseY: -30 * sc, tipY: -48 * sc, halfW: 7.8 * sc, fill: '#22c55e' },
      ];
      pineTiers.forEach((tr, ti) => {
        const tipSway = breeze * (0.45 + ti * 0.3);
        ctx.fillStyle = tr.fill;
        ctx.beginPath();
        ctx.moveTo(pt.x + tipSway, pt.y + tr.tipY);
        ctx.lineTo(pt.x + tr.halfW + tipSway * 0.35, pt.y + tr.baseY);
        ctx.lineTo(pt.x, pt.y + tr.baseY + 2.5 * sc);
        ctx.lineTo(pt.x - tr.halfW + tipSway * 0.35, pt.y + tr.baseY);
        ctx.closePath();
        ctx.fill();
      });
      break;
    }

    case 'tree_oak_apple': {
      ctx.fillStyle = '#94a3b8';
      ctx.beginPath();
      ctx.ellipse(pt.x, pt.y + 1 * sc, 9 * sc, 4.2 * sc, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#15803d';
      ctx.beginPath();
      ctx.ellipse(pt.x, pt.y + 0.5 * sc, 7 * sc, 3 * sc, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#78350f';
      ctx.beginPath();
      ctx.moveTo(pt.x - 5 * sc, pt.y + 1 * sc);
      ctx.lineTo(pt.x - 3 * sc, pt.y - 24 * sc);
      ctx.lineTo(pt.x + 3 * sc, pt.y - 24 * sc);
      ctx.lineTo(pt.x + 5 * sc, pt.y + 1 * sc);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#92400e';
      ctx.fillRect(pt.x - 1.5 * sc, pt.y - 22 * sc, 2 * sc, 20 * sc);

      ctx.fillStyle = '#fef3c7';
      ctx.fillRect(pt.x + 5 * sc, pt.y - 18 * sc, 4.5 * sc, 4.5 * sc);
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.moveTo(pt.x + 7.25 * sc, pt.y - 21 * sc);
      ctx.lineTo(pt.x + 4 * sc, pt.y - 18 * sc);
      ctx.lineTo(pt.x + 10.5 * sc, pt.y - 18 * sc);
      ctx.closePath();
      ctx.fill();

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
        ctx.fillStyle = t.cLight;
        ctx.beginPath();
        ctx.moveTo(pt.x + breeze * 0.7, pt.y + (t.y - t.h) * sc);
        ctx.lineTo(pt.x - t.w * sc, pt.y + t.y * sc);
        ctx.lineTo(pt.x, pt.y + (t.y + 2) * sc);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = t.cDark;
        ctx.beginPath();
        ctx.moveTo(pt.x + breeze * 0.7, pt.y + (t.y - t.h) * sc);
        ctx.lineTo(pt.x, pt.y + (t.y + 2) * sc);
        ctx.lineTo(pt.x + t.w * sc, pt.y + t.y * sc);
        ctx.closePath();
        ctx.fill();
      });

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
      ctx.fillStyle = 'rgba(244, 114, 182, 0.35)';
      ctx.beginPath();
      ctx.ellipse(pt.x, pt.y + 1.5 * sc, 14 * sc, 6.5 * sc, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#4c1d95';
      ctx.lineWidth = 5 * sc;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(pt.x, pt.y + 1 * sc);
      ctx.quadraticCurveTo(pt.x - 2 * sc, pt.y - 12 * sc, pt.x + breeze * 0.4, pt.y - 25 * sc);
      ctx.stroke();

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
      ctx.fillStyle = '#cbd5e1';
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 1.2 * sc;
      ctx.beginPath();
      ctx.ellipse(pt.x, pt.y + 1 * sc, 13 * sc, 6 * sc, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#5c280b';
      ctx.fillRect(pt.x - 5.5 * sc, pt.y - 26 * sc, 11 * sc, 26 * sc);
      ctx.strokeStyle = '#92400e';
      ctx.lineWidth = 1.3 * sc;
      [-11, -7, -3, 4, 8, 11].forEach((rx) => {
        ctx.beginPath();
        ctx.moveTo(pt.x + rx * sc + breeze * 0.5, pt.y - 23 * sc);
        ctx.lineTo(pt.x + rx * 0.85 * sc, pt.y - 4 * sc);
        ctx.stroke();
      });
      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.arc(pt.x - 11 * sc + breeze * 0.5, pt.y - 15 * sc, 2.5 * sc, 0, Math.PI * 2);
      ctx.fill();

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
      ctx.fillStyle = '#fde68a';
      ctx.beginPath();
      ctx.ellipse(pt.x, pt.y + 1 * sc, 10 * sc, 4.8 * sc, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#92400e';
      ctx.lineWidth = 5 * sc;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(pt.x, pt.y);
      ctx.quadraticCurveTo(pt.x + 5 * sc, pt.y - 16 * sc, pt.x + 2 * sc + breeze, pt.y - 33 * sc);
      ctx.stroke();

      const topX = pt.x + 2 * sc + breeze;
      const topY = pt.y - 33 * sc;

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

    // =========================================================================
    // AUTHENTIC BUILT-IN REFLEKSIA CITY BENCHES (Fountain, Riverside, Campfire)
    // =========================================================================
    case 'bench_builtin_fountain':
    case 'bench_builtin_riverside': {
      const isRiverside = propModel === 'bench_builtin_riverside';
      const bx = pt.x;
      const by = pt.y;
      // Soft ground shadow (ThreeTownCanvas line 10680)
      ctx.fillStyle = 'rgba(0,0,0,0.22)';
      ctx.beginPath();
      ctx.ellipse(bx, by + 2 * sc, 11.5 * sc, 4.2 * sc, 0, 0, Math.PI * 2);
      ctx.fill();

      // Cast-iron legs (left, center, right)
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(bx - 8.5 * sc, by - 2.5 * sc, 2 * sc, 5 * sc);
      ctx.fillRect(bx - 0.9 * sc, by - 2.5 * sc, 1.8 * sc, 5 * sc);
      ctx.fillRect(bx + 6.5 * sc, by - 2.5 * sc, 2 * sc, 5 * sc);

      // Wooden seat plank (warm teak for riverside, golden oak for fountain)
      ctx.fillStyle = isRiverside ? '#b45309' : '#d97706';
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 1.0 * sc;
      ctx.beginPath();
      ctx.roundRect(bx - 10 * sc, by - 4.8 * sc, 20 * sc, 3.6 * sc, 1.5 * sc);
      ctx.fill();
      ctx.stroke();

      // Center seat divider line (2-person slots)
      ctx.strokeStyle = 'rgba(120, 53, 15, 0.55)';
      ctx.lineWidth = 0.8 * sc;
      ctx.beginPath();
      ctx.moveTo(bx, by - 4.6 * sc);
      ctx.lineTo(bx, by - 1.4 * sc);
      ctx.stroke();

      // Wooden backrest plank
      ctx.fillStyle = isRiverside ? '#92400e' : '#b45309';
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 0.9 * sc;
      ctx.beginPath();
      ctx.roundRect(bx - 9.5 * sc, by - 8.6 * sc, 19 * sc, 3.2 * sc, 1.2 * sc);
      ctx.fill();
      ctx.stroke();

      // Cast-iron armrests
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1.4 * sc;
      ctx.beginPath();
      ctx.moveTo(bx - 9.2 * sc, by - 7.5 * sc);
      ctx.lineTo(bx - 9.2 * sc, by - 2.5 * sc);
      ctx.moveTo(bx + 9.2 * sc, by - 7.5 * sc);
      ctx.lineTo(bx + 9.2 * sc, by - 2.5 * sc);
      ctx.stroke();
      break;
    }

    case 'bench_builtin_campfire': {
      // Built-in Rustic Log Bench around Campfire (ThreeTownCanvas line 10722)
      const bx = pt.x;
      const by = pt.y;
      ctx.fillStyle = 'rgba(0,0,0,0.24)';
      ctx.beginPath();
      ctx.ellipse(bx, by + 2.2 * sc, 12.5 * sc, 4.5 * sc, 0, 0, Math.PI * 2);
      ctx.fill();

      // Log support stumps
      ctx.fillStyle = '#451a03';
      ctx.fillRect(bx - 8 * sc, by - 1.5 * sc, 3.2 * sc, 4.2 * sc);
      ctx.fillRect(bx + 4.8 * sc, by - 1.5 * sc, 3.2 * sc, 4.2 * sc);

      // Thick split-timber log body
      ctx.fillStyle = '#78350f';
      ctx.strokeStyle = '#451a03';
      ctx.lineWidth = 1.2 * sc;
      ctx.beginPath();
      ctx.roundRect(bx - 11 * sc, by - 5.5 * sc, 22 * sc, 4.8 * sc, 2.4 * sc);
      ctx.fill();
      ctx.stroke();

      // Light wood grain top highlight & bark rings on ends
      ctx.fillStyle = '#b45309';
      ctx.beginPath();
      ctx.roundRect(bx - 9.8 * sc, by - 5.0 * sc, 19.6 * sc, 1.8 * sc, 1 * sc);
      ctx.fill();
      ctx.fillStyle = '#fde68a';
      ctx.beginPath();
      ctx.arc(bx - 9.5 * sc, by - 3.1 * sc, 1.5 * sc, 0, Math.PI * 2);
      ctx.arc(bx + 9.5 * sc, by - 3.1 * sc, 1.5 * sc, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

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
          ? '#dc2626'
          : '#d97706';
      const frameColor =
        propModel === 'bench_royal_gold'
          ? '#fbbf24'
          : propModel === 'bench_white_minimal'
          ? '#475569'
          : '#1e293b';

      ctx.fillStyle = 'rgba(148, 163, 184, 0.45)';
      ctx.beginPath();
      ctx.ellipse(pt.x, pt.y + 1.5 * sc, 16 * sc, 7 * sc, 0, 0, Math.PI * 2);
      ctx.fill();

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

      ctx.fillStyle = frameColor;
      ctx.fillRect(pt.x - 11 * sc, pt.y - 6 * sc, 2.5 * sc, 7 * sc);
      ctx.fillRect(pt.x + 8.5 * sc, pt.y - 6 * sc, 2.5 * sc, 7 * sc);

      ctx.fillStyle = seatColor;
      ctx.beginPath();
      ctx.roundRect(pt.x - 12.5 * sc, pt.y - 8.5 * sc, 25 * sc, 5 * sc, 2 * sc);
      ctx.fill();
      ctx.strokeStyle = frameColor;
      ctx.lineWidth = 1 * sc;
      ctx.stroke();

      ctx.fillStyle = shadeHex(seatColor, -12);
      ctx.beginPath();
      ctx.roundRect(pt.x - 12 * sc, pt.y - 15 * sc, 24 * sc, 5.5 * sc, 2 * sc);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(pt.x - 7 * sc, pt.y - 8 * sc, 4.5 * sc, 3 * sc);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(pt.x - 6.5 * sc, pt.y - 7.6 * sc, 3.5 * sc, 2.2 * sc);
      break;
    }

    case 'bench_picnic_table': {
      ctx.fillStyle = 'rgba(148, 163, 184, 0.38)';
      ctx.beginPath();
      ctx.ellipse(pt.x, pt.y + 2 * sc, 19 * sc, 9 * sc, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#92400e';
      ctx.beginPath();
      ctx.roundRect(pt.x - 15 * sc, pt.y - 10 * sc, 30 * sc, 3 * sc, 1.5 * sc);
      ctx.roundRect(pt.x - 16 * sc, pt.y - 3.5 * sc, 32 * sc, 3.5 * sc, 1.5 * sc);
      ctx.fill();

      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 2.4 * sc;
      ctx.beginPath();
      ctx.moveTo(pt.x - 10 * sc, pt.y + 1 * sc);
      ctx.lineTo(pt.x - 7 * sc, pt.y - 11 * sc);
      ctx.moveTo(pt.x + 10 * sc, pt.y + 1 * sc);
      ctx.lineTo(pt.x + 7 * sc, pt.y - 11 * sc);
      ctx.stroke();

      ctx.fillStyle = '#d97706';
      ctx.beginPath();
      ctx.roundRect(pt.x - 13.5 * sc, pt.y - 12.5 * sc, 27 * sc, 6.5 * sc, 2 * sc);
      ctx.fill();
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 1 * sc;
      ctx.stroke();

      ctx.fillStyle = '#fef3c7';
      ctx.strokeStyle = '#92400e';
      ctx.fillRect(pt.x - 6 * sc, pt.y - 15 * sc, 6 * sc, 4.2 * sc);
      ctx.strokeRect(pt.x - 6 * sc, pt.y - 15 * sc, 6 * sc, 4.2 * sc);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(pt.x - 6.2 * sc, pt.y - 15.5 * sc, 6.4 * sc, 1.4 * sc);
      ctx.fillStyle = '#fb923c';
      ctx.fillRect(pt.x + 3 * sc, pt.y - 15 * sc, 3.2 * sc, 4.2 * sc);
      break;
    }

    // =========================================================================
    // AUTHENTIC BUILT-IN & CUSTOM SWINGS (SYNCHRONIZED PENDULUM WITH AVATAR)
    // =========================================================================
    case 'swing_builtin_city': {
      // Exact Built-in Refleksia City Double Swing (ThreeTownCanvas line 10849)
      const swPt = pt;
      ctx.fillStyle = 'rgba(0,0,0,0.22)';
      ctx.beginPath();
      ctx.ellipse(swPt.x, swPt.y + 2 * sc, 13 * sc, 4.5 * sc, 0, 0, Math.PI * 2);
      ctx.fill();

      // Left & Right A-Frame wooden support posts
      ctx.strokeStyle = '#5c280b';
      ctx.lineWidth = 2.4 * sc;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(swPt.x - 11 * sc, swPt.y + 2 * sc);
      ctx.lineTo(swPt.x - 8 * sc, swPt.y - 16 * sc);
      ctx.lineTo(swPt.x - 5 * sc, swPt.y + 1 * sc);
      ctx.moveTo(swPt.x + 5 * sc, swPt.y + 1 * sc);
      ctx.lineTo(swPt.x + 8 * sc, swPt.y - 16 * sc);
      ctx.lineTo(swPt.x + 11 * sc, swPt.y + 2 * sc);
      ctx.stroke();

      // Top horizontal wooden crossbar beam
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 3.0 * sc;
      ctx.beginPath();
      ctx.moveTo(swPt.x - 9.5 * sc, swPt.y - 16 * sc);
      ctx.lineTo(swPt.x + 9.5 * sc, swPt.y - 16 * sc);
      ctx.stroke();

      // Decorative green leaf garlands & pink blossom on top beam
      ctx.fillStyle = '#16a34a';
      ctx.beginPath();
      ctx.arc(swPt.x - 8 * sc, swPt.y - 16.8 * sc, 2.2 * sc, 0, Math.PI * 2);
      ctx.arc(swPt.x, swPt.y - 17 * sc, 2.0 * sc, 0, Math.PI * 2);
      ctx.arc(swPt.x + 8 * sc, swPt.y - 16.8 * sc, 2.2 * sc, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f472b6';
      ctx.beginPath();
      ctx.arc(swPt.x, swPt.y - 17.2 * sc, 1.0 * sc, 0, Math.PI * 2);
      ctx.fill();

      const seats = [rideMetrics.swingLeft, rideMetrics.swingRight];
      seats.forEach((m) => {
        if (!m) return;
        // Moving shadow beneath swing seat
        ctx.fillStyle = m.isOccupied ? 'rgba(0,0,0,0.28)' : 'rgba(0,0,0,0.16)';
        ctx.beginPath();
        ctx.ellipse(
          m.shadowX,
          m.shadowY,
          3.4 * sc * m.shadowScale,
          1.4 * sc * m.shadowScale,
          0,
          0,
          Math.PI * 2
        );
        ctx.fill();

        // Hanging chains from top crossbar to swinging seat
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 1.0 * sc;
        ctx.beginPath();
        ctx.moveTo(m.anchorX - 1.8 * sc, m.anchorY);
        ctx.lineTo(m.seatX - 1.8 * sc, m.seatY);
        ctx.moveTo(m.anchorX + 1.8 * sc, m.anchorY);
        ctx.lineTo(m.seatX + 1.8 * sc, m.seatY);
        ctx.stroke();

        // Warm wooden swing seat plank
        ctx.fillStyle = '#d97706';
        ctx.strokeStyle = '#78350f';
        ctx.lineWidth = 0.8 * sc;
        ctx.beginPath();
        ctx.roundRect(m.seatX - 2.8 * sc, m.seatY - 1.0 * sc, 5.6 * sc, 2.2 * sc, 1 * sc);
        ctx.fill();
        ctx.stroke();
      });
      break;
    }

    case 'swing_wood_garden':
    case 'swing_cyan_modern': {
      const frameColor = propModel === 'swing_cyan_modern' ? '#0891b2' : '#92400e';
      const barColor = propModel === 'swing_cyan_modern' ? '#22d3ee' : '#15803d';

      ctx.fillStyle = propModel === 'swing_cyan_modern' ? 'rgba(56, 189, 248, 0.25)' : 'rgba(253, 230, 138, 0.45)';
      ctx.beginPath();
      ctx.ellipse(pt.x, pt.y + 1.5 * sc, 18 * sc, 8 * sc, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = frameColor;
      ctx.lineWidth = 2.8 * sc;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(pt.x - 16 * sc, pt.y + 2 * sc);
      ctx.lineTo(pt.x - 12 * sc, pt.y - 25 * sc);
      ctx.lineTo(pt.x - 9 * sc, pt.y + 1 * sc);
      ctx.moveTo(pt.x + 9 * sc, pt.y + 1 * sc);
      ctx.lineTo(pt.x + 12 * sc, pt.y - 25 * sc);
      ctx.lineTo(pt.x + 16 * sc, pt.y + 2 * sc);
      ctx.moveTo(pt.x - 13 * sc, pt.y - 25 * sc);
      ctx.lineTo(pt.x + 13 * sc, pt.y - 25 * sc);
      ctx.stroke();

      ctx.fillStyle = barColor;
      ctx.beginPath();
      ctx.roundRect(pt.x - 14 * sc, pt.y - 28 * sc, 28 * sc, 4 * sc, 2 * sc);
      ctx.fill();

      [
        { m: rideMetrics.swingLeft, col: '#fbbf24' },
        { m: rideMetrics.swingRight, col: '#f43f5e' },
      ].forEach(({ m, col }) => {
        if (!m) return;
        ctx.fillStyle = m.isOccupied ? 'rgba(0,0,0,0.28)' : 'rgba(0,0,0,0.15)';
        ctx.beginPath();
        ctx.ellipse(
          m.shadowX,
          m.shadowY,
          3.8 * sc * m.shadowScale,
          1.6 * sc * m.shadowScale,
          0,
          0,
          Math.PI * 2
        );
        ctx.fill();

        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 1.2 * sc;
        ctx.beginPath();
        ctx.moveTo(m.anchorX - 2.2 * sc, m.anchorY);
        ctx.lineTo(m.seatX - 2.2 * sc, m.seatY);
        ctx.moveTo(m.anchorX + 2.2 * sc, m.anchorY);
        ctx.lineTo(m.seatX + 2.2 * sc, m.seatY);
        ctx.stroke();

        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.roundRect(m.seatX - 3.6 * sc, m.seatY - 1.2 * sc, 7.2 * sc, 2.8 * sc, 1 * sc);
        ctx.fill();
      });
      break;
    }

    // =========================================================================
    // AUTHENTIC BUILT-IN & CUSTOM CAMPFIRES (WITH INTERACTIVE FLAME BOOST)
    // =========================================================================
    case 'campfire_builtin_city':
    case 'campfire_stone_ring':
    case 'campfire_royal_brazier': {
      const fireBoost = isInteractingThisProp ? 1.38 : 1.0;

      if (propModel === 'campfire_royal_brazier') {
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
        // Warm ground fire glow
        const fireGlow = ctx.createRadialGradient(
          pt.x,
          pt.y - 2 * sc,
          2 * sc,
          pt.x,
          pt.y - 2 * sc,
          26 * sc * fireBoost
        );
        fireGlow.addColorStop(0, 'rgba(251, 146, 60, 0.50)');
        fireGlow.addColorStop(0.5, 'rgba(234, 88, 12, 0.22)');
        fireGlow.addColorStop(1, 'rgba(234, 88, 12, 0)');
        ctx.fillStyle = fireGlow;
        ctx.beginPath();
        ctx.ellipse(pt.x, pt.y + 1 * sc, 26 * sc * fireBoost, 13 * sc * fireBoost, 0, 0, Math.PI * 2);
        ctx.fill();

        // Stone ring base
        const stoneCount = propModel === 'campfire_builtin_city' ? 8 : 10;
        for (let i = 0; i < stoneCount; i++) {
          const ang = (i / stoneCount) * Math.PI * 2;
          ctx.fillStyle = i % 2 === 0 ? '#475569' : '#64748b';
          ctx.beginPath();
          ctx.ellipse(
            pt.x + Math.cos(ang) * 9.5 * sc,
            pt.y + 1.5 * sc + Math.sin(ang) * 4.5 * sc,
            2.6 * sc,
            1.8 * sc,
            0,
            0,
            Math.PI * 2
          );
          ctx.fill();
        }

        // Crossed firewood logs
        ctx.strokeStyle = '#451a03';
        ctx.lineWidth = 3.0 * sc;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(pt.x - 6.5 * sc, pt.y + 2 * sc);
        ctx.lineTo(pt.x + 6.5 * sc, pt.y - 1.5 * sc);
        ctx.moveTo(pt.x + 6.5 * sc, pt.y + 2 * sc);
        ctx.lineTo(pt.x - 6.5 * sc, pt.y - 1.5 * sc);
        ctx.stroke();

        if (propModel === 'campfire_stone_ring') {
          ctx.strokeStyle = '#1e293b';
          ctx.lineWidth = 1.3 * sc;
          ctx.beginPath();
          ctx.moveTo(pt.x - 11 * sc, pt.y + 2 * sc);
          ctx.lineTo(pt.x, pt.y - 23 * sc);
          ctx.lineTo(pt.x + 11 * sc, pt.y + 2 * sc);
          ctx.stroke();
        }
      }

      const flicker = Math.sin(elapsed * 11 + wx) * 1.6 * sc;
      const flicker2 = Math.cos(elapsed * 14 + wy) * 1.2 * sc;

      // Outer red-orange flame
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.moveTo(pt.x - 6.2 * sc * fireBoost, pt.y);
      ctx.quadraticCurveTo(
        pt.x - 7.5 * sc * fireBoost,
        pt.y - 9 * sc * fireBoost,
        pt.x + flicker,
        pt.y - 16.5 * sc * fireBoost
      );
      ctx.quadraticCurveTo(
        pt.x + 7.5 * sc * fireBoost,
        pt.y - 9 * sc * fireBoost,
        pt.x + 6.2 * sc * fireBoost,
        pt.y
      );
      ctx.closePath();
      ctx.fill();

      // Middle orange flame
      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.moveTo(pt.x - 4.4 * sc * fireBoost, pt.y);
      ctx.quadraticCurveTo(
        pt.x - 5 * sc * fireBoost,
        pt.y - 7 * sc * fireBoost,
        pt.x + flicker2,
        pt.y - 12.8 * sc * fireBoost
      );
      ctx.quadraticCurveTo(
        pt.x + 5 * sc * fireBoost,
        pt.y - 7 * sc * fireBoost,
        pt.x + 4.4 * sc * fireBoost,
        pt.y
      );
      ctx.closePath();
      ctx.fill();

      // Inner bright yellow core flame
      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.moveTo(pt.x - 2.4 * sc * fireBoost, pt.y);
      ctx.quadraticCurveTo(
        pt.x - 2 * sc * fireBoost,
        pt.y - 4.5 * sc * fireBoost,
        pt.x + flicker * 0.5,
        pt.y - 8.5 * sc * fireBoost
      );
      ctx.quadraticCurveTo(
        pt.x + 2 * sc * fireBoost,
        pt.y - 4.5 * sc * fireBoost,
        pt.x + 2.4 * sc * fireBoost,
        pt.y
      );
      ctx.closePath();
      ctx.fill();

      // Rising glowing sparks (more intense when interacting!)
      const sparkCount = isInteractingThisProp ? 7 : 4;
      for (let s = 0; s < sparkCount; s++) {
        const sparkT = (elapsed * (isInteractingThisProp ? 2.4 : 1.6) + s * 0.21) % 1;
        const sx = pt.x + Math.sin(elapsed * 4.5 + s * 2) * 5.5 * sc * fireBoost;
        const sy = pt.y - (8 + sparkT * 20 * fireBoost) * sc;
        ctx.fillStyle = `rgba(253, 224, 71, ${1 - sparkT})`;
        ctx.beginPath();
        ctx.arc(sx, sy, 1.35 * sc, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }

    case 'playground_slide_colorful': {
      ctx.fillStyle = '#fef08a';
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 1.4 * sc;
      ctx.beginPath();
      ctx.ellipse(pt.x, pt.y + 1 * sc, 22 * sc, 11 * sc, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#dc2626';
      ctx.fillRect(pt.x - 14 * sc, pt.y - 24 * sc, 2.5 * sc, 24 * sc);
      ctx.fillRect(pt.x - 4.5 * sc, pt.y - 24 * sc, 2.5 * sc, 24 * sc);

      ctx.strokeStyle = '#eab308';
      ctx.lineWidth = 1.8 * sc;
      for (let i = 0; i < 5; i++) {
        const ly = pt.y - (3 + i * 3.5) * sc;
        ctx.beginPath();
        ctx.moveTo(pt.x - 17 * sc + i * 0.8 * sc, ly);
        ctx.lineTo(pt.x - 12 * sc, ly);
        ctx.stroke();
      }

      ctx.fillStyle = '#2563eb';
      ctx.fillRect(pt.x - 15 * sc, pt.y - 18.5 * sc, 13 * sc, 3.8 * sc);
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 1.6 * sc;
      ctx.strokeRect(pt.x - 14 * sc, pt.y - 22.5 * sc, 11 * sc, 4 * sc);

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

      ctx.fillStyle = '#ec4899';
      ctx.beginPath();
      ctx.moveTo(pt.x - 8.5 * sc, pt.y - 32 * sc);
      ctx.lineTo(pt.x - 8.5 * sc, pt.y - 37 * sc);
      ctx.lineTo(pt.x - 3 * sc, pt.y - 35 * sc);
      ctx.lineTo(pt.x - 8.5 * sc, pt.y - 33 * sc);
      ctx.fill();

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
      const tilt = rideMetrics.tiltOrBounce ?? Math.sin(elapsed * 2.5 + wx) * 4.5 * sc;
      ctx.fillStyle = '#dcfce7';
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 1.4 * sc;
      ctx.beginPath();
      ctx.ellipse(pt.x, pt.y + 1 * sc, 20 * sc, 9.5 * sc, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.ellipse(pt.x - 13 * sc, pt.y + 1 * sc, 3 * sc, 1.5 * sc, 0, 0, Math.PI * 2);
      ctx.ellipse(pt.x + 13 * sc, pt.y + 1 * sc, 3 * sc, 1.5 * sc, 0, 0, Math.PI * 2);
      ctx.fill();

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

      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 4 * sc;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(pt.x - 16 * sc, pt.y - 8.5 * sc - tilt);
      ctx.lineTo(pt.x + 16 * sc, pt.y - 8.5 * sc + tilt);
      ctx.stroke();

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
      const bounce = rideMetrics.tiltOrBounce ?? Math.sin(elapsed * 4.5 + wy) * 2 * sc;
      const rock = rideMetrics.rockX ?? Math.cos(elapsed * 4.5 + wy) * 1.2 * sc;

      ctx.fillStyle = '#e0f2fe';
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 1.5 * sc;
      ctx.beginPath();
      ctx.ellipse(pt.x, pt.y + 1 * sc, 15.5 * sc, 7.5 * sc, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 2.4 * sc;
      ctx.beginPath();
      ctx.moveTo(pt.x, pt.y);
      ctx.lineTo(pt.x - 2.5 * sc, pt.y - 3.5 * sc);
      ctx.lineTo(pt.x + 2.5 * sc, pt.y - 7 * sc);
      ctx.lineTo(pt.x - 2 * sc, pt.y - 10 * sc + bounce * 0.5);
      ctx.lineTo(pt.x + rock, pt.y - 12 * sc + bounce);
      ctx.stroke();

      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.ellipse(pt.x + rock, pt.y - 14 * sc + bounce, 7.5 * sc, 4.2 * sc, 0, 0, Math.PI * 2);
      ctx.arc(pt.x + 6 * sc + rock, pt.y - 19 * sc + bounce, 3.8 * sc, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fef3c7';
      ctx.beginPath();
      ctx.ellipse(pt.x - 7.5 * sc + rock, pt.y - 15 * sc + bounce, 3 * sc, 1.6 * sc, -0.4, 0, Math.PI * 2);
      ctx.fill();
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
      ctx.fillStyle = '#fef3c7';
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 1.5 * sc;
      ctx.beginPath();
      ctx.ellipse(pt.x, pt.y + 2 * sc, 27 * sc, 13 * sc, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      [
        { tx: -11, col: '#2563eb', roof: '#ef4444' },
        { tx: 7, col: '#059669', roof: '#f59e0b' },
      ].forEach(({ tx, col, roof }) => {
        ctx.fillStyle = col;
        ctx.fillRect(pt.x + tx * sc, pt.y - 23 * sc, 9 * sc, 21 * sc);
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(pt.x + (tx + 4.5) * sc, pt.y - 17 * sc, 2.2 * sc, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = roof;
        ctx.beginPath();
        ctx.moveTo(pt.x + (tx + 4.5) * sc, pt.y - 33 * sc);
        ctx.lineTo(pt.x + (tx - 2) * sc, pt.y - 23 * sc);
        ctx.lineTo(pt.x + (tx + 11) * sc, pt.y - 23 * sc);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#ec4899';
        ctx.fillRect(pt.x + (tx + 4.5) * sc, pt.y - 37 * sc, 4.5 * sc, 2.5 * sc);
      });

      ctx.fillStyle = '#b45309';
      ctx.fillRect(pt.x - 2 * sc, pt.y - 14.5 * sc, 9 * sc, 3.5 * sc);
      ctx.strokeStyle = '#fde047';
      ctx.lineWidth = 1.2 * sc;
      ctx.strokeRect(pt.x - 2 * sc, pt.y - 18 * sc, 9 * sc, 3.5 * sc);

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

      if (propModel === 'court_basketball_full') {
        ctx.fillStyle = '#c2410c';
        ctx.strokeStyle = '#ffffff';
      } else if (propModel === 'court_futsal_green') {
        ctx.fillStyle = '#15803d';
        ctx.strokeStyle = '#ffffff';
      } else if (propModel === 'court_badminton_pro') {
        ctx.fillStyle = '#0f766e';
        ctx.strokeStyle = '#ffffff';
      } else {
        ctx.fillStyle = '#4ade80';
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
        [cNW, cNE, cSE, cSW].forEach((corner, i) => {
          ctx.fillStyle = i % 2 === 0 ? '#facc15' : '#f472b6';
          ctx.beginPath();
          ctx.arc(corner.x, corner.y, 3 * sc, 0, Math.PI * 2);
          ctx.fill();
        });
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

      if (propModel === 'court_basketball_full') {
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

        [midW, midE].forEach((hoopBase, idx) => {
          ctx.strokeStyle = '#1e293b';
          ctx.lineWidth = 2.8 * sc;
          ctx.beginPath();
          ctx.moveTo(hoopBase.x, hoopBase.y);
          ctx.lineTo(hoopBase.x, hoopBase.y - 23 * sc);
          ctx.stroke();

          ctx.fillStyle = 'rgba(248, 250, 252, 0.92)';
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 1.2 * sc;
          ctx.fillRect(hoopBase.x - 5 * sc, hoopBase.y - 27 * sc, 10 * sc, 6.5 * sc);
          ctx.strokeRect(hoopBase.x - 5 * sc, hoopBase.y - 27 * sc, 10 * sc, 6.5 * sc);

          const rimOffset = idx === 0 ? 3.2 * sc : -3.2 * sc;
          ctx.strokeStyle = '#ea580c';
          ctx.lineWidth = 1.7 * sc;
          ctx.beginPath();
          ctx.ellipse(hoopBase.x + rimOffset, hoopBase.y - 20.5 * sc, 3.4 * sc, 1.7 * sc, 0, 0, Math.PI * 2);
          ctx.stroke();
        });

        ctx.fillStyle = '#0f172a';
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 1.1 * sc;
        ctx.fillRect(midN.x - 9 * sc, midN.y - 13 * sc, 18 * sc, 7.5 * sc);
        ctx.strokeRect(midN.x - 9 * sc, midN.y - 13 * sc, 18 * sc, 7.5 * sc);
        ctx.fillStyle = isInteractingThisProp ? '#fde047' : '#4ade80';
        ctx.font = `900 ${Math.round(5.5 * sc)}px monospace`;
        ctx.textAlign = 'center';
        ctx.fillText(isInteractingThisProp ? '91 : 86' : '88 : 86', midN.x, midN.y - 8 * sc);

        if (isInteractingThisProp) {
          // High 3-point basketball shot arc right into the east hoop!
          const shotP = (interactionAgeSec * 0.85) % 1;
          const startShot = courtPt(0.42, 0.52);
          const targetRim = { x: midE.x - 3.2 * sc, y: midE.y - 20.5 * sc };
          const bx = startShot.x + (targetRim.x - startShot.x) * shotP;
          const by =
            startShot.y -
            10 * sc +
            (targetRim.y - (startShot.y - 10 * sc)) * shotP -
            Math.sin(shotP * Math.PI) * 24 * sc;
          ctx.strokeStyle = 'rgba(251, 191, 36, 0.65)';
          ctx.lineWidth = 1.4 * sc;
          ctx.setLineDash([2 * sc, 2 * sc]);
          ctx.beginPath();
          ctx.moveTo(startShot.x, startShot.y - 10 * sc);
          ctx.quadraticCurveTo(
            (startShot.x + targetRim.x) * 0.5,
            targetRim.y - 22 * sc,
            bx,
            by
          );
          ctx.stroke();
          ctx.setLineDash([]);

          ctx.fillStyle = '#ea580c';
          ctx.beginPath();
          ctx.arc(bx, by, 3.4 * sc, 0, Math.PI * 2);
          ctx.fill();
        } else {
          const bPhase = (elapsed * 0.9) % 1;
          const bPos = courtPt(0.35 + Math.sin(elapsed * 1.4) * 0.25, 0.5);
          const bJump = Math.abs(Math.sin(bPhase * Math.PI * 2)) * 12 * sc;
          ctx.fillStyle = '#ea580c';
          ctx.beginPath();
          ctx.arc(bPos.x, bPos.y - 3 * sc - bJump, 3 * sc, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (propModel === 'court_futsal_green') {
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

        const shotP = isInteractingThisProp ? (interactionAgeSec * 1.1) % 1 : 0;
        const ballPos = isInteractingThisProp
          ? courtPt(0.35 + shotP * 0.62, 0.5 + Math.sin(shotP * Math.PI) * 0.08)
          : courtPt(0.5 + Math.sin(elapsed * 2.1) * 0.32, 0.5 + Math.cos(elapsed * 1.5) * 0.22);
        const ballLift = isInteractingThisProp ? Math.sin(shotP * Math.PI) * 9 * sc : 0;
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 1 * sc;
        ctx.beginPath();
        ctx.arc(ballPos.x, ballPos.y - 2.5 * sc - ballLift, 3.0 * sc, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      } else if (propModel === 'court_badminton_pro') {
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

        ctx.strokeStyle = '#f8fafc';
        ctx.lineWidth = 2 * sc;
        ctx.beginPath();
        ctx.moveTo(midN.x, midN.y);
        ctx.lineTo(midN.x, midN.y - 12 * sc);
        ctx.moveTo(midS.x, midS.y);
        ctx.lineTo(midS.x, midS.y - 12 * sc);
        ctx.stroke();

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

        const shuttleSpeed = isInteractingThisProp ? 5.2 : 2.8;
        const shuttleU = 0.5 + Math.sin(elapsed * shuttleSpeed) * 0.32;
        const shuttleArc =
          Math.cos((shuttleU - 0.5) * Math.PI * 1.6) * (isInteractingThisProp ? 21 : 15) * sc;
        const sPt = courtPt(shuttleU, 0.5);
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(sPt.x, sPt.y - 6 * sc - shuttleArc, 2.4 * sc, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }

    case 'shrub_flowering_azalea': {
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
      ctx.fillStyle = '#b45309';
      ctx.fillRect(pt.x - 6 * sc, pt.y - 8 * sc, 12 * sc, 8 * sc);
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(pt.x - 6 * sc, pt.y - 5 * sc, 12 * sc, 1.5 * sc);
      ctx.fillStyle = '#d97706';
      ctx.fillRect(pt.x - 7 * sc, pt.y - 9.5 * sc, 14 * sc, 2.2 * sc);

      ctx.fillStyle = '#78350f';
      ctx.fillRect(pt.x - 1.2 * sc, pt.y - 28 * sc, 2.4 * sc, 20 * sc);

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
      ctx.fillStyle = '#78350f';
      ctx.strokeStyle = '#451a03';
      ctx.lineWidth = 1 * sc;
      ctx.beginPath();
      ctx.roundRect(pt.x - 15 * sc, pt.y - 6.5 * sc, 30 * sc, 7 * sc, 2 * sc);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#15803d';
      ctx.fillRect(pt.x - 13.5 * sc, pt.y - 9 * sc, 27 * sc, 3.5 * sc);
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
      ctx.fillStyle = '#e2e8f0';
      ctx.beginPath();
      ctx.ellipse(pt.x, pt.y + 1 * sc, 12 * sc, 5 * sc, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#64748b';
      ctx.beginPath();
      ctx.arc(pt.x - 5 * sc, pt.y - 1.5 * sc, 3.5 * sc, 0, Math.PI * 2);
      ctx.arc(pt.x + 5 * sc, pt.y - 1 * sc, 3 * sc, 0, Math.PI * 2);
      ctx.fill();

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

    case 'water_fountain_tiered': {
      const jetBoost = isInteractingThisProp ? 1.38 : 1.0;
      ctx.fillStyle = '#cbd5e1';
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 1.8 * sc;
      ctx.beginPath();
      ctx.ellipse(pt.x, pt.y, 20 * sc, 10 * sc, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#0284c7';
      ctx.beginPath();
      ctx.ellipse(pt.x, pt.y - 1 * sc, 17.5 * sc, 8.5 * sc, 0, 0, Math.PI * 2);
      ctx.fill();

      const ripR = (6 + ((elapsed * (isInteractingThisProp ? 14 : 8)) % 11)) * sc;
      ctx.strokeStyle = 'rgba(224, 242, 254, 0.72)';
      ctx.lineWidth = 1.2 * sc;
      ctx.beginPath();
      ctx.ellipse(pt.x, pt.y - 1 * sc, ripR, ripR * 0.48, 0, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(pt.x - 3.2 * sc, pt.y - 24 * sc, 6.4 * sc, 23 * sc);
      ctx.beginPath();
      ctx.ellipse(pt.x, pt.y - 10 * sc, 11 * sc, 5 * sc, 0, 0, Math.PI * 2);
      ctx.ellipse(pt.x, pt.y - 18 * sc, 7 * sc, 3.2 * sc, 0, 0, Math.PI * 2);
      ctx.fill();

      const sprayH = (28 * jetBoost + Math.sin(elapsed * 8) * 2.5) * sc;
      ctx.strokeStyle = '#e0f2fe';
      ctx.lineWidth = 1.8 * sc;
      [-9, -4.5, 4.5, 9].forEach((sx) => {
        ctx.beginPath();
        ctx.moveTo(pt.x, pt.y - 23 * sc);
        ctx.quadraticCurveTo(pt.x + sx * 0.6 * sc, pt.y - sprayH, pt.x + sx * sc, pt.y - 5 * sc);
        ctx.stroke();
      });
      break;
    }

    case 'water_koi_pond_lotus': {
      ctx.fillStyle = '#64748b';
      ctx.beginPath();
      ctx.ellipse(pt.x, pt.y, 22 * sc, 11 * sc, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#0369a1';
      ctx.beginPath();
      ctx.ellipse(pt.x, pt.y - 0.5 * sc, 19 * sc, 9.2 * sc, 0, 0, Math.PI * 2);
      ctx.fill();

      const koiPalette = ['#f97316', '#facc15', '#f8fafc'];
      const feedGather = isInteractingThisProp ? 0.52 : 1.0;
      koiPalette.forEach((kCol, idx) => {
        const koiAng = elapsed * (isInteractingThisProp ? 2.6 : 1.2 + idx * 0.25) + idx * 2.1;
        const rx = (6 + idx * 3.2) * sc * feedGather;
        const ry = (2.8 + idx * 1.4) * sc * feedGather;
        const kx = pt.x + Math.cos(koiAng) * rx;
        const ky = pt.y - 1 * sc + Math.sin(koiAng) * ry;
        ctx.fillStyle = kCol;
        ctx.beginPath();
        ctx.ellipse(kx, ky, 3.4 * sc, 1.5 * sc, koiAng + Math.PI / 2, 0, Math.PI * 2);
        ctx.fill();
      });

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
      ctx.fillStyle = '#0284c7';
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 2.2 * sc;
      ctx.beginPath();
      ctx.ellipse(pt.x, pt.y + 1 * sc, 19 * sc, 9 * sc, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

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

      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(pt.x - 5 * sc, pt.y - 21 * sc, 10 * sc, 20 * sc);
      for (let f = 0; f < 3; f++) {
        const foamOffset = (elapsed * (isInteractingThisProp ? 24 : 16) + f * 6) % 18;
        ctx.strokeStyle = '#e0f2fe';
        ctx.lineWidth = 1.5 * sc;
        ctx.beginPath();
        ctx.moveTo(pt.x - 3.8 * sc, pt.y - (19 - foamOffset) * sc);
        ctx.lineTo(pt.x + 3.8 * sc, pt.y - (19 - foamOffset) * sc);
        ctx.stroke();
      }
      ctx.fillStyle = 'rgba(240, 249, 255, 0.85)';
      ctx.beginPath();
      ctx.ellipse(pt.x, pt.y - 0.5 * sc, (6 + Math.sin(elapsed * 9) * 1.5) * sc, 2.5 * sc, 0, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 'water_dancing_jets': {
      const jetBoost = isInteractingThisProp ? 1.45 : 1.0;
      ctx.fillStyle = '#1e293b';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.6 * sc;
      ctx.beginPath();
      ctx.ellipse(pt.x, pt.y, 18 * sc, 9 * sc, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      [-12, -8, -4, 0, 4, 8, 12].forEach((jx, idx) => {
        const jh = (8 + Math.abs(Math.sin(elapsed * 5.2 + idx * 0.75)) * 18 * jetBoost) * sc;
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

  // ===========================================================================
  // LIVE INTERACTIVE VISUAL EFFECTS WHEN AVATAR INTERACTS WITH THIS PROP
  // ===========================================================================
  if (isInteractingThisProp && activeInteraction) {
    const actId = activeInteraction.actionId;

    // 1. Watering & Caring for Trees / Shrubs (Rain shower + expanding aqua ring + green growth sparkles)
    if (actId === 'tree_water_care' || actId === 'plant_water_prune') {
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5 * sc;
      for (let d = 0; d < 7; d++) {
        const dropPhase = (interactionAgeSec * 2.8 + d * 0.14) % 1;
        const dx = pt.x + ((d - 3) * 4.2 + Math.sin(d * 2) * 2) * sc;
        const dy = pt.y - 28 * sc + dropPhase * 28 * sc;
        ctx.beginPath();
        ctx.moveTo(dx, dy);
        ctx.lineTo(dx - 0.8 * sc, dy + 4.2 * sc);
        ctx.stroke();
      }
      ctx.strokeStyle = `rgba(56, 189, 248, ${Math.max(0, 1 - interactionProgress * 0.85)})`;
      ctx.lineWidth = 1.8 * sc;
      ctx.beginPath();
      ctx.ellipse(
        pt.x,
        pt.y + 2 * sc,
        (8 + interactionProgress * 18) * sc,
        (4 + interactionProgress * 9) * sc,
        0,
        0,
        Math.PI * 2
      );
      ctx.stroke();
    }

    // 2. Harvesting Fruit / Blossom / Pine Cone from Tree
    if (actId === 'tree_harvest' || actId === 'plant_botany_observe') {
      const floatY = pt.y - (22 + interactionProgress * 22) * sc;
      const alpha = Math.max(0, 1 - interactionProgress * 0.75);
      ctx.fillStyle = `rgba(254, 240, 138, ${alpha * 0.9})`;
      ctx.beginPath();
      ctx.arc(pt.x, floatY, 7.5 * sc, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle =
        propModel === 'tree_sakura_pink'
          ? '#ec4899'
          : propModel === 'tree_autumn_maple' || propModel === 'tree_builtin_city_autumn'
          ? '#ea580c'
          : '#dc2626';
      ctx.beginPath();
      ctx.arc(pt.x, floatY, 4.2 * sc, 0, Math.PI * 2);
      ctx.fill();
    }

    // 3. Feeding Koi / Wishing at Water Feature (Golden pellets arcing into water + concentric golden rings)
    if (prop.propCategory === 'water_feature') {
      for (let p = 0; p < 5; p++) {
        const pT = (interactionAgeSec * 1.9 + p * 0.18) % 1;
        const px = pt.x + (p - 2) * 4.5 * sc * pT;
        const py = pt.y - 16 * sc * (1 - pT) - Math.sin(pT * Math.PI) * 8 * sc;
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(px, py, 1.8 * sc, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.strokeStyle = `rgba(250, 204, 21, ${Math.max(0, 1 - interactionProgress * 0.8)})`;
      ctx.lineWidth = 1.6 * sc;
      ctx.beginPath();
      ctx.ellipse(
        pt.x,
        pt.y,
        (5 + ((interactionAgeSec * 12) % 14)) * sc,
        (2.5 + ((interactionAgeSec * 6) % 7)) * sc,
        0,
        0,
        Math.PI * 2
      );
      ctx.stroke();
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

      ctx.fillStyle = coat;
      ctx.beginPath();
      ctx.ellipse(0, -6.8 * sc, 6.8 * sc, 4 * sc, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fef3c7';
      ctx.beginPath();
      ctx.arc(-6.5 * sc, -7.8 * sc, 1.6 * sc, 0, Math.PI * 2);
      ctx.fill();

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

      ctx.fillStyle = coat;
      ctx.beginPath();
      ctx.arc(5.8 * sc, -10.8 * sc + headGraze, 3 * sc, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(6.8 * sc, -11.2 * sc + headGraze, 0.8 * sc, 0, Math.PI * 2);
      ctx.fill();

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
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(-5 * sc, -4 * sc, 1.8 * sc, 0, Math.PI * 2);
      ctx.ellipse(0, -4.5 * sc, 5 * sc, 3.5 * sc, 0, 0, Math.PI * 2);
      ctx.arc(4.2 * sc, -6.8 * sc + headGraze * 0.6, 2.7 * sc, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fbcfe8';
      ctx.beginPath();
      ctx.ellipse(3.5 * sc, -11 * sc + headGraze * 0.6, 1.1 * sc, 3.2 * sc, -0.2, 0, Math.PI * 2);
      ctx.ellipse(4.8 * sc, -10.8 * sc + headGraze * 0.6, 1.1 * sc, 3 * sc, 0.15, 0, Math.PI * 2);
      ctx.fill();
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
      ctx.strokeStyle = shadeHex(bodyCol, -35);
      ctx.lineWidth = 1.4 * sc;
      ctx.beginPath();
      ctx.moveTo(-3 * sc, -3 * sc);
      ctx.lineTo(-3 * sc - stepLeg, 1 * sc);
      ctx.moveTo(3 * sc, -3 * sc);
      ctx.lineTo(3 * sc + stepLeg, 1 * sc);
      ctx.stroke();

      ctx.fillStyle = bodyCol;
      ctx.beginPath();
      ctx.ellipse(0, -4.8 * sc, 5.4 * sc, 3.3 * sc, 0, 0, Math.PI * 2);
      ctx.arc(4.6 * sc, -7.2 * sc + headGraze * 0.6, 2.8 * sc, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(3.5 * sc, -9 * sc + headGraze * 0.6);
      ctx.lineTo(4.2 * sc, -11.8 * sc + headGraze * 0.6);
      ctx.lineTo(5.2 * sc, -9 * sc + headGraze * 0.6);
      ctx.fill();
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(5.6 * sc, -7.6 * sc + headGraze * 0.6, 0.7 * sc, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 'swan':
    case 'ground_bird': {
      const birdCol = animal.species === 'swan' ? '#ffffff' : '#38bdf8';
      ctx.fillStyle = birdCol;
      ctx.beginPath();
      ctx.ellipse(0, -4.6 * sc, 5.2 * sc, 3.3 * sc, 0, 0, Math.PI * 2);
      ctx.arc(4.4 * sc, -8.2 * sc + headGraze * 0.5, 2.2 * sc, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = shadeHex(birdCol, -15);
      ctx.beginPath();
      ctx.ellipse(-0.5 * sc, -4.8 * sc, 3.2 * sc, 1.8 * sc, -0.15, 0, Math.PI * 2);
      ctx.fill();
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
// 6. ULTRA-DETAILED TERRAIN & SMART ROAD / JUNCTION / TURN RENDERER
// ============================================================================
function isRoadType(t?: CreatorTerrainType): boolean {
  return Boolean(t && t.startsWith('road_asphalt'));
}

export function drawCustomCreatorTerrainTile(
  ctx: CanvasRenderingContext2D,
  pN: { x: number; y: number },
  pE: { x: number; y: number },
  pS: { x: number; y: number },
  pW: { x: number; y: number },
  terrainType: CreatorTerrainType,
  isNight: boolean,
  elapsedSec: number,
  gx: number = 0,
  gy: number = 0,
  allTerrainTiles?: Record<string, CreatorTerrainTile>
) {
  const cx = (pN.x + pS.x) * 0.5;
  const cy = (pE.y + pW.y) * 0.5;

  // Bilinear interpolation across the isometric diamond tile:
  // u in [0,1] goes from West (-X, pN->pW) to East (+X, pE->pS)
  // v in [0,1] goes from North (-Y, pN->pE) to South (+Y, pW->pS)
  const tilePt = (u: number, v: number) => {
    const northX = pN.x + (pE.x - pN.x) * u;
    const northY = pN.y + (pE.y - pN.y) * u;
    const southX = pW.x + (pS.x - pW.x) * u;
    const southY = pW.y + (pS.y - pW.y) * u;
    return {
      x: northX + (southX - northX) * v,
      y: northY + (southY - northY) * v,
    };
  };

  const fillIsoQuad = (u0: number, v0: number, u1: number, v1: number, color: string, strokeCol?: string) => {
    const q0 = tilePt(u0, v0);
    const q1 = tilePt(u1, v0);
    const q2 = tilePt(u1, v1);
    const q3 = tilePt(u0, v1);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(q0.x, q0.y);
    ctx.lineTo(q1.x, q1.y);
    ctx.lineTo(q2.x, q2.y);
    ctx.lineTo(q3.x, q3.y);
    ctx.closePath();
    ctx.fill();
    if (strokeCol) {
      ctx.strokeStyle = strokeCol;
      ctx.lineWidth = 0.65;
      ctx.stroke();
    }
  };

  // 1. Check if this tile belongs to the 16 Reference Image Textures
  const gridCell = TERRAIN_SPRITE_GRID_MAP[terrainType];
  if (gridCell) {
    const atlas = getTerrainAtlasImage();
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(pN.x, pN.y);
    ctx.lineTo(pE.x, pE.y);
    ctx.lineTo(pS.x, pS.y);
    ctx.lineTo(pW.x, pW.y);
    ctx.closePath();

    if (atlas && atlas.naturalWidth > 0) {
      ctx.save();
      ctx.clip();
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
    } else {
      ctx.fillStyle = isNight ? '#475569' : '#94a3b8';
      ctx.fill();
    }
    ctx.strokeStyle = 'rgba(15, 23, 42, 0.35)';
    ctx.lineWidth = 0.85;
    ctx.stroke();
    ctx.restore();
    return;
  }

  ctx.save();

  // 2. ROAD ASPHALT FAMILY (LURUS X, LURUS Y, PERTIGAAN, PEREMPATAN, BELOKAN + AUTO-CONNECT)
  if (terrainType.startsWith('road_asphalt')) {
    const asphaltFill = isNight ? '#1e293b' : '#334155';
    const curbFill = isNight ? '#64748b' : '#cbd5e1';
    const curbAccent = isNight ? '#475569' : '#94a3b8';
    const lineYellow = isNight ? '#eab308' : '#facc15';
    const lineWhite = isNight ? '#e2e8f0' : '#ffffff';

    // Determine which of the 4 cardinal directions are open road connections:
    // N (-Y, v=0), S (+Y, v=1), W (-X, u=0), E (+X, u=1)
    let openN = false;
    let openS = false;
    let openW = false;
    let openE = false;

    if (terrainType === 'road_asphalt') {
      // Smart Auto-Connect if neighbor road tiles exist, otherwise default to X-axis road
      const hasN = isRoadType(allTerrainTiles?.[`${gx},${gy - 1}`]?.terrainType);
      const hasS = isRoadType(allTerrainTiles?.[`${gx},${gy + 1}`]?.terrainType);
      const hasW = isRoadType(allTerrainTiles?.[`${gx - 1},${gy}`]?.terrainType);
      const hasE = isRoadType(allTerrainTiles?.[`${gx + 1},${gy}`]?.terrainType);
      const connCount = (hasN ? 1 : 0) + (hasS ? 1 : 0) + (hasW ? 1 : 0) + (hasE ? 1 : 0);
      if (connCount === 0) {
        openW = true;
        openE = true;
      } else if (connCount === 1) {
        if (hasN || hasS) {
          openN = true;
          openS = true;
        } else {
          openW = true;
          openE = true;
        }
      } else {
        openN = hasN;
        openS = hasS;
        openW = hasW;
        openE = hasE;
      }
    } else if (terrainType === 'road_asphalt_y') {
      openN = true;
      openS = true;
    } else if (terrainType === 'road_asphalt_cross') {
      openN = true;
      openS = true;
      openW = true;
      openE = true;
    } else if (terrainType === 'road_asphalt_t_north') {
      openW = true;
      openE = true;
      openN = true;
    } else if (terrainType === 'road_asphalt_t_south') {
      openW = true;
      openE = true;
      openS = true;
    } else if (terrainType === 'road_asphalt_t_east') {
      openN = true;
      openS = true;
      openE = true;
    } else if (terrainType === 'road_asphalt_t_west') {
      openN = true;
      openS = true;
      openW = true;
    } else if (terrainType === 'road_asphalt_turn_ne') {
      openN = true;
      openE = true;
    } else if (terrainType === 'road_asphalt_turn_nw') {
      openN = true;
      openW = true;
    } else if (terrainType === 'road_asphalt_turn_se') {
      openS = true;
      openE = true;
    } else if (terrainType === 'road_asphalt_turn_sw') {
      openS = true;
      openW = true;
    }

    // Base Asphalt Tile
    fillIsoQuad(0, 0, 1, 1, asphaltFill, 'rgba(15,23,42,0.4)');

    // Draw Sidewalk Curbs along closed edges & corner sidewalk blocks
    const cw = 0.16; // Curb width in tile UV
    if (!openN) {
      fillIsoQuad(0, 0, 1, cw, curbFill, curbAccent);
    }
    if (!openS) {
      fillIsoQuad(0, 1 - cw, 1, 1, curbFill, curbAccent);
    }
    if (!openW) {
      fillIsoQuad(0, 0, cw, 1, curbFill, curbAccent);
    }
    if (!openE) {
      fillIsoQuad(1 - cw, 0, 1, 1, curbFill, curbAccent);
    }
    // Corner sidewalk blocks when adjacent edges are open (for turns, T-junctions, 4-way crossroads)
    if (openN && openW) fillIsoQuad(0, 0, cw, cw, curbFill, curbAccent);
    if (openN && openE) fillIsoQuad(1 - cw, 0, 1, cw, curbFill, curbAccent);
    if (openS && openW) fillIsoQuad(0, 1 - cw, cw, 1, curbFill, curbAccent);
    if (openS && openE) fillIsoQuad(1 - cw, 1 - cw, 1, 1, curbFill, curbAccent);

    // Draw Yellow Dashed Center Lane Lines & White Crosswalks/Stop Bars
    const midCenter = tilePt(0.5, 0.5);
    const mN = tilePt(0.5, 0.08);
    const mS = tilePt(0.5, 0.92);
    const mW = tilePt(0.08, 0.5);
    const mE = tilePt(0.92, 0.5);

    ctx.strokeStyle = lineYellow;
    ctx.lineWidth = 1.6;
    ctx.setLineDash([4, 3]);

    const openTotal = (openN ? 1 : 0) + (openS ? 1 : 0) + (openW ? 1 : 0) + (openE ? 1 : 0);

    if (openTotal === 2 && ((openW && openE) || (openN && openS))) {
      // Straight X or Straight Y road
      ctx.beginPath();
      if (openW && openE) {
        ctx.moveTo(mW.x, mW.y);
        ctx.lineTo(mE.x, mE.y);
      } else {
        ctx.moveTo(mN.x, mN.y);
        ctx.lineTo(mS.x, mS.y);
      }
      ctx.stroke();
    } else if (openTotal === 2) {
      // 90-degree Turn (Belokan) — Smooth curved dashed yellow center line!
      const pStart = openN ? mN : mS;
      const pEnd = openE ? mE : mW;
      ctx.beginPath();
      ctx.moveTo(pStart.x, pStart.y);
      ctx.quadraticCurveTo(midCenter.x, midCenter.y, pEnd.x, pEnd.y);
      ctx.stroke();
    } else {
      // T-Junction (Pertigaan) or 4-Way Crossroad (Perempatan)
      ctx.beginPath();
      if (openN) {
        ctx.moveTo(mN.x, mN.y);
        ctx.lineTo(midCenter.x, midCenter.y);
      }
      if (openS) {
        ctx.moveTo(mS.x, mS.y);
        ctx.lineTo(midCenter.x, midCenter.y);
      }
      if (openW) {
        ctx.moveTo(mW.x, mW.y);
        ctx.lineTo(midCenter.x, midCenter.y);
      }
      if (openE) {
        ctx.moveTo(mE.x, mE.y);
        ctx.lineTo(midCenter.x, midCenter.y);
      }
      ctx.stroke();

      // White Zebra Crosswalk Stripes on Perempatan & Pertigaan
      ctx.setLineDash([]);
      ctx.strokeStyle = lineWhite;
      ctx.lineWidth = 1.3;
      if (openTotal === 4) {
        // 4-way crosswalk bars
        [0.32, 0.44, 0.56, 0.68].forEach((t) => {
          const zN1 = tilePt(t, 0.16);
          const zN2 = tilePt(t, 0.28);
          const zS1 = tilePt(t, 0.72);
          const zS2 = tilePt(t, 0.84);
          ctx.beginPath();
          ctx.moveTo(zN1.x, zN1.y);
          ctx.lineTo(zN2.x, zN2.y);
          ctx.moveTo(zS1.x, zS1.y);
          ctx.lineTo(zS2.x, zS2.y);
          ctx.stroke();
        });
      }
    }
    ctx.setLineDash([]);
    ctx.restore();
    return;
  }

  // 3. JALAN PAVING BATU (road_cobble) — Isometric 4x4 Interlocking Cobblestone Grid
  if (terrainType === 'road_cobble') {
    const mortarCol = isNight ? '#334155' : '#64748b';
    fillIsoQuad(0, 0, 1, 1, mortarCol);

    const cobbleTones = isNight
      ? ['#475569', '#64748b', '#52525b']
      : ['#cbd5e1', '#94a3b8', '#e2e8f0'];

    for (let r = 0; r < 4; r++) {
      const v0 = r * 0.25 + 0.03;
      const v1 = (r + 1) * 0.25 - 0.03;
      const shift = (r % 2) * 0.12;
      for (let c = 0; c < 4; c++) {
        const u0 = Math.min(0.96, c * 0.25 + shift + 0.03);
        const u1 = Math.min(0.97, (c + 1) * 0.25 + shift - 0.03);
        if (u1 > u0 + 0.05) {
          fillIsoQuad(u0, v0, u1, v1, cobbleTones[(r + c) % cobbleTones.length]);
        }
      }
    }
    ctx.restore();
    return;
  }

  // 4. JALAN TANAH SETAPAK (road_dirt) — Organic Earthen Trail with Grass Shoulders & Stepping Stones
  if (terrainType === 'road_dirt') {
    const grassEdge = isNight ? '#14532d' : '#22c55e';
    const dirtMain = isNight ? '#78350f' : '#c28b59';
    const dirtTrack = isNight ? '#451a03' : '#a36e3e';
    fillIsoQuad(0, 0, 1, 1, grassEdge);
    fillIsoQuad(0.08, 0.08, 0.92, 0.92, dirtMain);
    // Footpath ruts & stepping stones
    fillIsoQuad(0.18, 0.28, 0.82, 0.42, dirtTrack);
    fillIsoQuad(0.18, 0.58, 0.82, 0.72, dirtTrack);
    [
      [0.3, 0.35],
      [0.65, 0.62],
      [0.5, 0.48],
    ].forEach(([su, sv], idx) => {
      const sp = tilePt(su, sv);
      ctx.fillStyle = idx % 2 === 0 ? '#d6d3d1' : '#a8a29e';
      ctx.beginPath();
      ctx.ellipse(sp.x, sp.y, 3.2, 1.7, 0.2, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
    return;
  }

  // 5. DEK PAPAN KAYU (wood_deck) — 5 Isometric Timber Boardwalk Planks with Nail Heads & Grain
  if (terrainType === 'wood_deck') {
    const joistCol = isNight ? '#271202' : '#451a03';
    fillIsoQuad(0, 0, 1, 1, joistCol);
    const plankTones = isNight
      ? ['#78350f', '#713f12', '#854d0e']
      : ['#b45309', '#c26315', '#a14807'];

    for (let i = 0; i < 5; i++) {
      const v0 = i * 0.2 + 0.025;
      const v1 = (i + 1) * 0.2 - 0.025;
      fillIsoQuad(0.02, v0, 0.98, v1, plankTones[i % plankTones.length]);
      // Brass nail heads on left & right ends of each plank
      const nL = tilePt(0.08, (v0 + v1) * 0.5);
      const nR = tilePt(0.92, (v0 + v1) * 0.5);
      ctx.fillStyle = '#fde68a';
      ctx.beginPath();
      ctx.arc(nL.x, nL.y, 0.85, 0, Math.PI * 2);
      ctx.arc(nR.x, nR.y, 0.85, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    return;
  }

  // 6. UBIN PLAZA MARMER (plaza_marble) — 3x3 Polished Carrara Marble Sub-Tiles + Golden Compass Medallion
  if (terrainType === 'plaza_marble') {
    const baseMarble = isNight ? '#cbd5e1' : '#f8fafc';
    const altMarble = isNight ? '#94a3b8' : '#e2e8f0';
    const goldTrim = isNight ? '#ca8a04' : '#f59e0b';
    fillIsoQuad(0, 0, 1, 1, goldTrim);

    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        const u0 = c / 3 + 0.02;
        const u1 = (c + 1) / 3 - 0.02;
        const v0 = r / 3 + 0.02;
        const v1 = (r + 1) / 3 - 0.02;
        fillIsoQuad(u0, v0, u1, v1, (r + c) % 2 === 0 ? baseMarble : altMarble);
      }
    }
    // Center Golden Diamond Inlay
    const dN = tilePt(0.5, 0.34);
    const dE = tilePt(0.66, 0.5);
    const dS = tilePt(0.5, 0.66);
    const dW = tilePt(0.34, 0.5);
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.moveTo(dN.x, dN.y);
    ctx.lineTo(dE.x, dE.y);
    ctx.lineTo(dS.x, dS.y);
    ctx.lineTo(dW.x, dW.y);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    return;
  }

  // 7. PASIR PANTAI EMAS (sand_golden) — Wind-Blown Sand Ripples, Seashell & Coral Starfish
  if (terrainType === 'sand_golden') {
    const sandBase = isNight ? '#a16207' : '#fde047';
    const sandShadow = isNight ? '#854d0e' : '#facc15';
    fillIsoQuad(0, 0, 1, 1, sandBase, sandShadow);

    // Isometric sand ripple waves
    ctx.strokeStyle = isNight ? '#ca8a04' : '#eab308';
    ctx.lineWidth = 1.1;
    [0.25, 0.52, 0.78].forEach((rv) => {
      const rL = tilePt(0.15, rv);
      const rM = tilePt(0.5, rv - 0.06);
      const rR = tilePt(0.85, rv);
      ctx.beginPath();
      ctx.moveTo(rL.x, rL.y);
      ctx.quadraticCurveTo(rM.x, rM.y, rR.x, rR.y);
      ctx.stroke();
    });
    // Tiny coral starfish & white seashell on alternating tiles
    if (Math.abs(gx + gy) % 2 === 0) {
      const sf = tilePt(0.68, 0.36);
      ctx.fillStyle = '#fb7185';
      ctx.beginPath();
      ctx.arc(sf.x, sf.y, 1.9, 0, Math.PI * 2);
      ctx.fill();
    } else {
      const sh = tilePt(0.34, 0.66);
      ctx.fillStyle = '#fffbeb';
      ctx.beginPath();
      ctx.arc(sh.x, sh.y, 1.7, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    return;
  }

  // 8. HAMPARAN RUMPUT LAPANGAN (grass_open_meadow) & RUMPUT HIJAU ZAMRUD (grass_emerald)
  if (terrainType === 'grass_open_meadow' || terrainType === 'grass_emerald') {
    const isMeadow = terrainType === 'grass_open_meadow';
    const baseGreen = isNight
      ? isMeadow
        ? '#15803d'
        : '#047857'
      : isMeadow
      ? '#86efac'
      : '#22c55e';
    const stripeGreen = isNight
      ? isMeadow
        ? '#166534'
        : '#065f46'
      : isMeadow
      ? '#4ade80'
      : '#16a34a';

    fillIsoQuad(0, 0, 1, 1, baseGreen, stripeGreen);
    // Mowed lawn stripes in isometric projection
    fillIsoQuad(0, 0, 0.5, 1, stripeGreen);

    // Multi-blade grass tufts swaying gently
    const tuftCoords = [
      [0.25, 0.3],
      [0.72, 0.28],
      [0.5, 0.52],
      [0.28, 0.74],
      [0.75, 0.72],
    ];
    ctx.strokeStyle = isNight ? '#052e16' : '#15803d';
    ctx.lineWidth = 1.05;
    const sway = Math.sin(elapsedSec * 2.4 + gx * 0.7 + gy * 0.5) * 1.2;
    tuftCoords.forEach(([tu, tv], idx) => {
      const tp = tilePt(tu, tv);
      ctx.beginPath();
      ctx.moveTo(tp.x, tp.y);
      ctx.lineTo(tp.x - 1.8 + sway * 0.5, tp.y - 3.5);
      ctx.moveTo(tp.x, tp.y);
      ctx.lineTo(tp.x + 1.8 + sway * 0.5, tp.y - 3.2);
      ctx.stroke();

      // Tiny white clover / yellow dandelion blossoms in open meadow
      if (isMeadow && idx % 2 === 0) {
        ctx.fillStyle = idx === 0 ? '#ffffff' : '#fef08a';
        ctx.beginPath();
        ctx.arc(tp.x + 2, tp.y - 1.5, 1.3, 0, Math.PI * 2);
        ctx.fill();
      }
    });
    ctx.restore();
    return;
  }

  // 9. TANAH TAMAN BUNGA (flower_garden) — Manicured Hedge Border, Rich Mulch Bed & 9 Blooming Flowers
  if (terrainType === 'flower_garden') {
    const lawnBorder = isNight ? '#065f46' : '#16a34a';
    const soilBed = isNight ? '#451a03' : '#78350f';
    fillIsoQuad(0, 0, 1, 1, lawnBorder, '#15803d');
    fillIsoQuad(0.14, 0.14, 0.86, 0.86, soilBed, '#92400e');

    const flowerGrid = [
      { u: 0.28, v: 0.28, col: '#f43f5e' },
      { u: 0.5, v: 0.28, col: '#facc15' },
      { u: 0.72, v: 0.28, col: '#ec4899' },
      { u: 0.28, v: 0.5, col: '#a855f7' },
      { u: 0.5, v: 0.5, col: '#38bdf8' },
      { u: 0.72, v: 0.5, col: '#fb923c' },
      { u: 0.28, v: 0.72, col: '#f472b6' },
      { u: 0.5, v: 0.72, col: '#fde047' },
      { u: 0.72, v: 0.72, col: '#ef4444' },
    ];
    flowerGrid.forEach(({ u, v, col }) => {
      const fp = tilePt(u, v);
      // Green leaf base
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.arc(fp.x, fp.y + 0.8, 2.3, 0, Math.PI * 2);
      ctx.fill();
      // Flower petals
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(fp.x, fp.y - 0.6, 2.0, 0, Math.PI * 2);
      ctx.fill();
      // Pollen center
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(fp.x, fp.y - 0.6, 0.75, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
    return;
  }

  // 10. KOLAM AIR JERNIH (water_pond) — Stone Coping Border, Deep Aqua Gradient, Caustics, Lily Pad & Koi Silhouette
  if (terrainType === 'water_pond') {
    const stoneRim = isNight ? '#475569' : '#cbd5e1';
    const shallowWater = isNight ? '#0284c7' : '#38bdf8';
    const deepWater = isNight ? '#0369a1' : '#0ea5e9';

    // Check which neighbors are also water_pond so adjacent pond tiles merge seamlessly!
    const waterN = allTerrainTiles?.[`${gx},${gy - 1}`]?.terrainType === 'water_pond';
    const waterS = allTerrainTiles?.[`${gx},${gy + 1}`]?.terrainType === 'water_pond';
    const waterW = allTerrainTiles?.[`${gx - 1},${gy}`]?.terrainType === 'water_pond';
    const waterE = allTerrainTiles?.[`${gx + 1},${gy}`]?.terrainType === 'water_pond';

    fillIsoQuad(0, 0, 1, 1, shallowWater);
    fillIsoQuad(0.14, 0.14, 0.86, 0.86, deepWater);

    const rimW = 0.1;
    if (!waterN) fillIsoQuad(0, 0, 1, rimW, stoneRim);
    if (!waterS) fillIsoQuad(0, 1 - rimW, 1, 1, stoneRim);
    if (!waterW) fillIsoQuad(0, 0, rimW, 1, stoneRim);
    if (!waterE) fillIsoQuad(1 - rimW, 0, 1, 1, stoneRim);

    // Animated concentric water ripples
    const rWave = 3.2 + Math.sin(elapsedSec * 3.2 + gx + gy) * 1.6;
    ctx.strokeStyle = 'rgba(224, 242, 254, 0.72)';
    ctx.lineWidth = 1.05;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rWave * 1.9, rWave * 0.95, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Floating Lily Pad & Lotus Bud on alternating pond tiles
    if (Math.abs(gx * 3 + gy) % 2 === 0) {
      const lp = tilePt(0.36, 0.42);
      ctx.fillStyle = '#16a34a';
      ctx.beginPath();
      ctx.ellipse(lp.x, lp.y, 3.2, 1.7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f472b6';
      ctx.beginPath();
      ctx.arc(lp.x, lp.y - 1, 1.4, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Swimming orange fish silhouette beneath water
      const fishT = elapsedSec * 1.5 + gx;
      const fp = tilePt(0.5 + Math.cos(fishT) * 0.18, 0.5 + Math.sin(fishT) * 0.18);
      ctx.fillStyle = 'rgba(249, 115, 22, 0.85)';
      ctx.beginPath();
      ctx.ellipse(fp.x, fp.y, 2.6, 1.1, fishT, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
    return;
  }

  // ===========================================================================
  // 11. AUTHENTIC BUILT-IN REFLEKSIA CITY TERRAINS (8 TANAH BAWAAN KOTA & HUTAN)
  // ===========================================================================

  // 11A. TANAH RUMPUT BAWAAN KOTA (builtin_city_grass) — Exact #4a7c52 / #134e4a + 3-Blade Grass Tuft & 4-Petal Flower
  if (terrainType === 'builtin_city_grass') {
    const cityGrass = isNight ? '#134e4a' : '#4a7c52';
    const cityGrassStroke = isNight ? '#042f2e' : '#3d6944';
    fillIsoQuad(0, 0, 1, 1, cityGrass, cityGrassStroke);

    const sway = Math.sin(elapsedSec * 2.1 + gx * 0.6 + gy * 0.8) * 1.4;
    // Exact drawTidyGrassTuft from ThreeTownCanvas line 6985
    const drawBuiltinTuft = (tu: number, tv: number) => {
      const p = tilePt(tu, tv);
      ctx.fillStyle = isNight ? '#047857' : '#22c55e';
      ctx.beginPath();
      ctx.moveTo(p.x - 1.5, p.y);
      ctx.quadraticCurveTo(p.x - 3.5 + sway, p.y - 4, p.x - 4.5 + sway * 1.3, p.y - 6.5);
      ctx.quadraticCurveTo(p.x - 1.5 + sway * 0.5, p.y - 3, p.x - 0.3, p.y);
      ctx.fill();

      ctx.fillStyle = isNight ? '#10b981' : '#4ade80';
      ctx.beginPath();
      ctx.moveTo(p.x - 0.8, p.y);
      ctx.quadraticCurveTo(p.x + sway, p.y - 5.5, p.x + 0.5 + sway * 1.5, p.y - 8.5);
      ctx.quadraticCurveTo(p.x + 1.2 + sway * 0.5, p.y - 4.5, p.x + 0.8, p.y);
      ctx.fill();

      ctx.fillStyle = isNight ? '#059669' : '#16a34a';
      ctx.beginPath();
      ctx.moveTo(p.x + 0.3, p.y);
      ctx.quadraticCurveTo(p.x + 3.2 + sway, p.y - 3.5, p.x + 4.8 + sway * 1.2, p.y - 5.8);
      ctx.quadraticCurveTo(p.x + 2.2 + sway * 0.5, p.y - 2, p.x + 1.5, p.y);
      ctx.fill();
    };

    drawBuiltinTuft(0.32, 0.45);
    drawBuiltinTuft(0.7, 0.65);

    // Exact drawTidyFlower from ThreeTownCanvas line 7013 on alternating tiles
    if (Math.abs(gx + gy) % 2 === 0) {
      const fp = tilePt(0.62, 0.36);
      const petalColors = ['#f472b6', '#fbbf24', '#f87171', '#c084fc', '#60a5fa'];
      const pCol = petalColors[Math.abs(gx * 3 + gy) % petalColors.length];
      ctx.strokeStyle = isNight ? '#059669' : '#15803d';
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(fp.x, fp.y + 2.5);
      ctx.quadraticCurveTo(fp.x + sway * 0.4, fp.y - 1, fp.x + sway * 0.8, fp.y - 3.5);
      ctx.stroke();

      const headX = fp.x + sway * 0.8;
      const headY = fp.y - 3.5;
      const r = 1.65;
      ctx.fillStyle = pCol;
      [
        [0, -r],
        [r, 0],
        [0, r],
        [-r, 0],
      ].forEach(([ox, oy]) => {
        ctx.beginPath();
        ctx.arc(headX + ox, headY + oy, 1.35, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(headX, headY, 1.1, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
    return;
  }

  // 11B. TANAH HUTAN BELANTARA BAWAAN (builtin_forest_grass) — Exact #15803d / #064e3b + Shrub Bush & Berry
  if (terrainType === 'builtin_forest_grass') {
    const forestBase = isNight ? '#064e3b' : '#15803d';
    const forestStroke = isNight ? '#022c22' : '#14532d';
    fillIsoQuad(0, 0, 1, 1, forestBase, forestStroke);

    const sway = Math.sin(elapsedSec * 2.0 + gx + gy) * 1.1;
    // Exact drawForestBush from ThreeTownCanvas line 7054
    const bp = tilePt(0.5, 0.54);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
    ctx.beginPath();
    ctx.ellipse(bp.x, bp.y + 1.5, 6.8, 3.0, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = isNight ? '#064e3b' : '#14532d';
    ctx.beginPath();
    ctx.arc(bp.x - 3.4 + sway * 0.3, bp.y - 1.8, 3.8, 0, Math.PI * 2);
    ctx.arc(bp.x + 3.4 + sway * 0.3, bp.y - 1.8, 3.8, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = isNight ? '#047857' : '#16a34a';
    ctx.beginPath();
    ctx.arc(bp.x + sway * 0.45, bp.y - 3.8, 4.6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = isNight ? '#10b981' : '#4ade80';
    ctx.beginPath();
    ctx.arc(bp.x - 1.1 + sway * 0.5, bp.y - 5.2, 2.3, 0, Math.PI * 2);
    ctx.fill();

    if (Math.abs(gx + gy) % 2 === 0) {
      ctx.fillStyle = '#fb7185';
      ctx.beginPath();
      ctx.arc(bp.x + 1.8 + sway * 0.4, bp.y - 3.4, 1.1, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
    return;
  }

  // 11C. JALAN PUTIH UTAMA BAWAAN KOTA (builtin_city_road) — Exact #fcfaf2 / #475569 Boulevard Path
  if (terrainType === 'builtin_city_road') {
    const roadFill = isNight ? '#475569' : '#fcfaf2';
    const roadBorder = isNight ? '#334155' : '#e2e8f0';
    fillIsoQuad(0, 0, 1, 1, roadFill, roadBorder);
    fillIsoQuad(0.08, 0.08, 0.92, 0.92, roadFill, isNight ? '#64748b' : '#f1f5f9');
    ctx.restore();
    return;
  }

  // 11D. JALAN SETAPAK PEMANCINGAN BAWAAN (builtin_fishing_trail) — Exact #4d7c43 / #0f5132 Mossy Trail + Stepping Stones
  if (terrainType === 'builtin_fishing_trail') {
    const fishFill = isNight ? '#0f5132' : '#4d7c43';
    const fishBorder = isNight ? '#064e3b' : '#3f6836';
    fillIsoQuad(0, 0, 1, 1, fishFill, fishBorder);
    [
      [0.34, 0.36],
      [0.66, 0.64],
    ].forEach(([su, sv], idx) => {
      const sp = tilePt(su, sv);
      ctx.fillStyle = isNight ? '#64748b' : idx === 0 ? '#cbd5e1' : '#94a3b8';
      ctx.beginPath();
      ctx.ellipse(sp.x, sp.y, 3.8, 2.0, 0.15, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
    return;
  }

  // 11E. JALAN TANAH COKELAT SEBERANG TIMUR BAWAAN (builtin_east_dirt_road) — Exact #d97706 / #78350f
  if (terrainType === 'builtin_east_dirt_road') {
    const eastDirt = isNight ? '#78350f' : '#d97706';
    const eastBorder = isNight ? '#451a03' : '#b45309';
    fillIsoQuad(0, 0, 1, 1, eastDirt, eastBorder);
    fillIsoQuad(0.16, 0.16, 0.84, 0.84, isNight ? '#92400e' : '#f59e0b');
    ctx.restore();
    return;
  }

  // 11F. ASPAL LANDASAN BANDARA BAWAAN (builtin_airport_tarmac) — Exact #334155 / #1e293b + Centerline Dash
  if (terrainType === 'builtin_airport_tarmac') {
    const tarmacFill = isNight ? '#1e293b' : '#334155';
    const tarmacBorder = isNight ? '#0f172a' : '#475569';
    fillIsoQuad(0, 0, 1, 1, tarmacFill, tarmacBorder);
    const mW = tilePt(0.18, 0.5);
    const mE = tilePt(0.82, 0.5);
    ctx.strokeStyle = '#fde047';
    ctx.lineWidth = 1.4;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(mW.x, mW.y);
    ctx.lineTo(mE.x, mE.y);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
    return;
  }

  // 11G. RUMPUT DATARAN TINGGI PEGUNUNGAN BAWAAN (builtin_alpine_grass) — Exact #16a34a / #065f46 + Alpine Ridge Stone
  if (terrainType === 'builtin_alpine_grass') {
    const alpineFill = isNight ? '#065f46' : '#16a34a';
    const alpineBorder = isNight ? '#047857' : '#15803d';
    fillIsoQuad(0, 0, 1, 1, alpineFill, alpineBorder);
    const rp = tilePt(0.5, 0.5);
    ctx.fillStyle = isNight ? '#475569' : '#94a3b8';
    ctx.beginPath();
    ctx.ellipse(rp.x - 2, rp.y + 1, 3.2, 1.6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = isNight ? '#34d399' : '#86efac';
    ctx.beginPath();
    ctx.arc(rp.x + 2.5, rp.y - 1.5, 1.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    return;
  }

  // 11H. AIR SUNGAI & DANAU BAWAAN REFLEKSIA (builtin_river_water) — Exact #0284c7 / #0369a1 + Animated Shimmer Waves
  if (terrainType === 'builtin_river_water') {
    const riverBase = isNight ? '#0369a1' : '#0284c7';
    const riverStroke = isNight ? '#075985' : '#0369a1';
    fillIsoQuad(0, 0, 1, 1, riverBase, riverStroke);

    const waveShift = Math.sin(elapsedSec * 2.8 + gx * 0.9 + gy * 0.6) * 0.08;
    const w1L = tilePt(0.2, 0.35 + waveShift);
    const w1R = tilePt(0.75, 0.35 - waveShift);
    const w2L = tilePt(0.25, 0.68 - waveShift);
    const w2R = tilePt(0.8, 0.68 + waveShift);

    ctx.strokeStyle = isNight ? 'rgba(125, 211, 252, 0.45)' : 'rgba(224, 242, 254, 0.78)';
    ctx.lineWidth = 1.25;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(w1L.x, w1L.y);
    ctx.lineTo(w1R.x, w1R.y);
    ctx.moveTo(w2L.x, w2L.y);
    ctx.lineTo(w2R.x, w2R.y);
    ctx.stroke();

    ctx.restore();
    return;
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

    ctx.strokeStyle = railCol;
    ctx.lineWidth = fence.fenceModel === 'fence_stone_brick' ? 6 * sc : 2.4 * sc;
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y - 9.5 * sc);
    ctx.lineTo(p2.x, p2.y - 9.5 * sc);
    ctx.moveTo(p1.x, p1.y - 4 * sc);
    ctx.lineTo(p2.x, p2.y - 4 * sc);
    ctx.stroke();

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
