const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  PageBreak, Header, Footer, PageNumber, NumberFormat,
  AlignmentType, HeadingLevel, WidthType, BorderStyle, ShadingType,
  PageOrientation, TableLayoutType, TableOfContents, LevelFormat,
  SectionType,
} = require("docx");
const fs = require("fs");

// ──────────────────────────────────────────
// EMERALD/TEAL PALETTE (matching the app)
// ──────────────────────────────────────────
const palette = {
  bg: "0A2E1F",          // deep emerald dark
  titleColor: "FFFFFF",
  subtitleColor: "A7D8C8",
  metaColor: "7FBFA8",
  accent: "10B981",      // emerald-500
  footerColor: "5AA88C",
  // Body page colors
  primary: "064E3B",     // emerald-900
  body: "1F2937",        // gray-800
  secondary: "6B7280",   // gray-500
  accentLight: "10B981", // emerald-500
  surface: "ECFDF5",     // emerald-50
  // Table colors
  tableHeaderBg: "064E3B",
  tableHeaderText: "FFFFFF",
  tableAccent: "10B981",
  tableInnerLine: "D1D5DB",
  tableSurface: "F0FDF4",
};

// Border helpers
const NB = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const noBorders = { top: NB, bottom: NB, left: NB, right: NB };
const allNoBorders = { top: NB, bottom: NB, left: NB, right: NB, insideHorizontal: NB, insideVertical: NB };

// ──────────────────────────────────────────
// HELPER FUNCTIONS
// ──────────────────────────────────────────
function c(hex) { return hex.replace("#", ""); }

function bodyPara(text, opts = {}) {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    indent: { firstLine: 480 },
    spacing: { line: 312, after: 80 },
    keepNext: opts.keepNext || false,
    children: [
      new TextRun({
        text: text,
        size: 24,
        font: { ascii: "Calibri" },
        color: c(palette.body),
      }),
    ],
  });
}

function bodyParaRuns(runs, opts = {}) {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    indent: opts.noIndent ? undefined : { firstLine: 480 },
    spacing: { line: 312, after: 80 },
    keepNext: opts.keepNext || false,
    children: runs,
  });
}

function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 480, after: 200, line: 312 },
    children: [new TextRun({ text, bold: true, size: 32, font: { ascii: "Calibri" }, color: c(palette.primary) })],
  });
}

function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 360, after: 160, line: 312 },
    children: [new TextRun({ text, bold: true, size: 28, font: { ascii: "Calibri" }, color: c(palette.primary) })],
  });
}

function h3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 240, after: 120, line: 312 },
    children: [new TextRun({ text, bold: true, size: 24, font: { ascii: "Calibri" }, color: c(palette.primary) })],
  });
}

function emptyLine() {
  return new Paragraph({ spacing: { before: 80, after: 80 }, children: [] });
}

function bulletItem(text, level = 0) {
  return new Paragraph({
    bullet: { level },
    spacing: { line: 312, after: 60 },
    indent: { left: 720 + level * 360 },
    children: [new TextRun({ text, size: 24, font: { ascii: "Calibri" }, color: c(palette.body) })],
  });
}

function bulletItemRuns(runs, level = 0) {
  return new Paragraph({
    bullet: { level },
    spacing: { line: 312, after: 60 },
    indent: { left: 720 + level * 360 },
    children: runs,
  });
}

// Table helper
function makeTable(headers, rows, colWidths) {
  const totalW = colWidths.reduce((a, b) => a + b, 0);
  const pctWidths = colWidths.map(w => Math.round((w / totalW) * 100));

  const headerRow = new TableRow({
    tableHeader: true,
    cantSplit: true,
    children: headers.map((h, i) => new TableCell({
      width: { size: pctWidths[i], type: WidthType.PERCENTAGE },
      shading: { type: ShadingType.CLEAR, fill: c(palette.tableHeaderBg) },
      borders: {
        top: { style: BorderStyle.SINGLE, size: 2, color: c(palette.tableAccent) },
        bottom: { style: BorderStyle.SINGLE, size: 2, color: c(palette.tableAccent) },
        left: { style: BorderStyle.NONE },
        right: { style: BorderStyle.NONE },
        insideHorizontal: { style: BorderStyle.NONE },
        insideVertical: { style: BorderStyle.NONE },
      },
      margins: { top: 60, bottom: 60, left: 120, right: 120 },
      children: [new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { line: 312 },
        children: [new TextRun({ text: h, bold: true, size: 21, font: { ascii: "Calibri" }, color: c(palette.tableHeaderText) })],
      })],
    })),
  });

  const dataRows = rows.map((row, idx) => new TableRow({
    cantSplit: true,
    children: row.map((cell, i) => new TableCell({
      width: { size: pctWidths[i], type: WidthType.PERCENTAGE },
      shading: { type: ShadingType.CLEAR, fill: idx % 2 === 0 ? c(palette.tableSurface) : "FFFFFF" },
      borders: {
        top: { style: BorderStyle.NONE },
        bottom: { style: BorderStyle.SINGLE, size: 1, color: c(palette.tableInnerLine) },
        left: { style: BorderStyle.NONE },
        right: { style: BorderStyle.NONE },
        insideHorizontal: { style: BorderStyle.NONE },
        insideVertical: { style: BorderStyle.NONE },
      },
      margins: { top: 60, bottom: 60, left: 120, right: 120 },
      children: [new Paragraph({
        spacing: { line: 312 },
        children: [new TextRun({ text: String(cell), size: 21, font: { ascii: "Calibri" }, color: c(palette.body) })],
      })],
    })),
  }));

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    borders: {
      top: { style: BorderStyle.SINGLE, size: 2, color: c(palette.tableAccent) },
      bottom: { style: BorderStyle.SINGLE, size: 2, color: c(palette.tableAccent) },
      left: { style: BorderStyle.NONE },
      right: { style: BorderStyle.NONE },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: c(palette.tableInnerLine) },
      insideVertical: { style: BorderStyle.NONE },
    },
    rows: [headerRow, ...dataRows],
  });
}

function tableCaption(text) {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 80, after: 200, line: 312 },
    children: [new TextRun({ text, italics: true, size: 21, font: { ascii: "Calibri" }, color: c(palette.secondary) })],
  });
}

// ──────────────────────────────────────────
// COVER PAGE (R1 - Pure Paragraph Left)
// ──────────────────────────────────────────
function buildCover() {
  const title = "SISTEM PENCATATAN NAMA BAYI BARU LAHIR";
  const subtitle = "Laporan Struktur dan Teknologi";
  const englishLabel = "Inovasi Pelayanan Publik Digital";

  const P = {
    bg: palette.bg,
    titleColor: palette.titleColor,
    subtitleColor: palette.subtitleColor,
    metaColor: palette.metaColor,
    accent: palette.accent,
    footerColor: palette.footerColor,
  };

  const padL = 1200, padR = 800;

  // Calculate title layout (Indonesian text - word-based splitting)
  function splitLatinTitle(title, maxCharsPerLine) {
    if (title.length <= maxCharsPerLine) return [title];
    const words = title.split(" ");
    const lines = [];
    let current = "";
    for (const word of words) {
      if ((current + " " + word).trim().length > maxCharsPerLine && current.length > 0) {
        lines.push(current.trim());
        current = word;
      } else {
        current = (current + " " + word).trim();
      }
    }
    if (current) lines.push(current.trim());
    // Merge orphan lines (<=2 chars)
    if (lines.length > 1 && lines[lines.length - 1].length <= 2) {
      lines[lines.length - 2] += " " + lines.pop();
    }
    return lines;
  }

  // Dynamic title font size
  let titlePt = 36;
  let titleLines = splitLatinTitle(title, Math.floor((11906 - padL - padR - 300) / (titlePt * 10)));
  while (titleLines.length > 3 && titlePt >= 24) {
    titlePt -= 2;
    titleLines = splitLatinTitle(title, Math.floor((11906 - padL - padR - 300) / (titlePt * 10)));
  }
  const titleSize = titlePt * 2;

  const metaLines = [
    "Dinas Kependudukan dan Pencatatan Sipil",
    "Kabupaten Ngada, Nusa Tenggara Timur",
    "2025",
  ];

  // Calculate spacing
  const contentHeight = titleLines.length * (titlePt * 23 + 200) + (12 * 23 + 600) + (9 * 23 + 600) + metaLines.length * (10 * 23 + 100) + 400 + 900;
  const remaining = 16838 - 1200 - contentHeight;
  const safeRemaining = Math.max(remaining, 400);
  const topSpacing = Math.max(Math.floor(safeRemaining * 0.45), 400);
  const bottomSpacing = Math.max(Math.floor(safeRemaining * 0.45), 800);

  const accentLeft = { style: BorderStyle.SINGLE, size: 8, color: P.accent, space: 12 };
  const children = [];

  // 1. Top whitespace
  children.push(new Paragraph({ spacing: { before: topSpacing } }));

  // 2. English label
  children.push(new Paragraph({
    indent: { left: padL, right: padR }, spacing: { after: 500 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: P.accent, space: 8 } },
    children: [new TextRun({
      text: englishLabel.split("").join("  "),
      size: 18, color: P.accent, font: { ascii: "Calibri" }, characterSpacing: 40,
    })],
  }));

  // 3. Main title
  for (let i = 0; i < titleLines.length; i++) {
    children.push(new Paragraph({
      indent: { left: padL },
      spacing: { after: i < titleLines.length - 1 ? 100 : 300, line: Math.ceil(titlePt * 23), lineRule: "atLeast" },
      children: [new TextRun({ text: titleLines[i], size: titleSize, bold: true, color: P.titleColor, font: { ascii: "Calibri" } })],
    }));
  }

  // 4. Subtitle
  children.push(new Paragraph({
    indent: { left: padL }, spacing: { after: 800 },
    children: [new TextRun({ text: subtitle, size: 24, color: P.subtitleColor, font: { ascii: "Calibri" } })],
  }));

  // 5. Meta lines
  for (const line of metaLines) {
    children.push(new Paragraph({
      indent: { left: padL + 200 }, spacing: { after: 80 },
      border: { left: accentLeft },
      children: [new TextRun({ text: line, size: 24, color: P.metaColor, font: { ascii: "Calibri" } })],
    }));
  }

  // 6. Bottom whitespace
  children.push(new Paragraph({ spacing: { before: bottomSpacing } }));

  // 7. Footer
  children.push(new Paragraph({
    indent: { left: padL, right: padR },
    border: { top: { style: BorderStyle.SINGLE, size: 2, color: P.accent, space: 8 } },
    spacing: { before: 200 },
    children: [
      new TextRun({ text: "Disusun dalam rangka Latihan Dasar (Latsar)", size: 16, color: P.footerColor, font: { ascii: "Calibri" } }),
      new TextRun({ text: "                                        " }),
      new TextRun({ text: "Tahun 2025", size: 16, color: P.footerColor, font: { ascii: "Calibri" } }),
    ],
  }));

  return [new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    borders: allNoBorders,
    rows: [new TableRow({
      height: { value: 16838, rule: "exact" },
      children: [new TableCell({
        shading: { type: ShadingType.CLEAR, fill: P.bg }, borders: noBorders,
        children,
      })],
    })],
  })];
}

