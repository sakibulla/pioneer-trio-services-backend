import { Request, Response } from 'express';
import { prisma } from '../../../config/database';
import { emailQueue } from '../../../jobs/queue';
import { ApiResponse } from '../../../utils/response';
import { asyncHandler } from '../../../utils/asyncHandler';

export class ContactController {
  public static submitInquiry = asyncHandler(async (req: Request, res: Response) => {
    const { name, email, phone, serviceLine, subject, message } = req.body;

    const inquiry = await prisma.contactInquiry.create({
      data: {
        name,
        email,
        phone,
        serviceLine,
        subject,
        message,
        status: 'NEW',
      },
    });

    // Notify respective lead mailbox based on service line
    emailQueue.add({
      type: 'GENERIC_EMAIL',
      payload: {
        to: email,
        subject: `Pioneer Trio - We received your inquiry: ${subject}`,
        content: `
          <h3>Thank you for reaching out, ${name}!</h3>
          <p>We have received your message regarding our <strong>${serviceLine}</strong> service.</p>
          <p>A member of our team will review your message and reply back within 24 business hours.</p>
        `,
      },
    });

    ApiResponse.created(res, inquiry, 'Your inquiry has been submitted. A confirmation email has been sent.');
  });

  public static subscribeNewsletter = asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body;

    const subscriber = await prisma.newsletterSubscriber.upsert({
      where: { email: email.toLowerCase() },
      update: { isVerified: true },
      create: { email: email.toLowerCase(), isVerified: true },
    });

    ApiResponse.success(res, subscriber, 'Subscribed to Pioneer Trio newsletter successfully');
  });
}
