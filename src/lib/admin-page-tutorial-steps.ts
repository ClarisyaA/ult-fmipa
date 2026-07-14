import type { TutorialStep } from "@/lib/tutorial-types";

const dashboardSteps: TutorialStep[] = [
  {
    title: "Dashboard Admin",
    body: "Dashboard adalah ringkasan cepat beban kerja ULT. Mulai dari sini untuk melihat kondisi umum sebelum masuk ke halaman operasional.",
  },
  {
    title: "Kartu Ringkasan",
    body: "Kartu ini membantu membaca jumlah pengajuan, proses, selesai, dan pengiriman. Gunakan untuk mengidentifikasi workload harian.",
    target: "admin-dashboard-summary",
  },
  {
    title: "Pengajuan Terbaru",
    body: "Bagian aktivitas terbaru membantu menangkap request baru yang perlu dicek. Buka Detail dari daftar ini jika ingin lanjut memproses.",
    target: "admin-dashboard-latest",
  },
  {
    title: "Notifikasi",
    body: "Lonceng menampilkan sinyal request atau aktivitas yang perlu perhatian. Biasakan cek ini saat mulai shift.",
    target: "admin-notification-button",
  },
  {
    title: "Navigasi Sidebar",
    body: "Sidebar dipakai untuk pindah ke operasional, CMS, reporting, data, dan system. Pilih menu sesuai pekerjaan yang sedang dilakukan.",
    target: "admin-sidebar-requests",
  },
  {
    title: "Tombol Tutorial",
    body: "Tombol ini tersedia di semua halaman admin. Di dashboard kamu bisa memilih Tutorial Lengkap Admin atau Tutorial Halaman Ini.",
    target: "admin-tutorial-button",
  },
];

const requestListSteps: TutorialStep[] = [
  {
    title: "Pengajuan Layanan",
    body: "Halaman ini adalah pusat kerja request. Pilih layanan, cek status, buka detail, lalu proses sesuai urutan workflow.",
  },
  {
    title: "Filter Layanan",
    body: "Gunakan tab kategori dan pilihan layanan untuk mempersempit tabel. Ini penting supaya admin fokus ke layanan yang sedang ditangani.",
    target: "admin-requests-filters",
  },
  {
    title: "Status Tabs",
    body: "Tab status membantu memisahkan request yang menunggu, diproses, selesai, atau sudah diambil/dikirim. Pastikan filter status benar sebelum export.",
    target: "admin-requests-status-tabs",
  },
  {
    title: "Urutan Data",
    body: "Pilih Terbaru dulu untuk request baru atau Terlama dulu untuk mengejar antrean lama. Urutan ini juga memengaruhi cara kamu membaca tabel.",
    target: "admin-requests-sort",
  },
  {
    title: "Download Data",
    body: "Download Semua Data mengambil seluruh request. Download Sesuai Filter mengikuti filter layanan/status yang sedang aktif, jadi cek filter dulu.",
    target: "admin-requests-download",
  },
  {
    title: "Tabel Request",
    body: "Tabel menampilkan ringkasan pemohon, layanan, status, dan aksi. Gunakan tombol Detail untuk membuka panel kanan tanpa kehilangan konteks tabel.",
    target: "admin-requests-table",
  },
  {
    title: "Buka Detail",
    body: "Klik Detail pada salah satu baris untuk melihat data lengkap. Jika ada data, tombol di bawah bisa membuka contoh detail pertama.",
    target: "admin-requests-row-detail-button",
    ctaLabel: "Buka contoh detail",
    onCta: "open-first-request-preview",
  },
  {
    title: "Panel Detail",
    body: "Panel detail berisi identitas mahasiswa, data layanan, workflow, lampiran, email helper, dan aksi hapus. Jika belum terbuka, klik Detail pada baris request.",
    target: "admin-requests-preview-panel",
    ctaLabel: "Buka contoh detail",
    onCta: "open-first-request-preview",
  },
  {
    title: "Aksi Status",
    body: "Gunakan aksi status secara berurutan. Cek data dan lampiran dulu sebelum menandai selesai agar email/PDF yang dikirim tidak salah.",
    target: "admin-request-status-actions",
    ctaLabel: "Buka contoh detail",
    onCta: "open-first-request-preview",
  },
  {
    title: "Gmail Helper",
    body: "Helper Gmail hanya menyiapkan draft email. File hasil layanan, termasuk PDF surat, tetap harus dilampirkan manual oleh admin.",
    target: "admin-request-email-helper",
    ctaLabel: "Buka contoh detail",
    onCta: "open-first-request-preview",
  },
];