// ──────────────────────────────────────────
// BAB I - PENDAHULUAN
// ──────────────────────────────────────────
function buildBab1() {
  return [
    h1("BAB I  PENDAHULUAN"),

    h2("1.1  Latar Belakang"),
    bodyPara("Pencatatan kelahiran merupakan salah satu hak fundamental warga negara yang dijamin oleh Undang-Undang Dasar Negara Republik Indonesia Tahun 1945 dan Undang-Undang Nomor 24 Tahun 2013 tentang Administrasi Kependudukan. Setiap kelahiran wajib dilaporkan dan dicatat oleh instansi pelaksana administrasi kependudukan untuk keperluan pembuatan dokumen kependudukan seperti Akta Kelahiran, Kartu Keluarga, dan Nomor Induk Kependudukan (NIK)."),
    bodyPara("Dinas Kependudukan dan Pencatatan Sipil (Dukcapil) Kabupaten Ngada, Provinsi Nusa Tenggara Timur (NTT), memiliki tugas dan fungsi dalam melaksanakan urusan pemerintahan daerah di bidang administrasi kependudukan dan pencatatan sipil. Dalam pelaksanaan tugasnya, Dukcapil Kabupaten Ngada bekerja sama dengan fasilitas kesehatan tingkat pertama, yaitu Pusat Kesehatan Masyarakat (Puskesmas) yang tersebar di seluruh wilayah kabupaten."),
    bodyPara("Saat ini, proses pencatatan nama bayi baru lahir di Kabupaten Ngada masih menghadapi beberapa tantangan. Data kelahiran dari Puskesmas dikirimkan secara manual melalui formulir kertas atau berkas fisik yang memerlukan waktu koordinasi yang cukup lama. Proses verifikasi dan validasi data oleh petugas Dukcapil juga dilakukan secara konvensional, sehingga rentan terhadap kesalahan pencatatan, keterlambatan informasi, dan potensi duplikasi data."),
    bodyPara("Dalam upaya meningkatkan kualitas pelayanan publik dan mendukung transformasi digital di lingkungan pemerintah daerah, penulis mengembangkan sebuah inovasi berupa sistem informasi berbasis web yang disebut \u201cSistem Pencatatan Nama Bayi Baru Lahir\u201d. Sistem ini dirancang sebagai solusi terpadu untuk mengotomatisasi proses pencatatan, verifikasi, dan pengelolaan data kelahiran dari tingkat Puskesmas hingga Dukcapil Kabupaten Ngada."),
    bodyPara("Sistem ini dikembangkan sebagai proyek inovasi dalam rangka pelaksanaan Latihan Dasar (Latsar) bagi Aparatur Sipil Negara (ASN) di lingkungan Pemerintah Kabupaten Ngada. Dengan memanfaatkan teknologi web modern, sistem ini diharapkan dapat meningkatkan efisiensi, akurasi, dan kecepatan layanan pencatatan kelahiran di Kabupaten Ngada."),

    h2("1.2  Tujuan Sistem"),
    bodyPara("Pengembangan Sistem Pencatatan Nama Bayi Baru Lahir memiliki beberapa tujuan utama, yaitu:"),
    bulletItem("Menyediakan platform digital terpadu untuk pencatatan nama bayi baru lahir yang dapat diakses oleh operator Puskesmas, administrator Dukcapil, dan pihak BPJS Kesehatan."),
    bulletItem("Mempercepat proses pelaporan dan verifikasi data kelahiran dari Puskesmas ke Dukcapil Kabupaten Ngada."),
    bulletItem("Meningkatkan akurasi dan konsistensi data kelahiran melalui mekanisme validasi otomatis dan verifikasi berjenjang."),
    bulletItem("Mengurangi penggunaan dokumen fisik dan mendukung konsep pemerintahan paperless."),
    bulletItem("Memudahkan pengelolaan Nomor Induk Kependudukan (NIK) bayi secara terpusat dan terstruktur."),
    bulletItem("Menyediakan fitur pelaporan dan analitik data untuk mendukung pengambilan keputusan berbasis data."),
    bulletItem("Mendukung integrasi data dengan pihak BPJS Kesehatan untuk keperluan jaminan kesehatan nasional."),
    bulletItem("Meningkatkan transparansi dan akuntabilitas pelayanan publik melalui sistem audit trail yang komprehensif."),

    h2("1.3  Ruang Lingkup"),
    bodyPara("Ruang lingkup sistem ini mencakup beberapa aspek utama sebagai berikut:"),
    bodyParaRuns([
      new TextRun({ text: "Cakupan Fungsional: ", bold: true, size: 24, font: { ascii: "Calibri" }, color: c(palette.body) }),
      new TextRun({ text: "Sistem mencakup pengelolaan data kelahiran mulai dari pencatatan oleh operator Puskesmas, verifikasi oleh admin Dukcapil, hingga akses data oleh pihak BPJS Kesehatan. Sistem juga menyediakan fitur manajemen pengguna, manajemen Puskesmas, audit log, dan pelaporan data.", size: 24, font: { ascii: "Calibri" }, color: c(palette.body) }),
    ], { noIndent: true }),
    bodyParaRuns([
      new TextRun({ text: "Cakupan Teknis: ", bold: true, size: 24, font: { ascii: "Calibri" }, color: c(palette.body) }),
      new TextRun({ text: "Sistem dikembangkan menggunakan arsitektur web modern dengan pendekatan serverless. Teknologi utama yang digunakan meliputi Next.js 16 sebagai framework, TypeScript 5 sebagai bahasa pemrograman, PostgreSQL (Supabase) sebagai database, dan Prisma ORM sebagai alat manajemen database.", size: 24, font: { ascii: "Calibri" }, color: c(palette.body) }),
    ], { noIndent: true }),
    bodyParaRuns([
      new TextRun({ text: "Cakupan Pengguna: ", bold: true, size: 24, font: { ascii: "Calibri" }, color: c(palette.body) }),
      new TextRun({ text: "Sistem memiliki tiga peran utama pengguna, yaitu Admin Dukcapil (pengelola sistem dan verifikator data), Operator Puskesmas (petugas yang melakukan input data kelahiran), dan User BPJS (perwakilan BPJS Kesehatan yang mengakses data untuk keperluan jaminan kesehatan).", size: 24, font: { ascii: "Calibri" }, color: c(palette.body) }),
    ], { noIndent: true }),
    bodyParaRuns([
      new TextRun({ text: "Cakupan Wilayah: ", bold: true, size: 24, font: { ascii: "Calibri" }, color: c(palette.body) }),
      new TextRun({ text: "Sistem dirancang untuk melayani seluruh wilayah Kabupaten Ngada, Provinsi Nusa Tenggara Timur, dengan masing-masing Puskesmas memiliki akses terbatas pada data yang mereka kelola.", size: 24, font: { ascii: "Calibri" }, color: c(palette.body) }),
    ], { noIndent: true }),
  ];
}

// ──────────────────────────────────────────
// BAB II - ARSITEKTUR SISTEM
// ──────────────────────────────────────────
function buildBab2() {
  return [
    h1("BAB II  ARSITEKTUR SISTEM"),

    h2("2.1  Arsitektur Aplikasi Web"),
    bodyPara("Sistem Pencatatan Nama Bayi Baru Lahir dibangun menggunakan arsitektur aplikasi web modern yang mengadopsi pendekatan Three-Tier Architecture (Arsitektur Tiga Lapisan). Arsitektur ini memisahkan sistem menjadi tiga komponen utama yang saling terintegrasi namun independen dalam pengembangannya, yaitu Presentation Layer, Business Logic Layer, dan Data Layer."),
    bodyPara("Pemisahan arsitektur ini dipilih karena memberikan beberapa keuntungan signifikan, antara lain modularitas kode yang tinggi sehingga memudahkan pemeliharaan, skalabilitas sistem yang baik karena setiap lapisan dapat ditingkatkan secara independen, serta keamanan yang lebih terjamin karena business logic tidak terekspos langsung ke klien."),
    bodyPara("Pendekatan arsitektur ini juga sejalan dengan paradigma pengembangan aplikasi web saat ini yang mengutamakan pengalaman pengguna yang responsif, kecepatan akses, dan keandalan sistem. Dengan arsitektur yang terstruktur, sistem dapat melayani multiple pengguna secara bersamaan tanpa mengalami penurunan performa yang signifikan."),

    h2("2.2  Model Klien-Server"),
    bodyPara("Sistem ini beroperasi menggunakan model klien-server yang merupakan standar dalam arsitektur aplikasi web. Dalam model ini, terdapat dua komponen utama yang saling berkomunikasi melalui protokol HTTP/HTTPS:"),
    bulletItem("Klien (Client-Side): Berupa browser web modern (Chrome, Firefox, Safari, Edge) yang menjalankan aplikasi React. Klien bertanggung jawab untuk menampilkan antarmuka pengguna (UI), menangani interaksi pengguna, dan mengirimkan permintaan ke server."),
    bulletItem("Server (Server-Side): Berupa serverless functions yang di-deploy di platform Vercel. Server bertanggung jawab untuk memproses logika bisnis, melakukan operasi database, menangani autentikasi dan otorisasi, serta menyediakan API endpoints."),
    bodyPara("Komunikasi antara klien dan server dilakukan secara asinkron menggunakan teknik AJAX (Asynchronous JavaScript and XML) yang modern. Setiap interaksi pengguna yang memerlukan data dari server akan memicu API call tanpa perlu melakukan reload halaman, sehingga memberikan pengalaman pengguna yang mulus dan responsif seperti aplikasi desktop."),

    h2("2.3  RESTful API Architecture"),
    bodyPara("Sistem menggunakan arsitektur RESTful API (Representational State Transfer) sebagai standar komunikasi antara klien dan server. RESTful API dipilih karena memiliki beberapa keunggulan, antara lain kesederhanaan dalam desain, skalabilitas yang tinggi, kompatibilitas yang luas dengan berbagai platform, dan dukungan terhadap stateless communication."),
    bodyPara("Dalam implementasinya, sistem memiliki 42 API endpoints yang terorganisir dalam beberapa kelompok berdasarkan fungsionalitas. Setiap endpoint menggunakan HTTP methods yang sesuai dengan operasi yang dilakukan: GET untuk pengambilan data, POST untuk pembuatan data baru, PUT/PATCH untuk pembaruan data, dan DELETE untuk penghapusan data."),
    bodyPara("Format data yang digunakan dalam komunikasi API adalah JSON (JavaScript Object Notation) yang merupakan format pertukaran data yang ringan, mudah dibaca oleh manusia, dan didukung secara native oleh hampir semua bahasa pemrograman modern. Setiap respons dari API juga dilengkapi dengan status code HTTP yang standar untuk memudahkan penanganan error dan debugging."),

    h2("2.4  Diagram Arsitektur Sistem"),
    bodyPara("Arsitektur sistem secara keseluruhan dapat digambarkan dalam tiga lapisan utama yang bekerja secara terintegrasi. Berikut adalah deskripsi dari masing-masing lapisan beserta komponen-komponen penyusunnya:"),

    makeTable(
      ["Lapisan", "Komponen", "Teknologi", "Fungsi"],
      [
        ["Presentation Layer", "Browser / Web Client", "React 19, Next.js 16", "Menampilkan antarmuka pengguna, menangani interaksi, dan merender halaman web"],
        ["Business Logic Layer", "Serverless Functions", "Next.js API Routes, NextAuth.js", "Memproses logika bisnis, autentikasi, otorisasi, dan validasi data"],
        ["Business Logic Layer", "ORM Layer", "Prisma ORM v6", "Menerjemahkan operasi database menjadi query yang optimal"],
        ["Data Layer", "Database Server", "PostgreSQL (Supabase)", "Menyimpan dan mengelola data secara persisten"],
        ["Data Layer", "CDN / Edge Network", "Vercel Edge Network", "Menyajikan aset statis dengan latensi rendah"],
      ],
      [20, 25, 25, 30]
    ),
    tableCaption("Tabel 1. Komponen Arsitektur Tiga Lapisan Sistem"),

    bodyPara("Alur kerja arsitektur sistem dimulai ketika pengguna mengakses sistem melalui browser. Browser memuat aplikasi React yang telah di-render di sisi server (Server-Side Rendering) oleh Next.js. Ketika pengguna melakukan interaksi yang memerlukan data, aplikasi mengirimkan request melalui RESTful API ke serverless functions. Server kemudian memproses request melalui Prisma ORM yang berkomunikasi dengan database PostgreSQL. Hasil pemrosesan dikembalikan dalam format JSON ke klien untuk ditampilkan kepada pengguna."),
  ];
}

