import React, { useState } from 'react';
import {
  AnimalBehaviorCycle,
  AnimalTimeCycle,
  CityCreatorState,
  CreatorAnimalItem,
  CreatorAnimalSpecies,
  CreatorBuildingCategory,
  CreatorBuildingItem,
  CreatorFenceItem,
  CreatorFenceModel,
  CreatorModelType,
  CreatorNpcConfig,
  CreatorPropCategory,
  CreatorPropItem,
  CreatorPropModel,
  CreatorQuizItem,
  CreatorTemplateType,
  CreatorTerrainType,
  ExistingObjectOverride,
  NpcMovementMode,
  Student,
} from '../../types/index.ts';
import { StorageService } from '../../utils/storage.ts';
import {
  Sparkles,
  Building2,
  Gamepad2,
  Trees,
  Users,
  Settings2,
  Save,
  Plus,
  Trash2,
  RotateCcw,
  Navigation,
  Grid,
  Move,
  CheckCircle2,
  Lightbulb,
  ThumbsUp,
  Trophy,
  ExternalLink,
  Compass,
  MapPin,
  X,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Footprints,
  MessageSquarePlus,
  Flame,
  PawPrint,
  Paintbrush,
  Fence,
  Eraser,
  Armchair,
} from 'lucide-react';

export interface StockModelDefinition {
  modelType: CreatorModelType;
  category: CreatorBuildingCategory;
  defaultName: string;
  defaultTagline: string;
  icon: string;
  accentColor: string;
  roofColor: string;
  defaultTemplate: CreatorTemplateType;
  description: string;
}

export const CREATOR_STOCK_MODELS: StockModelDefinition[] = [
  // Kategori 1: Gedung Modern, Sekolah, Laboratorium & Kantor
  {
    modelType: 'modern_tower',
    category: 'gedung_kantor',
    defaultName: 'Menara Inovasi Digital',
    defaultTagline: 'Pusat Riset & Kolaborasi Masa Depan',
    icon: '🏙️',
    accentColor: '#38bdf8',
    roofColor: '#0284c7',
    defaultTemplate: 'facility_info',
    description: 'Gedung kaca bertingkat bergaya futuristik dengan helipad dan fasad neon.',
  },
  {
    modelType: 'innovation_lab',
    category: 'gedung_kantor',
    defaultName: 'Laboratorium Sains & AI',
    defaultTagline: 'Eksperimen Teknologi & Desain Masa Kini',
    icon: '🔬',
    accentColor: '#a855f7',
    roofColor: '#7e22ce',
    defaultTemplate: 'games',
    description: 'Gedung kubah observatorium & kincir energi dengan antena radar.',
  },
  {
    modelType: 'school_pavilion',
    category: 'gedung_kantor',
    defaultName: 'Paviliun Akademi Kreatif',
    defaultTagline: 'Kelas Terbuka & Galeri Karya Siswa',
    icon: '🏫',
    accentColor: '#f59e0b',
    roofColor: '#d97706',
    defaultTemplate: 'community_mission',
    description: 'Bangunan sekolah modern beratap pelana hangat dengan jam menara.',
  },
  {
    modelType: 'creative_studio',
    category: 'gedung_kantor',
    defaultName: 'Studio Animasi & Sinema',
    defaultTagline: 'Ruang Produksi Visual & Multimedia',
    icon: '🎬',
    accentColor: '#ec4899',
    roofColor: '#be185d',
    defaultTemplate: 'ideas',
    description: 'Studio produksi kreatif dengan papan billboard LED dan lampu sorot.',
  },
  {
    modelType: 'office_hq',
    category: 'gedung_kantor',
    defaultName: 'Kantor Pusat Start-Up Warga',
    defaultTagline: 'Inkubator Bisnis & Karya Kewirausahaan',
    icon: '🏢',
    accentColor: '#10b981',
    roofColor: '#047857',
    defaultTemplate: 'ideas',
    description: 'Gedung kantor kembar dengan skybridge dan taman atap hijau.',
  },

  // Kategori 2: Arena Games, Taman Hiburan & Panggung Acara
  {
    modelType: 'arcade_arena',
    category: 'arena_hiburan',
    defaultName: 'Arena Arcade & Kuis Kilat',
    defaultTagline: 'Tantangan Berpikir Cepat & Tangkas',
    icon: '🕹️',
    accentColor: '#f43f5e',
    roofColor: '#be123c',
    defaultTemplate: 'games',
    description: 'Gedung game center neon dengan ornamen joystick raksasa di atap.',
  },
  {
    modelType: 'concert_stage',
    category: 'arena_hiburan',
    defaultName: 'Panggung Festival Warga',
    defaultTagline: 'Pentas Seni, Musik & Apresiasi Karya',
    icon: '🎸',
    accentColor: '#8b5cf6',
    roofColor: '#5b21b6',
    defaultTemplate: 'community_mission',
    description: 'Panggung terbuka lengkap dengan rigging lampu konser dan speaker.',
  },
  {
    modelType: 'ferris_park',
    category: 'arena_hiburan',
    defaultName: 'Taman Bianglala Refleksia',
    defaultTagline: 'Wahana Rekreasi & Spot Foto Kota',
    icon: '🎡',
    accentColor: '#fb7185',
    roofColor: '#e11d48',
    defaultTemplate: 'facility_info',
    description: 'Wahana kincir ria warna-warni yang berputar anggun di langit kota.',
  },
  {
    modelType: 'esports_dome',
    category: 'arena_hiburan',
    defaultName: 'Kubah Turnamen E-Sports',
    defaultTagline: 'Kompetisi Strategi & Kolaborasi Tim',
    icon: '🏆',
    accentColor: '#06b6d4',
    roofColor: '#0e7490',
    defaultTemplate: 'games',
    description: 'Stadion kubah heksagonal bercahaya siber dengan layar skor.',
  },

  // Kategori 3: Fasilitas Publik, Kafe, Taman & Dekorasi Kota
  {
    modelType: 'open_cafe',
    category: 'fasilitas_taman',
    defaultName: 'Kafe Teras Senja',
    defaultTagline: 'Tempat Diskusi Santai & Bertukar Ide',
    icon: '☕',
    accentColor: '#f97316',
    roofColor: '#c2410c',
    defaultTemplate: 'ideas',
    description: 'Kafe outdoor beratap kanopi garis-garis dengan meja payung warga.',
  },
  {
    modelType: 'reading_gazebo',
    category: 'fasilitas_taman',
    defaultName: 'Gazebo Baca & Diskusi',
    defaultTagline: 'Sudut Tenang Merangkai Gagasan',
    icon: '🛖',
    accentColor: '#14b8a6',
    roofColor: '#0f766e',
    defaultTemplate: 'facility_info',
    description: 'Gazebo kayu tropis dikelilingi tanaman hias dan rak buku mini.',
  },
  {
    modelType: 'fountain_plaza',
    category: 'fasilitas_taman',
    defaultName: 'Plaza Air Mancur Harmoni',
    defaultTagline: 'Titik Kumpul & Kolaborasi Warga Kota',
    icon: '⛲',
    accentColor: '#38bdf8',
    roofColor: '#0369a1',
    defaultTemplate: 'community_mission',
    description: 'Kolam air mancur marmer bertingkat dengan bangku taman melingkar.',
  },
  {
    modelType: 'info_kiosk',
    category: 'fasilitas_taman',
    defaultName: 'Anjungan Informasi Pintar',
    defaultTagline: 'Portal Pengumuman & Kotak Suara Digital',
    icon: '📟',
    accentColor: '#eab308',
    roofColor: '#a16207',
    defaultTemplate: 'ideas',
    description: 'Kios informasi digital modern dengan layar interaktif bercahaya.',
  },
  {
    modelType: 'sakura_park',
    category: 'fasilitas_taman',
    defaultName: 'Taman Sakura & Lentera',
    defaultTagline: 'Taman Inspirasi Visual & Ketenangan',
    icon: '🌸',
    accentColor: '#f472b6',
    roofColor: '#db2777',
    defaultTemplate: 'facility_info',
    description: 'Taman pohon sakura merah muda dengan jembatan kecil dan lentera.',
  },

  // Kategori 4: Model Objek Kota Bawaan (Siap Ditambahkan Baru ke Peta)
  {
    modelType: 'builtin_balai_kota',
    category: 'objek_bawaan',
    defaultName: 'Balai Kota Kubah Emas',
    defaultTagline: 'Pusat Pemerintahan & Misi Warga',
    icon: '🏛️',
    accentColor: '#eab308',
    roofColor: '#ca8a04',
    defaultTemplate: 'community_mission',
    description: 'Model asli Balai Kota Refleksia lengkap dengan 4 pilar klasik, jam menara, dan kubah emas.',
  },
  {
    modelType: 'builtin_studio_onair',
    category: 'objek_bawaan',
    defaultName: 'Studio Podcast ON AIR',
    defaultTagline: 'Penyiaran Suara, Diskusi & Kreativitas Warga',
    icon: '🎙️',
    accentColor: '#ef4444',
    roofColor: '#1e1b4b',
    defaultTemplate: 'ideas',
    description: 'Model asli Studio ON AIR dengan menara pemancar radio dan papan neon menyala.',
  },
  {
    modelType: 'builtin_perpustakaan',
    category: 'objek_bawaan',
    defaultName: 'Perpustakaan Kampus Biru',
    defaultTagline: 'Pusat Literasi, Referensi & Modul',
    icon: '📚',
    accentColor: '#3b82f6',
    roofColor: '#1d4ed8',
    defaultTemplate: 'facility_info',
    description: 'Model asli gedung Perpustakaan Kampus klasik dengan pediment segitiga & jendela lengkung.',
  },
  {
    modelType: 'builtin_pasar_prestasi',
    category: 'objek_bawaan',
    defaultName: 'Pasar Prestasi & Galeri',
    defaultTagline: 'Apresiasi Karya & Papan Peringkat Warga',
    icon: '🏆',
    accentColor: '#f97316',
    roofColor: '#ea580c',
    defaultTemplate: 'games',
    description: 'Model asli Pasar Prestasi dengan kanopi belang meriah, etalase piala, dan bendera.',
  },
  {
    modelType: 'builtin_kantor_pos',
    category: 'objek_bawaan',
    defaultName: 'Kantor Pos Kilat Kota',
    defaultTagline: 'Layanan Surat, Aspirasi & Pesan Warga',
    icon: '📮',
    accentColor: '#f43f5e',
    roofColor: '#be123c',
    defaultTemplate: 'ideas',
    description: 'Model asli Kantor Pos Refleksia lengkap dengan kotak surat merah ikonik di halaman.',
  },
  {
    modelType: 'builtin_taman_refleksi',
    category: 'objek_bawaan',
    defaultName: 'Paviliun Pusat Refleksi',
    defaultTagline: 'Ruang Kontemplasi & Jurnal Refleksi Warga',
    icon: '🌍',
    accentColor: '#10b981',
    roofColor: '#047857',
    defaultTemplate: 'community_mission',
    description: 'Model asli Paviliun Kubah Kaca Hijau Zamrud dengan kristal refleksi berputar.',
  },
  {
    modelType: 'builtin_lab_dkv',
    category: 'objek_bawaan',
    defaultName: 'Laboratorium DKV & Sains',
    defaultTagline: 'Eksperimen Visual, Sains Atom & Kuis',
    icon: '⚛️',
    accentColor: '#06b6d4',
    roofColor: '#0e7490',
    defaultTemplate: 'games',
    description: 'Model asli Lab DKV dengan instalasi cincin orbit elektron dan inti atom bercahaya.',
  },
  {
    modelType: 'builtin_masjid',
    category: 'objek_bawaan',
    defaultName: 'Masjid Al-Hikmah',
    defaultTagline: 'Pusat Ibadah, Kajian & Ketenangan Batin',
    icon: '🕌',
    accentColor: '#10b981',
    roofColor: '#059669',
    defaultTemplate: 'facility_info',
    description: 'Model asli Masjid Al-Hikmah dengan kubah zamrud, bulan sabit emas, dan menara.',
  },
  {
    modelType: 'builtin_bank_materi',
    category: 'objek_bawaan',
    defaultName: 'Gedung Bank Materi',
    defaultTagline: 'Khazanah Modul, Kurikulum & Tantangan',
    icon: '🏦',
    accentColor: '#fbbf24',
    roofColor: '#1e293b',
    defaultTemplate: 'facility_info',
    description: 'Model asli Bank Materi bergaya neoklasik dengan 4 pilar marmer dan mahkota emas.',
  },
  {
    modelType: 'builtin_pencakar_langit',
    category: 'objek_bawaan',
    defaultName: 'Menara Pencakar Langit Timur',
    defaultTagline: 'Mercusuar Cita-Cita & Karier Masa Depan',
    icon: '🏙️',
    accentColor: '#38bdf8',
    roofColor: '#0284c7',
    defaultTemplate: 'games',
    description: 'Model asli Gedung Pencakar Langit bertingkat dengan fasad kaca siber dan puncak spire.',
  },
  {
    modelType: 'builtin_bandara',
    category: 'objek_bawaan',
    defaultName: 'Terminal Bandara & Pesawat',
    defaultTagline: 'Gerbang Penerbangan & Eksplorasi Global',
    icon: '✈️',
    accentColor: '#0ea5e9',
    roofColor: '#0369a1',
    defaultTemplate: 'facility_info',
    description: 'Model asli Terminal Bandara Refleksia dengan menara ATC berputar dan pesawat jet.',
  },
  {
    modelType: 'builtin_lapak_cafe',
    category: 'objek_bawaan',
    defaultName: 'Lapak Kuliner Refleksia',
    defaultTagline: 'Kedai Kopi, Roti Hangat & Obrolan Warga',
    icon: '☕',
    accentColor: '#f97316',
    roofColor: '#c2410c',
    defaultTemplate: 'ideas',
    description: 'Model asli Lapak Kafe Bawaan dengan kanopi terakota, meja bar, dan meja payung.',
  },
  {
    modelType: 'builtin_beringin_rumah_pohon',
    category: 'objek_bawaan',
    defaultName: 'Pohon Beringin & Rumah Pohon',
    defaultTagline: 'Pohon Raksasa Rindang Tempat Gantung Jurnal',
    icon: '🌳',
    accentColor: '#16a34a',
    roofColor: '#15803d',
    defaultTemplate: 'community_mission',
    description: 'Model asli Pohon Beringin Agung lengkap dengan akar gantung, rumah pohon, dan tangga.',
  },
  {
    modelType: 'builtin_sudut_literasi',
    category: 'objek_bawaan',
    defaultName: 'Pergola Sudut Literasi',
    defaultTagline: 'Taman Baca Terbuka & Rak Buku Warga',
    icon: '📖',
    accentColor: '#14b8a6',
    roofColor: '#0f766e',
    defaultTemplate: 'facility_info',
    description: 'Model asli Sudut Literasi dengan rak buku warna-warni, karpet baca, dan kanopi.',
  },
  {
    modelType: 'builtin_papan_pengumuman',
    category: 'objek_bawaan',
    defaultName: 'Papan Pengumuman Kota',
    defaultTagline: 'Informasi Resmi, Tata Tertib & Agenda Warga',
    icon: '📋',
    accentColor: '#f59e0b',
    roofColor: '#78350f',
    defaultTemplate: 'facility_info',
    description: 'Model asli Papan Pengumuman beratap sirap kayu lengkap dengan kertas pengumuman.',
  },
];

// ============================================================================
// 1. KATALOG PROPERTI TAMAN BARU (POHON, TEMPAT DUDUK, AYUNAN, API UNGGUN)
// ============================================================================

export interface CreatorPropCatalogEntry {
  model: CreatorPropModel;
  category: CreatorPropCategory;
  name: string;
  icon: string;
  description: string;
}

export const CREATOR_PROP_CATALOG: CreatorPropCatalogEntry[] = [
  // 6 Model Pohon
  {
    model: 'tree_oak_apple',
    category: 'tree',
    name: 'Pohon Apel Rindang',
    icon: '🌳',
    description: 'Pohon hijau lebat dengan buah apel merah segar.',
  },
  {
    model: 'tree_pine_spruce',
    category: 'tree',
    name: 'Pohon Pinus Cemara',
    icon: '🌲',
    description: 'Pohon cemara pegunungan bertingkat tiga yang sejuk.',
  },
  {
    model: 'tree_sakura_pink',
    category: 'tree',
    name: 'Pohon Sakura Merah Muda',
    icon: '🌸',
    description: 'Pohon sakura Jepang dengan kelopak bunga berguguran.',
  },
  {
    model: 'tree_banyan_shady',
    category: 'tree',
    name: 'Pohon Beringin Teduh',
    icon: '🌿',
    description: 'Pohon beringin besar lengkap dengan akar gantung.',
  },
  {
    model: 'tree_palm_tropical',
    category: 'tree',
    name: 'Pohon Palem Tropis',
    icon: '🌴',
    description: 'Pohon kelapa pantai dengan buah kelapa dan pelepah melengkung.',
  },
  {
    model: 'tree_autumn_maple',
    category: 'tree',
    name: 'Pohon Maple Musim Gugur',
    icon: '🍁',
    description: 'Pohon daun jingga keemasan hangat khas musim gugur.',
  },

  // 5 Model Tempat Duduk / Bangku
  {
    model: 'bench_wood_classic',
    category: 'bench',
    name: 'Bangku Kayu Klasik',
    icon: '🪑',
    description: 'Bangku taman kayu jati hangat dengan sandaran punggung.',
  },
  {
    model: 'bench_white_minimal',
    category: 'bench',
    name: 'Bangku Plaza Putih Minimalis',
    icon: '🛋️',
    description: 'Bangku putih elegan bergaya modern dengan aksen emas.',
  },
  {
    model: 'bench_stone_marble',
    category: 'bench',
    name: 'Bangku Batu Marmer',
    icon: '🪨',
    description: 'Tempat duduk batu marmer ukir yang kokoh di taman.',
  },
  {
    model: 'bench_picnic_table',
    category: 'bench',
    name: 'Meja & Bangku Piknik Kayu',
    icon: '🧺',
    description: 'Set meja piknik kayu lengkap dengan 2 bangku panjang.',
  },
  {
    model: 'bench_royal_gold',
    category: 'bench',
    name: 'Bangku Taman Kencana Emas',
    icon: '👑',
    description: 'Bangku beludru merah marun dengan ukiran sandaran emas.',
  },

  // 2 Model Ayunan
  {
    model: 'swing_wood_garden',
    category: 'swing',
    name: 'Ayunan Kayu Taman (2 Kursi)',
    icon: '🎠',
    description: 'Ayunan tiang kayu klasik dengan kanopi daun dan 2 dudukan.',
  },
  {
    model: 'swing_cyan_modern',
    category: 'swing',
    name: 'Ayunan Besi Modern Cyan',
    icon: '🎡',
    description: 'Ayunan rangka baja pirus modern yang berayun lembut.',
  },

  // 2 Model Api Unggun
  {
    model: 'campfire_stone_ring',
    category: 'campfire',
    name: 'Api Unggun Batu Lingkar',
    icon: '🔥',
    description: 'Api unggun kayu bakar dikelilingi batu kali dengan percikan bara.',
  },
  {
    model: 'campfire_royal_brazier',
    category: 'campfire',
    name: 'Tungku Api Besi Kencana',
    icon: '🏮',
    description: 'Tungku obor perunggu berukir emas dengan nyala api berkobar.',
  },

  // 4 Model Playground Anak (Perosotan, Jungkat-Jungkit, Kuda Pegas, Istana Playground)
  {
    model: 'playground_slide_colorful',
    category: 'playground',
    name: 'Perosotan Anak Pelangi',
    icon: '🛝',
    description: 'Perosotan anak warna-warni lengkap dengan tangga panjat dan atap menara.',
  },
  {
    model: 'playground_seesaw_dual',
    category: 'playground',
    name: 'Jungkat-Jungkit Taman Ganda',
    icon: '⚖️',
    description: 'Permainan jungkat-jungkit 2 anak yang bergerak naik-turun secara dinamis.',
  },
  {
    model: 'playground_spring_rider',
    category: 'playground',
    name: 'Kuda-Kudaan Pegas Taman',
    icon: '🎠',
    description: 'Wahana kuda pegas kuning ceria yang membal lembut di taman bermain.',
  },
  {
    model: 'playground_combo_castle',
    category: 'playground',
    name: 'Istana Playground Anak Lengkap',
    icon: '🏰',
    description: 'Paket kombo rumah menara, jembatan gantung, dan perosotan ganda anak.',
  },

  // 4 Model Lapangan Olahraga & Hamparan Lapangan Terbuka (Basket, Futsal, Badminton, Rumput)
  {
    model: 'court_basketball_full',
    category: 'sports_court',
    name: 'Lapangan Basket Streetball',
    icon: '🏀',
    description: 'Lapangan basket lengkap dengan garis three-point, 2 tiang ring, dan bola memantul.',
  },
  {
    model: 'court_futsal_green',
    category: 'sports_court',
    name: 'Lapangan Futsal Rumput Sintetis',
    icon: '⚽',
    description: 'Lapangan futsal rumput hijau bergaris putih dengan 2 gawang jaring dan bola.',
  },
  {
    model: 'court_badminton_pro',
    category: 'sports_court',
    name: 'Lapangan Badminton / Bulu Tangkis',
    icon: '🏸',
    description: 'Karpet lapangan badminton hijau zamrud lengkap dengan tiang net tengah & shuttlecock.',
  },
  {
    model: 'open_green_field',
    category: 'sports_court',
    name: 'Hamparan Rumput / Lapangan Terbuka',
    icon: '⛳',
    description: 'Hamparan lapangan rumput hijau terbuka bertekstur halus untuk upacara atau piknik.',
  },

  // 5 Model Semak & Tanaman Hias
  {
    model: 'shrub_flowering_azalea',
    category: 'shrub_plant',
    name: 'Semak Bunga Azalea Rimbun',
    icon: '🌺',
    description: 'Rumpun semak hijau bulat bertabur kelopak bunga azalea merah muda & putih.',
  },
  {
    model: 'shrub_topiary_spiral',
    category: 'shrub_plant',
    name: 'Tanaman Hias Topiary Spiral',
    icon: '🪴',
    description: 'Pohon semak pangkas spiral artistik di dalam pot terakota taman.',
  },
  {
    model: 'plant_monstera_pot',
    category: 'shrub_plant',
    name: 'Pot Tanaman Hias Monstera',
    icon: '🌿',
    description: 'Tanaman daun monstera tropis lebar di dalam pot keramik putih.',
  },
  {
    model: 'plant_flower_bed_trio',
    category: 'shrub_plant',
    name: 'Petak Kotak Tanaman Bunga Hias',
    icon: '🌷',
    description: 'Kotak planter kayu berisi deretan tulip, lavender, dan marigold warna-warni.',
  },
  {
    model: 'shrub_bamboo_zen',
    category: 'shrub_plant',
    name: 'Rumpun Bambu Hias Zen',
    icon: '🎋',
    description: 'Barisan batang bambu hijau segar dengan batu taman yang menenangkan.',
  },

  // 4 Model Kolam, Air Mancur & Elemen Air Lainnya
  {
    model: 'water_fountain_tiered',
    category: 'water_feature',
    name: 'Air Mancur Taman 3 Tingkat',
    icon: '⛲',
    description: 'Air mancur marmer klasik 3 tingkat dengan pancuran air aktif berkilau.',
  },
  {
    model: 'water_koi_pond_lotus',
    category: 'water_feature',
    name: 'Kolam Ikan Koi & Bunga Teratai',
    icon: '🪷',
    description: 'Kolam batu alami berisi daun teratai mekar dan ikan koi yang berenang memutar.',
  },
  {
    model: 'water_mini_waterfall',
    category: 'water_feature',
    name: 'Air Terjun Mini & Kolam Batu',
    icon: '🏞️',
    description: 'Tebing batu bertingkat dengan aliran air terjun mini yang jatuh ke kolam jernih.',
  },
  {
    model: 'water_dancing_jets',
    category: 'water_feature',
    name: 'Air Mancur Menari Lantai Plaza',
    icon: '💦',
    description: '5 titik semburan air mancur lantai plaza yang menari naik-turun bergantian.',
  },
];

