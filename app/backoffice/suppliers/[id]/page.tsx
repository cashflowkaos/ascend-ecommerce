import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import BackOfficeSaveButton from "@/components/backoffice/BackOfficeSaveButton";
import { prisma } from "@/lib/prisma";
import { updateBackOfficeSupplier } from "../actions";

export const dynamic = "force-dynamic";

export default async function BackOfficeSupplierPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supplier = await prisma.backOfficeSupplier.findUnique({
    where: { id },
  });

  if (!supplier) {
    notFound();
  }

  return (
    <>
      <div className="backoffice-page-heading">
        <div>
          <span className="backoffice-eyebrow">SUPPLIERS / SUPPLIER</span>
          <h1>{supplier.name}</h1>
          <p>
            Review supplier information and purchasing details.
          </p>
        </div>

        <Link
          href="/backoffice/suppliers"
          className="backoffice-secondary-button"
        >
          <ArrowLeft size={15} strokeWidth={2} />
          Back to Suppliers
        </Link>
      </div>

      <form
        action={updateBackOfficeSupplier}
        className="backoffice-panel backoffice-product-form"
      >
        <input type="hidden" name="id" value={supplier.id} />

        <div className="backoffice-panel-heading">
          <div>
            <span className="backoffice-eyebrow">SUPPLIER DETAILS</span>
            <h2>Supplier Information</h2>
          </div>
        </div>

        <div className="backoffice-form-grid">
          <label className="backoffice-form-field">
            <span>Supplier Name</span>
            <input
              type="text"
              name="name"
              defaultValue={supplier.name}
              required
              autoComplete="off"
            />
          </label>

          <label className="backoffice-form-field">
            <span>Contact Name</span>
            <input
              type="text"
              name="contactName"
              defaultValue={supplier.contactName ?? ""}
              autoComplete="off"
            />
          </label>

          <label className="backoffice-form-field">
            <span>Email</span>
            <input
              type="email"
              name="email"
              defaultValue={supplier.email ?? ""}
              autoComplete="off"
            />
          </label>

          <label className="backoffice-form-field">
            <span>Phone</span>
            <input
              type="tel"
              name="phone"
              defaultValue={supplier.phone ?? ""}
              autoComplete="off"
            />
          </label>

          <label className="backoffice-form-field backoffice-form-field-wide">
            <span>Website</span>
            <input
              type="text"
              name="website"
              defaultValue={supplier.website ?? ""}
              autoComplete="off"
            />
          </label>

          <label className="backoffice-form-field">
            <span>Address</span>
            <input
              type="text"
              name="addressLine1"
              defaultValue={supplier.addressLine1 ?? ""}
              autoComplete="off"
            />
          </label>

          <label className="backoffice-form-field">
            <span>Address Line 2</span>
            <input
              type="text"
              name="addressLine2"
              defaultValue={supplier.addressLine2 ?? ""}
              autoComplete="off"
            />
          </label>

          <label className="backoffice-form-field">
            <span>City</span>
            <input
              type="text"
              name="city"
              defaultValue={supplier.city ?? ""}
              autoComplete="off"
            />
          </label>

          <label className="backoffice-form-field">
            <span>State / Province</span>
            <input
              type="text"
              name="state"
              defaultValue={supplier.state ?? ""}
              autoComplete="off"
            />
          </label>

          <label className="backoffice-form-field">
            <span>Postal Code</span>
            <input
              type="text"
              name="postalCode"
              defaultValue={supplier.postalCode ?? ""}
              autoComplete="off"
            />
          </label>

          <label className="backoffice-form-field">
            <span>Country</span>
            <input
              type="text"
              name="country"
              defaultValue={supplier.country ?? ""}
              autoComplete="off"
            />
          </label>

          <label className="backoffice-form-field backoffice-form-field-wide">
            <span>Notes</span>
            <textarea
              name="notes"
              rows={4}
              defaultValue={supplier.notes ?? ""}
            />
          </label>

          <label className="backoffice-form-field">
            <span>Status</span>
            <span>
              <input
                type="checkbox"
                name="active"
                defaultChecked={supplier.active}
                style={{ width: "auto", marginRight: 8 }}
              />
              Active supplier
            </span>
          </label>
        </div>

        <div className="backoffice-form-actions">
          <Link
            href="/backoffice/suppliers"
            className="backoffice-secondary-button"
          >
            Cancel
          </Link>

          <BackOfficeSaveButton />
        </div>
      </form>
    </>
  );
}