import Link from "next/link";
import { ChevronRight, Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function BackOfficeSuppliersPage() {
  const suppliers = await prisma.backOfficeSupplier.findMany({
    orderBy: [{ active: "desc" }, { name: "asc" }],
  });

  const activeCount = suppliers.filter((supplier) => supplier.active).length;
  const inactiveCount = suppliers.length - activeCount;
  const withContact = suppliers.filter(
    (supplier) => supplier.email || supplier.phone
  ).length;

  return (
    <>
      <div className="backoffice-page-heading">
        <div>
          <span className="backoffice-eyebrow">SUPPLIERS</span>
          <h1>Supplier Directory</h1>
          <p>
            Manage the vendors Ascend purchases inventory and supplies from.
          </p>
        </div>

        <Link
          href="/backoffice/suppliers/new"
          className="backoffice-primary-button"
        >
          <Plus size={15} strokeWidth={2} />
          Add Supplier
        </Link>
      </div>

      <div className="backoffice-stat-grid">
        <div className="backoffice-stat-card">
          <span>Total Suppliers</span>
          <strong>{suppliers.length}</strong>
        </div>

        <div className="backoffice-stat-card">
          <span>Active</span>
          <strong>{activeCount}</strong>
        </div>

        <div className="backoffice-stat-card">
          <span>Inactive</span>
          <strong>{inactiveCount}</strong>
        </div>

        <div className="backoffice-stat-card">
          <span>With Contact Info</span>
          <strong>{withContact}</strong>
        </div>
      </div>

      <div className="backoffice-panel">
        <div className="backoffice-panel-heading">
          <div>
            <span className="backoffice-eyebrow">VENDOR DIRECTORY</span>
            <h2>Suppliers</h2>
            <p>
              Supplier purchase history will appear here as Purchasing is connected.
            </p>
          </div>
        </div>

        <div className="backoffice-mobile-data-list">
          {suppliers.length === 0 ? (
            <div className="backoffice-mobile-empty">
              No suppliers have been added yet.
            </div>
          ) : (
            suppliers.map((supplier) => (
              <Link
                key={supplier.id}
                href={`/backoffice/suppliers/${supplier.id}`}
                className="backoffice-mobile-data-card"
              >
                <div className="backoffice-mobile-card-heading">
                  <div>
                    <strong>{supplier.name}</strong>
                    <span>{supplier.active ? "Active" : "Inactive"}</span>
                  </div>
                  <ChevronRight size={17} />
                </div>

                <div className="backoffice-mobile-card-grid">
                  <div>
                    <span>Contact</span>
                    <strong>{supplier.contactName || "—"}</strong>
                  </div>
                  <div>
                    <span>Phone</span>
                    <strong>{supplier.phone || "—"}</strong>
                  </div>
                </div>

                {supplier.email ? <span>{supplier.email}</span> : null}
              </Link>
            ))
          )}
        </div>

        <div className="backoffice-table-wrap">
          <table className="backoffice-table">
            <thead>
              <tr>
                <th>Supplier</th>
                <th>Contact</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>

            <tbody>
              {suppliers.map((supplier) => (
                <tr key={supplier.id}>
                  <td>
                    <Link href={`/backoffice/suppliers/${supplier.id}`}>
                      <strong>{supplier.name}</strong>
                    </Link>
                  </td>
                  <td>{supplier.contactName || "—"}</td>
                  <td>{supplier.email || "—"}</td>
                  <td>{supplier.phone || "—"}</td>
                  <td>{supplier.active ? "Active" : "Inactive"}</td>
                  <td style={{ textAlign: "right" }}>
                    <Link
                      href={`/backoffice/suppliers/${supplier.id}`}
                      aria-label={`View ${supplier.name}`}
                    >
                      <ChevronRight size={17} />
                    </Link>
                  </td>
                </tr>
              ))}

              {suppliers.length === 0 ? (
                <tr>
                  <td colSpan={6}>No suppliers have been added yet.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}