export function createDefaultPropItem(
  entry: CreatorPropCatalogEntry,
  wx: number,
  wy: number
): CreatorPropItem {
  const id = `cprop-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`;
  return {
    id,
    propCategory: entry.category,
    propModel: entry.model,
    name: entry.name,
    wx: Math.round(wx * 4) / 4,
    wy: Math.round(wy * 4) / 4,
    facing: 'down-right',
    scale: 1.0,
  };
}

// ============================================================================
// 2. KATALOG HEWAN & SIKLUS HIDUP (10 SPESIES)
// ============================================================================

export interface CreatorAnimalCatalogEntry {
  species: CreatorAnimalSpecies;
  defaultName: string;
  icon: string;
  defaultTimeCycle: AnimalTimeCycle;
  defaultBehaviorCycle: AnimalBehaviorCycle;
  defaultWanderRadius: number;
  defaultSpeed: number;
  description: string;
}

export const CREATOR_ANIMAL_CATALOG: CreatorAnimalCatalogEntry[] = [
  {
    species: 'deer_stag',
    defaultName: 'Rusa Jantan Tanduk Emas',
    icon: '🦌',
    defaultTimeCycle: 'diurnal',
    defaultBehaviorCycle: 'graze_wander',
    defaultWanderRadius: 2.2,
    defaultSpeed: 0.75,
    description: 'Rusa jantan gagah bertanduk bercabang yang gemar merumput.',
  },
  {
    species: 'deer_doe',
    defaultName: 'Rusa Betina Tutul',
    icon: '🦌',
    defaultTimeCycle: 'diurnal',
    defaultBehaviorCycle: 'graze_wander',
    defaultWanderRadius: 2.0,
    defaultSpeed: 0.72,
    description: 'Rusa betina anggun dengan corak tutul putih di punggung.',
  },
  {
    species: 'kancil',
    defaultName: 'Kancil Cerdik',
    icon: '🐐',
    defaultTimeCycle: 'diurnal',
    defaultBehaviorCycle: 'playful_hop',
    defaultWanderRadius: 1.8,
    defaultSpeed: 0.95,
    description: 'Kancil mungil lincah yang gemar melompat di sela taman.',
  },
  {
    species: 'rabbit',
    defaultName: 'Kelinci Putih Taman',
    icon: '🐇',
    defaultTimeCycle: 'all_day',
    defaultBehaviorCycle: 'playful_hop',
    defaultWanderRadius: 1.5,
    defaultSpeed: 0.9,
    description: 'Kelinci berbulu putih lembut dengan telinga panjang.',
  },
  {
    species: 'squirrel',
    defaultName: 'Tupai Ekor Lebat',
    icon: '🐿️',
    defaultTimeCycle: 'diurnal',
    defaultBehaviorCycle: 'playful_hop',
    defaultWanderRadius: 1.4,
    defaultSpeed: 1.0,
    description: 'Tupai cokelat gesit yang suka mengumpulkan biji pohon.',
  },
  {
    species: 'fox',
    defaultName: 'Rubah Oranye Senja',
    icon: '🦊',
    defaultTimeCycle: 'nocturnal',
    defaultBehaviorCycle: 'orbit_patrol',
    defaultWanderRadius: 2.4,
    defaultSpeed: 0.85,
    description: 'Rubah berekor ujung putih yang aktif berpatroli saat malam.',
  },
  {
    species: 'ground_bird',
    defaultName: 'Burung Merpati Taman',
    icon: '🐦',
    defaultTimeCycle: 'diurnal',
    defaultBehaviorCycle: 'graze_wander',
    defaultWanderRadius: 1.6,
    defaultSpeed: 0.8,
    description: 'Burung taman jinak yang mematuk biji-bijian di tanah.',
  },
  {
    species: 'swan',
    defaultName: 'Angsa Putih Danau',
    icon: '🦢',
    defaultTimeCycle: 'all_day',
    defaultBehaviorCycle: 'orbit_patrol',
    defaultWanderRadius: 1.6,
    defaultSpeed: 0.55,
    description: 'Angsa putih berleher anggun untuk kolam maupun tepi sungai.',
  },
  {
    species: 'cat',
    defaultName: 'Kucing Oren Kota',
    icon: '🐈',
    defaultTimeCycle: 'all_day',
    defaultBehaviorCycle: 'graze_wander',
    defaultWanderRadius: 1.8,
    defaultSpeed: 0.7,
    description: 'Kucing belang oranye kesayangan warga yang santai berkeliling.',
  },
  {
    species: 'butterfly_flock',
    defaultName: 'Kawanan Kupu-Kupu Taman',
    icon: '🦋',
    defaultTimeCycle: 'diurnal',
    defaultBehaviorCycle: 'orbit_patrol',
    defaultWanderRadius: 1.5,
    defaultSpeed: 0.9,
    description: 'Tiga kupu-kupu warna-warni yang terbang menari di sekitar bunga.',
  },
];

export function createDefaultAnimalItem(
  entry: CreatorAnimalCatalogEntry,
  wx: number,
  wy: number
): CreatorAnimalItem {
  const id = `canimal-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`;
  const roundedWx = Math.round(wx * 4) / 4;
  const roundedWy = Math.round(wy * 4) / 4;
  return {
    id,
    species: entry.species,
    name: entry.defaultName,
    homeWx: roundedWx,
    homeWy: roundedWy,
    scale: 1.0,
    speed: entry.defaultSpeed,
    wanderRadius: entry.defaultWanderRadius,
    timeCycle: entry.defaultTimeCycle,
    behaviorCycle: entry.defaultBehaviorCycle,
    cycleDurationSec: 16,
  };
}

// ============================================================================
// 3. KATALOG MODEL TANAH / JALAN & PAGar
// ============================================================================

export interface CreatorTerrainCatalogEntry {
  terrainType: CreatorTerrainType;
  name: string;
  icon: string;
  previewColor: string;
  borderColor: string;
  description: string;
  spriteGridPos?: { row: number; col: number };
}

export const CREATOR_TERRAIN_CATALOG: CreatorTerrainCatalogEntry[] = [
  // 16 Jenis Tanah & Paving Sesuai Gambar Referensi (Baris 1 - 4, Kolom 1 - 4)
  {
    terrainType: 'img_paving_herringbone_red',
    name: '1. Paving Zigzag Merah-Abu',
    icon: '🧱',
    previewColor: '#b34d44',
    borderColor: '#b8b6ae',
    description: 'Pola paving herringbone merah bata dan abu-abu muda sesuai gambar (Baris 1 Kolom 1).',
    spriteGridPos: { row: 0, col: 0 },
  },
  {
    terrainType: 'img_paving_basketweave_brown',
    name: '2. Paving Anyaman Cokelat',
    icon: '🟫',
    previewColor: '#c07136',
    borderColor: '#7a583b',
    description: 'Pola paving anyaman keranjang cokelat tanah & terakota (Baris 1 Kolom 2).',
    spriteGridPos: { row: 0, col: 1 },
  },
  {
    terrainType: 'img_paving_herringbone_grey',
    name: '3. Paving Herringbone Abu',
    icon: '⬜',
    previewColor: '#babab4',
    borderColor: '#6b6b66',
    description: 'Paving blok abu-abu klasik pola tulang ikan rapi (Baris 1 Kolom 3).',
    spriteGridPos: { row: 0, col: 2 },
  },
  {
    terrainType: 'img_paving_hex_blue',
    name: '4. Mozaik Heksagonal Biru',
    icon: '🔷',
    previewColor: '#91aedc',
    borderColor: '#8d6e53',
    description: 'Ubin heksagonal biru langit dengan aksen bintang cokelat (Baris 1 Kolom 4).',
    spriteGridPos: { row: 0, col: 3 },
  },
  {
    terrainType: 'img_stone_river_grey',
    name: '5. Batu Kali Bulat Abu',
    icon: '🪨',
    previewColor: '#7a7c78',
    borderColor: '#a3a5a0',
    description: 'Permukaan tanah batu kali bulat abu-abu natural (Baris 2 Kolom 1).',
    spriteGridPos: { row: 1, col: 0 },
  },
  {
    terrainType: 'img_stone_pebble_cream',
    name: '6. Batu Koral Krem Taman',
    icon: ' pebbles',
    previewColor: '#f3dfb4',
    borderColor: '#a29b79',
    description: 'Hamparan batu koral taman di atas pasir krem hangat (Baris 2 Kolom 2).',
    spriteGridPos: { row: 1, col: 1 },
  },
  {
    terrainType: 'img_stone_flagstone_brown',
    name: '7. Batu Alam Lempeng Cokelat',
    icon: '🤎',
    previewColor: '#725649',
    borderColor: '#dfc69c',
    description: 'Susunan batu alam lempeng poligonal cokelat & krem (Baris 2 Kolom 3).',
    spriteGridPos: { row: 1, col: 2 },
  },
  {
    terrainType: 'img_tile_dotted_grey',
    name: '8. Ubin Kotak Abu Kancing',
    icon: '🔘',
    previewColor: '#929699',
    borderColor: '#dfd9cc',
    description: 'Ubin trotoar kotak abu-abu dengan ornamen bulatan krem di persimpangan (Baris 2 Kolom 4).',
    spriteGridPos: { row: 1, col: 3 },
  },
  {
    terrainType: 'img_brick_running_pastel',
    name: '9. Bata Susun Pastel',
    icon: '🧱',
    previewColor: '#b7ac9a',
    borderColor: '#8b99a7',
    description: 'Susunan bata memanjang warna pastel krem, abu kebiruan, dan cokelat muda (Baris 3 Kolom 1).',
    spriteGridPos: { row: 2, col: 0 },
  },
  {
    terrainType: 'img_paving_parquet_taupe',
    name: '10. Paving Parket Taupe',
    icon: '🪟',
    previewColor: '#a69f95',
    borderColor: '#b28f79',
    description: 'Paving blok susun parket vertikal-horizontal warna taupe elegan (Baris 3 Kolom 2).',
    spriteGridPos: { row: 2, col: 1 },
  },
  {
    terrainType: 'img_wood_plank_terracotta',
    name: '11. Papan Kayu Terakota',
    icon: '🪵',
    previewColor: '#c37b42',
    borderColor: '#693c18',
    description: 'Lantai bilah papan kayu memanjang warna cokelat terakota hangat (Baris 3 Kolom 3).',
    spriteGridPos: { row: 2, col: 2 },
  },
  {
    terrainType: 'img_brick_checker_red',
    name: '12. Bata Kotak Merah-Tan',
    icon: '🟥',
    previewColor: '#ad4842',
    borderColor: '#b29b7a',
    description: 'Susunan bata kotak rapat selang-seling merah marun dan cokelat muda (Baris 3 Kolom 4).',
    spriteGridPos: { row: 2, col: 3 },
  },
  {
    terrainType: 'img_cobble_rounded_cream',
    name: '13. Batu Cobble Krem Halus',
    icon: '🥟',
    previewColor: '#d7c3aa',
    borderColor: '#7f6d5c',
    description: 'Batu cobble sudut membulat warna krem gading dengan nat cokelat tua (Baris 4 Kolom 1).',
    spriteGridPos: { row: 3, col: 0 },
  },
  {
    terrainType: 'img_brick_classic_orange',
    name: '14. Bata Terakota Oranye',
    icon: '🟧',
    previewColor: '#e28025',
    borderColor: '#b75526',
    description: 'Susunan bata klasik warna oranye terakota cerah menyala (Baris 4 Kolom 2).',
    spriteGridPos: { row: 3, col: 1 },
  },
  {
    terrainType: 'img_paving_lattice_red',
    name: '15. Paving Anyaman Merah-Krem',
    icon: '🧶',
    previewColor: '#9b4343',
    borderColor: '#cfc5bd',
    description: 'Paving pola kisi anyaman merah bata dengan titik kotak krem di tengah (Baris 4 Kolom 3).',
    spriteGridPos: { row: 3, col: 2 },
  },
  {
    terrainType: 'img_tile_diamond_gold',
    name: '16. Ubin Berlian Kuning Emas',
    icon: '🔶',
    previewColor: '#edd282',
    borderColor: '#c7b07c',
    description: 'Ubin keramik diagonal motif berlian kuning keemasan dan krem (Baris 4 Kolom 4).',
    spriteGridPos: { row: 3, col: 3 },
  },

  // Hamparan Rumput, Taman, Kolam, Jalan Raya (X, Y, Pertigaan, Perempatan, Belokan), Paving, Dek, Ubin & Pasir
  {
    terrainType: 'grass_open_meadow',
    name: 'Hamparan Rumput Lapangan',
    icon: '🌱',
    previewColor: '#4ade80',
    borderColor: '#15803d',
    description: 'Hamparan rumput lapangan terbuka dengan jalur potong rumput (mowed stripes), helai bergoyang, dan bunga daisy.',
  },
  {
    terrainType: 'grass_emerald',
    name: 'Rumput Hijau Zamrud',
    icon: '🟩',
    previewColor: '#22c55e',
    borderColor: '#16a34a',
    description: 'Rumput hijau zamrud pekat berlapis daun semanggi (clover), lumut halus, dan helai rumput 3D.',
  },
  {
    terrainType: 'flower_garden',
    name: 'Tanah Taman Bunga',
    icon: '🌷',
    previewColor: '#22c55e',
    borderColor: '#f472b6',
    description: 'Petak tanah humus subur berbingkai semak rendah dengan 9 rumpun bunga mekar warna-warni.',
  },
  {
    terrainType: 'water_pond',
    name: 'Kolam Air & Koi Jernih',
    icon: '💧',
    previewColor: '#0ea5e9',
    borderColor: '#7dd3fc',
    description: 'Kolam air jernih dengan tepian batu alam otomatis menyatu, kaustik air, teratai, dan bayangan ikan koi.',
  },
  {
    terrainType: 'road_asphalt',
    name: 'Jalan Aspal (Auto / Poros X)',
    icon: '🛣️',
    previewColor: '#334155',
    borderColor: '#facc15',
    description: 'Jalan raya aspal poros X (Timur-Barat) dengan trotoar yang otomatis menyambung jika bertemu petak jalan di sebelahnya.',
  },
  {
    terrainType: 'road_asphalt_y',
    name: 'Jalan Aspal Lurus (Poros Y)',
    icon: '🛤️',
    previewColor: '#334155',
    borderColor: '#38bdf8',
    description: 'Jalan raya aspal lurus arah poros Y (Utara-Selatan) lengkap dengan trotoar beton dan marka kuning putus-putus.',
  },
  {
    terrainType: 'road_asphalt_cross',
    name: 'Jalan Perempatan (+)',
    icon: '➕',
    previewColor: '#1e293b',
    borderColor: '#facc15',
    description: 'Simpang empat (Perempatan X & Y) lengkap dengan 4 zebra cross penyeberangan pejalan kaki dan sudut trotoar.',
  },
  {
    terrainType: 'road_asphalt_t_north',
    name: 'Jalan Pertigaan Utara (┻)',
    icon: '┻',
    previewColor: '#334155',
    borderColor: '#fbbf24',
    description: 'Simpang tiga (Pertigaan ke Utara, Timur, dan Barat) dengan marka pengarah dan zebra cross.',
  },
  {
    terrainType: 'road_asphalt_t_south',
    name: 'Jalan Pertigaan Selatan (┳)',
    icon: '┳',
    previewColor: '#334155',
    borderColor: '#fbbf24',
    description: 'Simpang tiga (Pertigaan ke Selatan, Timur, dan Barat) dengan marka pengarah dan zebra cross.',
  },
  {
    terrainType: 'road_asphalt_t_east',
    name: 'Jalan Pertigaan Timur (┣)',
    icon: '┣',
    previewColor: '#334155',
    borderColor: '#fbbf24',
    description: 'Simpang tiga (Pertigaan ke Utara, Selatan, dan Timur) dengan marka pengarah dan zebra cross.',
  },
  {
    terrainType: 'road_asphalt_t_west',
    name: 'Jalan Pertigaan Barat (┫)',
    icon: '┫',
    previewColor: '#334155',
    borderColor: '#fbbf24',
    description: 'Simpang tiga (Pertigaan ke Utara, Selatan, dan Barat) dengan marka pengarah dan zebra cross.',
  },
  {
    terrainType: 'road_asphalt_turn_ne',
    name: 'Jalan Belokan Utara-Timur (┗)',
    icon: '┗',
    previewColor: '#334155',
    borderColor: '#a3e635',
    description: 'Belokan jalan raya melengkung mulus 90 derajat yang menghubungkan arah Utara (-Y) dan Timur (+X).',
  },
  {
    terrainType: 'road_asphalt_turn_nw',
    name: 'Jalan Belokan Utara-Barat (┛)',
    icon: '┛',
    previewColor: '#334155',
    borderColor: '#a3e635',
    description: 'Belokan jalan raya melengkung mulus 90 derajat yang menghubungkan arah Utara (-Y) dan Barat (-X).',
  },
  {
    terrainType: 'road_asphalt_turn_se',
    name: 'Jalan Belokan Selatan-Timur (┏)',
    icon: '┏',
    previewColor: '#334155',
    borderColor: '#a3e635',
    description: 'Belokan jalan raya melengkung mulus 90 derajat yang menghubungkan arah Selatan (+Y) dan Timur (+X).',
  },
  {
    terrainType: 'road_asphalt_turn_sw',
    name: 'Jalan Belokan Selatan-Barat (┓)',
    icon: '┓',
    previewColor: '#334155',
    borderColor: '#a3e635',
    description: 'Belokan jalan raya melengkung mulus 90 derajat yang menghubungkan arah Selatan (+Y) dan Barat (-X).',
  },
  {
    terrainType: 'road_cobble',
    name: 'Jalan Paving Batu',
    icon: '🧱',
    previewColor: '#94a3b8',
    borderColor: '#cbd5e1',
    description: 'Jalan batu paving blok 4x4 interlocking dengan bevel cahaya 3D dan tepian kanstin.',
  },
  {
    terrainType: 'road_dirt',
    name: 'Jalan Tanah Setapak',
    icon: '🥾',
    previewColor: '#b58860',
    borderColor: '#966b46',
    description: 'Jalur tanah setapak alami dengan bahu rumput hijau, batu pijakan datar, dan kerikil.',
  },
  {
    terrainType: 'wood_deck',
    name: 'Dek Papan Kayu',
    icon: '🪵',
    previewColor: '#92400e',
    borderColor: '#b45309',
    description: 'Lantai 5 bilah papan kayu jati lengkap dengan serat kayu, sambungan balok, dan paku kuningan.',
  },
  {
    terrainType: 'plaza_marble',
    name: 'Ubin Plaza Marmer',
    icon: '⬜',
    previewColor: '#f1f5f9',
    borderColor: '#fbbf24',
    description: 'Lantai ubin marmer Carrara 3x3 dengan urat batu abu halus dan tatahan berlian emas di tengah.',
  },
  {
    terrainType: 'sand_golden',
    name: 'Pasir Pantai Emas',
    icon: '🏖️',
    previewColor: '#fde68a',
    borderColor: '#f59e0b',
    description: 'Hamparan pasir pantai keemasan dengan gurat gelombang angin, bintang laut, dan kerang mutiara.',
  },
];

export interface CreatorFenceCatalogEntry {
  model: CreatorFenceModel;
  name: string;
  icon: string;
  description: string;
}