const requestDetailSteps: TutorialStep[] = [
  {
    title: "Detail Request",
    body: "Halaman detail dipakai saat perlu memproses satu pengajuan secara penuh. Verifikasi data sebelum menekan aksi workflow.",
  },
  {
    title: "Identitas Mahasiswa",
    body: "Cek nama, NPM, email, program studi, jenjang, dan bahasa surat. Data identitas berasal dari request dan referensi legacy.",
    target: "admin-request-detail-data",
  },
  {
    title: "Data Layanan",
    body: "Baca kebutuhan layanan, tujuan surat, tanggal, instansi, atau informasi spesifik lain. Pastikan tidak ada field penting yang keliru.",
    target: "admin-request-detail-data",
  },
  {
    title: "Lampiran",
    body: "Cek lampiran sebelum memproses. Untuk Magang/KP/TA, surat pengantar prodi wajib diperhatikan; untuk layanan lain ikuti syaratnya.",
    target: "admin-request-attachments",
  },
  {
    title: "Workflow Status",
    body: "Update workflow sesuai urutan operasional. Jangan menandai selesai sebelum data, lampiran, dan surat sudah siap.",
    target: "admin-request-status-actions",
  },
  {
    title: "Data Surat",
    body: "Untuk layanan printable, Data Surat berisi nomor, tanggal, jabatan penandatangan, nama penandatangan, dan NIP. Lengkapi sebelum cetak PDF.",
    target: "admin-request-letter-metadata",
  },
  {
    title: "Cetak Dua Bahasa",
    body: "Bahasa Surat adalah preferensi mahasiswa, tetapi admin tetap bisa cetak versi Indonesia dan Inggris bila diperlukan.",
    target: "admin-request-print-buttons",
  },
  {
    title: "Gmail Helper",
    body: "Gmail helper tidak auto-send dan tidak auto-attach. Buka Gmail, cek isi email, lalu lampirkan file hasil layanan secara manual.",
    target: "admin-request-email-helper",
  },
  {
    title: "Hapus Pengajuan",
    body: "Aksi hapus hanya untuk koreksi data yang memang perlu dihapus. Gunakan hati-hati karena ini memengaruhi data operasional.",
    target: "admin-preview-delete-action",
  },
];

const sikSteps: TutorialStep[] = [
  {
    title: "Alur SIK",
    body: "Surat Izin Kegiatan berbeda dari request normal karena punya tahapan bukti ACC dan form final. Jangan proses normal sebelum tahapnya lengkap.",
  },
  {
    title: "Cek Bukti ACC",
    body: "Periksa bukti persetujuan kegiatan. Jika bukti belum sesuai, tolak dengan alasan yang jelas dan sopan.",
    target: "admin-sik-verification",
    ctaLabel: "Buka contoh detail",
    onCta: "open-first-request-preview",
    previewService: "surat-izin-kegiatan",
  },
  {
    title: "Setujui atau Tolak",
    body: "Setujui verifikasi untuk membuka form final SIK. Jika ditolak, mahasiswa perlu tahu alasan yang bisa ditindaklanjuti.",
    target: "admin-sik-verification",
    ctaLabel: "Buka contoh detail",
    onCta: "open-first-request-preview",
    previewService: "surat-izin-kegiatan",
  },
  {
    title: "Setelah Final",
    body: "Setelah mahasiswa mengirim form final, barulah proses status dan pengiriman email dapat dilanjutkan seperti workflow layanan.",
    target: "admin-request-status-actions",
    ctaLabel: "Buka contoh detail",
    onCta: "open-first-request-preview",
    previewService: "surat-izin-kegiatan",
  },
];

