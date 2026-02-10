/**
 * Email Service
 * Handles sending emails via SendGrid
 */

import sgMail from '@sendgrid/mail';
import { logger } from '../utils/logger';

// Initialize SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY || '');

interface EmailOptions {
  to: string;
  subject: string;
  template: string;
  data: Record<string, any>;
}

// Email templates (HTML)
const templates: Record<string, (data: any) => string> = {
  welcome: (data) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to JobAutoFlow</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #7c39f6, #9b5bf5); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .header h1 { color: white; margin: 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; background: #7c39f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to JobAutoFlow!</h1>
        </div>
        <div class="content">
          <h2>Hi ${data.firstName},</h2>
          <p>Thank you for joining JobAutoFlow! We're excited to help you automate your job search and land your dream role faster.</p>
          <p>With JobAutoFlow, you can:</p>
          <ul>
            <li>Connect to 50+ job portals</li>
            <li>Get AI-powered job matches (50%+ accuracy)</li>
            <li>Auto-apply to jobs while you sleep</li>
            <li>Track all applications in one dashboard</li>
          </ul>
          <a href="${data.loginUrl}" class="button">Get Started</a>
          <p>If you have any questions, our support team is always here to help.</p>
          <p>Best regards,<br>The JobAutoFlow Team</p>
        </div>
        <div class="footer">
          <p>© 2024 JobAutoFlow. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `,

  'password-reset': (data) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset Your Password</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #7c39f6, #9b5bf5); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .header h1 { color: white; margin: 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; background: #7c39f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        .warning { background: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Reset Your Password</h1>
        </div>
        <div class="content">
          <h2>Hi ${data.firstName},</h2>
          <p>We received a request to reset your password. Click the button below to create a new password:</p>
          <a href="${data.resetUrl}" class="button">Reset Password</a>
          <div class="warning">
            <p><strong>Important:</strong> This link will expire in ${data.expiresIn}.</p>
            <p>If you didn't request a password reset, you can safely ignore this email.</p>
          </div>
          <p>Best regards,<br>The JobAutoFlow Team</p>
        </div>
        <div class="footer">
          <p>© 2024 JobAutoFlow. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `,

  'password-reset-success': (data) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Password Reset Successful</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #22c55e, #16a34a); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .header h1 { color: white; margin: 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; background: #7c39f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Password Reset Successful</h1>
        </div>
        <div class="content">
          <h2>Hi ${data.firstName},</h2>
          <p>Your password has been successfully reset. You can now log in with your new password.</p>
          <a href="${data.loginUrl}" class="button">Log In</a>
          <p>If you didn't make this change, please contact our support team immediately.</p>
          <p>Best regards,<br>The JobAutoFlow Team</p>
        </div>
        <div class="footer">
          <p>© 2024 JobAutoFlow. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `,

  notification: (data) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${data.title}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #7c39f6, #9b5bf5); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .header h1 { color: white; margin: 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; background: #7c39f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${data.title}</h1>
        </div>
        <div class="content">
          <p>${data.message}</p>
          ${data.actionUrl ? `<a href="${data.actionUrl}" class="button">${data.actionText || 'View Details'}</a>` : ''}
          <p>Best regards,<br>The JobAutoFlow Team</p>
        </div>
        <div class="footer">
          <p>© 2024 JobAutoFlow. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `,
};

/**
 * Send email
 */
export const sendEmail = async (options: EmailOptions): Promise<void> => {
  try {
    const templateFn = templates[options.template];
    if (!templateFn) {
      throw new Error(`Email template "${options.template}" not found`);
    }

    const html = templateFn(options.data);

    const msg = {
      to: options.to,
      from: {
        email: process.env.EMAIL_FROM || 'noreply@jobautoflow.com',
        name: process.env.EMAIL_FROM_NAME || 'JobAutoFlow',
      },
      subject: options.subject,
      html,
    };

    await sgMail.send(msg);
    logger.info({ message: 'Email sent', to: options.to, subject: options.subject });
  } catch (error) {
    logger.error({ message: 'Failed to send email', error, to: options.to });
    throw error;
  }
};

/**
 * Send bulk emails
 */
export const sendBulkEmails = async (options: EmailOptions[]): Promise<void> => {
  try {
    const messages = options.map((opt) => {
      const templateFn = templates[opt.template];
      if (!templateFn) {
        throw new Error(`Email template "${opt.template}" not found`);
      }

      return {
        to: opt.to,
        from: {
          email: process.env.EMAIL_FROM || 'noreply@jobautoflow.com',
          name: process.env.EMAIL_FROM_NAME || 'JobAutoFlow',
        },
        subject: opt.subject,
        html: templateFn(opt.data),
      };
    });

    await sgMail.send(messages);
    logger.info({ message: 'Bulk emails sent', count: options.length });
  } catch (error) {
    logger.error({ message: 'Failed to send bulk emails', error });
    throw error;
  }
};
