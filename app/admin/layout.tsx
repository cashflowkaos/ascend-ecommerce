import type { ReactNode } from "react";
import Link from "next/link";
import AdminSidebar from "@/components/admin/AdminSidebar";

export default function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="admin-shell">
      <AdminSidebar />

      <main className="admin-main">
        <header className="admin-topbar">
          <div>
            <span className="admin-topbar-label">ASCEND PEPTIDE CO.</span>
          </div>

          <div className="admin-topbar-actions">
            <Link href="/" className="admin-site-link">
              View Website
            </Link>

            <div className="admin-user">
              <div className="admin-user-avatar">A</div>
              <div>
                <strong>Administrator</strong>
                <span>Admin Account</span>
              </div>
            </div>
          </div>
        </header>

        <div className="admin-content">{children}</div>
      </main>
    </div>
  );
}
