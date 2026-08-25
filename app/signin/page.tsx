import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { signIn } from "./actions";

export const dynamic = "force-dynamic";

function getErrorMessage(error?: string) {
  switch (error) {
    case "missing":
      return "Enter your email and password.";

    case "invalid":
      return "The email or password you entered is incorrect.";

    case "disabled":
      return "This account has been disabled.";

    case "declined":
      return "This membership request is not active.";

    default:
      return null;
  }
}

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await getCurrentUser();

  if (user) {
    if (user.role === "ADMIN") {
      redirect("/admin");
    }

    redirect("/account");
  }

  const params = await searchParams;
  const errorMessage = getErrorMessage(params.error);

  return (
    <main className="auth-page">
      <div className="auth-shell">
        <Link href="/" className="auth-brand">
          <span className="auth-brand-mark">A</span>

          <span>
            <strong>ASCEND</strong>
            <small>PEPTIDE CO.</small>
          </span>
        </Link>

        <section className="auth-card">
          <span className="admin-eyebrow">MEMBER PORTAL</span>

          <h1>Welcome Back</h1>

          <p className="auth-intro">
            Sign in to access your Ascend account.
          </p>

          {errorMessage && (
            <div className="auth-error">
              {errorMessage}
            </div>
          )}

          <form action={signIn} className="auth-form">
            <label className="auth-field">
              <span>Email Address</span>

              <input
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="you@example.com"
              />
            </label>

            <label className="auth-field">
              <span>Password</span>

              <input
                name="password"
                type="password"
                autoComplete="current-password"
                required
                placeholder="Enter your password"
              />
            </label>

            <button type="submit" className="auth-submit">
              Sign In
            </button>
          </form>

          <div className="auth-footer">
            <span>Not an approved member yet?</span>
            <span>Membership registration coming next.</span>
          </div>
        </section>

        <Link href="/" className="auth-return">
          Return to Ascend Peptide Co.
        </Link>
      </div>
    </main>
  );
}