const magangSteps: TutorialStep[] = [
  {
    title: "Magang/KP/TA",
    body: "Request Magang/KP/TA perlu dicek lebih teliti karena PDF resmi memuat tujuan instansi, periode, dan data surat.",
  },
  {
    title: "Lampiran Prodi",
    body: "Pastikan surat pengantar atau lampiran dari prodi tersedia dan sesuai. Lampiran ini menjadi dasar permohonan resmi.",
    target: "admin-request-attachments",
    ctaLabel: "Buka contoh detail",
    onCta: "open-first-request-preview",
    previewService: "permohonan-magang-kerja-praktek-ta",
  },
  {
    title: "Data Instansi",
    body: "Cek tujuan, alamat, kota/provinsi, dan kontak penerima. Kesalahan tujuan akan ikut muncul pada PDF surat.",
    target: "admin-request-detail-data",
    ctaLabel: "Buka contoh detail",
    onCta: "open-first-request-preview",
    previewService: "permohonan-magang-kerja-praktek-ta",
  },
  {
    title: "Periode Kegiatan",
    body: "Pastikan tanggal mulai dan selesai benar. Periode ini dipakai dalam isi surat resmi.",
    target: "admin-request-detail-data",
    ctaLabel: "Buka contoh detail",
    onCta: "open-first-request-preview",
    previewService: "permohonan-magang-kerja-praktek-ta",
  },
  {
    title: "Data Surat Magang",
    body: "Isi metadata surat dan penandatangan sebelum cetak. PDF resmi Magang memakai Data Surat ini.",
    target: "admin-magang-letter",
    ctaLabel: "Buka contoh detail",
    onCta: "open-first-request-preview",
    previewService: "permohonan-magang-kerja-praktek-ta",
  },
  {
    title: "Cetak dan Kirim",
    body: "Cetak versi Indonesia atau Inggris sesuai kebutuhan. Setelah itu lampirkan PDF secara manual di Gmail helper.",
    target: "admin-request-email-helper",
    ctaLabel: "Buka contoh detail",
    onCta: "open-first-request-preview",
    previewService: "permohonan-magang-kerja-praktek-ta",
  },
];

const suggestionSteps: TutorialStep[] = [
  {
    title: "Usulan Layanan",
    body: "Halaman ini mengumpulkan ide layanan baru dan saran peningkatan dari mahasiswa. Usulan tidak otomatis menjadi layanan baru.",
  },
  {
    title: "Daftar Usulan",
    body: "Baca nama, NPM, layanan yang diusulkan, status, dan tanggal. Gunakan Detail untuk melihat isi lengkap.",
    target: "admin-service-suggestions-list",
  },
  {
    title: "Review Usulan",
    body: "Di detail, baca kebutuhan layanan dan saran peningkatan. Tandai ditinjau atau arsipkan untuk melacak tindak lanjut.",
    target: "admin-service-suggestions-detail",
  },
];

const informationSteps: TutorialStep[] = [
  {
    title: "CMS Informasi",
    body: "Gunakan halaman ini untuk membuat dan mengelola pengumuman publik. Cek judul, isi, visibilitas, dan jadwal sebelum publikasi.",
  },
  {
    title: "Daftar Informasi",
    body: "Tabel menampilkan draft dan publikasi. Dari sini kamu bisa edit, ubah status, hapus, atau buka halaman publik untuk pengecekan.",
    target: "admin-information-list",
  },
  {
    title: "Gambar Informasi",
    body: "Saat edit, unggah gambar yang aman dan pilih image fit. Cover mengisi area dengan cropping; contain menjaga gambar tampil utuh.",
    target: "admin-information-list",
  },
];

