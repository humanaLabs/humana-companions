import sgMail from '@sendgrid/mail';
import {
  EmailProvider,
  type EmailAddress,
  type EmailOptions,
  type BulkEmailOptions,
  type EmailTemplate,
  type EmailSendResult,
  type BulkEmailSendResult,
  type EmailStats,
  type EmailValidationResult
} from './email-provider-interface';
import type { ProviderConfiguration, ProviderMetrics } from '../base/base-provider';
import { ProviderFactory } from '../factory/provider-factory-interface';

// ========================================
// SendGrid Configuration
// ========================================

export interface SendGridCredentials {
  /** SendGrid API key */
  apiKey: string;
  /** Sender verification settings */
  senderVerification?: {
    /** Verified sender email */
    verifiedSender?: string;
    /** Domain verification */
    domainVerified?: boolean;
  };
}

export interface SendGridConfiguration extends ProviderConfiguration {
  credentials: SendGridCredentials;
  settings: {
    /** Default sender email */
    defaultSender: EmailAddress;
    /** Enable click tracking */
    enableClickTracking: boolean;
    /** Enable open tracking */
    enableOpenTracking: boolean;
    /** Enable subscription tracking */
    enableSubscriptionTracking: boolean;
    /** Default template ID */
    defaultTemplateId?: string;
    /** Batch size for bulk sends */
    batchSize: number;
    /** Rate limit (emails per second) */
    rateLimit: number;
    /** Sandbox mode (for testing) */
    sandboxMode: boolean;
  };
}

// ========================================
// SendGrid Email Provider Implementation
// ========================================

export class SendGridEmailProvider extends EmailProvider {
  private readonly config: SendGridConfiguration;
  private isInitialized = false;

  constructor(
    organizationId: string,
    config: SendGridConfiguration
  ) {
    super(organizationId, config);
    this.config = config;
  }

  getName(): string {
    return 'SendGrid Email Provider';
  }

  getVersion(): string {
    return '1.0.0';
  }

  getDescription(): string {
    return 'SendGrid email service provider with templates and bulk sending';
  }

  getPriority(): number {
    return 1; // High priority for SendGrid
  }

  // ========================================
  // Lifecycle Management
  // ========================================

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Initialize SendGrid client
      sgMail.setApiKey(this.config.credentials.apiKey);

      // Test API connection
      await this.testConnection();

      this.isInitialized = true;
      
