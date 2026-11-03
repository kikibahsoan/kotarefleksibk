import React, { useState, useEffect } from 'react';
import { Student } from '../../types/index.ts';
import { sounds } from '../../utils/audio.ts';
import {
  X,
  BookOpen,
  Volume2,
  CheckCircle2,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Compass,
  Droplets,
  Clock,
  Award,
  HelpCircle,
} from 'lucide-react';

interface MasjidModalProps {
  onClose: () => void;
  student: Student;
  onAddXp?: (amount: number, reason: string) => void;
  onCompleteMasjidMission?: () => void;
}

export interface IqroCardItem {
  id: string;
  arabic: string;
  latin: string;
  ruleNote: string;
  speechText: string;
}

export interface IqroJilidData {
  jilid: 1 | 2 | 3 | 4 | 5 | 6;
  title: string;
  subtitle: string;
  focusSummary: string;
  keyRules: string[];
  cards: IqroCardItem[];
  practiceRows: Array<{
    arabic: string;
    latin: string;
    note: string;
  }>;
  quiz: {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  };
}

export const IQRO_VOLUMES: IqroJilidData[] = [
  {
    jilid: 1,
    title: 'Iqro Jilid 1',
    subtitle: 'Pengenalan Huruf Hijaiyah Tunggal Berharakat Fathah (ـَ)',
    focusSummary:
      'Mengenal 28 huruf Hijaiyah bentuk tunggal dengan harakat Fathah (bunyi vokal "A" pendek 1 ketukan) serta membedakan makhraj (tempat keluarnya huruf) yang mirip.',
    keyRules: [
      'Baca secara langsung (tanpa dieja "Alif Fathah A"), cukup ucapkan pendek & tegas: "A, Ba, Ta, Tsa...".',
      'Jaga ketukan pendek 1 harakat — jangan dipanjangkan menjadi "Baa" atau "Taa".',
      'Perhatikan perbedaan makhraj huruf yang mirip bunyinya: (ت vs ط), (ث vs س vs ش vs ص), (ح vs هـ), (ع vs ء), (ذ vs ز vs ظ).',
    ],
    cards: [
      { id: '1-1', arabic: 'اَ', latin: 'A', ruleNote: 'Tenggorokan bawah (Al-Jauf / Halq)', speechText: 'A' },
      { id: '1-2', arabic: 'بَ', latin: 'Ba', ruleNote: 'Dua bibir merapat (Asy-Syafatain)', speechText: 'Ba' },
      { id: '1-3', arabic: 'تَ', latin: 'Ta', ruleNote: 'Ujung lidah di pangkal gigi seri atas', speechText: 'Ta' },
      { id: '1-4', arabic: 'ثَ', latin: 'Tsa', ruleNote: 'Ujung lidah disentuhkan ke ujung gigi seri atas', speechText: 'Tsa' },
      { id: '1-5', arabic: 'جَ', latin: 'Ja', ruleNote: 'Tengah lidah menyentuh langit-langit atas', speechText: 'Ja' },
      { id: '1-6', arabic: 'حَ', latin: 'Ha', ruleNote: 'Tenggorokan tengah (bersih & nyaring)', speechText: 'Ha' },
      { id: '1-7', arabic: 'خَ', latin: 'Kha', ruleNote: 'Tenggorokan atas (seperti mendengkur halus)', speechText: 'Kha' },
      { id: '1-8', arabic: 'دَ', latin: 'Da', ruleNote: 'Ujung lidah pada pangkal gigi seri atas', speechText: 'Da' },
      { id: '1-9', arabic: 'ذَ', latin: 'Dza', ruleNote: 'Ujung lidah pada ujung gigi seri atas (lembut)', speechText: 'Dza' },
      { id: '1-10', arabic: 'رَ', latin: 'Ra', ruleNote: 'Punggung ujung lidah menyentuh gusi atas', speechText: 'Ro' },
      { id: '1-11', arabic: 'زَ', latin: 'Za', ruleNote: 'Ujung lidah di belakang gigi seri bawah (berdesir)', speechText: 'Za' },
      { id: '1-12', arabic: 'سَ', latin: 'Sa', ruleNote: 'Desis tipis ujung lidah & gigi seri bawah', speechText: 'Sa' },
      { id: '1-13', arabic: 'شَ', latin: 'Sya', ruleNote: 'Tengah lidah menyebar udara hangat (Syin)', speechText: 'Sya' },
      { id: '1-14', arabic: 'صَ', latin: 'Sha', ruleNote: 'Tebal (Isti’la), bibir tidak monyong', speechText: 'Sho' },
      { id: '1-15', arabic: 'ضَ', latin: 'Dha', ruleNote: 'Sisi lidah menyentuh gigi geraham atas (tebal)', speechText: 'Dho' },
      { id: '1-16', arabic: 'طَ', latin: 'Tha', ruleNote: 'Ujung lidah di pangkal gigi seri atas (tebal)', speechText: 'Tho' },
      { id: '1-17', arabic: 'ظَ', latin: 'Zha', ruleNote: 'Ujung lidah di ujung gigi seri atas (tebal)', speechText: 'Zho' },
      { id: '1-18', arabic: 'عَ', latin: '‘A', ruleNote: 'Tenggorokan tengah dalam (‘Ain)', speechText: 'Aa' },
      { id: '1-19', arabic: 'غَ', latin: 'Gha', ruleNote: 'Tenggorokan atas (Ghain)', speechText: 'Gho' },
      { id: '1-20', arabic: 'فَ', latin: 'Fa', ruleNote: 'Perut bibir bawah & ujung gigi seri atas', speechText: 'Fa' },
      { id: '1-21', arabic: 'قَ', latin: 'Qa', ruleNote: 'Pangkal lidah dekat kerongkongan (Qaf mantap)', speechText: 'Qo' },
      { id: '1-22', arabic: 'كَ', latin: 'Ka', ruleNote: 'Pangkal lidah agak ke depan (ada hembusan halus)', speechText: 'Ka' },
      { id: '1-23', arabic: 'لَ', latin: 'La', ruleNote: 'Tepi ujung lidah menyentuh gusi atas', speechText: 'La' },
      { id: '1-24', arabic: 'مَ', latin: 'Ma', ruleNote: 'Dua bibir menutup rapat disertai dengung ringan', speechText: 'Ma' },
      { id: '1-25', arabic: 'نَ', latin: 'Na', ruleNote: 'Ujung lidah pada gusi atas', speechText: 'Na' },
      { id: '1-26', arabic: 'وَ', latin: 'Wa', ruleNote: 'Dua bibir membulat maju (Wawu)', speechText: 'Wa' },
      { id: '1-27', arabic: 'هَ', latin: 'Ha', ruleNote: 'Tenggorokan paling bawah / dada (Ha besar)', speechText: 'Ha' },
      { id: '1-28', arabic: 'يَ', latin: 'Ya', ruleNote: 'Tengah lidah dengan langit-langit', speechText: 'Ya' },
    ],
    practiceRows: [
      { arabic: 'اَ بَ تَ   •   بَ تَ ثَ   •   جَ حَ خَ', latin: 'A - Ba - Ta  •  Ba - Ta - Tsa  •  Ja - Ha - Kha', note: 'Baca tegas 1 ketukan pendek tanpa menyeret suara.' },
      { arabic: 'دَ رَ سَ   •   شَ كَ رَ   •   عَ مَ لَ', latin: 'Da - Ra - Sa  •  Sya - Ka - Ra  •  ‘A - Ma - La', note: 'Latihan merangkai 3 huruf tunggal berurutan.' },
      { arabic: 'صَ دَ قَ   •   فَ تَ حَ   •   نَ ظَ رَ', latin: 'Sha - Da - Qa  •  Fa - Ta - Ha  •  Na - Zha - Ra', note: 'Perhatikan huruf tebal (Sha, Qa, Zha) vs huruf tipis.' },
    ],
    quiz: {
      question: 'Pada Iqro Jilid 1, bagaimana cara membaca huruf "بَ تَ ثَ" yang benar?',
      options: [
        'Dibaca pendek & tegas 1 harakat: "Ba - Ta - Tsa"',
        'Dipanjangkan 3 ketukan: "Baaa - Taaa - Tsaaa"',
        'Dieja satu-satu terlebih dahulu baru dibaca',
        'Dibaca mendengung lama di setiap huruf',
      ],
      correctIndex: 0,
      explanation: 'Prinsip utama Iqro Jilid 1 adalah membaca langsung (tanpa mengeja) dengan ketukan pendek 1 harakat yang tegas.',
    },
  },
  {
    jilid: 2,
    title: 'Iqro Jilid 2',
    subtitle: 'Huruf Hijaiyah Bersambung & Bacaan Panjang Mad Thabi’i (Alif)',
    focusSummary:
      'Memahami perubahan bentuk huruf Hijaiyah ketika disambung di awal, tengah, dan akhir kata, serta menguasai tanda baca panjang 2 harakat (Mad Thabi’i karena Fathah bertemu Alif mati).',
    keyRules: [
      'Kenali titik dan kepala huruf saat disambung: ب (1 titik bawah), ت (2 titik atas), ث (3 titik atas), ن (1 titik atas), ي (2 titik bawah).',
      '6 huruf yang TIDAK BISA menyambung ke huruf sesudahnya (kiri): ا ، د ، ذ ، ر ، ز ، و.',
      'Fathah diikuti Alif tanpa harakat (ـَا) dibaca panjang 2 ketukan ayunan (Mad Thabi’i).',
    ],
    cards: [
      { id: '2-1', arabic: 'بَـ ـبَـ ـبَ', latin: 'Ba - Ba - Ba', ruleNote: 'Bentuk huruf Ba di Awal, Tengah, dan Akhir kata', speechText: 'Ba Ba Ba' },
      { id: '2-2', arabic: 'تَـ ـتَـ ـتَ', latin: 'Ta - Ta - Ta', ruleNote: 'Bentuk huruf Ta (2 titik di atas) saat bersambung', speechText: 'Ta Ta Ta' },
      { id: '2-3', arabic: 'جَـ ـجَـ ـجَ', latin: 'Ja - Ja - Ja', ruleNote: 'Ekor huruf Jim hilang saat berada di awal & tengah', speechText: 'Ja Ja Ja' },
      { id: '2-4', arabic: 'عَـ ـعَـ ـعَ', latin: '‘A - ‘A - ‘A', ruleNote: 'Kepala ‘Ain tertutup saat di tengah dan akhir', speechText: 'Aa Aa Aa' },
      { id: '2-5', arabic: 'كَـ ـكَـ ـكَ', latin: 'Ka - Ka - Ka', ruleNote: 'Perubahan bentuk Kaf di awal/tengah vs akhir', speechText: 'Ka Ka Ka' },
      { id: '2-6', arabic: 'بَا  تَا', latin: 'Baa - Taa', ruleNote: 'Mad Thabi’i: Fathah bertemu Alif dibaca panjang 2 harakat', speechText: 'Baa Taa' },
      { id: '2-7', arabic: 'كَانَ', latin: 'Kaa - na', ruleNote: 'Kaa (panjang 2 ketukan) + na (pendek 1 ketukan)', speechText: 'Kaana' },
      { id: '2-8', arabic: 'قَالَ', latin: 'Qaa - la', ruleNote: 'Qaa (panjang 2 ketukan) + la (pendek 1 ketukan)', speechText: 'Qoola' },
    ],
    practiceRows: [
      { arabic: 'نَصَرَ   •   كَتَبَ   •   جَعَلَ', latin: 'Na-sha-ra  •  Ka-ta-ba  •  Ja-‘a-la', note: 'Huruf bersambung pendek semua (1 ketukan rata).' },
      { arabic: 'مَا لَكَ   •   خَافَ   •   طَابَ', latin: 'Maa la-ka  •  Khaa-fa  •  Thaa-ba', note: 'Ayunkan 2 ketukan tepat pada huruf yang diikuti Alif.' },
      { arabic: 'صَادَقَ   •   كَاتَبَ   •   تَعَالَى', latin: 'Shaa-da-qa  •  Kaa-ta-ba  •  Ta-‘aa-laa', note: 'Bedakan dengan disiplin mana huruf panjang dan pendek.' },
    ],
    quiz: {
      question: 'Pada kata "قَالَ" (Qaa-la), huruf Qaf diikuti oleh Alif mati tanpa harakat. Berapa panjang bacaan huruf Qaf tersebut?',
      options: [
        '1 harakat (pendek)',
        '2 harakat (Mad Thabi’i)',
        '6 harakat',
        'Dipantulkan (Qalqalah)',
      ],
      correctIndex: 1,
      explanation: 'Fathah yang diikuti Alif sukun/mati adalah bacaan Mad Thabi’i dan wajib dibaca panjang 2 harakat.',
    },
  },
  {
    jilid: 3,
    title: 'Iqro Jilid 3',
    subtitle: 'Harakat Kasrah (ـِ), Dhammah (ـُ), Mad Ya Sukun (ـِيْ) & Wawu Sukun (ـُوْ)',
    focusSummary:
      'Menguasai bunyi vokal "I" (Kasrah) dan "U" (Dhammah), bacaan panjang karena Ya Sukun (ـِيْ) dan Wawu Sukun (ـُوْ), serta bacaan lembut Huruf Layyin (ـَيْ / ـَوْ).',
    keyRules: [
      'Kasrah (garis di bawah huruf) berbunyi "I" jelas; Dhammah (seperti wawu kecil di atas) berbunyi "U" dengan bibir maju sempurna.',
      'Kasrah diikuti Ya Sukun (ـِيْ) dibaca panjang 2 harakat ("Bii, Tii").',
      'Dhammah diikuti Wawu Sukun (ـُوْ) dibaca panjang 2 harakat ("Buu, Tuu").',
    ],
    cards: [
      { id: '3-1', arabic: 'بِ تِ ثِ', latin: 'Bi - Ti - Tsi', ruleNote: 'Harakat Kasrah pendek 1 ketukan', speechText: 'Bi Ti Tsi' },
      { id: '3-2', arabic: 'بِيْ تِيْ', latin: 'Bii - Tii', ruleNote: 'Kasrah diikuti Ya Sukun = Panjang 2 harakat', speechText: 'Bii Tii' },
      { id: '3-3', arabic: 'بُ تُ ثُ', latin: 'Bu - Tu - Tsu', ruleNote: 'Harakat Dhammah pendek 1 ketukan (bibir membulat)', speechText: 'Bu Tu Tsu' },
      { id: '3-4', arabic: 'بُوْ تُوْ', latin: 'Buu - Tuu', ruleNote: 'Dhammah diikuti Wawu Sukun = Panjang 2 harakat', speechText: 'Buu Tuu' },
      { id: '3-5', arabic: 'فِيْهَا', latin: 'Fii - haa', ruleNote: 'Dua-duanya panjang 2 harakat (Ya Sukun & Alif)', speechText: 'Fiihaa' },
      { id: '3-6', arabic: 'نُوْحِيْهَا', latin: 'Nuu - hii - haa', ruleNote: 'Gabungan 3 Mad Thabi’i (Wawu, Ya, Alif) masing-masing 2 harakat', speechText: 'Nuuhiihaa' },
      { id: '3-7', arabic: 'يَوْمَ', latin: 'Yau - ma', ruleNote: 'Huruf Layyin: Fathah bertemu Wawu Sukun dibaca lembut "Yau"', speechText: 'Yauma' },
      { id: '3-8', arabic: 'كَيْفَ', latin: 'Kai - fa', ruleNote: 'Huruf Layyin: Fathah bertemu Ya Sukun dibaca lembut "Kai"', speechText: 'Kaifa' },
    ],
    practiceRows: [
      { arabic: 'سَمِيْعَ   •   عَلِيْمُ   •   بَصِيْرُ', latin: 'Sa-mii-‘a  •  ‘A-lii-mu  •  Ba-shii-ru', note: 'Huruf tengah berharakat Kasrah + Ya Sukun dibaca panjang 2 ketukan.' },
      { arabic: 'يَقُوْلُ   •   تَكُوْنُ   •   رَسُوْلُ', latin: 'Ya-quu-lu  •  Ta-kuu-nu  •  Ra-suu-lu', note: 'Huruf tengah berharakat Dhammah + Wawu Sukun dibaca panjang 2 ketukan.' },
      { arabic: 'إِلَيْهِ   •   عَلَيْهِ   •   لَدَيْهِ', latin: 'I-lai-hi  •  ‘A-lai-hi  •  La-dai-hi', note: 'Ayunan lembut pada huruf Layyin (ـَيْـ) tanpa diputuskan.' },
    ],
    quiz: {
      question: 'Manakah kata di bawah ini yang mengandung ketiga jenis Mad Thabi’i (Wawu Sukun, Ya Sukun, dan Alif) sekaligus?',
      options: [
        'نُوْحِيْهَا (Nuu-hii-haa)',
        'كَتَبَ (Ka-ta-ba)',
        'سَمِعَ (Sa-mi-‘a)',
        'حَسُنَ (Ha-su-na)',
      ],
      correctIndex: 0,
      explanation: 'Kata نُوْحِيْهَا memuat Dhammah+Wawu Sukun (نُوْ), Kasrah+Ya Sukun (حِيْ), dan Fathah+Alif (هَا).',
    },
  },
  {
    jilid: 4,
    title: 'Iqro Jilid 4',
    subtitle: 'Tanwin (ـً ـٍ ـٌ), Tanda Sukun (ـْ), dan Pantulan Qalqalah (ب ج د ط ق)',
    focusSummary:
      'Mempelajari bunyi akhir "N" pada harakat Tanwin (An, In, Un), cara mematikan huruf dengan tanda Sukun (ـْ), serta memantulkan 5 huruf Qalqalah saat mati.',
    keyRules: [
      'Fathatain (ـً) = "An", Kasratain (ـٍ) = "In", Dhammatain (ـٌ) = "Un" (dibaca pendek dan tegas).',
      'Lima huruf Qalqalah disingkat "BA-JU-DI-TO-KO" (ب ج د ط ق): apabila berharakat Sukun (mati), wajib dipantulkan dengan jelas.',
      'Huruf selain Qalqalah (seperti مْ ، نْ ، سْ ، كْ ، تْ) saat Sukun TIDAK BOLEH dipantulkan.',
    ],
    cards: [
      { id: '4-1', arabic: 'بًا بٍ بٌ', latin: 'Ban - Bin - Bun', ruleNote: 'Harakat Tanwin: Fathatain, Kasratain, Dhammatain', speechText: 'Ban Bin Bun' },
      { id: '4-2', arabic: 'اَبْ  اَجْ  اَدْ', latin: 'Ab‘ - Aj‘ - Ad‘', ruleNote: 'Qalqalah Sughra pada huruf Ba, Jim, Dal sukun', speechText: 'Ab Aj Ad' },
      { id: '4-3', arabic: 'اَطْ  اَقْ', latin: 'Ath‘ - Aq‘', ruleNote: 'Qalqalah Sughra tebal pada huruf Tha & Qaf sukun', speechText: 'Ath Aq' },
      { id: '4-4', arabic: 'يَجْعَلْ', latin: 'Yaj‘ - ‘al', ruleNote: 'Jim sukun dipantulkan (Yaj), Lam sukun ditahan (tidak mantul)', speechText: 'Yaj al' },
      { id: '4-5', arabic: 'يَدْخُلُ', latin: 'Yad‘ - khu - lu', ruleNote: 'Dal sukun dipantulkan ringan & jelas', speechText: 'Yadkhulu' },
      { id: '4-6', arabic: 'اَقْرَبُ', latin: 'Aq‘ - ra - bu', ruleNote: 'Qaf sukun dipantulkan tebal', speechText: 'Aqrabu' },
      { id: '4-7', arabic: 'مَسْجِدٌ', latin: 'Mas - ji - dun', ruleNote: 'Sin sukun mengalir halus (Hams), diakhiri Dhammatain (dun)', speechText: 'Masjidun' },
      { id: '4-8', arabic: 'اَحَدٌ', latin: 'A - ha - dun', ruleNote: 'Latihan ketepatan Tanwin di akhir kata', speechText: 'Ahadun' },
    ],
    practiceRows: [
      { arabic: 'كِتَابًا   •   حِسَابٍ   •   عَلِيْمٌ', latin: 'Ki-taa-ban  •  Hi-saa-bin  •  ‘A-lii-mun', note: 'Perhatikan bunyi Tanwin (ban, bin, mun) di akhir kata.' },
      { arabic: 'يَقْطَعُ   •   يَبْخَلُ   •   مَطْلَعِ', latin: 'Yaq‘-tha-‘u  •  Yab‘-kha-lu  •  Math‘-la-‘i', note: 'Pantulkan dengan jernih huruf قْ ، بْ ، طْ.' },
      { arabic: 'اَنْعَمْتَ   •   يَسْمَعُ   •   مَكْتُوْبٌ', latin: 'An-‘am-ta  •  Yas-ma-‘u  •  Mak-tuu-bun', note: 'Jaga huruf نْ ، مْ ، سْ ، كْ agar TIDAK ikut memantul.' },
    ],
    quiz: {
      question: 'Huruf-huruf Qalqalah yang wajib dipantulkan ketika berharakat sukun (mati) berjumlah 5 huruf, yaitu...',
      options: [
        'ب ج د ط ق (Baju Di Toko)',
        'ا ي و هـ ن',
        'س ش ص ض ز',
        'ف ك ل م و',
      ],
      correctIndex: 0,
      explanation: 'Lima huruf Qalqalah adalah Ba (ب), Jim (ج), Dal (د), Tha (ط), dan Qaf (ق).',
    },
  },
  {
    jilid: 5,
    title: 'Iqro Jilid 5',
    subtitle: 'Tasydid (ـّ), Alif Lam (Qamariyah & Syamsiyah), Lafadz Allah & Waqaf',
    focusSummary:
      'Mempelajari bacaan bertasydid (ditekan ganda), Ghunnah (dengung 2 harakat pada نّ dan مّ), perbedaan Alif Lam Qamariyah vs Syamsiyah, serta cara mewaqafkan (menghentikan) bacaan di akhir ayat.',
    keyRules: [
      'Huruf bertasydid (ـّ) dibaca dengan menekan suara huruf tersebut (ganda). Khusus نّ (Inna) dan مّ (Amma) wajib ditahan dengung (Ghunnah) 2 harakat.',
      'Al-Qamariyah (الْ): huruf Lam Sukun dibaca jelas (contoh: اَلْحَمْدُ). Asy-Syamsiyah (الّ): huruf Lam lebur langsung ke huruf bertasydid setelahnya (contoh: الرَّحْمٰنِ).',
      'Saat Waqaf (berhenti di akhir ayat), harakat terakhir dimatikan (sukun), kecuali Fathatain (ـًا) yang berubah menjadi panjang 2 harakat (Mad ‘Iwadh).',
    ],
    cards: [
      { id: '5-1', arabic: 'اِنَّ  عَمَّ', latin: 'In-na  •  ‘Am-ma', ruleNote: 'Ghunnah Musyaddadah: Nun & Mim tasydid berdengung 2 harakat', speechText: 'Inna Amma' },
      { id: '5-2', arabic: 'اَلْحَمْدُ', latin: 'Al - ham - du', ruleNote: 'Alif Lam Qamariyah: Lam sukun terbaca jelas', speechText: 'Alhamdu' },
      { id: '5-3', arabic: 'الرَّحْمٰنِ', latin: 'Ar - rah - maa - ni', ruleNote: 'Alif Lam Syamsiyah: Lam melebur ke huruf Ra tasydid', speechText: 'Arrahmaani' },
      { id: '5-4', arabic: 'وَالشَّمْسِ', latin: 'Wasy - syam - si', ruleNote: 'Alif Lam Syamsiyah: langsung masuk ke huruf Syin tasydid', speechText: 'Wasysyamsi' },
      { id: '5-5', arabic: 'مِنَ اللّٰهِ', latin: 'Mi - nal - laa - hi', ruleNote: 'Lafadz Allah didahului Fathah dibaca tebal (Tafkhim: Allaah)', speechText: 'Minallaahi' },
      { id: '5-6', arabic: 'بِسْمِ اللّٰهِ', latin: 'Bis - mil - laa - hi', ruleNote: 'Lafadz Allah didahului Kasrah dibaca tipis (Tarqiq: Billaah)', speechText: 'Bismillaahi' },
      { id: '5-7', arabic: 'حَكِيْمًا ۝', latin: 'Waqaf: Ha-kii-maa', ruleNote: 'Mad ‘Iwadh: Fathatain di akhir ayat berhenti menjadi panjang 2 harakat', speechText: 'Hakiimaa' },
      { id: '5-8', arabic: 'اَحَدٌ ۝', latin: 'Waqaf: A-had‘', ruleNote: 'Qalqalah Kubra: Huruf Dal di akhir ayat dimatikan & dipantulkan kuat', speechText: 'Ahad' },
    ],
    practiceRows: [
      { arabic: 'اِنَّ اللّٰهَ غَفُوْرٌ رَّحِيْمٌ ۝', latin: 'In-nal-laa-ha gha-fuu-rur ra-hiim', note: 'Dengungkan نّ, tebalkan اللّٰهَ, dan sukun-kan huruf Mim saat berhenti di akhir ayat.' },
      { arabic: 'اَلْقَمَرُ   •   النَّجْمُ   •   اَلْعَلِيْمُ', latin: 'Al-qa-ma-ru  •  An-naj-mu  •  Al-‘a-lii-mu', note: 'Bandingkan kejelasan Al-Qamariyah dengan peleburan An-Najmu (Syamsiyah).' },
      { arabic: 'قُلْ هُوَ اللّٰهُ اَحَدٌ ۝', latin: 'Qul hu-wal-laa-hu a-had‘', note: 'Huruf Dal di ujung ayat menjadi Qalqalah Kubra saat diwaqafkan.' },
    ],
    quiz: {
      question: 'Bagaimana cara membaca akhir kata "عَلِيْمًا" apabila kita berhenti (Waqaf) di ujung ayat?',
      options: [
        'Dibaca "‘A-lii-maa" (panjang 2 harakat — Mad ‘Iwadh)',
        'Dibaca "‘A-lii-man" tetap dengan bunyi N',
        'Dibaca "‘A-liim" dengan mematikan huruf Mim',
        'Dibaca "‘A-lii-mun"',
      ],
      correctIndex: 0,
      explanation: 'Harakat Fathatain (ـًا) ketika diwaqafkan (berhenti) berubah menjadi bacaan panjang Fathah 2 harakat (Mad ‘Iwadh).',
    },
  },
  {
    jilid: 6,
    title: 'Iqro Jilid 6',
    subtitle: 'Tajwid Nun Sukun/Tanwin Lengkap, Tanda Waqaf & Tahsin Surat Pendek',
    focusSummary:
      'Tahap pematangan sebelum membaca Mushaf Al-Qur’an utuh: menguasai hukum Nun Mati/Tanwin (Idgham, Iqlab, Ikhfa), memahami rambu-rambu tanda Waqaf Al-Qur’an, dan latihan kelancaran ayat.',
    keyRules: [
      'Idgham Bighunnah (ي ن م و): melebur disertai dengung 2 harakat. Idgham Bilaghunnah (ل ر): melebur tanpa dengung.',
      'Iqlab (ب): suara Nun Sukun/Tanwin berubah menjadi Mim (م) disertai dengung saat bertemu huruf Ba.',
      'Ikhfa Haqiqi (15 huruf: ت ث ج د ذ ز س ش ص ض ط ظ ف ق ك): suara Nun Sukun/Tanwin dibaca samar-samar disertai dengung 2 harakat menuju huruf berikutnya.',
    ],
    cards: [
      { id: '6-1', arabic: 'مَنْ يَّقُوْلُ', latin: 'May - ya - quu - lu', ruleNote: 'Idgham Bighunnah: Nun Sukun bertemu Ya melebur dengan dengung', speechText: 'Mayyaquulu' },
      { id: '6-2', arabic: 'مِنْ رَّبِّهِمْ', latin: 'Mir - rab - bi - him', ruleNote: 'Idgham Bilaghunnah: Nun Sukun bertemu Ra melebur jelas tanpa dengung', speechText: 'Mirrabbihim' },
      { id: '6-3', arabic: 'مِنْۢ بَعْدِ', latin: 'Mim - ba‘ - di', ruleNote: 'Iqlab: Nun Sukun bertemu Ba berubah menjadi bunyi Mim berdengung', speechText: 'Mimba di' },
      { id: '6-4', arabic: 'مِنْ شَرِّ', latin: 'Ming - syar - ri', ruleNote: 'Ikhfa Haqiqi: Nun Sukun bertemu Syin dibaca samar berdengung', speechText: 'Mingsyarri' },
      { id: '6-5', arabic: 'اَنْفُسِهِمْ', latin: 'Ang - fu - si - him', ruleNote: 'Ikhfa Haqiqi: Nun Sukun bertemu Fa dibaca samar menuju Fa', speechText: 'Angfusihim' },
      { id: '6-6', arabic: 'مـ  /  لا', latin: 'Waqaf Lazim (مـ) & Laa Waqfa (لا)', ruleNote: 'مـ = Wajib berhenti • لا = Jangan berhenti di tengah kalimat', speechText: 'Tanda Waqaf Lazim dan Laa Waqfa' },
      { id: '6-7', arabic: 'قلى  /  صلى', latin: 'Al-Waqfu Aula (قلى) & Al-Washlu Aula (صلى)', ruleNote: 'قلى = Lebih utama berhenti • صلى = Lebih utama diteruskan', speechText: 'Al Waqfu Aula dan Al Washlu Aula' },
      { id: '6-8', arabic: 'ج  /  ∴ ... ∴', latin: 'Waqaf Jaiz (ج) & Mu’anaqah (∴)', ruleNote: 'ج = Boleh berhenti/lanjut • ∴ = Berhenti di salah satu titik tiga saja', speechText: 'Waqaf Jaiz dan Muanaqah' },
    ],
    practiceRows: [
      { arabic: 'بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيْمِ ۝', latin: 'Bis-mil-laa-hir-rah-maa-nir-ra-hiim', note: 'Basmalah: perhatikan Tarqiq pada اللّٰهِ dan Syamsiyah pada الرَّحْمٰنِ.' },
      { arabic: 'وَمَنْ يَّعْمَلْ مِثْقَالَ ذَرَّةٍ خَيْرًا يَّرَهُ ۝', latin: 'Wa may-ya‘-mal mits-qaa-la dzar-ra-tin khai-ray ya-rah', note: 'Gabungan Idgham Bighunnah (مَنْ يَّـ dan خَيْرًا يَّـ) serta Izhar Halqi (ذَرَّةٍ خَـ).' },
      { arabic: 'الَّذِيْٓ اَطْعَمَهُمْ مِّنْ جُوْعٍ ۙ وَّاٰمَنَهُمْ مِّنْ خَوْفٍ ۝', latin: 'Al-la-dzii ath‘-‘a-ma-hum min juu-‘iw wa aa-ma-na-hum min khauf', note: 'Latihan lengkap Mad Jaiz, Qalqalah, Idgham Mimi, Ikhfa, dan Izhar.' },
    ],
    quiz: {
      question: 'Apabila Nun Sukun (نْ) atau Tanwin bertemu dengan huruf Ba (ب) seperti pada "مِنْۢ بَعْدِ", hukum bacaannya disebut...',
      options: [
        'Iqlab (berubah menjadi bunyi Mim disertai dengung)',
        'Izhar Halqi (dibaca jelas tanpa dengung)',
        'Idgham Bilaghunnah (melebur tanpa dengung)',
        'Qalqalah Kubra',
      ],
      correctIndex: 0,
      explanation: 'Iqlab terjadi ketika Nun Sukun atau Tanwin bertemu huruf Ba (ب), sehingga suaranya dibalik menjadi Mim (م) dengan dengung.',
    },
  },
];