const informationFormSteps: TutorialStep[] = [
  {
    title: "Form Informasi",
    body: "Form ini dipakai untuk membuat atau mengedit informasi publik. Isi dari atas ke bawah, lalu cek ulang status dan jadwal sebelum simpan.",
  },
  {
    title: "Judul",
    body: "Isi judul yang jelas dan mudah dicari. Judul juga menjadi dasar slug/pratinjau tautan publik.",
    target: "admin-info-title",
  },
  {
    title: "Slug Otomatis",
    body: "Pratinjau tautan menunjukkan alamat publik yang akan dipakai. Jika judul berubah, slug ikut disiapkan dari judul.",
    target: "admin-info-slug",
  },
  {
    title: "Kategori",
    body: "Kategori membantu admin dan pengunjung mengenali jenis informasi, misalnya Akademik, Beasiswa, atau Agenda.",
    target: "admin-info-category",
  },
  {
    title: "Status",
    body: "Draft belum tampil publik. Dipublikasikan tampil jika aktif dan jadwalnya sesuai. Diarsipkan dipakai untuk informasi lama.",
    target: "admin-info-status",
  },
  {
    title: "Aktif",
    body: "Aktif adalah saklar visibilitas. Informasi berstatus published tetap bisa disembunyikan sementara dengan menonaktifkan field ini.",
    target: "admin-info-active",
  },
  {
    title: "Unggulan",
    body: "Centang Unggulan jika informasi perlu mendapat sorotan lebih tinggi di tampilan publik.",
    target: "admin-info-featured",
  },
  {
    title: "Mulai Tampil",
    body: "Isi tanggal mulai jika informasi baru boleh muncul pada waktu tertentu. Kosongkan jika boleh langsung mengikuti status aktif.",
    target: "admin-info-start-date",
  },
  {
    title: "Selesai Tampil",
    body: "Isi tanggal selesai jika informasi punya masa tayang. Setelah lewat, informasi tidak perlu dihapus dari database.",
    target: "admin-info-end-date",
  },
  {
    title: "Ringkasan",
    body: "Ringkasan adalah preview singkat untuk daftar atau card. Buat padat, tidak perlu menyalin seluruh isi konten.",
    target: "admin-info-summary",
  },
  {
    title: "Konten",
    body: "Konten adalah isi utama pengumuman. Pastikan tanggal, link, kontak, dan instruksi sudah benar sebelum dipublikasikan.",
    target: "admin-info-content",
  },
  {
    title: "Gambar Informasi",
    body: "Unggah gambar pendukung bila perlu. Untuk logo atau poster, pilih tampilan utuh agar gambar tidak terpotong.",
    target: "admin-info-images",
  },
  {
    title: "Simpan Informasi",
    body: "Setelah semua field dicek, simpan. Jika status published dan aktif, informasi dapat tampil di halaman publik sesuai jadwal.",
    target: "admin-info-save",
  },
];

const homeActivitySteps: TutorialStep[] = [
  {
    title: "Kegiatan Beranda",
    body: "Halaman ini mengatur konten kegiatan yang tampil dinamis di homepage.",
  },
  {
    title: "Daftar Kegiatan",
    body: "Tambah atau edit judul, deskripsi, link, status, urutan, dan gambar. Jika gambar lokal hilang, upload ulang dari halaman edit.",
    target: "admin-home-activities-list",
  },
  {
    title: "Image Fit",
    body: "Gunakan cover untuk gambar foto yang boleh terpotong rapi. Gunakan contain untuk logo atau poster yang harus tampil penuh.",
    target: "admin-home-activities-list",
  },
];

const homeActivityFormSteps: TutorialStep[] = [
  {
    title: "Form Kegiatan",
    body: "Form ini mengatur item carousel Kegiatan Mahasiswa di homepage. Isi teks, urutan, status, dan gambar dengan rapi.",
  },
  {
    title: "Judul Kegiatan",
    body: "Judul menjadi teks utama card. Gunakan judul pendek yang tetap menggambarkan kegiatan.",
    target: "admin-activity-title",
  },
  {
    title: "Eyebrow / Kategori",
    body: "Eyebrow adalah label kecil di atas judul, misalnya Agenda Sivitas. Ini membantu pengunjung membaca konteks kegiatan.",
    target: "admin-activity-eyebrow",
  },
  {
    title: "Urutan",
    body: "Angka urutan menentukan posisi tampil. Angka kecil biasanya muncul lebih dulu.",
    target: "admin-activity-order",
  },
  {
    title: "Aktif Homepage",
    body: "Centang ini agar kegiatan tampil di homepage. Nonaktifkan jika konten ingin disimpan tanpa muncul publik.",
    target: "admin-activity-active",
  },
  {
    title: "Deskripsi",
    body: "Deskripsi menjelaskan kegiatan secara singkat. Hindari paragraf terlalu panjang karena akan tampil di area beranda.",
    target: "admin-activity-description",
  },
  {
    title: "Alt Gambar",
    body: "Alt gambar dipakai untuk aksesibilitas dan fallback. Tulis deskripsi visual singkat, bukan nama file mentah.",
    target: "admin-activity-alt",
  },
  {
    title: "Tampilan Gambar",
    body: "Penuhi Card cocok untuk foto. Tampilkan Utuh cocok untuk logo, poster, atau gambar yang tidak boleh terpotong.",
    target: "admin-activity-image-fit",
  },
  {
    title: "Upload Gambar",
    body: "Klik area upload atau drag file. Saat edit, file baru akan mengganti gambar tersimpan setelah disimpan.",
    target: "admin-activity-image",
  },
  {
    title: "Simpan Kegiatan",
    body: "Simpan setelah gambar dan teks dicek. Homepage akan memakai data aktif terbaru.",
    target: "admin-activity-save",
  },
];

