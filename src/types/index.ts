export type BuildingId =
  | 'balai_kota'
  | 'perpustakaan'
  | 'taman_refleksi'
  | 'menara_mentor'
  | 'bengkel_latihan'
  | 'kantor_pos'
  | 'pasar_prestasi'
  | 'monumen_warga'
  | 'masjid'
  | 'bank_materi'
  | 'pencakar_langit'
  | 'latihan_tentara'
  | 'museum_seni'
  | 'panggung_kota'
  | 'mall_kota'
  | 'bandara'
  | 'arena_rumah_misteri'
  | 'menara_asesmen';

export interface PublicChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderHandle: string; // e.g. "@budi_dkv"
  className: string;
  roomNumber: 1 | 2 | 3;
  content: string; // max 120 chars
  timestamp: string; // e.g. "23.12"
  createdAt: string; // ISO
  avatarColor?: string;
  isReported?: boolean;
  isTeacher?: boolean;
  isGuest?: boolean;
}

export interface StudentActivityBreakdown {
  logins: number;
  missions: number;
  reflections: number;
  chats: number;
  quizzes: number;
  messages: number;
  total: number;
}

export interface Student {
  id: string;
  name: string;
  className: string;
  studentNumber?: string;
  password?: string;
  gender?: string;
  points: number;
  badges: string[];
  lastLogin: string;
  streakDays: number;
  isTeacher?: boolean;
  isGuest?: boolean;
  subject?: string;
  loginCount?: number;
  completedMissionsCount?: number;
  quizCount?: number;
  activityStats?: Partial<StudentActivityBreakdown>;
  totalActivities?: number;
}

export interface Materi {
  id: string;
  title: string;
  subject: string;
  targetClass: string;
  content: string;
  link?: string;
  videoUrl?: string;
  location: BuildingId;
  createdAt: string;
  isNew?: boolean;
  isActive?: boolean;
  hiddenClasses?: string[];
  customQuestions?: string[];
  elemen?: string;
  tujuanPembelajaran?: string;
  materiEsensial?: string;
  teacherName?: string;
  bankMateriId?: string;
}

export interface LearningObjective {
  id: string;
  materiId: string;
  goalStatement: string;
  indicator: string;
  deadline: string;
}

export interface ReflectionAnswers {
  understood?: string;
  difficult?: string;
  actionPlan?: string;
  facts?: string;
  feelings?: string;
  findings?: string;
  future?: string;
  materiTitle?: string;
  mood?: string;
  customAnswers?: Record<string, string>;
}

export interface Reflection {
  id: string;
  studentId: string;
  studentName: string;
  studentNumber?: string;
  className: string;
  materiId: string;
  materiTitle?: string;
  scale: number;
  moodEmoji?: string;
  answers: ReflectionAnswers;
  rating?: number;
  createdAt: string;
  status?: 'pending' | 'reviewed';
}

export interface ReflectionEntry {
  id: string;
  title: string;
  subject: string;
  facts: string;
  feelings: string;
  findings: string;
  future: string;
  date: string;
  xpEarned: number;
  studentId?: string;
  studentName?: string;
  className?: string;
}

export interface MentorFeedback {
  id: string;
  reflectionId: string;
  studentId?: string;
  apresiasi?: string;
  saran?: string | string[];
  rekomendasiTindakan?: string;
  pertanyaanLanjutan?: string;
  skorRefleksi?: number;
  sudah_dikuasai?: string[];
  perlu_diperkuat?: string[];
  pertanyaan_pemantik?: string;
  rencana_belajar?: string[];
  createdAt?: string;
  kategoriFeedback?: 'pemula' | 'berkembang' | 'mahir';
  tindakLanjutSiswa?: string;
  perlu_perhatian_guru: boolean;
  completedSteps?: boolean[];
}

export interface Message {
  id: string;
  studentId: string;
  studentName: string;
  className: string;
  content: string;
  teacherReply?: string;
  status: 'unread' | 'replied';
  createdAt: string;
  repliedAt?: string;
}