export interface SholatStepItem {
  stepNumber: number;
  title: string;
  postureBadge: string;
  postureGuide: string;
  arabic: string;
  latin: string;
  translation: string;
  speechText: string;
  importantNote: string;
}

export const SHOLAT_STEPS: SholatStepItem[] = [
  {
    stepNumber: 1,
    title: 'Berdiri Tegak Menghadap Kiblat & Niat Sholat',
    postureBadge: 'Rukun 1 & 2 • Qiyam & Niat',
    postureGuide:
      'Berdiri tegak menghadap arah Kiblat (bagi yang mampu), pandangan mata tertuju dengan khusyuk ke tempat sujud, lalu menghadirkan niat sholat di dalam hati bersamaan saat memulai Takbiratul Ihram.',
    arabic: 'أُصَلِّيْ فَرْضَ الظُّهْرِ أَرْبَعَ رَكَعَاتٍ مُسْتَقْبِلَ الْقِبْلَةِ أَدَاءً لِلّٰهِ تَعَالَى',
    latin: 'Ushallii fardhadh-dhuhri arba‘a raka‘aatin mustaqbilal qiblati adaa’an lillaahi ta‘aalaa.',
    translation:
      '“Aku berniat melaksanakan sholat fardhu Dzuhur empat rakaat menghadap kiblat karena Allah Ta‘ala.” (Lafadz niat disesuaikan dengan waktu sholat).',
    speechText: 'Ushallii fardhadh dhuhri arba a raka aatin mustaqbilal qiblati adaa an lillaahi ta aalaa',
    importantNote: 'Tempat niat yang wajib adalah di dalam hati, sedangkan melafalkannya sebelum takbir membantu memantapkan kekhusyukan hati.',
  },
  {
    stepNumber: 2,
    title: 'Takbiratul Ihram & Bersedekap',
    postureBadge: 'Rukun 3 • Takbiratul Ihram',
    postureGuide:
      'Mengangkat kedua telapak tangan sejajar bahu atau daun telinga sambil mengucapkan "Allaahu Akbar", kemudian meletakkan telapak tangan kanan di atas punggung telapak/pergelangan tangan kiri di dada (bersedekap).',
    arabic: 'اللّٰهُ أَكْبَرُ',
    latin: 'Allaahu Akbar.',
    translation: '“Allah Maha Besar.”',
    speechText: 'Allaahu Akbar',
    importantNote: 'Takbiratul Ihram adalah gerbang pembuka sholat; sejak takbir ini, seluruh ucapan dan gerakan di luar sholat menjadi terlarang.',
  },
  {
    stepNumber: 3,
    title: 'Membaca Doa Iftitah (Sunnah Hai’at)',
    postureBadge: 'Sunnah Setelah Takbir',
    postureGuide:
      'Tetap berdiri bersedekap dengan tenang pada rakaat pertama, membaca doa Iftitah secara lirih (sirr) sebelum membaca Surat Al-Fatihah.',
    arabic:
      'اللّٰهُ أَكْبَرُ كَبِيْرًا وَالْحَمْدُ لِلّٰهِ كَثِيْرًا وَسُبْحَانَ اللّٰهِ بُكْرَةً وَأَصِيْلًا ، إِنِّيْ وَجَّهْتُ وَجْهِيَ لِلَّذِيْ فَطَرَ السَّمَاوَاتِ وَالْأَرْضَ حَنِيْفًا مُسْلِمًا وَمَا أَنَا مِنَ الْمُشْرِكِيْنَ ، إِنَّ صَلَاتِيْ وَنُسُكِيْ وَمَحْيَايَ وَمَمَاتِيْ لِلّٰهِ رَبِّ الْعَالَمِيْنَ',
    latin:
      'Allaahu akbaru kabiiraa walhamdulillaahi katsiiraa wa subhaanallaahi bukrataw wa ashiilaa. Innii wajjahtu wajhiya lilladzii fatharas-samaawaati wal-ardha haniifam muslimaw wa maa ana minal musyrikiin. Inna shalaatii wa nusukii wa mahyaaya wa mamaatii lillaahi rabbil ‘aalamiin.',
    translation:
      '“Allah Maha Besar dengan sebesar-besarnya, segala puji bagi Allah dengan pujian yang banyak, dan Maha Suci Allah pada waktu pagi dan petang. Sesungguhnya aku hadapkan wajahku kepada Dzat yang menciptakan langit dan bumi dengan lurus dan berserah diri, dan bukanlah aku termasuk orang-orang musyrik. Sesungguhnya sholatku, ibadahku, hidupku, dan matiku hanyalah untuk Allah Tuhan semesta alam.”',
    speechText: 'Allaahu akbaru kabiiraa walhamdulillaahi katsiiraa wa subhaanallaahi bukrataw wa ashiilaa',
    importantNote: 'Doa Iftitah dibaca hanya pada rakaat pertama setelah Takbiratul Ihram.',
  },
  {
    stepNumber: 4,
    title: 'Membaca Surat Al-Fatihah & Surat Pendek',
    postureBadge: 'Rukun 4 • Wajib di Setiap Rakaat',
    postureGuide:
      'Membaca Surat Al-Fatihah dengan tartil mulai dari Basmalah hingga "Waladh-dhaalliin" (diakhiri Aamiin) pada setiap rakaat. Pada rakaat ke-1 dan ke-2 dilanjutkan membaca surat atau ayat Al-Qur’an.',
    arabic:
      'بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيْمِ ۝ الْحَمْدُ لِلّٰهِ رَبِّ الْعَالَمِيْنَ ۝ الرَّحْمٰنِ الرَّحِيْمِ ۝ مَالِكِ يَوْمِ الدِّيْنِ ۝ إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِيْنُ ۝ اهْدِنَا الصِّرَاطَ الْمُسْتَقِيْمَ ۝ صِرَاطَ الَّذِيْنَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوْبِ عَلَيْهِمْ وَلَا الضَّالِّيْنَ ۝ آمِيْنْ',
    latin:
      'Bismillaahir-rahmaanir-rahiim. Alhamdulillaahi rabbil ‘aalamiin. Ar-rahmaanir-rahiim. Maaliki yaumid-diin. Iyyaaka na‘budu wa iyyaaka nasta‘iin. Ihdinash-shiraathal mustaqiim. Shiraathal-ladziina an‘amta ‘alaihim ghairil maghdhuubi ‘alaihim waladh-dhaalliin. Aamiin.',
    translation:
      '“Dengan nama Allah Yang Maha Pengasih, Maha Penyayang. Segala puji bagi Allah, Tuhan seluruh alam. Yang Maha Pengasih, Maha Penyayang. Pemilik hari pembalasan. Hanya kepada Engkaulah kami menyembah dan hanya kepada Engkaulah kami mohon pertolongan. Tunjukilah kami jalan yang lurus, (yaitu) jalan orang-orang yang telah Engkau beri nikmat kepadanya; bukan (jalan) mereka yang dimurkai, dan bukan (pula jalan) mereka yang sesat. Aamiin.”',
    speechText: 'Bismillaahir rahmaanir rahiim. Alhamdulillaahi rabbil aalamiin.',
    importantNote: 'Tidak sah sholat seseorang tanpa membaca Surat Al-Fatihah; perhatikan tajwid dan tasydidnya.',
  },
  {
    stepNumber: 5,
    title: 'Ruku’ dengan Thuma’ninah',
    postureBadge: 'Rukun 5 • Ruku’ & Thuma’ninah',
    postureGuide:
      'Bertakbir "Allaahu Akbar" lalu membungkukkan badan hingga punggung dan kepala lurus rata (90 derajat), kedua telapak tangan memegang lutut dengan jari-jari direnggangkan, dan berhenti tenang sejenak (Thuma’ninah).',
    arabic: 'سُبْحَانَ رَبِّيَ الْعَظِيْمِ وَبِحَمْدِهِ (٣×)',
    latin: 'Subhaana rabbiyal ‘azhiimi wa bihamdih. (Dibaca 3 kali)',
    translation: '“Maha Suci Tuhanku Yang Maha Agung dan dengan memuji-Nya.” (3x)',
    speechText: 'Subhaana rabbiyal azhiimi wa bihamdih',
    importantNote: 'Pastikan punggung rata dan tenang sejenak (Thuma’ninah) sebelum bangkit ke I’tidal.',
  },
  {
    stepNumber: 6,
    title: 'I’tidal (Bangkit Tegak dari Ruku’)',
    postureBadge: 'Rukun 6 • I’tidal & Thuma’ninah',
    postureGuide:
      'Bangkit kembali berdiri tegak sempurna sambil mengangkat kedua tangan dan mengucapkan "Sami‘allaahu liman hamidah", lalu saat sudah berdiri tegak melanjutkan bacaan "Rabbanaa lakal hamdu...".',
    arabic:
      'سَمِعَ اللّٰهُ لِمَنْ حَمِدَهُ — رَبَّنَا لَكَ الْحَمْدُ مِلْءَ السَّمَاوَاتِ وَمِلْءَ الْأَرْضِ وَمِلْءَ مَا شِئْتَ مِنْ شَيْءٍ بَعْدُ',
    latin:
      'Sami‘allaahu liman hamidah — Rabbanaa lakal hamdu mil’as-samaawaati wa mil’al-ardhi wa mil’a maa syi’ta min syai’in ba‘du.',
    translation:
      '“Allah Maha Mendengar orang yang memuji-Nya. Wahai Tuhan kami, bagi-Mu segala puji sepenuh langit dan sepenuh bumi, serta sepenuh apa saja yang Engkau kehendaki setelah itu.”',
    speechText: 'Sami allaahu liman hamidah. Rabbanaa lakal hamdu',
    importantNote: 'Pada sholat Subuh rakaat ke-2, saat I’tidal dianjurkan membaca Doa Qunut.',
  },
  {
    stepNumber: 7,
    title: 'Sujud Pertama dengan 7 Anggota Sujud',
    postureBadge: 'Rukun 7 • Sujud & Thuma’ninah',
    postureGuide:
      'Bertakbir "Allaahu Akbar" lalu turun bersujud dengan menempelkan 7 anggota tubuh ke lantai/sajadah: (1) Dahi & hidung terbuka, (2–3) Kedua telapak tangan sejajar bahu, (4–5) Kedua lutut, serta (6–7) Ujung jari-jari kedua kaki ditegakkan menghadap kiblat.',
    arabic: 'سُبْحَانَ رَبِّيَ الْأَعْلٰى وَبِحَمْدِهِ (٣×)',
    latin: 'Subhaana rabbiyal a‘laa wa bihamdih. (Dibaca 3 kali)',
    translation: '“Maha Suci Tuhanku Yang Maha Tinggi dan dengan memuji-Nya.” (3x)',
    speechText: 'Subhaana rabbiyal a laa wa bihamdih',
    importantNote: 'Sujud adalah saat seorang hamba paling dekat dengan Allah SWT — lakukan dengan tenang dan tidak tergesa-gesa.',
  },
  {
    stepNumber: 8,
    title: 'Duduk di Antara Dua Sujud (Duduk Iftirasy)',
    postureBadge: 'Rukun 8 • Duduk & Doa',
    postureGuide:
      'Bangkit dari sujud pertama sambil bertakbir "Allaahu Akbar", lalu duduk Iftirasy (menduduki telapak kaki kiri dan menegakkan telapak kaki kanan dengan jari menghadap kiblat). Kedua tangan diletakkan di atas paha dekat lutut.',
    arabic:
      'رَبِّ اغْفِرْ لِيْ وَارْحَمْنِيْ وَاجْبُرْنِيْ وَارْفَعْنِيْ وَارْزُقْنِيْ وَاهْدِنِيْ وَعَافِنِيْ وَاعْفُ عَنِّيْ',
    latin:
      'Rabbighfirlii warhamnii wajburnii warfa‘nii warzuqnii wahdinii wa ‘aafinii wa‘fu ‘annii.',
    translation:
      '“Ya Tuhanku, ampunilah aku, sayangilah aku, cukupkanlah kekuranganku, angkatlah derajatku, berilah aku rezeki, berilah aku petunjuk, berilah aku kesehatan, dan maafkanlah kesalahanku.”',
    speechText: 'Rabbighfirlii warhamnii wajburnii warfa nii warzuqnii wahdinii wa aafinii wa fu annii',
    importantNote: 'Delapan permohonan mulia dunia-akhirat terkumpul lengkap di dalam doa duduk di antara dua sujud ini.',
  },
  {
    stepNumber: 9,
    title: 'Sujud Kedua dengan Thuma’ninah',
    postureBadge: 'Rukun 7 • Sujud Kedua',
    postureGuide:
      'Bertakbir "Allaahu Akbar" lalu kembali bersujud kedua sebagaimana sujud pertama dengan tenang (Thuma’ninah), sebelum bangkit ke rakaat berikutnya atau duduk Tasyahud.',
    arabic: 'سُبْحَانَ رَبِّيَ الْأَعْلٰى وَبِحَمْدِهِ (٣×)',
    latin: 'Subhaana rabbiyal a‘laa wa bihamdih. (Dibaca 3 kali)',
    translation: '“Maha Suci Tuhanku Yang Maha Tinggi dan dengan memuji-Nya.” (3x)',
    speechText: 'Subhaana rabbiyal a laa wa bihamdih',
    importantNote: 'Setelah sujud kedua pada rakaat ke-1 atau ke-3, bangkit berdiri untuk rakaat berikutnya sambil bertakbir.',
  },
  {
    stepNumber: 10,
    title: 'Duduk Tasyahud / Tahiyat Awal (Rakaat ke-2)',
    postureBadge: 'Sunnah Ab’adh • Rakaat ke-2',
    postureGuide:
      'Pada rakaat ke-2 (untuk sholat Dzuhur, Ashar, Maghrib, Isya), duduk Iftirasy, tangan kiri di atas paha kiri, tangan kanan mengepal di paha kanan dengan jari telunjuk menunjuk saat mengucapkan "Illallaah".',
    arabic:
      'التَّحِيَّاتُ الْمُبَارَكَاتُ الصَّلَوَاتُ الطَّيِّبَاتُ لِلّٰهِ ، السَّلَامُ عَلَيْكَ أَيُّهَا النَّبِيُّ وَرَحْمَةُ اللّٰهِ وَبَرَكَاتُهُ ، السَّلَامُ عَلَيْنَا وَعَلَى عِبَادِ اللّٰهِ الصَّالِحِيْنَ ، أَشْهَدُ أَنْ لَا إِلٰهَ إِلَّا اللّٰهُ وَأَشْهَدُ أَنَّ مُحَمَّدًا رَسُوْلُ اللّٰهِ ، اللّٰهُمَّ صَلِّ عَلَى سَيِّدِنَا مُحَمَّدٍ',
    latin:
      'At-tahiyyaatul mubaarakaatush-shalawaatuth-thayyibaatu lillaah. As-salaamu ‘alaika ayyuhan-nabiyyu wa rahmatullaahi wa barakaatuh. As-salaamu ‘alainaa wa ‘alaa ‘ibaadillaahish-shaalihiin. Asyhadu an laa ilaaha illallaah wa asyhadu anna Muhammadar-rasuulullaah. Allaahumma shalli ‘alaa sayyidinaa Muhammad.',
    translation:
      '“Segala kehormatan, keberkahan, kebahagiaan, dan kebaikan adalah milik Allah. Semoga keselamatan, rahmat Allah, dan berkah-Nya tercurah kepadamu wahai Nabi. Semoga keselamatan tercurah kepada kami dan hamba-hamba Allah yang shalih. Aku bersaksi bahwa tiada Tuhan selain Allah, dan aku bersaksi bahwa Nabi Muhammad adalah utusan Allah. Ya Allah, limpahkanlah rahmat kepada junjungan kami Nabi Muhammad.”',
    speechText: 'At tahiyyaatul mubaarakaatush shalawaatuth thayyibaatu lillaah',
    importantNote: 'Setelah selesai membaca Tasyahud Awal, bangkit berdiri ke rakaat ke-3 sambil mengangkat tangan dan bertakbir.',
  },
  {
    stepNumber: 11,
    title: 'Duduk Tasyahud / Tahiyat Akhir (Tawarruk) & Shalawat Ibrahimiyah',
    postureBadge: 'Rukun 9, 10 & 11 • Rakaat Terakhir',
    postureGuide:
      'Pada rakaat terakhir, duduk Tawarruk (telapak kaki kiri dimasukkan ke bawah betis kaki kanan yang ditegakkan, dan pangkal paha kiri menyentuh lantai). Membaca Tasyahud lengkap dilanjutkan Shalawat Ibrahimiyah dan doa perlindungan.',
    arabic:
      'اللّٰهُمَّ صَلِّ عَلَى سَيِّدِنَا مُحَمَّدٍ وَعَلَى آلِ سَيِّدِنَا مُحَمَّدٍ ، كَمَا صَلَّيْتَ عَلَى سَيِّدِنَا إِبْرَاهِيْمَ وَعَلَى آلِ سَيِّدِنَا إِبْرَاهِيْمَ ، وَبَارِكْ عَلَى سَيِّدِنَا مُحَمَّدٍ وَعَلَى آلِ سَيِّدِنَا مُحَمَّدٍ ، كَمَا بَارَكْتَ عَلَى سَيِّدِنَا إِبْرَاهِيْمَ وَعَلَى آلِ سَيِّدِنَا إِبْرَاهِيْمَ ، فِيْ الْعَالَمِيْنَ إِنَّكَ حَمِيْدٌ مَجِيْدٌ',
    latin:
      'Allaahumma shalli ‘alaa sayyidinaa Muhammad wa ‘alaa aali sayyidinaa Muhammad, kamaa shallaita ‘alaa sayyidinaa Ibraahiim wa ‘alaa aali sayyidinaa Ibraahiim, wa baarik ‘alaa sayyidinaa Muhammad wa ‘alaa aali sayyidinaa Muhammad, kamaa baarakta ‘alaa sayyidinaa Ibraahiim wa ‘alaa aali sayyidinaa Ibraahiim, fil ‘aalamiina innaka hamiidum majiid.',
    translation:
      '“Ya Allah, limpahkanlah rahmat kepada Nabi Muhammad dan keluarga Nabi Muhammad, sebagaimana telah Engkau limpahkan rahmat kepada Nabi Ibrahim dan keluarga Nabi Ibrahim. Dan limpahkanlah keberkahan kepada Nabi Muhammad dan keluarga Nabi Muhammad, sebagaimana telah Engkau limpahkan keberkahan kepada Nabi Ibrahim dan keluarga Nabi Ibrahim. Di seluruh alam semesta, sesungguhnya Engkau Maha Terpuji lagi Maha Mulia.”',
    speechText: 'Allaahumma shalli alaa sayyidinaa Muhammad wa alaa aali sayyidinaa Muhammad',
    importantNote: 'Membaca Tasyahud Akhir dan Shalawat kepada Nabi SAW pada duduk terakhir merupakan Rukun Sholat.',
  },
  {
    stepNumber: 12,
    title: 'Mengucapkan Salam ke Kanan dan ke Kiri',
    postureBadge: 'Rukun 12 & 13 • Salam & Tertib',
    postureGuide:
      'Menolehkan kepala ke arah kanan hingga pipi kanan terlihat dari belakang sambil mengucapkan salam pertama (Rukun), kemudian menolehkan kepala ke arah kiri sambil mengucapkan salam kedua (Sunnah).',
    arabic: 'السَّلَامُ عَلَيْكُمْ وَرَحْمَةُ اللّٰهِ',
    latin: 'As-salaamu ‘alaikum wa rahmatullaah.',
    translation: '“Semoga keselamatan dan rahmat Allah senantiasa tercurah kepada kalian.”',
    speechText: 'Assalaamu alaikum wa rahmatullaah',
    importantNote: 'Dengan diucapkannya salam, maka tuntaslah seluruh rukun sholat secara tertib.',
  },
  {
    stepNumber: 13,
    title: 'Dzikir & Doa Setelah Sholat Fardhu',
    postureBadge: 'Amalan Sunnah Ba’da Sholat',
    postureGuide:
      'Duduk tenang setelah salam untuk beristighfar 3 kali, membaca dzikir keselamatan, dilanjutkan Tasbih (33x), Tahmid (33x), Takbir (33x), Ayat Kursi, dan berdoa kepada Allah SWT.',
    arabic:
      'أَسْتَغْفِرُ اللّٰهَ الْعَظِيْمَ (٣×) • اللّٰهُمَّ أَنْتَ السَّلَامُ وَمِنْكَ السَّلَامُ تَبَارَكْتَ يَا ذَا الْجَلَالِ وَالْإِكْرَامِ • سُبْحَانَ اللّٰهِ (٣٣×) • الْحَمْدُ لِلّٰهِ (٣٣×) • اللّٰهُ أَكْبَرُ (٣٣×)',
    latin:
      'Astaghfirullaahal ‘azhiim (3x) • Allaahumma antas-salaamu wa minkas-salaamu tabaarakta yaa dzal-jalaali wal-ikraam • Subhaanallaah (33x) • Alhamdulillaah (33x) • Allaahu Akbar (33x).',
    translation:
      '“Aku memohon ampun kepada Allah Yang Maha Agung (3x). Ya Allah, Engkaulah sumber keselamatan dan dari-Mu keselamatan, Maha Berkah Engkau wahai Dzat Pemilik Keagungan dan Kemuliaan. Maha Suci Allah (33x), Segala Puji bagi Allah (33x), Allah Maha Besar (33x).”',
    speechText: 'Astaghfirullaahal azhiim. Subhaanallaah. Alhamdulillaah. Allaahu Akbar.',
    importantNote: 'Jangan langsung terburu-buru beranjak setelah salam; luangkan waktu berdzikir dan mendoakan kedua orang tua serta guru.',
  },
];

