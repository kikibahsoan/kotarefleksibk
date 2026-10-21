import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateStudentLevel,
  evaluateBadges,
  calculateClassStats,
  validateReflection,
  generateCSVExport
} from './rules.ts';
import type { Student, Reflection, MentorFeedback, Materi } from '../types/index.ts';

test('calculateStudentLevel returns correct level and progress', () => {
  const lvl1 = calculateStudentLevel(25);
  assert.equal(lvl1.level, 1);
  assert.equal(lvl1.title, 'Warga Pemula');
  assert.equal(lvl1.progressPercent, 50);

  const lvl2 = calculateStudentLevel(100);
  assert.equal(lvl2.level, 2);
  assert.equal(lvl2.title, 'Penjelajah Kota');

  const lvl5 = calculateStudentLevel(750);
  assert.equal(lvl5.level, 5);
  assert.equal(lvl5.title, 'Arsitek Pembelajar');
});

test('evaluateBadges unlocks badges based on criteria', () => {
  const mockStudent: Student = {
    id: 's1',
    name: 'Ahmad Fauzi',
    className: 'X RPL 1',
    points: 120,
    badges: [],
    lastLogin: '2026-10-20',
    streakDays: 3,
  };

  const mockReflections: Reflection[] = [
    {
      id: 'r1',
      studentId: 's1',
      studentName: 'Ahmad Fauzi',
      className: 'X RPL 1',
      materiId: 'm1',
      answers: {
        understood: 'Saya sudah memahami cara membuat function di JavaScript dengan baik.',
        difficult: 'Masih agak bingung tentang async/await dan Promise chaining.',
        actionPlan: 'Saya akan mencoba membuat 3 contoh latihan async fetch API.',
      },
      scale: 4,
      moodEmoji: '🚀',
      createdAt: '2026-10-20',
    },
    {
      id: 'r2',
      studentId: 's1',
      studentName: 'Ahmad Fauzi',
      className: 'X RPL 1',
      materiId: 'm2',
      answers: {
        understood: 'Memahami flexbox dan CSS grid layout untuk tata letak web responsif.',
        difficult: 'Pengaturan subgrid dan align-items versus justify-content.',
        actionPlan: 'Mengerjakan game flexbox froggy sampai tuntas.',
      },
      scale: 3,
      moodEmoji: '😊',
      createdAt: '2026-10-20',
    },
    {
      id: 'r3',
      studentId: 's1',
      studentName: 'Ahmad Fauzi',
      className: 'X RPL 1',
      materiId: 'm3',
      answers: {
        understood: 'Struktur database relasional dan foreign key.',
        difficult: 'Query JOIN yang kompleks antar 3 tabel.',
        actionPlan: 'Membaca dokumentasi SQL dan meminta bantuan mentor.',
      },
      scale: 4,
      moodEmoji: '🤔',
      createdAt: '2026-10-20',
    },
  ];

  const badges = evaluateBadges(mockStudent, mockReflections, 2, 1);
  assert.ok(badges.includes('reflektor_pertama'));
  assert.ok(badges.includes('reflektor_gigih'));
  assert.ok(badges.includes('penjelajah_rajin'));
  assert.ok(badges.includes('juara_bengkel'));
  assert.ok(badges.includes('murid_komunikatif'));
  assert.ok(badges.includes('pemikir_kritis'));
});

