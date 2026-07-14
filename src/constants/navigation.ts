export type NavItem = {
  label: string;
  href: string;
};

export type NavGroup = {
  label: string;
  items: NavItem[];
};

export const publicNavItems: NavItem[] = [
  { label: "Beranda", href: "/" },
  { label: "Profil", href: "/profil" },
  { label: "Layanan", href: "/layanan" },
  { label: "Informasi", href: "/informasi" },
  { label: "Survei", href: "/survei" },
];

export const adminNavItems: NavItem[] = [
  { label: "Dashboard", href: "/admin/dashboard" },
  { label: "Pengajuan Layanan", href: "/admin/requests" },
  { label: "Usulan Layanan", href: "/admin/usulan-layanan" },
  { label: "Informasi", href: "/admin/informasi" },
  { label: "Survei", href: "/admin/surveys" },
  { label: "Reporting", href: "/admin/reports" },
  { label: "Data Mahasiswa", href: "/admin/master/mahasiswa" },
  { label: "Tracer Study Alumni", href: "/admin/alumni/tracer-study" },
  { label: "Data Level", href: "/admin/system/levels" },
  { label: "Unit List", href: "/admin/system/units" },
  { label: "User List", href: "/admin/system/users" },
  { label: "User Log", href: "/admin/system/user-log" },
  { label: "Website Publik", href: "/" },
];

export const adminNavGroups: NavGroup[] = [
  {
    label: "Overview",
    items: [{ label: "Dashboard", href: "/admin/dashboard" }],
  },
  {
    label: "Operasional",
    items: [
      { label: "Pengajuan Layanan", href: "/admin/requests" },
      { label: "Usulan Layanan", href: "/admin/usulan-layanan" },
      { label: "Informasi", href: "/admin/informasi" },
      { label: "Kegiatan Mahasiswa", href: "/admin/beranda/kegiatan" },
      { label: "Profil - Struktur", href: "/admin/profil/struktur" },
      { label: "Profil - Lokasi", href: "/admin/profil/lokasi" },
      { label: "Survei", href: "/admin/surveys" },
    ],
  },
  {
    label: "Reporting",
    items: [{ label: "Reporting", href: "/admin/reports" }],
  },
  {
    label: "Data",
    items: [
      { label: "Data Mahasiswa", href: "/admin/master/mahasiswa" },
      { label: "Tracer Study Alumni", href: "/admin/alumni/tracer-study" },
    ],
  },
  {
    label: "System",
    items: [
      { label: "Data Level", href: "/admin/system/levels" },
      { label: "Unit List", href: "/admin/system/units" },
      { label: "User List", href: "/admin/system/users" },
      { label: "User Log", href: "/admin/system/user-log" },
    ],
  },
  {
    label: "Shortcut",
    items: [{ label: "Website Publik", href: "/" }],
  },
];

export const staffNavItems: NavItem[] = [
  { label: "Dashboard", href: "/staff/dashboard" },
  { label: "Pengajuan", href: "/staff/requests" },
  { label: "Usulan Layanan", href: "/staff/usulan-layanan" },
  { label: "Informasi", href: "/staff/informasi" },
  { label: "Kegiatan Mahasiswa", href: "/staff/beranda/kegiatan" },
  { label: "Profil - Struktur", href: "/staff/profil/struktur" },
  { label: "Profil - Lokasi", href: "/staff/profil/lokasi" },
  { label: "Survei", href: "/staff/surveys" },
  { label: "Website Publik", href: "/" },
];
