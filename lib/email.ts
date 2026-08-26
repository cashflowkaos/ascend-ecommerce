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
