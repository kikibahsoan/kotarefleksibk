import {
  Materi,
  LearningObjective,
  QuizQuestion,
  Student,
  Reflection,
  MentorFeedback,
  Message,
  TownSettings,
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

export const StorageService = {
  getCurrentStudent(): Student | null {
    const student = safeGet<Student | null>(STORAGE_KEYS.CURRENT_USER, null);
    if (student && !student.className.includes('DKV')) {
      student.className = 'X DKV 1 (Desain Komunikasi Visual)';
      safeSet(STORAGE_KEYS.CURRENT_USER, student);
    }
    return student;
  },

  setCurrentStudent(student: Student | null): void {
    safeSet(STORAGE_KEYS.CURRENT_USER, student);
  },

  getMateri(): Materi[] {
    const items = safeGet<Materi[]>(STORAGE_KEYS.MATERI, INITIAL_MATERI);
    if (!items || items.length === 0 || !items.some((m) => m.id.startsWith('materi-bk-'))) {
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
    if (!items || items.length === 0 || !items.some((q) => q.id.startsWith('q-bk-'))) {
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
    return safeGet<Student[]>(STORAGE_KEYS.STUDENTS, INITIAL_STUDENTS);
  },

  setStudents(items: Student[]): void {
    safeSet(STORAGE_KEYS.STUDENTS, items);
  },

  saveOrUpdateStudent(student: Student): void {
    const items = this.getStudents();
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
  },

  getReflections(): Reflection[] {
    const items = safeGet<Reflection[]>(STORAGE_KEYS.REFLECTIONS, INITIAL_REFLECTIONS);
    // Automatically purge old dummy reflections (ref-bk-001, ref-bk-002) if stored in localStorage
    const cleaned = (items || []).filter(
      (r) => r.id !== 'ref-bk-001' && r.id !== 'ref-bk-002' && !r.id.startsWith('dummy-')
    );
    if (cleaned.length !== (items || []).length) {
      safeSet(STORAGE_KEYS.REFLECTIONS, cleaned);
    }
    return cleaned;
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
  },

  clearReflections(): void {
    this.setReflections([]);
    this.setFeedbacks([]);
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

  getSettings(): TownSettings {
    const saved = safeGet<TownSettings>(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
    let modified = false;
    if (!saved.gasWebAppUrl || !saved.gasWebAppUrl.includes('AKfycbwzHhVYKBfznA_k4dZlB1eGFevpeLoJDiSUbLKXJACQPgsKFxi0HfbNNbjUZBWa7finfw')) {
      saved.gasWebAppUrl = INITIAL_SETTINGS.gasWebAppUrl;
      modified = true;
    }
    if (!saved.teacherPin || saved.teacherPin === '1234') {
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

      if (hasReflections || hasMessages) {
        return {
          success: true,
          reflections: resData.reflections || [],
          feedbacks: resData.feedbacks || [],
          messages: resData.messages || [],
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
