import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
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
// SMTP Configuration
// ========================================

export interface SMTPCredentials {
  /** SMTP server host */
  host: string;
  /** SMTP server port */
  port: number;
  /** Use secure connection (TLS) */
  secure: boolean;
  /** Authentication credentials */
  auth: {
    user: string;
    pass: string;
  };
  /** Connection timeout in ms */
  connectionTimeout?: number;
  /** Socket timeout in ms */
  socketTimeout?: number;
  /** SMTP pool configuration */
  pool?: {
    /** Enable connection pooling */
    enabled: boolean;
    /** Maximum pool size */
    maxConnections?: number;
    /** Maximum messages per connection */
    maxMessages?: number;
  };
}

export interface SMTPConfiguration extends ProviderConfiguration {
  credentials: SMTPCredentials;
  settings: {
    /** Default sender email */
    defaultSender: EmailAddress;
    /** DKIM signing (optional) */
    dkim?: {
      domainName: string;
      keySelector: string;
      privateKey: string;
    };
    /** Rate limiting */
    rateLimit: {
      /** Max emails per second */
      messagesPerSecond: number;
      /** Max emails per minute */
      messagesPerMinute: number;
    };
    /** Retry configuration */
    retry: {
      /** Number of retry attempts */
      attempts: number;
      /** Delay between retries in ms */
      delay: number;
    };
    /** Batch size for bulk sending */
    batchSize: number;
    /** Enable debug logging */
    debug: boolean;
  };
}

// ========================================
// SMTP Email Provider Implementation
// ========================================

export class SMTPEmailProvider extends EmailProvider {
  private readonly config: SMTPConfiguration;
  private transporter: Transporter | null = null;
  private isInitialized = false;
  private sendCount = 0;
  private lastSendTime = 0;

  constructor(
    organizationId: string,
    config: SMTPConfiguration
  ) {
    super(organizationId, config);
    this.config = config;
  }

  getName(): string {
    return 'SMTP Email Provider';
  }

  getVersion(): string {
    return '1.0.0';
  }

  getDescription(): string {
    return 'SMTP email provider with connection pooling and rate limiting';
  }

  getPriority(): number {
    return 999; // Lowest priority - fallback option
  }

  // ========================================
  // Lifecycle Management
  // ========================================

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Create nodemailer transporter
      const transportConfig: any = {
        host: this.config.credentials.host,
        port: this.config.credentials.port,
        secure: this.config.credentials.secure,
        auth: this.config.credentials.auth,
        connectionTimeout: this.config.credentials.connectionTimeout || 60000,
        socketTimeout: this.config.credentials.socketTimeout || 60000,
        debug: this.config.settings.debug,
        logger: this.config.settings.debug
      };

      // Add pooling configuration if enabled
      if (this.config.credentials.pool?.enabled) {
        transportConfig.pool = true;
        transportConfig.maxConnections = this.config.credentials.pool.maxConnections || 5;
        transportConfig.maxMessages = this.config.credentials.pool.maxMessages || 100;
      }

      // Add DKIM configuration if provided
      if (this.config.settings.dkim) {
        transportConfig.dkim = {
          domainName: this.config.settings.dkim.domainName,
          keySelector: this.config.settings.dkim.keySelector,
          privateKey: this.config.settings.dkim.privateKey
        };
      }

      this.transporter = nodemailer.createTransporter(transportConfig);

      // Test the connection
      await this.testConnection();

      this.isInitialized = true;
      
