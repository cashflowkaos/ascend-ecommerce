import Image from "next/image";
import Link from "next/link";
import {
  BarChart3,
  Boxes,
  Building2,
  FileText,
  LayoutDashboard,
  Library,
  PackagePlus,
  ReceiptText,
  Settings,
  ShoppingCart,
  Store,
  Users,
} from "lucide-react";

const links = [
  { href: "/backoffice", label: "Overview", icon: LayoutDashboard },
  { href: "/backoffice/pos", label: "POS", icon: Store },
  { href: "/backoffice/sales", label: "Sales / Invoices", icon: FileText },
  { href: "/backoffice/inventory", label: "Inventory", icon: Boxes },
  { href: "/backoffice/purchasing", label: "Purchasing", icon: PackagePlus },
  { href: "/backoffice/expenses", label: "Expenses", icon: ReceiptText },
  { href: "/backoffice/suppliers", label: "Suppliers", icon: Building2 },
  { href: "/backoffice/customers", label: "Customers", icon: Users },
  { href: "/backoffice/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/backoffice/assets", label: "Asset Library", icon: Library },
  { href: "/backoffice/settings", label: "Settings", icon: Settings },
];

export default function BackOfficeSidebar() {
  return (
    <aside className="backoffice-sidebar">
      <div className="backoffice-brand">
        <Image
          src="/logo/logoblk.JPG"
          alt="Ascend"
          width={744}
          height={920}
          priority
          className="backoffice-brand-logo"
        />
      </div>

      <nav className="backoffice-nav">
        {links.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="backoffice-nav-link"
          >
            <Icon size={18} strokeWidth={1.8} />
            <span>{label}</span>
          </Link>
        ))}
      </nav>

      <div className="backoffice-sidebar-footer">
        <ShoppingCart size={18} />
        <div>
          <strong>Ascend Peptide Co.</strong>
          <span>Back Office</span>
        </div>
      </div>
    </aside>
  );
}