const structureSteps: TutorialStep[] = [
  {
    title: "Struktur Organisasi",
    body: "Halaman ini membangun tree organisasi ULT yang muncul di profil publik. Kamu akan mengisi node satu per satu: root, koordinator, lalu staff di bawah parent yang sesuai.",
  },
  {
    title: "Daftar Struktur",
    body: "Daftar ini memperlihatkan node struktur yang sudah ada. Klik Edit untuk mengubah node atau atur aktif/nonaktif sesuai kebutuhan publik.",
    target: "admin-profile-structure-list",
  },
  {
    title: "Tambah Node Struktur",
    body: "Mulai dari panel kanan ini. Untuk membuat tree yang rapi: buat node paling atas sebagai Root, lalu buat node koordinator dengan parent Root, lalu buat staff dengan parent koordinator.",
    target: "admin-profile-structure-form",
  },
  {
    title: "Step 1: Nama Orang",
    body: "Isi nama orang yang menempati posisi ini. Contoh: Prof. Dr. Nama Lengkap untuk pejabat, atau Nama Staff untuk anggota tim. Field ini wajib karena menjadi label utama node.",
    target: "admin-profile-structure-name",
  },
  {
    title: "Step 2: Jabatan",
    body: "Isi jabatan persis seperti yang ingin tampil di profil publik, misalnya KEPALA ULT, KOORDINATOR OPERASIONAL, atau Staff. Saat field ini diketik, Label Role akan ikut terisi otomatis.",
    target: "admin-profile-structure-position",
  },
  {
    title: "Step 3: Cek Label Role",
    body: "Label Role otomatis mengikuti Jabatan / Position Title dan tidak perlu diketik manual. Cukup cek apakah isinya sudah sama dengan jabatan.",
    target: "admin-profile-structure-role",
  },
  {
    title: "Step 4: Parent / Atasan",
    body: "Pilih Tidak ada atasan / Root untuk node paling atas seperti KEPALA ULT. Untuk koordinator, pilih Kepala ULT sebagai parent. Untuk staff, pilih koordinator yang membawahi staff tersebut.",
    target: "admin-profile-structure-parent",
  },
  {
    title: "Step 5: Urutan",
    body: "Urutan menentukan posisi node dalam parent yang sama. Gunakan 1 untuk tampil lebih dulu, 2 untuk setelahnya, dan seterusnya. Untuk root tunggal, angka 1 atau 0 tetap aman.",
    target: "admin-profile-structure-order",
  },
  {
    title: "Step 6: Warna Cabang",
    body: "Pilih warna cabang agar kelompok struktur mudah dibaca. Gunakan warna yang sama untuk cabang yang masih satu kelompok, atau beda warna untuk membedakan divisi.",
    target: "admin-profile-structure-color",
  },
  {
    title: "Step 7: Status Aktif",
    body: "Centang Aktif tampil di publik jika node sudah siap ditayangkan. Jika masih draft atau datanya belum valid, matikan dulu agar tidak muncul di profil publik.",
    target: "admin-profile-structure-active",
  },
  {
    title: "Step 8: Alt Foto",
    body: "Alt Foto menjelaskan isi foto untuk aksesibilitas dan fallback. Contoh: Foto Kepala ULT atau Foto Koordinator Operasional. Boleh dikosongkan jika belum ada foto.",
    target: "admin-profile-structure-photo-alt",
  },
  {
    title: "Step 9: Upload Foto",
    body: "Klik area upload atau drag foto. Gunakan foto formal yang ringan dan jelas. Node tetap bisa disimpan tanpa foto, nanti akan memakai ikon placeholder.",
    target: "admin-profile-structure-photo",
  },
  {
    title: "Step 10: Simpan Node",
    body: "Klik Tambah Node untuk menyimpan. Setelah tersimpan, node akan muncul di Daftar Struktur; cek parent dan urutannya, lalu lanjut tambah node berikutnya.",
    target: "admin-profile-structure-save",
  },
];

