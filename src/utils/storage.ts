import {
  Materi,
  LearningObjective,
  QuizQuestion,
  Student,
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
    const items = safeGet<Student[]>(STORAGE_KEYS.STUDENTS, INITIAL_STUDENTS);
    const listMigrated = localStorage.getItem('kota_students_xp_v2');
    if (
      !items ||
      items.length < 50 ||
      items.some((s) => s.className.includes('DKV 1')) ||
      !listMigrated
    ) {
      safeSet(STORAGE_KEYS.STUDENTS, INITIAL_STUDENTS);
      try {
        localStorage.setItem('kota_students_xp_v2', '1');
      } catch (e) {}
      return INITIAL_STUDENTS;
    }
    return items;
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