test('calculateClassStats computes average scale, hardest topic, and attention count', () => {
  const students: Student[] = [
    { id: 's1', name: 'Ahmad', className: 'X RPL 1', points: 10, badges: [], lastLogin: '', streakDays: 1 },
    { id: 's2', name: 'Budi', className: 'X RPL 1', points: 10, badges: [], lastLogin: '', streakDays: 1 },
    { id: 's3', name: 'Citra', className: 'X RPL 1', points: 10, badges: [], lastLogin: '', streakDays: 1 },
  ];

  const materis: Materi[] = [
    { id: 'm1', title: 'Pemrograman Web Dasar', subject: 'Informatika', targetClass: 'X RPL 1', content: '', location: 'perpustakaan', createdAt: '' },
    { id: 'm2', title: 'Basis Data SQL', subject: 'Basis Data', targetClass: 'X RPL 1', content: '', location: 'perpustakaan', createdAt: '' },
  ];

  const reflections: Reflection[] = [
    { id: 'r1', studentId: 's1', studentName: 'Ahmad', className: 'X RPL 1', materiId: 'm1', answers: { understood: 'a', difficult: 'b', actionPlan: 'c' }, scale: 4, moodEmoji: '😊', createdAt: '' },
    { id: 'r2', studentId: 's2', studentName: 'Budi', className: 'X RPL 1', materiId: 'm2', answers: { understood: 'a', difficult: 'b', actionPlan: 'c' }, scale: 2, moodEmoji: '🤔', createdAt: '' },
  ];

  const feedbacks: MentorFeedback[] = [
    { id: 'f1', reflectionId: 'r1', apresiasi: 'Bagus', sudah_dikuasai: [], perlu_diperkuat: [], saran: [], pertanyaan_pemantik: '', rencana_belajar: [], perlu_perhatian_guru: false },
    { id: 'f2', reflectionId: 'r2', apresiasi: 'Tetap semangat', sudah_dikuasai: [], perlu_diperkuat: [], saran: [], pertanyaan_pemantik: '', rencana_belajar: [], perlu_perhatian_guru: true },
  ];

  const stats = calculateClassStats(reflections, feedbacks, students, materis, 'X RPL 1');
  assert.equal(stats.totalReflections, 2);
  assert.equal(stats.averageScale, 3.0);
  assert.equal(stats.studentCount, 3);
  assert.equal(stats.studentsPendingReflectionCount, 1); // s3 hasn't reflected
  assert.equal(stats.attentionNeededCount, 1); // r2 scale <= 2 and perlu_perhatian_guru
  assert.equal(stats.hardestTopic?.materiId, 'm2');
});

test('validateReflection rejects invalid scale or short inputs', () => {
  const invalidScale = validateReflection({ understood: 'Valid text', difficult: 'Valid text', actionPlan: 'Valid text' }, 0);
  assert.equal(invalidScale.valid, false);

  const shortUnderstood = validateReflection({ understood: 'no', difficult: 'Valid text', actionPlan: 'Valid text' }, 4);
  assert.equal(shortUnderstood.valid, false);

  const valid = validateReflection({
    understood: 'Saya paham cara membuat variabel',
    difficult: 'Masih bingung dengan rekursi',
    actionPlan: 'Membaca modul halaman 20',
  }, 4);
  assert.equal(valid.valid, true);
});

test('generateCSVExport produces valid CSV lines with headers', () => {
  const reflections: Reflection[] = [
    {
      id: 'ref-01',
      studentId: 's1',
      studentName: 'Citra Kirana',
      className: 'X RPL 1',
      materiId: 'm1',
      answers: {
        understood: 'Membuat halaman HTML',
        difficult: 'Menghubungkan stylesheet',
        actionPlan: 'Cek tag link rel',
      },
      scale: 4,
      moodEmoji: '😊',
      createdAt: '2026-10-20',
    },
  ];
  const feedbacks: MentorFeedback[] = [];
  const materis: Materi[] = [{ id: 'm1', title: 'Dasar HTML', subject: 'Web', targetClass: 'X RPL 1', content: '', location: 'perpustakaan', createdAt: '' }];

  const csv = generateCSVExport(reflections, feedbacks, materis);
  assert.ok(csv.includes('ID Refleksi,Tanggal,Nama Murid'));
  assert.ok(csv.includes('"Citra Kirana"'));
  assert.ok(csv.includes('"Dasar HTML"'));
});
