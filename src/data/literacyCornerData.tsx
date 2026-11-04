import React from 'react';

export interface FolkloreComicItem {
  id: string;
  number: number;
  title: string;
  region: string;
  badgeColor: string;
  accentHex: string;
  bgGradient: string;
  speechBubble: string;
  summary: string;
  panels: Array<{
    panelNo: number;
    caption: string;
    dialogue: string;
    sceneDesc: string;
  }>;
  moralValue: string;
  dkvInsight: string;
}

export const INDONESIAN_FOLKLORE_COMICS: FolkloreComicItem[] = [
  {
    id: 'malin_kundang',
    number: 1,
    title: 'Malin Kundang',
    region: 'Sumatera Barat',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
    accentHex: '#d97706',
    bgGradient: 'from-sky-900 via-amber-900 to-slate-900',
    speechBubble: '“Ibu... maafkan aku yang telah melupakan jasa-jasamu!”',
    summary:
      'Kisah pemuda perantau dari Pantai Air Manis yang sukses menjadi saudagar kapal besar namun lupa diri hingga terkena kutukan menjadi batu di tepi pantai.',
    panels: [
      {
        panelNo: 1,
        caption: 'Merantau dari Pantai Air Manis',
        dialogue: '“Doakan Malin berhasil di rantau ya, Mak!”',
        sceneDesc: 'Malin berpamitan kepada Mande Rubayah di dermaga kayu tepi laut Sumatera Barat.',
      },
      {
        panelNo: 2,
        caption: 'Pulang dengan Kapal Saudagar Megah',
        dialogue: '“Lihat! Kapal besar berlayar emas berlabuh di kampung kita!”',
        sceneDesc: 'Kapal phinisi megah milik Malin Kundang bersandar di Pantai Air Manis disambut warga.',
      },
      {
        panelNo: 3,
        caption: 'Kesombongan yang Melukai Hati Ibu',
        dialogue: '“Malin anakku, ini Ibumu yang menunggumu setiap hari...”',
        sceneDesc: 'Mande Rubayah memanggil Malin, namun Malin berpaling karena malu akan pakaian sang ibu.',
      },
      {
        panelNo: 4,
        caption: 'Badai Laut & Batu Malin Kundang',
        dialogue: '“Langit menghitam! Ombak besar menghantam kapal!”',
        sceneDesc: 'Kilat menyambar laut dan tubuh Malin beserta pecahan kapalnya membatu di pesisir Pantai Air Manis.',
      },
    ],
    moralValue:
      'Setinggi apa pun kesuksesan dan ilmu yang kita raih, hormati dan muliakan selalu orang tua serta guru yang telah membimbing kita dari awal.',
    dkvInsight:
      'Komposisi visual dramatis: kontras warna langit badai (biru tua keunguan) dengan kilatan petir kuning emas memperkuat emosi klimaks komik.',
  },
  {
    id: 'timun_mas',
    number: 2,
    title: 'Timun Mas & Buto Ijo',
    region: 'Jawa Tengah',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    accentHex: '#059669',
    bgGradient: 'from-emerald-900 via-teal-900 to-slate-900',
    speechBubble: '“Empat bungkusan bekal ini akan menghentikan langkahmu, Buto Ijo!”',
    summary:
      'Gadis pemberani yang lahir dari buah mentimun keemasan menggunakan kecerdikan dan empat benda ajaib untuk menyelamatkan diri dari kejaran raksasa.',
    panels: [
      {
        panelNo: 1,
        caption: 'Mentimun Emas di Ladang Mbok Srini',
        dialogue: '“Subhanallah, dari dalam timun emas ini lahir bayi mungil yang sehat!”',
        sceneDesc: 'Mbok Srini menemukan buah mentimun berkilau keemasan di kebunnya.',
      },
      {
        panelNo: 2,
        caption: 'Bekal Empat Bungkusan Pertapa',
        dialogue: '“Bawalah biji mentimun, jarum, garam, dan terasi ini, Nak.”',
        sceneDesc: 'Timun Mas menerima empat kantong kain kecil berisi benda simbolis di lereng gunung.',
      },
      {
        panelNo: 3,
        caption: 'Hutan Bambu & Lautan Lebar',
        dialogue: '“Tumbuhlah lebat wahai hutan bambu! Membentanglah lautan garam!”',
        sceneDesc: 'Biji timun dan jarum berubah menjadi ladang timun dan hutan bambu rapat yang menghambat raksasa.',
      },
      {
        panelNo: 4,
        caption: 'Kemenangan Keberanian & Akal Cerdas',
        dialogue: '“Ibu! Aku berhasil pulang dengan selamat!”',
        sceneDesc: 'Bungkusan terakhir menghentikan Buto Ijo, dan Timun Mas kembali memeluk Mbok Srini dengan bahagia.',
      },
    ],
    moralValue:
      'Ketenangan berpikir, ikhtiar, dan strategi bertahap (algoritmik) mampu menyelesaikan masalah yang tampak raksasa sekalipun.',
    dkvInsight:
      'Desain karakter kontras ukuran (scale contrast): proporsi tubuh mungil Timun Mas melawan siluet besar Buto Ijo menciptakan ketegangan visual.',
  },
  {
    id: 'sangkuriang',
    number: 3,
    title: 'Sangkuriang & Tangkuban Perahu',
    region: 'Jawa Barat',
    badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-300',
    accentHex: '#4f46e5',
    bgGradient: 'from-indigo-950 via-blue-900 to-slate-900',
    speechBubble: '“Fajar sudah menyingsing di ufuk timur sebelum perahu ini rampung!”',
    summary:
      'Legenda terbentuknya Gunung Tangkuban Perahu di tanah Parahyangan dari kisah Dayang Sumbi dan perahu raksasa yang belum selesai saat fajar tiba.',
    panels: [
      {
        panelNo: 1,
        caption: 'Pengembaraan Sangkuriang Muda',
        dialogue: '“Aku akan mengembara melintasi hutan dan gunung Parahyangan.”',
        sceneDesc: 'Sangkuriang tumbuh menjadi pemuda tangguh pengembara rimba Jawa Barat.',
      },
      {
        panelNo: 2,
        caption: 'Rahasia Luka di Kening',
        dialogue: '“Astaga! Bekas luka ini... engkau adalah putraku sendiri!”',
        sceneDesc: 'Dayang Sumbi menyadari jati diri Sangkuriang dan mencari cara menggagalkan syarat mustahil.',
      },
      {
        panelNo: 3,
        caption: 'Membendung Sungai Citarum Semalam',
        dialogue: '“Bendung aliran sungai dan pahat kayu raksasa menjadi perahu!”',
        sceneDesc: 'Air sungai Citarum terbendung membentuk danau purba Bandung dan perahu besar hampir selesai.',
      },
      {
        panelNo: 4,
        caption: 'Kain Putih Kemerahan & Perahu Tertelungkup',
        dialogue: '“Ayam berkokok! Waktu malam telah habis!”',
        sceneDesc: 'Cahaya fajar menyinari ufuk, perahu raksasa terbalik dan menjelma menjadi Gunung Tangkuban Perahu.',
      },
    ],
    moralValue:
      'Kejujuran, pengendalian emosi, dan keikhlasan menerima ketetapan yang benar akan menghindarkan kita dari penyesalan.',
    dkvInsight:
      'Siluet lanskap ikonik: bentuk trapesium terbalik Gunung Tangkuban Perahu menjadi elemen focal point yang kuat pada latar komik.',
  },
  {
    id: 'roro_jonggrang',
    number: 4,
    title: 'Roro Jonggrang & Seribu Candi',
    region: 'DI Yogyakarta',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-300',
    accentHex: '#9333ea',
    bgGradient: 'from-purple-950 via-fuchsia-950 to-slate-900',
    speechBubble: '“Tumbuk lesung padi dan nyalakan obor di ufuk timur!”',
    summary:
      'Asal-usul kemegahan Candi Prambanan dan kisah kecerdikan Putri Roro Jonggrang ketika diminta syarat membangun 1.000 candi dalam satu malam.',
    panels: [
      {
        panelNo: 1,
        caption: 'Syarat Seribu Candi dalam Semalam',
        dialogue: '“Jika ingin meminangku, bangunlah 1.000 candi sebelum matahari terbit.”',
        sceneDesc: 'Roro Jonggrang mengajukan syarat berat kepada Bandung Bondowoso di istana Prambanan.',
      },
      {
        panelNo: 2,
        caption: 'Pembangunan Candi Batu di Malam Hari',
        dialogue: '“Batu demi batu tersusun cepat! Sudah mencapai 999 candi!”',
        sceneDesc: 'Ratusan menara candi batu andesit menjulang di bawah sinar bulan purnama.',
      },
      {
        panelNo: 3,
        caption: 'Suara Lesung & Cahaya Fajar Buatan',
        dialogue: '“Gadis-gadis desa, ayo tumbuk padi agar ayam jantan berkokok!”',
        sceneDesc: 'Cahaya obor jerami di timur dan bunyi lesung membuat suasana tampak seperti pagi hari.',
      },
      {
        panelNo: 4,
        caption: 'Kemegahan Candi Prambanan',
        dialogue: '“Candi ke-1.000 ini akan selalu dikenang sepanjang masa.”',
        sceneDesc: 'Kompleks Candi Prambanan berdiri megah disinari mentari pagi Yogyakarta.',
      },
    ],
    moralValue:
      'Tepati janji yang telah disepakati dengan jujur; karya besar yang dibangun dengan ketekunan akan abadi melintasi zaman.',
    dkvInsight:
      'Arsitektur simetris & ritme repetisi: deretan puncak candi Prambanan memberikan pelajaran visual tentang pola (pattern) dan keseimbangan.',
  },
  {
    id: 'danau_toba',
    number: 5,
    title: 'Legenda Danau Toba & Samosir',
    region: 'Sumatera Utara',
    badgeColor: 'bg-cyan-100 text-cyan-800 border-cyan-300',
    accentHex: '#0284c7',
    bgGradient: 'from-cyan-950 via-sky-900 to-slate-900',
    speechBubble: '“Janji adalah amanah suci yang tidak boleh dilanggar walaupun saat marah!”',
    summary:
      'Kisah petani Toba, ikan mas ajaib di sungai, dan anak mereka Samosir yang menjadi legenda terbentuknya Danau Toba dan Pulau Samosir.',
    panels: [
      {
        panelNo: 1,
        caption: 'Ikan Mas Berkilau di Sungai',
        dialogue: '“Besar sekali ikan mas yang tersangkut di kailku sore ini!”',
        sceneDesc: 'Toba memancing di sungai jernih lembah Sumatera Utara dan mendapat ikan bersisik emas.',
      },
      {
        panelNo: 2,
        caption: 'Satu Janji Rahasia yang Harus Dijaga',
        dialogue: '“Berjanjilah untuk tidak pernah mengungkit asal-usulku kelak.”',
        sceneDesc: 'Toba berjanji untuk menjaga amanah keluarga di rumah panggung kayu Batak.',
      },
      {
        panelNo: 3,
        caption: 'Samosir Mengantar Bekal ke Ladang',
        dialogue: '“Ayah, maafkan Samosir karena lapar di perjalanan tadi...”',
        sceneDesc: 'Samosir berjalan melintasi bukit hijau membawa rantang bekal makan siang.',
      },
      {
        panelNo: 4,
        caption: 'Lembah Berubah Menjadi Danau Toba',
        dialogue: '“Mata air memancar deras memenuhi seluruh lembah pegunungan!”',
        sceneDesc: 'Air jernih menggenangi lembah luas dengan Pulau Samosir berdiri indah di tengah Danau Toba.',
      },
    ],
    moralValue:
      'Menjaga lisan saat marah dan memegang teguh janji adalah kunci keharmonisan dalam keluarga maupun tim kerja.',
    dkvInsight:
      'Palet warna sejuk (cool palette): gradasi biru toska dan hijau bukit menciptakan suasana tenang khas lanskap Danau Toba.',
  },
  {
    id: 'lahilote',
    number: 6,
    title: 'Lahilote & Jejak Kaki di Pantai Pohe',
    region: 'Gorontalo',
    badgeColor: 'bg-amber-100 text-amber-900 border-amber-400',
    accentHex: '#f59e0b',
    bgGradient: 'from-amber-950 via-teal-950 to-slate-900',
    speechBubble: '“Dengan sayap rotan Hutiya Mala ini, aku terbang menembus awan Gorontalo!”',
    summary:
      'Cerita rakyat kebanggaan Gorontalo tentang pemuda Lahilote, bidadari Boyilode Hulawa, dan batu berbentuk telapak kaki di pesisir Pantai Pohe.',
    panels: [
      {
        panelNo: 1,
        caption: 'Telaga Jernih di Hutan Gorontalo',
        dialogue: '“Selendang bercahaya siapa yang tersimpan di tepi mata air ini?”',
        sceneDesc: 'Lahilote pencari rotan menemukan selendang kahyangan dan mempersunting Boyilode Hulawa.',
      },
      {
        panelNo: 2,
        caption: 'Bambu Selendang & Kembalinya Sang Istri',
        dialogue: '“Selendangku ditemukan kembali... aku harus pulang ke negeri awan.”',
        sceneDesc: 'Boyilode Hulawa terbang kembali ke kahyangan meninggalkan Lahilote yang merindu.',
      },
      {
        panelNo: 3,
        caption: 'Sayap Rotan Ajaib Hutiya Mala',
        dialogue: '“Gunakan rotan Hutiya Mala ini untuk terbang menyusulnya, Lahilote!”',
        sceneDesc: 'Lahilote merangkai sayap rotan dan terbang melintasi langit biru Teluk Gorontalo.',
      },
      {
        panelNo: 4,
        caption: 'Batu Telapak Kaki di Pantai Pohe',
        dialogue: '“Jejak kakiku terukir abadi di batu karang Pantai Pohe!”',
        sceneDesc: 'Sehelai uban membuat ikatan rotan terlepas, dan pijakan Lahilote membekas menjadi batu telapak kaki di Pantai Pohe.',
      },
    ],
    moralValue:
      'Kegigihan memperjuangkan cita-cita harus selalu diiringi kejujuran, kerendahan hati, dan kesiapan menerima kenyataan.',
    dkvInsight:
      'Kearifan lokal Gorontalo: tekstur anyaman rotan dan siluet batu karang Pantai Pohe menjadi inspirasi motif visual daerah yang autentik.',
  },
  {
    id: 'danau_limboto',
    number: 7,
    title: 'Legenda Danau Limboto: Tupalo & Mbui Bungale',
    region: 'Gorontalo',
    badgeColor: 'bg-teal-100 text-teal-900 border-teal-400',
    accentHex: '#0d9488',
    bgGradient: 'from-teal-950 via-cyan-950 to-slate-900',
    speechBubble: '“Permata jernih dari mata air Tupalo memancarkan keindahan Danau Limboto!”',
    summary:
      'Kisah rakyat Gorontalo tentang mata air Tupalo, permata berkilau yang berubah menjadi Mbui Bungale, serta pesan menjaga kelestarian Danau Limboto.',
    panels: [
      {
        panelNo: 1,
        caption: 'Mata Air Jernih Tupalo',
        dialogue: '“Lihat, ada sebutir permata putih bercahaya di dasar mata air!”',
        sceneDesc: 'Pasangan tua di tepi perbukitan Gorontalo menemukan permata berkilau di mata air.',
      },
      {
        panelNo: 2,
        caption: 'Mbui Bungale yang Santun & Rajin',
        dialogue: '“Aku akan membantu Ayah dan Ibu merawat kebun dan menenun.”',
        sceneDesc: 'Permata ajaib menjelma menjadi gadis bijaksana bernama Mbui Bungale yang disayangi warga.',
      },
      {
        panelNo: 3,
        caption: 'Pesta Adat & Biji Lemon Cui',
        dialogue: '“Jaga selalu kejernihan air dan kelestarian alam negeri kita!”',
        sceneDesc: 'Mbui Bungale berpesan kepada warga sebelum menyelam ke telaga dengan sebutir lemon cui.',
      },
      {
        panelNo: 4,
        caption: 'Hamparan Luas Danau Limboto',
        dialogue: '“Danau Limboto menjadi sumber kehidupan dan keindahan Gorontalo!”',
        sceneDesc: 'Air telaga meluas tenang menjadi Danau Limboto yang dikelilingi perbukitan hijau.',
      },
    ],
    moralValue:
      'Menjaga kelestarian lingkungan dan sumber air seperti Danau Limboto adalah wujud rasa syukur kita kepada Sang Pencipta.',
    dkvInsight:
      'Refleksi air & pantulan langit senja (water reflection): teknik gradasi horizontal memberikan kesan kedalaman dan ketenangan pada ilustrasi.',
  },
  {
    id: 'bawang_merah_putih',
    number: 8,
    title: 'Bawang Merah & Bawang Putih',
    region: 'Riau / Nusantara',
    badgeColor: 'bg-rose-100 text-rose-800 border-rose-300',
    accentHex: '#e11d48',
    bgGradient: 'from-rose-950 via-amber-950 to-slate-900',
    speechBubble: '“Aku memilih labu yang kecil saja, Nek, agar mudah kubawa pulang.”',
    summary:
      'Kisah klasik Nusantara tentang ketulusan hati, kerajinan bekerja, dan kesederhanaan Bawang Putih yang membuahkan berkah berlimpah.',
    panels: [
      {
        panelNo: 1,
        caption: 'Menyusuri Sungai Mencari Selendang',
        dialogue: '“Apakah Ibu melihat selendang merah yang hanyut di sungai ini?”',
        sceneDesc: 'Bawang Putih berjalan dengan sabar di sepanjang aliran sungai yang jernih.',
      },
      {
        panelNo: 2,
        caption: 'Membantu Nenek di Pondok Hutan',
        dialogue: '“Mari Nek, biar saya bantu menyapu halaman dan menanak nasi.”',
        sceneDesc: 'Dengan tulus Bawang Putih membantu nenek tua pemilik pondok kayu di tepi hutan.',
      },
      {
        panelNo: 3,
        caption: 'Memilih Labu Kecil dengan Rendah Hati',
        dialogue: '“Terima kasih Nek, labu kecil ini sudah sangat cukup untukku.”',
        sceneDesc: 'Bawang Putih memilih labu berukuran kecil, tidak serakah mengambil labu besar.',
      },
      {
        panelNo: 4,
        caption: 'Kilau Permata Ketulusan Hati',
        dialogue: '“MasyaAllah, labu kecil ini berisi emas dan permata berkilauan!”',
        sceneDesc: 'Ketulusan Bawang Putih berbuah kebahagiaan, menyadarkan Bawang Merah untuk berubah menjadi baik.',
      },
    ],
    moralValue:
      'Ketulusan dalam bekerja, kesabaran, dan sifat tidak serakah akan selalu mendatangkan hasil terbaik pada waktunya.',
    dkvInsight:
      'Psikologi warna karakter: warna putih/kuning lembut melambangkan ketulusan, sedangkan merah menyala melambangkan sifat impulsif.',
  },
  {
    id: 'lutung_kasarung',
    number: 9,
    title: 'Lutung Kasarung & Purbasari',
    region: 'Jawa Barat',
    badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-400',
    accentHex: '#10b981',
    bgGradient: 'from-slate-900 via-emerald-950 to-teal-950',
    speechBubble: '“Kebaikan hati adalah kecantikan sejati yang tak pernah pudar!”',
    summary:
      'Persahabatan Putri Purbasari yang berhati lembut dengan Lutung Kasarung di hutan Pasundan hingga keadilan kembali tegak di kerajaan.',
    panels: [
      {
        panelNo: 1,
        caption: 'Purbasari di Hutan Pasundan',
        dialogue: '“Meski diasingkan di hutan, aku tetap bersyukur dan menyayangi sesama.”',
        sceneDesc: 'Purbasari tinggal di pondok sederhana ditemani hewan-hewan hutan yang ramah.',
      },
      {
        panelNo: 2,
        caption: 'Pertemuan dengan Lutung Kasarung',
        dialogue: '“Halo Lutung yang baik, terima kasih sudah membawakanku buah segar!”',
        sceneDesc: 'Seekor lutung hitam yang cerdas dan setia selalu menjaga dan menghibur Purbasari.',
      },
      {
        panelNo: 3,
        caption: 'Telaga Cahaya Bulan Purnama',
        dialogue: '“Air telaga kahyangan ini menyembuhkan dan memulihkan kesehatanku!”',
        sceneDesc: 'Lutung Kasarung memohon doa hingga tercipta telaga berair jernih berkilau di tengah hutan.',
      },
      {
        panelNo: 4,
        caption: 'Kembalinya Keadilan & Pengampunan',
        dialogue: '“Aku memaafkanmu, Kakak Purbararang. Mari membangun negeri bersama.”',
        sceneDesc: 'Lutung Kasarung kembali ke wujud pangeran Guru Minda, dan Purbasari memimpin dengan adil.',
      },
    ],
    moralValue:
      'Jangan menilai seseorang hanya dari tampilan luarnya (don’t judge a book by its cover); kebaikan hati dan pemaaf adalah mulia.',
    dkvInsight:
      'Pencahayaan magis (magical rim light): efek pendaran cahaya bulan pada permukaan air telaga menonjolkan nuansa keajaiban cerita.',
  },
  {
    id: 'keong_mas',
    number: 10,
    title: 'Keong Mas (Candra Kirana)',
    region: 'Jawa Timur',
    badgeColor: 'bg-yellow-100 text-yellow-900 border-yellow-400',
    accentHex: '#eab308',
    bgGradient: 'from-yellow-950 via-amber-900 to-slate-900',
    speechBubble: '“Cangkang keong emas ini menyimpan doa dan kesabaran yang tak putus.”',
    summary:
      'Kisah Putri Candra Kirana dari Kerajaan Kediri yang berubah menjadi Keong Mas dan dirawat oleh Mbok Rondo Dadapan yang baik hati.',
    panels: [
      {
        panelNo: 1,
        caption: 'Jala Mbok Rondo di Sungai Dadapan',
        dialogue: '“Indah sekali keong bercangkang emas ini, akan kurawat di tempayan rumah.”',
        sceneDesc: 'Mbok Rondo menjala ikan di sungai dan menemukan seekor keong berkilau keemasan.',
      },
      {
        panelNo: 2,
        caption: 'Hidangan Hangat di Meja Kayu',
        dialogue: '“Siapa yang setiap hari memasak dan membersihkan pondokku dengan rapi?”',
        sceneDesc: 'Saat pulang dari sungai, Mbok Rondo mendapati rumahnya bersih dan makanan telah siap.',
      },
      {
        panelNo: 3,
        caption: 'Wujud Asli Putri Candra Kirana',
        dialogue: '“Terima kasih Mbok Rondo telah menolongku dengan penuh kasih sayang.”',
        sceneDesc: 'Dari dalam cangkang Keong Mas keluarlah Putri Candra Kirana yang santun dan berbudi luhur.',
      },
      {
        panelNo: 4,
        caption: 'Pertemuan Kembali di Desa Dadapan',
        dialogue: '“Kesabaran dan doa akhirnya mempertemukan kita kembali!”',
        sceneDesc: 'Raden Inu Kertapati tiba di Desa Dadapan dan mengajak Mbok Rondo turut tinggal di istana.',
      },
    ],
    moralValue:
      'Berbuat baik tanpa pamrih di mana pun kita berada akan membuka jalan pertolongan di saat yang tak terduga.',
    dkvInsight:
      'Fokus objek (focal point): kilau warna emas hangat pada Keong Mas langsung menarik mata pembaca di tengah latar hijau sungai.',
  },
  {
    id: 'ande_ande_lumut',
    number: 11,
    title: 'Ande-Ande Lumut & Klenting Kuning',
    region: 'Jawa Timur / Jawa Tengah',
    badgeColor: 'bg-lime-100 text-lime-900 border-lime-400',
    accentHex: '#65a30d',
    bgGradient: 'from-lime-950 via-emerald-950 to-slate-900',
    speechBubble: '“Biarlah penampilanku sederhana, asal kehormatan dan janjiku tetap terjaga!”',
    summary:
      'Perjalanan Klenting Kuning menyeberangi sungai lebar dengan menjaga prinsip kehormatan diri hingga terpilih oleh Ande-Ande Lumut.',
    panels: [
      {
        panelNo: 1,
        caption: 'Kerja Keras Klenting Kuning',
        dialogue: '“Selesai mencuci kuali di sungai, aku akan ikut berangkat ke Desa Dadapan.”',
        sceneDesc: 'Klenting Kuning yang rajin mencuci peralatan dapur di tepi sungai dengan sabar.',
      },
      {
        panelNo: 2,
        caption: 'Sungai Meluap & Yuyu Kangkang',
        dialogue: '“Aku tidak mau melanggar prinsipku hanya demi menyeberang sungai!”',
        sceneDesc: 'Sungai meluap deras dan Klenting Kuning menolak syarat buruk dari kepiting raksasa Yuyu Kangkang.',
      },
      {
        panelNo: 3,
        caption: 'Pusaka Lidi Kuning Membelah Air',
        dialogue: '“Dengan izin Tuhan, surutlah air sungai ini agar kami bisa lewat!”',
        sceneDesc: 'Air sungai menyurut sehingga Klenting Kuning dapat menyeberang dengan aman dan terhormat.',
      },
      {
        panelNo: 4,
        caption: 'Pilihan Hati yang Melihat Ketulusan',
        dialogue: '“Bukan kemewahan luar yang kucari, melainkan kemuliaan budi pekerti.”',
        sceneDesc: 'Ande-Ande Lumut dan Ibu Mbok Rondo menyambut Klenting Kuning yang berhati mulia.',
      },
    ],
    moralValue:
      'Integritas dan prinsip kejujuran jauh lebih berharga daripada jalan pintas yang mengorbankan harga diri.',
    dkvInsight:
      'Kontras karakter: pakaian sederhana Klenting Kuning dibandingkan busana mencolok saudara-saudaranya memperjelas pesan cerita.',
  },
  {
    id: 'si_pitung',
    number: 12,
    title: 'Si Pitung Pendekar Betawi',
    region: 'DKI Jakarta',
    badgeColor: 'bg-red-100 text-red-800 border-red-300',
    accentHex: '#dc2626',
    bgGradient: 'from-red-950 via-orange-950 to-slate-900',
    speechBubble: '“Ilmu silat dan kepandaian ini kugunakan untuk membela warga yang lemah!”',
    summary:
      'Kisah legendaris pemuda Betawi dari Rawa Belong yang tekun mengaji, mahir bela diri silat, dan gemar menolong rakyat kecil.',
    panels: [
      {
        panelNo: 1,
        caption: 'Berguru Mengaji & Silat kepada Haji Naipin',
        dialogue: '“Gunakan ilmumu untuk menolong sesama dan menegakkan keadilan, Pitung!”',
        sceneDesc: 'Si Pitung berlatih jurus silat Betawi dan belajar ilmu agama dengan tekun.',
      },
      {
        panelNo: 2,
        caption: 'Membela Petani & Warga Kampung',
        dialogue: '“Jangan rampas hasil keringat petani kampung kami!”',
        sceneDesc: 'Dengan peci merah dan sarung terikat di pinggang, Si Pitung menghadang penindas warga.',
      },
      {
        panelNo: 3,
        caption: 'Berbagi Beras untuk Rakyat Kecil',
        dialogue: '“Silakan Bapak dan Ibu, semoga beras ini bermanfaat untuk keluarga.”',
        sceneDesc: 'Warga kampung Betawi tersenyum bahagia menerima bantuan pangan di depan rumah kebaya.',
      },
      {
        panelNo: 4,
        caption: 'Semangat Kepahlawanan yang Dikenang',
        dialogue: '“Keberanian membela kebenaran akan selalu hidup di hati rakyat!”',
        sceneDesc: 'Siluet gagah Si Pitung berdiri di atas atap genteng Batavia berlatar matahari senja.',
      },
    ],
    moralValue:
      'Ilmu pengetahuan dan keahlian yang kita miliki akan bernilai tinggi apabila bermanfaat untuk membantu masyarakat sekitar.',
    dkvInsight:
      'Sudut pandang low-angle (frog eye view): menggambar tokoh pendekar dari sudut bawah memberikan kesan gagah, berani, dan heroik.',
  },
  {
    id: 'putri_mandalika',
    number: 13,
    title: 'Putri Mandalika & Pantai Seger',
    region: 'Nusa Tenggara Barat',
    badgeColor: 'bg-teal-100 text-teal-800 border-teal-300',
    accentHex: '#14b8a6',
    bgGradient: 'from-teal-900 via-sky-950 to-slate-900',
    speechBubble: '“Aku milik seluruh rakyat Lombok! Jangan ada perpecahan di negeri kita!”',
    summary:
      'Kisah kebijaksanaan Putri Mandalika di Pulau Lombok yang mengutamakan persatuan dan perdamaian seluruh rakyat di atas kepentingan pribadi.',
    panels: [
      {
        panelNo: 1,
        caption: 'Negeri Lombok yang Damai & Makmur',
        dialogue: '“Rakyat hidup rukun dari pesisir pantai hingga lereng Gunung Rinjani.”',
        sceneDesc: 'Putri Mandalika dikenal sangat ramah, cerdas, dan peduli terhadap kesejahteraan rakyat.',
      },
      {
        panelNo: 2,
        caption: 'Ancaman Perselisihan Antar Kerajaan',
        dialogue: '“Jika aku memilih satu pihak, perang saudara akan pecah dan menyengsarakan rakyat.”',
        sceneDesc: 'Para pangeran datang melamar dan mengancam akan berperang jika lamaran mereka ditolak.',
      },
      {
        panelNo: 3,
        caption: 'Seruan Persatuan di Tebing Pantai Seger',
        dialogue: '“Wahai seluruh warga, bersatulah dan jagalah kedamaian tanah Lombok!”',
        sceneDesc: 'Di atas bukit karang Pantai Seger saat fajar, Putri Mandalika menyampaikan pesan perdamaian.',
      },
      {
        panelNo: 4,
        caption: 'Tradisi Bau Nyale yang Penuh Makna',
        dialogue: '“Kilau warna-warni di laut selatan mengingatkan kita pada pengorbanan sang putri.”',
        sceneDesc: 'Ombak laut selatan berkilau indah, menjadi tradisi tahunan kerukunan masyarakat Sasak.',
      },
    ],
    moralValue:
      'Persatuan, kerukunan, dan kepentingan bersama harus selalu dijunjung tinggi di atas ego maupun perpecahan kelompok.',
    dkvInsight:
      'Harmoni warna komplementer: perpaduan biru samudra dengan jingga matahari terbit di tebing Pantai Seger menciptakan komposisi dramatis.',
  },
  {
    id: 'la_dana',
    number: 14,
    title: 'La Dana & Kerbaunya yang Cerdik',
    region: 'Sulawesi Selatan',
    badgeColor: 'bg-orange-100 text-orange-900 border-orange-300',
    accentHex: '#ea580c',
    bgGradient: 'from-orange-950 via-amber-950 to-slate-900',
    speechBubble: '“Dengan logika dan perhitungan yang cermat, masalah rumit jadi mudah!”',
    summary:
      'Cerita rakyat Bugis-Makassar tentang pemuda bernama La Dana yang terkenal pandai berhitung, berpikir kritis, dan adil dalam menyelesaikan persoalan.',
    panels: [
      {
        panelNo: 1,
        caption: 'Pemuda Bugis yang Gemar Berpikir Logis',
        dialogue: '“Setiap persoalan pasti ada jalan keluarnya jika kita hitung dengan tenang.”',
        sceneDesc: 'La Dana duduk di bawah kolong rumah panggung Bugis sambil mengamati ternak warga.',
      },
      {
        panelNo: 2,
        caption: 'Kesepakatan Pembagian yang Adil',
        dialogue: '“Mari kita buat kesepakatan tertulis yang jelas agar tidak ada yang merugi.”',
        sceneDesc: 'La Dana berdiskusi dengan saudagar kerbau menggunakan perhitungan yang cerdas.',
      },
      {
        panelNo: 3,
        caption: 'Kecerdikan Mengatasi Kelicikan',
        dialogue: '“Sesuai aturan logika yang kita sepakati tadi, kerbau hidup ini tetap utuh!”',
        sceneDesc: 'Warga kampung kagum melihat cara La Dana mematahkan akal licik dengan logika sederhana.',
      },
      {
        panelNo: 4,
        caption: 'Berbagi Kebahagiaan di Kampung',
        dialogue: '“Akal sehat dan ilmu pengetahuan adalah harta yang paling berharga.”',
        sceneDesc: 'La Dana mengajak warga kampung bekerja sama mengelola peternakan dengan rukun.',
      },
    ],
    moralValue:
      'Berpikir komputasional, logis, dan teliti memahami aturan membuat kita tidak mudah tertipu dan mampu mengambil keputusan tepat.',
    dkvInsight:
      'Ekspresi wajah karakter (character expression): senyum percaya diri dan gestur tangan menunjuk mempertegas karakter tokoh yang cerdas.',
  },
  {
    id: 'cendrawasih',
    number: 15,
    title: 'Legenda Burung Cendrawasih (Kweiya)',
    region: 'Papua',
    badgeColor: 'bg-amber-100 text-amber-900 border-amber-400',
    accentHex: '#f59e0b',
    bgGradient: 'from-emerald-950 via-amber-950 to-slate-900',
    speechBubble: '“Kreativitas memintal serat kayu ini mengubah kesedihan menjadi sayap keemasan!”',
    summary:
      'Cerita rakyat dari Pegunungan Fakfak Papua tentang anak kreatif bernama Kweiya yang memintal serat kulit kayu hingga menjelma menjadi Burung Cendrawasih yang elok.',
    panels: [
      {
        panelNo: 1,
        caption: 'Kweiya yang Terampil Memintal Serat Kayu',
        dialogue: '“Serat kulit pohon ini akan kupintal menjadi benang yang kuat dan indah.”',
        sceneDesc: 'Di tepi hutan rimba Papua yang asri, Kweiya tekun merajut serat kulit kayu pilihan.',
      },
      {
        panelNo: 2,
        caption: 'Merangkai Sepasang Sayap Emas',
        dialogue: '“Setiap helai serat kurangkai dengan sabar menjadi sepasang sayap.”',
        sceneDesc: 'Kweiya menyematkan pintalan serat kayu di kedua lengannya di dalam rumah kayu.',
      },
      {
        panelNo: 3,
        caption: 'Terbang ke Puncak Pohon Rimba Papua',
        dialogue: '“Lihat! Kweiya mengepakkan sayap emas dan terbang ke pucuk pohon tinggi!”',
        sceneDesc: 'Bulu keemasan dan kuning zamrud berkilau indah saat Burung Cendrawasih terbang di langit Papua.',
      },
      {
        panelNo: 4,
        caption: 'Burung Surga Kebanggaan Nusantara',
        dialogue: '“Suara merdu dan keindahan Cendrawasih menjadi pengingat kasih sayang keluarga.”',
        sceneDesc: 'Sang Ibu memandang penuh haru ke arah Burung Cendrawasih yang bertengger anggun di dahan hutan.',
      },
    ],
    moralValue:
      'Kreativitas, ketekunan berkarya, dan kasih sayang terhadap saudara adalah keindahan sejati yang mengangkat derajat manusia.',
    dkvInsight:
      'Kekayaan tekstur & warna tropis: kombinasi hijau zamrud hutan Papua dengan ekor kuning-emas Cendrawasih menciptakan kontras visual memukau.',
  },
];

