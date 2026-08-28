import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  KeyRound,
  LogOut,
} from "lucide-react";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { changeMemberPassword } from "./actions";
import { memberSignOut } from "../actions";

export const dynamic = "force-dynamic";

function getErrorMessage(error?: string) {
  switch (error) {
    case "missing":
      return "Complete all password fields.";

    case "length":
      return "Your new password must be at least 8 characters.";

    case "confirm":
      return "The new passwords do not match.";

    case "current":
      return "Your current password is incorrect.";

    case "same":
      return "Choose a new password that is different from your current password.";

    default:
      return null;
  }
}

export default async function MemberPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
  }>;
}) {
  const currentUser = await requireUser();

  if (currentUser.role === "ADMIN") {
    redirect("/admin");
  }

  const params = await searchParams;
  const errorMessage = getErrorMessage(params.error);

  return (
    <main className="member-account-page">
      <div className="member-account-shell">
        <header className="member-account-header">
  <Link
    href="/"
    className="member-account-brand"
  >
    <Image
      src="/logo/logo.png"
      alt="Ascend Peptide Co."
      width={250}
      height={95}
      priority
      className="member-account-logo"
    />
  </Link>

  <div className="member-account-header-actions">
    <Link
      href="/account"
      className="member-header-link"
    >
      My Account
    </Link>

    <form action={memberSignOut}>
      <button
        type="submit"
        className="member-header-link member-signout"
      >
        <LogOut size={14} />
        Sign Out
      </button>
    </form>
  </div>
</header>

        <section className="member-account-hero member-profile-hero">
          <div>
            <span className="admin-eyebrow">
              ACCOUNT SECURITY
            </span>

            <h1>Change Password</h1>

            <p>
              Update the password used to sign in to your
              Ascend member account.
            </p>
          </div>
        </section>

        {currentUser.mustChangePassword && (
          <div className="member-profile-success">
            A temporary password is currently assigned to your
            account. Choose your own password to continue.
          </div>
        )}

        {errorMessage && (
          <div className="member-profile-error">
            {errorMessage}
          </div>
        )}

        <form
          action={changeMemberPassword}
          className="member-profile-form"
        >
          <section className="member-account-card">
            <div className="member-account-card-heading">
              <div>
                <span className="admin-eyebrow">
                  SECURITY
                </span>

                <h2>Password</h2>
              </div>

              <KeyRound size={19} />
            </div>

            <div className="member-profile-fields">
              <label className="member-profile-field member-profile-field-wide">
                <span>Current Password</span>

                <input
                  name="currentPassword"
                  type="password"
                  autoComplete="current-password"
                  required
                />
              </label>

              <label className="member-profile-field">
                <span>New Password</span>

                <input
                  name="newPassword"
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  required
                />

                <small>
                  Minimum 8 characters.
                </small>
              </label>

              <label className="member-profile-field">
                <span>Confirm New Password</span>

                <input
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
              </label>
            </div>
          </section>

          <div className="member-profile-actions">
            <Link
              href="/account"
              className="member-secondary-button"
            >
              Cancel
            </Link>

            <button
              type="submit"
              className="member-primary-button"
            >
              Change Password
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}