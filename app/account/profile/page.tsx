import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  MapPin,
  UserRound,
  LogOut,
} from "lucide-react";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { saveMemberProfile } from "./actions";
import { memberSignOut } from "../actions";

export const dynamic = "force-dynamic";

function getErrorMessage(error?: string) {
  switch (error) {
    case "name":
      return "First name and last name are required.";

    case "address":
      return "Complete the required shipping address fields before saving.";

    default:
      return null;
  }
}

export default async function MemberProfilePage({
  searchParams,
}: {
  searchParams: Promise<{
    saved?: string;
    error?: string;
  }>;
}) {
  const currentUser = await requireUser();

  if (currentUser.role === "ADMIN") {
    redirect("/admin");
  }

  if (currentUser.mustChangePassword) {
    redirect("/account/password");
  }

  const member = await prisma.user.findUnique({
    where: {
      id: currentUser.id,
    },
    include: {
      addresses: {
        orderBy: [
          { isDefault: "desc" },
          { createdAt: "asc" },
        ],
      },
    },
  });

  if (!member) {
    redirect("/signin");
  }

  const params = await searchParams;
  const errorMessage = getErrorMessage(params.error);

  const address =
    member.addresses.find((item) => item.isDefault) ??
    member.addresses[0] ??
    null;

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
              MEMBER ACCOUNT
            </span>

            <h1>Profile & Shipping</h1>

            <p>
              Keep your account and default shipping information
              current.
            </p>
          </div>
        </section>

        {params.saved === "1" && (
          <div className="member-profile-success">
            Profile and shipping information saved.
          </div>
        )}

        {errorMessage && (
          <div className="member-profile-error">
            {errorMessage}
          </div>
        )}

        <form
          action={saveMemberProfile}
          className="member-profile-form"
        >
          <section className="member-account-card">
            <div className="member-account-card-heading">
              <div>
                <span className="admin-eyebrow">
                  PROFILE
                </span>

                <h2>Account Information</h2>
              </div>

              <UserRound size={19} />
            </div>

            <div className="member-profile-fields">
              <label className="member-profile-field">
                <span>First Name</span>
                <input
                  name="firstName"
                  defaultValue={member.firstName}
                  required
                />
              </label>

              <label className="member-profile-field">
                <span>Last Name</span>
                <input
                  name="lastName"
                  defaultValue={member.lastName}
                  required
                />
              </label>

              <label className="member-profile-field">
                <span>Email Address</span>
                <input
                  value={member.email}
                  disabled
                />
                <small>
                  Contact Ascend Support to change your login email.
                </small>
              </label>

              <label className="member-profile-field">
                <span>Phone</span>
                <input
                  name="phone"
                  type="tel"
                  defaultValue={member.phone ?? ""}
                />
              </label>
            </div>

            <div style={{ marginTop: "18px" }}>
              <Link
                href="/account/password"
                className="member-card-link"
              >
                Change Password
              </Link>
            </div>
          </section>

          <section className="member-account-card">
            <div className="member-account-card-heading">
              <div>
                <span className="admin-eyebrow">
                  SHIPPING
                </span>

                <h2>Default Shipping Address</h2>
              </div>

              <MapPin size={19} />
            </div>

            <div className="member-profile-fields">
              <label className="member-profile-field">
                <span>First Name</span>
                <input
                  name="addressFirstName"
                  defaultValue={
                    address?.firstName ?? member.firstName
                  }
                />
              </label>

              <label className="member-profile-field">
                <span>Last Name</span>
                <input
                  name="addressLastName"
                  defaultValue={
                    address?.lastName ?? member.lastName
                  }
                />
              </label>

              <label className="member-profile-field member-profile-field-wide">
                <span>Company</span>
                <input
                  name="company"
                  defaultValue={address?.company ?? ""}
                />
              </label>

              <label className="member-profile-field member-profile-field-wide">
                <span>Address</span>
                <input
                  name="address1"
                  autoComplete="address-line1"
                  defaultValue={address?.address1 ?? ""}
                />
              </label>

              <label className="member-profile-field member-profile-field-wide">
                <span>Apartment, Suite, Unit, etc.</span>
                <input
                  name="address2"
                  autoComplete="address-line2"
                  defaultValue={address?.address2 ?? ""}
                />
              </label>

              <label className="member-profile-field">
                <span>City</span>
                <input
                  name="city"
                  autoComplete="address-level2"
                  defaultValue={address?.city ?? ""}
                />
              </label>

              <label className="member-profile-field">
                <span>State</span>
                <input
                  name="state"
                  autoComplete="address-level1"
                  defaultValue={address?.state ?? ""}
                  maxLength={2}
                />
              </label>

              <label className="member-profile-field">
                <span>ZIP Code</span>
                <input
                  name="postalCode"
                  autoComplete="postal-code"
                  defaultValue={address?.postalCode ?? ""}
                />
              </label>

              <label className="member-profile-field">
                <span>Shipping Phone</span>
                <input
                  name="addressPhone"
                  type="tel"
                  defaultValue={
                    address?.phone ?? member.phone ?? ""
                  }
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
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}