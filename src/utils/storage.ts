import {
  Materi,
  LearningObjective,
  QuizQuestion,
  Student,
  StudentActivityBreakdown,
  Reflection,
  MentorFeedback,
  Message,
  TownSettings,
  PublicChatMessage,
} from '../types/index.ts';
import {
  INITIAL_MATERI,
  INITIAL_OBJECTIVES,
  INITIAL_QUIZ,
  INITIAL_STUDENTS,
  INITIAL_REFLECTIONS,
  INITIAL_FEEDBACKS,
  INITIAL_MESSAGES,
  INITIAL_SETTINGS,
  INITIAL_PUBLIC_CHAT,
} from '../data/initialData.ts';

const STORAGE_KEYS = {
  CURRENT_USER: 'kota_refleksi_current_user',
  MATERI: 'kota_refleksi_materi',
  OBJECTIVES: 'kota_refleksi_objectives',
  QUIZ: 'kota_refleksi_quiz',
  STUDENTS: 'kota_refleksi_students',
  REFLECTIONS: 'kota_refleksi_reflections',
  FEEDBACKS: 'kota_refleksi_feedbacks',
  MESSAGES: 'kota_refleksi_messages',
  SETTINGS: 'kota_refleksi_settings',
  PUBLIC_CHAT: 'kota_refleksi_public_chat',
  DELETED_REFLECTIONS: 'kota_refleksi_deleted_reflections',
};

function safeGet<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (e) {
    console.warn(`Failed reading storage key: ${key}`, e);
    return fallback;
  }
}

function safeSet<T>(key: string, val: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (e) {
    console.error(`Failed writing storage key: ${key}`, e);
  }
}

export function parseChatTimestamp(val: any): number {
  if (!val) return Date.now();
  if (typeof val === 'number') return val;
  const str = String(val).trim();

  // 1. Direct standard parse
  let parsed = new Date(str).getTime();
  if (!isNaN(parsed) && parsed > 0) return parsed;

  // 2. Replace dots in time (e.g. "08.34" -> "08:34")
  const withColons = str.replace(/(\d{1,2})\.(\d{2})(?:\.(\d{2}))?/, '$1:$2:$3');
  parsed = new Date(withColons).getTime();
  if (!isNaN(parsed) && parsed > 0) return parsed;

  // 3. Indonesian month names conversion
  const idMonths: Record<string, string> = {
    jan: 'Jan', feb: 'Feb', mar: 'Mar', apr: 'Apr', mei: 'May', jun: 'Jun',
    jul: 'Jul', agu: 'Aug', agt: 'Aug', sep: 'Sep', okt: 'Oct', nov: 'Nov', des: 'Dec'
  };
  let converted = withColons.toLowerCase();
  for (const [idm, enm] of Object.entries(idMonths)) {
    if (converted.includes(idm)) {
      converted = converted.replace(idm, enm);
      break;
    }
  }
  parsed = new Date(converted).getTime();
  if (!isNaN(parsed) && parsed > 0) return parsed;

  // 4. Timestamp number match
  const numMatch = str.match(/\d{10,13}/);
  if (numMatch) {
    const n = Number(numMatch[0]);
    if (n > 1000000000) return n > 100000000000 ? n : n * 1000;
  }

  return Date.now();
}

export type ActivityType = 'login' | 'mission' | 'reflection' | 'chat' | 'quiz' | 'message';