export const FARDHU_NIAT_LIST = [
  {
    id: 'subuh',
    name: 'Sholat Subuh',
    rakaat: '2 Rakaat',
    timeWindow: 'Terbit Fajar Shadiq s.d. Sebelum Terbit Matahari',
    arabic: 'أُصَلِّيْ فَرْضَ الصُّبْحِ رَكْعَتَيْنِ مُسْتَقْبِلَ الْقِبْلَةِ أَدَاءً لِلّٰهِ تَعَالَى',
    latin: 'Ushallii fardhash-shubhi rak‘ataini mustaqbilal qiblati adaa’an lillaahi ta‘aalaa.',
    meaning: '“Aku berniat melaksanakan sholat fardhu Subuh dua rakaat menghadap kiblat karena Allah Ta‘ala.”',
  },
  {
    id: 'dzuhur',
    name: 'Sholat Dzuhur',
    rakaat: '4 Rakaat',
    timeWindow: 'Matahari Tergelincir ke Barat s.d. Bayangan Benda Sama Panjang',
    arabic: 'أُصَلِّيْ فَرْضَ الظُّهْرِ أَرْبَعَ رَكَعَاتٍ مُسْتَقْبِلَ الْقِبْلَةِ أَدَاءً لِلّٰهِ تَعَالَى',
    latin: 'Ushallii fardhadh-dhuhri arba‘a raka‘aatin mustaqbilal qiblati adaa’an lillaahi ta‘aalaa.',
    meaning: '“Aku berniat melaksanakan sholat fardhu Dzuhur empat rakaat menghadap kiblat karena Allah Ta‘ala.”',
  },
  {
    id: 'ashar',
    name: 'Sholat Ashar',
    rakaat: '4 Rakaat',
    timeWindow: 'Bayangan Lebih Panjang dari Benda s.d. Sebelum Matahari Terbenam',
    arabic: 'أُصَلِّيْ فَرْضَ الْعَصْرِ أَرْبَعَ رَكَعَاتٍ مُسْتَقْبِلَ الْقِبْلَةِ أَدَاءً لِلّٰهِ تَعَالَى',
    latin: 'Ushallii fardhal-‘ashri arba‘a raka‘aatin mustaqbilal qiblati adaa’an lillaahi ta‘aalaa.',
    meaning: '“Aku berniat melaksanakan sholat fardhu Ashar empat rakaat menghadap kiblat karena Allah Ta‘ala.”',
  },
  {
    id: 'maghrib',
    name: 'Sholat Maghrib',
    rakaat: '3 Rakaat',
    timeWindow: 'Setelah Matahari Terbenam s.d. Hilangnya Mega Merah',
    arabic: 'أُصَلِّيْ فَرْضَ الْمَغْرِبِ ثَلَاثَ رَكَعَاتٍ مُسْتَقْبِلَ الْقِبْلَةِ أَدَاءً لِلّٰهِ تَعَالَى',
    latin: 'Ushallii fardhal-maghribi tsalaatsa raka‘aatin mustaqbilal qiblati adaa’an lillaahi ta‘aalaa.',
    meaning: '“Aku berniat melaksanakan sholat fardhu Maghrib tiga rakaat menghadap kiblat karena Allah Ta‘ala.”',
  },
  {
    id: 'isya',
    name: 'Sholat Isya',
    rakaat: '4 Rakaat',
    timeWindow: 'Hilangnya Mega Merah s.d. Sebelum Terbit Fajar Shadiq',
    arabic: 'أُصَلِّيْ فَرْضَ الْعِشَاءِ أَرْبَعَ رَكَعَاتٍ مُسْتَقْبِلَ الْقِبْلَةِ أَدَاءً لِلّٰهِ تَعَالَى',
    latin: 'Ushallii fardhal-‘isyaa’i arba‘a raka‘aatin mustaqbilal qiblati adaa’an lillaahi ta‘aalaa.',
    meaning: '“Aku berniat melaksanakan sholat fardhu Isya empat rakaat menghadap kiblat karena Allah Ta‘ala.”',
  },
];

