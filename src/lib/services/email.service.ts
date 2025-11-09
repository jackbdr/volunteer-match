import sgMail from '@sendgrid/mail';
import type { Event } from '@prisma/client';

const API_KEY = process.env.SENDGRID_API_KEY || '';
const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'noreply@volunteerapp.com';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

if (API_KEY) {
  sgMail.setApiKey(API_KEY);
}

export class EmailService {
  /**
   * Send invitation email to volunteer for an event
   */
  public async sendEventInvitation(
    volunteer: { user: { id: string; name: string | null; email: string } },
    event: Event,
    _matchId: string
  ): Promise<void> {
    if (!API_KEY) {
      console.warn('SendGrid API key not configured. Email not sent.');
      return;
    }

    const dashboardUrl = `${APP_URL}/dashboard`;

    const eventDate = new Date(event.startTime).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const msg = {
      to: volunteer.user.email,
      from: FROM_EMAIL,
      subject: `You're invited to volunteer: ${event.title}`,
      html: this.getInvitationEmailHtml(
        volunteer.user.name || 'Volunteer',
        event,
        eventDate,
        dashboardUrl
      ),
    };

    try {
      await sgMail.send(msg);
      console.log(`Invitation email sent to ${volunteer.user.email} for event ${event.id}`);
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }

  /**
   * Generate HTML email template
   */
  private getInvitationEmailHtml(
    volunteerName: string,
    event: Event,
    eventDate: string,
    dashboardUrl: string
  ): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Event Invitation</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background-color: #2563eb;
      color: white;
      padding: 20px;
      text-align: center;
      border-radius: 8px 8px 0 0;
    }
    .content {
      background-color: #f9fafb;
      padding: 30px;
      border: 1px solid #e5e7eb;
    }
    .event-details {
      background-color: white;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
      border-left: 4px solid #2563eb;
    }
    .detail-row {
      margin: 10px 0;
    }
    .detail-label {
      font-weight: bold;
      color: #4b5563;
    }
    .button-container {
      text-align: center;
      margin: 30px 0;
    }
    .button {
      display: inline-block;
      padding: 14px 40px;
      text-decoration: none;
      border-radius: 6px;
      font-weight: bold;
      font-size: 16px;
      background-color: #2563eb;
      color: white;
    }
    .footer {
      text-align: center;
      padding: 20px;
      color: #6b7280;
      font-size: 14px;
    }
    .footer a {
      color: #2563eb;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>🎉 You're Invited!</h1>
  </div>
  
  <div class="content">
    <p>Hi ${volunteerName},</p>
    
    <p>Great news! You've been matched with a volunteering opportunity that fits your skills and interests.</p>
    
    <div class="event-details">
      <h2 style="margin-top: 0; color: #2563eb;">${event.title}</h2>
      
      <div class="detail-row">
        <span class="detail-label">📅 Date & Time:</span> ${eventDate}
      </div>
      
      <div class="detail-row">
        <span class="detail-label">⏱️ Duration:</span> ${event.duration} minutes
      </div>
      
      <div class="detail-row">
        <span class="detail-label">📍 Location:</span> ${event.eventType === 'VIRTUAL' ? 'Virtual (Online)' : event.location}
      </div>
      
      <div class="detail-row">
        <span class="detail-label">🎯 Skills Needed:</span> ${event.requiredSkills.join(', ')}
      </div>
      
      <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
        <p style="margin: 0;"><strong>About this event:</strong></p>
        <p style="color: #4b5563;">${event.description}</p>
      </div>
    </div>
    
    <p><strong>We think you'd be a great fit!</strong></p>
    
    <p>Please log in to your account to review this invitation and respond:</p>
    
    <div class="button-container">
      <a href="${dashboardUrl}" class="button">View Invitation in Dashboard</a>
    </div>
    
    <p style="text-align: center; color: #6b7280; font-size: 14px;">
      Log in to accept or decline this invitation and manage all your volunteering opportunities.
    </p>
  </div>
  
  <div class="footer">
    <p>Thank you for volunteering and making a difference! 💙</p>
    <p>If you have any questions, please contact us.</p>
  </div>
</body>
</html>
    `.trim();
  }
}

export const emailService = new EmailService();