// ──────────────────────────────────────────
// BAB III - TEKNOLOGI YANG DIGUNAKAN
// ──────────────────────────────────────────
function buildBab3() {
  return [
    h1("BAB III  TEKNOLOGI YANG DIGUNAKAN"),

    h2("3.1  Framework dan Bahasa Pemrograman"),
    h3("3.1.1  Next.js 16 (App Router)"),
    bodyPara("Next.js 16 merupakan framework React yang digunakan sebagai fondasi utama pengembangan sistem. Next.js dipilih karena menyediakan fitur-fitur unggulan seperti Server-Side Rendering (SSR), Static Site Generation (SSG), dan API Routes yang terintegrasi dalam satu framework. Dengan menggunakan App Router yang diperkenalkan sejak Next.js 13 dan diperkuat di versi 16, sistem mendukung pendekatan React Server Components (RSC) yang memungkinkan rendering komponen di sisi server untuk performa yang lebih baik."),
    bodyPara("Fitur App Router memungkinkan pengorganisasian halaman berdasarkan sistem file (file-system based routing) yang intuitif. Setiap folder dalam direktori app merepresentasikan sebuah route, dan file page.tsx di dalamnya merupakan halaman yang akan di-render. Pendekatan ini memudahkan pengelolaan kode dan membuat struktur aplikasi lebih terprediksi."),

    h3("3.1.2  TypeScript 5"),
    bodyPara("TypeScript 5 digunakan sebagai bahasa pemrograman utama dalam pengembangan sistem. TypeScript merupakan superset dari JavaScript yang menambahkan fitur static typing. Penggunaan TypeScript memberikan beberapa keuntungan signifikan, antara lain deteksi error pada saat kompilasi (compile-time error detection), autocompletion yang lebih akurat di Integrated Development Environment (IDE), dokumentasi kode yang otomatis melalui type definitions, dan refactoring yang lebih aman."),
    bodyPara("Dengan TypeScript, seluruh data model, API request/response, dan komponen React memiliki type definition yang ketat, sehingga mengurangi potensi bug yang disebabkan oleh tipe data yang tidak sesuai."),

    h3("3.1.3  React 19"),
    bodyPara("React 19 digunakan sebagai library untuk membangun antarmuka pengguna. React 19 membawa peningkatan performa yang signifikan melalui fitur React Server Components (RSC) yang memungkinkan komponen di-render di sisi server. Fitur ini mengurangi ukuran JavaScript yang perlu diunduh oleh klien dan meningkatkan kecepatan loading halaman secara keseluruhan."),
    bodyPara("Selain itu, React 19 mendukung concurrent features yang memungkinkan rendering halaman tanpa memblokir thread utama, sehingga aplikasi tetap responsif meskipun sedang memproses data yang berat."),

    h2("3.2  Database dan ORM"),
    h3("3.2.1  PostgreSQL (Supabase)"),
    bodyPara("PostgreSQL digunakan sebagai sistem manajemen database relasional utama. Database di-hosting melalui platform Supabase yang menyediakan layanan PostgreSQL yang terkelola (managed PostgreSQL). Supabase dipilih karena menyediakan infrastruktur database yang andal, backup otomatis, skalabilitas yang baik, dan kemudahan manajemen melalui dashboard yang intuitif."),
    bodyPara("PostgreSQL dipilih sebagai database karena mendukung fitur-fitur enterprise-grade seperti ACID transactions, foreign key constraints, indexes, dan berbagai tipe data yang lengkap. Fitur JSONB yang dimiliki PostgreSQL juga memberikan fleksibilitas dalam menyimpan data semi-structured yang mungkin diperlukan di masa depan."),

    h3("3.2.2  Prisma ORM v6"),
    bodyPara("Prisma ORM versi 6 digunakan sebagai Object-Relational Mapping (ORM) untuk berinteraksi dengan database PostgreSQL. Prisma menyediakan type-safe database client yang secara otomatis menghasilkan TypeScript types berdasarkan skema database. Dengan Prisma, operasi database dapat dilakukan menggunakan syntax yang intuitif dan type-safe tanpa perlu menulis query SQL secara manual."),
    bodyPara("Fitur Prisma yang digunakan dalam sistem meliputi schema definition language (SDL) untuk mendefinisikan model database, auto-generated TypeScript types, database migration untuk mengelola perubahan skema, dan Prisma Client untuk operasi CRUD (Create, Read, Update, Delete) yang efisien."),

    h3("3.2.3  Prisma Driver Adapter"),
    bodyPara("Sistem menggunakan @prisma/adapter-pg sebagai Prisma Driver Adapter untuk mengoptimalkan koneksi database di lingkungan serverless. Driver adapter ini memungkinkan Prisma untuk menggunakan koneksi database yang lebih efisien dalam konteks serverless functions yang memiliki batasan runtime dan koneksi yang ketat. Dengan adapter ini, sistem dapat menghindari masalah connection pooling yang umum terjadi di lingkungan serverless."),

    h2("3.3  Styling dan UI Components"),
    h3("3.3.1  Tailwind CSS 4"),
    bodyPara("Tailwind CSS versi 4 digunakan sebagai framework CSS utility-first untuk styling antarmuka pengguna. Tailwind CSS dipilih karena menyediakan kelas-kelas CSS utility yang memungkinkan pengembangan UI yang cepat dan konsisten tanpa perlu menulis custom CSS yang banyak. Pendekatan utility-first juga memastikan bahwa ukuran file CSS tetap minimal karena hanya kelas yang digunakan yang akan di-include dalam bundle akhir."),
    bodyPara("Tailwind CSS 4 membawa peningkatan performa dan fitur baru seperti improved color system, container queries, dan konfigurasi yang lebih fleksibel melalui CSS-based configuration."),

    h3("3.3.2  shadcn/ui (Radix UI)"),
    bodyPara("shadcn/ui digunakan sebagai library komponen UI yang menyediakan 43 komponen siap pakai. Berbeda dengan library komponen konvensional, shadcn/ui mengadopsi pendekatan copy-paste components yang memberikan kontrol penuh atas kode komponen. Komponen-komponen shadcn/ui dibangun di atas Radix UI Primitives yang menyediakan aksesibilitas dan fungsi interaksi yang sudah teruji."),
    bodyPara("Beberapa komponen shadcn/ui yang digunakan dalam sistem meliputi Button, Card, Table, Dialog, Form, Input, Select, Badge, Dropdown Menu, Sheet, Sidebar, Chart, Tabs, Toast, dan masih banyak lagi. Penggunaan komponen yang konsisten memastikan keseragaman tampilan dan interaksi di seluruh halaman sistem."),

    h3("3.3.3  Lucide React"),
    bodyPara("Lucide React digunakan sebagai library ikon yang menyediakan koleksi ikon SVG yang dikurasi dengan baik. Lucide dipilih karena kompatibilitasnya yang sempurna dengan React, ukuran bundle yang kecil, dan ketersediaan ikon yang luas untuk berbagai keperluan antarmuka. Seluruh ikon yang digunakan dalam sistem bersumber dari Lucide React untuk menjaga konsistensi visual."),

    h3("3.3.4  Fitur Styling Tambahan"),
    bodyPara("Sistem juga menggunakan beberapa library pendukung styling, yaitu next-themes untuk implementasi dark/light mode, Recharts untuk visualisasi data dalam bentuk grafik, tw-animate-css dan Framer Motion untuk animasi, serta custom CSS animations untuk efek glassmorphism dan micro-interactions. Kombinasi library-library ini menghasilkan antarmuka pengguna yang modern, responsif, dan menarik secara visual."),

    makeTable(
      ["No", "Library / Teknologi", "Versi", "Fungsi"],
      [
        ["1", "Tailwind CSS", "4.x", "Framework CSS utility-first"],
        ["2", "shadcn/ui", "latest", "Komponen UI (43 komponen)"],
        ["3", "Lucide React", "latest", "Library ikon SVG"],
        ["4", "next-themes", "latest", "Dark/light mode management"],
        ["5", "Recharts", "latest", "Visualisasi data dan grafik"],
        ["6", "tw-animate-css", "latest", "Animasi CSS untuk Tailwind"],
        ["7", "Framer Motion", "latest", "Animasi JavaScript"],
        ["8", "Custom CSS", "-", "Glassmorphism, micro-interactions"],
      ],
      [8, 30, 15, 47]
    ),
    tableCaption("Tabel 2. Daftar Library Styling dan UI Components"),

    h2("3.4  Autentikasi dan Keamanan"),
    bodyPara("Keamanan sistem menjadi prioritas utama dalam pengembangan. Sistem mengimplementasikan beberapa lapisan keamanan yang terintegrasi untuk melindungi data dan memastikan bahwa hanya pengguna yang berwenang yang dapat mengakses fungsi-fungsi tertentu."),
    bodyPara("NextAuth.js versi 4 digunakan sebagai framework autentikasi yang menyediakan mekanisme login, logout, dan session management yang aman. Sistem menggunakan JWT (JSON Web Token) Strategy untuk session management yang stateless, sehingga cocok dengan arsitektur serverless yang digunakan."),
    bodyPara("Password pengguna di-hash menggunakan bcryptjs dengan algoritma hashing yang kuat sebelum disimpan di database. Middleware Next.js digunakan untuk melindungi route-route tertentu agar hanya dapat diakses oleh pengguna yang sudah terautentikasi dan memiliki peran yang sesuai. Sistem juga mengimplementasikan Role-Based Access Control (RBAC) dengan tiga level peran: Admin, Operator, dan BPJS. Session timeout diatur selama 15 menit untuk keamanan tambahan, dan seluruh aktivitas pengguna dicatat dalam sistem audit logging."),

    makeTable(
      ["No", "Teknologi", "Fungsi"],
      [
        ["1", "NextAuth.js v4", "Framework autentikasi (login, logout, session)"],
        ["2", "JWT Strategy", "Session management stateless"],
        ["3", "bcryptjs", "Hashing password sebelum penyimpanan"],
        ["4", "Middleware Route Protection", "Proteksi halaman berdasarkan status login"],
        ["5", "RBAC (Role-Based Access Control)", "Otorisasi berdasarkan peran pengguna"],
        ["6", "Session Timeout (15 menit)", "Keamanan sesi pengguna"],
        ["7", "Audit Logging System", "Pencatatan seluruh aktivitas pengguna"],
      ],
      [8, 35, 57]
    ),
    tableCaption("Tabel 3. Teknologi Autentikasi dan Keamanan"),

    h2("3.5  Deployment dan Infrastruktur"),
    bodyPara("Sistem di-deploy menggunakan platform Vercel yang menyediakan layanan serverless deployment untuk aplikasi Next.js. Vercel dipilih karena menyediakan integrasi yang sempurna dengan Next.js, automatic scaling, global CDN (Content Delivery Network), dan proses deployment yang mudah melalui git push."),
    bodyPara("Database PostgreSQL di-hosting melalui platform Supabase yang menyediakan layanan database terkelola dengan fitur backup otomatis, monitoring real-time, dan dashboard manajemen yang intuitif. Kombinasi Vercel dan Supabase menghasilkan arsitektur yang sepenuhnya terkelola (fully managed) sehingga pengembang dapat fokus pada pengembangan fitur tanpa perlu mengelola infrastruktur server secara manual."),
    bodyPara("Arsitektur serverless yang digunakan memungkinkan sistem untuk secara otomatis menskalakan kapasitas sesuai dengan beban pengguna tanpa intervensi manual. API routes diimplementasikan sebagai serverless functions yang hanya berjalan ketika ada request, sehingga menghemat sumber daya dan biaya operasional. Aset-aset statis seperti gambar, CSS, dan JavaScript disajikan melalui CDN Vercel yang tersebar di berbagai lokasi global untuk memastikan kecepatan akses yang optimal."),

    h2("3.6  Library Pendukung"),
    bodyPara("Selain teknologi utama, sistem juga menggunakan beberapa library pendukung yang meningkatkan fungsionalitas dan pengalaman pengguna:"),

    makeTable(
      ["No", "Library", "Fungsi"],
      [
        ["1", "@tanstack/react-table", "Manajemen data table dengan fitur sorting, filtering, dan pagination"],
        ["2", "@tanstack/react-query", "Manajemen state server, caching, dan synchronisasi data"],
        ["3", "xlsx", "Ekspor dan impor data dalam format Excel (.xlsx)"],
        ["4", "sonner", "Sistem notifikasi toast untuk feedback pengguna"],
        ["5", "react-hook-form", "Manajemen form dengan validasi dan performance optimization"],
        ["6", "zod", "Validasi skema data dengan TypeScript-first approach"],
        ["7", "sharp", "Pemrosesan gambar (resize, compress, format conversion)"],
        ["8", "uuid", "Pembuatan identifier unik (Universally Unique Identifier)"],
      ],
      [8, 30, 62]
    ),
    tableCaption("Tabel 4. Library Pendukung Sistem"),
  ];
}