export const CREATOR_FENCE_CATALOG: CreatorFenceCatalogEntry[] = [
  {
    model: 'fence_wood_rustic',
    name: 'Pagar Kayu Pedesaan',
    icon: '🪵',
    description: 'Pagar tiang dan palang kayu jati klasik untuk kebun & taman.',
  },
  {
    model: 'fence_white_picket',
    name: 'Pagar Taman Putih',
    icon: 'Fence',
    description: 'Pagar bilah kayu putih bersih bergaya rumah taman.',
  },
  {
    model: 'fence_iron_gold',
    name: 'Pagar Besi Tempa Emas',
    icon: '⚜️',
    description: 'Pagar teralis besi hitam elegan dengan ujung tombak emas.',
  },
  {
    model: 'fence_hedge_bush',
    name: 'Pagar Tanaman Rimbun',
    icon: '🌿',
    description: 'Pagar semak daun hijau rapat lengkap dengan bunga mungil.',
  },
  {
    model: 'fence_stone_brick',
    name: 'Tembok Pagar Batu Bata',
    icon: '🧱',
    description: 'Dinding pagar batu pendek kokoh untuk pembatas area gedung.',
  },
];

export function createDefaultFenceItem(
  entry: CreatorFenceCatalogEntry,
  wx: number,
  wy: number
): CreatorFenceItem {
  const id = `cfence-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`;
  return {
    id,
    fenceModel: entry.model,
    name: entry.name,
    wx: Math.round(wx * 2) / 2,
    wy: Math.round(wy * 2) / 2,
    axis: 'x',
    lengthTiles: 3,
    hasCollision: true,
  };
}

// ============================================================================
// 4. KATALOG OBJEK KOTA BAWAAN (GEDUNG, FASILITAS, BANGKU, AYUNAN, API UNGGUN, POHON)
// ============================================================================

export interface ExistingCityObjectMeta {
  id: string;
  objectCategory: 'building' | 'facility' | 'tree' | 'bench' | 'swing' | 'campfire';
  defaultName: string;
  defaultTagline: string;
  defaultIcon: string;
  defaultWx: number;
  defaultWy: number;
}

const DEFAULT_CITY_TREES_COORDS: [number, number][] = [
  [-2.2, -7.2],
  [2.2, -7.2],
  [-4.8, -6.8],
  [4.8, -6.8],
  [-3.5, -7.25],
  [3.5, -7.25],
  [-1.05, -6.85],
  [1.05, -6.85],
  [-6.35, -7.15],
  [-7.25, -4.85],
  [-7.25, -2.45],
  [-7.35, -0.25],
  [-7.25, 5.85],
  [-7.55, -6.25],
  [-7.55, 1.85],
  [-7.55, 3.65],
  [-6.45, 6.65],
  [-1.6, 7.0],
  [1.6, 7.0],
  [-3.2, 7.0],
  [3.2, 7.0],
  [-5.0, 6.6],
  [5.0, 6.6],
  [-4.15, 7.15],
  [4.15, 7.15],
  [-2.35, 6.25],
  [2.45, 6.25],
  [6.15, 6.65],
  [6.35, -0.45],
  [6.35, 2.2],
  [6.25, 4.6],
  [6.35, -7.2],
  [6.35, -3.75],
  [5.78, -1.95],
  [6.35, 3.45],
  [6.25, 5.75],
  [-5.2, -1.8],
  [5.2, 1.8],
  [-4.15, 1.95],
  [-0.5, 2.4],
  [-4.15, -1.25],
  [4.15, -1.25],
  [-2.15, 4.2],
  [2.15, 4.2],
  [-1.72, -1.72],
  [1.72, -1.72],
  [-1.72, 1.72],
  [1.72, 1.72],
  [9.8, -10.5],
  [9.3, -7.5],
  [10.2, -4.5],
  [11.8, -2.6],
  [14.2, -3.2],
  [16.4, -1.5],
  [12.2, 2.6],
  [15.1, 3.2],
  [9.3, 5.2],
  [10.1, 7.2],
];

export const EXISTING_CITY_OBJECTS_CATALOG: ExistingCityObjectMeta[] = [
  // Gedung Utama Kota
  { id: 'balai_kota', objectCategory: 'building', defaultName: 'Balai Kota', defaultTagline: 'Kubah Emas & Misi', defaultIcon: '🏛️', defaultWx: 0, defaultWy: -4.2 },
  { id: 'menara_mentor', objectCategory: 'building', defaultName: 'Studio ON AIR', defaultTagline: 'Studio Podcast, ON AIR & AI', defaultIcon: '🎙️', defaultWx: 4.2, defaultWy: 0 },
  { id: 'perpustakaan', objectCategory: 'building', defaultName: 'Perpustakaan Kampus', defaultTagline: 'Gedung Biru & Materi', defaultIcon: '📚', defaultWx: -4.2, defaultWy: 0 },
  { id: 'pasar_prestasi', objectCategory: 'building', defaultName: 'Pasar Prestasi', defaultTagline: 'Leaderboard & Dewan Guru', defaultIcon: '🏆', defaultWx: -2.8, defaultWy: 2.8 },
  { id: 'kantor_pos', objectCategory: 'building', defaultName: 'Kantor Pos Kilat', defaultTagline: 'Kirim Pesan ke Guru', defaultIcon: '📮', defaultWx: 2.8, defaultWy: -2.8 },
  { id: 'taman_refleksi', objectCategory: 'building', defaultName: 'Pusat Refleksi', defaultTagline: 'Tulis Jurnal Refleksi (+3 Poin)', defaultIcon: '🌍', defaultWx: -2.8, defaultWy: -2.8 },
  { id: 'bengkel_latihan', objectCategory: 'building', defaultName: 'Lab DKV', defaultTagline: 'Studio Desain Minimalis, Atom & Kuis', defaultIcon: '⚛️', defaultWx: 2.8, defaultWy: 2.8 },
  { id: 'masjid', objectCategory: 'building', defaultName: 'Masjid Al-Hikmah', defaultTagline: 'Belajar Iqro (1-6) & Tuntunan Sholat', defaultIcon: '🕌', defaultWx: 5.45, defaultWy: -4.85 },
  { id: 'bank_materi', objectCategory: 'building', defaultName: 'Bank Materi Guru', defaultTagline: 'Khusus Guru • Input TP, Materi Esensial & Generate AI', defaultIcon: '🏦', defaultWx: -5.35, defaultWy: -4.85 },
  { id: 'monumen_warga', objectCategory: 'building', defaultName: 'Air Mancur Warga', defaultTagline: 'Sapa & Obrolan Langsung', defaultIcon: '⛲', defaultWx: 0, defaultWy: 0 },
  { id: 'pencakar_langit', objectCategory: 'building', defaultName: 'Gedung Pencakar Langit', defaultTagline: 'Refleksia Timur • Tantangan Karier & Cita-cita Masa Depan', defaultIcon: '🏙️', defaultWx: 14.0, defaultWy: -10.5 },
  { id: 'bandara', objectCategory: 'building', defaultName: 'Bandara Refleksia Timur', defaultTagline: 'Gerbang Udara • Landasan Pacu, Pesawat Terbang & Target Masa Depan', defaultIcon: '✈️', defaultWx: 10.8, defaultWy: -11.8 },

  // Fasilitas Publik
  { id: 'cafe', objectCategory: 'facility', defaultName: 'Lapak Refleksia', defaultTagline: 'Tempat Nongkrong & Kuliner Warga', defaultIcon: '☕', defaultWx: 4.65, defaultWy: 4.55 },
  { id: 'beringin', objectCategory: 'facility', defaultName: 'Pohon Beringin Refleksi', defaultTagline: 'Gantungkan Daun Jurnal 4F', defaultIcon: '🌳', defaultWx: -2.95, defaultWy: -5.85 },
  { id: 'literacy_corner', objectCategory: 'facility', defaultName: 'Sudut Literasi', defaultTagline: 'Taman Baca Terbuka Samping Balai Kota', defaultIcon: '📖', defaultWx: 2.35, defaultWy: -6.15 },
  { id: 'announcement_board', objectCategory: 'facility', defaultName: 'Papan Pengumuman', defaultTagline: 'Informasi Resmi Dewan Guru', defaultIcon: '📋', defaultWx: -1.55, defaultWy: -3.45 },
  { id: 'rules_board', objectCategory: 'facility', defaultName: 'Papan Peraturan Kota', defaultTagline: 'Tata Tertib & Panduan Warga', defaultIcon: '📜', defaultWx: 1.45, defaultWy: 5.95 },

  // Api Unggun Bawaan
  { id: 'campfire', objectCategory: 'campfire', defaultName: 'Api Unggun Taman Barat Daya', defaultTagline: 'Titik Penghangat & Kumpul Malam Warga', defaultIcon: '🔥', defaultWx: -4.05, defaultWy: 4.15 },

  // 2 Ayunan Kota Bawaan
  { id: 'swing_struct_1', objectCategory: 'swing', defaultName: 'Ayunan 1 • Taman Refleksi', defaultTagline: '2 Kursi Ayunan Taman Barat', defaultIcon: '🎠', defaultWx: -2.8, defaultWy: -4.05 },
  { id: 'swing_struct_2', objectCategory: 'swing', defaultName: 'Ayunan 2 • Taman Timur', defaultTagline: '2 Kursi Ayunan Taman Timur', defaultIcon: '🎠', defaultWx: 2.8, defaultWy: -4.05 },

  // 15 Tempat Duduk / Bangku Kota Bawaan
  { id: 'fountain_1', objectCategory: 'bench', defaultName: 'Bangku Air Mancur 1 (Barat Laut)', defaultTagline: 'Bangku Minimalis 2 Warga', defaultIcon: '🪑', defaultWx: -1.05, defaultWy: -1.05 },
  { id: 'fountain_2', objectCategory: 'bench', defaultName: 'Bangku Air Mancur 2 (Utara)', defaultTagline: 'Bangku Minimalis 2 Warga', defaultIcon: '🪑', defaultWx: 0.0, defaultWy: -1.42 },
  { id: 'fountain_3', objectCategory: 'bench', defaultName: 'Bangku Air Mancur 3 (Timur Laut)', defaultTagline: 'Bangku Minimalis 2 Warga', defaultIcon: '🪑', defaultWx: 1.05, defaultWy: -1.05 },
  { id: 'fountain_4', objectCategory: 'bench', defaultName: 'Bangku Air Mancur 4 (Timur)', defaultTagline: 'Bangku Minimalis 2 Warga', defaultIcon: '🪑', defaultWx: 1.42, defaultWy: 0.0 },
  { id: 'fountain_5', objectCategory: 'bench', defaultName: 'Bangku Air Mancur 5 (Tenggara)', defaultTagline: 'Bangku Minimalis 2 Warga', defaultIcon: '🪑', defaultWx: 1.05, defaultWy: 1.05 },
  { id: 'fountain_6', objectCategory: 'bench', defaultName: 'Bangku Air Mancur 6 (Selatan)', defaultTagline: 'Bangku Minimalis 2 Warga', defaultIcon: '🪑', defaultWx: 0.0, defaultWy: 1.42 },
  { id: 'fountain_7', objectCategory: 'bench', defaultName: 'Bangku Air Mancur 7 (Barat Daya)', defaultTagline: 'Bangku Minimalis 2 Warga', defaultIcon: '🪑', defaultWx: -1.05, defaultWy: 1.05 },
  { id: 'fountain_8', objectCategory: 'bench', defaultName: 'Bangku Air Mancur 8 (Barat)', defaultTagline: 'Bangku Minimalis 2 Warga', defaultIcon: '🪑', defaultWx: -1.42, defaultWy: 0.0 },
  { id: 'literacy_1', objectCategory: 'bench', defaultName: 'Kursi Literasi 1 (Samping Balai Kota)', defaultTagline: 'Bangku Baca 2 Warga', defaultIcon: '🪑', defaultWx: 1.72, defaultWy: -5.82 },
  { id: 'literacy_2', objectCategory: 'bench', defaultName: 'Kursi Literasi 2 (Depan Sudut Literasi)', defaultTagline: 'Bangku Baca 2 Warga', defaultIcon: '🪑', defaultWx: 2.95, defaultWy: -5.82 },
  { id: 'campfire_1', objectCategory: 'bench', defaultName: 'Bangku Api Unggun Kiri', defaultTagline: 'Bangku Kayu Hangat 2 Warga', defaultIcon: '🪵', defaultWx: -4.52, defaultWy: 4.18 },
  { id: 'campfire_2', objectCategory: 'bench', defaultName: 'Bangku Api Unggun Kanan', defaultTagline: 'Bangku Kayu Hangat 2 Warga', defaultIcon: '🪵', defaultWx: -3.58, defaultWy: 4.18 },
  { id: 'riverside_1', objectCategory: 'bench', defaultName: 'Bangku Tepi Sungai 1 (Utara)', defaultTagline: 'Bangku Santai Pinggir Sungai', defaultIcon: '🪑', defaultWx: 6.36, defaultWy: -2.85 },
  { id: 'riverside_2', objectCategory: 'bench', defaultName: 'Bangku Tepi Sungai 2 (Tengah)', defaultTagline: 'Bangku Santai Pinggir Sungai', defaultIcon: '🪑', defaultWx: 6.36, defaultWy: -1.95 },
  { id: 'riverside_3', objectCategory: 'bench', defaultName: 'Bangku Tepi Sungai 3 (Selatan)', defaultTagline: 'Bangku Santai Pinggir Sungai', defaultIcon: '🪑', defaultWx: 6.36, defaultWy: -1.05 },

  // Seluruh Pohon Kota Bawaan
  ...DEFAULT_CITY_TREES_COORDS.map(([wx, wy], idx): ExistingCityObjectMeta => ({
    id: `tree_${idx}`,
    objectCategory: 'tree',
    defaultName: `Pohon Kota #${idx + 1}`,
    defaultTagline: idx >= 48 ? 'Pohon Refleksia Timur' : 'Pohon Rindang Kota Refleksia',
    defaultIcon: idx % 3 === 1 ? '🍁' : '🌳',
    defaultWx: wx,
    defaultWy: wy,
  })),
];

export const DEFAULT_CITY_NPCS_CATALOG: CreatorNpcConfig[] = [
  {
    id: 'surya',
    isCustom: false,
    name: 'Surya',
    role: 'Satpam Kota',
    gender: 'L',
    wx: 0.0,
    wy: 4.8,
    homeWx: 0.0,
    homeWy: 4.8,
    movementMode: 'patrol',
    wanderRadius: 2.2,
    speed: 1.05,
    patrolWaypoints: [
      { wx: 0.0, wy: 4.8 },
      { wx: 3.2, wy: 3.6 },
      { wx: 3.5, wy: 0.0 },
      { wx: 3.2, wy: -3.2 },
      { wx: 0.0, wy: -3.2 },
      { wx: -3.2, wy: -3.2 },
      { wx: -3.5, wy: 0.0 },
      { wx: -3.2, wy: 3.6 },
      { wx: 0.0, wy: 1.8 },
    ],
    shirtColor: '#d6c7b2',
    pantsColor: '#451a03',
    hairColor: '#0f172a',
    hatColor: '#1e293b',
    speeches: [
      '👮‍♂️ Keamanan Kota Refleksia terkendali dan tertib!',
      '🏛️ Cek misi terbaru di Balai Kota ya!',
      '🛡️ Tetap santun saat berdiskusi bersama warga ya!',
    ],
  },
  {
    id: 'malik',
    isCustom: false,
    name: 'Malik',
    role: 'Kutu Buku Lab',
    gender: 'L',
    wx: 2.8,
    wy: 2.2,
    homeWx: 2.8,
    homeWy: 2.2,
    movementMode: 'wander',
    wanderRadius: 1.4,
    speed: 0.78,
    shirtColor: '#1e3a8a',
    pantsColor: '#334155',
    hairColor: '#0f172a',
    hatColor: '#ffffff',
    speeches: [
      '📚 Sudah coba latihan soal 5 jenjang di Lab DKV?',
      '✨ Ilmu desain grafis makin seru kalau dipraktikkan!',
      '🤝 Jangan lupa baca modul di Perpustakaan juga ya!',
    ],
  },
  {
    id: 'ma_uba',
    isCustom: false,
    name: 'Ma Uba',
    role: 'Ibu Kantin',
    gender: 'P',
    wx: 5.3,
    wy: 4.38,
    homeWx: 5.3,
    homeWy: 4.38,
    movementMode: 'static',
    wanderRadius: 0.8,
    speed: 0.5,
    shirtColor: '#ea580c',
    pantsColor: '#7c2d12',
    hairColor: '#451a03',
    hatColor: '#f472b6',
    speeches: [
      'Halo Nak! Mau roti hangat atau minuman segar di Lapak Refleksia? 🥐☕',
      'Semangat belajarnya ya Nak! Jangan lupa sarapan agar pikiran tetap jernih ✨',
      'Lapak Refleksia siap melayani seluruh warga dan siswa Refleksia City! 🥖🥤',
    ],
  },
  {
    id: 'patra',
    isCustom: false,
    name: 'Patra',
    role: 'Ibu Literasi',
    gender: 'P',
    wx: 2.35,
    wy: -5.52,
    homeWx: 2.35,
    homeWy: -5.52,
    movementMode: 'wander',
    wanderRadius: 0.35,
    speed: 0.45,
    shirtColor: '#0d9488',
    pantsColor: '#115e59',
    hairColor: '#064e3b',
    speeches: [
      'Assalamualaikum, yuk mampir baca buku! 📖',
      'Mari duduk di Sudut Literasi & baca komik! 📚',
      'Membaca membuka jendela dunia, ayo baca! ✨',
    ],
  },
  {
    id: 'sufri',
    isCustom: false,
    name: 'Pak Sufri',
    role: 'Ahli Tanaman & Penjaga Hutan',
    gender: 'L',
    wx: -0.76,
    wy: -7.32,
    homeWx: -0.76,
    homeWy: -7.32,
    movementMode: 'static',
    wanderRadius: 1.2,
    speed: 0.55,
    shirtColor: '#4d7c0f',
    pantsColor: '#451a03',
    hairColor: '#cbd5e1',
    hatColor: '#a16207',
    speeches: [
      'Bibit tanaman langka di Hutan Refleksia tumbuh subur! 🌱🔍',
      'Punya hasil tangkapan dari Sungai Refleksia? Jual Ikan Batu, Mujair, Ikan Mas, atau Kepiting Danau ke saya ya! 🐟🦀',
      'Siswa bisa masuk ke Hutan Refleksia dengan tiket konservasi 5 XP ya! 🌲🎫',
    ],
  },
  {
    id: 'sony',
    isCustom: false,
    name: 'Sony',
    role: 'Wali Kota',
    gender: 'L',
    wx: 0.0,
    wy: -2.5,
    homeWx: 0.0,
    homeWy: -2.5,
    movementMode: 'patrol',
    wanderRadius: 2.5,
    speed: 0.92,
    patrolWaypoints: [
      { wx: 0.0, wy: -2.5 },
      { wx: 2.0, wy: -2.0 },
      { wx: 2.5, wy: 0.0 },
      { wx: 2.0, wy: 2.0 },
      { wx: 0.0, wy: 2.5 },
      { wx: -2.0, wy: 2.0 },
      { wx: -2.5, wy: 0.0 },
      { wx: -2.0, wy: -2.0 },
      { wx: 0.0, wy: 1.4 },
      { wx: 0.0, wy: 4.2 },
    ],
    shirtColor: '#f8fafc',
    pantsColor: '#f1f5f9',
    hairColor: '#0f172a',
    hatColor: '#eab308',
    speeches: [
      'Halo warga! Selamat beraktivitas di Refleksia City! 👋',
      'Semangat belajar & berkarya hari ini ya! 🌟',
      'Mari jaga kota kita tetap asri dan kreatif! 🏛️',
    ],
  },
  {
    id: 'nawa',
    isCustom: false,
    name: 'Nawa',
    role: 'Penjaga Gerbang Utama',
    gender: 'L',
    wx: -0.62,
    wy: 6.88,
    homeWx: -0.62,
    homeWy: 6.88,
    movementMode: 'static',
    wanderRadius: 0.5,
    speed: 0.5,
    shirtColor: '#c2b280',
    pantsColor: '#3e1e04',
    hairColor: '#1e293b',
    hatColor: '#78350f',
    speeches: [
      '🦅 Siap komando! Saya Nawa, Penjaga Gerbang Selamat Datang Kota Refleksia.',
      '🦅 Pastikan kamu membaca Papan Peraturan & Panduan Kota di sebelah kanan gerbang sebelum menjelajah!',
      '🦅 Klik saya kapan saja untuk melihat Buku Tamu Gerbang hari ini!',
    ],
  },
];

