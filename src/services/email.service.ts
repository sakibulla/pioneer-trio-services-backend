import nodemailer from 'nodemailer';
import { Resend } from 'resend';
import { env } from '../config/env';
import { logger } from '../config/logger';

const LOGO_URL      = 'https://www.pioneertrioservices.com/logo.png';
const SITE_URL      = 'https://www.pioneertrioservices.com';
const NAVY          = '#0f2744';
const TEAL          = '#4a9eb5';
const GREEN         = '#16a34a';
const RED           = '#dc2626';
const PINK          = '#be185d';
const TEXT          = '#1e293b';
const MUTED         = '#64748b';
const BORDER        = '#e2e8f0';
const BG            = '#f1f5f9';
const WHITE         = '#ffffff';

class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private resend: Resend | null = null;

  constructor() {
    this.initTransporter();
  }

  private initTransporter() {
    if (env.RESEND_API_KEY) {
      this.resend = new Resend(env.RESEND_API_KEY);
      logger.info('📧 [EmailService] Provider: RESEND API');
      return;
    }
    if (env.SMTP_USER && env.SMTP_PASS) {
      this.transporter = nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        secure: env.SMTP_SECURE,
        auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
      });
      logger.info(`📧 [EmailService] Provider: SMTP (${env.SMTP_HOST}:${env.SMTP_PORT})`);
      this.transporter.verify((error) => {
        if (error) logger.error('❌ [EmailService] SMTP verify FAILED', { error: error.message });
        else logger.info('✅ [EmailService] SMTP verified');
      });
      return;
    }
    logger.warn('⚠️ [EmailService] Provider: MOCK — emails will NOT send');
  }

  // ─── BASE LAYOUT ────────────────────────────────────────────────────────────
  private layout(body: string, preview = ''): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <meta http-equiv="X-UA-Compatible" content="IE=edge"/>
  <title>Pioneer Trio Services</title>
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
</head>
<body style="margin:0;padding:0;background:${BG};-webkit-font-smoothing:antialiased;">
  ${preview ? `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${preview}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>` : ''}
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:${BG};">
    <tr><td align="center" style="padding:40px 16px 48px;">

      <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;width:100%;">

        <!-- LOGO ROW -->
        <tr>
          <td style="padding:0 0 24px;text-align:center;">
            <a href="${SITE_URL}" target="_blank" style="text-decoration:none;">
              <img src="${LOGO_URL}" alt="Pioneer Trio Services" width="160" height="auto"
                   style="display:inline-block;max-width:160px;height:auto;"/>
            </a>
          </td>
        </tr>

        <!-- CARD -->
        <tr>
          <td style="background:${WHITE};border-radius:12px;box-shadow:0 1px 3px rgba(0,0,0,.08),0 4px 16px rgba(0,0,0,.04);overflow:hidden;">

            <!-- ACCENT LINE -->
            <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
              <tr><td style="height:4px;background:linear-gradient(90deg,${NAVY} 0%,${TEAL} 100%);"></td></tr>
            </table>

            <!-- BODY -->
            <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
              <tr>
                <td style="padding:40px 48px 36px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;font-size:15px;line-height:1.75;color:${TEXT};">
                  ${body}
                </td>
              </tr>
            </table>

            <!-- FOOTER DIVIDER -->
            <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
              <tr><td style="padding:0 48px;"><div style="border-top:1px solid ${BORDER};"></div></td></tr>
            </table>

            <!-- FOOTER -->
            <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
              <tr>
                <td style="padding:24px 48px 32px;text-align:center;">
                  <p style="margin:0 0 4px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:12px;color:${MUTED};">
                    © ${new Date().getFullYear()} Pioneer Trio Services &nbsp;·&nbsp; Dhaka, Bangladesh
                  </p>
                  <p style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:12px;color:#94a3b8;">
                    <a href="${SITE_URL}" style="color:${TEAL};text-decoration:none;">pioneertrioservices.com</a>
                    &nbsp;·&nbsp;
                    <a href="mailto:admin@pioneertrioservices.com" style="color:${TEAL};text-decoration:none;">admin@pioneertrioservices.com</a>
                  </p>
                </td>
              </tr>
            </table>

          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
  }

  // ─── COMPONENTS ─────────────────────────────────────────────────────────────
  private h1(text: string): string {
    return `<h1 style="margin:0 0 20px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:22px;font-weight:700;color:${NAVY};line-height:1.3;">${text}</h1>`;
  }

  private p(text: string, style = ''): string {
    return `<p style="margin:0 0 16px;font-size:15px;color:${MUTED};${style}">${text}</p>`;
  }

  private greeting(name: string): string {
    return `<p style="margin:0 0 20px;font-size:16px;font-weight:600;color:${TEXT};">Hi ${name},</p>`;
  }

  private badge(label: string, color = TEAL): string {
    return `<div style="margin:0 0 20px;"><span style="display:inline-block;padding:4px 14px;background:${color}18;border-radius:20px;font-size:11px;font-weight:700;letter-spacing:0.8px;color:${color};text-transform:uppercase;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">${label}</span></div>`;
  }

  private button(label: string, url: string, color = TEAL): string {
    return `
    <table cellpadding="0" cellspacing="0" role="presentation" style="margin:28px 0 8px;">
      <tr>
        <td style="border-radius:8px;background:${color};">
          <a href="${url}" target="_blank"
             style="display:inline-block;padding:13px 30px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:14px;font-weight:700;color:${WHITE};text-decoration:none;letter-spacing:0.2px;border-radius:8px;">${label} →</a>
        </td>
      </tr>
    </table>`;
  }

  private dataTable(rows: { label: string; value: string }[]): string {
    const rowsHtml = rows.map((r, i) => `
      <tr>
        <td style="padding:12px 0;${i < rows.length - 1 ? `border-bottom:1px solid ${BORDER};` : ''}vertical-align:top;width:40%;">
          <span style="font-size:12px;font-weight:600;color:${MUTED};text-transform:uppercase;letter-spacing:0.5px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">${r.label}</span>
        </td>
        <td style="padding:12px 0 12px 16px;${i < rows.length - 1 ? `border-bottom:1px solid ${BORDER};` : ''}vertical-align:top;">
          <span style="font-size:14px;font-weight:600;color:${TEXT};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">${r.value}</span>
        </td>
      </tr>`).join('');
    return `
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
           style="margin:20px 0 24px;border:1px solid ${BORDER};border-radius:8px;overflow:hidden;">
      <tr><td style="padding:4px 20px;">
        <table width="100%" cellpadding="0" cellspacing="0">${rowsHtml}</table>
      </td></tr>
    </table>`;
  }

  private alertBox(text: string, type: 'info' | 'warning' | 'success' | 'danger' = 'info'): string {
    const colors = {
      info:    { bg: `${TEAL}0d`,    border: TEAL,  text: '#0e6680' },
      warning: { bg: '#fff7ed',       border: '#f97316', text: '#9a3412' },
      success: { bg: '#f0fdf4',       border: GREEN, text: '#14532d' },
      danger:  { bg: '#fef2f2',       border: RED,   text: '#7f1d1d' },
    };
    const c = colors[type];
    return `
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
           style="margin:16px 0 24px;background:${c.bg};border:1px solid ${c.border}33;border-radius:8px;">
      <tr><td style="padding:14px 18px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:13px;color:${c.text};line-height:1.6;">${text}</td></tr>
    </table>`;
  }

  private quoteBlock(text: string): string {
    return `
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
           style="margin:20px 0 24px;border-left:3px solid ${TEAL};background:#f8fafc;border-radius:0 8px 8px 0;">
      <tr><td style="padding:16px 20px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:14px;font-style:italic;color:${TEXT};line-height:1.7;">"${text}"</td></tr>
    </table>`;
  }

  private signOff(): string {
    return `
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-top:32px;">
      <tr><td style="padding-top:24px;border-top:1px solid ${BORDER};">
        <p style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:14px;color:${MUTED};line-height:1.7;">
          Warm regards,<br/>
          <strong style="color:${TEXT};font-weight:700;">The Pioneer Trio Services Team</strong>
        </p>
      </td></tr>
    </table>`;
  }

  // ─── SEND ────────────────────────────────────────────────────────────────────
  public async sendMail(to: string, subject: string, bodyHtml: string, preview?: string): Promise<boolean> {
    const html = this.layout(bodyHtml, preview);
    const provider = this.resend ? 'RESEND' : this.transporter ? 'SMTP' : 'MOCK';
    logger.info(`📤 [EmailService] sendMail → provider=${provider} to=${to} subject="${subject}"`);

    if (!this.resend && !this.transporter) {
      logger.warn(`⚠️ [EmailService] MOCK — not sent to ${to}`);
      return true;
    }

    if (this.resend) {
      const from = env.RESEND_FROM_ADDRESS
        ? (env.RESEND_FROM_ADDRESS.includes('<') ? env.RESEND_FROM_ADDRESS : `Pioneer Trio Services <${env.RESEND_FROM_ADDRESS}>`)
        : 'Pioneer Trio Services <noreply@pioneertrioservices.com>';
      try {
        const { data, error } = await this.resend.emails.send({ from, to, subject, html });
        if (error) throw new Error(error.message);
        logger.info(`✅ Resend → ${to} [${subject}] id:${data?.id}`);
        return true;
      } catch (err: any) {
        logger.error(`❌ Resend failed → ${to}`, { error: err.message });
        throw new Error(`Email delivery failed: ${err.message}`);
      }
    }

    const from = env.SMTP_USER ? `Pioneer Trio Services <${env.SMTP_USER}>` : env.EMAIL_FROM;
    try {
      const info = await this.transporter!.sendMail({ from, to, subject, html });
      logger.info(`✅ SMTP → ${to} [${subject}] msgId:${info.messageId}`);
      return true;
    } catch (err: any) {
      logger.error(`❌ SMTP failed → ${to}`, { error: err.message });
      throw new Error(`Email delivery failed: ${err.message}`);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // TEMPLATES
  // ═══════════════════════════════════════════════════════════════════════════

  public async sendWelcomeEmail(to: string, name: string): Promise<void> {
    const body = `
      ${this.badge('Welcome')}
      ${this.h1('Welcome to Pioneer Trio Services')}
      ${this.greeting(name)}
      ${this.p('Thank you for creating your account. We\'re dedicated to providing a trustworthy, verified digital path for your immigration and matrimonial journeys.')}
      ${this.p('Your secure portal gives you access to:')}
      <ul style="margin:0 0 20px;padding-left:20px;color:${MUTED};font-size:14px;line-height:2;">
        <li>Track your case status in real time</li>
        <li>Securely upload and manage documents</li>
        <li>Receive updates from your assigned coordinator</li>
      </ul>
      ${this.button('Go to My Portal', `${env.FRONTEND_URL}/portal`)}
      ${this.signOff()}
    `;
    await this.sendMail(to, `Welcome to Pioneer Trio Services, ${name}!`, body, `Hi ${name}, your account is ready.`);
  }

  public async sendImmigrationAssessmentReceived(
    to: string, name: string, caseReference: string, destination: string
  ): Promise<void> {
    const body = `
      ${this.badge('Immigration', TEAL)}
      ${this.h1('Your Assessment Has Been Received')}
      ${this.greeting(name)}
      ${this.p(`We've successfully received your immigration assessment for <strong style="color:${TEXT};">${destination}</strong>. A dedicated Pioneer Trio Case Coordinator has been assigned to your file.`)}
      ${this.dataTable([
        { label: 'Case Reference', value: caseReference },
        { label: 'Destination',    value: destination },
        { label: 'Current Status', value: 'Initial Intake & Document Verification' },
        { label: 'Expected Review', value: '1–2 business days' },
      ])}
      ${this.alertBox('You will receive a follow-up email once your coordinator begins the document review process. Keep an eye on your inbox.', 'info')}
      ${this.button('Track My Case', `${env.FRONTEND_URL}/portal`, TEAL)}
      ${this.signOff()}
    `;
    await this.sendMail(to, `Assessment Received — Ref: ${caseReference}`, body, `Your case ${caseReference} is now being reviewed.`);
  }

  public async sendCoordinatorNewCaseNotification(
    to: string, coordinatorName: string, clientName: string, caseReference: string, destination: string
  ): Promise<void> {
    const body = `
      ${this.badge('New Assignment', TEAL)}
      ${this.h1('A New Case Has Been Assigned to You')}
      ${this.greeting(coordinatorName)}
      ${this.p('The following immigration assessment has been submitted and is ready for your review. Please begin initial document verification at your earliest convenience.')}
      ${this.dataTable([
        { label: 'Client',       value: clientName },
        { label: 'Reference',    value: caseReference },
        { label: 'Destination',  value: destination },
        { label: 'Priority',     value: 'Standard' },
      ])}
      ${this.button('Open Case in Dashboard', `${env.FRONTEND_URL}/portal`, NAVY)}
      ${this.signOff()}
    `;
    await this.sendMail(to, `[New Case] ${caseReference} — ${clientName}`, body, `New case assigned: ${clientName} → ${destination}`);
  }

  public async sendMatrimonialProfileSubmitted(to: string, name: string): Promise<void> {
    const body = `
      ${this.badge('Matrimonial', PINK)}
      ${this.h1('Your Profile Has Been Received')}
      ${this.greeting(name)}
      ${this.p('Thank you for submitting your profile to <strong style="color:' + TEXT + ';">Pioneer Trio Marriage Consultancy</strong>. We\'re honoured by the trust you\'ve placed in us.')}
      ${this.p('Our matchmaking is entirely <strong style="color:' + TEXT + ';">human-led and zero-algorithm</strong> — every match is carefully curated by our Senior Matchmaker after a thorough review.')}
      ${this.dataTable([
        { label: 'Status',    value: 'Pending Verification & Interview' },
        { label: 'Next Step', value: 'Matchmaker will contact you within 2 business days' },
      ])}
      ${this.alertBox('Please keep your phone available. Our matchmaker may reach out directly to schedule your 1-on-1 verification call.', 'info')}
      ${this.button('View My Profile', `${env.FRONTEND_URL}/portal`, PINK)}
      ${this.signOff()}
    `;
    await this.sendMail(to, 'Your Matrimonial Profile Has Been Received', body, 'Your profile is pending verification — we\'ll be in touch soon.');
  }

  public async sendMatchProposalNotification(to: string, name: string, rationale: string): Promise<void> {
    const body = `
      ${this.badge('Match Proposal', PINK)}
      ${this.h1('A Curated Match Has Been Proposed for You')}
      ${this.greeting(name)}
      ${this.p('After a thorough compatibility evaluation, your Pioneer Trio Matchmaker has hand-selected a prospective match for your consideration.')}
      <p style="margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:0.6px;text-transform:uppercase;color:${MUTED};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">Matchmaker's Rationale</p>
      ${this.quoteBlock(rationale)}
      ${this.p('Log in to your secure portal to review the verified profile summary and indicate whether you\'d like to proceed with an introduction.')}
      ${this.button('Review Match Proposal', `${env.FRONTEND_URL}/portal`, PINK)}
      ${this.signOff()}
    `;
    await this.sendMail(to, 'New Hand-Selected Match Proposal — Pioneer Trio', body, 'Your matchmaker has found a curated match for you.');
  }

  public async sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
    const body = `
      ${this.badge('Security', RED)}
      ${this.h1('Reset Your Password')}
      ${this.p('We received a request to reset the password for your Pioneer Trio Services account. Click the button below to choose a new password.')}
      ${this.alertBox('<strong>This link expires in 1 hour</strong> and can only be used once. If you did not request a password reset, you can safely ignore this email — your password will remain unchanged.', 'warning')}
      ${this.button('Reset My Password', resetUrl, RED)}
      <p style="margin:24px 0 0;font-size:12px;color:${MUTED};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;word-break:break-all;">
        If the button above doesn't work, copy and paste this link into your browser:<br/>
        <a href="${resetUrl}" style="color:${TEAL};">${resetUrl}</a>
      </p>
      ${this.signOff()}
    `;
    await this.sendMail(to, 'Reset Your Pioneer Trio Services Password', body, 'A password reset was requested for your account.');
  }

  public async sendPasswordResetConfirmEmail(to: string, name: string): Promise<void> {
    const body = `
      ${this.badge('Password Updated', GREEN)}
      ${this.h1('Your Password Has Been Changed')}
      ${this.greeting(name)}
      ${this.alertBox('✅ Your account password was successfully updated. You can now log in with your new password.', 'success')}
      ${this.alertBox('⚠️ If you did <strong>not</strong> make this change, please contact us immediately at <a href="mailto:admin@pioneertrioservices.com" style="color:' + RED + ';">admin@pioneertrioservices.com</a> — your account may be compromised.', 'danger')}
      ${this.button('Log In to Your Account', `${env.FRONTEND_URL}/portal`, GREEN)}
      ${this.signOff()}
    `;
    await this.sendMail(to, 'Your Pioneer Trio Password Has Been Changed', body, 'Your account password was successfully updated.');
  }
}

export const emailService = new EmailService();