export interface ArtMagazineEdition {
  id: string;
  issueNumber: string;
  title: string;
  subtitle: string;
  category: string;
  coverThemeHex: string;
  secondaryHex: string;
  bgGradient: string;
  leadQuote: string;
  editorName: string;
  palette: Array<{ name: string; hex: string }>;
  highlights: Array<{
    rubric: string;
    heading: string;
    body: string;
  }>;
}

export const ART_DESIGN_MAGAZINES: ArtMagazineEdition[] = [
  {
    id: 'mag_tipografi',
    issueNumber: 'EDISI #01 • VOL. IV',
    title: 'AKSARA & RUANG: Eksperimen Tipografi Nusantara',
    subtitle: 'Memadukan Karakter Huruf Klasik Daerah dengan Grid Swiss Modern',
    category: 'Tipografi & Layout Editorial',
    coverThemeHex: '#ec4899',
    secondaryHex: '#f43f5e',
    bgGradient: 'from-rose-950 via-pink-900 to-slate-900',
    leadQuote: '“Tipografi yang baik tidak sekadar dibaca, melainkan dirasakan irama dan suaranya oleh mata pembaca.”',
    editorName: 'Redaksi Seni Visual Refleksia',
    palette: [
      { name: 'Magenta Editorial', hex: '#EC4899' },
      { name: 'Putih Kertas', hex: '#F8FAFC' },
      { name: 'Hitam Tinta', hex: '#0F172A' },
      { name: 'Kuning Stabilo', hex: '#FACC15' },
    ],
    highlights: [
      {
        rubric: 'FOKUS UTAMA',
        heading: 'Hierarki Visual dalam 3 Detik Pertama',
        body: 'Saat melihat poster atau sampul buku, mata manusia memindai judul utama (Headline), sub-judul, baru kemudian teks isi. Gunakan perbandingan ukuran minimal 1 : 1.618 (Golden Ratio) agar pesan langsung tertangkap.',
      },
      {
        rubric: 'TIPS STUDIO DKV',
        heading: 'Mengatur Kerning & Leading agar Nyaman Dibaca',
        body: 'Spasi antarbaris (leading) ideal untuk teks paragraf adalah 140%–160% dari ukuran font. Hindari menggabungkan lebih dari 2 jenis keluarga font dalam satu karya.',
      },
    ],
  },
  {
    id: 'mag_karawo',
    issueNumber: 'EDISI #02 • VOL. IV',
    title: 'KARAWO MODERN: Dari Sulaman Tangan ke Vektor Digital',
    subtitle: 'Transformasi Pola Geometris Khas Gorontalo untuk Identitas Visual Kontemporer',
    category: 'Seni Kriya & Kearifan Lokal',
    coverThemeHex: '#10b981',
    secondaryHex: '#059669',
    bgGradient: 'from-emerald-950 via-teal-900 to-slate-900',
    leadQuote: '“Setiap simpul benang Karawo adalah piksel budaya yang dirajut dengan kesabaran dan presisi matematika.”',
    editorName: 'Kurator Wastra & Grafis Gorontalo',
    palette: [
      { name: 'Zamrud Karawo', hex: '#10B981' },
      { name: 'Emas Hulontalo', hex: '#F59E0B' },
      { name: 'Ungu Alumbu', hex: '#7C3AED' },
      { name: 'Merah Marun', hex: '#BE123C' },
    ],
    highlights: [
      {
        rubric: ' EKSPLORASI MOTIF',
        heading: 'Struktur Grid di Balik Sulaman Karawo',
        body: 'Teknik iris-cabut benang pada kain Karawo membentuk grid piksel alami. Dalam software vektor, pola ini sangat cocok dikembangkan menggunakan prinsip perulangan (Looping) dan simetri.',
      },
      {
        rubric: 'APLIKASI DESAIN',
        heading: 'Penerapan Ornamen Lokal pada Kemasan & Merchandise',
        body: 'Cukup gunakan motif Karawo sebagai aksen tepi (border) sebesar 15%–20% dari bidang kanvas agar tampilan tetap minimalis, modern, dan berkelas.',
      },
    ],
  },
  {
    id: 'mag_fotografi',
    issueNumber: 'EDISI #03 • VOL. IV',
    title: 'CAHAYA GOLDEN HOUR: Melukis Cerita Lewat Lensa',
    subtitle: 'Teknik Komposisi Rule of Thirds, Leading Lines & Human Interest di Sudut Kota',
    category: 'Fotografi & Tata Cahaya',
    coverThemeHex: '#f59e0b',
    secondaryHex: '#ea580c',
    bgGradient: 'from-amber-950 via-orange-900 to-slate-900',
    leadQuote: '“Kamera terbaik adalah mata yang peka menangkap momen jujur di antara cahaya dan bayangan.”',
    editorName: 'Komunitas Fotografi Muda DKV',
    palette: [
      { name: 'Amber Senja', hex: '#F59E0B' },
      { name: 'Bayangan Biru', hex: '#1E293B' },
      { name: 'Jingga Hangat', hex: '#EA580C' },
      { name: 'Krem Lembut', hex: '#FEF3C7' },
    ],
    highlights: [
      {
        rubric: 'TEKNIK KOMPOSISI',
        heading: 'Memanfaatkan Garis Pemandu (Leading Lines)',
        body: 'Gunakan elemen jalan raya, jembatan sungai, atau deretan lampu taman untuk mengarahkan pandangan mata penikmat foto langsung menuju subjek utama.',
      },
      {
        rubric: 'SEGITIGA EKSPOSUR',
        heading: 'Harmoni ISO, Aperture, dan Shutter Speed',
        body: 'Ingin latar belakang blur estetik (bokeh)? Gunakan bukaan lensa lebar (f/1.8 – f/2.8). Ingin membekukan gerakan air mancur? Gunakan shutter speed cepat (1/500 detik ke atas).',
      },
    ],
  },
  {
    id: 'mag_ilustrasi',
    issueNumber: 'EDISI #04 • VOL. IV',
    title: 'ATMOSFER & WARNA: Rahasia Ilustrasi Dunia Imajinasi',
    subtitle: 'Merancang Palet Warna Emosional, Perspektif Isometrik & Desain Karakter Ekspresif',
    category: 'Ilustrasi Digital & Konsep Seni',
    coverThemeHex: '#6366f1',
    secondaryHex: '#06b6d4',
    bgGradient: 'from-indigo-950 via-cyan-950 to-slate-900',
    leadQuote: '“Warna mampu berbicara lebih cepat kepada perasaan manusia sebelum satu kata pun sempat terbaca.”',
    editorName: 'Studio Ilustrasi Refleksia',
    palette: [
      { name: 'Indigo Malam', hex: '#6366F1' },
      { name: 'Sian Bercahaya', hex: '#06B6D4' },
      { name: 'Koral Hangat', hex: '#FB7185' },
      { name: 'Ungu Kosmik', hex: '#A855F7' },
    ],
    highlights: [
      {
        rubric: 'TEORI WARNA',
        heading: 'Aturan 60-30-10 dalam Pewarnaan Digital',
        body: 'Gunakan 60% warna dominan (suasana latar), 30% warna sekunder (elemen pendukung), dan 10% warna aksen kontras tinggi untuk menonjolkan karakter atau tombol penting.',
      },
      {
        rubric: 'MANAJEMEN LAYER',
        heading: 'Struktur Layer Rapi dengan Prinsip Stack',
        body: 'Pisahkan layer Sketsa, Lineart, Base Color, Shading (Multiply), dan Highlight (Add/Screen) agar proses revisi cepat dan efisien.',
      },
    ],
  },
  {
    id: 'mag_branding',
    issueNumber: 'EDISI #05 • VOL. IV',
    title: 'WAJAH PRODUK LOKAL: Revolusi Desain Kemasan UMKM',
    subtitle: 'Riset Data-Driven Design untuk Menciptakan Kemasan yang Menarik & Ramah Lingkungan',
    category: 'Branding & Desain Kemasan',
    coverThemeHex: '#14b8a6',
    secondaryHex: '#eab308',
    bgGradient: 'from-teal-950 via-emerald-900 to-slate-900',
    leadQuote: '“Kemasan yang dirancang dengan riset data bukan sekadar pembungkus, melainkan wiraniaga bisu terbaik di rak toko.”',
    editorName: 'Lab Riset Kemasan & Branding',
    palette: [
      { name: 'Hijau Daun Segar', hex: '#14B8A6' },
      { name: 'Kuning Kunyit', hex: '#EAB308' },
      { name: 'Cokelat Kraft', hex: '#B45309' },
      { name: 'Putih Bersih', hex: '#FFFFFF' },
    ],
    highlights: [
      {
        rubric: 'DATA-DRIVEN DESIGN',
        heading: 'Mengapa Riset Audiens Wajib Sebelum Sketsa?',
        body: 'Melalui survei singkat terhadap calon pembeli, desainer dapat mengetahui warna dan informasi apa yang paling dicari (seperti label Halal, komposisi, dan ilustrasi rasa).',
      },
      {
        rubric: 'PRODUKSI CETAK',
        heading: 'Checklist Pra-Cetak: CMYK, Bleed 3mm & Resolusi 300 DPI',
        body: 'Pastikan selalu menggunakan mode warna CMYK dan menyiapkan batas potong (bleed) minimal 3 mm agar hasil cetak kemasan tidak bertepi putih.',
      },
    ],
  },
  {
    id: 'mag_sinema',
    issueNumber: 'EDISI #06 • VOL. IV',
    title: 'BINGKAI CERITA: Seni Storyboard & Color Grading Film Pendek',
    subtitle: 'Merancang Alur Visual, Pergerakan Kamera & Mood Sinematik Sejak Tahap Pra-Produksi',
    category: 'Sinematografi & Motion Graphic',
    coverThemeHex: '#0ea5e9',
    secondaryHex: '#f97316',
    bgGradient: 'from-sky-950 via-slate-900 to-orange-950',
    leadQuote: '“Film yang kuat selesai ditulis di atas kertas storyboard sebelum kamera pertama kali dinyalakan.”',
    editorName: 'Sinema Kreatif Menara Studio',
    palette: [
      { name: 'Teal Sinematik', hex: '#0EA5E9' },
      { name: 'Orange Skin Tone', hex: '#F97316' },
      { name: 'Hitam Letterbox', hex: '#090D16' },
      { name: 'Abu Netral', hex: '#64748B' },
    ],
    highlights: [
      {
        rubric: 'PRA-PRODUKSI',
        heading: 'Kekuatan Storyboard Berurutan (Sequential)',
        body: 'Storyboard memetakan setiap adegan secara berurutan lengkap dengan ukuran shot (Wide Shot, Medium Shot, Close Up) dan arah gerak kamera (Pan, Tilt, Tracking).',
      },
      {
        rubric: 'PASCA-PRODUKSI',
        heading: 'Harmoni Teal & Orange pada Color Grading',
        body: 'Memberikan nuansa biru-hijau (teal) pada area bayangan dan menjaga rona hangat (orange) pada warna kulit membuat subjek manusia tampil menonjol dari latar.',
      },
    ],
  },
  {
    id: 'mag_minimalis',
    issueNumber: 'EDISI #07 • VOL. IV',
    title: 'GEOMETRI & RUANG KOSONG: Estetika Desain Minimalis',
    subtitle: 'Belajar dari Aliran Bauhaus: Bentuk Mengikuti Fungsi (Form Follows Function)',
    category: 'Sejarah Seni & Desain Minimalis',
    coverThemeHex: '#38bdf8',
    secondaryHex: '#facc15',
    bgGradient: 'from-slate-950 via-sky-950 to-indigo-950',
    leadQuote: '“Kesempurnaan desain dicapai bukan ketika tidak ada lagi yang bisa ditambahkan, melainkan ketika tidak ada lagi yang perlu dikurangi.”',
    editorName: 'Lab DKV Minimalis Modern',
    palette: [
      { name: 'Biru Sian Atom', hex: '#38BDF8' },
      { name: 'Kuning Primer', hex: '#FACC15' },
      { name: 'Merah Bauhaus', hex: '#EF4444' },
      { name: 'Abu Antrasit', hex: '#1E293B' },
    ],
    highlights: [
      {
        rubric: 'PRINSIP MINIMALISME',
        heading: 'Peran Penting White Space (Ruang Negatif)',
        body: 'Ruang kosong bukanlah ruang yang terbuang. White space memberi ruang bernapas bagi mata sehingga elemen utama terlihat elegan, bersih, dan fokus.',
      },
      {
        rubric: 'IKONOGRAFI',
        heading: 'Menyederhanakan Ide Kompleks Menjadi Simbol',
        body: 'Logo yang ikonik mampu dikenali bahkan saat diperkecil hingga ukuran 16×16 piksel berkat penggunaan bentuk dasar geometris (lingkaran, segitiga, persegi).',
      },
    ],
  },
];