const locationSteps: TutorialStep[] = [
  {
    title: "Lokasi Kami",
    body: "Halaman ini mengatur teks lokasi, kontak, jam layanan, link arah, dan gambar profil publik.",
  },
  {
    title: "Eyebrow",
    body: "Eyebrow adalah label kecil sebelum title. Pakai untuk memberi konteks bagian lokasi, misalnya Lokasi Kami.",
    target: "admin-profile-location-eyebrow",
  },
  {
    title: "Title",
    body: "Title adalah heading utama section lokasi di profil publik. Buat singkat dan jelas.",
    target: "admin-profile-location-title",
  },
  {
    title: "Description",
    body: "Description menjelaskan alamat, akses, atau konteks layanan. Pastikan informasinya mudah dipahami mahasiswa.",
    target: "admin-profile-location-description",
  },
  {
    title: "Direction Label",
    body: "Label tombol arah, misalnya Buka Google Maps. Ini adalah teks yang diklik pengunjung.",
    target: "admin-profile-location-direction-label",
  },
  {
    title: "Direction URL",
    body: "Masukkan link maps atau link arah resmi. Pastikan URL bisa dibuka sebelum menyimpan.",
    target: "admin-profile-location-direction-url",
  },
  {
    title: "Email",
    body: "Email ini tampil sebagai kontak publik. Gunakan email resmi yang memang dipantau.",
    target: "admin-profile-location-email",
  },
  {
    title: "Image Fit",
    body: "Penuhi Card cocok untuk foto gedung. Tampilkan Utuh cocok untuk gambar informatif atau logo.",
    target: "admin-profile-location-image-fit",
  },
  {
    title: "Aktif Publik",
    body: "Nonaktifkan jika section lokasi tidak ingin ditampilkan sementara tanpa menghapus data.",
    target: "admin-profile-location-active",
  },
  {
    title: "Jam Operasional",
    body: "Kelola hari, jam, urutan, dan status aktif. Informasi ini membantu mahasiswa tahu kapan layanan tersedia.",
    target: "admin-profile-location-hours",
  },
  {
    title: "Simpan Lokasi",
    body: "Simpan setelah teks, kontak, link arah, gambar, dan jam layanan sudah dicek.",
    target: "admin-profile-location-save",
  },
];

const surveySteps: TutorialStep[] = [
  {
    title: "Survei Layanan",
    body: "Survei dipakai untuk evaluasi kualitas layanan, bukan sekadar angka kepuasan.",
  },
  {
    title: "Ringkasan Skor",
    body: "Baca total respons, rata-rata skor, dan komentar terbaru. Skor rendah perlu ditindaklanjuti oleh pengelola layanan.",
    target: "admin-survey-summary",
  },
];

const reportingSteps: TutorialStep[] = [
  {
    title: "Reporting",
    body: "Reporting membantu memantau workload dan performa layanan untuk rekap internal.",
  },
  {
    title: "Filter Laporan",
    body: "Pilih periode, layanan, atau tab yang sesuai sebelum membaca angka. Filter menentukan data yang masuk ke rekap.",
    target: "admin-reporting-dashboard",
  },
  {
    title: "Sumber Data",
    body: "Data laporan berasal dari form layanan yang disubmit, identitas mahasiswa legacy, dan field email/bahasa yang tersimpan per request.",
    target: "admin-reporting-dashboard",
  },
];

const studentSteps: TutorialStep[] = [
  {
    title: "Data Mahasiswa",
    body: "Data ini adalah referensi dari database legacy untuk validasi layanan. Gunakan secara bertanggung jawab.",
  },
  {
    title: "Cari Mahasiswa",
    body: "Cari berdasarkan NPM, nama, atau program studi. Cocok untuk mengecek identitas sebelum memproses pengajuan.",
    target: "admin-master-students",
  },
  {
    title: "Privasi Data",
    body: "Jangan expose data mahasiswa yang tidak diperlukan. Gunakan hanya untuk verifikasi layanan dan kebutuhan laporan internal.",
    target: "admin-master-students",
  },
];

const tracerSteps: TutorialStep[] = [
  {
    title: "Tracer Alumni",
    body: "Tracer Study berisi data alumni untuk referensi dan pelaporan.",
  },
  {
    title: "Baca Data Alumni",
    body: "Gunakan pencarian/filter untuk menemukan alumni. Data ini sebaiknya dipakai sebagai referensi pelaporan, bukan disebarkan sembarangan.",
    target: "admin-tracer-study",
  },
];

