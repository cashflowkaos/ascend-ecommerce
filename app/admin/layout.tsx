import type { ReactNode } from "react";
import Link from "next/link";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { requireAdmin } from "@/lib/auth";
import { signOut } from "./auth-actions";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await requireAdmin();

  const initials =
    `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`
      .toUpperCase() || "A";

  return (
    <div className="admin-shell">
      <AdminSidebar />

      <main className="admin-main">
        <header className="admin-topbar">
          <div>
            <span className="admin-topbar-label">
              ASCEND PEPTIDE CO.
            </span>
          </div>

          <div className="admin-topbar-actions">
            <Link href="/" className="admin-site-link">
              View Website
            </Link>

            <div className="admin-user">
              <div className="admin-user-avatar">
                {initials}
              </div>

              <div>
                <strong>
                  {user.firstName} {user.lastName}
                </strong>
                <span>{user.email}</span>
              </div>
            </div>

            <form action={signOut}>
              <button
                type="submit"
                className="admin-signout-button"
              >
                Sign Out
              </button>
            </form>
          </div>
        </header>

        <div className="admin-content">
          {children}
        </div>
      </main>
    </div>
  );
}