export const WUDHU_GUIDE_STEPS = [
  {
    order: 1,
    title: 'Membaca Basmalah & Mencuci Kedua Telapak Tangan',
    desc: 'Membaca "Bismillaahirrahmaanirrahiim" sambil mencuci kedua telapak tangan hingga pergelangan tangan sebanyak 3 kali dan menyela-nyela jari.',
  },
  {
    order: 2,
    title: 'Berkumur-kumur & Membersihkan Hidung (Istinsyaq)',
    desc: 'Berkumur-kumur 3 kali untuk membersihkan mulut, dilanjutkan menghirup air ke hidung lalu mengeluarkannya (Istinsyaq & Istintsar) 3 kali.',
  },
  {
    order: 3,
    title: 'Membaca Niat Wudhu & Membasuh Seluruh Wajah (Rukun)',
    desc: 'Berniat wudhu ("Nawaitul wudhuu’a liraf‘il hadatsil ashghari fardhal lillaahi ta‘aalaa") bersamaan saat membasuh seluruh batas wajah secara merata 3 kali.',
  },
  {
    order: 4,
    title: 'Membasuh Kedua Tangan sampai Siku (Rukun)',
    desc: 'Membasuh tangan kanan dari ujung jari hingga melewati siku sebanyak 3 kali, kemudian tangan kiri dari ujung jari hingga melewati siku 3 kali.',
  },
  {
    order: 5,
    title: 'Mengusap Sebagian / Seluruh Kepala (Rukun)',
    desc: 'Membasahi telapak tangan lalu mengusapkan air ke sebagian atau seluruh rambut kepala sebanyak 3 kali.',
  },
  {
    order: 6,
    title: 'Mengusap Kedua Daun Telinga (Sunnah)',
    desc: 'Mengusap bagian dalam daun telinga dengan jari telunjuk dan bagian luar dengan ibu jari secara bersamaan 3 kali.',
  },
  {
    order: 7,
    title: 'Membasuh Kedua Kaki sampai Mata Kaki (Rukun)',
    desc: 'Membasuh kaki kanan hingga melewati kedua mata kaki sambil menyela-nyela jari kaki sebanyak 3 kali, lalu dilanjutkan kaki kiri 3 kali.',
  },
  {
    order: 8,
    title: 'Tertib & Membaca Doa Setelah Wudhu Menghadap Kiblat',
    desc: 'Melakukan seluruh urutan secara berurutan (tertib), kemudian menghadap kiblat membaca doa syahadat setelah wudhu.',
  },
];

