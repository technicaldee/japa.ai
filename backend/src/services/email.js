import { Resend } from "resend";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = "JAPA <onboarding@resend.dev>";

let resendClient = null;
if (RESEND_API_KEY) {
  resendClient = new Resend(RESEND_API_KEY);
}

export async function sendDocumentRequest(user, scholarshipName, missingItems, instructions) {
  if (!resendClient) return;

  const itemsList = missingItems
    .map((item) => `<li style="padding:8px 0;border-bottom:1px solid #f3f4f6;font-size:14px">${item}</li>`)
    .join("");

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;margin:0;padding:0;background:#f9fafb">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:24px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
    <tr>
      <td style="padding:32px 32px 24px;background:linear-gradient(135deg,#6366f1,#8b5cf6);text-align:center">
        <h1 style="color:#ffffff;font-size:24px;font-weight:700;margin:0">Documents Needed</h1>
        <p style="color:#c7d2fe;font-size:14px;margin:8px 0 0">We need more information to complete your application</p>
      </td>
    </tr>
    <tr>
      <td style="padding:24px 32px">
        <p style="font-size:16px;color:#111827;margin:0 0 4px">Hello <strong>${user.fullName}</strong>,</p>
        <p style="font-size:14px;color:#6b7280;margin:0 0 16px">While applying for <strong>${scholarshipName}</strong>, we noticed the following items are missing from your profile:</p>

        <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:16px;margin-bottom:20px">
          <h3 style="font-size:14px;color:#991b1b;margin:0 0 8px">Required Documents</h3>
          <ul style="margin:0;padding-left:20px;color:#7f1d1d">${itemsList}</ul>
        </div>

        ${instructions ? `<div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;margin-bottom:20px"><p style="font-size:13px;color:#166534;margin:0">${instructions}</p></div>` : ""}

        <p style="font-size:14px;color:#6b7280;margin:0 0 12px">Please upload these documents through your profile page, and we'll retry the application automatically.</p>

        <a href="https://japa.app/profile" style="display:inline-block;background:#6366f1;color:#ffffff;padding:12px 24px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600">Upload Documents</a>

        <p style="font-size:12px;color:#9ca3af;margin:24px 0 0;text-align:center">The agent will retry your application once all documents are available.</p>
      </td>
    </tr>
  </table>
</body>
</html>`;

  try {
    await resendClient.emails.send({
      from: FROM_EMAIL,
      to: user.email,
      subject: `📄 Documents needed for ${scholarshipName}`,
      html,
    });
    console.log(`[EMAIL] Document request sent to ${user.email}`);
  } catch (err) {
    console.error("[EMAIL] Failed to send document request:", err);
  }
}

export async function sendMatchReport(user, matches, applications, missingDocsMap) {
  if (!resendClient) {
    console.log("[EMAIL] No Resend API key configured, skipping email");
    return;
  }

  const matchedList = matches
    .slice(0, 10)
    .map(
      (s, i) =>
        `<tr style="border-bottom:1px solid #e5e7eb">
          <td style="padding:12px 8px;font-size:14px">${i + 1}.</td>
          <td style="padding:12px 8px;font-size:14px"><strong>${s.title}</strong><br><span style="color:#6b7280;font-size:12px">${s.provider}</span></td>
          <td style="padding:12px 8px;font-size:14px">${s.funding || "N/A"}</td>
          <td style="padding:12px 8px;font-size:14px">${s.location || "N/A"}</td>
          <td style="padding:12px 8px;font-size:14px">${s.deadline ? new Date(s.deadline).toLocaleDateString() : "N/A"}</td>
        </tr>`
    )
    .join("");

  const appliedList = applications
    .slice(0, 10)
    .map(
      (a, i) =>
        `<tr style="border-bottom:1px solid #e5e7eb">
          <td style="padding:12px 8px;font-size:14px">${i + 1}.</td>
          <td style="padding:12px 8px;font-size:14px"><strong>${a.scholarshipTitle}</strong></td>
          <td style="padding:12px 8px;font-size:14px"><span style="color:${a.status === "Applied" ? "#059669" : a.status === "Docs Needed" ? "#d97706" : "#dc2626"};font-weight:600">${a.status}</span></td>
          <td style="padding:12px 8px;font-size:12px;color:#6b7280">${a.detail || ""}</td>
        </tr>`
    )
    .join("");

  let missingDocsSection = "";
  if (missingDocsMap && Object.keys(missingDocsMap).length > 0) {
    const docsEntries = Object.entries(missingDocsMap)
      .map(
        ([title, docs]) =>
          `<tr style="border-bottom:1px solid #e5e7eb">
            <td style="padding:10px 8px;font-size:13px"><strong>${title}</strong></td>
            <td style="padding:10px 8px;font-size:13px;color:#d97706">${docs.join(", ")}</td>
          </tr>`
      )
      .join("");

    missingDocsSection = `
      <h2 style="font-size:18px;color:#111827;margin:24px 0 12px">📄 Documents Needed</h2>
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:24px">
        <tr style="background:#f3f4f6">
          <th style="padding:10px 8px;font-size:12px;color:#6b7280;text-align:left">Scholarship</th>
          <th style="padding:10px 8px;font-size:12px;color:#6b7280;text-align:left">Missing Items</th>
        </tr>
        ${docsEntries}
      </table>
      <p style="font-size:13px;color:#6b7280;margin:-16px 0 24px">Please upload these documents in your profile. The agent will retry automatically.</p>`;
  }

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;margin:0;padding:0;background:#f9fafb">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:24px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
    <tr>
      <td style="padding:32px 32px 24px;background:linear-gradient(135deg,#6366f1,#8b5cf6);text-align:center">
        <h1 style="color:#ffffff;font-size:24px;font-weight:700;margin:0">JAPA Agent Report</h1>
        <p style="color:#c7d2fe;font-size:14px;margin:8px 0 0">Your personal scholarship matching and application report</p>
      </td>
    </tr>
    <tr>
      <td style="padding:24px 32px">
        <p style="font-size:16px;color:#111827;margin:0 0 4px">Hello <strong>${user.fullName}</strong>,</p>
        <p style="font-size:14px;color:#6b7280;margin:0 0 24px">Here are your scholarship matches and application status as of ${new Date().toLocaleDateString()}.</p>

        <h2 style="font-size:18px;color:#111827;margin:0 0 12px">🎯 Matched Scholarships (${matches.length})</h2>
        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:24px">
          <tr style="background:#f3f4f6">
            <th style="padding:10px 8px;font-size:12px;color:#6b7280;text-align:left">#</th>
            <th style="padding:10px 8px;font-size:12px;color:#6b7280;text-align:left">Scholarship</th>
            <th style="padding:10px 8px;font-size:12px;color:#6b7280;text-align:left">Funding</th>
            <th style="padding:10px 8px;font-size:12px;color:#6b7280;text-align:left">Location</th>
            <th style="padding:10px 8px;font-size:12px;color:#6b7280;text-align:left">Deadline</th>
          </tr>
          ${matchedList || '<tr><td colspan="5" style="padding:16px;text-align:center;color:#9ca3af;font-size:14px">No matches found yet</td></tr>'}
        </table>

        <h2 style="font-size:18px;color:#111827;margin:0 0 12px">📋 Application Status (${applications.length})</h2>
        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:24px">
          <tr style="background:#f3f4f6">
            <th style="padding:10px 8px;font-size:12px;color:#6b7280;text-align:left">#</th>
            <th style="padding:10px 8px;font-size:12px;color:#6b7280;text-align:left">Scholarship</th>
            <th style="padding:10px 8px;font-size:12px;color:#6b7280;text-align:left">Status</th>
            <th style="padding:10px 8px;font-size:12px;color:#6b7280;text-align:left">Detail</th>
          </tr>
          ${appliedList || '<tr><td colspan="4" style="padding:16px;text-align:center;color:#9ca3af;font-size:14px">No applications yet</td></tr>'}
        </table>

        ${missingDocsSection}

        <p style="font-size:12px;color:#9ca3af;margin:24px 0 0;text-align:center">The JAPA agent visited each scholarship website, analyzed requirements, and attempted to pre-fill and submit applications using your profile data.</p>
      </td>
    </tr>
  </table>
</body>
</html>`;

  try {
    await resendClient.emails.send({
      from: FROM_EMAIL,
      to: user.email,
      subject: `JAPA Report — ${matches.length} matches, ${applications.length} applications submitted`,
      html,
    });
    console.log(`[EMAIL] Report sent to ${user.email}`);
  } catch (err) {
    console.error("[EMAIL] Failed to send:", err);
  }
}
