export type NavItem = {
  label: string;
  href: string;
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
];

export const staffNavItems: NavItem[] = [
  { label: "Dashboard", href: "/staff/dashboard" },
];