export const renderFolkloreComicIllustration = (comicId: string) => {
  switch (comicId) {
    case 'malin_kundang':
      return (
        <svg viewBox="0 0 360 190" className="w-full h-full">
          <defs>
            <linearGradient id="mkSky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1e1b4b" />
              <stop offset="55%" stopColor="#7c2d12" />
              <stop offset="100%" stopColor="#f59e0b" />
            </linearGradient>
          </defs>
          <rect width="360" height="190" fill="url(#mkSky)" />
          {/* Sun & Lightning */}
          <circle cx="290" cy="52" r="24" fill="#fde047" opacity="0.85" />
          <polyline points="85,12 68,52 88,54 64,98" fill="none" stroke="#fef08a" strokeWidth="3.5" />
          {/* Sea waves */}
          <path d="M0 132 Q45 118 90 132 T180 132 T270 132 T360 132 L360 190 L0 190 Z" fill="#0369a1" />
          <path d="M0 152 Q50 138 100 152 T200 152 T300 152 T360 152 L360 190 L0 190 Z" fill="#0c4a6e" />
          {/* Grand Wooden Ship & Sails */}
          <polygon points="155,128 275,128 255,152 175,152" fill="#78350f" stroke="#fbbf24" strokeWidth="2" />
          <line x1="215" y1="44" x2="215" y2="128" stroke="#fef3c7" strokeWidth="3.5" />
          <path d="M215 48 Q258 75 215 116 Z" fill="#fef3c7" />
          <path d="M211 56 Q172 82 211 116 Z" fill="#fde68a" />
          {/* Pantai Air Manis & Stone figure */}
          <path d="M0 142 Q75 135 125 168 L125 190 L0 190 Z" fill="#b45309" />
          <ellipse cx="68" cy="154" rx="22" ry="12" fill="#64748b" stroke="#94a3b8" strokeWidth="2" />
          <circle cx="56" cy="146" r="7" fill="#64748b" stroke="#cbd5e1" strokeWidth="1.5" />
          {/* Rope & Anchor motif */}
          <circle cx="92" cy="162" r="8" fill="none" stroke="#cbd5e1" strokeWidth="2.5" strokeDasharray="4 2" />
        </svg>
      );

    case 'timun_mas':
      return (
        <svg viewBox="0 0 360 190" className="w-full h-full">
          <rect width="360" height="190" fill="#064e3b" />
          <circle cx="65" cy="48" r="34" fill="#10b981" opacity="0.25" />
          {/* Giant Buto Ijo silhouette in background */}
          <circle cx="275" cy="70" r="32" fill="#15803d" stroke="#4ade80" strokeWidth="2" />
          <circle cx="264" cy="64" r="4.5" fill="#fef08a" />
          <circle cx="286" cy="64" r="4.5" fill="#fef08a" />
          <path d="M235 155 Q275 95 315 155 Z" fill="#166534" />
          {/* Bamboo forest */}
          {[32, 58, 86, 114, 198, 222].map((bx, i) => (
            <g key={i}>
              <rect x={bx} y="18" width="8" height="145" rx="3" fill="#34d399" opacity={0.75} />
              <line x1={bx} y1="55" x2={bx + 8} y2="55" stroke="#065f46" strokeWidth="2" />
              <line x1={bx} y1="95" x2={bx + 8} y2="95" stroke="#065f46" strokeWidth="2" />
            </g>
          ))}
          {/* Golden Cucumber & 4 Magic Pouches */}
          <ellipse cx="152" cy="132" rx="36" ry="20" fill="#fbbf24" stroke="#fef08a" strokeWidth="2.5" />
          <path d="M124 132 Q152 118 180 132" fill="none" stroke="#f59e0b" strokeWidth="2" />
          {/* Timun Mas character */}
          <circle cx="152" cy="88" r="13" fill="#fde68a" />
          <path d="M138 124 Q152 98 166 124 Z" fill="#f43f5e" />
          {/* 4 glowing magic seeds floating */}
          <circle cx="118" cy="72" r="6" fill="#fde047" />
          <circle cx="138" cy="56" r="6" fill="#38bdf8" />
          <circle cx="164" cy="56" r="6" fill="#f8fafc" />
          <circle cx="184" cy="72" r="6" fill="#fb7185" />
          <rect x="0" y="152" width="360" height="38" fill="#022c22" />
        </svg>
      );

    case 'sangkuriang':
      return (
        <svg viewBox="0 0 360 190" className="w-full h-full">
          <defs>
            <linearGradient id="skSky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1e1b4b" />
              <stop offset="65%" stopColor="#4338ca" />
              <stop offset="100%" stopColor="#fb7185" />
            </linearGradient>
          </defs>
          <rect width="360" height="190" fill="url(#skSky)" />
          {/* Dawn sun rays at eastern horizon */}
          <circle cx="305" cy="126" r="28" fill="#fde047" opacity="0.9" />
          {/* Iconic Tangkuban Perahu overturned boat mountain */}
          <polygon points="55,142 120,68 245,68 310,142" fill="#312e81" stroke="#818cf8" strokeWidth="2.5" />
          <path d="M120,68 Q182,82 245,68" fill="none" stroke="#c7d2fe" strokeWidth="3" />
          {/* Lake Citarum water */}
          <rect x="0" y="142" width="360" height="48" fill="#1e3a8a" />
          <path d="M25 158 L140 158 M190 166 L320 166" stroke="#93c5fd" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );

    case 'roro_jonggrang':
      return (
        <svg viewBox="0 0 360 190" className="w-full h-full">
          <defs>
            <linearGradient id="rjSky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2e1065" />
              <stop offset="65%" stopColor="#701a75" />
              <stop offset="100%" stopColor="#f59e0b" />
            </linearGradient>
          </defs>
          <rect width="360" height="190" fill="url(#rjSky)" />
          <circle cx="72" cy="46" r="20" fill="#fef9c3" opacity="0.9" />
          {/* Prambanan Temple Silhouettes */}
          {[75, 125, 180, 235, 285].map((tx, idx) => {
            const h = idx === 2 ? 112 : idx === 1 || idx === 3 ? 86 : 64;
            const w = idx === 2 ? 42 : 30;
            const y = 156 - h;
            return (
              <g key={idx}>
                <polygon
                  points={`${tx - w / 2},156 ${tx},${y} ${tx + w / 2},156`}
                  fill="#1e1b4b"
                  stroke="#f59e0b"
                  strokeWidth="1.5"
                />
                <circle cx={tx} cy={y} r="4" fill="#fde047" />
              </g>
            );
          })}
          <rect x="0" y="156" width="360" height="34" fill="#0f172a" />
        </svg>
      );

    case 'danau_toba':
      return (
        <svg viewBox="0 0 360 190" className="w-full h-full">
          <rect width="360" height="190" fill="#083344" />
          {/* Surrounding green caldera hills */}
          <path d="M0 115 Q65 55 140 115 T280 110 T360 115 L360 190 L0 190 Z" fill="#065f46" />
          {/* Lake Toba */}
          <rect x="0" y="112" width="360" height="78" fill="#0284c7" />
          {/* Samosir Island in center */}
          <path d="M115 138 Q180 94 245 138 Z" fill="#10b981" stroke="#a7f3d0" strokeWidth="2" />
          {/* Batak Rumah Bolon curved roof on island */}
          <path d="M162 118 Q180 132 198 118 L192 132 L168 132 Z" fill="#78350f" stroke="#fde047" strokeWidth="1.5" />
          {/* Golden Fish jumping */}
          <ellipse cx="78" cy="148" rx="18" ry="8" fill="#fbbf24" stroke="#fef08a" strokeWidth="2" />
          <polygon points="56,148 44,140 44,156" fill="#f59e0b" />
          <circle cx="88" cy="146" r="2" fill="#0f172a" />
        </svg>
      );

    case 'lahilote':
      return (
        <svg viewBox="0 0 360 190" className="w-full h-full">
          <defs>
            <linearGradient id="lhSky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0284c7" />
              <stop offset="65%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#fef08a" />
            </linearGradient>
          </defs>
          <rect width="360" height="190" fill="url(#lhSky)" />
          {/* Clouds */}
          <ellipse cx="80" cy="48" rx="34" ry="14" fill="#ffffff" opacity="0.85" />
          <ellipse cx="280" cy="42" rx="38" ry="15" fill="#ffffff" opacity="0.85" />
          {/* Lahilote flying with woven rattan wings */}
          <path d="M180 76 Q125 42 105 84 Q142 92 180 76 Z" fill="#d97706" stroke="#fef3c7" strokeWidth="2" />
          <path d="M180 76 Q235 42 255 84 Q218 92 180 76 Z" fill="#d97706" stroke="#fef3c7" strokeWidth="2" />
          <circle cx="180" cy="64" r="10" fill="#fde68a" />
          <rect x="172" y="74" width="16" height="22" rx="4" fill="#0d9488" />
          {/* Pantai Pohe Sea & Footprint Rock */}
          <rect x="0" y="138" width="360" height="52" fill="#0369a1" />
          <ellipse cx="265" cy="156" rx="44" ry="20" fill="#d6d3d1" stroke="#78716c" strokeWidth="2.5" />
          {/* Footprint carved on stone */}
          <ellipse cx="265" cy="158" rx="12" ry="6" fill="#78716c" />
          <circle cx="250" cy="155" r="2.2" fill="#78716c" />
          <circle cx="251" cy="160" r="2" fill="#78716c" />
        </svg>
      );

    case 'danau_limboto':
      return (
        <svg viewBox="0 0 360 190" className="w-full h-full">
          <rect width="360" height="190" fill="#0f766e" />
          {/* Gorontalo hills */}
          <path d="M0 110 Q90 60 180 105 T360 98 L360 190 L0 190 Z" fill="#115e59" />
          {/* Calm Limboto Lake */}
          <rect x="0" y="110" width="360" height="80" fill="#0d9488" />
          {/* Glowing Tupalo Pearl & Lotus */}
          <circle cx="180" cy="96" r="28" fill="#5eead4" opacity="0.3" />
          <circle cx="180" cy="96" r="15" fill="#f0fdfa" stroke="#fde047" strokeWidth="2.5" />
          {/* Traditional Gorontalo Canoe & Water lilies */}
          <ellipse cx="95" cy="152" rx="18" ry="6" fill="#10b981" />
          <circle cx="95" cy="148" r="5" fill="#f472b6" />
          <ellipse cx="265" cy="146" rx="20" ry="6" fill="#10b981" />
          <circle cx="265" cy="142" r="5" fill="#fde047" />
        </svg>
      );

    case 'bawang_merah_putih':
      return (
        <svg viewBox="0 0 360 190" className="w-full h-full">
          <rect width="360" height="190" fill="#4c0519" />
          {/* River & Forest */}
          <path d="M0 130 Q180 110 360 135 L360 190 L0 190 Z" fill="#065f46" />
          <path d="M0 155 Q120 135 260 190 L0 190 Z" fill="#38bdf8" opacity="0.8" />
          {/* Golden Pumpkin bursting with jewels */}
          <ellipse cx="180" cy="112" rx="42" ry="32" fill="#f59e0b" stroke="#fef08a" strokeWidth="3" />
          <path d="M180 80 L180 144 M155 85 Q140 112 155 140 M205 85 Q220 112 205 140" fill="none" stroke="#b45309" strokeWidth="2" />
          {/* Sparkling jewels */}
          <polygon points="180,42 186,56 200,56 189,64 193,78 180,69 167,78 171,64 160,56 174,56" fill="#fde047" />
          <circle cx="135" cy="68" r="6" fill="#38bdf8" />
          <circle cx="225" cy="68" r="6" fill="#f43f5e" />
        </svg>
      );

    case 'lutung_kasarung':
      return (
        <svg viewBox="0 0 360 190" className="w-full h-full">
          <rect width="360" height="190" fill="#022c22" />
          {/* Full moon */}
          <circle cx="280" cy="52" r="28" fill="#fef9c3" opacity="0.9" />
          {/* Magical glowing pond */}
          <ellipse cx="180" cy="150" rx="115" ry="26" fill="#2dd4bf" stroke="#99f6e4" strokeWidth="2.5" />
          {/* Lutung Kasarung & Purbasari */}
          <circle cx="145" cy="95" r="14" fill="#1e293b" stroke="#94a3b8" strokeWidth="2" />
          <circle cx="140" cy="93" r="2.5" fill="#fde047" />
          <circle cx="150" cy="93" r="2.5" fill="#fde047" />
          <path d="M128 135 Q145 105 162 135 Z" fill="#0f172a" />
          <circle cx="210" cy="92" r="13" fill="#fde68a" />
          <path d="M194 135 Q210 102 226 135 Z" fill="#10b981" stroke="#fde047" strokeWidth="1.5" />
        </svg>
      );

    case 'keong_mas':
      return (
        <svg viewBox="0 0 360 190" className="w-full h-full">
          <rect width="360" height="190" fill="#422006" />
          <rect x="0" y="128" width="360" height="62" fill="#0284c7" />
          {/* Giant Golden Snail Shell */}
          <circle cx="180" cy="98" r="46" fill="#facc15" stroke="#fef9c3" strokeWidth="3" />
          <circle cx="180" cy="98" r="30" fill="#eab308" stroke="#fef08a" strokeWidth="2" />
          <circle cx="180" cy="98" r="15" fill="#ca8a04" stroke="#fef08a" strokeWidth="2" />
          {/* Sparkles around Keong Mas */}
          <circle cx="110" cy="64" r="5" fill="#fef08a" />
          <circle cx="250" cy="60" r="6" fill="#fef08a" />
          <circle cx="265" cy="108" r="4" fill="#fef08a" />
        </svg>
      );

    case 'ande_ande_lumut':
      return (
        <svg viewBox="0 0 360 190" className="w-full h-full">
          <rect width="360" height="190" fill="#1a2e05" />
          {/* Parted River Waters */}
          <path d="M0 115 L135 115 L115 190 L0 190 Z" fill="#0284c7" />
          <path d="M225 115 L360 115 L360 190 L245 190 Z" fill="#0284c7" />
          {/* Golden Path in center & Yellow Wand */}
          <polygon points="135,115 225,115 245,190 115,190" fill="#fde047" opacity="0.85" />
          <line x1="180" y1="45" x2="180" y2="125" stroke="#fef08a" strokeWidth="4" />
          <circle cx="180" cy="45" r="10" fill="#facc15" stroke="#ffffff" strokeWidth="2" />
        </svg>
      );

    case 'si_pitung':
      return (
        <svg viewBox="0 0 360 190" className="w-full h-full">
          <rect width="360" height="190" fill="#7f1d1d" />
          {/* Sunset disk */}
          <circle cx="180" cy="92" r="54" fill="#f97316" opacity="0.85" />
          {/* Betawi Gigi Balang ornament header */}
          <path d="M0 0 L360 0 L360 18 L345 28 L330 18 L315 28 L300 18 L285 28 L270 18 L255 28 L240 18 L225 28 L210 18 L195 28 L180 18 L165 28 L150 18 L135 28 L120 18 L105 28 L90 18 L75 28 L60 18 L45 28 L30 18 L15 28 L0 18 Z" fill="#facc15" />
          {/* Si Pitung martial arts silhouette */}
          <circle cx="180" cy="76" r="14" fill="#fde68a" />
          <path d="M166 70 L194 70 L190 58 L170 58 Z" fill="#dc2626" />
          <path d="M150 138 L180 90 L210 138 Z" fill="#1e293b" />
          <line x1="142" y1="104" x2="218" y2="96" stroke="#10b981" strokeWidth="5" strokeLinecap="round" />
          <rect x="0" y="138" width="360" height="52" fill="#450a0a" />
        </svg>
      );

    case 'putri_mandalika':
      return (
        <svg viewBox="0 0 360 190" className="w-full h-full">
          <rect width="360" height="190" fill="#0f172a" />
          <circle cx="270" cy="58" r="28" fill="#fb923c" opacity="0.85" />
          {/* Seger Cliff */}
          <polygon points="0,78 135,88 165,190 0,190" fill="#334155" />
          {/* Princess figure on cliff */}
          <circle cx="115" cy="56" r="10" fill="#fde68a" />
          <path d="M102 88 L115 66 L128 88 Z" fill="#2dd4bf" />
          {/* Glowing colorful Nyale sea */}
          <rect x="145" y="130" width="215" height="60" fill="#0369a1" />
          <path d="M165 148 Q210 136 255 148 T340 148" fill="none" stroke="#f472b6" strokeWidth="3" />
          <path d="M175 164 Q220 152 265 164 T345 164" fill="none" stroke="#fde047" strokeWidth="3" />
          <path d="M160 176 Q215 166 270 176 T335 176" fill="none" stroke="#34d399" strokeWidth="3" />
        </svg>
      );

    case 'la_dana':
      return (
        <svg viewBox="0 0 360 190" className="w-full h-full">
          <rect width="360" height="190" fill="#431407" />
          <rect x="0" y="136" width="360" height="54" fill="#15803d" />
          {/* Bugis Stilt House Roof */}
          <polygon points="40,86 110,42 180,86" fill="#9a3412" stroke="#fdba74" strokeWidth="2" />
          <rect x="58" y="86" width="104" height="36" fill="#b45309" />
          {/* Horned Water Buffalo (Tedong) */}
          <ellipse cx="255" cy="118" rx="34" ry="22" fill="#334155" stroke="#cbd5e1" strokeWidth="2" />
          <circle cx="222" cy="108" r="14" fill="#475569" />
          <path d="M204 92 Q222 112 240 92" fill="none" stroke="#fef08a" strokeWidth="4" strokeLinecap="round" />
        </svg>
      );

    case 'cendrawasih':
    default:
      return (
        <svg viewBox="0 0 360 190" className="w-full h-full">
          <rect width="360" height="190" fill="#064e3b" />
          <circle cx="180" cy="95" r="64" fill="#10b981" opacity="0.2" />
          {/* Golden Bird of Paradise (Cendrawasih) */}
          <path d="M180 86 Q115 35 78 78 Q130 98 180 86 Z" fill="#f59e0b" stroke="#fef08a" strokeWidth="2" />
          <path d="M180 86 Q245 35 282 78 Q230 98 180 86 Z" fill="#f59e0b" stroke="#fef08a" strokeWidth="2" />
          <ellipse cx="180" cy="88" rx="16" ry="22" fill="#b45309" />
          <circle cx="180" cy="64" r="11" fill="#fde047" />
          <circle cx="180" cy="74" r="8" fill="#059669" />
          {/* Flowing golden tail plumes */}
          <path d="M174 108 Q145 155 105 168" fill="none" stroke="#fde047" strokeWidth="4" strokeLinecap="round" />
          <path d="M180 108 Q180 160 180 176" fill="none" stroke="#fbbf24" strokeWidth="4" strokeLinecap="round" />
          <path d="M186 108 Q215 155 255 168" fill="none" stroke="#fde047" strokeWidth="4" strokeLinecap="round" />
        </svg>
      );
  }
};

