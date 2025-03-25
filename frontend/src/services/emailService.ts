interface EmailTemplate {
  subject: string;
  body: string;
  html?: string;
}

interface EmailData {
  to: string;
  template: string;
  data: Record<string, any>;
}

export class EmailService {
  private static templates: Record<string, EmailTemplate> = {
    paymentSuccess: {
      subject: 'Payment Successful - Moneyball Analytics',
      body: 'Thank you for your payment. Your transaction has been processed successfully.',
      html: `
        <h1>Payment Successful</h1>
        <p>Thank you for your payment. Your transaction has been processed successfully.</p>
        <p>Transaction Details:</p>
        <ul>
          <li>Amount: \${amount}</li>
          <li>Date: \${date}</li>
          <li>Type: \${type}</li>
        </ul>
        <p>If you have any questions, please contact our support team.</p>
      `,
    },
    subscriptionActivated: {
      subject: 'Subscription Activated - Moneyball Analytics',
      body: 'Your subscription has been activated successfully.',
      html: `
        <h1>Subscription Activated</h1>
        <p>Your subscription to the \${tier} plan has been activated successfully.</p>
        <p>Subscription Details:</p>
        <ul>
          <li>Plan: \${tier}</li>
          <li>Start Date: \${startDate}</li>
          <li>Next Billing: \${nextBillingDate}</li>
        </ul>
        <p>You now have access to all features included in your plan.</p>
      `,
    },
    reportReady: {
      subject: 'Your Report is Ready - Moneyball Analytics',
      body: 'Your requested report has been generated and is ready for download.',
      html: `
        <h1>Report Ready</h1>
        <p>Your requested report has been generated and is ready for download.</p>
        <p>Report Details:</p>
        <ul>
          <li>Type: \${reportType}</li>
          <li>Generated: \${generatedDate}</li>
        </ul>
        <p><a href="\${downloadUrl}">Click here to download your report</a></p>
      `,
    },
    subscriptionRenewal: {
      subject: 'Subscription Renewal Reminder - Moneyball Analytics',
      body: 'Your subscription will be renewed soon.',
      html: `
        <h1>Subscription Renewal Reminder</h1>
        <p>Your subscription to the \${tier} plan will be renewed on \${renewalDate}.</p>
        <p>Renewal Details:</p>
        <ul>
          <li>Plan: \${tier}</li>
          <li>Amount: \${amount}</li>
          <li>Renewal Date: \${renewalDate}</li>
        </ul>
        <p>If you wish to cancel or modify your subscription, please visit your account settings.</p>
      `,
    },
    paymentFailed: {
      subject: 'Payment Failed - Moneyball Analytics',
      body: 'We were unable to process your payment.',
      html: `
        <h1>Payment Failed</h1>
        <p>We were unable to process your payment for the following reason:</p>
        <p>\${errorMessage}</p>
        <p>Please update your payment information or contact our support team for assistance.</p>
      `,
    },
  };

  private static replaceTemplateVariables(template: string, data: Record<string, any>): string {
    return template.replace(/\${(\w+)}/g, (match, key) => {
      return data[key] !== undefined ? data[key].toString() : match;
    });
  }

  public static async sendEmail({ to, template, data }: EmailData): Promise<boolean> {
    try {
      const emailTemplate = this.templates[template];
      if (!emailTemplate) {
        throw new Error(`Email template '${template}' not found`);
      }

      const subject = this.replaceTemplateVariables(emailTemplate.subject, data);
      const body = this.replaceTemplateVariables(emailTemplate.body, data);
      const html = emailTemplate.html
        ? this.replaceTemplateVariables(emailTemplate.html, data)
        : undefined;

      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to,
          subject,
          body,
          html,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send email');
      }

      return true;
    } catch (error) {
      console.error('Error sending email:', error);
      return false;
    }
  }

  public static async sendPaymentSuccessEmail(
    to: string,
    amount: number,
    type: string,
    date: string
  ): Promise<boolean> {
    return this.sendEmail({
      to,
      template: 'paymentSuccess',
      data: {
        amount,
        type,
        date,
      },
    });
  }

  public static async sendSubscriptionActivatedEmail(
    to: string,
    tier: string,
    startDate: string,
    nextBillingDate: string
  ): Promise<boolean> {
    return this.sendEmail({
      to,
      template: 'subscriptionActivated',
      data: {
        tier,
        startDate,
        nextBillingDate,
      },
    });
  }

  public static async sendReportReadyEmail(
    to: string,
    reportType: string,
    generatedDate: string,
    downloadUrl: string
  ): Promise<boolean> {
    return this.sendEmail({
      to,
      template: 'reportReady',
      data: {
        reportType,
        generatedDate,
        downloadUrl,
      },
    });
  }

  public static async sendSubscriptionRenewalEmail(
    to: string,
    tier: string,
    amount: number,
    renewalDate: string
  ): Promise<boolean> {
    return this.sendEmail({
      to,
      template: 'subscriptionRenewal',
      data: {
        tier,
        amount,
        renewalDate,
      },
    });
  }

  public static async sendPaymentFailedEmail(
    to: string,
    errorMessage: string
  ): Promise<boolean> {
    return this.sendEmail({
      to,
      template: 'paymentFailed',
      data: {
        errorMessage,
      },
    });
  }
} 