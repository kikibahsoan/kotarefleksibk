import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeCreatorAnimalLivePose,
  shadeHex,
  drawCustomCreatorBuilding3D,
  drawCustomCreatorProp3D,
  drawCustomCreatorAnimal3D,
  drawCustomCreatorTerrainTile,
  drawCustomCreatorFence3D,
} from './creatorStudioRenderer.ts';
import {
  CreatorBuildingItem,
  CreatorPropItem,
  CreatorAnimalItem,
  CreatorTerrainType,
  CreatorFenceItem,
  CreatorModelType,
  CreatorPropModel,
  CreatorAnimalSpecies,
} from '../types/index.ts';

function createMockCanvasContext(): CanvasRenderingContext2D {
  const noop = () => {};
  const mockGradient = { addColorStop: noop };
  return new Proxy(
    {
      fillStyle: '#000',
      strokeStyle: '#000',
      lineWidth: 1,
      lineCap: 'butt',
      font: '10px sans-serif',
      textAlign: 'center',
      textBaseline: 'middle',
      measureText: (t: string) => ({ width: t.length * 6 }),
      createRadialGradient: () => mockGradient,
      createLinearGradient: () => mockGradient,
    },
    {
      get(target, prop) {
        if (prop in target) return (target as Record<string | symbol, unknown>)[prop];
        return noop;
      },
      set(target, prop, value) {
        (target as Record<string | symbol, unknown>)[prop] = value;
        return true;
      },
    }
  ) as unknown as CanvasRenderingContext2D;
}

const mockProject = (wx: number, wy: number, wz: number) => ({
  x: 500 + (wx - wy) * 38,
  y: 400 + (wx + wy) * 19 - wz * 38,
});

test('shadeHex adjusts hex RGB brightness accurately', () => {
  const lighter = shadeHex('#204060', 20);
  assert.ok(lighter.startsWith('rgb('));
});

test('computeCreatorAnimalLivePose respects diurnal/nocturnal sleep cycles and active behavior cycles', () => {
  const deer: CreatorAnimalItem = {
    id: 'deer-1',
    species: 'deer_stag',
    name: 'Rusa Emas',
    homeWx: 2,
    homeWy: 3,
    scale: 1,
    speed: 0.8,
    wanderRadius: 2,
    timeCycle: 'diurnal',
    behaviorCycle: 'graze_wander',
    cycleDurationSec: 10,
  };

  // At night, diurnal animal sleeps at home
  const nightPose = computeCreatorAnimalLivePose(deer, 15, true);
  assert.equal(nightPose.isSleeping, true);
  assert.equal(nightPose.wx, 2);
  assert.equal(nightPose.wy, 3);
  assert.equal(nightPose.cycleBadge, '💤 Tidur');

  // During day, diurnal animal is awake
  const dayPose = computeCreatorAnimalLivePose(deer, 15, false);
  assert.equal(dayPose.isSleeping, false);
});