      this.logger.info('SMTP email provider initialized', {
        organizationId: this.organizationId,
        provider: this.getName(),
        host: this.config.credentials.host,
        port: this.config.credentials.port,
        poolEnabled: this.config.credentials.pool?.enabled || false
      });
    } catch (error) {
      this.logger.error('Failed to initialize SMTP email provider', {
        organizationId: this.organizationId,
        error
      });
      throw error;
    }
  }

  async dispose(): Promise<void> {
    if (this.transporter) {
      try {
        this.transporter.close();
        this.transporter = null;
      } catch (error) {
        this.logger.error('Error disposing SMTP transporter', {
          error,
          organizationId: this.organizationId
        });
      }
    }

    this.isInitialized = false;
    
    this.logger.info('SMTP email provider disposed', {
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
      // Apply rate limiting
      await this.applyRateLimit();

      const recipients = Array.isArray(to) ? to : [to];
      const messageId = this.generateMessageId();

      // Build nodemailer message
      const message: any = {
        messageId,
        from: from.name ? `"${from.name}" <${from.email}>` : from.email,
        to: recipients.map(recipient => 
          recipient.name ? `"${recipient.name}" <${recipient.email}>` : recipient.email
        ),
        subject: options.subject,
        headers: {
          'X-Organization-ID': this.organizationId,
          'X-Message-ID': messageId,
          ...options.headers
        }
      };

      // Set content
      if (options.template) {
        // Process template (simplified implementation)
        const processedHtml = this.processTemplate(
          options.template.id, // Assuming template.id contains the HTML
          options.template.variables
        );
        message.html = this.sanitizeContent(processedHtml);
        message.text = this.htmlToPlainText(processedHtml);
      } else {
        if (options.html) {
          message.html = this.sanitizeContent(options.html);
        }
        if (options.text) {
          message.text = options.text;
        } else if (options.html) {
          message.text = this.htmlToPlainText(options.html);
        }
      }

      // Add reply-to
      if (options.replyTo) {
        message.replyTo = options.replyTo.name 
          ? `"${options.replyTo.name}" <${options.replyTo.email}>`
          : options.replyTo.email;
      }

      // Add attachments
      if (options.attachments && options.attachments.length > 0) {
        message.attachments = options.attachments.map(attachment => ({
          filename: attachment.filename,
          content: attachment.content,
          contentType: attachment.contentType,
          disposition: attachment.disposition || 'attachment',
          cid: attachment.contentId
        }));
      }

      // Set priority
      if (options.priority === 'high') {
        message.priority = 'high';
        message.headers['X-Priority'] = '1';
        message.headers['X-MSMail-Priority'] = 'High';
      } else if (options.priority === 'low') {
        message.priority = 'low';
        message.headers['X-Priority'] = '5';
        message.headers['X-MSMail-Priority'] = 'Low';
      }

      // Send email with retry logic
      let lastError: Error | null = null;
      for (let attempt = 0; attempt < this.config.settings.retry.attempts; attempt++) {
        try {
          const result = await this.transporter!.sendMail(message);
          
          this.sendCount++;
          this.lastSendTime = Date.now();
          
          this.logger.debug('SMTP email sent successfully', {
            messageId,
            recipients: recipients.length,
            attempt: attempt + 1,
            organizationId: this.organizationId
          });

          return {
            messageId,
            providerResponse: result,
            status: 'sent',
            sentAt: new Date(),
            recipient: recipients[0] // For single sends
          };
        } catch (error) {
          lastError = error instanceof Error ? error : new Error('Unknown error');
          
          if (attempt < this.config.settings.retry.attempts - 1) {
            await new Promise(resolve => 
              setTimeout(resolve, this.config.settings.retry.delay * (attempt + 1))
            );
          }
        }
      }

      throw lastError;
    } catch (error) {
      this.logger.error('SMTP email send failed', {
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
          // Process each recipient in the batch individually
          for (const recipient of batch) {
            const emailOptions: EmailOptions = {
              subject: options.subject,
              html: options.html,
              text: options.text,
              template: options.template ? {
                id: options.template.id,
                variables: {
                  ...options.globalTemplateData,
                  ...recipient.templateData
                },
                language: options.template.language
              } : undefined,
              attachments: options.attachments,
              replyTo: options.replyTo,
              headers: options.headers,
              priority: options.priority,
              tags: options.tags,
              tracking: options.tracking
            };

            const result = await this.sendEmail(recipient.to, from, emailOptions);
            results.push(result);
          }

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

          // Add failed results for remaining recipients in this batch
          for (const recipient of batch) {
            if (!results.find(r => r.recipient.email === recipient.to.email)) {
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
      subject: '', // Will be processed from template
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

      // Simple domain and role-based checks
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
    // SMTP doesn't provide built-in statistics
    // In a real implementation, you would track these in a database
    return {
      totalSent: this.sendCount,
      totalDelivered: 0, // Unknown for SMTP
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
    // SMTP doesn't have built-in template management
    // Templates would be stored in your own system
    this.logger.info('Template created (local storage)', {
      templateId: template.id,
      templateName: template.name,
      organizationId: this.organizationId
    });

    return true;
  }

  async deleteTemplate(templateId: string): Promise<boolean> {
    // SMTP doesn't have built-in template management
    this.logger.info('Template deleted (local storage)', {
      templateId,
      organizationId: this.organizationId
    });

    return true;
  }

  async listTemplates(): Promise<Array<{
    id: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
  }>> {
    // SMTP doesn't have built-in template management
    return [];
  }

  async addSuppression(): Promise<boolean> {
    // SMTP doesn't have built-in suppression management
    return true;
  }

  async removeSuppression(): Promise<boolean> {
    // SMTP doesn't have built-in suppression management
    return true;
  }

  async isSuppressed(): Promise<boolean> {
    // SMTP doesn't have built-in suppression management
    return false;
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
      await this.transporter!.verify();
      this.logger.debug('SMTP connection test passed', {
        organizationId: this.organizationId
      });
    } catch (error) {
      throw new Error(`SMTP connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async applyRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastSend = now - this.lastSendTime;
    const minInterval = 1000 / this.config.settings.rateLimit.messagesPerSecond;
    
    if (timeSinceLastSend < minInterval) {
      const delay = minInterval - timeSinceLastSend;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
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
      errors: 0, // Would need to track this separately
      responseTime: 0, // Would need to track this separately
      uptime: Date.now(), // Placeholder
      memoryUsage: 0, // Not applicable for SMTP
      customMetrics: {
        emailsSent: stats.totalSent,
        lastSendTime: this.lastSendTime
      }
    };
  }
}

// ========================================
// SMTP Email Provider Factory
// ========================================

export class SMTPEmailProviderFactory implements ProviderFactory<SMTPEmailProvider> {
  create(organizationId: string, config: SMTPConfiguration): SMTPEmailProvider {
    return new SMTPEmailProvider(organizationId, config);
  }

  validateConfig(config: any): config is SMTPConfiguration {
    return (
      config &&
      typeof config === 'object' &&
      config.credentials &&
      typeof config.credentials.host === 'string' &&
      typeof config.credentials.port === 'number' &&
      config.credentials.auth &&
      typeof config.credentials.auth.user === 'string' &&
      typeof config.credentials.auth.pass === 'string' &&
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
          required: ['host', 'port', 'auth'],
          properties: {
            host: { type: 'string', description: 'SMTP server host' },
            port: { type: 'number', description: 'SMTP server port' },
            secure: { type: 'boolean', description: 'Use secure connection (TLS)' },
            auth: {
              type: 'object',
              required: ['user', 'pass'],
              properties: {
                user: { type: 'string', description: 'SMTP username' },
                pass: { type: 'string', description: 'SMTP password' }
              }
            }
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
            batchSize: { type: 'number', description: 'Batch size for bulk sends' }
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
 * Create SMTP email configuration from environment variables
 */
export function createSMTPEmailConfig(organizationId?: string): SMTPConfiguration {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587;
  const secure = process.env.SMTP_SECURE === 'true';
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const defaultSenderEmail = process.env.SMTP_FROM_EMAIL;
  const defaultSenderName = process.env.SMTP_FROM_NAME;
  
  if (!host || !user || !pass || !defaultSenderEmail) {
    throw new Error('SMTP configuration environment variables are required');
  }

  return {
    id: `smtp-email-${organizationId || 'default'}`,
    name: 'SMTP Email',
    type: 'email',
    priority: 999, // Lowest priority
    enabled: true,
    credentials: {
      host,
      port,
      secure,
      auth: { user, pass },
      connectionTimeout: 60000,
      socketTimeout: 60000,
      pool: {
        enabled: true,
        maxConnections: 5,
        maxMessages: 100
      }
    },
    settings: {
      defaultSender: {
        email: defaultSenderEmail,
        name: defaultSenderName || 'System'
      },
      rateLimit: {
        messagesPerSecond: 10,
        messagesPerMinute: 600
      },
      retry: {
        attempts: 3,
        delay: 1000
      },
      batchSize: 50,
      debug: process.env.NODE_ENV !== 'production'
    }
  };
} 