// ──────────────────────────────────────────
// BAB IV - STRUKTUR DATABASE
// ──────────────────────────────────────────
function buildBab4() {
  return [
    h1("BAB IV  STRUKTUR DATABASE"),

    h2("4.1  Entity Relationship Diagram"),
    bodyPara("Struktur database sistem dirancang dengan mempertimbangkan kebutuhan fungsional dan keamanan data. Database terdiri dari 6 tabel utama yang saling berelasi melalui foreign key constraints. Hubungan antar tabel mengikuti prinsip normalisasi untuk menghindari redundansi data dan menjaga integritas referensial."),
    bodyPara("Tabel Puskesmas berfungsi sebagai master data fasilitas kesehatan. Tabel Users menyimpan informasi pengguna sistem yang terhubung ke tabel Puskesmas melalui relasi many-to-one. Tabel BirthRecords merupakan tabel utama yang menyimpan data kelahiran, yang juga terhubung ke tabel Puskesmas dan Users. Tabel BirthRecordFiles menyimpan dokumen pendukung yang terhubung ke tabel BirthRecords melalui relasi one-to-many. Tabel AuditLogs mencatat seluruh aktivitas yang terjadi dalam sistem dan terhubung ke tabel Users."),

    h2("4.2  Tabel Puskesmas"),
    bodyPara("Tabel Puskesmas menyimpan data master seluruh Puskesmas yang terdaftar dalam sistem. Setiap Puskesmas memiliki kode wilayah unik yang digunakan untuk identifikasi dan pengelompokan data."),
    makeTable(
      ["Kolom", "Tipe Data", "Keterangan"],
      [
        ["id", "String (UUID)", "Primary key, auto-generated"],
        ["nama", "String", "Nama Puskesmas"],
        ["kodeWilayah", "String", "Kode wilayah administratif"],
        ["alamat", "String (opsional)", "Alamat Puskesmas"],
        ["telepon", "String (opsional)", "Nomor telepon Puskesmas"],
        ["createdAt", "DateTime", "Tanggal pembuatan record"],
        ["updatedAt", "DateTime", "Tanggal pembaruan record"],
      ],
      [25, 30, 45]
    ),
    tableCaption("Tabel 5. Struktur Tabel Puskesmas"),

    h2("4.3  Tabel Users"),
    bodyPara("Tabel Users menyimpan data seluruh pengguna sistem yang terdiri dari Admin Dukcapil, Operator Puskesmas, dan User BPJS. Setiap pengguna terhubung ke satu Puskesmas tertentu kecuali Admin yang memiliki akses global."),
    makeTable(
      ["Kolom", "Tipe Data", "Keterangan"],
      [
        ["id", "String (UUID)", "Primary key, auto-generated"],
        ["username", "String (unik)", "Username untuk login"],
        ["password", "String", "Password yang di-hash (bcryptjs)"],
        ["namaLengkap", "String", "Nama lengkap pengguna"],
        ["role", "Enum", "ADMIN, OPERATOR, atau BPJS"],
        ["isActive", "Boolean", "Status aktif pengguna"],
        ["puskesmasId", "String (UUID, nullable)", "Foreign key ke tabel Puskesmas"],
        ["createdAt", "DateTime", "Tanggal pembuatan record"],
        ["updatedAt", "DateTime", "Tanggal pembaruan record"],
      ],
      [25, 30, 45]
    ),
    tableCaption("Tabel 6. Struktur Tabel Users"),

    h2("4.4  Tabel BirthRecords"),
    bodyPara("Tabel BirthRecords merupakan tabel utama yang menyimpan seluruh data pencatatan kelahiran bayi. Tabel ini memiliki 22 kolom yang mencakup informasi identitas orang tua, data bayi, status verifikasi, dan metadata pencatatan."),
    makeTable(
      ["Kolom", "Tipe Data", "Keterangan"],
      [
        ["id", "String (UUID)", "Primary key"],
        ["nikIbu", "String (unik)", "NIK ibu (Nomor Induk Kependudukan)"],
        ["namaIbu", "String", "Nama lengkap ibu"],
        ["namaAyah", "String", "Nama lengkap ayah"],
        ["namaBayi", "String", "Nama bayi yang dicatatkan"],
        ["nikBayi", "String (unik, nullable)", "NIK bayi (diisi setelah verifikasi)"],
        ["tanggalLahir", "Date", "Tanggal kelahiran bayi"],
        ["tempatLahir", "String", "Tempat kelahiran"],
        ["jenisKelamin", "Enum", "LAKI-LAKI atau PEREMPUAN"],
        ["beratBadan", "Float (opsional)", "Berat badan bayi (gram)"],
        ["panjangBadan", "Float (opsional)", "Panjang badan bayi (cm)"],
        ["status", "Enum", "PENDING, APPROVED, atau REJECTED"],
        ["alasanPenolakan", "String (opsional)", "Alasan penolakan jika status REJECTED"],
        ["isDeleted", "Boolean", "Soft delete flag"],
        ["puskesmasId", "String (UUID)", "Foreign key ke tabel Puskesmas"],
        ["createdBy", "String (UUID)", "Foreign key ke tabel Users"],
        ["verifiedBy", "String (UUID, nullable)", "Foreign key ke tabel Users (verifikator)"],
        ["verifiedAt", "DateTime (nullable)", "Tanggal verifikasi"],
        ["nikBayiUpdatedAt", "DateTime (nullable)", "Tanggal pengisian NIK bayi"],
        ["downloadedAt", "DateTime (nullable)", "Tanggal unduh terakhir"],
        ["createdAt", "DateTime", "Tanggal pembuatan record"],
        ["updatedAt", "DateTime", "Tanggal pembaruan record"],
      ],
      [25, 30, 45]
    ),
    tableCaption("Tabel 7. Struktur Tabel BirthRecords"),

    h2("4.5  Tabel BirthRecordFiles"),
    bodyPara("Tabel BirthRecordFiles menyimpan metadata dokumen pendukung yang diunggah untuk setiap record kelahiran. File-file ini dapat berupa surat keterangan kelahiran dari rumah sakit/Puskesmas, fotokopi KTP orang tua, atau dokumen pendukung lainnya. Data file disimpan dalam format binary (BLOB) langsung di database."),
    makeTable(
      ["Kolom", "Tipe Data", "Keterangan"],
      [
        ["id", "String (UUID)", "Primary key"],
        ["birthRecordId", "String (UUID)", "Foreign key ke tabel BirthRecords"],
        ["fileType", "Enum", "Jenis dokumen (KELAHIRAN, KTP, KK, lainnya)"],
        ["fileName", "String", "Nama file asli"],
        ["fileMime", "String", "MIME type file"],
        ["fileSize", "Int", "Ukuran file dalam bytes"],
        ["fileData", "Bytes (BLOB)", "Data binary file"],
        ["uploadedBy", "String (UUID)", "Foreign key ke tabel Users"],
        ["createdAt", "DateTime", "Tanggal unggah"],
      ],
      [25, 30, 45]
    ),
    tableCaption("Tabel 8. Struktur Tabel BirthRecordFiles"),

    h2("4.6  Tabel AuditLogs"),
    bodyPara("Tabel AuditLogs mencatat seluruh aktivitas yang terjadi dalam sistem untuk keperluan audit trail dan akuntabilitas. Setiap operasi CRUD, login, logout, dan perubahan status data dicatat secara otomatis dalam tabel ini."),
    makeTable(
      ["Kolom", "Tipe Data", "Keterangan"],
      [
        ["id", "String (UUID)", "Primary key"],
        ["userId", "String (UUID)", "Foreign key ke tabel Users"],
        ["action", "Enum", "Jenis aksi (CREATE, READ, UPDATE, DELETE, LOGIN, dll)"],
        ["entity", "String", "Entitas yang diakses (BirthRecord, User, dll)"],
        ["entityId", "String (nullable)", "ID entitas yang diakses"],
        ["details", "JSON (nullable)", "Detail aksi dalam format JSON"],
        ["ipAddress", "String (nullable)", "Alamat IP pengguna"],
        ["userAgent", "String (nullable)", "Browser/user agent pengguna"],
        ["createdAt", "DateTime", "Timestamp pencatatan"],
      ],
      [25, 30, 45]
    ),
    tableCaption("Tabel 9. Struktur Tabel AuditLogs"),

    h2("4.7  Index dan Optimasi Database"),
    bodyPara("Untuk meningkatkan performa query database, sistem mengimplementasikan beberapa index pada kolom-kolom yang sering digunakan dalam operasi pencarian dan filtering. Index yang dibuat meliputi:"),
    bulletItem("Index unik pada kolom nikIbu di tabel BirthRecords untuk mencegah duplikasi pencatatan kelahiran berdasarkan NIK ibu."),
    bulletItem("Index unik pada kolom nikBayi di tabel BirthRecords untuk memastikan keunikan NIK bayi."),
    bulletItem("Index pada kolom status di tabel BirthRecords untuk mempercepat filtering berdasarkan status verifikasi."),
    bulletItem("Index pada kolom puskesmasId di tabel BirthRecords untuk mempercepat pengambilan data per Puskesmas."),
    bulletItem("Index pada kolom username di tabel Users untuk mempercepat proses autentikasi login."),
    bulletItem("Index pada kolom createdAt di tabel BirthRecords dan AuditLogs untuk mendukung pengurutan berdasarkan waktu."),
    bulletItem("Compound index pada kolom puskesmasId dan createdAt di tabel BirthRecords untuk mendukung query yang sering digunakan pada dashboard operator."),
    bodyPara("Selain index, optimasi database juga dilakukan melalui penggunaan Prisma ORM yang menghasilkan query SQL yang optimal, implementasi pagination untuk menghindari pengambilan data dalam jumlah besar sekaligus, serta penggunaan select clause untuk hanya mengambil kolom-kolom yang diperlukan."),
  ];
}