export const renderArtMagazineIllustration = (magId: string) => {
  switch (magId) {
    case 'mag_tipografi':
      return (
        <svg viewBox="0 0 400 200" className="w-full h-full">
          <rect width="400" height="200" fill="#0f172a" />
          {/* Swiss Grid Lines */}
          <line x1="80" y1="0" x2="80" y2="200" stroke="#334155" strokeWidth="1" strokeDasharray="4 4" />
          <line x1="200" y1="0" x2="200" y2="200" stroke="#334155" strokeWidth="1" strokeDasharray="4 4" />
          <line x1="320" y1="0" x2="320" y2="200" stroke="#334155" strokeWidth="1" strokeDasharray="4 4" />
          <line x1="0" y1="100" x2="400" y2="100" stroke="#334155" strokeWidth="1" strokeDasharray="4 4" />
          {/* Geometric Typography Shapes */}
          <circle cx="135" cy="100" r="56" fill="#ec4899" opacity="0.85" />
          <rect x="215" y="45" width="95" height="110" rx="12" fill="#facc15" opacity="0.9" />
          <text x="102" y="128" fill="#ffffff" fontSize="82" fontWeight="900" fontFamily="serif">
            Aa
          </text>
          <text x="232" y="112" fill="#0f172a" fontSize="32" fontWeight="900" fontFamily="sans-serif">
            DKV
          </text>
          <text x="232" y="138" fill="#0f172a" fontSize="14" fontWeight="700" fontFamily="monospace">
            1.618 GRID
          </text>
        </svg>
      );

    case 'mag_karawo':
      return (
        <svg viewBox="0 0 400 200" className="w-full h-full">
          <rect width="400" height="200" fill="#064e3b" />
          {/* Karawo Geometric Diamond Embroidery Grid */}
          {[80, 160, 240, 320].map((cx, i) => (
            <g key={i}>
              <polygon
                points={`${cx},38 ${cx + 42},100 ${cx},162 ${cx - 42},100`}
                fill="none"
                stroke="#fde047"
                strokeWidth="3"
              />
              <polygon
                points={`${cx},62 ${cx + 24},100 ${cx},138 ${cx - 24},100`}
                fill={i % 2 === 0 ? '#10b981' : '#f43f5e'}
                stroke="#ffffff"
                strokeWidth="1.5"
              />
              <circle cx={cx} cy="100" r="6" fill="#fef08a" />
            </g>
          ))}
        </svg>
      );

    case 'mag_fotografi':
      return (
        <svg viewBox="0 0 400 200" className="w-full h-full">
          <rect width="400" height="200" fill="#1e293b" />
          <circle cx="290" cy="65" r="45" fill="#f59e0b" opacity="0.75" />
          {/* Rule of Thirds Grid */}
          <line x1="133" y1="0" x2="133" y2="200" stroke="#fde047" strokeWidth="1" opacity="0.5" />
          <line x1="266" y1="0" x2="266" y2="200" stroke="#fde047" strokeWidth="1" opacity="0.5" />
          <line x1="0" y1="66" x2="400" y2="66" stroke="#fde047" strokeWidth="1" opacity="0.5" />
          <line x1="0" y1="133" x2="400" y2="133" stroke="#fde047" strokeWidth="1" opacity="0.5" />
          {/* Camera Aperture Lens */}
          <circle cx="170" cy="105" r="52" fill="#0f172a" stroke="#f8fafc" strokeWidth="4" />
          <circle cx="170" cy="105" r="32" fill="#0284c7" stroke="#38bdf8" strokeWidth="3" />
          <circle cx="158" cy="92" r="8" fill="#ffffff" opacity="0.8" />
        </svg>
      );

    case 'mag_ilustrasi':
      return (
        <svg viewBox="0 0 400 200" className="w-full h-full">
          <rect width="400" height="200" fill="#1e1b4b" />
          {/* Color Wheel & Digital Pen */}
          <circle cx="140" cy="100" r="55" fill="#ec4899" opacity="0.75" />
          <circle cx="195" cy="85" r="55" fill="#06b6d4" opacity="0.75" />
          <circle cx="170" cy="128" r="50" fill="#facc15" opacity="0.75" />
          {/* Stylus Pen */}
          <line x1="245" y1="150" x2="345" y2="42" stroke="#f8fafc" strokeWidth="10" strokeLinecap="round" />
          <polygon points="240,155 232,166 248,160" fill="#fde047" />
        </svg>
      );

    case 'mag_branding':
      return (
        <svg viewBox="0 0 400 200" className="w-full h-full">
          <rect width="400" height="200" fill="#042f2e" />
          {/* 3D Isometric Packaging Box & Bar Chart */}
          <polygon points="130,52 195,82 130,112 65,82" fill="#fde047" />
          <polygon points="65,82 130,112 130,170 65,140" fill="#eab308" />
          <polygon points="195,82 130,112 130,170 195,140" fill="#ca8a04" />
          {/* Data-Driven Bar Chart */}
          <rect x="245" y="115" width="22" height="50" rx="4" fill="#2dd4bf" />
          <rect x="280" y="85" width="22" height="80" rx="4" fill="#38bdf8" />
          <rect x="315" y="52" width="22" height="113" rx="4" fill="#facc15" />
        </svg>
      );

    case 'mag_sinema':
      return (
        <svg viewBox="0 0 400 200" className="w-full h-full">
          <rect width="400" height="200" fill="#090d16" />
          {/* Clapperboard & Film Strip */}
          <rect x="95" y="68" width="210" height="102" rx="10" fill="#1e293b" stroke="#38bdf8" strokeWidth="2.5" />
          <rect x="95" y="42" width="210" height="26" rx="5" fill="#f97316" />
          {[115, 155, 195, 235, 275].map((sx, i) => (
            <polygon key={i} points={`${sx},42 ${sx + 18},42 ${sx + 8},68 ${sx - 10},68`} fill="#0f172a" />
          ))}
          <circle cx="200" cy="118" r="24" fill="#0ea5e9" opacity="0.85" />
          <polygon points="194,106 194,130 214,118" fill="#ffffff" />
        </svg>
      );

    case 'mag_minimalis':
    default:
      return (
        <svg viewBox="0 0 400 200" className="w-full h-full">
          <rect width="400" height="200" fill="#0f172a" />
          {/* Bauhaus Primary Shapes + Atom Orbit */}
          <circle cx="115" cy="100" r="46" fill="#ef4444" />
          <rect x="175" y="54" width="92" height="92" fill="#facc15" />
          <polygon points="330,52 380,146 280,146" fill="#38bdf8" />
        </svg>
      );
  }
};
