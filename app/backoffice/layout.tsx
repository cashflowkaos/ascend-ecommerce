import type { ReactNode } from "react";
import Link from "next/link";
import BackOfficeSidebar from "@/components/backoffice/BackOfficeSidebar";
import { requireAdmin } from "@/lib/auth";
import { signOut } from "@/app/admin/auth-actions";

export default async function BackOfficeLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await requireAdmin();

  const initials =
    `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`
      .toUpperCase() || "A";

  return (
    <div className="backoffice-shell">
      <BackOfficeSidebar />

      <main className="backoffice-main">
        <header className="backoffice-topbar">
          <div>
            <span className="backoffice-topbar-label">
              ASCEND PEPTIDE CO. | BACK OFFICE
            </span>
          </div>

          <div className="backoffice-topbar-actions">
            <Link href="/admin" className="backoffice-text-link">
              Website Admin
            </Link>

            <Link href="/" className="backoffice-text-link">
              View Website
            </Link>

            <div className="backoffice-user">
              <div className="backoffice-user-avatar">
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
                className="backoffice-signout-button"
              >
                Sign Out
              </button>
            </form>
          </div>
        </header>

        <div className="backoffice-content">
          {children}
        </div>
      </main>
    </div>
  );
}
