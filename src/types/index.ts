export type BuildingId =
  | 'balai_kota'
  | 'perpustakaan'
  | 'taman_refleksi'
  | 'menara_mentor'
  | 'bengkel_latihan'
  | 'kantor_pos'
  | 'pasar_prestasi'
  | 'monumen_warga';

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
  customQuestions?: string[];
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