export function createDefaultBuildingFromStock(
  stock: StockModelDefinition,
  wx: number,
  wy: number
): CreatorBuildingItem {
  const id = `cbuild-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`;
  return {
    id,
    name: stock.defaultName,
    tagline: stock.defaultTagline,
    icon: stock.icon,
    category: stock.category,
    modelType: stock.modelType,
    wx: Math.round(wx * 2) / 2,
    wy: Math.round(wy * 2) / 2,
    scale: 1.0,
    accentColor: stock.accentColor,
    roofColor: stock.roofColor,
    hasCollision: false,
    templateType: stock.defaultTemplate,
    templateData: {
      welcomeText: `Selamat datang di ${stock.defaultName}! Mari berpartisipasi dalam aktivitas warga di fasilitas ini.`,
      xpReward: 15,
      gameTitle: `Tantangan Kuis ${stock.defaultName}`,
      quizItems: [
        {
          id: 'q1',
          question: 'Prinsip desain yang membantu mata audiens fokus pada elemen utama terlebih dahulu disebut?',
          options: ['Hierarki Visual', 'Distorsi Pixel', ' Saturasi Bebas', 'kompresi File'],
          correctIndex: 0,
          explanation: 'Hierarki visual mengatur urutan prioritas elemen agar pesan utama langsung tertangkap.',
        },
        {
          id: 'q2',
          question: 'Mengapa ruang kosong (white space) sangat penting dalam tata letak poster atau antarmuka?',
          options: [
            'Agar ukuran file menjadi lebih besar',
            'Memberi napas bagi mata pembaca dan memperjelas struktur informasi',
            'Mengurangi jumlah warna yang dipakai',
            'Menghilangkan kebutuhan tipografi',
          ],
          correctIndex: 1,
          explanation: 'White space menjaga desain tetap rapi, lega, dan meningkatkan keterbacaan.',
        },
      ],
      highScores: [],
      ideaPrompt: `Tuliskan ide, terobosan kreatif, atau saran terbaikmu di ${stock.defaultName}!`,
      ideas: [],
      infoContent: `${stock.defaultName} hadir sebagai fasilitas kolaborasi dan eksplorasi warga Kota Refleksia.\n\n• Manfaatkan ruang ini untuk berdiskusi dan memetik inspirasi baru.\n• Setiap warga yang berkunjung berhak mengklaim apresiasi XP Kunjungan.`,
      externalUrl: '',
      mediaCaption: 'Fasilitas Resmi Kreasi Master Kota Refleksia',
      missionChecklist: [
        'Mengamati arsitektur dan informasi utama di fasilitas ini',
        'Berdiskusi atau berbagi kesan positif bersama warga kota lainnya',
      ],
      submissions: [],
    },
    createdBy: 'kikybahsoan',
    updatedAt: new Date().toLocaleString('id-ID'),
  };
}

// ============================================================================
// FLOATING CREATOR STUDIO DOCK FOR MASTER KIKYBAHSOAN
// ============================================================================

export type CreatorSelectedTarget =
  | { kind: 'custom_building'; id: string }
  | { kind: 'existing_object'; id: string }
  | { kind: 'npc'; id: string }
  | { kind: 'custom_prop'; id: string }
  | { kind: 'custom_animal'; id: string }
  | { kind: 'custom_fence'; id: string }
  | null;

interface CreatorStudioFloatingDockProps {
  creatorState: CityCreatorState;
  onUpdateCreatorState: (next: CityCreatorState) => void;
  onSaveToCity: () => Promise<void>;
  selectedTarget: CreatorSelectedTarget;
  onSelectTarget: (target: CreatorSelectedTarget) => void;
  snapToGrid: boolean;
  onToggleSnapToGrid: () => void;
  isPlacingModel: StockModelDefinition | null;
  onStartPlacingModel: (stock: StockModelDefinition | null) => void;
  placingPropEntry?: CreatorPropCatalogEntry | null;
  onStartPlacingProp?: (entry: CreatorPropCatalogEntry | null) => void;
  placingAnimalEntry?: CreatorAnimalCatalogEntry | null;
  onStartPlacingAnimal?: (entry: CreatorAnimalCatalogEntry | null) => void;
  activeTerrainBrush?: CreatorTerrainType | 'eraser' | null;
  onSelectTerrainBrush?: (brush: CreatorTerrainType | 'eraser' | null) => void;
  placingFenceEntry?: CreatorFenceCatalogEntry | null;
  onStartPlacingFence?: (entry: CreatorFenceCatalogEntry | null) => void;
  isRecordingPatrolNpcId: string | null;
  onToggleRecordPatrol: (npcId: string | null) => void;
  playerCurrentCoords: { wx: number; wy: number };
  onTeleportCameraOrAvatar: (wx: number, wy: number) => void;
  onPreviewCustomBuildingModal: (building: CreatorBuildingItem) => void;
  onCloseStudio: () => void;
}

