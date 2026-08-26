import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { registerMember } from "./actions";

export const dynamic = "force-dynamic";

function getErrorMessage(error?: string) {
  switch (error) {
    case "missing":
      return "Complete all required fields.";

    case "password":
      return "Password must be at least 8 characters.";

    case "confirm":
      return "Your passwords do not match.";

    case "exists":
      return "An account already exists with that email address.";

    case "dob":
      return "Enter a valid date of birth.";

    case "underage":
      return "You must be at least 21 years old to request membership.";

    case "failed":
      return "We could not create your membership request. Please try again.";

    default:
      return null;
  }
}

export default async function SignUpPage({
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
    <main className="auth-page signup-page">
      <div className="signup-shell">
        <Link href="/" className="auth-brand">
          <span className="auth-brand-mark">A</span>

          <span>
            <strong>ASCEND</strong>
            <small>PEPTIDE CO.</small>
          </span>
        </Link>

        <section className="auth-card signup-card">
          <span className="admin-eyebrow">MEMBERSHIP</span>

          <h1>Request Access</h1>

          <p className="auth-intro">
            Create your Ascend account. Membership requests are
            reviewed before member access is activated.
          </p>

          {errorMessage && (
            <div className="auth-error">
              {errorMessage}
            </div>
          )}

          <form action={registerMember} className="auth-form">
            <div className="signup-section">
              <div className="signup-section-heading">
                <strong>Contact Information</strong>
                <span>Your membership account information.</span>
              </div>

              <div className="signup-grid">
                <label className="auth-field">
                  <span>First Name *</span>
                  <input
                    name="firstName"
                    autoComplete="given-name"
                    required
                  />
                </label>

                <label className="auth-field">
                  <span>Last Name *</span>
                  <input
                    name="lastName"
                    autoComplete="family-name"
                    required
                  />
                </label>

                <label className="auth-field">
                  <span>Phone Number *</span>
                  <input
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    required
                  />
                </label>

                <label className="auth-field">
                  <span>Email Address *</span>
                  <input
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                  />
                </label>
              </div>
            </div>

            <div className="signup-section">
              <div className="signup-section-heading">
                <strong>Age Verification</strong>
                <span>
                  Ascend membership is available only to adults
                  age 21 or older.
                </span>
              </div>

              <div className="signup-grid">
                <label className="auth-field signup-full">
                  <span>Date of Birth *</span>
                  <input
                    name="dateOfBirth"
                    type="date"
                    autoComplete="bday"
                    required
                  />
                </label>

                <label className="signup-age-certification signup-full">
                  <input
                    name="ageCertified"
                    type="checkbox"
                    value="yes"
                    required
                  />

                  <span>
                    I certify that I am at least 21 years of age
                    and that the date of birth provided above is
                    accurate.
                  </span>
                </label>
              </div>
            </div>
            <div className="signup-section">
              <div className="signup-section-heading">
                <strong>Shipping Address</strong>
                <span>
                  You can update this from your account later.
                </span>
              </div>

              <div className="signup-grid">
                <label className="auth-field signup-full">
                  <span>Street Address *</span>
                  <input
                    name="address1"
                    autoComplete="address-line1"
                    required
                  />
                </label>

                <label className="auth-field signup-full">
                  <span>Apartment, Suite, Unit</span>
                  <input
                    name="address2"
                    autoComplete="address-line2"
                  />
                </label>

                <label className="auth-field">
                  <span>City *</span>
                  <input
                    name="city"
                    autoComplete="address-level2"
                    required
                  />
                </label>

                <label className="auth-field">
                  <span>State *</span>
                  <input
                    name="state"
                    autoComplete="address-level1"
                    required
                    maxLength={2}
                    placeholder="CA"
                  />
                </label>

                <label className="auth-field">
                  <span>ZIP Code *</span>
                  <input
                    name="postalCode"
                    autoComplete="postal-code"
                    required
                  />
                </label>
              </div>
            </div>

            <div className="signup-section">
              <div className="signup-section-heading">
                <strong>Secure Your Account</strong>
                <span>Use at least 8 characters.</span>
              </div>

              <div className="signup-grid">
                <label className="auth-field">
                  <span>Password *</span>
                  <input
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    minLength={8}
                    required
                  />
                </label>

                <label className="auth-field">
                  <span>Confirm Password *</span>
                  <input
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    minLength={8}
                    required
                  />
                </label>
              </div>
            </div>

            <div className="signup-notice">
              <strong>Membership Approval</strong>
              <span>
                New accounts remain pending until reviewed and
                approved by Ascend.
              </span>
            </div>

            <button type="submit" className="auth-submit">
              Submit Membership Request
            </button>
          </form>

          <div className="auth-footer">
            <span>Already have an account?</span>

            <Link href="/signin" className="signup-inline-link">
              Sign In
            </Link>
          </div>
        </section>

        <Link href="/" className="auth-return">
          Return to Ascend Peptide Co.
        </Link>
      </div>
    </main>
  );
}