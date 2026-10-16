import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  await requireAdmin();

  const query =
    request.nextUrl.searchParams.get("q")?.trim() ?? "";

  if (query.length < 2) {
    return NextResponse.json({ invoices: [] });
  }

  const invoices = await prisma.backOfficeInvoice.findMany({
    where: {
      OR: [
        {
          invoiceNumber: {
            contains: query,
            mode: "insensitive",
          },
        },
        {
          customerFirstName: {
            contains: query,
            mode: "insensitive",
          },
        },
        {
          customerLastName: {
            contains: query,
            mode: "insensitive",
          },
        },
        {
          customerCompany: {
            contains: query,
            mode: "insensitive",
          },
        },
      ],
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 25,
    select: {
      id: true,
      invoiceNumber: true,
      source: true,
      status: true,
      customerFirstName: true,
      customerLastName: true,
      customerCompany: true,
      locationCode: true,
      total: true,
      amountPaid: true,
      balanceDue: true,
      createdAt: true,
    },
  });

  return NextResponse.json({
    invoices: invoices.map((invoice) => ({
      ...invoice,
      total: Number(invoice.total),
      amountPaid: Number(invoice.amountPaid),
      balanceDue: Number(invoice.balanceDue),
      createdAt: invoice.createdAt.toISOString(),
    })),
  });
}