const levelSteps: TutorialStep[] = [
  {
    title: "Data Level",
    body: "Data Level adalah referensi akses legacy. Perubahan di sini bisa memengaruhi struktur sistem.",
  },
  {
    title: "Tabel Level",
    body: "Baca level dan field name dengan teliti. Jika ada aksi edit, simpan hanya setelah yakin datanya benar.",
    target: "admin-system-levels",
  },
];

const unitSteps: TutorialStep[] = [
  {
    title: "Unit List",
    body: "Unit List menyimpan referensi unit kerja. Nama unit harus konsisten dengan kebutuhan operasional.",
  },
  {
    title: "Tabel Unit",
    body: "Cek nama unit, level, dan kode level sebelum mengubah data. Unit yang salah bisa membingungkan reporting atau user.",
    target: "admin-system-units",
  },
];

const userSteps: TutorialStep[] = [
  {
    title: "User List",
    body: "Halaman ini mengelola akun pengguna sistem. Perubahan user akan memengaruhi akses.",
  },
  {
    title: "Tambah User",
    body: "Gunakan tombol ini untuk membuat akun admin atau staff baru. Pastikan role dan unit benar sebelum menyimpan.",
    target: "admin-users-add-button",
    ctaLabel: "Buka form tambah user",
    onCta: "open-user-create-form",
  },
  {
    title: "Username",
    body: "Username dipakai sebagai identitas login legacy. Gunakan format singkat dan konsisten, lalu jangan sering diubah.",
    target: "admin-user-username",
    ctaLabel: "Buka form tambah user",
    onCta: "open-user-create-form",
  },
  {
    title: "Nama User",
    body: "Nama tampil pada audit/log dan identitas pengguna. Isi nama lengkap agar mudah dikenali admin lain.",
    target: "admin-user-name",
    ctaLabel: "Buka form tambah user",
    onCta: "open-user-create-form",
  },
  {
    title: "Email",
    body: "Email digunakan untuk identitas akun. Pastikan alamat valid dan milik pengguna yang benar.",
    target: "admin-user-email",
    ctaLabel: "Buka form tambah user",
    onCta: "open-user-create-form",
  },
  {
    title: "Telepon",
    body: "Telepon bersifat pendukung. Isi jika tersedia untuk memudahkan koordinasi internal.",
    target: "admin-user-phone",
    ctaLabel: "Buka form tambah user",
    onCta: "open-user-create-form",
  },
  {
    title: "Akses",
    body: "Pilih role admin atau staff sesuai kewenangan. Jangan memberi akses admin jika pengguna hanya perlu operasional terbatas.",
    target: "admin-user-access",
    ctaLabel: "Buka form tambah user",
    onCta: "open-user-create-form",
  },
  {
    title: "Unit",
    body: "Unit menghubungkan user dengan unit kerja legacy. Pilih unit yang paling sesuai dengan tugasnya.",
    target: "admin-user-unit",
    ctaLabel: "Buka form tambah user",
    onCta: "open-user-create-form",
  },
  {
    title: "Password",
    body: "Password awal minimal 8 karakter saat membuat user. Untuk reset password dari baris user, minimal 6 karakter sesuai endpoint reset.",
    target: "admin-user-password",
    ctaLabel: "Buka form tambah user",
    onCta: "open-user-create-form",
  },
  {
    title: "Konfirmasi Password",
    body: "Isi sama persis dengan password baru. Sistem menolak jika konfirmasi berbeda.",
    target: "admin-user-confirm-password",
    ctaLabel: "Buka form tambah user",
    onCta: "open-user-create-form",
  },
  {
    title: "Status Aktif",
    body: "Centang Aktif agar user bisa digunakan. Nonaktifkan akun yang tidak boleh login tanpa menghapus riwayatnya.",
    target: "admin-user-active",
    ctaLabel: "Buka form tambah user",
    onCta: "open-user-create-form",
  },
  {
    title: "Simpan User",
    body: "Simpan setelah username, email, role, unit, status, dan password sudah dicek.",
    target: "admin-user-save",
    ctaLabel: "Buka form tambah user",
    onCta: "open-user-create-form",
  },
  {
    title: "Tabel User",
    body: "Tabel ini menampilkan username, nama, email, akses, unit, status, dan aksi edit/hapus/reset password.",
    target: "admin-users-table",
  },
  {
    title: "Reset Password",
    body: "Gunakan tombol Reset Password untuk membuat password baru tanpa memasukkan password lama. Password tidak pernah ditampilkan ulang.",
    target: "admin-user-reset-password",
    ctaLabel: "Buka modal reset password",
    onCta: "open-user-reset-password",
  },
  {
    title: "Password Baru",
    body: "Isi password baru minimal 6 karakter. Jangan membagikan password lewat channel publik.",
    target: "admin-user-password",
    ctaLabel: "Buka modal reset password",
    onCta: "open-user-reset-password",
  },
  {
    title: "Konfirmasi Reset",
    body: "Ulangi password baru. Jika cocok, klik Simpan Password dan sistem akan menyimpan hash legacy baru.",
    target: "admin-user-confirm-password",
    ctaLabel: "Buka modal reset password",
    onCta: "open-user-reset-password",
  },
];