test('all 14 building models, 32 prop models, 10 animal species, 26 terrain types, and 5 fence models render without error', () => {
  const ctx = createMockCanvasContext();

  const buildingModels: CreatorModelType[] = [
    'modern_tower',
    'innovation_lab',
    'school_pavilion',
    'creative_studio',
    'office_hq',
    'arcade_arena',
    'concert_stage',
    'ferris_park',
    'esports_dome',
    'open_cafe',
    'reading_gazebo',
    'fountain_plaza',
    'info_kiosk',
    'sakura_park',
  ];

  for (const modelType of buildingModels) {
    const b: CreatorBuildingItem = {
      id: `b-${modelType}`,
      name: `Test ${modelType}`,
      tagline: 'Refleksia Test',
      icon: '🏛️',
      category: 'gedung_kantor',
      modelType,
      wx: 0,
      wy: 0,
      scale: 1,
      accentColor: '#38bdf8',
      roofColor: '#0284c7',
      hasCollision: false,
      templateType: 'facility_info',
      templateData: { welcomeText: 'Hi', xpReward: 10 },
      createdBy: 'kikybahsoan',
      updatedAt: 'now',
    };
    drawCustomCreatorBuilding3D(ctx, mockProject, 38, b, 1000, false, true, false);
  }

  const propModels: CreatorPropModel[] = [
    'tree_oak_apple',
    'tree_pine_spruce',
    'tree_sakura_pink',
    'tree_banyan_shady',
    'tree_palm_tropical',
    'tree_autumn_maple',
    'bench_wood_classic',
    'bench_white_minimal',
    'bench_stone_marble',
    'bench_picnic_table',
    'bench_royal_gold',
    'swing_wood_garden',
    'swing_cyan_modern',
    'campfire_stone_ring',
    'campfire_royal_brazier',
    'playground_slide_colorful',
    'playground_seesaw_dual',
    'playground_spring_rider',
    'playground_combo_castle',
    'court_basketball_full',
    'court_futsal_green',
    'court_badminton_pro',
    'open_green_field',
    'shrub_flowering_azalea',
    'shrub_topiary_spiral',
    'plant_monstera_pot',
    'plant_flower_bed_trio',
    'shrub_bamboo_zen',
    'water_fountain_tiered',
    'water_koi_pond_lotus',
    'water_mini_waterfall',
    'water_dancing_jets',
  ];

  for (const propModel of propModels) {
    const p: CreatorPropItem = {
      id: `p-${propModel}`,
      propCategory: propModel.startsWith('court_') || propModel === 'open_green_field' ? 'sports_court' : 'tree',
      propModel,
      name: propModel,
      wx: 1,
      wy: 1,
      facing: 'down-right',
      scale: 1,
    };
    drawCustomCreatorProp3D(ctx, mockProject, 38, p, 1200, true);
  }

  const speciesList: CreatorAnimalSpecies[] = [
    'deer_stag',
    'deer_doe',
    'kancil',
    'rabbit',
    'squirrel',
    'fox',
    'ground_bird',
    'swan',
    'cat',
    'butterfly_flock',
  ];

  for (const species of speciesList) {
    const a: CreatorAnimalItem = {
      id: `a-${species}`,
      species,
      name: species,
      homeWx: 0,
      homeWy: 0,
      scale: 1,
      speed: 0.8,
      wanderRadius: 1.5,
      timeCycle: 'all_day',
      behaviorCycle: 'graze_wander',
      cycleDurationSec: 12,
    };
    drawCustomCreatorAnimal3D(ctx, mockProject, 38, a, 12.5, false, true);
  }

  const terrainTypes: CreatorTerrainType[] = [
    'road_asphalt',
    'road_cobble',
    'road_dirt',
    'wood_deck',
    'plaza_marble',
    'sand_golden',
    'flower_garden',
    'grass_emerald',
    'grass_open_meadow',
    'water_pond',
    'img_paving_herringbone_red',
    'img_paving_basketweave_brown',
    'img_paving_herringbone_grey',
    'img_paving_hex_blue',
    'img_stone_river_grey',
    'img_stone_pebble_cream',
    'img_stone_flagstone_brown',
    'img_tile_dotted_grey',
    'img_brick_running_pastel',
    'img_paving_parquet_taupe',
    'img_wood_plank_terracotta',
    'img_brick_checker_red',
    'img_cobble_rounded_cream',
    'img_brick_classic_orange',
    'img_paving_lattice_red',
    'img_tile_diamond_gold',
  ];

  for (const tt of terrainTypes) {
    drawCustomCreatorTerrainTile(
      ctx,
      { x: 100, y: 80 },
      { x: 138, y: 99 },
      { x: 100, y: 118 },
      { x: 62, y: 99 },
      tt,
      false,
      5.0
    );
  }

  const fenceModels: CreatorFenceItem['fenceModel'][] = [
    'fence_wood_rustic',
    'fence_white_picket',
    'fence_iron_gold',
    'fence_hedge_bush',
    'fence_stone_brick',
  ];

  for (const fenceModel of fenceModels) {
    drawCustomCreatorFence3D(
      ctx,
      mockProject,
      38,
      {
        id: `f-${fenceModel}`,
        fenceModel,
        name: fenceModel,
        wx: 0,
        wy: 0,
        axis: 'x',
        lengthTiles: 3,
        hasCollision: true,
      },
      true
    );
  }
});