export function getBaselineActivity(
  _studentId: string,
  className: string,
  studentNumber?: string
): {
  logins: number;
  missions: number;
  reflections: number;
  chats: number;
  quizzes: number;
  messages: number;
  points: number;
} {
  const num = parseInt(studentNumber || '0', 10);
  const isDkv2 = (className || '').includes('2');

  if (isDkv2) {
    if (num === 1) return { logins: 7, missions: 8, reflections: 5, chats: 4, quizzes: 3, messages: 0, points: 86 };
    if (num === 2) return { logins: 6, missions: 7, reflections: 4, chats: 4, quizzes: 3, messages: 0, points: 75 };
    if (num === 3) return { logins: 5, missions: 6, reflections: 4, chats: 3, quizzes: 3, messages: 0, points: 66 };
    if (num === 4) return { logins: 5, missions: 5, reflections: 3, chats: 4, quizzes: 2, messages: 0, points: 58 };
    if (num === 5) return { logins: 4, missions: 5, reflections: 3, chats: 3, quizzes: 2, messages: 0, points: 52 };
    if (num === 6) return { logins: 4, missions: 4, reflections: 3, chats: 2, quizzes: 2, messages: 0, points: 46 };
    if (num === 7) return { logins: 4, missions: 4, reflections: 2, chats: 2, quizzes: 2, messages: 0, points: 42 };
    if (num === 8) return { logins: 3, missions: 4, reflections: 2, chats: 2, quizzes: 2, messages: 0, points: 39 };
    if (num === 9) return { logins: 3, missions: 3, reflections: 2, chats: 2, quizzes: 2, messages: 0, points: 36 };
    if (num === 10) return { logins: 3, missions: 3, reflections: 2, chats: 2, quizzes: 1, messages: 0, points: 33 };
    const variedMissions = (num % 3) + 2;
    const variedReflections = (num % 2) + 1;
    return { logins: 2, missions: variedMissions, reflections: variedReflections, chats: 1, quizzes: 1, messages: 0, points: 20 + (num % 10) };
  } else {
    // X DKV 3
    if (num === 1) return { logins: 7, missions: 7, reflections: 5, chats: 4, quizzes: 3, messages: 0, points: 82 };
    if (num === 2) return { logins: 6, missions: 6, reflections: 4, chats: 4, quizzes: 3, messages: 0, points: 72 };
    if (num === 3) return { logins: 5, missions: 6, reflections: 4, chats: 3, quizzes: 2, messages: 0, points: 63 };
    if (num === 4) return { logins: 5, missions: 5, reflections: 3, chats: 3, quizzes: 2, messages: 0, points: 56 };
    if (num === 5) return { logins: 4, missions: 5, reflections: 3, chats: 2, quizzes: 2, messages: 0, points: 50 };
    if (num === 6) return { logins: 4, missions: 4, reflections: 3, chats: 2, quizzes: 2, messages: 0, points: 45 };
    if (num === 7) return { logins: 3, missions: 4, reflections: 2, chats: 2, quizzes: 2, messages: 0, points: 40 };
    if (num === 8) return { logins: 3, missions: 3, reflections: 2, chats: 2, quizzes: 2, messages: 0, points: 37 };
    if (num === 9) return { logins: 3, missions: 3, reflections: 2, chats: 2, quizzes: 1, messages: 0, points: 34 };
    if (num === 10) return { logins: 3, missions: 3, reflections: 2, chats: 1, quizzes: 1, messages: 0, points: 31 };
    const variedMissions = (num % 3) + 2;
    const variedReflections = (num % 2) + 1;
    return { logins: 2, missions: variedMissions, reflections: variedReflections, chats: 1, quizzes: 1, messages: 0, points: 20 + (num % 9) };
  }
}