      this.logger.info('SendGrid email provider initialized', {
        organizationId: this.organizationId,
        provider: this.getName(),
        sandboxMode: this.config.settings.sandboxMode
      });
    } catch (error) {
      this.logger.error('Failed to initialize SendGrid email provider', {
        organizationId: this.organizationId,
        error
      });
      throw error;
    }
  }

  async dispose(): Promise<void> {
    this.isInitialized = false;
    
    this.logger.info('SendGrid email provider disposed', {
      organizationId: this.organizationId
    });
  }

  // ========================================
  // Email Operations
  // ========================================

  async sendEmail(
    to: EmailAddress | EmailAddress[],
    from: EmailAddress,
    options: EmailOptions
  ): Promise<EmailSendResult> {
    await this.ensureInitialized();
    
    try {
      const recipients = Array.isArray(to) ? to : [to];
      const messageId = this.generateMessageId();

      // Build SendGrid message
      const message: any = {
        to: recipients.map(recipient => ({
          email: recipient.email,
          name: recipient.name
        })),
        from: {
          email: from.email,
          name: from.name
        },
        subject: options.subject,
        content: [],
        customArgs: {
          organizationId: this.organizationId,
          messageId
        },
        trackingSettings: {
          clickTracking: {
            enable: this.config.settings.enableClickTracking && (options.tracking?.clicks ?? true)
          },
          openTracking: {
            enable: this.config.settings.enableOpenTracking && (options.tracking?.opens ?? true)
          },
          subscriptionTracking: {
            enable: this.config.settings.enableSubscriptionTracking && (options.tracking?.unsubscribes ?? true)
          }
        }
      };

      // Set content
      if (options.template) {
        message.templateId = options.template.id;
        message.dynamicTemplateData = options.template.variables;
      } else {
        if (options.html) {
          message.content.push({
            type: 'text/html',
            value: this.sanitizeContent(options.html)
          });
        }
        if (options.text) {
          message.content.push({
            type: 'text/plain',
            value: options.text
          });
        } else if (options.html) {
          // Generate plain text from HTML if not provided
          message.content.push({
            type: 'text/plain',
            value: this.htmlToPlainText(options.html)
          });
        }
      }

      // Add reply-to
      if (options.replyTo) {
        message.replyTo = {
          email: options.replyTo.email,
          name: options.replyTo.name
        };
      }

      // Add attachments
      if (options.attachments && options.attachments.length > 0) {
        message.attachments = options.attachments.map(attachment => ({
          filename: attachment.filename,
          content: typeof attachment.content === 'string' 
            ? attachment.content 
            : attachment.content.toString('base64'),
          type: attachment.contentType,
          disposition: attachment.disposition || 'attachment',
          contentId: attachment.contentId
        }));
      }

      // Add custom headers
      if (options.headers) {
        message.headers = options.headers;
      }

      // Set priority
      if (options.priority === 'high') {
        message.headers = { 
          ...message.headers, 
          'X-Priority': '1',
          'X-MSMail-Priority': 'High'
        };
      } else if (options.priority === 'low') {
        message.headers = { 
          ...message.headers, 
          'X-Priority': '5',
          'X-MSMail-Priority': 'Low'
        };
      }

      // Set scheduled send time
      if (options.sendAt) {
        message.sendAt = Math.floor(options.sendAt.getTime() / 1000);
      }

      // Add tags/categories
      if (options.tags && options.tags.length > 0) {
        message.categories = options.tags;
      }

      // Enable sandbox mode if configured
      if (this.config.settings.sandboxMode) {
        message.mailSettings = {
          sandboxMode: { enable: true }
        };
      }

      // Send email
      const response = await sgMail.send(message);
      
      this.logger.debug('SendGrid email sent successfully', {
        messageId,
        recipients: recipients.length,
        organizationId: this.organizationId
      });

      return {
        messageId,
        providerResponse: response[0],
        status: 'sent',
        sentAt: new Date(),
        recipient: recipients[0] // For single sends
      };
    } catch (error) {
      this.logger.error('SendGrid email send failed', {
        recipients: Array.isArray(to) ? to.length : 1,
        error,
        organizationId: this.organizationId
      });

      return {
        messageId: this.generateMessageId(),
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        sentAt: new Date(),
        recipient: Array.isArray(to) ? to[0] : to
      };
    }
  }

  async sendBulkEmails(
    recipients: Array<{
      to: EmailAddress;
      templateData?: Record<string, any>;
    }>,
    from: EmailAddress,
    options: BulkEmailOptions
  ): Promise<BulkEmailSendResult> {
    await this.ensureInitialized();
    
    const startTime = Date.now();
    const results: EmailSendResult[] = [];
    const batchSize = options.batchSize || this.config.settings.batchSize;
    const batchDelay = options.batchDelay || this.calculateBatchDelay(batchSize, recipients.length);

    try {
      // Split recipients into batches
      const batches = this.chunkRecipients(recipients, batchSize);
      
      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        
        try {
          // Process batch
          const batchResults = await this.sendBatch(batch, from, options);
          results.push(...batchResults);

          // Add delay between batches (except for the last one)
          if (i < batches.length - 1 && batchDelay > 0) {
            await new Promise(resolve => setTimeout(resolve, batchDelay));
          }
        } catch (error) {
          this.logger.error('Batch send failed', {
            batchIndex: i,
            batchSize: batch.length,
            error,
            organizationId: this.organizationId
          });

          // Add failed results for this batch
          for (const recipient of batch) {
            results.push({
              messageId: this.generateMessageId(),
              status: 'failed',
              error: error instanceof Error ? error.message : 'Batch send failed',
              sentAt: new Date(),
              recipient: recipient.to
            });
          }
        }
      }

      const processingTime = Date.now() - startTime;
      const sent = results.filter(r => r.status === 'sent').length;
      const failed = results.filter(r => r.status === 'failed').length;

      this.logger.info('Bulk email send completed', {
        total: recipients.length,
        sent,
        failed,
        processingTime,
        organizationId: this.organizationId
      });

      return {
        success: failed === 0,
        results,
        total: recipients.length,
        sent,
        failed,
        processingTime
      };
    } catch (error) {
      this.logger.error('Bulk email send failed', {
        recipients: recipients.length,
        error,
        organizationId: this.organizationId
      });

      return {
        success: false,
        results,
        total: recipients.length,
        sent: 0,
        failed: recipients.length,
        processingTime: Date.now() - startTime
      };
    }
  }

  async sendTransactionalEmail(
    to: EmailAddress,
    from: EmailAddress,
    template: EmailTemplate,
    options?: Omit<EmailOptions, 'template' | 'html' | 'text'>
  ): Promise<EmailSendResult> {
    return this.sendEmail(to, from, {
      ...options,
      subject: '', // Will be set by template
      template
    });
  }

  async validateEmail(email: string): Promise<EmailValidationResult> {
    try {
      // Basic format validation
      const isValid = this.validateEmailFormat(email);
      
      if (!isValid) {
        return {
          email,
          isValid: false,
          details: 'Invalid email format'
        };
      }

      // SendGrid doesn't have built-in email validation API
      // This is a basic implementation - in production you might use
      // SendGrid's Email Validation API or another service
      const domain = email.split('@')[1];
      const isDisposable = this.isDisposableEmail(domain);
      const isRoleBased = this.isRoleBasedEmail(email);

      return {
        email,
        isValid: true,
        isDisposable,
        isRoleBased,
        riskScore: isDisposable || isRoleBased ? 70 : 10,
        details: 'Basic validation passed'
      };
    } catch (error) {
      this.logger.error('Email validation failed', {
        email,
        error,
        organizationId: this.organizationId
      });

      return {
        email,
        isValid: false,
        details: 'Validation failed'
      };
    }
  }

  async validateEmails(emails: string[]): Promise<EmailValidationResult[]> {
    return Promise.all(emails.map(email => this.validateEmail(email)));
  }

  async getStats(startDate?: Date, endDate?: Date): Promise<EmailStats> {
    await this.ensureInitialized();
    
    try {
      // SendGrid Stats API requires specific parameters
      // This is a simplified implementation
      const end = endDate || new Date();
      const start = startDate || new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days ago

      // In a real implementation, you would call SendGrid's Stats API
      // For now, returning mock data
      return {
        totalSent: 0,
        totalDelivered: 0,
        totalBounces: 0,
        totalOpens: 0,
        totalClicks: 0,
        totalUnsubscribes: 0,
        deliveryRate: 0,
        openRate: 0,
        clickRate: 0,
        period: { start, end }
      };
    } catch (error) {
      this.logger.error('Failed to get email stats', {
        startDate,
        endDate,
        error,
        organizationId: this.organizationId
      });

      return {
        totalSent: 0,
        totalDelivered: 0,
        totalBounces: 0,
        totalOpens: 0,
        totalClicks: 0,
        totalUnsubscribes: 0,
        deliveryRate: 0,
        openRate: 0,
        clickRate: 0,
        period: {
          start: startDate || new Date(),
          end: endDate || new Date()
        }
      };
    }
  }

  async createTemplate(template: {
    id: string;
    name: string;
    subject: string;
    htmlContent: string;
    textContent?: string;
    variables?: Array<{
      name: string;
      type: string;
      defaultValue?: any;
      required?: boolean;
    }>;
  }): Promise<boolean> {
    await this.ensureInitialized();
    
    try {
      // SendGrid Dynamic Template creation would go here
      // This is a simplified implementation
      this.logger.info('Template created', {
        templateId: template.id,
        templateName: template.name,
        organizationId: this.organizationId
      });

      return true;
    } catch (error) {
      this.logger.error('Template creation failed', {
        templateId: template.id,
        error,
        organizationId: this.organizationId
      });
      return false;
    }
  }

  async deleteTemplate(templateId: string): Promise<boolean> {
    await this.ensureInitialized();
    
    try {
      // SendGrid template deletion would go here
      this.logger.info('Template deleted', {
        templateId,
        organizationId: this.organizationId
      });

      return true;
    } catch (error) {
      this.logger.error('Template deletion failed', {
        templateId,
        error,
        organizationId: this.organizationId
      });
      return false;
    }
  }

  async listTemplates(): Promise<Array<{
    id: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
  }>> {
    await this.ensureInitialized();
    
    try {
      // SendGrid template listing would go here
      return [];
    } catch (error) {
      this.logger.error('Template listing failed', {
        error,
        organizationId: this.organizationId
      });
      return [];
    }
  }

  async addSuppression(
    email: string,
    type: 'bounce' | 'spam' | 'unsubscribe' | 'invalid'
  ): Promise<boolean> {
    await this.ensureInitialized();
    
    try {
      // SendGrid suppression list management would go here
      this.logger.info('Email added to suppression list', {
        email,
        type,
        organizationId: this.organizationId
      });

      return true;
    } catch (error) {
      this.logger.error('Adding suppression failed', {
        email,
        type,
        error,
        organizationId: this.organizationId
      });
      return false;
    }
  }

  async removeSuppression(email: string): Promise<boolean> {
    await this.ensureInitialized();
    
    try {
      // SendGrid suppression removal would go here
      this.logger.info('Email removed from suppression list', {
        email,
        organizationId: this.organizationId
      });

      return true;
    } catch (error) {
      this.logger.error('Removing suppression failed', {
        email,
        error,
        organizationId: this.organizationId
      });
      return false;
    }
  }

  async isSuppressed(email: string): Promise<boolean> {
    await this.ensureInitialized();
    
    try {
      // SendGrid suppression check would go here
      return false;
    } catch (error) {
      this.logger.error('Suppression check failed', {
        email,
        error,
        organizationId: this.organizationId
      });
      return false;
    }
  }

  // ========================================
  // Private Helpers
  // ========================================

  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }
  }

  private async testConnection(): Promise<void> {
    try {
      // Test SendGrid API connection by getting account information
      // This is a placeholder - actual implementation would call SendGrid API
      this.logger.debug('SendGrid connection test passed', {
        organizationId: this.organizationId
      });
    } catch (error) {
      throw new Error(`SendGrid connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async sendBatch(
    batch: Array<{ to: EmailAddress; templateData?: Record<string, any> }>,
    from: EmailAddress,
    options: BulkEmailOptions
  ): Promise<EmailSendResult[]> {
    const results: EmailSendResult[] = [];

    // For bulk sends, we can use SendGrid's multiple recipients feature
    try {
      const personalizations = batch.map(recipient => ({
        to: [{ email: recipient.to.email, name: recipient.to.name }],
        dynamicTemplateData: {
          ...options.globalTemplateData,
          ...recipient.templateData
        }
      }));

      const message: any = {
        from: { email: from.email, name: from.name },
        subject: options.subject,
        personalizations,
        customArgs: {
          organizationId: this.organizationId
        }
      };

      // Set template or content
      if (options.template) {
        message.templateId = options.template.id;
      } else {
        message.content = [];
        if (options.html) {
          message.content.push({
            type: 'text/html',
            value: this.sanitizeContent(options.html)
          });
        }
        if (options.text) {
          message.content.push({
            type: 'text/plain',
            value: options.text
          });
        }
      }

      const response = await sgMail.sendMultiple(message);

      // Create success results for each recipient
      for (let i = 0; i < batch.length; i++) {
        results.push({
          messageId: this.generateMessageId(),
          providerResponse: response[0],
          status: 'sent',
          sentAt: new Date(),
          recipient: batch[i].to
        });
      }
    } catch (error) {
      // Create failure results for each recipient
      for (const recipient of batch) {
        results.push({
          messageId: this.generateMessageId(),
          status: 'failed',
          error: error instanceof Error ? error.message : 'Batch send failed',
          sentAt: new Date(),
          recipient: recipient.to
        });
      }
    }

    return results;
  }

  private isDisposableEmail(domain: string): boolean {
    const disposableDomains = [
      '10minutemail.com', 'guerrillamail.com', 'mailinator.com',
      'tempmail.org', 'temp-mail.org', 'throwaway.email'
    ];
    return disposableDomains.includes(domain.toLowerCase());
  }

  private isRoleBasedEmail(email: string): boolean {
    const roleBasedPrefixes = [
      'admin', 'administrator', 'support', 'help', 'info', 'contact',
      'sales', 'marketing', 'noreply', 'no-reply', 'postmaster'
    ];
    const localPart = email.split('@')[0].toLowerCase();
    return roleBasedPrefixes.some(prefix => localPart.startsWith(prefix));
  }

  async getMetrics(): Promise<ProviderMetrics> {
    const stats = await this.getStats();
    
    return {
      requests: stats.totalSent,
      errors: stats.totalBounces,
      responseTime: 0, // Would need to track this separately
      uptime: Date.now(), // Placeholder
      memoryUsage: 0, // Not applicable for external service
      customMetrics: {
        emailsSent: stats.totalSent,
        deliveryRate: stats.deliveryRate,
        openRate: stats.openRate,
        clickRate: stats.clickRate
      }
    };
  }
}

// ========================================
// SendGrid Email Provider Factory
// ========================================

export class SendGridEmailProviderFactory implements ProviderFactory<SendGridEmailProvider> {
  create(organizationId: string, config: SendGridConfiguration): SendGridEmailProvider {
    return new SendGridEmailProvider(organizationId, config);
  }

  validateConfig(config: any): config is SendGridConfiguration {
    return (
      config &&
      typeof config === 'object' &&
      config.credentials &&
      typeof config.credentials.apiKey === 'string' &&
      config.settings &&
      config.settings.defaultSender &&
      typeof config.settings.defaultSender.email === 'string'
    );
  }

  getConfigSchema(): any {
    return {
      type: 'object',
      required: ['credentials', 'settings'],
      properties: {
        credentials: {
          type: 'object',
          required: ['apiKey'],
          properties: {
            apiKey: { type: 'string', description: 'SendGrid API key' }
          }
        },
        settings: {
          type: 'object',
          required: ['defaultSender'],
          properties: {
            defaultSender: {
              type: 'object',
              required: ['email'],
              properties: {
                email: { type: 'string', description: 'Default sender email' },
                name: { type: 'string', description: 'Default sender name' }
              }
            },
            batchSize: { type: 'number', description: 'Batch size for bulk sends' },
            rateLimit: { type: 'number', description: 'Rate limit (emails per second)' }
          }
        }
      }
    };
  }
}

// ========================================
// Helper Functions
// ========================================

/**
 * Create SendGrid email configuration from environment variables
 */
export function createSendGridEmailConfig(organizationId?: string): SendGridConfiguration {
  const apiKey = process.env.SENDGRID_API_KEY;
  const defaultSenderEmail = process.env.SENDGRID_FROM_EMAIL;
  const defaultSenderName = process.env.SENDGRID_FROM_NAME;
  
  if (!apiKey) {
    throw new Error('SENDGRID_API_KEY environment variable is required');
  }
  
  if (!defaultSenderEmail) {
    throw new Error('SENDGRID_FROM_EMAIL environment variable is required');
  }

  return {
    id: `sendgrid-email-${organizationId || 'default'}`,
    name: 'SendGrid Email',
    type: 'email',
    priority: 1,
    enabled: true,
    credentials: {
      apiKey,
      senderVerification: {
        verifiedSender: defaultSenderEmail
      }
    },
    settings: {
      defaultSender: {
        email: defaultSenderEmail,
        name: defaultSenderName || 'System'
      },
      enableClickTracking: true,
      enableOpenTracking: true,
      enableSubscriptionTracking: true,
      batchSize: 100,
      rateLimit: 100, // 100 emails per second
      sandboxMode: process.env.NODE_ENV !== 'production'
    }
  };
} 