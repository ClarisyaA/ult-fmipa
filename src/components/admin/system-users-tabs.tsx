import Link from "next/link";

const tabs = [
  { key: "users", label: "Daftar User", href: "/admin/system/users" },
  { key: "access", label: "Role & Akses", href: "/admin/system/access" },
] as const;

export function SystemUsersTabs({ active }: { active: "users" | "access" }) {
  return (
    <nav
      aria-label="Pengaturan user"
      className="flex gap-1 border-b border-[#e1d8ca]"
    >
      {tabs.map((tab) => {
        const isActive = tab.key === active;

        return (
          <Link
            key={tab.key}
            href={tab.href}
            aria-current={isActive ? "page" : undefined}
            className={
              isActive
                ? "-mb-px border-b-2 border-[#0f3d2e] px-4 py-2 text-xs font-bold text-[#0f3d2e]"
                : "-mb-px border-b-2 border-transparent px-4 py-2 text-xs font-semibold text-[#7a7166] hover:text-[#0f3d2e]"
            }
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