// ──────────────────────────────────────────
// BAB V - STRUKTUR APLIKASI
// ──────────────────────────────────────────
function buildBab5() {
  return [
    h1("BAB V  STRUKTUR APLIKASI"),

    h2("5.1  Halaman (Pages)"),
    bodyPara("Sistem memiliki 16 halaman yang terorganisir berdasarkan peran pengguna. Setiap halaman dirancang dengan pendekatan mobile-first untuk memastikan tampilan yang optimal di berbagai ukuran layar perangkat."),

    makeTable(
      ["No", "Halaman", "Route", "Akses"],
      [
        ["1", "Landing Page", "/", "Publik"],
        ["2", "Login", "/login", "Publik"],
        ["3", "Dashboard Router", "/dashboard", "Semua pengguna (redirect)"],
        ["4", "Admin Dashboard", "/admin", "Admin"],
        ["5", "Admin Analitik", "/admin/analytics", "Admin"],
        ["6", "Admin Kelola Puskesmas", "/admin/puskesmas", "Admin"],
        ["7", "Admin Audit Log", "/admin/audit-log", "Admin"],
        ["8", "Admin NIK Bayi", "/admin/nik-bayi", "Admin"],
        ["9", "Admin Kelola User", "/admin/users", "Admin"],
        ["10", "Admin Dokumen Pendukung", "/admin/dokumen", "Admin"],
        ["11", "Admin Pengaturan", "/admin/settings", "Admin"],
        ["12", "Operator Dashboard", "/operator", "Operator"],
        ["13", "Operator Input Data", "/operator/input", "Operator"],
        ["14", "Operator Riwayat", "/operator/riwayat", "Operator"],
        ["15", "BPJS Dashboard", "/bpjs", "BPJS"],
        ["16", "Profil Pengguna", "/profile", "Semua pengguna"],
      ],
      [6, 30, 30, 34]
    ),
    tableCaption("Tabel 10. Daftar Seluruh Halaman Sistem"),

    h2("5.2  API Routes (Endpoints)"),
    bodyPara("Sistem menyediakan 42 API endpoints yang terorganisir dalam 4 kelompok utama berdasarkan fungsionalitas. Setiap endpoint dilindungi oleh middleware autentikasi dan otorisasi berdasarkan peran pengguna."),

    h3("5.2.1  Auth API (4 Routes)"),
    bodyPara("API autentikasi menangani proses login, logout, perubahan password, dan pengambilan data profil pengguna. Endpoint ini menggunakan NextAuth.js untuk manajemen session dan bcryptjs untuk verifikasi password."),
    makeTable(
      ["Method", "Endpoint", "Fungsi"],
      [
        ["POST", "/api/auth/login", "Autentikasi pengguna (login)"],
        ["POST", "/api/auth/logout", "Mengakhiri sesi pengguna"],
        ["PUT", "/api/auth/change-password", "Mengubah password pengguna"],
        ["GET", "/api/auth/profile", "Mengambil data profil pengguna"],
      ],
      [15, 40, 45]
    ),
    tableCaption("Tabel 11. Daftar Auth API Endpoints"),

    h3("5.2.2  Admin API (24 Routes)"),
    bodyPara("API Admin menyediakan akses penuh untuk pengelolaan data kelahiran, verifikasi, pengelolaan pengguna, dan fungsi administratif lainnya. Endpoint ini hanya dapat diakses oleh pengguna dengan role ADMIN."),
    makeTable(
      ["No", "Kelompok", "Jumlah Endpoint"],
      [
        ["1", "Statistik Dashboard", "2 endpoints (stats, pending-count)"],
        ["2", "Manajemen Birth Records", "5 endpoints (list, detail, verify, reject, export)"],
        ["3", "Grafik dan Analitik", "3 endpoints (charts, analytics, reports)"],
        ["4", "Manajemen Users", "3 endpoints (list, create, update)"],
        ["5", "Manajemen Puskesmas", "2 endpoints (list, create/update)"],
        ["6", "Manajemen NIK Bayi", "2 endpoints (list, update)"],
        ["7", "Audit Log", "1 endpoint (list)"],
        ["8", "Dokumen Pendukung", "2 endpoints (list, download)"],
        ["9", "Pengaturan Sistem", "2 endpoints (settings, sync-schema)"],
        ["10", "Registrasi User", "1 endpoint (register)"],
        ["11", "Utility", "1 endpoint (download)"],
      ],
      [8, 45, 47]
    ),
    tableCaption("Tabel 12. Kelompok Admin API Endpoints"),

    h3("5.2.3  Operator API (8 Routes)"),
    bodyPara("API Operator menyediakan akses terbatas untuk pencatatan data kelahiran oleh operator Puskesmas. Setiap operator hanya dapat mengakses data dari Puskesmas tempat mereka ditugaskan."),
    makeTable(
      ["Method", "Endpoint", "Fungsi"],
      [
        ["GET", "/api/operator/stats", "Statistik dashboard operator"],
        ["GET", "/api/operator/birth-records", "Daftar data kelahiran"],
        ["POST", "/api/operator/birth-records", "Membuat data kelahiran baru"],
        ["GET", "/api/operator/birth-records/[id]", "Detail data kelahiran"],
        ["POST", "/api/operator/birth-records/[id]/files", "Upload dokumen pendukung"],
        ["POST", "/api/operator/import", "Import data dari Excel"],
        ["GET", "/api/operator/chart", "Data grafik untuk dashboard"],
        ["GET", "/api/operator/download", "Unduh data dalam format Excel"],
      ],
      [15, 45, 40]
    ),
    tableCaption("Tabel 13. Daftar Operator API Endpoints"),

    h3("5.2.4  BPJS API (3 Routes)"),
    bodyPara("API BPJS menyediakan akses data kelahiran yang telah diverifikasi untuk pihak BPJS Kesehatan. Akses ini bersifat read-only untuk menjaga integritas data."),
    makeTable(
      ["Method", "Endpoint", "Fungsi"],
      [
        ["GET", "/api/bpjs/stats", "Statistik data kelahiran terverifikasi"],
        ["GET", "/api/bpjs/records", "Daftar data kelahiran terverifikasi"],
        ["GET", "/api/bpjs/export", "Ekspor data untuk keperluan BPJS"],
      ],
      [15, 40, 45]
    ),
    tableCaption("Tabel 14. Daftar BPJS API Endpoints"),

    h3("5.2.5  System API (3 Routes)"),
    bodyPara("API System menyediakan endpoint khusus untuk inisialisasi dan seeding database. Endpoint ini hanya tersedia dalam environment development dan dinonaktifkan di production untuk keamanan."),

    h2("5.3  Komponen UI (43 shadcn/ui Components)"),
    bodyPara("Sistem menggunakan 43 komponen dari library shadcn/ui yang dikategorikan dalam beberapa kelompok fungsional. Penggunaan komponen yang konsisten memastikan keseragaman tampilan dan pengalaman pengguna di seluruh halaman."),

    makeTable(
      ["Kategori", "Jumlah", "Komponen Utama"],
      [
        ["Buttons", "4", "Button, Toggle, Toggle Group, Command"],
        ["Forms", "12", "Input, Textarea, Select, Checkbox, Radio Group, Switch, Label, Calendar, Date Picker, Form, Combobox, Slider"],
        ["Data Display", "9", "Table, Card, Badge, Avatar, Separator, Tabs, Table (Tanstack), Sheet (Data), Collapsible"],
        ["Feedback", "4", "Alert, Alert Dialog, Progress, Sonner (Toast)"],
        ["Navigation", "5", "Breadcrumb, Dropdown Menu, Navigation Menu, Sidebar, Menubar"],
        ["Overlays", "4", "Dialog, Popover, Tooltip, Hover Card"],
        ["Typography", "2", "Typography, Scroll Area"],
        ["Layout", "3", "Container, Aspect Ratio, Resizable"],
      ],
      [20, 12, 68]
    ),
    tableCaption("Tabel 15. Kategori Komponen shadcn/ui"),

    h2("5.4  Middleware dan Keamanan Rute"),
    bodyPara("Sistem mengimplementasikan middleware Next.js sebagai lapisan keamanan pertama sebelum request mencapai halaman atau API route. Middleware ini berjalan pada Edge Runtime Vercel yang memberikan performa eksekusi yang sangat cepat dengan latensi rendah."),
    bodyPara("Middleware melakukan beberapa fungsi keamanan, yaitu: pengecekan status autentikasi pengguna (sudah login atau belum), validasi peran pengguna terhadap route yang diakses, redirect otomatis ke halaman login jika pengguna belum terautentikasi, redirect ke dashboard yang sesuai berdasarkan peran, dan logging aktivitas akses route untuk keperluan audit."),
    bodyPara("Proteksi route diterapkan pada level halaman dan API. Pada level halaman, middleware memastikan bahwa hanya pengguna dengan peran yang sesuai yang dapat mengakses halaman tertentu. Pada level API, setiap endpoint melakukan verifikasi session dan peran secara independen sebagai defense in depth, sehingga meskipun proteksi halaman berhasil ditembus, API tetap aman."),
  ];
}

