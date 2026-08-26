import Image from "next/image";
import Link from "next/link";
import {
  Boxes,
  LayoutDashboard,
  MessageSquare,
  PackageCheck,
  ShoppingBag,
  Users,
} from "lucide-react";

const links = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/inventory", label: "Inventory", icon: Boxes },
  { href: "/admin/members", label: "Members", icon: Users },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { href: "/admin/messages", label: "Messages", icon: MessageSquare },
];

export default function AdminSidebar() {
  return (
    <aside className="admin-sidebar">
      <div className="admin-brand">
        <Image
          src="/logo/logoblk.JPG"
          alt="Ascend"
          width={744}
          height={920}
          priority
          className="admin-brand-logo"
        />
      </div>

      <nav className="admin-nav">
        {links.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} className="admin-nav-link">
            <Icon size={18} strokeWidth={1.8} />
            <span>{label}</span>
          </Link>
        ))}
      </nav>

      <div className="admin-sidebar-footer">
        <PackageCheck size={18} />
        <div>
          <strong>Ascend Peptide Co.</strong>
          <span>Management Portal</span>
        </div>
      </div>
    </aside>
  );
}