export interface QuizQuestion {
  id: string;
  materiId: string;
  materiTitle?: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface Badge {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'streak' | 'reflection' | 'practice' | 'curiosity';
  requiredCount: number;
}

export interface TownSettings {
  townName: string;
  academicYear: string;
  teacherPin: string;
  gasWebAppUrl?: string;
  spreadsheetUrl?: string;
  bridgePassCode?: string;
}

export interface BuildingInfo {
  id: BuildingId;
  name: string;
  tagline: string;
  category?: string;
  description?: string;
  icon: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  accentColor?: string;
  color?: number;
  position?: [number, number, number];
  badge?: string;
}

export interface TeacherAccount {
  no: number;
  name: string;
  username: string;
  defaultPassword: string;
  gender: 'L' | 'P';
  subjects: string[];
}

export interface DailyJournalStickyNote {
  id: string;
  studentId: string;
  studentName: string;
  className?: string;
  content: string; // Catatan refleksi singkat harian
  mood: string;    // e.g. '😊', '💡', '🚀', '🎨', '🌿', '🎯'
  color: 'yellow' | 'pink' | 'blue' | 'green' | 'purple';
  date: string;    // format tanggal Indonesia
  timestamp: number;
  likes?: number;
  likedBy?: string[];      // daftar ID warga yang menyukai
  likedByNames?: string[]; // daftar Nama warga yang menyukai
}

export interface PodcastTranscriptMessage {
  role: 'host' | 'student';
  speakerName: string;
  text: string;
  timestamp: string;
  stage?: 'intro' | 'mastered' | 'strengthen' | 'advice_trigger' | 'action_plan' | 'closing';
}

export interface PodcastEpisodeRecord {
  id: string;
  studentId: string;
  studentName: string;
  className: string;
  materiId: string;
  materiTitle: string;
  sudahDikuasai: string;
  perluDiperkuat: string;
  saranKonkretAI: string[];
  pertanyaanPemantikAI: string;
  jawabanPemantikSiswa: string;
  rencanaBelajarSiswa: string[];
  apresiasiHost: string;
  transcriptText: string;
  messages: PodcastTranscriptMessage[];
  createdAt: string;
  timestamp: number;
}

export type WeatherType = 'cerah' | 'berawan' | 'hujan' | 'salju';

export interface WeatherConfig {
  type: WeatherType;
  label: string;
  icon: string;
  description: string;
}

export interface BankMateriBuildingDistribution {
  buildingId: BuildingId;
  buildingName: string;
  buildingIcon: string;
  activityTitle: string;
  materialSummary: string;
  challengePrompt: string;
}

export interface BankMateriEntry {
  id: string;
  materiId: string;
  objectiveId: string;
  teacherId: string;
  teacherName: string;
  mataPelajaran: string;
  kelasTarget: string;
  elemen: string;
  tujuanPembelajaran: string;
  materiEsensial: string;
  ringkasanAI: string;
  modulPerpustakaan: string;
  pertanyaanRefleksi: string[];
  topikPodcastMentor: string;
  pertanyaanPemantikPodcast: string;
  misiBalaiKota: string;
  tantanganBangunanLain: BankMateriBuildingDistribution[];
  kuisBengkel: QuizQuestion[];
  createdAt: string;
  timestamp: number;
}

export interface WismaSuggestion {
  id: string;
  wismaId: string;
  wismaName: string;
  senderId: string;
  senderName: string;
  senderRole: 'siswa' | 'guru';
  className: string;
  category: 'Pembelajaran & Materi' | 'Fasilitas Sekolah & Lab' | 'Fitur Kota Refleksia' | 'Ide & Apresiasi';
  content: string;
  createdAt: string;
  timestamp: number;
}

export interface TeacherAnnouncement {
  id: string;
  teacherId: string;
  teacherName: string;
  subject?: string;
  title: string;
  content: string;
  priority?: 'penting' | 'info' | 'misi';
  createdAt: string;
  timestamp: number;
}

export interface LabDkvTestResult {
  id: string;
  studentId: string;
  studentName: string;
  className: string;
  materiId: string;
  materiTitle: string;
  roundNumber: number;
  scoreCorrect: number;
  totalQuestions: number;
  xpEarned: number;
  tierBreakdown: string;
  answersDetail?: string;
  createdAt: string;
  timestamp: number;
}

export interface WeeklyXpLogEntry {
  id: string;
  studentId: string;
  studentName: string;
  className: string;
  xpEarned: number;
  activityType:
    | 'refleksi'
    | 'tes_lab_dkv'
    | 'podcast'
    | 'kantor_pos'
    | 'misi'
    | 'jurnal_pohon'
    | 'aktivitas_kota';
  description: string;
  createdAt: string;
  timestamp: number;
}

export interface WeeklyLeaderboardCitizen {
  rank: number;
  studentId: string;
  studentName: string;
  className: string;
  gender?: string;
  weeklyXp: number;
  totalXp: number;
  weeklyActivitiesCount: number;
  breakdown: {
    refleksi: number;
    tesLabDkv: number;
    podcast: number;
    misi: number;
    lainnya: number;
  };
  lastActivityText: string;
}

export interface CityEntryLogEntry {
  id: string;
  studentId: string;
  studentName: string;
  className: string;
  gender?: string;
  role: 'siswa' | 'guru' | 'tamu';
  enteredAtTime: string; // e.g., "08.15 WITA"
  dateKey: string;       // e.g., "2026-11-06" (WITA date)
  dateDisplay: string;   // e.g., "6 November 2026"
  timestamp: number;
}

// ============================================================================
// MASTER CREATOR STUDIO (DRAG & DROP CITY, FACILITY & NPC BUILDER)
// ============================================================================

export type CreatorModelType =
  // 1. Gedung Modern, Sekolah, Laboratorium & Kantor
  | 'modern_tower'
  | 'innovation_lab'
  | 'school_pavilion'
  | 'creative_studio'
  | 'office_hq'
  // 2. Arena Games, Taman Hiburan & Panggung Acara
  | 'arcade_arena'
  | 'concert_stage'
  | 'ferris_park'
  | 'esports_dome'
  // 3. Fasilitas Publik, Kafe, Taman & Dekorasi Kota
  | 'open_cafe'
  | 'reading_gazebo'
  | 'fountain_plaza'
  | 'info_kiosk'
  | 'sakura_park'
  // 4. Model Objek Kota Bawaan (15 Model Asli Refleksia City)
  | 'builtin_balai_kota'
  | 'builtin_studio_onair'
  | 'builtin_perpustakaan'
  | 'builtin_pasar_prestasi'
  | 'builtin_kantor_pos'
  | 'builtin_taman_refleksi'
  | 'builtin_lab_dkv'
  | 'builtin_masjid'
  | 'builtin_bank_materi'
  | 'builtin_pencakar_langit'
  | 'builtin_bandara'
  | 'builtin_lapak_cafe'
  | 'builtin_beringin_rumah_pohon'
  | 'builtin_sudut_literasi'
  | 'builtin_papan_pengumuman';

export type CreatorBuildingCategory =
  | 'gedung_kantor'
  | 'arena_hiburan'
  | 'fasilitas_taman'
  | 'objek_bawaan';

export type CreatorTemplateType =
  | 'games'
  | 'ideas'
  | 'facility_info'
  | 'community_mission';

export interface CreatorQuizItem {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
}

export interface CreatorIdeaItem {
  id: string;
  authorId: string;
  authorName: string;
  className: string;
  content: string;
  votes: number;
  votedBy: string[];
  createdAt: string;
}

export interface CreatorMissionSubmission {
  id: string;
  studentId: string;
  studentName: string;
  className: string;
  responseText: string;
  createdAt: string;
}

export interface CreatorBuildingItem {
  id: string;
  name: string;
  tagline: string;
  icon: string;
  category: CreatorBuildingCategory;
  modelType: CreatorModelType;
  wx: number;
  wy: number;
  scale: number;
  accentColor: string;
  roofColor: string;
  hasCollision: boolean;
  templateType: CreatorTemplateType;
  templateData: {
    welcomeText: string;
    xpReward: number;
    // 'games' template
    gameTitle?: string;
    quizItems?: CreatorQuizItem[];
    highScores?: Array<{ studentId: string; studentName: string; score: number; date: string }>;
    // 'ideas' template
    ideaPrompt?: string;
    ideas?: CreatorIdeaItem[];
    // 'facility_info' template
    infoContent?: string;
    externalUrl?: string;
    mediaCaption?: string;
    // 'community_mission' template
    missionChecklist?: string[];
    submissions?: CreatorMissionSubmission[];
  };
  createdBy: string;
  updatedAt: string;
}

export interface ExistingObjectOverride {
  id: string; // e.g. 'balai_kota', 'cafe', 'tree_0', 'fountain_1', 'swing_struct_1', 'campfire', etc.
  objectCategory: 'building' | 'facility' | 'tree' | 'bench' | 'swing' | 'campfire';
  wx: number;
  wy: number;
  customName?: string;
  customTagline?: string;
  customIcon?: string;
  isHidden?: boolean;
}

export type CreatorPropCategory =
  | 'tree'
  | 'bench'
  | 'swing'
  | 'campfire'
  | 'playground'
  | 'sports_court'
  | 'shrub_plant'
  | 'water_feature';

export type CreatorPropModel =
  // Pohon Bawaan Asli Kota & Hutan + Pohon Kreasi
  | 'tree_builtin_city_emerald'
  | 'tree_builtin_city_autumn'
  | 'tree_builtin_forest_pine'
  | 'tree_oak_apple'
  | 'tree_pine_spruce'
  | 'tree_sakura_pink'
  | 'tree_banyan_shady'
  | 'tree_palm_tropical'
  | 'tree_autumn_maple'
  // Tempat Duduk / Bangku Bawaan Asli Kota + Kreasi
  | 'bench_builtin_fountain'
  | 'bench_builtin_riverside'
  | 'bench_builtin_campfire'
  | 'bench_wood_classic'
  | 'bench_white_minimal'
  | 'bench_stone_marble'
  | 'bench_picnic_table'
  | 'bench_royal_gold'
  // Ayunan Bawaan Asli Kota + Kreasi
  | 'swing_builtin_city'
  | 'swing_wood_garden'
  | 'swing_cyan_modern'
  // Api Unggun Bawaan Asli Kota + Kreasi
  | 'campfire_builtin_city'
  | 'campfire_stone_ring'
  | 'campfire_royal_brazier'
  // Playground Anak (4 model)
  | 'playground_slide_colorful'
  | 'playground_seesaw_dual'
  | 'playground_spring_rider'
  | 'playground_combo_castle'
  // Lapangan Olahraga & Hamparan Terbuka (4 model)
  | 'court_basketball_full'
  | 'court_futsal_green'
  | 'court_badminton_pro'
  | 'open_green_field'
  // Semak & Tanaman Hias (5 model)
  | 'shrub_flowering_azalea'
  | 'shrub_topiary_spiral'
  | 'plant_monstera_pot'
  | 'plant_flower_bed_trio'
  | 'shrub_bamboo_zen'
  // Kolam, Air Mancur & Elemen Air (4 model)
  | 'water_fountain_tiered'
  | 'water_koi_pond_lotus'
  | 'water_mini_waterfall'
  | 'water_dancing_jets';

export interface CreatorPropItem {
  id: string;
  name: string;
  propCategory: CreatorPropCategory;
  propModel: CreatorPropModel;
  wx: number;
  wy: number;
  scale: number;
  facing: 'down-left' | 'down-right';
  accentColor?: string;
}

export type CreatorAnimalSpecies =
  | 'deer_stag'
  | 'deer_doe'
  | 'kancil'
  | 'rabbit'
  | 'squirrel'
  | 'fox'
  | 'ground_bird'
  | 'swan'
  | 'cat'
  | 'butterfly_flock';

export type AnimalTimeCycle = 'all_day' | 'diurnal' | 'nocturnal';

export type AnimalBehaviorCycle =
  | 'graze_wander'
  | 'playful_hop'
  | 'orbit_patrol'
  | 'stay_nest';

export interface CreatorAnimalItem {
  id: string;
  name: string;
  species: CreatorAnimalSpecies;
  homeWx: number;
  homeWy: number;
  wanderRadius: number;
  speed: number;
  scale: number;
  timeCycle: AnimalTimeCycle;
  behaviorCycle: AnimalBehaviorCycle;
  cycleDurationSec: number; // duration of each cycle phase (walk -> feed/graze -> rest)
}

export type CreatorTerrainType =
  // 8 Model Tanah & Jalan Bawaan Asli Kota Refleksia (100% Identik dengan Peta Bawaan)
  | 'builtin_city_grass'
  | 'builtin_forest_grass'
  | 'builtin_city_road'
  | 'builtin_fishing_trail'
  | 'builtin_east_dirt_road'
  | 'builtin_airport_tarmac'
  | 'builtin_alpine_grass'
  | 'builtin_river_water'
  // Jalan Raya Aspal & Persimpangan (X, Y, Perempatan, Pertigaan, Belokan)
  | 'road_asphalt'
  | 'road_asphalt_y'
  | 'road_asphalt_cross'
  | 'road_asphalt_t_north'
  | 'road_asphalt_t_south'
  | 'road_asphalt_t_east'
  | 'road_asphalt_t_west'
  | 'road_asphalt_turn_ne'
  | 'road_asphalt_turn_nw'
  | 'road_asphalt_turn_se'
  | 'road_asphalt_turn_sw'
  | 'road_cobble'
  | 'road_dirt'
  | 'wood_deck'
  | 'plaza_marble'
  | 'sand_golden'
  | 'flower_garden'
  | 'grass_emerald'
  | 'grass_open_meadow'
  | 'water_pond'
  // 16 Jenis Tanah & Paving dari Gambar Referensi (4x4 Grid)
  | 'img_paving_herringbone_red'
  | 'img_paving_basketweave_brown'
  | 'img_paving_herringbone_grey'
  | 'img_paving_hex_blue'
  | 'img_stone_river_grey'
  | 'img_stone_pebble_cream'
  | 'img_stone_flagstone_brown'
  | 'img_tile_dotted_grey'
  | 'img_brick_running_pastel'
  | 'img_paving_parquet_taupe'
  | 'img_wood_plank_terracotta'
  | 'img_brick_checker_red'
  | 'img_cobble_rounded_cream'
  | 'img_brick_classic_orange'
  | 'img_paving_lattice_red'
  | 'img_tile_diamond_gold';

export interface CreatorTerrainTile {
  gx: number;
  gy: number;
  terrainType: CreatorTerrainType;
}

export type CreatorFenceModel =
  | 'fence_wood_rustic'
  | 'fence_white_picket'
  | 'fence_iron_gold'
  | 'fence_hedge_bush'
  | 'fence_stone_brick';

export interface CreatorFenceItem {
  id: string;
  name: string;
  fenceModel: CreatorFenceModel;
  wx: number;
  wy: number;
  axis: 'x' | 'y';
  lengthTiles: number;
  hasCollision: boolean;
}

export type NpcMovementMode = 'static' | 'wander' | 'patrol';

export interface CreatorNpcConfig {
  id: string; // e.g. 'surya', 'malik', 'ma_uba', 'patra', 'sufri', 'sony', 'nawa', or 'npc-custom-...'
  isCustom: boolean;
  name: string;
  role: string;
  gender: 'L' | 'P';
  wx: number;
  wy: number;
  homeWx: number;
  homeWy: number;
  movementMode: NpcMovementMode;
  wanderRadius: number; // e.g. 0.8 to 4.5
  speed: number;        // e.g. 0.45 to 1.25
  patrolWaypoints?: Array<{ wx: number; wy: number }>;
  shirtColor: string;
  pantsColor: string;
  hairColor: string;
  hatColor?: string;
  speeches: string[];
  facing?: number;
  isHidden?: boolean;
}

export interface CityCreatorState {
  version: number;
  updatedAt: string;
  updatedBy: string;
  customBuildings: CreatorBuildingItem[];
  existingOverrides: Record<string, ExistingObjectOverride>;
  npcConfigs: Record<string, CreatorNpcConfig>;
  customProps?: CreatorPropItem[];
  customAnimals?: CreatorAnimalItem[];
  terrainTiles?: Record<string, CreatorTerrainTile>;
  customFences?: CreatorFenceItem[];
}

// ============================================================================
// ARENA RUMAH MISTERI (LIVE MULTIPLAYER GROUP GAME DI REFLEKSIA TIMUR DEPAN)
// Sheet Baru: Game_Ronde, Game_Pilihan, Game_Skor
// ============================================================================

export type MysteryRoundStatus = 'menunggu' | 'buka' | 'tutup' | 'meledak';
export type MysteryGroupNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
export type MysteryHouseNumber = 1 | 2 | 3 | 4 | 5;

/** Representasi baris pada Sheet "Game_Ronde" */
export interface GameRondeRow {
  id_ronde: string;
  soal: string;
  /**
   * PENTING: rumah_benar bernilai null ketika dikirim ke siswa sebelum status === 'meledak'
   * agar tidak bisa diintip lewat Inspect Browser / Network Tab.
   */
  rumah_benar: MysteryHouseNumber | null;
  status: MysteryRoundStatus;
  waktu: string;
  poin_benar: number;
  timer_detik: number;
  timer_berakhir_ms?: number | null;
  ledakan_mulai_ms?: number | null;
  guru_pembuat?: string;
}

/** Representasi baris pada Sheet "Game_Pilihan" */
export interface GamePilihanRow {
  id_ronde: string;
  kelompok: MysteryGroupNumber;
  rumah_dipilih: MysteryHouseNumber | null;
  waktu: string;
  diwakili_oleh?: string;
}

/** Representasi baris pada Sheet "Game_Skor" */
export interface GameSkorRow {
  kelompok: MysteryGroupNumber;
  total_poin: number;
  ronde_menang?: number;
  waktu_update?: string;
}

export interface MysteryArenaGroupChatMsg {
  id: string;
  kelompok: MysteryGroupNumber;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
  createdAt: number;
}

export interface MysteryArenaPlayerPresence {
  studentId: string;
  studentName: string;
  className: string;
  gender: 'L' | 'P';
  isTeacher: boolean;
  kelompok: MysteryGroupNumber | null;
  arenaWx: number;
  arenaWy: number;
  rumah_dipilih: MysteryHouseNumber | null;
  lastSeen: number;
}

export interface MysteryArenaState {
  currentRound: GameRondeRow;
  choices: Record<number, GamePilihanRow>;
  scores: GameSkorRow[];
  studentGroupMap: Record<string, MysteryGroupNumber>;
  groupMembers: Record<
    number,
    Array<{
      studentId: string;
      studentName: string;
      className: string;
      gender: 'L' | 'P';
      isOnline?: boolean;
    }>
  >;
  arenaPlayers: MysteryArenaPlayerPresence[];
  groupChats: MysteryArenaGroupChatMsg[];
  roundHistory: GameRondeRow[];
  lastAwardedRoundId?: string | null;
  winningGroups?: MysteryGroupNumber[];
  serverTime: number;
}

// ============================================================================
// ESCAPE ROOM MENARA (GEDUNG PENCAKAR LANGIT TERTINGGI • REFLEKSIA TIMUR)
// Sheet Baru: Escape_Konfigurasi, Escape_Sesi, Escape_Progres, Escape_Skor
// ============================================================================

export type EscapeSessionStatus = 'menunggu' | 'berjalan' | 'jeda' | 'selesai';
export type EscapeFloorNumber = 1 | 2 | 3 | 4 | 5;
export type EscapeQuestionType =
  | 'pilihan_ganda'
  | 'isian_singkat'
  | 'urutan_langkah'
  | 'sandi_kode';

/** Representasi baris pada Sheet "Escape_Konfigurasi" */
export interface EscapeKonfigurasiFloor {
  nomor_lantai: EscapeFloorNumber;
  judul: string;
  cerita: string;
  soal: string;
  jenis: EscapeQuestionType;
  /** Opsi untuk pilihan_ganda atau langkah acak untuk urutan_langkah */
  opsi?: string[];
  /**
   * PENTING: hint hanya dikirim ke siswa jika kelompoknya sudah menekan "Minta Petunjuk"
   * pada lantai tersebut.
   */
  hint: string | null;
  /**
   * PENTING KEAMANAN: kunci_jawaban TIDAK BOLEH dikirim ke sisi siswa!
   * Bernilai null pada payload siswa; hanya guru terverifikasi yang dapat melihat/mengedit.
   */
  kunci_jawaban: string | null;
  batas_waktu: number; // detik per lantai
}

/** Representasi baris pada Sheet "Escape_Sesi" */
export interface EscapeSesiRow {
  id_sesi: string;
  status: EscapeSessionStatus;
  waktu_mulai: string;
  waktu_mulai_ms: number | null;
  waktu_jeda_ms: number | null;
  total_durasi_jeda_ms: number;
  jumlah_kelompok: number; // 1 - 8
  poin_dasar: number;
  bonus_kecepatan: number;
  pengurang_hint: number;
  pengurang_salah: number;
  penalti_waktu_salah_detik: number;
  guru_pembuat?: string;
}

/** Representasi baris pada Sheet "Escape_Progres" */
export interface EscapeProgresRow {
  id_sesi: string;
  kelompok: MysteryGroupNumber;
  /** 1..5 = sedang di Lantai 1..5; 6 = sudah mencapai Pintu Atap (Selesai!) */
  lantai_sekarang: 1 | 2 | 3 | 4 | 5 | 6;
  jumlah_salah: number;
  hint_dipakai: number;
  /** Daftar lantai yang petunjuknya sudah dibuka oleh kelompok ini */
  hint_terbuka_lantai: EscapeFloorNumber[];
  /** Waktu selesai format teks (atau "-" jika belum sampai atap) */
  waktu_selesai: string;
  /** Durasi total detik dari mulai hingga sampai atap (null jika belum selesai) */
  durasi_detik: number | null;
  /** Urutan peringkat sampai atap (1 = tercepat pertama, dst.) */
  peringkat_atap: number | null;
  /** Penalti waktu tambah (detik) akibat jawaban salah */
  penalti_waktu_detik: number;
  /** Cooldown timestamp (ms) sampai kelompok boleh mengirim jawaban lagi setelah salah */
  cooldown_sampai_ms?: number | null;
  /** Draft jawaban bersama satu kelompok secara real-time */
  draft_jawaban?: string;
  terakhir_dijawab_oleh?: string;
  status_jawaban_terakhir?: 'benar' | 'salah' | null;
  pesan_jawaban_terakhir?: string;
}

/** Representasi baris pada Sheet "Escape_Skor" */
export interface EscapeSkorRow {
  kelompok: MysteryGroupNumber;
  total_poin: number;
  waktu_selesai?: string;
  durasi_detik?: number | null;
  hint_dipakai?: number;
  jumlah_salah?: number;
  peringkat?: number | null;
}

export interface EscapeTowerPlayerPresence {
  studentId: string;
  studentName: string;
  className: string;
  gender: 'L' | 'P';
  isTeacher: boolean;
  kelompok: MysteryGroupNumber | null;
  lantai_sekarang: 1 | 2 | 3 | 4 | 5 | 6;
  lastSeen: number;
}

export interface EscapeTowerState {
  sesi: EscapeSesiRow;
  /**
   * Untuk Guru: berisi ke-5 lantai lengkap dengan kunci_jawaban.
   * Untuk Siswa: hanya berisi lantai yang sedang dikerjakan kelompoknya (atau yang sudah dibuka),
   * TANPA kunci_jawaban, dan hint hanya tampil jika sudah dibuka kelompoknya.
   */
  konfigurasi: EscapeKonfigurasiFloor[];
  progres: Record<number, EscapeProgresRow>;
  skor: EscapeSkorRow[];
  studentGroupMap: Record<string, MysteryGroupNumber>;
  groupMembers: Record<
    number,
    Array<{
      studentId: string;
      studentName: string;
      className: string;
      gender: 'L' | 'P';
      isOnline?: boolean;
    }>
  >;
  towerPlayers: EscapeTowerPlayerPresence[];
  groupChats: MysteryArenaGroupChatMsg[];
  winningGroups: MysteryGroupNumber[];
  serverTime: number;
}

// ============================================================================
// MENARA ASESMEN INDIVIDU (TKA / CBT SUMATIF MANDIRI BERBASIS LOBI • REFLEKSIA TIMUR)
// Sheet Baru: Asesmen_Sesi, Asesmen_BankSoal, Asesmen_Stimulus, Asesmen_PaketSiswa, Asesmen_Jawaban, Asesmen_Hasil
// ============================================================================

export type AsesmenSessionStatus = 'draf' | 'lobi' | 'berjalan' | 'jeda' | 'selesai';
export type AsesmenQuestionType = 'pg_tunggal' | 'pg_mcma' | 'pg_kategori';
export type AsesmenPresentationType = 'tunggal' | 'grup';
export type AsesmenStimulusType = 'teks' | 'tabel' | 'grafik';

/** Sumber Tujuan Pembelajaran (TP) yang diambil dari Bank Materi Kota Refleksia */
export interface AsesmenTpReference {
  id_tp: string;
  mata_pelajaran: string;
  kelas: string;
  tujuan_pembelajaran: string;
  isi_materi: string;
}

/** Representasi baris pada Sheet "Asesmen_Stimulus" */
export interface AsesmenStimulusRow {
  id_stimulus: string;
  id_sesi?: string;
  jenis: AsesmenStimulusType;
  judul?: string;
  sumber?: string;
  /**
   * Untuk 'teks': teks wacana / studi kasus.
   * Untuk 'tabel': JSON string `{ headers: string[], rows: string[][] }` atau teks markdown.
   * Untuk 'grafik': JSON string `{ title: string, unit: string, bars: Array<{ label: string, value: number, color?: string }> }`.
   */
  isi: string;
}

/** Pernyataan individual pada soal Pilihan Ganda Kompleks Kategori */
export interface AsesmenKategoriStatement {
  id_pernyataan: string;
  teks: string;
  teks_pernyataan?: string;
  /** Label kolom pilihan, mis. ['Benar', 'Salah'] atau ['Sesuai', 'Tidak Sesuai'] */
  label_opsi?: [string, string];
  /** Hanya dikirim ke Guru (atau setelah selesai jika pembahasan diaktifkan) */
  kunci?: 'A' | 'B'; // 'A' = Benar/Sesuai, 'B' = Salah/Tidak Sesuai
}

/** Representasi baris pada Sheet "Asesmen_BankSoal" */
export interface AsesmenBankSoalRow {
  id_soal: string;
  id_sesi: string;
  tp: string; // ID atau teks ringkas TP
  tp_label?: string;
  id_tp?: string;
  label_tp?: string;
  nomor_urut?: number;
  jenis: AsesmenQuestionType;
  tipe_penyajian: AsesmenPresentationType;
  id_stimulus: string | null; // "" atau null jika tunggal
  teks_soal: string;
  /**
   * Untuk pg_tunggal & pg_mcma: daftar string opsi (mis. 4-5 opsi).
   * Untuk pg_kategori: daftar pernyataan AsesmenKategoriStatement (disimpan sebagai JSON di sheet).
   */
  opsi: string[];
  pernyataan_kategori?: AsesmenKategoriStatement[];
  label_kategori?: [string, string]; // default ['Benar', 'Salah'] atau ['Sesuai', 'Tidak Sesuai']
  poin_soal?: number;
  /**
   * PENTING KEAMANAN:
   * kunci_jawaban dan pembahasan TIDAK PERNAH dikirim ke sisi siswa selama ujian berlangsung!
   * - Untuk pg_tunggal: string indeks/teks opsi benar (mis. "0" / "A")
   * - Untuk pg_mcma: JSON array indeks benar (mis. "[0,2]")
   * - Untuk pg_kategori: JSON object map `{ "p1": "A", "p2": "B", "p3": "A" }`
   */
  kunci_jawaban: string | null;
  pembahasan: string | null;
}

/** Representasi baris pada Sheet "Asesmen_Sesi" */
export interface AsesmenSesiRow {
  id_sesi: string;
  judul_asesmen: string;
  tp_terpilih: string[]; // 1 sampai 5 TP ID
  tp_detail?: AsesmenTpReference[];
  durasi: number; // menit
  status: AsesmenSessionStatus;
  waktu_buka_lobi?: string | null;
  waktu_mulai: string | null;
  waktu_mulai_ms: number | null;
  waktu_jeda_ms: number | null;
  total_durasi_jeda_ms: number;
  tambahan_waktu_menit: number;
  waktu_selesai?: string | null;
  updated_at?: string;
  // Pengaturan Komposisi & Poin
  jumlah_soal: number;
  komposisi_jenis: {
    pg_tunggal: number;
    pg_mcma: number;
    pg_kategori: number;
  };
  komposisi_penyajian: {
    tunggal: number;
    grup: number;
  };
  poin_per_jenis: {
    pg_tunggal: number;
    pg_mcma: number;
    pg_kategori_per_pernyataan: number;
  };
  mcma_kredit_parsial: boolean;
  acak_soal: boolean;
  acak_opsi: boolean;
  izinkan_menyusul: boolean;
  tampilkan_pembahasan: boolean;
  xp_bonus_selesai: number;
  guru_pembuat?: string;
}

/** Representasi baris pada Sheet "Asesmen_PaketSiswa" */
export interface AsesmenPaketSiswaRow {
  id_sesi: string;
  siswa: string; // studentId
  nama_siswa: string;
  kelas: string;
  /** Urutan ID soal yang sudah diacak khusus siswa ini (soal grup tetap berdampingan) */
  urutan_soal: string[];
  /** Pemetaan urutan indeks opsi per soal jika acak_opsi aktif: `{ [id_soal]: number[] }` */
  urutan_opsi_map?: Record<string, number[]>;
  waktu_paket_dibuat: string;
  session_token?: string;
}

/** Representasi baris pada Sheet "Asesmen_Jawaban" */
export interface AsesmenJawabanRow {
  id_sesi: string;
  siswa: string; // studentId
  nama_siswa?: string;
  id_soal: string;
  /**
   * Jawaban siswa:
   * - pg_tunggal: string indeks asli opsi yang dipilih (mis. "1")
   * - pg_mcma: JSON string array indeks asli opsi (mis. "[0,2]")
   * - pg_kategori: JSON string map `{ "p1": "A", "p2": "B" }`
   */
  jawaban: string;
  ragu: boolean;
  waktu: string;
  skor_butir?: number;
  benar?: boolean;
}

/** Representasi baris pada Sheet "Asesmen_Hasil" */
export interface AsesmenHasilRow {
  id_sesi: string;
  siswa: string; // studentId
  nama_siswa: string;
  kelas: string;
  nilai: number; // Skala 0 - 100
  poin_diperoleh: number;
  poin_maksimal: number;
  jumlah_benar: number;
  jumlah_soal: number;
  durasi: number; // detik pengerjaan
  keluar_tab: number;
  waktu_selesai: string;
  rincian_per_tp?: Record<string, { benar: number; total: number; persentase: number }>;
  detail_per_tp?: Record<string, { benar: number; total: number; persentase: number }>;
}

/** Status kehadiran & pantauan langsung siswa di Lobi / Ujian Menara Asesmen */
export interface AsesmenStudentLiveStatus {
  studentId: string;
  studentName: string;
  className: string;
  gender: 'L' | 'P';
  status_peserta: 'di_lobi' | 'mengerjakan' | 'selesai';
  soal_terjawab: number;
  soal_ragu: number;
  total_soal: number;
  nomor_soal_aktif: number;
  soal_aktif?: number;
  keluar_tab: number;
  log_keluar_tab: string[];
  waktu_gabung: string;
  waktu_gabung_lobi?: string;
  waktu_mulai?: string | null;
  waktu_mulai_kerja_ms?: number | null;
  waktu_selesai?: string | null;
  nilai_akhir?: number | null;
  lastSeen: number;
  activeSessionToken?: string;
  session_token?: string;
}

export type AsesmenLiveStudentStatus = AsesmenStudentLiveStatus;

/** Analisis Butir Soal & Tujuan Pembelajaran (TP) untuk Guru */
export interface AsesmenButirAnalysis {
  id_soal: string;
  nomor_urut: number;
  tp: string;
  id_tp?: string;
  jenis: AsesmenQuestionType;
  teks_soal: string;
  jumlah_menjawab: number;
  jumlah_benar: number;
  persentase_benar: number;
  total_menjawab?: number;
  jumlah_benar_penuh?: number;
  jumlah_salah_atau_parsial?: number;
  persentase_ketercapaian?: number;
}

export interface AsesmenTpAnalysis {
  tp: string;
  tp_label: string;
  id_tp?: string;
  tujuan_pembelajaran?: string;
  jumlah_soal: number;
  rata_rata_penguasaan: number; // 0 - 100%
  rata_rata_ketercapaian?: number;
}

export interface MenaraAsesmenState {
  sesi: AsesmenSesiRow;
  stimulusList: AsesmenStimulusRow[];
  /**
   * Untuk Guru: seluruh bankSoal lengkap dengan kunci_jawaban & pembahasan.
   * Untuk Siswa: hanya soal dalam paketnya, TANPA kunci_jawaban & pembahasan (kecuali sudah selesai & diizinkan guru).
   */
  bankSoal: AsesmenBankSoalRow[];
  /** Paket soal milik siswa yang sedang login (atau semua paket jika guru) */
  paketSaya: AsesmenPaketSiswaRow | null;
  /** Jawaban milik siswa yang sedang login: `{ [id_soal]: AsesmenJawabanRow }` */
  jawabanSaya: Record<string, AsesmenJawabanRow>;
  /** Hasil milik siswa yang sedang login (jika sudah selesai) */
  hasilSaya: AsesmenHasilRow | null;
  /** Daftar seluruh peserta di lobi/ujian (Guru melihat detail penuh, Siswa melihat daftar lobi) */
  pesertaLive: AsesmenStudentLiveStatus[];
  /** Rekap hasil seluruh siswa (khusus Guru atau jika dipublikasikan) */
  semuaHasil: AsesmenHasilRow[];
  analisisButir?: AsesmenButirAnalysis[];
  analisisTp?: AsesmenTpAnalysis[];
  rataRataKelas?: number;
  serverTime: number;
}