// ──────────────────────────────────────────
// BAB VI - FITUR UTAMA SISTEM
// ──────────────────────────────────────────
function buildBab6() {
  return [
    h1("BAB VI  FITUR UTAMA SISTEM"),

    h2("6.1  Manajemen Data Kelahiran"),
    bodyPara("Fitur utama sistem adalah manajemen data kelahiran yang komprehensif. Operator Puskesmas dapat melakukan input data kelahiran baru melalui form yang terstruktur dan mudah digunakan. Setiap data kelahiran mencatat informasi lengkap meliputi identitas ibu (NIK, nama), identitas ayah (nama), data bayi (nama, tanggal lahir, tempat lahir, jenis kelamin, berat badan, panjang badan), serta informasi Puskesmas pencatat."),
    bodyPara("Sistem menyediakan fitur pencarian dan filtering data berdasarkan berbagai kriteria seperti nama bayi, NIK ibu, tanggal lahir, status verifikasi, dan Puskesmas asal. Data ditampilkan dalam format tabel yang interaktif dengan fitur sorting, pagination, dan row selection untuk operasi batch."),

    h2("6.2  Verifikasi dan Persetujuan Data"),
    bodyPara("Admin Dukcapil dapat melakukan verifikasi terhadap data kelahiran yang dikirimkan oleh operator Puskesmas. Proses verifikasi mencakup pemeriksaan kelengkapan data, validasi informasi, dan persetujuan atau penolakan dengan alasan yang jelas. Sistem menyediakan tiga status untuk setiap record kelahiran, yaitu Pending (menunggu verifikasi), Approved (disetujui), dan Rejected (ditolak)."),
    bodyPara("Fitur pending count memberikan notifikasi real-time kepada admin mengenai jumlah data yang menunggu verifikasi. Seluruh proses verifikasi dicatat dalam audit log untuk keperluan akuntabilitas dan tracing."),

    h2("6.3  Manajemen NIK Bayi"),
    bodyPara("Setelah data kelahiran disetujui, admin dapat mengisi Nomor Induk Kependudukan (NIK) bayi. Fitur ini memungkinkan pengelolaan NIK bayi secara terpusat dengan mekanisme update yang aman. Setiap perubahan NIK dicatat dalam audit log lengkap dengan informasi user yang melakukan perubahan dan timestamp-nya. Sistem juga memvalidasi keunikan NIK untuk mencegah duplikasi."),

    h2("6.4  Upload dan Manajemen Dokumen"),
    bodyPara("Sistem menyediakan fitur upload dokumen pendukung untuk setiap record kelahiran. Operator dapat mengunggah dokumen-dokumen seperti surat keterangan kelahiran, fotokopi KTP orang tua, dan dokumen pendukung lainnya. File disimpan dalam database dalam format binary (BLOB) dengan metadata yang lengkap meliputi nama file, MIME type, ukuran file, dan informasi pengunggah."),
    bodyPara("Admin dapat melihat dan mengunduh dokumen pendukung yang telah diunggah untuk keperluan verifikasi. Manajemen dokumen dilakukan secara aman dengan validasi tipe file dan ukuran file yang diizinkan."),

    h2("6.5  Sistem Laporan dan Ekspor Data"),
    bodyPara("Sistem menyediakan fitur pelaporan yang komprehensif dengan kemampuan ekspor data ke format Excel (.xlsx). Admin dapat mengekspor seluruh data kelahiran atau data yang telah difilter berdasarkan kriteria tertentu. Fitur ekspor mendukung custom column selection sehingga pengguna dapat memilih kolom-kolom yang ingin diekspor."),
    bodyPara("Selain ekspor, sistem juga menyediakan fitur import data dari format Excel untuk memungkinkan migrasi data atau input massal. Proses import dilengkapi dengan validasi data untuk memastikan integritas data yang diimpor."),

    h2("6.6  Dashboard Analitik"),
    bodyPara("Dashboard analitik menyajikan visualisasi data dalam bentuk grafik dan statistik yang informatif. Admin dapat melihat tren kelahiran bulanan, distribusi berdasarkan Puskesmas, distribusi jenis kelamin, dan status verifikasi data. Grafik ditampilkan menggunakan library Recharts yang mendukung interaksi seperti hover tooltip, zoom, dan drill-down."),
    bodyPara("Dashboard operator menampilkan statistik ringkasan berupa total data yang telah dicatat, jumlah data pending, jumlah data yang disetujui, dan grafik tren pencatatan. Dashboard BPJS menampilkan statistik data kelahiran yang telah terverifikasi dan siap untuk diproses."),

    h2("6.7  Audit Trail dan Log Aktivitas"),
    bodyPara("Sistem mencatat seluruh aktivitas pengguna dalam audit log yang komprehensif. Setiap operasi CRUD, login, logout, verifikasi, dan perubahan data dicatat dengan informasi lengkap meliputi user yang melakukan aksi, jenis aksi, entitas yang diakses, detail perubahan, alamat IP, dan user agent."),
    bodyPara("Admin dapat mengakses halaman audit log untuk melihat riwayat aktivitas seluruh pengguna sistem. Fitur ini sangat penting untuk keperluan akuntabilitas, investigasi masalah, dan pemenuhan regulasi administrasi kependudukan."),

    h2("6.8  Manajemen Pengguna dan Puskesmas"),
    bodyPara("Admin memiliki akses penuh untuk mengelola data pengguna dan Puskesmas. Fitur manajemen pengguna mencakup pembuatan akun baru, pengaktifan/non-aktifkan akun, dan pembaruan informasi pengguna. Manajemen Puskesmas mencakup penambahan, pengeditan, dan pengelolaan data master Puskesmas yang tersebar di wilayah Kabupaten Ngada."),

    h2("6.9  Akses BPJS Kesehatan"),
    bodyPara("Pihak BPJS Kesehatan diberikan akses khusus untuk melihat data kelahiran yang telah diverifikasi oleh Dukcapil. Akses ini bersifat read-only untuk menjaga integritas data. BPJS dapat melakukan pencarian berdasarkan NIK ibu atau nama bayi, serta mengekspor data yang diperlukan untuk keperluan pendaftaran jaminan kesehatan nasional."),

    h2("6.10  Import Data Excel"),
    bodyPara("Sistem menyediakan fitur import data dari file Excel (.xlsx) untuk memudahkan input data secara massal. Operator Puskesmas dapat mengunggah file Excel yang berisi data kelahiran dalam format template yang telah ditentukan. Sistem akan memvalidasi setiap baris data sebelum disimpan ke database, dan menampilkan laporan hasil import berupa jumlah data yang berhasil diimport serta data yang gagal beserta alasan kegagalan."),

    h2("6.11  Mode Gelap/Terang (Dark/Light Mode)"),
    bodyPara("Sistem mendukung tampilan dark mode dan light mode yang dapat diaktifkan sesuai preferensi pengguna. Implementasi menggunakan library next-themes yang secara otomatis mendeteksi preferensi sistem operasi pengguna dan menyimpan pilihan di local storage. Perpindahan antara mode gelap dan terang dilakukan secara mulus tanpa perlu reload halaman, dengan transisi warna yang halus pada seluruh komponen."),

    h2("6.12  Responsif Mobile-First Design"),
    bodyPara("Seluruh halaman sistem dirancang dengan pendekatan mobile-first menggunakan Tailwind CSS. Tata letak responsif memastikan bahwa sistem dapat diakses dengan optimal melalui berbagai perangkat, mulai dari smartphone, tablet, hingga desktop. Navigasi menggunakan sidebar yang dapat di-collapse menjadi hamburger menu pada layar kecil, dan tabel data menggunakan horizontal scroll untuk menjaga keterbacaan pada perangkat mobile."),

    h2("6.13  Cetak Dokumen"),
    bodyPara("Sistem menyediakan fitur cetak untuk menghasilkan dokumen kelahiran dalam format yang siap cetak. Fitur ini memanfaatkan CSS print styles untuk menghasilkan tata letak yang optimal saat dicetak, termasuk penghapusan elemen-elemen navigasi dan fokus pada konten data kelahiran. Dokumen yang dihasilkan sesuai dengan standar format yang berlaku di Dukcapil."),
  ];
}

// ──────────────────────────────────────────
// BAB VII - ALUR KERJA SISTEM
// ──────────────────────────────────────────
function buildBab7() {
  return [
    h1("BAB VII  ALUR KERJA SISTEM"),

    h2("7.1  Alur Pencatatan oleh Operator Puskesmas"),
    bodyPara("Proses pencatatan data kelahiran oleh operator Puskesmas mengikuti alur kerja yang terstruktur sebagai berikut:"),
    bodyPara("Pertama, operator Puskesmas mengakses sistem melalui browser web dan melakukan login menggunakan username dan password yang telah disediakan oleh admin Dukcapil. Setelah berhasil login, operator akan diarahkan ke dashboard operator yang menampilkan ringkasan statistik data kelahiran dari Puskesmas tempat operator bertugas."),
    bodyPara("Kedua, operator mengakses halaman input data (/operator/input) untuk melakukan pencatatan kelahiran baru. Operator mengisi formulir yang mencakup data ibu (NIK dan nama), data ayah (nama), data bayi (nama, tanggal lahir, tempat lahir, jenis kelamin, berat badan, panjang badan), serta mengunggah dokumen pendukung yang diperlukan."),
    bodyPara("Ketiga, setelah formulir diisi lengkap, operator menekan tombol submit untuk mengirimkan data ke server. Sistem melakukan validasi data secara otomatis, termasuk pengecekan duplikasi NIK ibu. Jika validasi berhasil, data disimpan ke database dengan status Pending dan operator akan menerima notifikasi keberhasilan."),
    bodyPara("Keempat, operator dapat memantau status data yang telah dikirimkan melalui halaman riwayat (/operator/riwayat). Pada halaman ini, operator dapat melihat daftar seluruh data yang telah dicatat beserta status verifikasinya, melakukan pencarian, filtering, dan ekspor data ke format Excel."),

    h2("7.2  Alur Verifikasi oleh Admin Dukcapil"),
    bodyPara("Proses verifikasi data kelahiran oleh admin Dukcapil merupakan tahap kritis dalam alur kerja sistem:"),
    bodyPara("Pertama, admin Dukcapil login ke sistem dan diarahkan ke dashboard admin yang menampilkan statistik keseluruhan data kelahiran dari seluruh Puskesmas di Kabupaten Ngada. Dashboard juga menampilkan jumlah data yang menunggu verifikasi (pending count) sebagai pengingat bagi admin."),
    bodyPara("Kedua, admin mengakses daftar data kelahiran dan memfilter berdasarkan status Pending untuk melihat data yang memerlukan verifikasi. Admin dapat melihat detail setiap data kelahiran beserta dokumen pendukung yang diunggah oleh operator."),
    bodyPara("Ketiga, admin memeriksa kelengkapan dan keabsahan data. Jika data dinyatakan lengkap dan valid, admin menekan tombol Approve untuk menyetujui data. Jika terdapat kekurangan atau ketidaksesuaian, admin dapat menekan tombol Reject beserta mengisi alasan penolakan yang akan dikirimkan kembali kepada operator terkait."),
    bodyPara("Keempat, setelah data disetujui, admin dapat mengisi NIK bayi pada record yang bersangkutan. NIK bayi ini menjadi identitas resmi bayi yang tercatat dalam sistem dan dapat diakses oleh pihak BPJS Kesehatan."),

    h2("7.3  Alur Akses Data oleh BPJS"),
    bodyPara("Pihak BPJS Kesehatan memiliki akses terbatas untuk melihat data kelahiran yang telah diverifikasi:"),
    bodyPara("Pertama, perwakilan BPJS login ke sistem dengan akun yang memiliki role BPJS. Setelah login, BPJS akan diarahkan ke dashboard BPJS yang menampilkan statistik data kelahiran yang telah terverifikasi."),
    bodyPara("Kedua, BPJS dapat melakukan pencarian data berdasarkan kriteria tertentu seperti NIK ibu, nama bayi, atau rentang tanggal lahir. Data yang ditampilkan bersifat read-only dan hanya mencakup data yang telah mendapat status Approved dari admin Dukcapil."),
    bodyPara("Ketiga, BPJS dapat mengekspor data yang diperlukan ke format Excel untuk keperluan administrasi jaminan kesehatan nasional. Fitur ekspor mendukung pemilihan kolom yang ingin disertakan dan filter data berdasarkan berbagai parameter."),

    h2("7.4  Alur Manajemen NIK Bayi"),
    bodyPara("Proses pengelolaan NIK bayi merupakan bagian penting dari alur kerja sistem:"),
    bodyPara("Setelah data kelahiran disetujui oleh admin Dukcapil, langkah selanjutnya adalah pemberian NIK bayi. Admin mengakses halaman khusus NIK Bayi (/admin/nik-bayi) yang menampilkan daftar data kelahiran yang telah disetujui namun belum memiliki NIK. Admin memasukkan NIK bayi yang diterbitkan oleh Dukcapil pada kolom yang disediakan. Sistem melakukan validasi keunikan NIK untuk mencegah duplikasi. Setelah NIK berhasil disimpan, data kelahiran tersebut siap diakses oleh pihak BPJS Kesehatan untuk keperluan pendaftaran jaminan kesehatan."),
  ];
}

