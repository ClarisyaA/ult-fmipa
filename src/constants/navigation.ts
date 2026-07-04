export type NavItem = {
  label: string;
  href: string;
};

export type NavGroup = {
  group: string;
  items: NavItem[];
};

export const publicNavItems: NavItem[] = [
  { label: "Beranda", href: "/" },
  { label: "Profil", href: "/profil" },
  { label: "Layanan", href: "/layanan" },
  { label: "Informasi", href: "/informasi" },
  { label: "Survei", href: "/survei" },
];

export const adminNavGroups: NavGroup[] = [
  {
    group: "Overview",
    items: [{ label: "Dashboard", href: "/admin/dashboard" }],
  },
  {
    group: "Operasional",
    items: [
      { label: "Pengajuan Layanan", href: "/admin/requests" },
      { label: "Informasi", href: "/admin/informasi" },
      { label: "Survei", href: "/admin/surveys" },
    ],
  },
  {
    group: "Reporting",
    items: [
      { label: "Report Layanan", href: "/admin/reports?tab=layanan" },
      { label: "Kinerja Staf", href: "/admin/reports?tab=staf" },
      { label: "Kinerja Unit", href: "/admin/reports?tab=unit" },
    ],
  },
  {
    group: "Data",
    items: [
      { label: "Data Mahasiswa", href: "/admin/master/mahasiswa" },
      { label: "Tracer Study", href: "/admin/alumni/tracer-study" },
    ],
  },
  {
    group: "System",
    items: [
      { label: "Data Level", href: "/admin/system/levels" },
      { label: "Unit List", href: "/admin/system/units" },
      { label: "User List", href: "/admin/system/users" },
      { label: "User Log", href: "/admin/system/user-log" },
    ],
  },
];

/** Flat list for backward compat — used by admin layout */
export const adminNavItems: NavItem[] = adminNavGroups.flatMap((g) => g.items);

export const staffNavItems: NavItem[] = [
  { label: "Dashboard", href: "/staff/dashboard" },
  { label: "Pengajuan", href: "/staff/requests" },
  { label: "Informasi", href: "/staff/informasi" },
  { label: "Survei", href: "/staff/surveys" },
  { label: "Website Publik", href: "/" },
];
