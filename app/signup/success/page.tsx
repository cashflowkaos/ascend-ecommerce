import Link from "next/link";

export default function MembershipSuccessPage() {
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

        <section className="auth-card membership-success">
          <div className="membership-success-mark">
            ✓
          </div>

          <span className="admin-eyebrow">
            REQUEST RECEIVED
          </span>

          <h1>Pending Approval</h1>

          <p className="auth-intro">
            Your Ascend membership request has been received.
            New accounts are reviewed before member access is
            activated.
          </p>

          <div className="membership-success-note">
            Once your membership is approved, you can sign in
            using the email address and password you created.
          </div>

          <Link href="/" className="auth-submit membership-home-button">
            Return to Ascend
          </Link>
        </section>
      </div>
    </main>
  );
}