// ──────────────────────────────────────────
// BAB VIII - KEAMANAN SISTEM
// ──────────────────────────────────────────
function buildBab8() {
  return [
    h1("BAB VIII  KEAMANAN SISTEM"),

    h2("8.1  Autentikasi"),
    bodyPara("Sistem mengimplementasikan autentikasi menggunakan NextAuth.js v4 yang menyediakan mekanisme login yang aman dan terstandar. Proses autentikasi meliputi verifikasi username dan password, pembuatan session token, dan pengelolaan cookie session. Password pengguna di-hash menggunakan algoritma bcryptjs sebelum disimpan di database, sehingga password asli tidak disimpan dalam bentuk plain text."),
    bodyPara("Autentikasi menggunakan JWT (JSON Web Token) Strategy yang memungkinkan session management secara stateless. Token JWT disimpan dalam HTTP-only cookie untuk mencegah akses melalui JavaScript di sisi klien, sehingga mengurangi risiko pencurian token melalui serangan Cross-Site Scripting (XSS)."),

    h2("8.2  Otorisasi Berbasis Peran (RBAC)"),
    bodyPara("Sistem mengimplementasikan Role-Based Access Control (RBAC) dengan tiga level peran yang memiliki hak akses berbeda. Admin Dukcapil memiliki akses penuh ke seluruh fungsi sistem termasuk verifikasi data, pengelolaan pengguna, pengelolaan Puskesmas, dan pengaturan sistem. Operator Puskesmas memiliki akses terbatas untuk pencatatan data kelahiran dan pengelolaan dokumen hanya pada Puskesmas tempat mereka ditugaskan. User BPJS memiliki akses read-only terhadap data kelahiran yang telah diverifikasi."),
    bodyPara("Otorisasi diterapkan pada dua level, yaitu level middleware untuk proteksi halaman dan level API untuk proteksi endpoint. Pendekatan defense in depth ini memastikan bahwa setiap lapisan sistem memiliki mekanisme keamanan yang independen."),

    h2("8.3  Enkripsi Password"),
    bodyPara("Seluruh password pengguna dienkripsi menggunakan library bcryptjs sebelum disimpan di database. Bcrypt menggunakan algoritma hashing yang secara intentional dibuat lambat (key stretching) untuk melindungi terhadap serangan brute force. Setiap password di-hash dengan salt yang unik dan random, sehingga password yang sama menghasilkan hash yang berbeda. Faktor cost (work factor) bcrypt diatur pada level yang memberikan keseimbangan antara keamanan dan performa."),

    h2("8.4  Proteksi Rute dengan Middleware"),
    bodyPara("Middleware Next.js digunakan sebagai lapisan pertahanan pertama untuk melindungi route-route sensitif. Middleware berjalan pada Edge Runtime Vercel yang memberikan eksekusi dengan latensi sangat rendah. Setiap request ke route yang dilindungi akan diperiksa status autentikasi dan peran penggunanya. Jika pengguna belum login, request akan diarahkan ke halaman login. Jika peran pengguna tidak sesuai, request akan diarahkan ke dashboard yang sesuai dengan perannya."),

    h2("8.5  Session Management"),
    bodyPara("Sistem mengimplementasikan session timeout selama 15 menit sebagai mekanisme keamanan tambahan. Jika pengguna tidak melakukan aktivitas selama periode tersebut, session akan otomatis berakhir dan pengguna harus login kembali. Token JWT yang digunakan memiliki masa berlaku yang terbatas untuk mengurangi risiko penggunaan token yang dicuri."),
    bodyPara("Session disimpan dalam HTTP-only cookie yang tidak dapat diakses melalui JavaScript di sisi klien. Seluruh komunikasi antara klien dan server dilakukan melalui protokol HTTPS yang mengenkripsi data selama transmisi."),

    h2("8.6  Audit Logging"),
    bodyPara("Sistem menyediakan audit logging yang komprehensif untuk mencatat seluruh aktivitas yang terjadi. Setiap aktivitas dicatat dengan informasi lengkap meliputi identitas pengguna (userId), jenis aksi (CREATE, READ, UPDATE, DELETE, LOGIN, LOGOUT), entitas yang diakses, detail perubahan dalam format JSON, alamat IP sumber, user agent browser, dan timestamp pencatatan."),
    bodyPara("Audit log tidak dapat dimodifikasi atau dihapus oleh pengguna biasa, sehingga menyediakan catatan aktivitas yang akuntabel dan dapat dipertanggungjawabkan. Fitur ini sangat penting untuk keperluan investigasi, compliance, dan pelaporan keamanan."),

    h2("8.7  Soft Delete Pattern"),
    bodyPara("Sistem menggunakan pola soft delete untuk penghapusan data kelahiran. Alih-alih menghapus data secara permanen dari database, sistem menandai data sebagai terhapus dengan mengubah nilai kolom isDeleted menjadi true. Data yang ditandai sebagai terhapus tidak akan ditampilkan dalam query normal, namun tetap tersimpan di database untuk keperluan audit dan pemulihan data."),
    bodyPara("Pola ini memberikan keuntungan berupa kemampuan untuk memulihkan data yang tidak sengaja dihapus, menjaga integritas referential data, menyediakan jejak audit yang lengkap, dan memenuhi kebutuhan retensi data administrasi kependudukan."),

    h2("8.8  Masking NIK"),
    bodyPara("Sistem mengimplementasikan masking NIK (Nomor Induk Kependudukan) untuk melindungi data sensitif pengguna. NIK ditampilkan dalam format terparsial pada antarmuka pengguna, hanya menampilkan beberapa digit pertama dan terakhir sementara digit tengah disamarkan. Data NIK lengkap hanya dapat dilihat oleh pengguna yang memiliki otorisasi yang memadai, yaitu admin Dukcapil."),
    bodyPara("Penerapan masking NIK merupakan implementasi prinsip least privilege dan data minimization dalam perlindungan data pribadi sesuai dengan regulasi perlindungan data yang berlaku di Indonesia."),
  ];
}

// ──────────────────────────────────────────
// BAB IX - KEUNGGULAN TEKNIS
// ──────────────────────────────────────────
function buildBab9() {
  return [
    h1("BAB IX  KEUNGGULAN TEKNIS"),

    h2("9.1  Serverless Architecture"),
    bodyPara("Arsitektur serverless yang digunakan memberikan beberapa keuntungan signifikan dibandingkan arsitektur server tradisional. Dengan serverless, scaling terjadi secara otomatis berdasarkan beban request tanpa perlu konfigurasi manual. Biaya operasional lebih efisien karena resource hanya digunakan ketika ada request yang diproses. Maintenance infrastruktur menjadi minimal karena platform Vercel menangani seluruh aspek pengelolaan server, termasuk patching keamanan dan pembaruan sistem operasi."),
    bodyPara("Dalam konteks sistem pencatatan kelahiran yang memiliki pola penggunaan yang fluktuatif (jam kerja vs di luar jam kerja), arsitektur serverless memberikan efisiensi biaya yang optimal karena resource hanya dialokasikan saat dibutuhkan."),

    h2("9.2  Single-Page Application (SPA) Experience"),
    bodyPara("Meskipun dibangun sebagai aplikasi web, sistem memberikan pengalaman pengguna yang setara dengan Single-Page Application (SPA). Navigasi antar halaman terjadi tanpa reload penuh berkat fitur client-side routing dari Next.js. Transisi antar halaman berlangsung secara mulus dan cepat, memberikan kesan responsif dan modern kepada pengguna."),
    bodyPara("Penggunaan Server-Side Rendering (SSR) pada halaman-halaman tertentu memastikan bahwa konten halaman langsung tersedia tanpa perlu menunggu JavaScript dimuat di klien, sehingga juga mendukung Search Engine Optimization (SEO) dan aksesibilitas."),

    h2("9.3  Real-time Auto Refresh"),
    bodyPara("Sistem mengimplementasikan mekanisme auto refresh data menggunakan @tanstack/react-query. Data pada dashboard dan tabel secara otomatis diperbarui pada interval tertentu tanpa perlu reload halaman. Fitur ini memastikan bahwa pengguna selalu melihat data terkini tanpa perlu melakukan aksi manual."),
    bodyPara("Auto refresh juga diterapkan pada notifikasi pending count yang menampilkan jumlah data yang menunggu verifikasi, sehingga admin dapat segera mengetahui jika ada data baru yang memerlukan perhatian."),

    h2("9.4  Optimasi Database dengan Index"),
    bodyPara("Performa database dioptimalkan melalui penggunaan index pada kolom-kolom yang sering di-query. Index unik pada kolom NIK memastikan kecepatan pencarian dan mencegah duplikasi. Compound index pada kombinasi kolom mendukung query kompleks yang sering digunakan pada dashboard. Pagination implementasi menggunakan cursor-based pagination untuk efisiensi pengambilan data dalam jumlah besar."),

    h2("9.5  Responsive Design"),
    bodyPara("Sistem dirancang dengan pendekatan mobile-first menggunakan Tailwind CSS, memastikan tampilan optimal di semua ukuran layar. Tata letak responsif menyesuaikan secara otomatis dengan ukuran perangkat, mulai dari navigasi sidebar yang berubah menjadi hamburger menu pada layar kecil, tabel yang mendukung horizontal scroll, dan form yang menyesuaikan lebar inputnya."),

    h2("9.6  Dark Mode Support"),
    bodyPara("Sistem mendukung tema gelap dan terang yang dapat diaktifkan sesuai preferensi pengguna. Implementasi menggunakan library next-themes yang menyediakan manajemen tema yang handal dengan deteksi otomatis preferensi sistem operasi. Perpindahan tema dilakukan dengan transisi warna yang halus pada seluruh komponen, menciptakan pengalaman visual yang konsisten dan nyaman."),

    h2("9.7  Micro-interactions dan Animasi"),
    bodyPara("Untuk meningkatkan pengalaman pengguna, sistem dilengkapi dengan micro-interactions dan animasi yang halus. Library Framer Motion digunakan untuk animasi transisi antar elemen, animasi masuk/keluar komponen, dan efek hover. tw-animate-css menyediakan animasi CSS ringan untuk loading states, toast notifications, dan feedback interaksi. Custom CSS animations menambahkan efek glassmorphism pada komponen tertentu, memberikan tampilan modern dan elegan."),

    h2("9.8  Glassmorphism Design"),
    bodyPara("Sistem mengadopsi design language glassmorphism pada beberapa elemen antarmuka untuk memberikan kesan modern dan profesional. Efek glassmorphism diimplementasikan menggunakan kombinasi backdrop-filter blur, semi-transparent backgrounds, dan border halus yang menciptakan efek kaca transparan. Desain ini memberikan kedalaman visual yang menarik tanpa mengorbankan fungsionalitas dan keterbacaan."),
  ];
}

