import { Resend } from "resend";

const FROM_EMAIL =
  "Ascend Peptide Co. <members@ascendpepco.com>";

const REPLY_TO_EMAIL =
  "support@ascendpepco.com";

function getResend() {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not configured.");
  }

  return new Resend(apiKey);
}

function emailShell(content: string) {
  return `
    <!doctype html>
    <html>
      <body style="margin:0;padding:0;background:#f7f6f3;">
        <div style="padding:40px 20px;">
          <div style="
            max-width:600px;
            margin:0 auto;
            background:#ffffff;
            border:1px solid #e8e4dc;
          ">
            <div style="
              padding:34px 38px 30px;
              border-top:4px solid #b78300;
            ">
              <div style="
                margin-bottom:28px;
                font-family:Arial,sans-serif;
                font-size:11px;
                font-weight:700;
                letter-spacing:3px;
                color:#b78300;
              ">
                ASCEND PEPTIDE CO.
              </div>

              ${content}

              <div style="
                margin-top:34px;
                padding-top:20px;
                border-top:1px solid #e8e4dc;
                font-family:Arial,sans-serif;
                font-size:11px;
                line-height:1.6;
                color:#8a867e;
              ">
                Ascend Peptide Co.<br />
                Member Services
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
}

export async function sendMembershipApplicationReceivedEmail({
  email,
  firstName,
}: {
  email: string;
  firstName: string;
}) {
  const resend = getResend();

  const { data, error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    replyTo: REPLY_TO_EMAIL,
    subject: "Ascend Membership Application Received",
    html: emailShell(`
      <h1 style="
        margin:0 0 18px;
        font-family:Georgia,serif;
        font-size:28px;
        font-weight:500;
        line-height:1.25;
        color:#171717;
      ">
        Application Received
      </h1>

      <p style="
        margin:0 0 16px;
        font-family:Arial,sans-serif;
        font-size:14px;
        line-height:1.75;
        color:#55514b;
      ">
        Hello ${firstName},
      </p>

      <p style="
        margin:0 0 16px;
        font-family:Arial,sans-serif;
        font-size:14px;
        line-height:1.75;
        color:#55514b;
      ">
        We received your Ascend Peptide Co. membership application.
      </p>

      <p style="
        margin:0;
        font-family:Arial,sans-serif;
        font-size:14px;
        line-height:1.75;
        color:#55514b;
      ">
        Your application is pending review. We will notify you by
        email once your membership has been reviewed.
      </p>
    `),
  });

  if (error) {
    throw new Error(
      `Membership application confirmation email failed: ${error.message}`
    );
  }

  return data;
}

export async function sendNewMembershipApplicationAdminEmail({
  firstName,
  lastName,
  email,
}: {
  firstName: string;
  lastName: string;
  email: string;
}) {
  const resend = getResend();

  const { data, error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: REPLY_TO_EMAIL,
    replyTo: email,
    subject: `New Ascend Membership Application - ${firstName} ${lastName}`,
    html: emailShell(`
      <h1 style="
        margin:0 0 18px;
        font-family:Georgia,serif;
        font-size:28px;
        font-weight:500;
        line-height:1.25;
        color:#171717;
      ">
        New Membership Application
      </h1>

      <p style="
        margin:0 0 16px;
        font-family:Arial,sans-serif;
        font-size:14px;
        line-height:1.75;
        color:#55514b;
      ">
        A new membership application has been submitted.
      </p>

      <p style="
        margin:0 0 24px;
        font-family:Arial,sans-serif;
        font-size:14px;
        line-height:1.75;
        color:#55514b;
      ">
        <strong>Name:</strong> ${firstName} ${lastName}<br />
        <strong>Email:</strong> ${email}
      </p>

      <a
        href="https://ascendpepco.com/admin/members"
        style="
          display:inline-block;
          padding:12px 20px;
          background:#b78300;
          color:#ffffff;
          font-family:Arial,sans-serif;
          font-size:12px;
          font-weight:700;
          text-decoration:none;
        "
      >
        Review Membership
      </a>
    `),
  });

  if (error) {
    throw new Error(
      `New membership admin email failed: ${error.message}`
    );
  }

  return data;
}

export async function sendMemberApprovalEmail({
  email,
  firstName,
}: {
  email: string;
  firstName: string;
}) {
  const resend = getResend();

  const { data, error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    replyTo: REPLY_TO_EMAIL,
    subject: "Your Ascend Membership Has Been Approved",
    html: emailShell(`
      <h1 style="
        margin:0 0 18px;
        font-family:Georgia,serif;
        font-size:28px;
        font-weight:500;
        line-height:1.25;
        color:#171717;
      ">
        Membership Approved
      </h1>

      <p style="
        margin:0 0 16px;
        font-family:Arial,sans-serif;
        font-size:14px;
        line-height:1.75;
        color:#55514b;
      ">
        Hello ${firstName},
      </p>

      <p style="
        margin:0 0 16px;
        font-family:Arial,sans-serif;
        font-size:14px;
        line-height:1.75;
        color:#55514b;
      ">
        Your Ascend Peptide Co. membership request has been
        reviewed and approved.
      </p>

      <p style="
        margin:0 0 24px;
        font-family:Arial,sans-serif;
        font-size:14px;
        line-height:1.75;
        color:#55514b;
      ">
        You may now sign in to your account using the email
        address and password you created during registration.
      </p>

      <a
        href="https://ascendpepco.com/signin"
        style="
          display:inline-block;
          padding:12px 20px;
          background:#b78300;
          color:#ffffff;
          font-family:Arial,sans-serif;
          font-size:12px;
          font-weight:700;
          text-decoration:none;
        "
      >
        Sign In to Ascend
      </a>

      <p style="
        margin:26px 0 0;
        font-family:Arial,sans-serif;
        font-size:12px;
        line-height:1.7;
        color:#77736b;
      ">
        If you have questions regarding your membership,
        reply to this email and Ascend Support will assist you.
      </p>
    `),
  });

  if (error) {
    throw new Error(
      `Approval email failed: ${error.message}`
    );
  }

  return data;
}

export async function sendMemberDeclinedEmail({
  email,
  firstName,
}: {
  email: string;
  firstName: string;
}) {
  const resend = getResend();

  const { data, error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    replyTo: REPLY_TO_EMAIL,
    subject: "Ascend Membership Request Update",
    html: emailShell(`
      <h1 style="
        margin:0 0 18px;
        font-family:Georgia,serif;
        font-size:28px;
        font-weight:500;
        line-height:1.25;
        color:#171717;
      ">
        Membership Request Update
      </h1>

      <p style="
        margin:0 0 16px;
        font-family:Arial,sans-serif;
        font-size:14px;
        line-height:1.75;
        color:#55514b;
      ">
        Hello ${firstName},
      </p>

      <p style="
        margin:0 0 16px;
        font-family:Arial,sans-serif;
        font-size:14px;
        line-height:1.75;
        color:#55514b;
      ">
        Thank you for your interest in Ascend Peptide Co.
      </p>

      <p style="
        margin:0 0 16px;
        font-family:Arial,sans-serif;
        font-size:14px;
        line-height:1.75;
        color:#55514b;
      ">
        After reviewing your membership request, we are unable
        to approve access at this time.
      </p>

      <p style="
        margin:0;
        font-family:Arial,sans-serif;
        font-size:12px;
        line-height:1.7;
        color:#77736b;
      ">
        If you believe this decision was made in error or you
        need additional assistance, reply to this email to
        contact Ascend Support.
      </p>
    `),
  });

  if (error) {
    throw new Error(
      `Decline email failed: ${error.message}`
    );
  }

  return data;
}


export async function sendNewAdminMessageNotificationEmail({
  memberFirstName,
  memberLastName,
  memberEmail,
  subject,
}: {
  memberFirstName: string;
  memberLastName: string;
  memberEmail: string;
  subject: string;
}) {
  const resend = getResend();

  const { data, error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: REPLY_TO_EMAIL,
    replyTo: memberEmail,
    subject: `New Member Message - ${memberFirstName} ${memberLastName}`,
    html: emailShell(`
      <h1 style="
        margin:0 0 18px;
        font-family:Georgia,serif;
        font-size:28px;
        font-weight:500;
        line-height:1.25;
        color:#171717;
      ">
        New Member Message
      </h1>

      <p style="
        margin:0 0 16px;
        font-family:Arial,sans-serif;
        font-size:14px;
        line-height:1.75;
        color:#55514b;
      ">
        ${memberFirstName} ${memberLastName} sent a message
        through the Ascend member portal.
      </p>

      <p style="
        margin:0 0 24px;
        font-family:Arial,sans-serif;
        font-size:14px;
        line-height:1.75;
        color:#55514b;
      ">
        <strong>Member:</strong> ${memberFirstName} ${memberLastName}<br />
        <strong>Email:</strong> ${memberEmail}<br />
        <strong>Subject:</strong> ${subject}
      </p>

      <a
        href="https://ascendpepco.com/admin/messages"
        style="
          display:inline-block;
          padding:12px 20px;
          background:#b78300;
          color:#ffffff;
          font-family:Arial,sans-serif;
          font-size:12px;
          font-weight:700;
          text-decoration:none;
        "
      >
        View Messages
      </a>
    `),
  });

  if (error) {
    throw new Error(
      `Admin message notification email failed: ${error.message}`
    );
  }

  return data;
}

export async function sendNewMessageNotificationEmail({
  email,
  firstName,
}: {
  email: string;
  firstName: string;
}) {
  const resend = getResend();

  const { data, error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    replyTo: REPLY_TO_EMAIL,
    subject: "You Have a New Message from Ascend",
    html: emailShell(`
      <h1 style="
        margin:0 0 18px;
        font-family:Georgia,serif;
        font-size:28px;
        font-weight:500;
        line-height:1.25;
        color:#171717;
      ">
        New Message
      </h1>

      <p style="
        margin:0 0 16px;
        font-family:Arial,sans-serif;
        font-size:14px;
        line-height:1.75;
        color:#55514b;
      ">
        Hello ${firstName},
      </p>

      <p style="
        margin:0 0 24px;
        font-family:Arial,sans-serif;
        font-size:14px;
        line-height:1.75;
        color:#55514b;
      ">
        You have a new message from Ascend Peptide Co.
        Sign in to your member account to view and reply to
        your conversation.
      </p>

      <a
        href="https://ascendpepco.com/account/messages"
        style="
          display:inline-block;
          padding:12px 20px;
          background:#b78300;
          color:#ffffff;
          font-family:Arial,sans-serif;
          font-size:12px;
          font-weight:700;
          text-decoration:none;
        "
      >
        View Message
      </a>

      <p style="
        margin:26px 0 0;
        font-family:Arial,sans-serif;
        font-size:12px;
        line-height:1.7;
        color:#77736b;
      ">
        For privacy, the contents of your message are only
        available after signing in to your Ascend account.
      </p>
    `),
  });

  if (error) {
    throw new Error(
      `Message notification email failed: ${error.message}`
    );
  }

  return data;
}

type OrderRequestEmailItem = {
  productName: string;
  strength: string;
  sku: string | null;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

type OrderRequestShipping = {
  firstName: string;
  lastName: string;
  company: string | null;
  address1: string;
  address2: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string | null;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function money(value: number) {
  return `$${value.toFixed(2)}`;
}

function orderItemsHtml(
  items: OrderRequestEmailItem[]
) {
  return items
    .map(
      (item) => `
        <tr>
          <td style="
            padding:12px 8px;
            border-bottom:1px solid #e8e4dc;
            font-family:Arial,sans-serif;
            font-size:13px;
            line-height:1.5;
            color:#171717;
          ">
            <strong>${escapeHtml(item.productName)}</strong><br />
            <span style="color:#77736b;">
              ${escapeHtml(item.strength)}
              ${
                item.sku
                  ? ` &middot; ${escapeHtml(item.sku)}`
                  : ""
              }
            </span>
          </td>

          <td style="
            padding:12px 8px;
            border-bottom:1px solid #e8e4dc;
            font-family:Arial,sans-serif;
            font-size:13px;
            text-align:center;
            color:#55514b;
          ">
            ${item.quantity}
          </td>

          <td style="
            padding:12px 8px;
            border-bottom:1px solid #e8e4dc;
            font-family:Arial,sans-serif;
            font-size:13px;
            text-align:right;
            color:#55514b;
          ">
            ${money(item.unitPrice)}
          </td>

          <td style="
            padding:12px 8px;
            border-bottom:1px solid #e8e4dc;
            font-family:Arial,sans-serif;
            font-size:13px;
            font-weight:700;
            text-align:right;
            color:#171717;
          ">
            ${money(item.lineTotal)}
          </td>
        </tr>
      `
    )
    .join("");
}

function shippingHtml(
  shipping: OrderRequestShipping
) {
  const company = shipping.company
    ? `${escapeHtml(shipping.company)}<br />`
    : "";

  const address2 = shipping.address2
    ? `${escapeHtml(shipping.address2)}<br />`
    : "";

  const phone = shipping.phone
    ? `<br />${escapeHtml(shipping.phone)}`
    : "";

  return `
    ${escapeHtml(shipping.firstName)}
    ${escapeHtml(shipping.lastName)}<br />
    ${company}
    ${escapeHtml(shipping.address1)}<br />
    ${address2}
    ${escapeHtml(shipping.city)},
    ${escapeHtml(shipping.state)}
    ${escapeHtml(shipping.postalCode)}<br />
    ${escapeHtml(shipping.country)}
    ${phone}
  `;
}

export async function sendOrderRequestAdminEmail({
  orderNumber,
  customerEmail,
  customerFirstName,
  customerLastName,
  shipping,
  items,
  subtotal,
  shippingAmount,
  taxAmount,
  total,
}: {
  orderNumber: string;
  customerEmail: string;
  customerFirstName: string;
  customerLastName: string;
  shipping: OrderRequestShipping;
  items: OrderRequestEmailItem[];
  subtotal: number;
  shippingAmount: number;
  taxAmount: number;
  total: number;
}) {
  const resend = getResend();

  const { data, error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: REPLY_TO_EMAIL,
    replyTo: customerEmail,
    subject:
      `New Ascend Order Request - ${orderNumber} - ${money(total)}`,
    html: emailShell(`
      <h1 style="
        margin:0 0 18px;
        font-family:Georgia,serif;
        font-size:28px;
        font-weight:500;
        line-height:1.25;
        color:#171717;
      ">
        New Order Request
      </h1>

      <p style="
        margin:0 0 22px;
        font-family:Arial,sans-serif;
        font-size:14px;
        line-height:1.75;
        color:#55514b;
      ">
        <strong>Order:</strong>
        ${escapeHtml(orderNumber)}<br />
        <strong>Customer:</strong>
        ${escapeHtml(customerFirstName)}
        ${escapeHtml(customerLastName)}<br />
        <strong>Email:</strong>
        ${escapeHtml(customerEmail)}
      </p>

      <h2 style="
        margin:24px 0 10px;
        font-family:Arial,sans-serif;
        font-size:14px;
        color:#171717;
      ">
        Shipping Address
      </h2>

      <p style="
        margin:0 0 22px;
        font-family:Arial,sans-serif;
        font-size:13px;
        line-height:1.7;
        color:#55514b;
      ">
        ${shippingHtml(shipping)}
      </p>

      <table
        width="100%"
        cellpadding="0"
        cellspacing="0"
        style="border-collapse:collapse;"
      >
        <thead>
          <tr>
            <th style="padding:10px 8px;text-align:left;font-family:Arial,sans-serif;font-size:11px;color:#77736b;">
              PRODUCT
            </th>
            <th style="padding:10px 8px;text-align:center;font-family:Arial,sans-serif;font-size:11px;color:#77736b;">
              QTY
            </th>
            <th style="padding:10px 8px;text-align:right;font-family:Arial,sans-serif;font-size:11px;color:#77736b;">
              PRICE
            </th>
            <th style="padding:10px 8px;text-align:right;font-family:Arial,sans-serif;font-size:11px;color:#77736b;">
              TOTAL
            </th>
          </tr>
        </thead>

        <tbody>
          ${orderItemsHtml(items)}
        </tbody>
      </table>

      <div style="
        margin-top:22px;
        padding-top:18px;
        border-top:1px solid #e8e4dc;
        font-family:Arial,sans-serif;
        font-size:13px;
        line-height:1.8;
        color:#55514b;
      ">
        Subtotal: <strong>${money(subtotal)}</strong><br />
        Shipping: <strong>${money(shippingAmount)}</strong><br />
        Tax: <strong>${money(taxAmount)}</strong><br />
        <span style="font-size:16px;color:#171717;">
          Total: <strong>${money(total)}</strong>
        </span>
      </div>

      <p style="
        margin:24px 0 0;
        padding:14px;
        background:#f7f6f3;
        font-family:Arial,sans-serif;
        font-size:12px;
        line-height:1.7;
        color:#55514b;
      ">
        This order request is awaiting manual payment processing.
        Inventory has not been deducted.
      </p>
    `),
  });

  if (error) {
    throw new Error(
      `Admin order request email failed: ${error.message}`
    );
  }

  return data;
}

export async function sendOrderRequestCustomerEmail({
  email,
  firstName,
  orderNumber,
  items,
  subtotal,
  shippingAmount,
  taxAmount,
  total,
}: {
  email: string;
  firstName: string;
  orderNumber: string;
  items: OrderRequestEmailItem[];
  subtotal: number;
  shippingAmount: number;
  taxAmount: number;
  total: number;
}) {
  const resend = getResend();

  const { data, error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    replyTo: REPLY_TO_EMAIL,
    subject: `Ascend Order Request Received - ${orderNumber}`,
    html: emailShell(`
      <h1 style="
        margin:0 0 18px;
        font-family:Georgia,serif;
        font-size:28px;
        font-weight:500;
        line-height:1.25;
        color:#171717;
      ">
        Order Request Received
      </h1>

      <p style="
        margin:0 0 16px;
        font-family:Arial,sans-serif;
        font-size:14px;
        line-height:1.75;
        color:#55514b;
      ">
        Hello ${escapeHtml(firstName)},
      </p>

      <p style="
        margin:0 0 22px;
        font-family:Arial,sans-serif;
        font-size:14px;
        line-height:1.75;
        color:#55514b;
      ">
        We received your Ascend order request
        <strong>${escapeHtml(orderNumber)}</strong>.
        A member of the Ascend team will contact you regarding
        payment and fulfillment.
      </p>

      <table
        width="100%"
        cellpadding="0"
        cellspacing="0"
        style="border-collapse:collapse;"
      >
        <tbody>
          ${orderItemsHtml(items)}
        </tbody>
      </table>

      <div style="
        margin-top:22px;
        padding-top:18px;
        border-top:1px solid #e8e4dc;
        font-family:Arial,sans-serif;
        font-size:13px;
        line-height:1.8;
        color:#55514b;
      ">
        Subtotal: <strong>${money(subtotal)}</strong><br />
        Shipping: <strong>${money(shippingAmount)}</strong><br />
        Tax: <strong>${money(taxAmount)}</strong><br />
        <span style="font-size:16px;color:#171717;">
          Requested Total:
          <strong>${money(total)}</strong>
        </span>
      </div>

      <p style="
        margin:24px 0 0;
        font-family:Arial,sans-serif;
        font-size:12px;
        line-height:1.7;
        color:#77736b;
      ">
        This confirmation acknowledges receipt of your order
        request. Payment has not yet been collected.
      </p>
    `),
  });

  if (error) {
    throw new Error(
      `Customer order request email failed: ${error.message}`
    );
  }

  return data;
}


