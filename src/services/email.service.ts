import nodemailer from 'nodemailer';
import { env } from '../config/env';
import { logger } from '../config/logger';

class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    this.initTransporter();
  }

  private initTransporter() {
    if (env.SMTP_USER && env.SMTP_PASS) {
      this.transporter = nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        secure: env.SMTP_SECURE,
        auth: {
          user: env.SMTP_USER,
          pass: env.SMTP_PASS,
        },
      });
      logger.info(`📧 Email transporter initialized via SMTP (${env.SMTP_HOST}:${env.SMTP_PORT})`);

      // Verify SMTP connection on startup so misconfiguration is caught immediately
      this.transporter.verify((error) => {
        if (error) {
          logger.error('❌ SMTP connection verification failed', { error: error.message });
        } else {
          logger.info('✅ SMTP connection verified — ready to send emails');
        }
      });
    } else {
      logger.warn('⚠️ SMTP credentials not configured. Email service will run in log-only mock mode.');
    }
  }

  private getBaseLayout(content: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1e293b; background-color: #f8fafc; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0; overflow: hidden; }
          .header { background: #0f172a; padding: 24px; text-align: center; color: #ffffff; }
          .header h1 { margin: 0; font-size: 22px; font-weight: 700; letter-spacing: 0.5px; }
          .content { padding: 32px 24px; }
          .button { display: inline-block; padding: 12px 24px; background-color: #0284c7; color: #ffffff !important; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
          .footer { background: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
          .info-box { background: #f8fafc; border-left: 4px solid #0284c7; padding: 16px; margin: 20px 0; border-radius: 0 4px 4px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>PIONEER TRIO SERVICES</h1>
          </div>
          <div class="content">
            ${content}
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Pioneer Trio Services. All rights reserved.</p>
            <p>Dhaka, Bangladesh | Trustworthy Digital Path for Global Bangladeshis</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  public async sendMail(to: string, subject: string, htmlContent: string): Promise<boolean> {
    const fullHtml = this.getBaseLayout(htmlContent);

    if (!this.transporter) {
      logger.info(`[Mock Email] To: ${to} | Subject: "${subject}"`);
      return true;
    }

    // Gmail only allows sending from the authenticated SMTP_USER address.
    // Using a different domain (e.g. noreply@pioneertrioservices.com) causes
    // Gmail to silently drop or reject the message. Always send as SMTP_USER.
    const fromAddress = env.SMTP_USER
      ? `Pioneer Trio Services <${env.SMTP_USER}>`
      : env.EMAIL_FROM;

    try {
      const info = await this.transporter.sendMail({
        from: fromAddress,
        to,
        subject,
        html: fullHtml,
      });
      logger.info(`Email sent successfully to ${to} [${subject}] — MessageId: ${info.messageId}`);
      return true;
    } catch (err: any) {
      logger.error(`Failed to send email to ${to}`, { error: err.message, subject });
      // Re-throw so callers (e.g. forgot-password) get a real error
      // instead of silently returning 200 when email delivery fails
      throw new Error(`Email delivery failed: ${err.message}`);
    }
  }

  // --- Specialized Email Templates ---

  public async sendWelcomeEmail(to: string, name: string): Promise<void> {
    const html = `
      <h2>Welcome to Pioneer Trio Services, ${name}!</h2>
      <p>Thank you for creating an account with Pioneer Trio Services. We are dedicated to providing a trustworthy, verified, and digital path for your immigration and matrimonial journeys.</p>
      <p>Your portal account gives you secure access to track case status, upload verified documents, and view updates from your assigned coordinator or matchmaker.</p>
    `;
    await this.sendMail(to, 'Welcome to Pioneer Trio Services', html);
  }

  public async sendImmigrationAssessmentReceived(to: string, name: string, caseReference: string, destination: string): Promise<void> {
    const html = `
      <h2>Immigration Assessment Received</h2>
      <p>Dear ${name},</p>
      <p>We have successfully received your initial immigration assessment for <strong>${destination}</strong>.</p>
      <div class="info-box">
        <p><strong>Case Reference Number:</strong> ${caseReference}</p>
        <p><strong>Status:</strong> Initial Intake & Document Verification</p>
      </div>
      <p>A named Pioneer Trio Case Coordinator has been assigned to your case and will review your profile within 1-2 business days.</p>
    `;
    await this.sendMail(to, `Assessment Received - Ref: ${caseReference}`, html);
  }

  public async sendCoordinatorNewCaseNotification(to: string, coordinatorName: string, clientName: string, caseReference: string, destination: string): Promise<void> {
    const html = `
      <h2>New Immigration Case Assigned</h2>
      <p>Hello ${coordinatorName},</p>
      <p>A new immigration assessment has been submitted and assigned to your queue:</p>
      <div class="info-box">
        <p><strong>Client:</strong> ${clientName}</p>
        <p><strong>Case Reference:</strong> ${caseReference}</p>
        <p><strong>Destination:</strong> ${destination}</p>
      </div>
      <p>Please log in to your staff dashboard to begin initial document verification and checklist review.</p>
    `;
    await this.sendMail(to, `[New Case Assignment] ${caseReference} - ${clientName}`, html);
  }

  public async sendMatrimonialProfileSubmitted(to: string, name: string): Promise<void> {
    const html = `
      <h2>Matrimonial Profile Submission Received</h2>
      <p>Dear ${name},</p>
      <p>Thank you for submitting your profile to Pioneer Trio Marriage Consultancy.</p>
      <p>Because our matchmaking is strictly human-led and verified (we use zero automated algorithms), our Senior Matchmaker will contact you to schedule a 1-on-1 verification call.</p>
      <div class="info-box">
        <p><strong>Current Status:</strong> Pending Verification & Interview</p>
      </div>
    `;
    await this.sendMail(to, 'Pioneer Trio Matrimonial Profile Received', html);
  }

  public async sendMatchProposalNotification(to: string, name: string, rationale: string): Promise<void> {
    const html = `
      <h2>Curated Match Introduction Proposal</h2>
      <p>Dear ${name},</p>
      <p>Your Pioneer Trio Matchmaker has hand-selected a prospective match for you after comprehensive compatibility evaluation.</p>
      <div class="info-box">
        <p><strong>Matchmaker Rationale:</strong></p>
        <p><em>"${rationale}"</em></p>
      </div>
      <p>Please log in to your secure portal to review the verified profile summary and let us know if you would like to proceed with an introduction.</p>
    `;
    await this.sendMail(to, 'New Hand-Selected Match Proposal - Pioneer Trio', html);
  }

  public async sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
    const html = `
      <h2>Password Reset Request</h2>
      <p>We received a request to reset your password for your Pioneer Trio Services account.</p>
      <p>Click the button below to set a new password. This link is valid for 1 hour.</p>
      <div style="text-align: center;">
        <a href="${resetUrl}" class="button">Reset Password</a>
      </div>
      <p>If you did not make this request, you can safely ignore this email.</p>
    `;
    await this.sendMail(to, 'Reset Your Pioneer Trio Password', html);
  }
}

export const emailService = new EmailService();