export const StorageService = {
  getCurrentStudent(): Student | null {
    const student = safeGet<Student | null>(STORAGE_KEYS.CURRENT_USER, null);
    if (student && student.className.includes('DKV 1')) {
      try {
        localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      } catch (e) {
        // safe
      }
      return null;
    }
    if (student) {
      const migratedKey = `kota_xp_v2_${student.id}`;
      if (!localStorage.getItem(migratedKey)) {
        const initialPoints = student.isTeacher ? 10 : 5;
        const updated = { ...student, points: initialPoints };
        try {
          localStorage.setItem(migratedKey, '1');
        } catch (e) {}
        safeSet(STORAGE_KEYS.CURRENT_USER, updated);
        return updated;
      }
    }
    return student;
  },

  setCurrentStudent(student: Student | null): void {
    safeSet(STORAGE_KEYS.CURRENT_USER, student);
    if (student) {
      try {
        localStorage.setItem(`kota_xp_v2_${student.id}`, '1');
      } catch (e) {}
    }
  },

  getMateri(): Materi[] {
    const items = safeGet<Materi[]>(STORAGE_KEYS.MATERI, INITIAL_MATERI);
    if (
      !items ||
      items.length < 5 ||
      !items.some((m) => m.id === 'materi-bk-01' && m.content.includes('BAB 1 —'))
    ) {
      safeSet(STORAGE_KEYS.MATERI, INITIAL_MATERI);
      return INITIAL_MATERI;
    }
    return items;
  },

  setMateri(items: Materi[]): void {
    safeSet(STORAGE_KEYS.MATERI, items);
  },

  addMateri(item: Materi): void {
    const items = this.getMateri();
    this.setMateri([item, ...items]);
  },

  updateMateri(updated: Materi): void {
    const items = this.getMateri().map((m) => (m.id === updated.id ? updated : m));
    this.setMateri(items);
  },

  deleteMateri(id: string): void {
    const items = this.getMateri().filter((m) => m.id !== id);
    this.setMateri(items);
  },

  getObjectives(): LearningObjective[] {
    const items = safeGet<LearningObjective[]>(STORAGE_KEYS.OBJECTIVES, INITIAL_OBJECTIVES);
    if (!items || items.length === 0 || !items.some((tp) => tp.id.startsWith('tp-bk-'))) {
      safeSet(STORAGE_KEYS.OBJECTIVES, INITIAL_OBJECTIVES);
      return INITIAL_OBJECTIVES;
    }
    return items;
  },

  setObjectives(items: LearningObjective[]): void {
    safeSet(STORAGE_KEYS.OBJECTIVES, items);
  },

  addObjective(item: LearningObjective): void {
    const items = this.getObjectives();
    this.setObjectives([...items, item]);
  },

  getQuizQuestions(): QuizQuestion[] {
    const items = safeGet<QuizQuestion[]>(STORAGE_KEYS.QUIZ, INITIAL_QUIZ);
    if (
      !items ||
      items.length < 25 ||
      !items.some((q) => q.id === 'q-bk-1a')
    ) {
      safeSet(STORAGE_KEYS.QUIZ, INITIAL_QUIZ);
      return INITIAL_QUIZ;
    }
    return items;
  },

  setQuizQuestions(items: QuizQuestion[]): void {
    safeSet(STORAGE_KEYS.QUIZ, items);
  },

  addQuizQuestion(item: QuizQuestion): void {
    const items = this.getQuizQuestions();
    this.setQuizQuestions([...items, item]);
  },

  getStudents(): Student[] {
    const rawItems = safeGet<Student[]>(STORAGE_KEYS.STUDENTS, INITIAL_STUDENTS);
    const listMigrated = localStorage.getItem('kota_students_act_v3');
    let items = rawItems;
    if (
      !items ||
      items.length < 50 ||
      items.some((s) => s.className.includes('DKV 1')) ||
      !listMigrated
    ) {
      items = INITIAL_STUDENTS;
      safeSet(STORAGE_KEYS.STUDENTS, INITIAL_STUDENTS);
      try {
        localStorage.setItem('kota_students_act_v3', '1');
      } catch (e) {}
    }

    // Enrich each student with computed activity stats & accurate points
    return items.map((s) => {
      const stats = this.getStudentActivityStats(s);
      const base = getBaselineActivity(s.id, s.className, s.studentNumber);
      const currentPts = s.points !== undefined && s.points > 5 ? s.points : base.points;
      return {
        ...s,
        points: currentPts,
        activityStats: stats,
        totalActivities: stats.total,
      };
    });
  },

  recordStudentActivity(
    studentId: string,
    type: ActivityType,
    count = 1
  ): void {
    try {
      const key = `kota_act_${studentId}`;
      const cur = safeGet<Record<string, number>>(key, {});
      cur[type] = (cur[type] || 0) + count;
      safeSet(key, cur);

      // If user is current user, update current user too
      const current = this.getCurrentStudent();
      if (current && current.id === studentId) {
        const stats = this.getStudentActivityStats(current);
        const updated = {
          ...current,
          activityStats: stats,
          totalActivities: stats.total,
        };
        safeSet(STORAGE_KEYS.CURRENT_USER, updated);
        this.syncPasarPrestasiToSpreadsheet(updated);
      } else {
        const matched = this.getStudents().find((s) => s.id === studentId);
        if (matched) {
          this.syncPasarPrestasiToSpreadsheet(matched);
        }
      }
    } catch (e) {}
  },

  getStudentActivityStats(
    student: Student,
    reflections?: Reflection[],
    chats?: PublicChatMessage[],
    messages?: Message[]
  ): StudentActivityBreakdown {
    try {
      const base = getBaselineActivity(student.id, student.className, student.studentNumber);
      const actKey = `kota_act_${student.id}`;
      const recorded = safeGet<Record<string, number>>(actKey, {});

      // Live counts
      const realReflections = reflections ? reflections.filter((r) => r.studentId === student.id).length : 0;
      const realChats = chats ? chats.filter((c) => c.senderId === student.id).length : 0;
      const realMessages = messages ? messages.filter((m) => m.studentId === student.id).length : 0;

      // Completed missions
      let liveMissions = 0;
      try {
        const raw = localStorage.getItem(`kota_completed_missions_v2_${student.id}`);
        if (raw) {
          const arr = JSON.parse(raw);
          if (Array.isArray(arr)) liveMissions = arr.length;
        }
      } catch (e) {}

      const logins = Math.max(
        (base.logins || 1) + (recorded.login || 0) + (student.loginCount || 0),
        recorded.sheet_logins || 0
      );
      const missions = Math.max(
        Math.max(base.missions, liveMissions) + (recorded.mission || 0) + (student.completedMissionsCount || 0),
        recorded.sheet_missions || 0
      );
      const refls = Math.max(
        Math.max(base.reflections, realReflections) + (recorded.reflection || 0),
        recorded.sheet_reflections || 0
      );
      const chs = Math.max(
        Math.max(base.chats, realChats) + (recorded.chat || 0),
        recorded.sheet_chats || 0
      );
      const qzs = Math.max(
        (base.quizzes || 0) + (recorded.quiz || 0) + (student.quizCount || 0),
        recorded.sheet_quizzes || 0
      );
      const msgs = Math.max(
        Math.max(base.messages, realMessages) + (recorded.message || 0),
        recorded.sheet_messages || 0
      );

      const total = logins + missions + refls + chs + qzs + msgs;

      return {
        logins,
        missions,
        reflections: refls,
        chats: chs,
        quizzes: qzs,
        messages: msgs,
        total,
      };
    } catch (e) {
      return {
        logins: 1,
        missions: 0,
        reflections: 0,
        chats: 0,
        quizzes: 0,
        messages: 0,
        total: 1,
      };
    }
  },

  setStudents(items: Student[]): void {
    safeSet(STORAGE_KEYS.STUDENTS, items);
  },

  saveOrUpdateStudent(student: Student): void {
    const items = safeGet<Student[]>(STORAGE_KEYS.STUDENTS, INITIAL_STUDENTS);
    const idx = items.findIndex((s) => s.id === student.id);
    if (idx >= 0) {
      items[idx] = student;
    } else {
      items.push(student);
    }
    this.setStudents(items);
    // If it's the current user, update current user too
    const current = this.getCurrentStudent();
    if (current && current.id === student.id) {
      this.setCurrentStudent(student);
    }
    if (!student.isTeacher) {
      this.syncPasarPrestasiToSpreadsheet(student);
    }
  },

  /**
   * Menyimpan & menyinkronkan data Pasar Prestasi (Aktivitas Kota, Saldo XP & Top 5 Siswa) ke Google Spreadsheet v2.6
   */
  async syncPasarPrestasiToSpreadsheet(student?: Student | null): Promise<void> {
    try {
      const allStudents = this.getStudents().filter((s) => !s.isTeacher);
      const reflections = this.getReflections();
      const chats = this.getPublicChatMessages();
      const messages = this.getMessages();

      const enrichedList = allStudents.map((s) => {
        const stats = this.getStudentActivityStats(s, reflections, chats, messages);
        return {
          ...s,
          activityStats: stats,
          totalActivities: stats.total,
        };
      });

      enrichedList.sort((a, b) => {
        const actDiff = (b.totalActivities || 0) - (a.totalActivities || 0);
        if (actDiff !== 0) return actDiff;
        return (b.points || 0) - (a.points || 0);
      });

      const top5 = enrichedList.slice(0, 5);
      const targetStudent = student
        ? enrichedList.find((s) => s.id === student.id) || {
            ...student,
            activityStats: this.getStudentActivityStats(student, reflections, chats, messages),
            totalActivities: this.getStudentActivityStats(student, reflections, chats, messages).total,
          }
        : null;

      // 1. Kirim ke Sheet khusus 'Pasar_Prestasi_Siswa' pada Google Apps Script v2.6
      await this.syncWithGAS('save_pasar_prestasi', {
        student: targetStudent,
        top5,
      });

      // 2. Kirim juga ringkasan ke submit_reflection bertanda [PASAR_PRESTASI] agar kompatibel dengan semua versi Spreadsheet
      if (targetStudent && !targetStudent.isTeacher) {
        const stStats = targetStudent.activityStats || this.getStudentActivityStats(targetStudent);
        const rankIdx = enrichedList.findIndex((s) => s.id === targetStudent.id);
        const rankText = rankIdx >= 0 ? `Peringkat #${rankIdx + 1}` : 'Warga Aktif';

        const reflectionPayload: Reflection = {
          id: `prestasi-${targetStudent.id}`,
          studentId: targetStudent.id,
          studentName: targetStudent.name,
          studentNumber: 'PASAR_PRESTASI',
          className: targetStudent.className || 'X DKV 2',
          materiId: 'pasar_prestasi',
          materiTitle: `[PASAR_PRESTASI] ${rankText} • ${stStats.total} Aktivitas • ${targetStudent.points || 0} XP`,
          scale: 5,
          moodEmoji: '🏆',
          answers: {
            understood: `Total Aktivitas: ${stStats.total} (Login: ${stStats.logins}, Misi: ${stStats.missions}, Refleksi: ${stStats.reflections}, Obrolan: ${stStats.chats}, Kuis: ${stStats.quizzes}, Pesan: ${stStats.messages})`,
            difficult: `Saldo XP: ${targetStudent.points || 0} XP | ${rankText}`,
            findings: JSON.stringify(stStats),
            actionPlan: JSON.stringify(
              top5.map((t, i) => `#${i + 1} ${t.name} (${t.className}) - ${t.totalActivities} Aktivitas / ${t.points} XP`)
            ),
            customAnswers: {
              totalActivities: String(stStats.total),
              points: String(targetStudent.points || 0),
              rank: rankText,
              statsJson: JSON.stringify(stStats),
            },
          },
          createdAt: new Date().toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          }),
        };

        await this.syncWithGAS('submit_reflection', {
          reflection: reflectionPayload,
        });
      }
    } catch (e) {
      // silent fallback
    }
  },

  /**
   * Menarik data Pasar Prestasi dari Google Spreadsheet v2.6 dan memperbarui statistik aktivitas siswa lokal
   */
  async fetchPasarPrestasiFromGAS(): Promise<{
    success: boolean;
    spreadsheetName?: string;
    version?: string;
    updatedCount: number;
  }> {
    const settings = this.getSettings();
    if (!settings.gasWebAppUrl || !settings.gasWebAppUrl.startsWith('http')) {
      return { success: false, updatedCount: 0 };
    }

    try {
      const url = new URL(settings.gasWebAppUrl);
      url.searchParams.set('action', 'get_data');
      url.searchParams.set('_t', String(Date.now()));

      const res = await fetch(url.toString(), {
        method: 'GET',
        redirect: 'follow',
        cache: 'no-store',
      });
      if (!res.ok) return { success: false, updatedCount: 0 };

      const resData = await res.json();
      let updatedCount = 0;
      const students = safeGet<Student[]>(STORAGE_KEYS.STUDENTS, INITIAL_STUDENTS);

      const applyRemoteStats = (
        studentId: string,
        studentName: string,
        stats: Partial<StudentActivityBreakdown>,
        points?: number
      ) => {
        const target = students.find(
          (s) =>
            s.id === studentId ||
            (studentName && s.name.toLowerCase() === studentName.toLowerCase())
        );
        if (!target) return;

        const actKey = `kota_act_${target.id}`;
        const cur = safeGet<Record<string, number>>(actKey, {});
        if (stats.logins) cur.sheet_logins = Math.max(cur.sheet_logins || 0, Number(stats.logins));
        if (stats.missions) cur.sheet_missions = Math.max(cur.sheet_missions || 0, Number(stats.missions));
        if (stats.reflections) cur.sheet_reflections = Math.max(cur.sheet_reflections || 0, Number(stats.reflections));
        if (stats.chats) cur.sheet_chats = Math.max(cur.sheet_chats || 0, Number(stats.chats));
        if (stats.quizzes) cur.sheet_quizzes = Math.max(cur.sheet_quizzes || 0, Number(stats.quizzes));
        if (stats.messages) cur.sheet_messages = Math.max(cur.sheet_messages || 0, Number(stats.messages));
        safeSet(actKey, cur);

        if (typeof points === 'number' && points > (target.points || 0)) {
          target.points = points;
        }
        updatedCount++;
      };

      // A. Dari array pasarPrestasi (Skrip GAS v2.6 Sheet 'Pasar_Prestasi_Siswa')
      if (Array.isArray(resData.pasarPrestasi)) {
        resData.pasarPrestasi.forEach((row: any) => {
          if (row && (row.id || row.name)) {
            applyRemoteStats(
              String(row.id || ''),
              String(row.name || ''),
              row.activityStats || {},
              Number(row.points) || undefined
            );
          }
        });
      }

      // B. Dari refleksi bertanda [PASAR_PRESTASI]
      if (Array.isArray(resData.reflections)) {
        resData.reflections.forEach((r: Reflection) => {
          const isPrestasi =
            (r.id && String(r.id).startsWith('prestasi-')) ||
            (r.materiTitle && String(r.materiTitle).includes('[PASAR_PRESTASI]')) ||
            r.studentNumber === 'PASAR_PRESTASI';
          if (isPrestasi && r.answers?.findings) {
            try {
              const parsedStats = JSON.parse(r.answers.findings);
              const pts = Number(r.answers?.customAnswers?.['points']) || undefined;
              applyRemoteStats(r.studentId, r.studentName, parsedStats, pts);
            } catch {}
          }
        });
      }

      if (updatedCount > 0) {
        safeSet(STORAGE_KEYS.STUDENTS, students);
      }

      return {
        success: true,
        spreadsheetName: resData.spreadsheet || 'Google Spreadsheet',
        version: resData.version || '2.6',
        updatedCount,
      };
    } catch {
      return { success: false, updatedCount: 0 };
    }
  },

  getReflections(): Reflection[] {
    const items = safeGet<Reflection[]>(STORAGE_KEYS.REFLECTIONS, INITIAL_REFLECTIONS);
    const deletedIds = new Set(this.getDeletedReflectionIds());
    // Automatically purge old dummy reflections and deleted ones
    const cleaned = (items || []).filter(
      (r) =>
        r.id !== 'ref-bk-001' &&
        r.id !== 'ref-bk-002' &&
        !r.id.startsWith('dummy-') &&
        !deletedIds.has(r.id)
    );
    if (cleaned.length !== (items || []).length) {
      safeSet(STORAGE_KEYS.REFLECTIONS, cleaned);
    }
    return cleaned;
  },

  getDeletedReflectionIds(): string[] {
    return safeGet<string[]>(STORAGE_KEYS.DELETED_REFLECTIONS, []);
  },

  setReflections(items: Reflection[]): void {
    safeSet(STORAGE_KEYS.REFLECTIONS, items);
  },

  addReflection(reflection: Reflection): void {
    const items = this.getReflections();
    this.setReflections([reflection, ...items]);
  },

  deleteReflection(id: string): void {
    const items = this.getReflections().filter((r) => r.id !== id);
    this.setReflections(items);
    // Also remove any corresponding feedback
    const feedbacks = this.getFeedbacks().filter((f) => f.reflectionId !== id);
    this.setFeedbacks(feedbacks);

    // Save to deleted list so spreadsheet sync won't re-add it
    const deleted = this.getDeletedReflectionIds();
    if (!deleted.includes(id)) {
      safeSet(STORAGE_KEYS.DELETED_REFLECTIONS, [...deleted, id]);
    }

    // Sync delete action to Google Apps Script
    this.syncWithGAS('delete_reflection', { reflectionId: id });
  },

  deleteMultipleReflections(ids: string[]): void {
    const idSet = new Set(ids);
    const items = this.getReflections().filter((r) => !idSet.has(r.id));
    this.setReflections(items);
    const feedbacks = this.getFeedbacks().filter((f) => !idSet.has(f.reflectionId));
    this.setFeedbacks(feedbacks);

    const deleted = this.getDeletedReflectionIds();
    const updatedDeleted = Array.from(new Set([...deleted, ...ids]));
    safeSet(STORAGE_KEYS.DELETED_REFLECTIONS, updatedDeleted);

    ids.forEach((id) => {
      this.syncWithGAS('delete_reflection', { reflectionId: id });
    });
  },

  clearReflections(): void {
    const current = this.getReflections();
    const currentIds = current.map((r) => r.id);
    this.setReflections([]);
    this.setFeedbacks([]);
    const deleted = this.getDeletedReflectionIds();
    safeSet(STORAGE_KEYS.DELETED_REFLECTIONS, Array.from(new Set([...deleted, ...currentIds])));

    // Sync clear action to Google Apps Script
    this.syncWithGAS('clear_all_reflections', {});
  },

  getFeedbacks(): MentorFeedback[] {
    const items = safeGet<MentorFeedback[]>(STORAGE_KEYS.FEEDBACKS, INITIAL_FEEDBACKS);
    const cleaned = (items || []).filter(
      (f) =>
        f.id !== 'fb-bk-001' &&
        f.id !== 'fb-bk-002' &&
        f.reflectionId !== 'ref-bk-001' &&
        f.reflectionId !== 'ref-bk-002' &&
        !f.id.startsWith('dummy-')
    );
    if (cleaned.length !== (items || []).length) {
      safeSet(STORAGE_KEYS.FEEDBACKS, cleaned);
    }
    return cleaned;
  },

  setFeedbacks(items: MentorFeedback[]): void {
    safeSet(STORAGE_KEYS.FEEDBACKS, items);
  },

  addFeedback(feedback: MentorFeedback): void {
    const items = this.getFeedbacks();
    this.setFeedbacks([feedback, ...items]);
  },

  updateFeedback(feedback: MentorFeedback): void {
    const items = this.getFeedbacks().map((f) => (f.id === feedback.id ? feedback : f));
    this.setFeedbacks(items);
  },

  getMessages(): Message[] {
    return safeGet<Message[]>(STORAGE_KEYS.MESSAGES, INITIAL_MESSAGES);
  },

  setMessages(items: Message[]): void {
    safeSet(STORAGE_KEYS.MESSAGES, items);
  },

  addMessage(msg: Message): void {
    const items = this.getMessages();
    this.setMessages([msg, ...items]);
  },

  updateMessage(msg: Message): void {
    const items = this.getMessages().map((m) => (m.id === msg.id ? msg : m));
    this.setMessages(items);
  },

  // Monumen Warga 24-Hour Purge & Max 25 Messages Helper:
  // Removes messages older than 24 hours and strictly returns the latest 25 messages in chronological order (newest at bottom)
  purgeExpiredPublicChats(items: PublicChatMessage[]): PublicChatMessage[] {
    const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
    const MAX_CHATS = 25;
    const cutoff = Date.now() - TWENTY_FOUR_HOURS;
    const valid = (items || []).filter((m) => {
      if (!m || !m.id || !m.content) return false;
      const time = parseChatTimestamp(m.createdAt || m.timestamp);
      return time >= cutoff && !m.isReported;
    });

    // 1. Sort newest first to pick the latest 25
    valid.sort((a, b) => {
      const timeA = parseChatTimestamp(a.createdAt || a.timestamp);
      const timeB = parseChatTimestamp(b.createdAt || b.timestamp);
      return timeB - timeA;
    });

    const latest = valid.slice(0, MAX_CHATS);

    // 2. Sort chronologically ascending so newest message is at the very bottom
    return latest.sort((a, b) => {
      const timeA = parseChatTimestamp(a.createdAt || a.timestamp);
      const timeB = parseChatTimestamp(b.createdAt || b.timestamp);
      return timeA - timeB;
    });
  },

  getPublicChatMessages(): PublicChatMessage[] {
    const raw = safeGet<PublicChatMessage[]>(STORAGE_KEYS.PUBLIC_CHAT, INITIAL_PUBLIC_CHAT);
    const map = new Map<string, PublicChatMessage>();
    (raw || []).forEach((m) => {
      if (m && m.id) map.set(m.id, m);
    });
    const cleaned = this.purgeExpiredPublicChats(Array.from(map.values()));
    if (cleaned.length !== raw.length) {
      safeSet(STORAGE_KEYS.PUBLIC_CHAT, cleaned);
    }
    return cleaned;
  },

  setPublicChatMessages(items: PublicChatMessage[]): void {
    const map = new Map<string, PublicChatMessage>();
    (items || []).forEach((m) => {
      if (m && m.id) map.set(m.id, m);
    });
    const cleaned = this.purgeExpiredPublicChats(Array.from(map.values()));
    safeSet(STORAGE_KEYS.PUBLIC_CHAT, cleaned);
    try {
      window.dispatchEvent(new CustomEvent('kota_refleksi_public_chat_updated', { detail: cleaned }));
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const bc = new BroadcastChannel('kota_refleksi_channel');
        bc.postMessage({ type: 'chat_updated', data: cleaned });
        bc.close();
      }
    } catch (e) {
      // safe fallback
    }
  },

  async fetchPublicChatMessages(): Promise<PublicChatMessage[]> {
    const localItems = this.getPublicChatMessages();
    const msgMap = new Map<string, PublicChatMessage>();
    localItems.forEach((m) => msgMap.set(m.id, m));

    // 1. Fetch shared messages from server API (/api/chat/messages) if available
    try {
      const response = await fetch('/api/chat/messages');
      if (response.ok) {
        const result = await response.json();
        if (result.success && Array.isArray(result.data)) {
          result.data.forEach((m: PublicChatMessage) => {
            if (m && m.id) msgMap.set(m.id, m);
          });
        }
      }
    } catch (err) {
      // Offline / client-only fallback
    }

    // 2. Fetch shared messages from Google Spreadsheet / Google Apps Script Web App
    // This connects all students across different devices & networks in real-time
    const settings = this.getSettings();
    if (settings.gasWebAppUrl && settings.gasWebAppUrl.startsWith('http')) {
      try {
        const url = new URL(settings.gasWebAppUrl);
        url.searchParams.set('action', 'get_chats');
        url.searchParams.set('_t', String(Date.now()));

        const gasRes = await fetch(url.toString(), {
          method: 'GET',
          redirect: 'follow',
          cache: 'no-store',
        });
        if (gasRes.ok) {
          const resData = await gasRes.json();
          const chatList = Array.isArray(resData.chats)
            ? resData.chats
            : Array.isArray(resData)
            ? resData
            : [];
          chatList.forEach((m: PublicChatMessage) => {
            if (m && m.id && m.content) {
              msgMap.set(m.id, {
                ...m,
                roomNumber: m.roomNumber || 1,
                avatarColor: m.avatarColor || '#38bdf8',
              });
            }
          });
        }
      } catch (err) {
        // Safe silent fallback if offline or network error
      }
    }

    const merged = this.purgeExpiredPublicChats(Array.from(msgMap.values()));
    const localIds = localItems.map((m) => m.id).join(',');
    const mergedIds = merged.map((m) => m.id).join(',');
    if (localIds !== mergedIds) {
      this.setPublicChatMessages(merged);
    }
    return merged;
  },

  async addPublicChatMessage(msg: PublicChatMessage): Promise<void> {
    const items = this.getPublicChatMessages();
    const map = new Map<string, PublicChatMessage>();
    map.set(msg.id, msg);
    items.forEach((m) => {
      if (m && m.id && !map.has(m.id)) {
        map.set(m.id, m);
      }
    });
    const cleaned = this.purgeExpiredPublicChats(Array.from(map.values()));
    this.setPublicChatMessages(cleaned);

    // 1. Broadcast to server API
    try {
      fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(msg),
      }).catch(() => {});
    } catch (e) {
      // safe fallback
    }

    // 2. Sync to Google Spreadsheet immediately so all students on all devices receive it
    this.syncWithGAS('send_public_chat', { message: msg });
  },

  reportChatMessage(msgId: string): void {
    const items = this.getPublicChatMessages().map((m) =>
      m.id === msgId ? { ...m, isReported: true } : m
    );
    this.setPublicChatMessages(items);

    try {
      fetch('/api/chat/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId: msgId }),
      }).catch(() => {});
    } catch (e) {
      // safe fallback
    }
  },

  getSettings(): TownSettings {
    const saved = safeGet<TownSettings>(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
    let modified = false;
    if (!saved.gasWebAppUrl || saved.gasWebAppUrl.trim().length === 0) {
      saved.gasWebAppUrl = INITIAL_SETTINGS.gasWebAppUrl;
      modified = true;
    }
    if (!saved.spreadsheetUrl || saved.spreadsheetUrl.trim().length === 0) {
      saved.spreadsheetUrl = INITIAL_SETTINGS.spreadsheetUrl;
      modified = true;
    }
    if (!saved.teacherPin || saved.teacherPin.trim().length === 0) {
      saved.teacherPin = 'Kiki123!';
      modified = true;
    }
    if (modified) {
      safeSet(STORAGE_KEYS.SETTINGS, saved);
    }
    return saved;
  },

  setSettings(settings: TownSettings): void {
    safeSet(STORAGE_KEYS.SETTINGS, settings);
  },

  resetAllData(): void {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    localStorage.removeItem(STORAGE_KEYS.MATERI);
    localStorage.removeItem(STORAGE_KEYS.OBJECTIVES);
    localStorage.removeItem(STORAGE_KEYS.QUIZ);
    localStorage.removeItem(STORAGE_KEYS.STUDENTS);
    localStorage.removeItem(STORAGE_KEYS.REFLECTIONS);
    localStorage.removeItem(STORAGE_KEYS.FEEDBACKS);
    localStorage.removeItem(STORAGE_KEYS.MESSAGES);
    localStorage.removeItem(STORAGE_KEYS.SETTINGS);
  },

  async syncWithGAS(action: string, payload: any): Promise<boolean> {
    const settings = this.getSettings();
    if (!settings.gasWebAppUrl || !settings.gasWebAppUrl.startsWith('http')) {
      return false;
    }
    try {
      const dataToSend = {
        action,
        timestamp: new Date().toISOString(),
        ...payload,
      };

      // Use text/plain;charset=utf-8 with mode: 'no-cors' so browser avoids CORS preflight OPTIONS rejection
      // Google Apps Script parses e.postData.contents as JSON seamlessly
      await fetch(settings.gasWebAppUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify(dataToSend),
      });
      return true;
    } catch (e) {
      console.warn('Google Apps Script sync skipped/failed:', e);
      return false;
    }
  },

  async fetchFromGAS(): Promise<{
    success: boolean;
    reflections?: Reflection[];
    feedbacks?: MentorFeedback[];
    messages?: Message[];
    chats?: PublicChatMessage[];
    spreadsheetName?: string;
    needsScriptUpdate?: boolean;
    error?: string;
  }> {
    const settings = this.getSettings();
    if (!settings.gasWebAppUrl || !settings.gasWebAppUrl.startsWith('http')) {
      return { success: false, error: 'URL Google Apps Script belum diatur.' };
    }

    try {
      const url = new URL(settings.gasWebAppUrl);
      url.searchParams.set('action', 'get_data');
      url.searchParams.set('_t', String(Date.now()));

      const response = await fetch(url.toString(), {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error(`Koneksi HTTP menghasilkan status: ${response.status}`);
      }

      const resData = await response.json();

      const hasReflections = Array.isArray(resData.reflections);
      const hasMessages = Array.isArray(resData.messages);
      const hasChats = Array.isArray(resData.chats);

      if (hasReflections || hasMessages || hasChats) {
        const deletedIds = new Set(this.getDeletedReflectionIds());
        const validReflections = (resData.reflections || []).filter(
          (r: Reflection) => !deletedIds.has(r.id)
        );
        const validFeedbacks = (resData.feedbacks || []).filter(
          (f: MentorFeedback) => !deletedIds.has(f.reflectionId)
        );

        let validChats: PublicChatMessage[] = [];
        if (hasChats && resData.chats.length > 0) {
          const currentChats = this.getPublicChatMessages();
          const chatMap = new Map<string, PublicChatMessage>();
          resData.chats.forEach((c: PublicChatMessage) => chatMap.set(c.id, c));
          currentChats.forEach((c) => {
            if (!chatMap.has(c.id)) chatMap.set(c.id, c);
          });
          validChats = this.purgeExpiredPublicChats(Array.from(chatMap.values()));
          this.setPublicChatMessages(validChats);
        }

        return {
          success: true,
          reflections: validReflections,
          feedbacks: validFeedbacks,
          messages: resData.messages || [],
          chats: validChats,
          spreadsheetName: resData.spreadsheet || 'Google Spreadsheet',
        };
      }

      if (resData.spreadsheet && !hasReflections) {
        return {
          success: false,
          spreadsheetName: resData.spreadsheet,
          needsScriptUpdate: true,
          error: `Terhubung ke Google Spreadsheet "${resData.spreadsheet}", namun skrip Google Apps Script masih versi 1.0 (belum memiliki fungsi pembacaan data). Silakan perbarui skrip di spreadsheet Anda.`,
        };
      }

      return {
        success: false,
        error: 'Respons dari Google Apps Script tidak mengandung data refleksi atau pesan.',
      };
    } catch (err: any) {
      console.warn('Gagal menarik data dari Google Apps Script:', err);
      return {
        success: false,
        error: err?.message || 'Gagal terhubung ke Google Apps Script.',
      };
    }
  },
};