const userLogSteps: TutorialStep[] = [
  {
    title: "User Log",
    body: "User Log adalah jejak aktivitas penting pengguna. Gunakan untuk audit ringan ketika ada perubahan data.",
  },
  {
    title: "Baca Log",
    body: "Filter atau cari aktivitas berdasarkan pengguna, aksi, modul, atau waktu. Log membantu memahami siapa melakukan apa.",
    target: "admin-user-log",
  },
];

function isRequestDetailPath(pathname: string) {
  return /^\/admin\/requests\/[^/]+\/[^/]+$/.test(pathname);
}

function getServiceFromDetailPath(pathname: string) {
  const parts = pathname.split("/");
  return parts[3] ?? "";
}

function isInformationFormPath(pathname: string) {
  return (
    pathname === "/admin/informasi/tambah" ||
    /^\/admin\/informasi\/[^/]+\/edit$/.test(pathname)
  );
}

function isHomeActivityFormPath(pathname: string) {
  return (
    pathname === "/admin/beranda/kegiatan/tambah" ||
    /^\/admin\/beranda\/kegiatan\/[^/]+\/edit$/.test(pathname)
  );
}

export function getAdminPageTutorialSteps(
  pathname: string,
  searchParams = new URLSearchParams(),
): TutorialStep[] {
  if (isRequestDetailPath(pathname)) {
    const serviceSlug = getServiceFromDetailPath(pathname);
    if (serviceSlug === "surat-izin-kegiatan") {
      return [...requestDetailSteps, ...sikSteps];
    }
    if (serviceSlug === "permohonan-magang-kerja-praktek-ta") {
      return [...requestDetailSteps, ...magangSteps];
    }
    return requestDetailSteps;
  }

  if (pathname === "/admin/dashboard") return dashboardSteps;
  if (isInformationFormPath(pathname)) return informationFormSteps;
  if (isHomeActivityFormPath(pathname)) return homeActivityFormSteps;
  if (pathname === "/admin/requests") {
    const service = searchParams.get("service");
    if (service === "surat-izin-kegiatan") return [...requestListSteps, ...sikSteps];
    if (service === "permohonan-magang-kerja-praktek-ta") {
      return [...requestListSteps, ...magangSteps];
    }
    return requestListSteps;
  }
  if (pathname === "/admin/usulan-layanan") return suggestionSteps;
  if (pathname === "/admin/informasi") return informationSteps;
  if (pathname === "/admin/beranda/kegiatan") return homeActivitySteps;
  if (pathname === "/admin/profil/struktur") return structureSteps;
  if (pathname === "/admin/profil/lokasi") return locationSteps;
  if (pathname === "/admin/surveys") return surveySteps;
  if (pathname === "/admin/reports") return reportingSteps;
  if (pathname === "/admin/master/mahasiswa") return studentSteps;
  if (pathname === "/admin/alumni/tracer-study") return tracerSteps;
  if (pathname === "/admin/system/levels") return levelSteps;
  if (pathname === "/admin/system/units") return unitSteps;
  if (pathname === "/admin/system/users") return userSteps;
  if (pathname === "/admin/system/user-log") return userLogSteps;

  return [
    {
      title: "Tutorial Halaman",
      body: "Halaman admin ini belum punya tutorial khusus. Gunakan sidebar untuk berpindah ke fitur utama, atau jalankan Tutorial Lengkap Admin dari dashboard.",
    },
  ];
}