// ──────────────────────────────────────────
// BAB X - PENUTUP
// ──────────────────────────────────────────
function buildBab10() {
  return [
    h1("BAB X  PENUTUP"),

    h2("10.1  Kesimpulan"),
    bodyPara("Sistem Pencatatan Nama Bayi Baru Lahir yang dikembangkan sebagai inovasi pelayanan publik digital di Dinas Kependudukan dan Pencatatan Sipil Kabupaten Ngada telah berhasil diimplementasikan dengan menggunakan teknologi web modern. Sistem ini menyediakan solusi terpadu untuk mengelola data kelahiran mulai dari tingkat Puskesmas hingga Dukcapil dengan arsitektur yang skalabel, aman, dan mudah digunakan."),
    bodyPara("Dari segi teknis, sistem dibangun menggunakan stack teknologi yang modern dan teruji, meliputi Next.js 16, TypeScript 5, PostgreSQL (Supabase), dan Prisma ORM. Arsitektur serverless yang digunakan memungkinkan sistem untuk beroperasi secara efisien dengan biaya operasional yang optimal. Fitur keamanan yang komprehensif, meliputi autentikasi JWT, RBAC, enkripsi password, session timeout, dan audit logging, memastikan bahwa data kelahiran yang sensitif terlindungi dengan baik."),
    bodyPara("Dari segi fungsional, sistem menyediakan 16 halaman, 42 API endpoints, dan 43 komponen UI yang mencakup seluruh kebutuhan pengelolaan data kelahiran. Fitur-fitur seperti manajemen data kelahiran, verifikasi berjenjang, manajemen NIK bayi, upload dokumen, pelaporan dan ekspor data, dashboard analitik, dan audit trail menjadikan sistem ini sebagai platform yang lengkap dan komprehensif."),

    h2("10.2  Manfaat bagi Dukcapil Kabupaten Ngada"),
    bodyPara("Implementasi sistem ini memberikan beberapa manfaat nyata bagi Dukcapil Kabupaten Ngada, antara lain:"),
    bulletItem("Efisiensi Proses: Digitalisasi pencatatan kelahiran mengurangi waktu yang dibutuhkan untuk proses pelaporan dan verifikasi data secara signifikan, dari yang semula berhari-hari menjadi hitungan menit."),
    bulletItem("Akurasi Data: Mekanisme validasi otomatis dan verifikasi berjenjang mengurangi risiko kesalahan pencatatan dan duplikasi data."),
    bulletItem("Transparansi: Sistem audit trail menyediakan catatan aktivitas yang transparan dan dapat dipertanggungjawabkan, mendukung prinsip good governance."),
    bulletItem("Aksesibilitas: Sistem berbasis web dapat diakses dari mana saja dan kapan saja melalui browser internet, memudahkan koordinasi antar Puskesmas yang tersebar di wilayah Kabupaten Ngada."),
    bulletItem("Penghematan Biaya: Pengurangan penggunaan dokumen fisik, amplop, dan biaya transportasi untuk pengiriman berkas menghasilkan efisiensi anggaran."),
    bulletItem("Pengambilan Keputusan: Dashboard analitik menyediakan data dan visualisasi yang mendukung pengambilan keputusan berbasis bukti (evidence-based decision making)."),
    bulletItem("Integrasi BPJS: Kemudahan akses data oleh pihak BPJS Kesehatan mempercepat proses pendaftaran jaminan kesehatan bagi bayi baru lahir."),

    h2("10.3  Potensi Pengembangan"),
    bodyPara("Sistem ini memiliki beberapa potensi pengembangan di masa depan yang dapat meningkatkan fungsionalitas dan jangkauannya, antara lain:"),
    bulletItem("Integrasi dengan Sistem Dukcapil Nasional: Menghubungkan sistem dengan database Dukcapil pusat untuk sinkronisasi data kependudukan secara real-time."),
    bulletItem("Notifikasi Elektronik: Menambahkan fitur notifikasi via email atau SMS untuk menginformasikan operator mengenai status verifikasi data kelahiran."),
    bulletItem("Fitur Mobile App: Mengembangkan aplikasi mobile untuk meningkatkan aksesibilitas, khususnya bagi operator Puskesmas yang berada di daerah dengan keterbatasan infrastruktur internet."),
    bulletItem("Digital Signature: Mengimplementasikan tanda tangan digital pada dokumen kelahiran untuk meningkatkan keamanan dan validitas dokumen."),
    bulletItem("Advanced Analytics: Mengembangkan fitur analitik yang lebih canggih dengan machine learning untuk deteksi anomali data dan prediksi tren kelahiran."),
    bulletItem("Multi-Bahasa: Menambahkan dukungan multi-bahasa untuk mengakomodasi keberagaman bahasa daerah di Kabupaten Ngada."),
    bulletItem("Offline Mode: Mengembangkan kemampuan offline untuk memungkinkan pencatatan data tanpa koneksi internet, dengan sinkronisasi otomatis ketika koneksi tersedia."),
    bulletItem("Pengembangan API Publik: Menyediakan API publik yang terstandar untuk memudahkan integrasi dengan sistem lain di lingkungan pemerintah daerah."),
    bodyPara("Dengan terus berinovasi dan mengembangkan sistem ini, Dukcapil Kabupaten Ngada dapat menjadi contoh best practice dalam pelayanan publik digital yang tidak hanya efisien tetapi juga memberikan dampak positif yang nyata bagi masyarakat Kabupaten Ngada dan sekitarnya."),
  ];
}

// ──────────────────────────────────────────
// DOCUMENT ASSEMBLY
// ──────────────────────────────────────────
async function main() {
  const outputPath = "/home/z/my-project/download/Laporan-Struktur-Teknologi-Sistem-Pencatatan-Bayi.docx";

  // Cover section
  const coverSection = {
    properties: {
      page: {
        size: { width: 11906, height: 16838 },
        margin: { top: 0, bottom: 0, left: 0, right: 0 },
      },
    },
    children: buildCover(),
  };

  // TOC section (Roman numerals)
  const tocSection = {
    properties: {
      type: SectionType.NEXT_PAGE,
      page: {
        size: { width: 11906, height: 16838 },
        margin: { top: 1440, bottom: 1440, left: 1701, right: 1417 },
      },
      page: {
        pageNumbers: { start: 1, formatType: NumberFormat.UPPER_ROMAN },
      },
    },
    headers: {
      default: new Header({
        children: [new Paragraph({
          alignment: AlignmentType.RIGHT,
          children: [new TextRun({ text: "Laporan Struktur dan Teknologi - Sistem Pencatatan Bayi", size: 18, color: c(palette.secondary), font: { ascii: "Calibri" } })],
        })],
      }),
    },
    footers: {
      default: new Footer({
        children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "PAGE \\* ROMAN \\* MERGEFORMAT", size: 18, color: c(palette.secondary), font: { ascii: "Calibri" } })],
        })],
      }),
    },
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 480, after: 360 },
        children: [new TextRun({ text: "DAFTAR ISI", bold: true, size: 32, font: { ascii: "Calibri" }, color: c(palette.primary) })],
      }),
      new TableOfContents("Table of Contents", {
        hyperlink: true,
        headingStyleRange: "1-3",
      }),
      new Paragraph({
        spacing: { before: 200 },
        children: [new TextRun({
          text: "Catatan: Daftar isi ini dihasilkan melalui field codes. Untuk memastikan akurasi nomor halaman setelah pengeditan, silakan klik kanan pada daftar isi dan pilih \"Update Field.\"",
          italics: true, size: 18, color: c(palette.secondary), font: { ascii: "Calibri" },
        })],
      }),
      new Paragraph({ children: [new PageBreak()] }),
    ],
  };

  // Body section (Arabic numerals)
  const bodyChildren = [
    ...buildBab1(),
    ...buildBab2(),
    ...buildBab3(),
    ...buildBab4(),
    ...buildBab5(),
    ...buildBab6(),
    ...buildBab7(),
    ...buildBab8(),
    ...buildBab9(),
    ...buildBab10(),
  ];

  const bodySection = {
    properties: {
      type: SectionType.NEXT_PAGE,
      page: {
        size: { width: 11906, height: 16838 },
        margin: { top: 1440, bottom: 1440, left: 1701, right: 1417 },
        pageNumbers: { start: 1, formatType: NumberFormat.DECIMAL },
      },
    },
    headers: {
      default: new Header({
        children: [new Paragraph({
          alignment: AlignmentType.RIGHT,
          children: [new TextRun({ text: "Laporan Struktur dan Teknologi - Sistem Pencatatan Bayi", size: 18, color: c(palette.secondary), font: { ascii: "Calibri" } })],
        })],
      }),
    },
    footers: {
      default: new Footer({
        children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "PAGE \\* arabic \\* MERGEFORMAT", size: 18, color: c(palette.secondary), font: { ascii: "Calibri" } })],
        })],
      }),
    },
    children: bodyChildren,
  };

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: { ascii: "Calibri" },
            size: 24,
            color: c(palette.body),
          },
          paragraph: {
            spacing: { line: 312 },
          },
        },
        heading1: {
          run: { font: { ascii: "Calibri" }, size: 32, bold: true, color: c(palette.primary) },
          paragraph: { spacing: { before: 480, after: 200, line: 312 } },
        },
        heading2: {
          run: { font: { ascii: "Calibri" }, size: 28, bold: true, color: c(palette.primary) },
          paragraph: { spacing: { before: 360, after: 160, line: 312 } },
        },
        heading3: {
          run: { font: { ascii: "Calibri" }, size: 24, bold: true, color: c(palette.primary) },
          paragraph: { spacing: { before: 240, after: 120, line: 312 } },
        },
      },
    },
    sections: [coverSection, tocSection, bodySection],
  });

  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(outputPath, buffer);
  console.log("Document generated successfully: " + outputPath);
}

main().catch(err => { console.error(err); process.exit(1); });