export const CreatorStudioFloatingDock: React.FC<CreatorStudioFloatingDockProps> = ({
  creatorState,
  onUpdateCreatorState,
  onSaveToCity,
  selectedTarget,
  onSelectTarget,
  snapToGrid,
  onToggleSnapToGrid,
  isPlacingModel,
  onStartPlacingModel,
  placingPropEntry = null,
  onStartPlacingProp,
  placingAnimalEntry = null,
  onStartPlacingAnimal,
  activeTerrainBrush = null,
  onSelectTerrainBrush,
  placingFenceEntry = null,
  onStartPlacingFence,
  isRecordingPatrolNpcId,
  onToggleRecordPatrol,
  playerCurrentCoords,
  onTeleportCameraOrAvatar,
  onPreviewCustomBuildingModal,
  onCloseStudio,
}) => {
  const [activeTab, setActiveTab] = useState<
    'catalog' | 'props' | 'animals' | 'terrain' | 'existing' | 'npcs' | 'inspector'
  >('catalog');
  const [catalogCategory, setCatalogCategory] = useState<CreatorBuildingCategory>('gedung_kantor');
  const [propSubCategory, setPropSubCategory] = useState<CreatorPropCategory>('tree');
  const [existingFilter, setExistingFilter] = useState<
    'building_facility' | 'bench_swing_campfire' | 'trees'
  >('building_facility');
  const [isMinimized, setIsMinimized] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveToast, setSaveToast] = useState<string | null>(null);

  const clearAllPlacementModes = () => {
    onStartPlacingModel(null);
    onStartPlacingProp?.(null);
    onStartPlacingAnimal?.(null);
    onSelectTerrainBrush?.(null);
    onStartPlacingFence?.(null);
  };

  const handleSaveClick = async () => {
    setIsSaving(true);
    try {
      await onSaveToCity();
      setSaveToast('Tersimpan & disinkronkan ke seluruh warga kota!');
      setTimeout(() => setSaveToast(null), 3500);
    } finally {
      setIsSaving(false);
    }
  };

  // Spawn stock building right near avatar
  const handleQuickSpawnStock = (stock: StockModelDefinition) => {
    const spawnWx = Math.round((playerCurrentCoords.wx + 1.2) * 2) / 2;
    const spawnWy = Math.round((playerCurrentCoords.wy - 0.8) * 2) / 2;
    const newB = createDefaultBuildingFromStock(stock, spawnWx, spawnWy);
    const nextState: CityCreatorState = {
      ...creatorState,
      customBuildings: [...creatorState.customBuildings, newB],
    };
    onUpdateCreatorState(nextState);
    onSelectTarget({ kind: 'custom_building', id: newB.id });
    clearAllPlacementModes();
    setActiveTab('inspector');
  };

  // Quick spawn custom prop near avatar
  const handleQuickSpawnProp = (entry: CreatorPropCatalogEntry) => {
    const spawnWx = Math.round((playerCurrentCoords.wx + 0.9) * 4) / 4;
    const spawnWy = Math.round((playerCurrentCoords.wy + 0.5) * 4) / 4;
    const newProp = createDefaultPropItem(entry, spawnWx, spawnWy);
    onUpdateCreatorState({
      ...creatorState,
      customProps: [...(creatorState.customProps || []), newProp],
    });
    onSelectTarget({ kind: 'custom_prop', id: newProp.id });
    clearAllPlacementModes();
    setActiveTab('inspector');
  };

  // Quick spawn custom animal near avatar
  const handleQuickSpawnAnimal = (entry: CreatorAnimalCatalogEntry) => {
    const spawnWx = Math.round((playerCurrentCoords.wx + 1.0) * 4) / 4;
    const spawnWy = Math.round((playerCurrentCoords.wy + 0.6) * 4) / 4;
    const newAnimal = createDefaultAnimalItem(entry, spawnWx, spawnWy);
    onUpdateCreatorState({
      ...creatorState,
      customAnimals: [...(creatorState.customAnimals || []), newAnimal],
    });
    onSelectTarget({ kind: 'custom_animal', id: newAnimal.id });
    clearAllPlacementModes();
    setActiveTab('inspector');
  };

  // Quick spawn custom fence near avatar
  const handleQuickSpawnFence = (entry: CreatorFenceCatalogEntry) => {
    const spawnWx = Math.round((playerCurrentCoords.wx + 1.0) * 2) / 2;
    const spawnWy = Math.round((playerCurrentCoords.wy + 0.5) * 2) / 2;
    const newFence = createDefaultFenceItem(entry, spawnWx, spawnWy);
    onUpdateCreatorState({
      ...creatorState,
      customFences: [...(creatorState.customFences || []), newFence],
    });
    onSelectTarget({ kind: 'custom_fence', id: newFence.id });
    clearAllPlacementModes();
    setActiveTab('inspector');
  };

  // Add new custom NPC
  const handleAddNewNpc = () => {
    const id = `npc-custom-${Date.now().toString(36).slice(-5)}`;
    const spawnWx = Math.round((playerCurrentCoords.wx + 0.8) * 10) / 10;
    const spawnWy = Math.round((playerCurrentCoords.wy + 0.5) * 10) / 10;
    const newNpc: CreatorNpcConfig = {
      id,
      isCustom: true,
      name: 'Duta Kreator',
      role: 'Pemandu Fasilitas Kota',
      gender: 'L',
      wx: spawnWx,
      wy: spawnWy,
      homeWx: spawnWx,
      homeWy: spawnWy,
      movementMode: 'wander',
      wanderRadius: 1.8,
      speed: 0.65,
      patrolWaypoints: [],
      shirtColor: '#f59e0b',
      pantsColor: '#1e293b',
      hairColor: '#0f172a',
      hatColor: '#eab308',
      speeches: [
        '👋 Halo warga Refleksia! Selamat datang di fasilitas kreasi baru kota kita!',
        '✨ Jangan lupa mencoba tantangan dan kumpulkan XP harianmu di sini ya!',
      ],
    };
    onUpdateCreatorState({
      ...creatorState,
      npcConfigs: {
        ...creatorState.npcConfigs,
        [id]: newNpc,
      },
    });
    onSelectTarget({ kind: 'npc', id });
    setActiveTab('inspector');
  };

  // Helper to get effective NPC list (7 default + custom)
  const allNpcs: CreatorNpcConfig[] = [
    ...DEFAULT_CITY_NPCS_CATALOG.map((def) => creatorState.npcConfigs[def.id] || def),
    ...Object.values(creatorState.npcConfigs).filter((n) => n.isCustom),
  ];

  // Helpers for selected target
  const selectedCustomBuilding =
    selectedTarget?.kind === 'custom_building'
      ? creatorState.customBuildings.find((b) => b.id === selectedTarget.id) || null
      : null;

  const selectedExistingMeta =
    selectedTarget?.kind === 'existing_object'
      ? EXISTING_CITY_OBJECTS_CATALOG.find((o) => o.id === selectedTarget.id) || null
      : null;

  const selectedExistingOverride: ExistingObjectOverride | null =
    selectedExistingMeta
      ? creatorState.existingOverrides[selectedExistingMeta.id] || {
          id: selectedExistingMeta.id,
          objectCategory: selectedExistingMeta.objectCategory,
          wx: selectedExistingMeta.defaultWx,
          wy: selectedExistingMeta.defaultWy,
          customName: selectedExistingMeta.defaultName,
          customTagline: selectedExistingMeta.defaultTagline,
          customIcon: selectedExistingMeta.defaultIcon,
          isHidden: false,
        }
      : null;

  const selectedNpc: CreatorNpcConfig | null =
    selectedTarget?.kind === 'npc'
      ? allNpcs.find((n) => n.id === selectedTarget.id) || null
      : null;

  const selectedCustomProp: CreatorPropItem | null =
    selectedTarget?.kind === 'custom_prop'
      ? (creatorState.customProps || []).find((p) => p.id === selectedTarget.id) || null
      : null;

  const selectedCustomAnimal: CreatorAnimalItem | null =
    selectedTarget?.kind === 'custom_animal'
      ? (creatorState.customAnimals || []).find((a) => a.id === selectedTarget.id) || null
      : null;

  const selectedCustomFence: CreatorFenceItem | null =
    selectedTarget?.kind === 'custom_fence'
      ? (creatorState.customFences || []).find((f) => f.id === selectedTarget.id) || null
      : null;

  // Mutators for Inspector
  const updateSelectedCustomBuilding = (patch: Partial<CreatorBuildingItem>) => {
    if (!selectedCustomBuilding) return;
    const nextBuildings = creatorState.customBuildings.map((b) =>
      b.id === selectedCustomBuilding.id ? { ...b, ...patch } : b
    );
    onUpdateCreatorState({ ...creatorState, customBuildings: nextBuildings });
  };

  const updateSelectedExistingObject = (patch: Partial<ExistingObjectOverride>) => {
    if (!selectedExistingMeta || !selectedExistingOverride) return;
    const updated: ExistingObjectOverride = {
      ...selectedExistingOverride,
      ...patch,
    };
    onUpdateCreatorState({
      ...creatorState,
      existingOverrides: {
        ...creatorState.existingOverrides,
        [selectedExistingMeta.id]: updated,
      },
    });
  };

  const resetSelectedExistingObject = () => {
    if (!selectedExistingMeta) return;
    const nextOverrides = { ...creatorState.existingOverrides };
    delete nextOverrides[selectedExistingMeta.id];
    onUpdateCreatorState({
      ...creatorState,
      existingOverrides: nextOverrides,
    });
  };

  const updateSelectedNpc = (patch: Partial<CreatorNpcConfig>) => {
    if (!selectedNpc) return;
    const updated: CreatorNpcConfig = {
      ...selectedNpc,
      ...patch,
    };
    onUpdateCreatorState({
      ...creatorState,
      npcConfigs: {
        ...creatorState.npcConfigs,
        [selectedNpc.id]: updated,
      },
    });
  };

  const deleteOrResetSelectedNpc = () => {
    if (!selectedNpc) return;
    const nextNpcs = { ...creatorState.npcConfigs };
    delete nextNpcs[selectedNpc.id];
    onUpdateCreatorState({
      ...creatorState,
      npcConfigs: nextNpcs,
    });
    if (selectedNpc.isCustom) {
      onSelectTarget(null);
    }
  };

  const updateSelectedCustomProp = (patch: Partial<CreatorPropItem>) => {
    if (!selectedCustomProp) return;
    const nextProps = (creatorState.customProps || []).map((p) =>
      p.id === selectedCustomProp.id ? { ...p, ...patch } : p
    );
    onUpdateCreatorState({ ...creatorState, customProps: nextProps });
  };

  const updateSelectedCustomAnimal = (patch: Partial<CreatorAnimalItem>) => {
    if (!selectedCustomAnimal) return;
    const nextAnimals = (creatorState.customAnimals || []).map((a) =>
      a.id === selectedCustomAnimal.id ? { ...a, ...patch } : a
    );
    onUpdateCreatorState({ ...creatorState, customAnimals: nextAnimals });
  };

  const updateSelectedCustomFence = (patch: Partial<CreatorFenceItem>) => {
    if (!selectedCustomFence) return;
    const nextFences = (creatorState.customFences || []).map((f) =>
      f.id === selectedCustomFence.id ? { ...f, ...patch } : f
    );
    onUpdateCreatorState({ ...creatorState, customFences: nextFences });
  };

  const terrainTileCount = Object.keys(creatorState.terrainTiles || {}).length;

  return (
    <div className="fixed left-3 top-20 z-30 w-[375px] max-w-[94vw] select-none pointer-events-auto">
      {/* Main Obsidian Glass Studio Panel */}
      <div className="rounded-2xl bg-slate-950/92 backdrop-blur-xl border border-amber-500/40 shadow-[0_20px_50px_rgba(0,0,0,0.75)] overflow-hidden text-slate-100">
        {/* Header Bar */}
        <div className="px-3.5 py-2.5 bg-gradient-to-r from-amber-500/20 via-orange-500/15 to-slate-900 border-b border-amber-500/30 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-amber-300 shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black tracking-wider uppercase text-amber-300 truncate">
                  Master Creator Studio
                </span>
                <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase bg-amber-500/20 text-amber-200 rounded border border-amber-400/30">
                  kikybahsoan
                </span>
              </div>
              <p className="text-[10px] text-slate-400 truncate">
                Bangunan, Taman, Hewan, Jalan, Pagar & NPC
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => setIsMinimized((v) => !v)}
              className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700"
              title={isMinimized ? 'Perluas Studio' : 'Kecilkan Studio'}
            >
              {isMinimized ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
            </button>
            <button
              type="button"
              onClick={onCloseStudio}
              className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-rose-950/80 hover:text-rose-300 text-slate-400 border border-slate-700"
              title="Tutup Creator Studio"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Quick Toolbar: Snap Grid vs Free + Save Button */}
        <div className="px-3 py-2 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onToggleSnapToGrid}
            className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1.5 border transition-all ${
              snapToGrid
                ? 'bg-sky-500/20 text-sky-300 border-sky-400/40'
                : 'bg-slate-800/90 text-slate-300 border-slate-700'
            }`}
            title="Ubah mode geser di peta: Snap ke Grid (0.5m) atau Posisi Bebas"
          >
            {snapToGrid ? <Grid className="w-3.5 h-3.5 text-sky-400" /> : <Move className="w-3.5 h-3.5 text-amber-400" />}
            <span>{snapToGrid ? 'Snap Grid (0.5)' : 'Posisi Bebas'}</span>
          </button>

          <button
            type="button"
            onClick={handleSaveClick}
            disabled={isSaving}
            className="flex-1 py-1.5 px-3 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-[11px] flex items-center justify-center gap-1.5 shadow-md shadow-emerald-950/50 transition-all cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Menyimpan...' : 'Simpan ke Kota'}</span>
          </button>
        </div>

        {/* Save confirmation banner */}
        {saveToast && (
          <div className="px-3 py-1.5 bg-emerald-500/20 border-b border-emerald-500/40 text-emerald-200 text-[11px] font-semibold flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>{saveToast}</span>
          </div>
        )}

        {/* Active Placement / Brush Banners */}
        {isPlacingModel && (
          <div className="px-3 py-2 bg-amber-500/20 border-b border-amber-400/40 flex items-center justify-between gap-2">
            <div className="text-[11px] text-amber-200 leading-tight">
              <span className="font-bold">Mode Pasang Gedung: {isPlacingModel.icon} {isPlacingModel.defaultName}</span>
              <span className="block text-[10px] text-amber-300/90">Klik di titik mana saja pada peta untuk menaruh bangunan!</span>
            </div>
            <button
              type="button"
              onClick={() => onStartPlacingModel(null)}
              className="px-2 py-1 rounded bg-slate-900/80 text-[10px] font-bold text-slate-300 hover:text-white border border-slate-700 shrink-0"
            >
              Batal
            </button>
          </div>
        )}

        {placingPropEntry && (
          <div className="px-3 py-2 bg-emerald-500/20 border-b border-emerald-400/40 flex items-center justify-between gap-2">
            <div className="text-[11px] text-emerald-200 leading-tight">
              <span className="font-bold">Mode Pasang Taman: {placingPropEntry.icon} {placingPropEntry.name}</span>
              <span className="block text-[10px] text-emerald-300/90">Klik di peta untuk menaruh pohon/bangku/ayunan/api unggun!</span>
            </div>
            <button
              type="button"
              onClick={() => onStartPlacingProp?.(null)}
              className="px-2 py-1 rounded bg-slate-900/80 text-[10px] font-bold text-slate-300 hover:text-white border border-slate-700 shrink-0"
            >
              Selesai
            </button>
          </div>
        )}

        {placingAnimalEntry && (
          <div className="px-3 py-2 bg-orange-500/20 border-b border-orange-400/40 flex items-center justify-between gap-2">
            <div className="text-[11px] text-orange-200 leading-tight">
              <span className="font-bold">Mode Lepas Hewan: {placingAnimalEntry.icon} {placingAnimalEntry.defaultName}</span>
              <span className="block text-[10px] text-orange-300/90">Klik di peta untuk melepas hewan lengkap dengan siklusnya!</span>
            </div>
            <button
              type="button"
              onClick={() => onStartPlacingAnimal?.(null)}
              className="px-2 py-1 rounded bg-slate-900/80 text-[10px] font-bold text-slate-300 hover:text-white border border-slate-700 shrink-0"
            >
              Selesai
            </button>
          </div>
        )}

        {activeTerrainBrush && (
          <div className="px-3 py-2 bg-sky-500/20 border-b border-sky-400/40 flex items-center justify-between gap-2">
            <div className="text-[11px] text-sky-200 leading-tight">
              <span className="font-bold">
                {activeTerrainBrush === 'eraser'
                  ? '🧹 Kuas Hapus Petak Tanah Aktif'
                  : `🖌️ Kuas Tanah/Jalan: ${
                      CREATOR_TERRAIN_CATALOG.find((t) => t.terrainType === activeTerrainBrush)?.name || activeTerrainBrush
                    }`}
              </span>
              <span className="block text-[10px] text-sky-300/90">
                Klik atau tahan & geser di peta untuk mengecat petak tanah/jalan!
              </span>
            </div>
            <button
              type="button"
              onClick={() => onSelectTerrainBrush?.(null)}
              className="px-2 py-1 rounded bg-slate-900/80 text-[10px] font-bold text-slate-300 hover:text-white border border-slate-700 shrink-0"
            >
              Matikan Kuas
            </button>
          </div>
        )}

        {placingFenceEntry && (
          <div className="px-3 py-2 bg-amber-500/20 border-b border-amber-400/40 flex items-center justify-between gap-2">
            <div className="text-[11px] text-amber-200 leading-tight">
              <span className="font-bold">Mode Pasang Pagar: {placingFenceEntry.name}</span>
              <span className="block text-[10px] text-amber-300/90">Klik di peta untuk memasang pagar!</span>
            </div>
            <button
              type="button"
              onClick={() => onStartPlacingFence?.(null)}
              className="px-2 py-1 rounded bg-slate-900/80 text-[10px] font-bold text-slate-300 hover:text-white border border-slate-700 shrink-0"
            >
              Selesai
            </button>
          </div>
        )}

        {isRecordingPatrolNpcId && (
          <div className="px-3 py-2 bg-fuchsia-500/20 border-b border-fuchsia-400/40 flex items-center justify-between gap-2">
            <div className="text-[11px] text-fuchsia-200 leading-tight">
              <span className="font-bold">Merekam Rute Patroli NPC</span>
              <span className="block text-[10px] text-fuchsia-300/90">Klik titik-titik jalan di peta untuk menambah rute patroli!</span>
            </div>
            <button
              type="button"
              onClick={() => onToggleRecordPatrol(null)}
              className="px-2 py-1 rounded bg-fuchsia-600 text-[10px] font-bold text-white shrink-0"
            >
              Selesai
            </button>
          </div>
        )}

        {!isMinimized && (
          <>
            {/* Navigation Tabs (2 Rows for 7 Studio Capabilities) */}
            <div className="grid grid-cols-4 bg-slate-900/80 border-b border-slate-800 text-[9.5px] font-bold">
              <button
                type="button"
                onClick={() => setActiveTab('catalog')}
                className={`py-1.5 px-1 flex flex-col items-center gap-0.5 border-b-2 transition-all ${
                  activeTab === 'catalog'
                    ? 'border-amber-400 text-amber-300 bg-amber-500/10'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Gedung ({creatorState.customBuildings.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('props')}
                className={`py-1.5 px-1 flex flex-col items-center gap-0.5 border-b-2 transition-all ${
                  activeTab === 'props'
                    ? 'border-emerald-400 text-emerald-300 bg-emerald-500/10'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Trees className="w-3.5 h-3.5" />
                <span>Pohon & Taman ({(creatorState.customProps || []).length})</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('animals')}
                className={`py-1.5 px-1 flex flex-col items-center gap-0.5 border-b-2 transition-all ${
                  activeTab === 'animals'
                    ? 'border-orange-400 text-orange-300 bg-orange-500/10'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <PawPrint className="w-3.5 h-3.5" />
                <span>Hewan ({(creatorState.customAnimals || []).length})</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('terrain')}
                className={`py-1.5 px-1 flex flex-col items-center gap-0.5 border-b-2 transition-all ${
                  activeTab === 'terrain'
                    ? 'border-teal-400 text-teal-300 bg-teal-500/10'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Paintbrush className="w-3.5 h-3.5" />
                <span>Tanah & Pagar</span>
              </button>
            </div>

            <div className="grid grid-cols-3 bg-slate-900/50 border-b border-slate-800 text-[9.5px] font-bold">
              <button
                type="button"
                onClick={() => setActiveTab('existing')}
                className={`py-1.5 px-1 flex items-center justify-center gap-1 border-b-2 transition-all ${
                  activeTab === 'existing'
                    ? 'border-sky-400 text-sky-300 bg-sky-500/10'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Building2 className="w-3 h-3" />
                <span>Objek Kota Bawaan</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('npcs')}
                className={`py-1.5 px-1 flex items-center justify-center gap-1 border-b-2 transition-all ${
                  activeTab === 'npcs'
                    ? 'border-emerald-400 text-emerald-300 bg-emerald-500/10'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Users className="w-3 h-3" />
                <span>NPC ({allNpcs.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('inspector')}
                className={`py-1.5 px-1 flex items-center justify-center gap-1 border-b-2 transition-all ${
                  activeTab === 'inspector'
                    ? 'border-fuchsia-400 text-fuchsia-300 bg-fuchsia-500/10'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Settings2 className="w-3 h-3" />
                <span>Atur Objek {selectedTarget ? '• Aktif' : ''}</span>
              </button>
            </div>

            {/* Tab Content Area */}
            <div className="max-h-[55vh] overflow-y-auto p-3 space-y-3 custom-scrollbar">
              {/* TAB 1: KATALOG STOCK BANGUNAN BARU */}
              {activeTab === 'catalog' && (
                <div className="space-y-3">
                  {/* Category Switcher (4 Kategori termasuk Model Kota Bawaan) */}
                  <div className="grid grid-cols-2 gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800">
                    <button
                      type="button"
                      onClick={() => setCatalogCategory('gedung_kantor')}
                      className={`py-1.5 px-2 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                        catalogCategory === 'gedung_kantor'
                          ? 'bg-sky-500/25 text-sky-200 border border-sky-400/40'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Building2 className="w-3 h-3" />
                      <span>Gedung & Lab (5)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCatalogCategory('arena_hiburan')}
                      className={`py-1.5 px-2 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                        catalogCategory === 'arena_hiburan'
                          ? 'bg-rose-500/25 text-rose-200 border border-rose-400/40'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Gamepad2 className="w-3 h-3" />
                      <span>Games & Acara (4)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCatalogCategory('fasilitas_taman')}
                      className={`py-1.5 px-2 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                        catalogCategory === 'fasilitas_taman'
                          ? 'bg-emerald-500/25 text-emerald-200 border border-emerald-400/40'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Trees className="w-3 h-3" />
                      <span>Kafe & Plaza (5)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCatalogCategory('objek_bawaan')}
                      className={`py-1.5 px-2 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                        catalogCategory === 'objek_bawaan'
                          ? 'bg-amber-500/25 text-amber-200 border border-amber-400/40'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>🏛️ Model Bawaan (15)</span>
                    </button>
                  </div>

                  {/* Stock Models List */}
                  <div className="space-y-2">
                    {CREATOR_STOCK_MODELS.filter((m) => m.category === catalogCategory).map((stock) => {
                      const isPlacingThis = isPlacingModel?.modelType === stock.modelType;
                      return (
                        <div
                          key={stock.modelType}
                          className={`p-2.5 rounded-xl border transition-all ${
                            isPlacingThis
                              ? 'bg-amber-500/15 border-amber-400/60'
                              : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-start gap-2.5 min-w-0">
                              <div
                                className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0 border"
                                style={{
                                  backgroundColor: `${stock.accentColor}22`,
                                  borderColor: `${stock.accentColor}66`,
                                }}
                              >
                                {stock.icon}
                              </div>
                              <div className="min-w-0">
                                <h4 className="text-xs font-bold text-slate-100 truncate">
                                  {stock.defaultName}
                                </h4>
                                <p className="text-[10px] text-slate-400 leading-snug mt-0.5">
                                  {stock.description}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="mt-2.5 flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                clearAllPlacementModes();
                                onStartPlacingModel(isPlacingThis ? null : stock);
                              }}
                              className={`flex-1 py-1.5 px-2.5 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 border transition-all cursor-pointer ${
                                isPlacingThis
                                  ? 'bg-amber-400 text-slate-950 border-amber-300'
                                  : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border-amber-500/40'
                              }`}
                            >
                              <MapPin className="w-3 h-3" />
                              <span>{isPlacingThis ? 'Klik Peta...' : 'Taruh di Peta'}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleQuickSpawnStock(stock)}
                              className="py-1.5 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold border border-slate-700 cursor-pointer"
                              title="Munculkan langsung di dekat posisi avatar Anda saat ini"
                            >
                              + Dekat Avatar
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Active Custom Buildings in City */}
                  {creatorState.customBuildings.length > 0 && (
                    <div className="pt-2 border-t border-slate-800 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300">
                          Bangunan Kreasi Aktif ({creatorState.customBuildings.length})
                        </span>
                        <span className="text-[10px] text-slate-400">Klik untuk Edit / Geser</span>
                      </div>
                      <div className="space-y-1.5">
                        {creatorState.customBuildings.map((b) => {
                          const isSel =
                            selectedTarget?.kind === 'custom_building' &&
                            selectedTarget.id === b.id;
                          return (
                            <div
                              key={b.id}
                              onClick={() => {
                                onSelectTarget({ kind: 'custom_building', id: b.id });
                                setActiveTab('inspector');
                              }}
                              className={`p-2 rounded-lg border flex items-center justify-between gap-2 cursor-pointer transition-all ${
                                isSel
                                  ? 'bg-amber-500/20 border-amber-400 text-white'
                                  : 'bg-slate-900/70 border-slate-800 hover:border-slate-700 text-slate-200'
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="text-base">{b.icon}</span>
                                <div className="min-w-0">
                                  <div className="text-xs font-bold truncate">{b.name}</div>
                                  <div className="text-[10px] text-slate-400 font-mono">
                                    X:{b.wx.toFixed(1)} • Y:{b.wy.toFixed(1)} • {b.templateType}
                                  </div>
                                </div>
                              </div>
                              <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: POHON, TEMPAT DUDUK, AYUNAN, API UNGGUN, PLAYGROUND, LAPANGAN, TANAMAN & KOLAM */}
              {activeTab === 'props' && (
                <div className="space-y-3">
                  <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-[10.5px] text-emerald-200 leading-relaxed">
                    Buat, pindahkan (Drag & Drop), atau hapus <strong>Pohon, Kursi, Ayunan, Api Unggun, Playground Anak, Lapangan Olahraga, Semak/Tanaman Hias, serta Kolam & Air Mancur</strong>. Seluruh elemen ini memiliki <strong>3 Pilihan Aktivitas Interaktif Avatar (+XP)</strong> saat diklik warga!
                  </div>

                  {/* Sub-category selector (8 kategori lengkap) */}
                  <div className="grid grid-cols-4 gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
                    <button
                      type="button"
                      onClick={() => setPropSubCategory('tree')}
                      className={`py-1.5 px-1 rounded-lg text-[9.5px] font-bold flex flex-col items-center gap-0.5 transition-all cursor-pointer ${
                        propSubCategory === 'tree'
                          ? 'bg-emerald-500/25 text-emerald-200 border border-emerald-400/40'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Trees className="w-3.5 h-3.5" />
                      <span>Pohon (6)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPropSubCategory('bench')}
                      className={`py-1.5 px-1 rounded-lg text-[9.5px] font-bold flex flex-col items-center gap-0.5 transition-all cursor-pointer ${
                        propSubCategory === 'bench'
                          ? 'bg-amber-500/25 text-amber-200 border border-amber-400/40'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Armchair className="w-3.5 h-3.5" />
                      <span>Kursi (5)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPropSubCategory('swing')}
                      className={`py-1.5 px-1 rounded-lg text-[9.5px] font-bold flex flex-col items-center gap-0.5 transition-all cursor-pointer ${
                        propSubCategory === 'swing'
                          ? 'bg-sky-500/25 text-sky-200 border border-sky-400/40'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <span>🎠</span>
                      <span>Ayunan (2)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPropSubCategory('campfire')}
                      className={`py-1.5 px-1 rounded-lg text-[9.5px] font-bold flex flex-col items-center gap-0.5 transition-all cursor-pointer ${
                        propSubCategory === 'campfire'
                          ? 'bg-orange-500/25 text-orange-200 border border-orange-400/40'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Flame className="w-3.5 h-3.5" />
                      <span>Api (2)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPropSubCategory('playground')}
                      className={`py-1.5 px-1 rounded-lg text-[9.5px] font-bold flex flex-col items-center gap-0.5 transition-all cursor-pointer ${
                        propSubCategory === 'playground'
                          ? 'bg-pink-500/25 text-pink-200 border border-pink-400/40'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <span>🛝</span>
                      <span>Playground (4)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPropSubCategory('sports_court')}
                      className={`py-1.5 px-1 rounded-lg text-[9.5px] font-bold flex flex-col items-center gap-0.5 transition-all cursor-pointer ${
                        propSubCategory === 'sports_court'
                          ? 'bg-indigo-500/25 text-indigo-200 border border-indigo-400/40'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <span>🏀</span>
                      <span>Lapangan (4)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPropSubCategory('shrub_plant')}
                      className={`py-1.5 px-1 rounded-lg text-[9.5px] font-bold flex flex-col items-center gap-0.5 transition-all cursor-pointer ${
                        propSubCategory === 'shrub_plant'
                          ? 'bg-lime-500/25 text-lime-200 border border-lime-400/40'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <span>🌺</span>
                      <span>Semak/Hias (5)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPropSubCategory('water_feature')}
                      className={`py-1.5 px-1 rounded-lg text-[9.5px] font-bold flex flex-col items-center gap-0.5 transition-all cursor-pointer ${
                        propSubCategory === 'water_feature'
                          ? 'bg-cyan-500/25 text-cyan-200 border border-cyan-400/40'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <span>⛲</span>
                      <span>Kolam/Air (4)</span>
                    </button>
                  </div>

                  {/* Catalog cards */}
                  <div className="space-y-2">
                    {CREATOR_PROP_CATALOG.filter((p) => p.category === propSubCategory).map((entry) => {
                      const isPlacingThis = placingPropEntry?.model === entry.model;
                      return (
                        <div
                          key={entry.model}
                          className={`p-2.5 rounded-xl border transition-all ${
                            isPlacingThis
                              ? 'bg-emerald-500/15 border-emerald-400/60'
                              : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-start gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-base shrink-0">
                              {entry.icon}
                            </div>
                            <div className="min-w-0 flex-1">
                              <h4 className="text-xs font-bold text-slate-100 truncate">
                                {entry.name}
                              </h4>
                              <p className="text-[10px] text-slate-400 leading-snug">
                                {entry.description}
                              </p>
                            </div>
                          </div>
                          <div className="mt-2 flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                clearAllPlacementModes();
                                onStartPlacingProp?.(isPlacingThis ? null : entry);
                              }}
                              className={`flex-1 py-1.5 px-2.5 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 border transition-all cursor-pointer ${
                                isPlacingThis
                                  ? 'bg-emerald-400 text-slate-950 border-emerald-300'
                                  : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border-emerald-500/40'
                              }`}
                            >
                              <MapPin className="w-3 h-3" />
                              <span>{isPlacingThis ? 'Klik Peta...' : 'Taruh di Peta'}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleQuickSpawnProp(entry)}
                              className="py-1.5 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold border border-slate-700 cursor-pointer"
                            >
                              + Dekat Avatar
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Active custom props list */}
                  {(creatorState.customProps || []).length > 0 && (
                    <div className="pt-2 border-t border-slate-800 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                          Properti Taman Dibuat ({(creatorState.customProps || []).length})
                        </span>
                        <span className="text-[10px] text-slate-400">Klik untuk Geser / Hapus</span>
                      </div>
                      <div className="space-y-1 max-h-44 overflow-y-auto pr-1">
                        {(creatorState.customProps || []).map((prop) => {
                          const catEntry = CREATOR_PROP_CATALOG.find((c) => c.model === prop.propModel);
                          const isSel =
                            selectedTarget?.kind === 'custom_prop' && selectedTarget.id === prop.id;
                          return (
                            <div
                              key={prop.id}
                              onClick={() => {
                                onSelectTarget({ kind: 'custom_prop', id: prop.id });
                                setActiveTab('inspector');
                              }}
                              className={`p-2 rounded-lg border flex items-center justify-between gap-2 cursor-pointer ${
                                isSel
                                  ? 'bg-emerald-500/20 border-emerald-400 text-white'
                                  : 'bg-slate-900/70 border-slate-800 hover:border-slate-700 text-slate-200'
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span>{catEntry?.icon || '🌳'}</span>
                                <div className="min-w-0">
                                  <div className="text-xs font-bold truncate">{prop.name}</div>
                                  <div className="text-[10px] text-slate-400 font-mono">
                                    ({prop.wx.toFixed(2)}, {prop.wy.toFixed(2)}) • {prop.scale.toFixed(1)}x
                                  </div>
                                </div>
                              </div>
                              <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: HEWAN & SIKLUS PERILAKU */}
              {activeTab === 'animals' && (
                <div className="space-y-3">
                  <div className="p-2 rounded-xl bg-orange-500/10 border border-orange-500/30 text-[10.5px] text-orange-200 leading-relaxed">
                    Tambahkan berbagai <strong>Hewan Kota & Hutan</strong> beserta <strong>Siklus Waktu Aktif</strong> (Siang/Malam/24 Jam) dan <strong>Siklus Perilaku</strong> (Merumput, Melompat, Patroli Orbit, atau Jaga Sarang).
                  </div>

                  <div className="space-y-2">
                    {CREATOR_ANIMAL_CATALOG.map((entry) => {
                      const isPlacingThis = placingAnimalEntry?.species === entry.species;
                      return (
                        <div
                          key={entry.species}
                          className={`p-2.5 rounded-xl border transition-all ${
                            isPlacingThis
                              ? 'bg-orange-500/15 border-orange-400/60'
                              : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-start gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-lg shrink-0">
                              {entry.icon}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <h4 className="text-xs font-bold text-slate-100 truncate">
                                  {entry.defaultName}
                                </h4>
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-orange-500/20 text-orange-300 border border-orange-500/30">
                                  {entry.defaultTimeCycle === 'diurnal'
                                    ? '☀️ Aktif Siang'
                                    : entry.defaultTimeCycle === 'nocturnal'
                                    ? '🌙 Aktif Malam'
                                    : '🔄 Sepanjang Hari'}
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-400 leading-snug mt-0.5">
                                {entry.description}
                              </p>
                            </div>
                          </div>

                          <div className="mt-2 flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                clearAllPlacementModes();
                                onStartPlacingAnimal?.(isPlacingThis ? null : entry);
                              }}
                              className={`flex-1 py-1.5 px-2.5 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 border transition-all cursor-pointer ${
                                isPlacingThis
                                  ? 'bg-orange-400 text-slate-950 border-orange-300'
                                  : 'bg-orange-500/20 hover:bg-orange-500/30 text-orange-200 border-orange-500/40'
                              }`}
                            >
                              <MapPin className="w-3 h-3" />
                              <span>{isPlacingThis ? 'Klik Peta...' : 'Lepas di Peta'}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleQuickSpawnAnimal(entry)}
                              className="py-1.5 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold border border-slate-700 cursor-pointer"
                            >
                              + Dekat Avatar
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Active Custom Animals */}
                  {(creatorState.customAnimals || []).length > 0 && (
                    <div className="pt-2 border-t border-slate-800 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-orange-300">
                          Hewan Aktif di Kota ({(creatorState.customAnimals || []).length})
                        </span>
                        <span className="text-[10px] text-slate-400">Klik untuk Atur Siklus</span>
                      </div>
                      <div className="space-y-1 max-h-44 overflow-y-auto pr-1">
                        {(creatorState.customAnimals || []).map((animal) => {
                          const cat = CREATOR_ANIMAL_CATALOG.find((c) => c.species === animal.species);
                          const isSel =
                            selectedTarget?.kind === 'custom_animal' &&
                            selectedTarget.id === animal.id;
                          return (
                            <div
                              key={animal.id}
                              onClick={() => {
                                onSelectTarget({ kind: 'custom_animal', id: animal.id });
                                setActiveTab('inspector');
                              }}
                              className={`p-2 rounded-lg border flex items-center justify-between gap-2 cursor-pointer ${
                                isSel
                                  ? 'bg-orange-500/20 border-orange-400 text-white'
                                  : 'bg-slate-900/70 border-slate-800 hover:border-slate-700 text-slate-200'
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span>{cat?.icon || '🦌'}</span>
                                <div className="min-w-0">
                                  <div className="text-xs font-bold truncate">{animal.name}</div>
                                  <div className="text-[10px] text-slate-400 font-mono">
                                    ({animal.homeWx.toFixed(1)}, {animal.homeWy.toFixed(1)}) • {animal.timeCycle} • {animal.behaviorCycle}
                                  </div>
                                </div>
                              </div>
                              <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: MENGGANTI MODEL TANAH, MEMBUAT JALAN & MEMBUAT PAGAR */}
              {activeTab === 'terrain' && (
                <div className="space-y-3">
                  {/* Section A: Terrain & Road Paint Brush */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10.5px] font-black uppercase tracking-wider text-teal-300 flex items-center gap-1.5">
                        <Paintbrush className="w-3.5 h-3.5" />
                        <span>1. Kuas Model Tanah & Pembuat Jalan</span>
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {terrainTileCount} Petak Diubah
                      </span>
                    </div>

                    <p className="text-[10px] text-slate-400 leading-relaxed">
                      Pilih model tanah atau paving (termasuk <strong>16 motif tanah dari referensi gambar</strong> & hamparan rumput lapangan) di bawah, lalu <strong>klik atau tahan & geser di peta</strong> untuk mengecat lantai kota.
                    </p>

                    <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center gap-2.5">
                      <img
                        src="/assets/aistudio/Jenis_Tanah_Tambahan_d5b803e2.jpg"
                        alt="16 Motif Tanah Referensi"
                        className="w-12 h-12 rounded-lg object-cover border border-teal-500/40 shrink-0"
                      />
                      <div className="text-[10px] text-slate-300 leading-snug">
                        <span className="font-bold text-teal-300 block">16 Tekstur Paving & Batu Referensi Aktif</span>
                        Motif #1 s/d #16 di bawah menggunakan tekstur persis sesuai kisi gambar referensi (4x4).
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5 max-h-64 overflow-y-auto pr-1">
                      {CREATOR_TERRAIN_CATALOG.map((t) => {
                        const isBrushActive = activeTerrainBrush === t.terrainType;
                        return (
                          <button
                            key={t.terrainType}
                            type="button"
                            onClick={() => {
                              clearAllPlacementModes();
                              onSelectTerrainBrush?.(isBrushActive ? null : t.terrainType);
                            }}
                            title={t.description}
                            className={`p-2 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
                              isBrushActive
                                ? 'bg-teal-500/25 border-teal-400 text-white shadow-sm'
                                : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 text-slate-200'
                            }`}
                          >
                            {t.spriteGridPos ? (
                              <div
                                className="w-7 h-7 rounded-lg shrink-0 border overflow-hidden"
                                style={{
                                  borderColor: t.borderColor,
                                  backgroundImage: 'url(/assets/aistudio/Jenis_Tanah_Tambahan_d5b803e2.jpg)',
                                  backgroundSize: '400% 400%',
                                  backgroundPosition: `${t.spriteGridPos.col * 33.333}% ${t.spriteGridPos.row * 33.333}%`,
                                }}
                              />
                            ) : (
                              <div
                                className="w-7 h-7 rounded-lg flex items-center justify-center text-xs shrink-0 border"
                                style={{
                                  backgroundColor: t.previewColor,
                                  borderColor: t.borderColor,
                                }}
                              >
                                {t.icon}
                              </div>
                            )}
                            <div className="min-w-0">
                              <div className="text-[10px] font-bold truncate">{t.name}</div>
                              <div className="text-[9px] text-slate-400 truncate">
                                {isBrushActive ? 'Kuas Aktif' : 'Klik & Cat Peta'}
                              </div>
                            </div>
                          </button>
                        );
                      })}

                      {/* Eraser button */}
                      <button
                        type="button"
                        onClick={() => {
                          clearAllPlacementModes();
                          onSelectTerrainBrush?.(activeTerrainBrush === 'eraser' ? null : 'eraser');
                        }}
                        className={`p-2 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
                          activeTerrainBrush === 'eraser'
                            ? 'bg-rose-500/25 border-rose-400 text-rose-200'
                            : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 text-slate-300'
                        }`}
                      >
                        <div className="w-6 h-6 rounded-lg bg-rose-950/80 border border-rose-500/40 flex items-center justify-center text-rose-300 shrink-0">
                          <Eraser className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-[10.5px] font-bold truncate">Hapus Petak Tanah</div>
                          <div className="text-[9px] text-slate-400 truncate">Kembali ke Tanah Asli</div>
                        </div>
                      </button>
                    </div>

                    {terrainTileCount > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          onUpdateCreatorState({
                            ...creatorState,
                            terrainTiles: {},
                          });
                        }}
                        className="w-full py-1.5 px-2.5 rounded-lg bg-slate-900 hover:bg-rose-950/60 text-slate-300 hover:text-rose-200 border border-slate-800 text-[10px] font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Reset Seluruh Cat Tanah & Jalan ({terrainTileCount} Petak)</span>
                      </button>
                    )}
                  </div>

                  {/* Section B: Fence Builder */}
                  <div className="pt-2.5 border-t border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10.5px] font-black uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                        <Fence className="w-3.5 h-3.5" />
                        <span>2. Pembuat Pagar Kota & Taman</span>
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {(creatorState.customFences || []).length} Pagar
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      {CREATOR_FENCE_CATALOG.map((fenceEntry) => {
                        const isPlacingThis = placingFenceEntry?.model === fenceEntry.model;
                        return (
                          <div
                            key={fenceEntry.model}
                            className={`p-2 rounded-xl border transition-all ${
                              isPlacingThis
                                ? 'bg-amber-500/15 border-amber-400/60'
                                : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="min-w-0">
                                <div className="text-xs font-bold text-slate-100">{fenceEntry.name}</div>
                                <div className="text-[10px] text-slate-400">{fenceEntry.description}</div>
                              </div>
                            </div>
                            <div className="mt-2 flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  clearAllPlacementModes();
                                  onStartPlacingFence?.(isPlacingThis ? null : fenceEntry);
                                }}
                                className={`flex-1 py-1.5 px-2 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 border cursor-pointer ${
                                  isPlacingThis
                                    ? 'bg-amber-400 text-slate-950 border-amber-300'
                                    : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border-amber-500/40'
                                }`}
                              >
                                <MapPin className="w-3 h-3" />
                                <span>{isPlacingThis ? 'Klik Peta...' : 'Pasang di Peta'}</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleQuickSpawnFence(fenceEntry)}
                                className="py-1.5 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold border border-slate-700 cursor-pointer"
                              >
                                + Dekat Avatar
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {(creatorState.customFences || []).length > 0 && (
                      <div className="space-y-1 pt-1">
                        <div className="text-[10px] font-bold text-amber-300">
                          Daftar Pagar Terpasang (Klik untuk Putar Arah / Panjang / Hapus):
                        </div>
                        <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                          {(creatorState.customFences || []).map((f) => {
                            const isSel =
                              selectedTarget?.kind === 'custom_fence' && selectedTarget.id === f.id;
                            return (
                              <div
                                key={f.id}
                                onClick={() => {
                                  onSelectTarget({ kind: 'custom_fence', id: f.id });
                                  setActiveTab('inspector');
                                }}
                                className={`p-2 rounded-lg border flex items-center justify-between gap-2 cursor-pointer ${
                                  isSel
                                    ? 'bg-amber-500/20 border-amber-400 text-white'
                                    : 'bg-slate-900/70 border-slate-800 hover:border-slate-700 text-slate-200'
                                }`}
                              >
                                <div className="min-w-0">
                                  <div className="text-xs font-bold truncate">{f.name}</div>
                                  <div className="text-[10px] text-slate-400 font-mono">
                                    ({f.wx.toFixed(1)}, {f.wy.toFixed(1)}) • Arah {f.axis.toUpperCase()} • {f.lengthTiles} Petak
                                  </div>
                                </div>
                                <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 5: OBJEK KOTA BAWAAN (GEDUNG, FASILITAS, BANGKU, AYUNAN, API UNGGUN, POHON) */}
              {activeTab === 'existing' && (
                <div className="space-y-2.5">
                  <div className="p-2 rounded-xl bg-sky-500/10 border border-sky-500/30 text-[10.5px] text-sky-200 leading-relaxed">
                    Pilih <strong>Gedung, Fasilitas, Bangku/Tempat Duduk, Ayunan, Api Unggun, atau Pohon Bawaan Kota</strong> untuk digeser langsung di peta (Drag & Drop), disembunyikan/dihapus, atau di-reset.
                  </div>

                  {/* Filter Category */}
                  <div className="grid grid-cols-3 gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
                    <button
                      type="button"
                      onClick={() => setExistingFilter('building_facility')}
                      className={`py-1.5 px-1.5 rounded-lg text-[9.5px] font-bold transition-all ${
                        existingFilter === 'building_facility'
                          ? 'bg-sky-500/25 text-sky-200 border border-sky-400/40'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      🏛️ Gedung & Fasilitas
                    </button>
                    <button
                      type="button"
                      onClick={() => setExistingFilter('bench_swing_campfire')}
                      className={`py-1.5 px-1.5 rounded-lg text-[9.5px] font-bold transition-all ${
                        existingFilter === 'bench_swing_campfire'
                          ? 'bg-amber-500/25 text-amber-200 border border-amber-400/40'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      🪑 Kursi, Ayunan & Api
                    </button>
                    <button
                      type="button"
                      onClick={() => setExistingFilter('trees')}
                      className={`py-1.5 px-1.5 rounded-lg text-[9.5px] font-bold transition-all ${
                        existingFilter === 'trees'
                          ? 'bg-emerald-500/25 text-emerald-200 border border-emerald-400/40'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      🌳 Pohon Kota (58)
                    </button>
                  </div>

                  <div className="space-y-1.5 max-h-[38vh] overflow-y-auto pr-1">
                    {EXISTING_CITY_OBJECTS_CATALOG.filter((item) => {
                      if (existingFilter === 'building_facility') {
                        return item.objectCategory === 'building' || item.objectCategory === 'facility';
                      }
                      if (existingFilter === 'bench_swing_campfire') {
                        return (
                          item.objectCategory === 'bench' ||
                          item.objectCategory === 'swing' ||
                          item.objectCategory === 'campfire'
                        );
                      }
                      return item.objectCategory === 'tree';
                    }).map((item) => {
                      const ov = creatorState.existingOverrides[item.id];
                      const curWx = ov ? ov.wx : item.defaultWx;
                      const curWy = ov ? ov.wy : item.defaultWy;
                      const curName = ov?.customName || item.defaultName;
                      const curIcon = ov?.customIcon || item.defaultIcon;
                      const isModified = Boolean(ov);
                      const isHidden = Boolean(ov?.isHidden);
                      const isSel =
                        selectedTarget?.kind === 'existing_object' &&
                        selectedTarget.id === item.id;

                      const builtinModelMap: Record<string, CreatorModelType> = {
                        balai_kota: 'builtin_balai_kota',
                        menara_mentor: 'builtin_studio_onair',
                        perpustakaan: 'builtin_perpustakaan',
                        pasar_prestasi: 'builtin_pasar_prestasi',
                        kantor_pos: 'builtin_kantor_pos',
                        taman_refleksi: 'builtin_taman_refleksi',
                        bengkel_latihan: 'builtin_lab_dkv',
                        masjid: 'builtin_masjid',
                        bank_materi: 'builtin_bank_materi',
                        monumen_warga: 'fountain_plaza',
                        pencakar_langit: 'builtin_pencakar_langit',
                        bandara: 'builtin_bandara',
                        cafe: 'builtin_lapak_cafe',
                        beringin: 'builtin_beringin_rumah_pohon',
                        literacy_corner: 'builtin_sudut_literasi',
                        announcement_board: 'builtin_papan_pengumuman',
                        rules_board: 'builtin_papan_pengumuman',
                      };
                      const mappedStockModelType = builtinModelMap[item.id];
                      const matchingStock = mappedStockModelType
                        ? CREATOR_STOCK_MODELS.find((s) => s.modelType === mappedStockModelType)
                        : null;

                      const handleDuplicateExistingToMap = (e: React.MouseEvent) => {
                        e.stopPropagation();
                        clearAllPlacementModes();
                        if (matchingStock) {
                          handleQuickSpawnStock({
                            ...matchingStock,
                            defaultName: `${curName} Baru`,
                          });
                          return;
                        }
                        if (item.objectCategory === 'bench') {
                          const benchEntry = CREATOR_PROP_CATALOG.find((p) => p.model === 'bench_wood_classic');
                          if (benchEntry) handleQuickSpawnProp({ ...benchEntry, name: `${curName} Baru` });
                          return;
                        }
                        if (item.objectCategory === 'swing') {
                          const swingEntry = CREATOR_PROP_CATALOG.find((p) => p.model === 'swing_wood_garden');
                          if (swingEntry) handleQuickSpawnProp({ ...swingEntry, name: `${curName} Baru` });
                          return;
                        }
                        if (item.objectCategory === 'campfire') {
                          const fireEntry = CREATOR_PROP_CATALOG.find((p) => p.model === 'campfire_stone_ring');
                          if (fireEntry) handleQuickSpawnProp({ ...fireEntry, name: `${curName} Baru` });
                          return;
                        }
                        if (item.objectCategory === 'tree') {
                          const treeEntry = CREATOR_PROP_CATALOG.find((p) => p.model === 'tree_banyan_shady');
                          if (treeEntry) handleQuickSpawnProp({ ...treeEntry, name: `${curName} Baru` });
                        }
                      };

                      return (
                        <div
                          key={item.id}
                          onClick={() => {
                            onSelectTarget({ kind: 'existing_object', id: item.id });
                            setActiveTab('inspector');
                          }}
                          className={`p-2 rounded-xl border flex items-center justify-between gap-2 cursor-pointer transition-all ${
                            isSel
                              ? 'bg-sky-500/20 border-sky-400 text-white'
                              : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 text-slate-200'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="text-base shrink-0">{curIcon}</span>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className={`text-xs font-bold truncate ${isHidden ? 'line-through text-slate-500' : ''}`}>
                                  {curName}
                                </span>
                                {isHidden && (
                                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold">
                                    Dihapus/Sembunyi
                                  </span>
                                )}
                                {!isHidden && isModified && (
                                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
                                    Dipindah
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono">
                                Posisi: ({curWx.toFixed(2)}, {curWy.toFixed(2)})
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={handleDuplicateExistingToMap}
                              className="px-2 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/35 text-amber-200 border border-amber-400/40 text-[9.5px] font-bold cursor-pointer"
                              title="Tambahkan duplikat model objek bawaan ini di dekat posisi avatar"
                            >
                              + Tambah Model
                            </button>
                            <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 6: KELOLA NPC & TAMBAH NPC BARU */}
              {activeTab === 'npcs' && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[11px] text-slate-300 leading-snug">
                      Atur posisi, kecepatan, radius jalan, rute patroli, atau tambah NPC baru.
                    </p>
                    <button
                      type="button"
                      onClick={handleAddNewNpc}
                      className="px-2.5 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold flex items-center gap-1 shrink-0 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>NPC Baru</span>
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    {allNpcs.map((npc) => {
                      const isSel =
                        selectedTarget?.kind === 'npc' && selectedTarget.id === npc.id;
                      const isModified = Boolean(creatorState.npcConfigs[npc.id]);
                      return (
                        <div
                          key={npc.id}
                          onClick={() => {
                            onSelectTarget({ kind: 'npc', id: npc.id });
                            setActiveTab('inspector');
                          }}
                          className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 cursor-pointer transition-all ${
                            isSel
                              ? 'bg-emerald-500/20 border-emerald-400 text-white'
                              : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 text-slate-200'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black text-white border border-white/20 shrink-0"
                              style={{ backgroundColor: npc.shirtColor }}
                            >
                              {npc.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-bold truncate">{npc.name}</span>
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                                  {npc.movementMode === 'static'
                                    ? 'Diam'
                                    : npc.movementMode === 'patrol'
                                    ? `Patroli (${npc.patrolWaypoints?.length || 0})`
                                    : `Keliling (${npc.wanderRadius}m)`}
                                </span>
                                {npc.isCustom ? (
                                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                                    Baru
                                  </span>
                                ) : (
                                  isModified && (
                                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
                                      Diubah
                                    </span>
                                  )
                                )}
                              </div>
                              <div className="text-[10px] text-slate-400 truncate">
                                {npc.role} • ({npc.homeWx.toFixed(1)}, {npc.homeWy.toFixed(1)})
                              </div>
                            </div>
                          </div>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 7: INSPECTOR OBJEK TERPILIH */}
              {activeTab === 'inspector' && (
                <div className="space-y-3">
                  {!selectedTarget && (
                    <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-center space-y-2">
                      <Compass className="w-7 h-7 text-slate-500 mx-auto" />
                      <div className="text-xs font-bold text-slate-300">
                        Belum Ada Objek yang Dipilih
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        Klik salah satu Bangunan, Pohon, Bangku, Ayunan, Api Unggun, Hewan, Pagar, atau NPC langsung di peta untuk mengatur posisi, siklus, atau menghapusnya.
                      </p>
                    </div>
                  )}

                  {/* A. INSPECTOR FOR CUSTOM BUILDING */}
                  {selectedCustomBuilding && (
                    <div className="space-y-3">
                      <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-xl">{selectedCustomBuilding.icon}</span>
                          <div className="min-w-0">
                            <div className="text-xs font-black text-amber-300 truncate">
                              {selectedCustomBuilding.name}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              Koordinat: ({selectedCustomBuilding.wx.toFixed(2)}, {selectedCustomBuilding.wy.toFixed(2)})
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => onPreviewCustomBuildingModal(selectedCustomBuilding)}
                            className="px-2 py-1 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 text-[10px] font-bold cursor-pointer"
                            title="Coba buka tampilan interaktif bangunan ini seperti yang dilihat warga"
                          >
                            Uji Fitur
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              onTeleportCameraOrAvatar(
                                selectedCustomBuilding.wx,
                                selectedCustomBuilding.wy + 0.65
                              )
                            }
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 cursor-pointer"
                            title="Bawa Avatar ke bangunan ini"
                          >
                            <Navigation className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Basic Identity */}
                      <div className="grid grid-cols-4 gap-2">
                        <div className="col-span-1">
                          <label className="block text-[10px] font-bold text-slate-400 mb-1">
                            Ikon
                          </label>
                          <input
                            type="text"
                            value={selectedCustomBuilding.icon}
                            onChange={(e) =>
                              updateSelectedCustomBuilding({ icon: e.target.value })
                            }
                            className="w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-center text-sm"
                          />
                        </div>
                        <div className="col-span-3">
                          <label className="block text-[10px] font-bold text-slate-400 mb-1">
                            Nama Bangunan / Fasilitas
                          </label>
                          <input
                            type="text"
                            value={selectedCustomBuilding.name}
                            onChange={(e) =>
                              updateSelectedCustomBuilding({ name: e.target.value })
                            }
                            className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 mb-1">
                          Slogan / Deskripsi Singkat di Atas Gedung
                        </label>
                        <input
                          type="text"
                          value={selectedCustomBuilding.tagline}
                          onChange={(e) =>
                            updateSelectedCustomBuilding({ tagline: e.target.value })
                          }
                          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                        />
                      </div>

                      {/* Position, Scale & Color */}
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 mb-1">
                            Posisi X (Timur-Barat)
                          </label>
                          <input
                            type="number"
                            step="0.25"
                            value={selectedCustomBuilding.wx}
                            onChange={(e) =>
                              updateSelectedCustomBuilding({
                                wx: parseFloat(e.target.value) || 0,
                              })
                            }
                            className="w-full px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 mb-1">
                            Posisi Y (Utara-Selatan)
                          </label>
                          <input
                            type="number"
                            step="0.25"
                            value={selectedCustomBuilding.wy}
                            onChange={(e) =>
                              updateSelectedCustomBuilding({
                                wy: parseFloat(e.target.value) || 0,
                              })
                            }
                            className="w-full px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 mb-1">
                            Ukuran ({selectedCustomBuilding.scale.toFixed(1)}x)
                          </label>
                          <input
                            type="range"
                            min="0.6"
                            max="1.8"
                            step="0.1"
                            value={selectedCustomBuilding.scale}
                            onChange={(e) =>
                              updateSelectedCustomBuilding({
                                scale: parseFloat(e.target.value) || 1.0,
                              })
                            }
                            className="w-full accent-amber-400 mt-1.5"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 mb-1">
                            Warna Aksen Utama
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={selectedCustomBuilding.accentColor}
                              onChange={(e) =>
                                updateSelectedCustomBuilding({ accentColor: e.target.value })
                              }
                              className="w-8 h-7 rounded bg-slate-900 border border-slate-700 cursor-pointer"
                            />
                            <span className="text-[10px] font-mono text-slate-300">
                              {selectedCustomBuilding.accentColor}
                            </span>
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 mb-1">
                            Warna Atap / Kubah
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={selectedCustomBuilding.roofColor}
                              onChange={(e) =>
                                updateSelectedCustomBuilding({ roofColor: e.target.value })
                              }
                              className="w-8 h-7 rounded bg-slate-900 border border-slate-700 cursor-pointer"
                            />
                            <span className="text-[10px] font-mono text-slate-300">
                              {selectedCustomBuilding.roofColor}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Template Kegunaan / Fungsi Interaktif */}
                      <div className="pt-2 border-t border-slate-800 space-y-2">
                        <label className="block text-[10px] font-black uppercase tracking-wider text-amber-300">
                          Template Kegunaan Saat Diklik Warga
                        </label>
                        <select
                          value={selectedCustomBuilding.templateType}
                          onChange={(e) =>
                            updateSelectedCustomBuilding({
                              templateType: e.target.value as CreatorTemplateType,
                            })
                          }
                          className="w-full px-2.5 py-2 rounded-xl bg-slate-900 border border-amber-500/40 text-xs font-bold text-white"
                        >
                          <option value="games">🕹️ Arena Games & Tantangan Kuis Berhadiah XP</option>
                          <option value="ideas">💡 Kotak Ide, Saran & Voting Warga</option>
                          <option value="facility_info">🏛️ Informasi Fasilitas, Materi & Tautan</option>
                          <option value="community_mission">🤝 Ruang Kumpul & Misi Komunitas Warga</option>
                        </select>

                        <div className="grid grid-cols-3 gap-2">
                          <div className="col-span-2">
                            <label className="block text-[10px] font-bold text-slate-400 mb-1">
                              Sapaan Pembuka Modal
                            </label>
                            <input
                              type="text"
                              value={selectedCustomBuilding.templateData.welcomeText}
                              onChange={(e) =>
                                updateSelectedCustomBuilding({
                                  templateData: {
                                    ...selectedCustomBuilding.templateData,
                                    welcomeText: e.target.value,
                                  },
                                })
                              }
                              className="w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 mb-1">
                              Hadiah XP
                            </label>
                            <input
                              type="number"
                              min="5"
                              max="100"
                              step="5"
                              value={selectedCustomBuilding.templateData.xpReward}
                              onChange={(e) =>
                                updateSelectedCustomBuilding({
                                  templateData: {
                                    ...selectedCustomBuilding.templateData,
                                    xpReward: Math.max(5, parseInt(e.target.value, 10) || 15),
                                  },
                                })
                              }
                              className="w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono text-amber-300 font-bold"
                            />
                          </div>
                        </div>

                        {/* Template Specific Fields */}
                        {selectedCustomBuilding.templateType === 'games' && (
                          <div className="space-y-2 p-2.5 rounded-xl bg-slate-900/90 border border-slate-800">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold text-rose-300">
                                Daftar Pertanyaan Kuis / Mini-Game ({selectedCustomBuilding.templateData.quizItems?.length || 0})
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  const cur = selectedCustomBuilding.templateData.quizItems || [];
                                  const nextQ: CreatorQuizItem = {
                                    id: `q-${Date.now().toString(36)}`,
                                    question: 'Pertanyaan tantangan baru untuk warga?',
                                    options: ['Pilihan A', 'Pilihan B', 'Pilihan C', 'Pilihan D'],
                                    correctIndex: 0,
                                    explanation: 'Penjelasan jawaban benar.',
                                  };
                                  updateSelectedCustomBuilding({
                                    templateData: {
                                      ...selectedCustomBuilding.templateData,
                                      quizItems: [...cur, nextQ],
                                    },
                                  });
                                }}
                                className="px-2 py-1 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-bold"
                              >
                                + Tambah Soal
                              </button>
                            </div>

                            <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                              {(selectedCustomBuilding.templateData.quizItems || []).map((q, qIdx) => (
                                <div
                                  key={q.id}
                                  className="p-2 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5"
                                >
                                  <div className="flex items-center justify-between gap-1">
                                    <span className="text-[10px] font-bold text-slate-400">
                                      Soal #{qIdx + 1}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const cur = selectedCustomBuilding.templateData.quizItems || [];
                                        updateSelectedCustomBuilding({
                                          templateData: {
                                            ...selectedCustomBuilding.templateData,
                                            quizItems: cur.filter((_, i) => i !== qIdx),
                                          },
                                        });
                                      }}
                                      className="text-rose-400 hover:text-rose-300 text-[10px]"
                                    >
                                      Hapus
                                    </button>
                                  </div>
                                  <input
                                    type="text"
                                    value={q.question}
                                    onChange={(e) => {
                                      const cur = [...(selectedCustomBuilding.templateData.quizItems || [])];
                                      cur[qIdx] = { ...cur[qIdx], question: e.target.value };
                                      updateSelectedCustomBuilding({
                                        templateData: {
                                          ...selectedCustomBuilding.templateData,
                                          quizItems: cur,
                                        },
                                      });
                                    }}
                                    className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-700 text-[11px] text-white"
                                    placeholder="Tulis pertanyaan..."
                                  />
                                  <div className="grid grid-cols-2 gap-1">
                                    {q.options.map((opt, oIdx) => (
                                      <div key={oIdx} className="flex items-center gap-1">
                                        <input
                                          type="radio"
                                          checked={q.correctIndex === oIdx}
                                          onChange={() => {
                                            const cur = [...(selectedCustomBuilding.templateData.quizItems || [])];
                                            cur[qIdx] = { ...cur[qIdx], correctIndex: oIdx };
                                            updateSelectedCustomBuilding({
                                              templateData: {
                                                ...selectedCustomBuilding.templateData,
                                                quizItems: cur,
                                              },
                                            });
                                          }}
                                          title="Tandai sebagai jawaban benar"
                                        />
                                        <input
                                          type="text"
                                          value={opt}
                                          onChange={(e) => {
                                            const cur = [...(selectedCustomBuilding.templateData.quizItems || [])];
                                            const nextOpts = [...cur[qIdx].options];
                                            nextOpts[oIdx] = e.target.value;
                                            cur[qIdx] = { ...cur[qIdx], options: nextOpts };
                                            updateSelectedCustomBuilding({
                                              templateData: {
                                                ...selectedCustomBuilding.templateData,
                                                quizItems: cur,
                                              },
                                            });
                                          }}
                                          className="w-full px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] text-slate-200"
                                        />
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {selectedCustomBuilding.templateType === 'ideas' && (
                          <div className="space-y-2 p-2.5 rounded-xl bg-slate-900/90 border border-slate-800">
                            <label className="block text-[10px] font-bold text-amber-300">
                              Topik Tantangan Ide / Pertanyaan Pemantik Warga
                            </label>
                            <textarea
                              rows={2}
                              value={selectedCustomBuilding.templateData.ideaPrompt || ''}
                              onChange={(e) =>
                                updateSelectedCustomBuilding({
                                  templateData: {
                                    ...selectedCustomBuilding.templateData,
                                    ideaPrompt: e.target.value,
                                  },
                                })
                              }
                              className="w-full px-2 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white"
                            />
                          </div>
                        )}

                        {selectedCustomBuilding.templateType === 'facility_info' && (
                          <div className="space-y-2 p-2.5 rounded-xl bg-slate-900/90 border border-slate-800">
                            <label className="block text-[10px] font-bold text-sky-300">
                              Informasi Layanan / Materi Bacaan Fasilitas
                            </label>
                            <textarea
                              rows={3}
                              value={selectedCustomBuilding.templateData.infoContent || ''}
                              onChange={(e) =>
                                updateSelectedCustomBuilding({
                                  templateData: {
                                    ...selectedCustomBuilding.templateData,
                                    infoContent: e.target.value,
                                  },
                                })
                              }
                              className="w-full px-2 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white"
                            />
                            <label className="block text-[10px] font-bold text-slate-400">
                              Tautan Luar / Link Materi atau Video (Opsional)
                            </label>
                            <input
                              type="url"
                              placeholder="https://..."
                              value={selectedCustomBuilding.templateData.externalUrl || ''}
                              onChange={(e) =>
                                updateSelectedCustomBuilding({
                                  templateData: {
                                    ...selectedCustomBuilding.templateData,
                                    externalUrl: e.target.value,
                                  },
                                })
                              }
                              className="w-full px-2 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white"
                            />
                          </div>
                        )}

                        {selectedCustomBuilding.templateType === 'community_mission' && (
                          <div className="space-y-2 p-2.5 rounded-xl bg-slate-900/90 border border-slate-800">
                            <label className="block text-[10px] font-bold text-emerald-300">
                              Daftar Langkah Misi Komunitas (Pisahkan per baris)
                            </label>
                            <textarea
                              rows={3}
                              value={(selectedCustomBuilding.templateData.missionChecklist || []).join('\n')}
                              onChange={(e) =>
                                updateSelectedCustomBuilding({
                                  templateData: {
                                    ...selectedCustomBuilding.templateData,
                                    missionChecklist: e.target.value
                                      .split('\n')
                                      .map((s) => s.trim())
                                      .filter(Boolean),
                                  },
                                })
                              }
                              className="w-full px-2 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white"
                            />
                          </div>
                        )}
                      </div>

                      {/* Delete Custom Building */}
                      <button
                        type="button"
                        onClick={() => {
                          const remaining = creatorState.customBuildings.filter(
                            (b) => b.id !== selectedCustomBuilding.id
                          );
                          onUpdateCreatorState({ ...creatorState, customBuildings: remaining });
                          onSelectTarget(null);
                        }}
                        className="w-full py-2 px-3 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Hapus Bangunan Ini dari Kota</span>
                      </button>
                    </div>
                  )}

                  {/* B. INSPECTOR FOR CUSTOM PROP (POHON, BANGKU, AYUNAN, API UNGGUN) */}
                  {selectedCustomProp && (
                    <div className="space-y-3">
                      <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <div className="text-xs font-black text-emerald-300 truncate">
                            {selectedCustomProp.name}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            Koordinat: ({selectedCustomProp.wx.toFixed(2)}, {selectedCustomProp.wy.toFixed(2)})
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            onTeleportCameraOrAvatar(
                              selectedCustomProp.wx,
                              selectedCustomProp.wy + 0.55
                            )
                          }
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 cursor-pointer"
                          title="Bawa Avatar ke objek ini"
                        >
                          <Navigation className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 mb-1">
                          Nama Properti Taman
                        </label>
                        <input
                          type="text"
                          value={selectedCustomProp.name}
                          onChange={(e) => updateSelectedCustomProp({ name: e.target.value })}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 mb-1">
                          Ganti Model ({selectedCustomProp.propCategory})
                        </label>
                        <select
                          value={selectedCustomProp.propModel}
                          onChange={(e) => {
                            const nextModel = e.target.value as CreatorPropModel;
                            const found = CREATOR_PROP_CATALOG.find((c) => c.model === nextModel);
                            updateSelectedCustomProp({
                              propModel: nextModel,
                              propCategory: found?.category || selectedCustomProp.propCategory,
                              name: found?.name || selectedCustomProp.name,
                            });
                          }}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                        >
                          {CREATOR_PROP_CATALOG.map((c) => (
                            <option key={c.model} value={c.model}>
                              {c.icon} {c.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 mb-1">
                            Posisi X
                          </label>
                          <input
                            type="number"
                            step="0.2"
                            value={selectedCustomProp.wx}
                            onChange={(e) =>
                              updateSelectedCustomProp({ wx: parseFloat(e.target.value) || 0 })
                            }
                            className="w-full px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 mb-1">
                            Posisi Y
                          </label>
                          <input
                            type="number"
                            step="0.2"
                            value={selectedCustomProp.wy}
                            onChange={(e) =>
                              updateSelectedCustomProp({ wy: parseFloat(e.target.value) || 0 })
                            }
                            className="w-full px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 mb-1">
                            Ukuran ({selectedCustomProp.scale.toFixed(1)}x)
                          </label>
                          <input
                            type="range"
                            min="0.6"
                            max="1.8"
                            step="0.1"
                            value={selectedCustomProp.scale}
                            onChange={(e) =>
                              updateSelectedCustomProp({ scale: parseFloat(e.target.value) || 1.0 })
                            }
                            className="w-full accent-emerald-400 mt-1.5"
                          />
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          const nextProps = (creatorState.customProps || []).filter(
                            (p) => p.id !== selectedCustomProp.id
                          );
                          onUpdateCreatorState({ ...creatorState, customProps: nextProps });
                          onSelectTarget(null);
                        }}
                        className="w-full py-2 px-3 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Hapus Properti Taman Ini</span>
                      </button>
                    </div>
                  )}

                  {/* C. INSPECTOR FOR CUSTOM ANIMAL & LIFE CYCLE */}
                  {selectedCustomAnimal && (
                    <div className="space-y-3">
                      <div className="p-2.5 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <div className="text-xs font-black text-orange-300 truncate">
                            {selectedCustomAnimal.name}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            Habitat: ({selectedCustomAnimal.homeWx.toFixed(2)}, {selectedCustomAnimal.homeWy.toFixed(2)})
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            onTeleportCameraOrAvatar(
                              selectedCustomAnimal.homeWx,
                              selectedCustomAnimal.homeWy + 0.55
                            )
                          }
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 cursor-pointer"
                          title="Bawa Avatar ke hewan ini"
                        >
                          <Navigation className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 mb-1">
                            Nama Hewan
                          </label>
                          <input
                            type="text"
                            value={selectedCustomAnimal.name}
                            onChange={(e) => updateSelectedCustomAnimal({ name: e.target.value })}
                            className="w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 mb-1">
                            Spesies Hewan
                          </label>
                          <select
                            value={selectedCustomAnimal.species}
                            onChange={(e) =>
                              updateSelectedCustomAnimal({
                                species: e.target.value as CreatorAnimalSpecies,
                              })
                            }
                            className="w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                          >
                            {CREATOR_ANIMAL_CATALOG.map((a) => (
                              <option key={a.species} value={a.species}>
                                {a.icon} {a.defaultName}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Siklus Waktu Aktif */}
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-wider text-orange-300 mb-1">
                          1. Siklus Waktu Aktif (Siang / Malam)
                        </label>
                        <select
                          value={selectedCustomAnimal.timeCycle}
                          onChange={(e) =>
                            updateSelectedCustomAnimal({
                              timeCycle: e.target.value as AnimalTimeCycle,
                            })
                          }
                          className="w-full px-2.5 py-1.5 rounded-xl bg-slate-900 border border-orange-500/40 text-xs font-bold text-white"
                        >
                          <option value="all_day">🔄 Aktif Sepanjang Hari (Pagi, Siang, Sore & Malam)</option>
                          <option value="diurnal">☀️ Diurnal (Aktif Pagi–Sore, Tidur 💤 Saat Malam)</option>
                          <option value="nocturnal">🌙 Nokturnal (Aktif Malam–Subuh, Tidur 💤 Saat Siang)</option>
                        </select>
                      </div>

                      {/* Siklus Perilaku */}
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-wider text-orange-300 mb-1">
                          2. Siklus Perilaku & Aktivitas Hidup
                        </label>
                        <select
                          value={selectedCustomAnimal.behaviorCycle}
                          onChange={(e) =>
                            updateSelectedCustomAnimal({
                              behaviorCycle: e.target.value as AnimalBehaviorCycle,
                            })
                          }
                          className="w-full px-2.5 py-1.5 rounded-xl bg-slate-900 border border-orange-500/40 text-xs font-bold text-white"
                        >
                          <option value="graze_wander">🌿 Siklus Alami (Berkeliling → Merumput/Makan → Istirahat)</option>
                          <option value="playful_hop">🐇 Melompat Lincah & Bermain di Sekitar Taman</option>
                          <option value="orbit_patrol">🔄 Patroli Mengitari Area Habitat</option>
                          <option value="stay_nest">🪺 Menjaga Sarang / Tetap di Titik Habitat</option>
                        </select>
                      </div>

                      {/* Habitat & Cycle Parameters */}
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 mb-1">
                            Titik Habitat X
                          </label>
                          <input
                            type="number"
                            step="0.25"
                            value={selectedCustomAnimal.homeWx}
                            onChange={(e) =>
                              updateSelectedCustomAnimal({
                                homeWx: parseFloat(e.target.value) || 0,
                              })
                            }
                            className="w-full px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 mb-1">
                            Titik Habitat Y
                          </label>
                          <input
                            type="number"
                            step="0.25"
                            value={selectedCustomAnimal.homeWy}
                            onChange={(e) =>
                              updateSelectedCustomAnimal({
                                homeWy: parseFloat(e.target.value) || 0,
                              })
                            }
                            className="w-full px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono text-white"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 mb-1">
                            Radius ({selectedCustomAnimal.wanderRadius.toFixed(1)}m)
                          </label>
                          <input
                            type="range"
                            min="0.4"
                            max="4.5"
                            step="0.2"
                            value={selectedCustomAnimal.wanderRadius}
                            onChange={(e) =>
                              updateSelectedCustomAnimal({
                                wanderRadius: parseFloat(e.target.value) || 1.5,
                              })
                            }
                            className="w-full accent-orange-400"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 mb-1">
                            Gerak ({selectedCustomAnimal.speed.toFixed(2)})
                          </label>
                          <input
                            type="range"
                            min="0.3"
                            max="1.6"
                            step="0.05"
                            value={selectedCustomAnimal.speed}
                            onChange={(e) =>
                              updateSelectedCustomAnimal({
                                speed: parseFloat(e.target.value) || 0.8,
                              })
                            }
                            className="w-full accent-orange-400"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 mb-1">
                            Durasi Siklus ({selectedCustomAnimal.cycleDurationSec}d)
                          </label>
                          <input
                            type="range"
                            min="8"
                            max="40"
                            step="2"
                            value={selectedCustomAnimal.cycleDurationSec}
                            onChange={(e) =>
                              updateSelectedCustomAnimal({
                                cycleDurationSec: parseInt(e.target.value, 10) || 16,
                              })
                            }
                            className="w-full accent-orange-400"
                          />
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          const nextAnimals = (creatorState.customAnimals || []).filter(
                            (a) => a.id !== selectedCustomAnimal.id
                          );
                          onUpdateCreatorState({ ...creatorState, customAnimals: nextAnimals });
                          onSelectTarget(null);
                        }}
                        className="w-full py-2 px-3 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Hapus Hewan Ini</span>
                      </button>
                    </div>
                  )}

                  {/* D. INSPECTOR FOR CUSTOM FENCE */}
                  {selectedCustomFence && (
                    <div className="space-y-3">
                      <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <div className="text-xs font-black text-amber-300 truncate">
                            {selectedCustomFence.name}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            Titik Awal: ({selectedCustomFence.wx.toFixed(1)}, {selectedCustomFence.wy.toFixed(1)})
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            onTeleportCameraOrAvatar(
                              selectedCustomFence.wx,
                              selectedCustomFence.wy + 0.5
                            )
                          }
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 cursor-pointer"
                        >
                          <Navigation className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 mb-1">
                          Model Pagar
                        </label>
                        <select
                          value={selectedCustomFence.fenceModel}
                          onChange={(e) => {
                            const nextModel = e.target.value as CreatorFenceModel;
                            const found = CREATOR_FENCE_CATALOG.find((f) => f.model === nextModel);
                            updateSelectedCustomFence({
                              fenceModel: nextModel,
                              name: found?.name || selectedCustomFence.name,
                            });
                          }}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                        >
                          {CREATOR_FENCE_CATALOG.map((f) => (
                            <option key={f.model} value={f.model}>
                              {f.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 mb-1">
                            Arah Bentangan Pagar
                          </label>
                          <div className="grid grid-cols-2 gap-1">
                            <button
                              type="button"
                              onClick={() => updateSelectedCustomFence({ axis: 'x' })}
                              className={`py-1.5 rounded-lg text-[10px] font-bold border cursor-pointer ${
                                selectedCustomFence.axis === 'x'
                                  ? 'bg-amber-500/25 border-amber-400 text-amber-200'
                                  : 'bg-slate-900 border-slate-800 text-slate-400'
                              }`}
                            >
                              ↔ Timur-Barat (X)
                            </button>
                            <button
                              type="button"
                              onClick={() => updateSelectedCustomFence({ axis: 'y' })}
                              className={`py-1.5 rounded-lg text-[10px] font-bold border cursor-pointer ${
                                selectedCustomFence.axis === 'y'
                                  ? 'bg-amber-500/25 border-amber-400 text-amber-200'
                                  : 'bg-slate-900 border-slate-800 text-slate-400'
                              }`}
                            >
                              ↕ Utara-Selatan (Y)
                            </button>
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 mb-1">
                            Panjang ({selectedCustomFence.lengthTiles} Petak)
                          </label>
                          <input
                            type="range"
                            min="1"
                            max="10"
                            step="1"
                            value={selectedCustomFence.lengthTiles}
                            onChange={(e) =>
                              updateSelectedCustomFence({
                                lengthTiles: parseInt(e.target.value, 10) || 1,
                              })
                            }
                            className="w-full accent-amber-400 mt-2"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 mb-1">
                            Posisi X
                          </label>
                          <input
                            type="number"
                            step="0.5"
                            value={selectedCustomFence.wx}
                            onChange={(e) =>
                              updateSelectedCustomFence({ wx: parseFloat(e.target.value) || 0 })
                            }
                            className="w-full px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 mb-1">
                            Posisi Y
                          </label>
                          <input
                            type="number"
                            step="0.5"
                            value={selectedCustomFence.wy}
                            onChange={(e) =>
                              updateSelectedCustomFence({ wy: parseFloat(e.target.value) || 0 })
                            }
                            className="w-full px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono text-white"
                          />
                        </div>
                      </div>

                      <label className="flex items-center gap-2 text-xs text-slate-200 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedCustomFence.hasCollision}
                          onChange={(e) =>
                            updateSelectedCustomFence({ hasCollision: e.target.checked })
                          }
                          className="w-4 h-4 rounded accent-amber-400"
                        />
                        <span>Aktifkan Batas Fisik (Avatar tidak bisa menembus pagar)</span>
                      </label>

                      <button
                        type="button"
                        onClick={() => {
                          const nextFences = (creatorState.customFences || []).filter(
                            (f) => f.id !== selectedCustomFence.id
                          );
                          onUpdateCreatorState({ ...creatorState, customFences: nextFences });
                          onSelectTarget(null);
                        }}
                        className="w-full py-2 px-3 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Hapus Pagar Ini</span>
                      </button>
                    </div>
                  )}

                  {/* E. INSPECTOR FOR EXISTING CITY OBJECT (GEDUNG, FASILITAS, BANGKU, AYUNAN, API UNGGUN, POHON) */}
                  {selectedExistingMeta && selectedExistingOverride && (
                    <div className="space-y-3">
                      <div className="p-2.5 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-xl">{selectedExistingOverride.customIcon || selectedExistingMeta.defaultIcon}</span>
                          <div className="min-w-0">
                            <div className="text-xs font-black text-sky-300 truncate">
                              {selectedExistingOverride.customName || selectedExistingMeta.defaultName}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              Posisi: ({selectedExistingOverride.wx.toFixed(2)}, {selectedExistingOverride.wy.toFixed(2)})
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            onTeleportCameraOrAvatar(
                              selectedExistingOverride.wx,
                              selectedExistingOverride.wy + 0.7
                            )
                          }
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
                          title="Bawa Avatar ke objek ini"
                        >
                          <Navigation className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-300">
                        💡 <strong>Tips Drag & Drop:</strong> Anda dapat langsung menekan & menggeser objek ini di atas peta untuk memindahkan lokasinya, atau klik tombol di bawah untuk menghapus/menyembunyikannya!
                      </div>

                      {(selectedExistingMeta.objectCategory === 'building' ||
                        selectedExistingMeta.objectCategory === 'facility') && (
                        <>
                          <div className="grid grid-cols-4 gap-2">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 mb-1">
                                Ikon
                              </label>
                              <input
                                type="text"
                                value={selectedExistingOverride.customIcon || selectedExistingMeta.defaultIcon}
                                onChange={(e) =>
                                  updateSelectedExistingObject({ customIcon: e.target.value })
                                }
                                className="w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-center text-sm"
                              />
                            </div>
                            <div className="col-span-3">
                              <label className="block text-[10px] font-bold text-slate-400 mb-1">
                                Nama Gedung / Fasilitas
                              </label>
                              <input
                                type="text"
                                value={selectedExistingOverride.customName || selectedExistingMeta.defaultName}
                                onChange={(e) =>
                                  updateSelectedExistingObject({ customName: e.target.value })
                                }
                                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 mb-1">
                              Tagline / Fungsi Gedung
                            </label>
                            <input
                              type="text"
                              value={selectedExistingOverride.customTagline || selectedExistingMeta.defaultTagline}
                              onChange={(e) =>
                                updateSelectedExistingObject({ customTagline: e.target.value })
                              }
                              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                            />
                          </div>
                        </>
                      )}

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 mb-1">
                            Koordinat X
                          </label>
                          <input
                            type="number"
                            step="0.2"
                            value={selectedExistingOverride.wx}
                            onChange={(e) =>
                              updateSelectedExistingObject({
                                wx: parseFloat(e.target.value) || 0,
                              })
                            }
                            className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 mb-1">
                            Koordinat Y
                          </label>
                          <input
                            type="number"
                            step="0.2"
                            value={selectedExistingOverride.wy}
                            onChange={(e) =>
                              updateSelectedExistingObject({
                                wy: parseFloat(e.target.value) || 0,
                              })
                            }
                            className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono text-white"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800">
                        <button
                          type="button"
                          onClick={() =>
                            updateSelectedExistingObject({
                              isHidden: !selectedExistingOverride.isHidden,
                            })
                          }
                          className={`flex-1 py-2 px-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
                            selectedExistingOverride.isHidden
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                              : 'bg-rose-500/15 text-rose-300 border-rose-500/30 hover:bg-rose-500/25'
                          }`}
                        >
                          {selectedExistingOverride.isHidden ? (
                            <>
                              <Eye className="w-3.5 h-3.5" />
                              <span>Tampilkan Kembali</span>
                            </>
                          ) : (
                            <>
                              <EyeOff className="w-3.5 h-3.5" />
                              <span>Hapus / Sembunyikan</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={resetSelectedExistingObject}
                          className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Reset Posisi</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* F. INSPECTOR FOR NPC (EXISTING OR CUSTOM) */}
                  {selectedNpc && (
                    <div className="space-y-3">
                      <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black text-white border border-white/20 shrink-0"
                            style={{ backgroundColor: selectedNpc.shirtColor }}
                          >
                            {selectedNpc.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-black text-emerald-300 truncate">
                              {selectedNpc.name}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              Pos Jaga: ({selectedNpc.homeWx.toFixed(2)}, {selectedNpc.homeWy.toFixed(2)})
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            onTeleportCameraOrAvatar(
                              selectedNpc.homeWx,
                              selectedNpc.homeWy + 0.5
                            )
                          }
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
                          title="Bawa Avatar ke NPC ini"
                        >
                          <Navigation className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div className="col-span-2">
                          <label className="block text-[10px] font-bold text-slate-400 mb-1">
                            Nama NPC
                          </label>
                          <input
                            type="text"
                            value={selectedNpc.name}
                            onChange={(e) => updateSelectedNpc({ name: e.target.value })}
                            className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 mb-1">
                            Gender
                          </label>
                          <select
                            value={selectedNpc.gender}
                            onChange={(e) =>
                              updateSelectedNpc({ gender: e.target.value as 'L' | 'P' })
                            }
                            className="w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                          >
                            <option value="L">Laki-laki</option>
                            <option value="P">Perempuan</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 mb-1">
                          Peran / Jabatan di Kota
                        </label>
                        <input
                          type="text"
                          value={selectedNpc.role}
                          onChange={(e) => updateSelectedNpc({ role: e.target.value })}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                        />
                      </div>

                      {/* Coordinates */}
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 mb-1">
                            Titik Pos X (Geser di Peta)
                          </label>
                          <input
                            type="number"
                            step="0.2"
                            value={selectedNpc.homeWx}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              updateSelectedNpc({ homeWx: val, wx: val });
                            }}
                            className="w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 mb-1">
                            Titik Pos Y (Geser di Peta)
                          </label>
                          <input
                            type="number"
                            step="0.2"
                            value={selectedNpc.homeWy}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              updateSelectedNpc({ homeWy: val, wy: val });
                            }}
                            className="w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono text-white"
                          />
                        </div>
                      </div>

                      {/* Movement Mode */}
                      <div className="pt-2 border-t border-slate-800 space-y-2">
                        <label className="block text-[10px] font-black uppercase tracking-wider text-emerald-300">
                          Pola Pergerakan NPC
                        </label>
                        <div className="grid grid-cols-3 gap-1.5">
                          {(
                            [
                              { mode: 'static', label: 'Diam Jaga' },
                              { mode: 'wander', label: 'Keliling Area' },
                              { mode: 'patrol', label: 'Rute Patroli' },
                            ] as Array<{ mode: NpcMovementMode; label: string }>
                          ).map((item) => (
                            <button
                              key={item.mode}
                              type="button"
                              onClick={() => updateSelectedNpc({ movementMode: item.mode })}
                              className={`py-1.5 px-2 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                                selectedNpc.movementMode === item.mode
                                  ? 'bg-emerald-500/25 text-emerald-200 border-emerald-400'
                                  : 'bg-slate-900 text-slate-400 border-slate-800'
                              }`}
                            >
                              {item.label}
                            </button>
                          ))}
                        </div>

                        {selectedNpc.movementMode === 'wander' && (
                          <div className="grid grid-cols-2 gap-2 pt-1">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 mb-1">
                                Radius Keliling ({selectedNpc.wanderRadius.toFixed(1)}m)
                              </label>
                              <input
                                type="range"
                                min="0.5"
                                max="5.0"
                                step="0.2"
                                value={selectedNpc.wanderRadius}
                                onChange={(e) =>
                                  updateSelectedNpc({
                                    wanderRadius: parseFloat(e.target.value) || 1.5,
                                  })
                                }
                                className="w-full accent-emerald-400"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 mb-1">
                                Kecepatan Jalan ({selectedNpc.speed.toFixed(2)})
                              </label>
                              <input
                                type="range"
                                min="0.3"
                                max="1.4"
                                step="0.05"
                                value={selectedNpc.speed}
                                onChange={(e) =>
                                  updateSelectedNpc({
                                    speed: parseFloat(e.target.value) || 0.6,
                                  })
                                }
                                className="w-full accent-emerald-400"
                              />
                            </div>
                          </div>
                        )}

                        {selectedNpc.movementMode === 'patrol' && (
                          <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold text-fuchsia-300">
                                Titik Rute Patroli ({selectedNpc.patrolWaypoints?.length || 0} Titik)
                              </span>
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() =>
                                    onToggleRecordPatrol(
                                      isRecordingPatrolNpcId === selectedNpc.id
                                        ? null
                                        : selectedNpc.id
                                    )
                                  }
                                  className={`px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer ${
                                    isRecordingPatrolNpcId === selectedNpc.id
                                      ? 'bg-fuchsia-500 text-white'
                                      : 'bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/40'
                                  }`}
                                >
                                  <Footprints className="w-3 h-3" />
                                  <span>
                                    {isRecordingPatrolNpcId === selectedNpc.id
                                      ? 'Stop Rekam'
                                      : '+ Klik Rute di Peta'}
                                  </span>
                                </button>
                                {(selectedNpc.patrolWaypoints?.length || 0) > 0 && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      updateSelectedNpc({ patrolWaypoints: [] })
                                    }
                                    className="px-2 py-1 rounded bg-slate-800 text-slate-300 text-[10px]"
                                  >
                                    Bersihkan
                                  </button>
                                )}
                              </div>
                            </div>
                            <p className="text-[10px] text-slate-400">
                              Tekan <strong>+ Klik Rute di Peta</strong> lalu klik beberapa titik jalan di peta untuk membuat jalur patroli NPC.
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Outfit Colors */}
                      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 mb-1">
                            Warna Baju
                          </label>
                          <input
                            type="color"
                            value={selectedNpc.shirtColor}
                            onChange={(e) =>
                              updateSelectedNpc({ shirtColor: e.target.value })
                            }
                            className="w-full h-7 rounded bg-slate-900 border border-slate-700 cursor-pointer"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 mb-1">
                            Warna Celana
                          </label>
                          <input
                            type="color"
                            value={selectedNpc.pantsColor}
                            onChange={(e) =>
                              updateSelectedNpc({ pantsColor: e.target.value })
                            }
                            className="w-full h-7 rounded bg-slate-900 border border-slate-700 cursor-pointer"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 mb-1">
                            Warna Topi
                          </label>
                          <input
                            type="color"
                            value={selectedNpc.hatColor || '#f59e0b'}
                            onChange={(e) =>
                              updateSelectedNpc({ hatColor: e.target.value })
                            }
                            className="w-full h-7 rounded bg-slate-900 border border-slate-700 cursor-pointer"
                          />
                        </div>
                      </div>

                      {/* Speeches / Dialogue */}
                      <div className="pt-2 border-t border-slate-800 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-bold text-slate-300 flex items-center gap-1">
                            <MessageSquarePlus className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Kalimat Sapaan / Dialog NPC (1 per baris)</span>
                          </label>
                        </div>
                        <textarea
                          rows={3}
                          value={(selectedNpc.speeches || []).join('\n')}
                          onChange={(e) =>
                            updateSelectedNpc({
                              speeches: e.target.value
                                .split('\n')
                                .map((s) => s.trim())
                                .filter(Boolean),
                            })
                          }
                          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                          placeholder="Tulis kalimat dialog per baris..."
                        />
                      </div>

                      {/* Reset or Delete NPC */}
                      <div className="pt-2 border-t border-slate-800 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={deleteOrResetSelectedNpc}
                          className={`w-full py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
                            selectedNpc.isCustom
                              ? 'bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border-rose-500/30'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                          }`}
                        >
                          {selectedNpc.isCustom ? (
                            <>
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Hapus NPC Kustom Ini</span>
                            </>
                          ) : (
                            <>
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>Reset NPC ke Pengaturan Awal</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// CITIZEN INTERACTIVE MODAL WHEN VISITING A CUSTOM BUILDING
// ============================================================================

interface CreatorBuildingCitizenModalProps {
  building: CreatorBuildingItem;
  currentUser: Student | null;
  isMasterKiky: boolean;
  onClose: () => void;
  onAwardCitizenXp: (xp: number, label: string) => void;
  onEditInStudio?: () => void;
}

export const CreatorBuildingCitizenModal: React.FC<CreatorBuildingCitizenModalProps> = ({
  building,
  currentUser,
  isMasterKiky,
  onClose,
  onAwardCitizenXp,
  onEditInStudio,
}) => {
  // Quiz state
  const quizList = building.templateData.quizItems || [];
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(0);

  // Idea state
  const [ideaInput, setIdeaInput] = useState('');
  const [ideaFeedback, setIdeaFeedback] = useState<string | null>(null);

  // Mission state
  const [checkedSteps, setCheckedSteps] = useState<Record<number, boolean>>({});
  const [missionNote, setMissionNote] = useState('');
  const [missionClaimed, setMissionClaimed] = useState(false);

  // Facility info claim state
  const [infoClaimed, setInfoClaimed] = useState(false);

  const citizenId = currentUser?.id || 'guest-citizen';
  const citizenName = currentUser?.name || 'Warga Refleksia';
  const citizenClass = currentUser?.className || 'Warga Kota';

  const handleSubmitQuiz = async () => {
    if (quizList.length === 0) return;
    let correct = 0;
    quizList.forEach((q) => {
      if (selectedAnswers[q.id] === q.correctIndex) {
        correct += 1;
      }
    });
    setQuizScore(correct);
    setQuizSubmitted(true);
    const earnedXp = Math.max(5, Math.round((correct / quizList.length) * (building.templateData.xpReward || 15)));
    onAwardCitizenXp(earnedXp, `Menyelesaikan Tantangan di ${building.name}`);
    await StorageService.recordCreatorBuildingQuizScore(building.id, {
      studentId: citizenId,
      studentName: citizenName,
      score: correct,
    });
  };

  const handleSubmitIdea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ideaInput.trim()) return;
    await StorageService.submitCreatorBuildingIdea(building.id, {
      authorId: citizenId,
      authorName: citizenName,
      className: citizenClass,
      content: ideaInput.trim(),
    });
    setIdeaInput('');
    setIdeaFeedback(`Ide berhasil dikirim! +${building.templateData.xpReward || 15} XP`);
    onAwardCitizenXp(building.templateData.xpReward || 15, `Mengirim Ide di ${building.name}`);
    setTimeout(() => setIdeaFeedback(null), 4000);
  };

  const handleVoteIdea = async (ideaId: string) => {
    await StorageService.voteCreatorBuildingIdea(building.id, ideaId, citizenId);
  };

  const handleSubmitMission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!missionNote.trim()) return;
    await StorageService.submitCreatorBuildingMission(building.id, {
      studentId: citizenId,
      studentName: citizenName,
      className: citizenClass,
      responseText: missionNote.trim(),
    });
    setMissionNote('');
    if (!missionClaimed) {
      setMissionClaimed(true);
      onAwardCitizenXp(
        building.templateData.xpReward || 15,
        `Menuntaskan Misi Komunitas di ${building.name}`
      );
    }
  };

  const handleClaimFacilityVisit = () => {
    if (infoClaimed) return;
    setInfoClaimed(true);
    onAwardCitizenXp(
      building.templateData.xpReward || 15,
      `Kunjungan Literasi & Eksplorasi di ${building.name}`
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md">
      <div className="relative w-full max-w-2xl max-h-[88vh] rounded-3xl bg-slate-900 border border-slate-700/80 shadow-2xl overflow-hidden flex flex-col text-slate-100">
        {/* Header */}
        <div
          className="px-6 py-4 border-b border-slate-800 flex items-center justify-between gap-3"
          style={{
            background: `linear-gradient(135deg, ${building.accentColor}30, rgba(15,23,42,0.95))`,
          }}
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl border shrink-0 shadow-inner"
              style={{
                backgroundColor: `${building.accentColor}25`,
                borderColor: `${building.accentColor}66`,
              }}
            >
              {building.icon}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-black text-white truncate">{building.name}</h2>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  +{building.templateData.xpReward || 15} XP
                </span>
              </div>
              <p className="text-xs text-slate-300 truncate">{building.tagline}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isMasterKiky && onEditInStudio && (
              <button
                type="button"
                onClick={onEditInStudio}
                className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Settings2 className="w-3.5 h-3.5" />
                <span>Edit di Studio</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Welcome Banner */}
          <div className="p-4 rounded-2xl bg-slate-800/70 border border-slate-700/70 text-sm text-slate-200 leading-relaxed">
            {building.templateData.welcomeText}
          </div>

          {/* 1. TEMPLATE: GAMES & QUIZ */}
          {building.templateType === 'games' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black uppercase tracking-wider text-rose-300 flex items-center gap-2">
                  <Gamepad2 className="w-4 h-4" />
                  <span>{building.templateData.gameTitle || `Tantangan Kuis ${building.name}`}</span>
                </h3>
                {quizSubmitted && (
                  <span className="px-3 py-1 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold">
                    Skor Kamu: {quizScore} / {quizList.length} Benar!
                  </span>
                )}
              </div>

              <div className="space-y-3">
                {quizList.map((q, idx) => (
                  <div
                    key={q.id}
                    className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2.5"
                  >
                    <div className="text-xs font-bold text-slate-100">
                      {idx + 1}. {q.question}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {q.options.map((opt, oIdx) => {
                        const isSelected = selectedAnswers[q.id] === oIdx;
                        const isCorrect = q.correctIndex === oIdx;
                        let btnStyle =
                          'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-600';
                        if (quizSubmitted) {
                          if (isCorrect) {
                            btnStyle = 'bg-emerald-500/25 border-emerald-400 text-emerald-200 font-bold';
                          } else if (isSelected) {
                            btnStyle = 'bg-rose-500/25 border-rose-400 text-rose-200';
                          }
                        } else if (isSelected) {
                          btnStyle = 'bg-sky-500/25 border-sky-400 text-sky-200 font-bold';
                        }

                        return (
                          <button
                            key={oIdx}
                            type="button"
                            disabled={quizSubmitted}
                            onClick={() =>
                              setSelectedAnswers((prev) => ({ ...prev, [q.id]: oIdx }))
                            }
                            className={`p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer ${btnStyle}`}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                    {quizSubmitted && q.explanation && (
                      <div className="text-[11px] text-amber-300/90 pt-1">
                        💡 {q.explanation}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {!quizSubmitted ? (
                <button
                  type="button"
                  onClick={handleSubmitQuiz}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-400 hover:to-amber-400 text-slate-950 font-black text-sm shadow-lg cursor-pointer"
                >
                  Kirim Jawaban & Klaim XP
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setQuizSubmitted(false);
                    setSelectedAnswers({});
                  }}
                  className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold cursor-pointer"
                >
                  Mainkan Ulang Tantangan
                </button>
              )}

              {/* High Scores */}
              {(building.templateData.highScores?.length || 0) > 0 && (
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
                  <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                    <Trophy className="w-4 h-4" />
                    <span>Papan Skor Warga Terbaik</span>
                  </div>
                  <div className="space-y-1">
                    {(building.templateData.highScores || []).slice(0, 5).map((hs, i) => (
                      <div
                        key={`${hs.studentId}-${i}`}
                        className="flex items-center justify-between text-xs py-1 border-b border-slate-800/60 last:border-0"
                      >
                        <span className="text-slate-200 font-semibold">
                          #{i + 1} {hs.studentName}
                        </span>
                        <span className="font-mono text-amber-300 font-bold">
                          {hs.score}/{quizList.length} Benar
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 2. TEMPLATE: IDEAS & CITIZEN VOTING */}
          {building.templateType === 'ideas' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30">
                <div className="text-xs font-black uppercase tracking-wider text-amber-300 flex items-center gap-1.5 mb-1">
                  <Lightbulb className="w-4 h-4" />
                  <span>Tantangan Ide & Gagasan Warga</span>
                </div>
                <p className="text-sm text-slate-100">
                  {building.templateData.ideaPrompt ||
                    `Bagikan ide kreatif atau usulan terbaikmu di ${building.name}!`}
                </p>
              </div>

              <form onSubmit={handleSubmitIdea} className="space-y-2.5">
                <textarea
                  rows={3}
                  value={ideaInput}
                  onChange={(e) => setIdeaInput(e.target.value)}
                  placeholder="Tulis ide, inovasi, atau saran positifmu di sini..."
                  className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-700 text-sm text-white focus:border-amber-400 outline-none"
                />
                <div className="flex items-center justify-between gap-2">
                  {ideaFeedback ? (
                    <span className="text-xs text-emerald-300 font-bold">{ideaFeedback}</span>
                  ) : (
                    <span className="text-xs text-slate-400">
                      Setiap kiriman ide memberi +{building.templateData.xpReward || 15} XP
                    </span>
                  )}
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs cursor-pointer"
                  >
                    Kirim Ide Warga
                  </button>
                </div>
              </form>

              <div className="space-y-2 pt-2">
                <div className="text-xs font-bold text-slate-300">
                  Dinding Ide Warga ({building.templateData.ideas?.length || 0})
                </div>
                {(building.templateData.ideas || []).length === 0 ? (
                  <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800 text-xs text-slate-400 text-center">
                    Belum ada ide yang dikirim. Jadilah warga pertama yang berbagi gagasan!
                  </div>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {(building.templateData.ideas || []).map((item) => {
                      const hasVoted = (item.votedBy || []).includes(citizenId);
                      return (
                        <div
                          key={item.id}
                          className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-start justify-between gap-3"
                        >
                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-amber-300">
                                {item.authorName}
                              </span>
                              <span className="text-[10px] text-slate-500">
                                {item.className} • {item.createdAt}
                              </span>
                            </div>
                            <p className="text-xs text-slate-200 leading-relaxed">
                              {item.content}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleVoteIdea(item.id)}
                            className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 shrink-0 cursor-pointer ${
                              hasVoted
                                ? 'bg-amber-500/25 text-amber-300 border-amber-400'
                                : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-white'
                            }`}
                          >
                            <ThumbsUp className="w-3.5 h-3.5" />
                            <span>{item.votes || 0}</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 3. TEMPLATE: FACILITY INFO & MEDIA */}
          {building.templateType === 'facility_info' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                <h3 className="text-sm font-bold text-sky-300">
                  Informasi & Materi Layanan {building.name}
                </h3>
                <div className="text-xs text-slate-200 whitespace-pre-line leading-relaxed">
                  {building.templateData.infoContent ||
                    'Selamat berkunjung di fasilitas publik Kota Refleksia.'}
                </div>

                {building.templateData.externalUrl && (
                  <a
                    href={building.templateData.externalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 text-xs font-bold"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Buka Tautan Materi / Media Terkait</span>
                  </a>
                )}
              </div>

              <button
                type="button"
                onClick={handleClaimFacilityVisit}
                disabled={infoClaimed}
                className={`w-full py-3 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  infoClaimed
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-gradient-to-r from-sky-400 to-teal-400 text-slate-950 shadow-lg'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {infoClaimed
                    ? `XP Kunjungan Telah Diklaim (+${building.templateData.xpReward || 15} XP)`
                    : `Tandai Selesai Membaca & Klaim +${building.templateData.xpReward || 15} XP`}
                </span>
              </button>
            </div>
          )}

          {/* 4. TEMPLATE: COMMUNITY MISSION */}
          {building.templateType === 'community_mission' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-2.5">
                <div className="text-xs font-black uppercase tracking-wider text-emerald-300">
                  Daftar Misi & Aktivitas Komunitas
                </div>
                <div className="space-y-2">
                  {(building.templateData.missionChecklist || []).map((step, idx) => (
                    <label
                      key={idx}
                      className="flex items-center gap-2.5 text-xs text-slate-100 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={Boolean(checkedSteps[idx])}
                        onChange={(e) =>
                          setCheckedSteps((prev) => ({ ...prev, [idx]: e.target.checked }))
                        }
                        className="w-4 h-4 rounded accent-emerald-400"
                      />
                      <span>{step}</span>
                    </label>
                  ))}
                </div>
              </div>

              <form onSubmit={handleSubmitMission} className="space-y-2.5">
                <label className="block text-xs font-bold text-slate-300">
                  Tuliskan Laporan Singkat / Kesan Kehadiranmu di Fasilitas Ini:
                </label>
                <textarea
                  rows={2}
                  value={missionNote}
                  onChange={(e) => setMissionNote(e.target.value)}
                  placeholder="Contoh: Saya sudah berdiskusi bersama teman-teman tentang proyek desain hari ini..."
                  className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-700 text-xs text-white"
                />
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black text-xs cursor-pointer"
                >
                  Kirim Catatan Kehadiran & Klaim +{building.templateData.xpReward || 15} XP
                </button>
              </form>

              {(building.templateData.submissions?.length || 0) > 0 && (
                <div className="space-y-2 pt-2">
                  <div className="text-xs font-bold text-slate-300">
                    Jejak Kehadiran Warga ({building.templateData.submissions?.length || 0})
                  </div>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {(building.templateData.submissions || []).map((sub) => (
                      <div
                        key={sub.id}
                        className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-emerald-300">{sub.studentName}</span>
                          <span className="text-[10px] text-slate-500">
                            {sub.className} • {sub.createdAt}
                          </span>
                        </div>
                        <p className="text-slate-200">{sub.responseText}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