export const MasjidModal: React.FC<MasjidModalProps> = ({
  onClose,
  student,
  onAddXp,
  onCompleteMasjidMission,
}) => {
  const [mainTab, setMainTab] = useState<'iqro' | 'sholat'>('iqro');
  const [selectedJilid, setSelectedJilid] = useState<1 | 2 | 3 | 4 | 5 | 6>(1);
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const [quizAnswerByJilid, setQuizAnswerByJilid] = useState<Record<number, number | null>>({});

  const storageKeyIqro = `kota_refleksi_iqro_done_${student.id}`;
  const storageKeySholat = `kota_refleksi_sholat_done_${student.id}`;

  const [completedJilids, setCompletedJilids] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem(storageKeyIqro);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [sholatSubTab, setSholatSubTab] = useState<'gerakan' | 'niat_5_waktu' | 'wudhu'>('gerakan');
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);
  const [completedSholatSteps, setCompletedSholatSteps] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem(storageKeySholat);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [sholatRewardClaimed, setSholatRewardClaimed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(`${storageKeySholat}_rewarded`) === '1';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    onCompleteMasjidMission?.();
  }, [onCompleteMasjidMission]);

  const speakArabicOrLatin = (arabicText: string, fallbackLatin: string) => {
    sounds.playClick();
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(arabicText);
      const voices = window.speechSynthesis.getVoices();
      const arVoice = voices.find((v) => v.lang.toLowerCase().startsWith('ar'));
      const idVoice = voices.find((v) => v.lang.toLowerCase().startsWith('id'));
      if (arVoice) {
        utter.voice = arVoice;
        utter.lang = arVoice.lang;
        utter.rate = 0.82;
      } else {
        utter.text = fallbackLatin;
        if (idVoice) utter.voice = idVoice;
        utter.lang = 'id-ID';
        utter.rate = 0.88;
      }
      window.speechSynthesis.speak(utter);
    } catch {
      // safe fallback
    }
  };

  const currentJilidData = IQRO_VOLUMES.find((v) => v.jilid === selectedJilid) || IQRO_VOLUMES[0];
  const selectedQuizAnswer = quizAnswerByJilid[selectedJilid] ?? null;
  const isCurrentJilidDone = completedJilids.includes(selectedJilid);

  const handleSelectQuizOption = (optIndex: number) => {
    sounds.playClick();
    setQuizAnswerByJilid((prev) => ({ ...prev, [selectedJilid]: optIndex }));
    if (optIndex === currentJilidData.quiz.correctIndex && !completedJilids.includes(selectedJilid)) {
      const next = [...completedJilids, selectedJilid];
      setCompletedJilids(next);
      try {
        localStorage.setItem(storageKeyIqro, JSON.stringify(next));
      } catch {}
      sounds.playRewardXp();
      onAddXp?.(1, `Tuntas Belajar Iqro Jilid ${selectedJilid}`);
    }
  };

  const currentSholatStep = SHOLAT_STEPS[activeStepIndex] || SHOLAT_STEPS[0];

  const handleMarkSholatStepRead = (stepNum: number) => {
    sounds.playClick();
    let next = completedSholatSteps;
    if (!completedSholatSteps.includes(stepNum)) {
      next = [...completedSholatSteps, stepNum];
      setCompletedSholatSteps(next);
      try {
        localStorage.setItem(storageKeySholat, JSON.stringify(next));
      } catch {}
    }

    if (next.length >= 5 && !sholatRewardClaimed) {
      setSholatRewardClaimed(true);
      try {
        localStorage.setItem(`${storageKeySholat}_rewarded`, '1');
      } catch {}
      sounds.playRewardXp();
      onAddXp?.(1, 'Belajar Tuntunan Sholat di Masjid');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#0d1b26] border border-emerald-500/40 w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[93vh] text-slate-100">
        {/* Header Masjid */}
        <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-900 px-5 sm:px-6 py-4 border-b border-emerald-500/30 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-emerald-950/70 border border-amber-400/50 flex items-center justify-center text-2xl sm:text-3xl shadow-inner shrink-0">
              🕌
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 text-xs text-emerald-200">
                <span className="font-semibold text-amber-300">Masjid Al-Hikmah Refleksia</span>
                <span aria-hidden="true">·</span>
                <span>Tepi Kolam & Hulu Aliran Sungai</span>
              </div>
              <h2 className="text-lg sm:text-xl font-extrabold text-white truncate font-['Outfit']">
                Pusat Belajar Baca Iqro (1–6) & Tuntunan Sholat
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
                window.speechSynthesis.cancel();
              }
              onClose();
            }}
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer shrink-0"
            aria-label="Tutup Masjid"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2 Hal Inti Primary Navigation Tabs */}
        <div className="bg-slate-900/90 px-4 sm:px-6 py-3 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shrink-0">
          <div className="flex items-center gap-1.5 p-1 bg-slate-950/90 rounded-2xl border border-slate-800">
            <button
              type="button"
              onClick={() => {
                sounds.playClick();
                setMainTab('iqro');
              }}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                mainTab === 'iqro'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <BookOpen className="w-4 h-4 text-amber-300 shrink-0" />
              <span>1. Belajar Baca Iqro (Jilid 1–6)</span>
              <span className="text-[11px] font-mono opacity-90 tabular-nums">
                ({completedJilids.length}/6)
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                sounds.playClick();
                setMainTab('sholat');
              }}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                mainTab === 'sholat'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Compass className="w-4 h-4 text-amber-300 shrink-0" />
              <span>2. Belajar Tuntunan Sholat</span>
              <span className="text-[11px] font-mono opacity-90 tabular-nums">
                ({completedSholatSteps.length}/{SHOLAT_STEPS.length})
              </span>
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-300">
            <Award className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Warga:</span>
            <strong className="text-white truncate max-w-[140px]">{student.name}</strong>
            <span aria-hidden="true">·</span>
            <span className="font-mono font-bold text-amber-400 tabular-nums">🪙 {student.points} XP</span>
          </div>
        </div>

        {/* Kumandang Azan 5 Waktu (Sinkron & Terlihat Langsung dari Peta Kota) */}
        <div className="bg-emerald-950/60 px-4 sm:px-6 py-2.5 border-b border-emerald-500/30 flex flex-col lg:flex-row lg:items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2 text-xs">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-amber-500/20 border border-amber-400/50 text-amber-300">
              🔊
            </span>
            <div>
              <span className="font-bold text-amber-300">Azan 5 Waktu Menara Masjid (Terlihat di Peta Kota):</span>{' '}
              <span className="text-emerald-100/90">
                Klik salah satu waktu untuk mengumandangkan & melihat gelombang Azan dari menara masjid di peta
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'Subuh', time: '04:45', icon: '🌅', isSubuh: true },
              { id: 'Dzuhur', time: '12:05', icon: '☀️', isSubuh: false },
              { id: 'Ashar', time: '15:22', icon: '🌤️', isSubuh: false },
              { id: 'Maghrib', time: '18:08', icon: '🌇', isSubuh: false },
              { id: 'Isya', time: '19:18', icon: '🌙', isSubuh: false },
            ].map((az) => (
              <button
                key={az.id}
                type="button"
                onClick={() => {
                  sounds.playClick();
                  window.dispatchEvent(
                    new CustomEvent('kota_refleksi_trigger_azan', {
                      detail: { waktu: az.id, time: az.time, fromModal: true },
                    })
                  );
                  speakArabicOrLatin(
                    az.isSubuh
                      ? 'اللّٰهُ أَكْبَرُ اللّٰهُ أَكْبَرُ ، حَيَّ عَلَى الصَّلَاةِ ، الصَّلَاةُ خَيْرٌ مِنَ النَّوْمِ'
                      : 'اللّٰهُ أَكْبَرُ اللّٰهُ أَكْبَرُ ، أَشْهَدُ أَنْ لَا إِلٰهَ إِلَّا اللّٰهُ ، حَيَّ عَلَى الصَّلَاةِ ، حَيَّ عَلَى الْفَلَاحِ',
                    az.isSubuh
                      ? `Allaahu Akbar Allaahu Akbar, Hayya 'alash-shalaah, Ash-shalaatu khairum minan-naum`
                      : `Allaahu Akbar Allaahu Akbar, Asyhadu allaa ilaaha illallaah, Hayya 'alash-shalaah, Hayya 'alal-falaah`
                  );
                }}
                className="px-2.5 py-1 rounded-xl bg-slate-900/90 hover:bg-emerald-700/80 border border-emerald-400/40 hover:border-amber-300 text-[11px] font-bold text-emerald-100 hover:text-white flex items-center gap-1 transition cursor-pointer shadow-sm"
                title={`Kumandangkan Azan ${az.id} (${az.time} WITA) di Menara Masjid Peta Kota`}
              >
                <span>{az.icon}</span>
                <span>{az.id}</span>
                <span className="font-mono text-[10px] text-amber-300">({az.time})</span>
              </button>
            ))}
          </div>
        </div>

        {/* Main Scrollable Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5">
          {/* =====================================================================
              HAL INTI 1: BELAJAR BACA IQRO (JILID 1 S.D. 6)
             ===================================================================== */}
          {mainTab === 'iqro' && (
            <div className="space-y-5">
              {/* Jilid 1 - 6 Selector Bar */}
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {IQRO_VOLUMES.map((vol) => {
                  const isSelected = selectedJilid === vol.jilid;
                  const isDone = completedJilids.includes(vol.jilid);
                  return (
                    <button
                      key={vol.jilid}
                      type="button"
                      onClick={() => {
                        sounds.playClick();
                        setSelectedJilid(vol.jilid);
                        setActiveCardId(null);
                      }}
                      className={`p-2.5 sm:p-3 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'bg-emerald-900/60 border-amber-400 text-white shadow-md'
                          : isDone
                          ? 'bg-emerald-950/35 border-emerald-600/40 text-emerald-200 hover:bg-emerald-900/40'
                          : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-extrabold tracking-tight whitespace-nowrap">
                          Iqro {vol.jilid}
                        </span>
                        {isDone && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                      </div>
                      <span className="text-[10px] text-slate-300 mt-1 line-clamp-1">
                        {vol.jilid === 1
                          ? 'Huruf Fathah'
                          : vol.jilid === 2
                          ? 'Sambung & Mad'
                          : vol.jilid === 3
                          ? 'Kasrah & Dhammah'
                          : vol.jilid === 4
                          ? 'Tanwin & Qalqalah'
                          : vol.jilid === 5
                          ? 'Tasydid & Waqaf'
                          : 'Tajwid & Tahsin'}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Active Jilid Overview Banner */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <div>
                    <div className="flex items-center gap-2 text-xs text-emerald-300 font-semibold">
                      <span>Modul Iqro Digital Interaktif</span>
                      <span aria-hidden="true">·</span>
                      <span>Jilid {currentJilidData.jilid} dari 6</span>
                      {isCurrentJilidDone && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="text-amber-300 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Tuntas Dipelajari
                          </span>
                        </>
                      )}
                    </div>
                    <h3 className="text-base sm:text-lg font-extrabold text-white mt-0.5">
                      {currentJilidData.title}: {currentJilidData.subtitle}
                    </h3>
                  </div>
                  <span className="text-xs text-amber-300 font-medium">
                    🔊 Klik kartu bacaan untuk mendengar pelafalan
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                  {currentJilidData.focusSummary}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-1">
                  {currentJilidData.keyRules.map((rule, rIdx) => (
                    <div
                      key={rIdx}
                      className="p-3 rounded-xl bg-slate-950/75 border border-slate-800/90 text-xs text-slate-300 leading-relaxed"
                    >
                      <span className="font-bold text-emerald-400 mr-1.5">0{rIdx + 1}.</span>
                      {rule}
                    </div>
                  ))}
                </div>
              </div>

              {/* Interactive Iqro Cards Grid */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white">
                    Kartu Latihan Huruf & Pokok Bahasan ({currentJilidData.title})
                  </h4>
                  <span className="text-xs text-slate-400">
                    Sentuh kartu untuk mendengar bunyi & penjelasan makhraj/tajwid
                  </span>
                </div>

                <div
                  className={`grid gap-2.5 ${
                    currentJilidData.jilid === 1
                      ? 'grid-cols-2 sm:grid-cols-4 md:grid-cols-7'
                      : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-4'
                  }`}
                >
                  {currentJilidData.cards.map((card) => {
                    const isCardActive = activeCardId === card.id;
                    return (
                      <button
                        key={card.id}
                        type="button"
                        onClick={() => {
                          setActiveCardId(card.id);
                          speakArabicOrLatin(card.arabic, card.speechText);
                        }}
                        className={`p-3 rounded-2xl border text-center transition cursor-pointer flex flex-col items-center justify-between gap-1.5 ${
                          isCardActive
                            ? 'bg-emerald-900/55 border-amber-400 shadow-md'
                            : 'bg-slate-900/75 hover:bg-slate-800/80 border-slate-800'
                        }`}
                      >
                        <div className="w-full flex items-center justify-between text-[10px] text-slate-400">
                          <span className="font-semibold text-emerald-300">{card.latin}</span>
                          <Volume2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        </div>

                        <div
                          dir="rtl"
                          className="text-2xl sm:text-3xl font-bold text-amber-100 py-1.5 leading-normal tracking-wide select-text"
                        >
                          {card.arabic}
                        </div>

                        <p className="text-[11px] text-slate-300 leading-snug line-clamp-2">
                          {card.ruleNote}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Baris Latihan Kelancaran Bacaan (Tadarus Iqro) */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white">
                    Halaman Latihan Kelancaran Bacaan ({currentJilidData.title})
                  </h4>
                  <span className="text-xs text-emerald-300">Baca dari Kanan ke Kiri (RTL)</span>
                </div>

                <div className="space-y-2.5">
                  {currentJilidData.practiceRows.map((row, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-slate-950/85 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3"
                    >
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          <span className="font-mono font-bold text-emerald-400">Baris 0{idx + 1}</span>
                          <span aria-hidden="true">·</span>
                          <span className="text-amber-200 font-semibold">{row.latin}</span>
                        </div>
                        <p className="text-xs text-slate-300">{row.note}</p>
                      </div>

                      <div className="flex items-center justify-between md:justify-end gap-3">
                        <div
                          dir="rtl"
                          className="text-xl sm:text-2xl font-bold text-white tracking-wider bg-emerald-950/40 px-4 py-2 rounded-xl border border-emerald-500/25"
                        >
                          {row.arabic}
                        </div>
                        <button
                          type="button"
                          onClick={() => speakArabicOrLatin(row.arabic, row.latin)}
                          className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shrink-0"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                          <span>Dengar</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Evaluasi Pemahaman Jilid (+1 XP) */}
              <div className="p-4 sm:p-5 rounded-2xl bg-emerald-950/35 border border-emerald-500/35 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-amber-400 shrink-0" />
                    <h4 className="text-sm font-bold text-white">
                      Uji Pemahaman {currentJilidData.title} (+1 XP)
                    </h4>
                  </div>
                  {isCurrentJilidDone && (
                    <span className="text-xs font-bold text-emerald-300 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Lulus Jilid {selectedJilid}
                    </span>
                  )}
                </div>

                <p className="text-xs sm:text-sm text-slate-100 font-medium">
                  {currentJilidData.quiz.question}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {currentJilidData.quiz.options.map((opt, oIdx) => {
                    const isPicked = selectedQuizAnswer === oIdx;
                    const isRight = oIdx === currentJilidData.quiz.correctIndex;
                    return (
                      <button
                        key={oIdx}
                        type="button"
                        onClick={() => handleSelectQuizOption(oIdx)}
                        className={`p-3 rounded-xl border text-left text-xs font-semibold transition cursor-pointer flex items-center justify-between gap-2 ${
                          isPicked
                            ? isRight
                              ? 'bg-emerald-700/60 border-emerald-400 text-white'
                              : 'bg-rose-900/50 border-rose-400 text-rose-100'
                            : 'bg-slate-900/85 hover:bg-slate-800 border-slate-700 text-slate-200'
                        }`}
                      >
                        <span>{opt}</span>
                        {isPicked && (
                          <span className="text-[11px] font-bold shrink-0">
                            {isRight ? '✓ Benar' : '✗ Coba Lagi'}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {selectedQuizAnswer !== null && (
                  <p className="text-xs text-emerald-200 bg-slate-950/70 p-3 rounded-xl border border-emerald-500/30">
                    <strong>Penjelasan Tajwid/Iqro:</strong> {currentJilidData.quiz.explanation}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* =====================================================================
              HAL INTI 2: BELAJAR TUNTUNAN SHOLAT LENGKAP
             ===================================================================== */}
          {mainTab === 'sholat' && (
            <div className="space-y-5">
              {/* Sub-navigation for Tuntunan Sholat */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 p-1 bg-slate-900 rounded-xl border border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      sounds.playClick();
                      setSholatSubTab('gerakan');
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                      sholatSubTab === 'gerakan'
                        ? 'bg-emerald-600 text-white'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    13 Langkah Gerakan & Bacaan Sholat
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      sounds.playClick();
                      setSholatSubTab('niat_5_waktu');
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                      sholatSubTab === 'niat_5_waktu'
                        ? 'bg-emerald-600 text-white'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    Niat Sholat Fardhu 5 Waktu
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      sounds.playClick();
                      setSholatSubTab('wudhu');
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                      sholatSubTab === 'wudhu'
                        ? 'bg-emerald-600 text-white'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    <Droplets className="w-3.5 h-3.5 text-sky-300" />
                    <span>Tata Cara Wudhu Tertib</span>
                  </button>
                </div>

                <div className="text-xs text-slate-300">
                  Pelajari minimal 5 rukun sholat untuk klaim otomatis <strong className="text-amber-300">+1 XP</strong>
                </div>
              </div>

              {/* SUB-TAB 1: 13 LANGKAH GERAKAN & BACAAN SHOLAT */}
              {sholatSubTab === 'gerakan' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
                  {/* Left Sidebar: 13 Steps List */}
                  <div className="lg:col-span-4 bg-slate-900/90 border border-slate-800 rounded-2xl p-3 space-y-1.5 max-h-[430px] overflow-y-auto">
                    <div className="px-2 py-1 text-xs font-bold text-slate-400 flex items-center justify-between">
                      <span>Urutan Tertib Sholat</span>
                      <span className="tabular-nums text-emerald-400">
                        {completedSholatSteps.length}/{SHOLAT_STEPS.length} Dipelajari
                      </span>
                    </div>
                    {SHOLAT_STEPS.map((st, idx) => {
                      const isCurrent = activeStepIndex === idx;
                      const isStepDone = completedSholatSteps.includes(st.stepNumber);
                      return (
                        <button
                          key={st.stepNumber}
                          type="button"
                          onClick={() => {
                            sounds.playClick();
                            setActiveStepIndex(idx);
                          }}
                          className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold transition flex items-center justify-between gap-2 cursor-pointer ${
                            isCurrent
                              ? 'bg-emerald-700 text-white shadow-sm'
                              : isStepDone
                              ? 'bg-emerald-950/40 text-emerald-200 hover:bg-slate-800'
                              : 'text-slate-300 hover:bg-slate-800/70'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="w-5 h-5 rounded-md bg-black/30 font-mono text-[11px] font-bold flex items-center justify-center shrink-0 tabular-nums">
                              {st.stepNumber}
                            </span>
                            <span className="truncate">{st.title}</span>
                          </div>
                          {isStepDone && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Right Stage: Active Step Detail */}
                  <div className="lg:col-span-8 bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
                    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-800 pb-3">
                      <div>
                        <div className="flex items-center gap-2 text-xs text-emerald-300 font-semibold">
                          <span>Langkah {currentSholatStep.stepNumber} dari {SHOLAT_STEPS.length}</span>
                          <span aria-hidden="true">·</span>
                          <span>{currentSholatStep.postureBadge}</span>
                        </div>
                        <h3 className="text-base sm:text-lg font-extrabold text-white mt-0.5">
                          {currentSholatStep.title}
                        </h3>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          speakArabicOrLatin(currentSholatStep.arabic, currentSholatStep.speechText)
                        }
                        className="px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-200 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shrink-0"
                      >
                        <Volume2 className="w-4 h-4 text-amber-300" />
                        <span>Dengarkan Bacaan</span>
                      </button>
                    </div>

                    {/* Posture & Movement Guide */}
                    <div className="p-3.5 rounded-xl bg-slate-950/75 border border-slate-800 space-y-1">
                      <div className="text-xs font-bold text-emerald-400">
                        Tata Cara Gerakan & Sikap Tubuh (Thuma’ninah):
                      </div>
                      <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                        {currentSholatStep.postureGuide}
                      </p>
                    </div>

                    {/* Arabic, Latin, and Translation Box */}
                    <div className="p-4 sm:p-5 rounded-2xl bg-emerald-950/35 border border-emerald-500/30 space-y-3">
                      <div
                        dir="rtl"
                        className="text-xl sm:text-2xl font-bold text-amber-100 leading-loose text-right select-text"
                      >
                        {currentSholatStep.arabic}
                      </div>

                      <div className="pt-2 border-t border-emerald-500/20 space-y-1.5">
                        <p className="text-xs sm:text-sm font-semibold text-emerald-300 italic leading-relaxed">
                          “{currentSholatStep.latin}”
                        </p>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          <strong>Artinya:</strong> {currentSholatStep.translation}
                        </p>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-amber-950/25 border border-amber-500/30 text-xs text-amber-200">
                      <strong>Catatan Penting:</strong> {currentSholatStep.importantNote}
                    </div>

                    {/* Step Navigation & Completion Controls */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800">
                      <button
                        type="button"
                        disabled={activeStepIndex === 0}
                        onClick={() => {
                          sounds.playClick();
                          setActiveStepIndex((prev) => Math.max(0, prev - 1));
                        }}
                        className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-xs font-bold text-slate-200 flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        <span>Sebelumnya</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleMarkSholatStepRead(currentSholatStep.stepNumber)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                          completedSholatSteps.includes(currentSholatStep.stepNumber)
                            ? 'bg-emerald-900/60 text-emerald-200 border border-emerald-500/40'
                            : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm'
                        }`}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>
                          {completedSholatSteps.includes(currentSholatStep.stepNumber)
                            ? 'Sudah Dipahami'
                            : 'Tandai Paham Langkah Ini'}
                        </span>
                      </button>

                      <button
                        type="button"
                        disabled={activeStepIndex === SHOLAT_STEPS.length - 1}
                        onClick={() => {
                          handleMarkSholatStepRead(currentSholatStep.stepNumber);
                          setActiveStepIndex((prev) => Math.min(SHOLAT_STEPS.length - 1, prev + 1));
                        }}
                        className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-xs font-bold text-slate-200 flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <span>Langkah Berikutnya</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* SUB-TAB 2: NIAT SHOLAT FARDHU 5 WAKTU */}
              {sholatSubTab === 'niat_5_waktu' && (
                <div className="space-y-3">
                  {FARDHU_NIAT_LIST.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2.5"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2 text-xs text-emerald-300 font-semibold">
                            <Clock className="w-3.5 h-3.5 text-amber-400" />
                            <span>{item.rakaat}</span>
                            <span aria-hidden="true">·</span>
                            <span>{item.timeWindow}</span>
                          </div>
                          <h4 className="text-base font-extrabold text-white mt-0.5">{item.name}</h4>
                        </div>
                        <button
                          type="button"
                          onClick={() => speakArabicOrLatin(item.arabic, item.latin)}
                          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                          <span>Dengar Niat</span>
                        </button>
                      </div>

                      <div
                        dir="rtl"
                        className="text-lg sm:text-xl font-bold text-amber-100 bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 text-right leading-loose"
                      >
                        {item.arabic}
                      </div>

                      <div className="space-y-1 text-xs">
                        <p className="font-semibold text-emerald-300 italic">{item.latin}</p>
                        <p className="text-slate-300">{item.meaning}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* SUB-TAB 3: TATA CARA WUDHU TERTIB DI AIR HULU SUNGAI */}
              {sholatSubTab === 'wudhu' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-sky-950/35 border border-sky-500/35 flex items-start gap-3">
                    <Droplets className="w-6 h-6 text-sky-400 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <h4 className="text-sm font-extrabold text-white">
                        Bersuci (Wudhu) dengan Air Suci Mensucikan di Hulu Sungai Masjid
                      </h4>
                      <p className="text-xs text-slate-200 leading-relaxed">
                        Wudhu adalah syarat sah sholat. Masjid Al-Hikmah Refleksia berada tepat di samping kolam dan awal aliran sungai yang jernih sebagai pengingat pentingnya menjaga kesucian lahir dan batin sebelum menghadap Allah SWT.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {WUDHU_GUIDE_STEPS.map((ws) => (
                      <div
                        key={ws.order}
                        className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-start gap-3"
                      >
                        <span className="w-7 h-7 rounded-xl bg-emerald-900/70 border border-emerald-500/40 text-amber-300 font-mono text-xs font-extrabold flex items-center justify-center shrink-0 tabular-nums">
                          {ws.order}
                        </span>
                        <div className="space-y-1">
                          <h5 className="text-xs sm:text-sm font-bold text-white">{ws.title}</h5>
                          <p className="text-xs text-slate-300 leading-relaxed">{ws.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-900/90 border border-emerald-500/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <h5 className="text-xs sm:text-sm font-bold text-amber-300">
                        Doa Setelah Wudhu
                      </h5>
                      <button
                        type="button"
                        onClick={() =>
                          speakArabicOrLatin(
                            'أَشْهَدُ أَنْ لَا إِلٰهَ إِلَّا اللّٰهُ وَحْدَهُ لَا شَرِيْكَ لَهُ وَأَشْهَدُ أَنَّ مُحَمَّدًا عَبْدُهُ وَرَسُوْلُهُ',
                            'Asyhadu an laa ilaaha illallaahu wahdahuu laa syariika lahuu wa asyhadu anna Muhammadan abduhuu wa rasuuluh'
                          )
                        }
                        className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                        <span>Dengar Doa</span>
                      </button>
                    </div>
                    <div dir="rtl" className="text-base sm:text-lg font-bold text-white leading-loose text-right">
                      أَشْهَدُ أَنْ لَا إِلٰهَ إِلَّا اللّٰهُ وَحْدَهُ لَا شَرِيْكَ لَهُ ، وَأَشْهَدُ أَنَّ مُحَمَّدًا عَبْدُهُ وَرَسُوْلُهُ ، اللّٰهُمَّ اجْعَلْنِيْ مِنَ التَّوَّابِيْنَ وَاجْعَلْنِيْ مِنَ الْمُتَطَهِّرِيْنَ
                    </div>
                    <p className="text-xs text-emerald-300 italic">
                      “Asyhadu an laa ilaaha illallaahu wahdahuu laa syariika lah, wa asyhadu anna Muhammadan ‘abduhuu wa rasuuluh. Allaahummaj‘alnii minat-tawwaabiina waj‘alnii minal mutathahhiriin.”
                    </p>
                    <p className="text-xs text-slate-300">
                      <strong>Artinya:</strong> “Aku bersaksi bahwa tiada Tuhan selain Allah Yang Maha Esa, tiada sekutu bagi-Nya, dan aku bersaksi bahwa Nabi Muhammad adalah hamba dan utusan-Nya. Ya Allah, jadikanlah aku termasuk golongan orang-orang yang bertaubat dan jadikanlah aku termasuk golongan orang-orang yang menjaga kesucian.”
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-900/95 px-5 sm:px-6 py-3 border-t border-slate-800 flex items-center justify-between text-xs shrink-0">
          <div className="flex items-center gap-2 text-slate-300">
            <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Masjid Al-Hikmah Refleksia · Pembinaan Imtaq, Baca Iqro (1–6) & Tuntunan Sholat</span>
          </div>
          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
                window.speechSynthesis.cancel();
              }
              onClose();
            }}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition cursor-pointer"
          >
            Selesai & Kembali ke Kota
          </button>
        </div>
      </div>
    </div>
  );
};
