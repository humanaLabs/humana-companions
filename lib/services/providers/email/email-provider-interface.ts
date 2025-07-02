import { BaseProvider, type ProviderConfiguration, type HealthCheckResult, type ProviderMetrics } from '../base/base-provider';

// ========================================
// Core Email Types
// ========================================

/**
 * Email address with optional name
 */
export interface EmailAddress {
  /** Email address */
  email: string;
  /** Display name (optional) */
  name?: string;
}

/**
 * Email attachment
 */
export interface EmailAttachment {
  /** Attachment filename */
  filename: string;
  /** File content (base64 encoded or buffer) */
  content: string | Buffer;
  /** Content type (MIME type) */
  contentType?: string;
  /** Content disposition */
  disposition?: 'attachment' | 'inline';
  /** Content ID for inline attachments */
  contentId?: string;
  /** File size in bytes */
  size?: number;
}

/**
 * Email template data
 */
export interface EmailTemplate {
  /** Template ID or name */
  id: string;
  /** Template variables */
  variables: Record<string, any>;
  /** Template language/locale */
  language?: string;
}

/**
 * Email options
 */
export interface EmailOptions {
  /** Email subject */
  subject: string;
  /** HTML content */
  html?: string;
  /** Plain text content */
  text?: string;
  /** Template to use instead of html/text */
  template?: EmailTemplate;
  /** Email attachments */
  attachments?: EmailAttachment[];
  /** Reply-to address */
  replyTo?: EmailAddress;
  /** Custom headers */
  headers?: Record<string, string>;
  /** Email priority */
  priority?: 'high' | 'normal' | 'low';
  /** Delivery time (for scheduled emails) */
  sendAt?: Date;
  /** Email tags for categorization */
  tags?: string[];
  /** Tracking options */
  tracking?: {
    opens?: boolean;
    clicks?: boolean;
    unsubscribes?: boolean;
  };
}

/**
 * Bulk email options
 */
export interface BulkEmailOptions extends Omit<EmailOptions, 'template'> {
  /** Global template data */
  globalTemplateData?: Record<string, any>;
  /** Batch size for sending */
  batchSize?: number;
  /** Delay between batches in ms */
  batchDelay?: number;
}

/**
 * Email send result
 */
export interface EmailSendResult {
  /** Message ID from provider */
  messageId: string;
  /** Provider-specific response */
  providerResponse?: any;
  /** Send status */
  status: 'sent' | 'queued' | 'failed';
  /** Error message if failed */
  error?: string;
  /** Delivery timestamp */
  sentAt: Date;
  /** Recipient that received the email */
  recipient: EmailAddress;
}

/**
 * Bulk email send result
 */
export interface BulkEmailSendResult {
  /** Overall success status */
  success: boolean;
  /** Individual send results */
  results: EmailSendResult[];
  /** Total emails attempted */
  total: number;
  /** Number of successful sends */
  sent: number;
  /** Number of failed sends */
  failed: number;
  /** Processing time in ms */
  processingTime: number;
}

/**
 * Email statistics
 */
export interface EmailStats {
  /** Total emails sent */
  totalSent: number;
  /** Total emails delivered */
  totalDelivered: number;
  /** Total bounces */
  totalBounces: number;
  /** Total opens */
  totalOpens: number;
  /** Total clicks */
  totalClicks: number;
  /** Total unsubscribes */
  totalUnsubscribes: number;
  /** Delivery rate percentage */
  deliveryRate: number;
  /** Open rate percentage */
  openRate: number;
  /** Click rate percentage */
  clickRate: number;
  /** Time period for stats */
  period: {
    start: Date;
    end: Date;
  };
}

/**
 * Email validation result
 */
export interface EmailValidationResult {
  /** Email address */
  email: string;
  /** Is valid email format */
  isValid: boolean;
  /** Is disposable email */
  isDisposable?: boolean;
  /** Is role-based email */
  isRoleBased?: boolean;
  /** Domain exists */
  domainExists?: boolean;
  /** MX record exists */
  mxExists?: boolean;
  /** Risk score (0-100) */
  riskScore?: number;
  /** Validation details */
  details?: string;
}

// ========================================
// Email Provider Interface
// ========================================

/**
 * Abstract base class for all email providers
 * Provides email sending capabilities with multi-tenant isolation
 */
export abstract class EmailProvider extends BaseProvider {
  constructor(
    organizationId: string,
    config: ProviderConfiguration
  ) {
    super(organizationId, config, 'email');
  }

  // ========================================
  // Abstract Methods (Provider Implementation)
  // ========================================

  /**
   * Send single email
   */
  abstract sendEmail(
    to: EmailAddress | EmailAddress[],
    from: EmailAddress,
    options: EmailOptions
  ): Promise<EmailSendResult>;

  /**
   * Send bulk emails
   */
  abstract sendBulkEmails(
    recipients: Array<{
      to: EmailAddress;
      templateData?: Record<string, any>;
    }>,
    from: EmailAddress,
    options: BulkEmailOptions
  ): Promise<BulkEmailSendResult>;

  /**
   * Send transactional email using template
   */
  abstract sendTransactionalEmail(
    to: EmailAddress,
    from: EmailAddress,
    template: EmailTemplate,
    options?: Omit<EmailOptions, 'template' | 'html' | 'text'>
  ): Promise<EmailSendResult>;

  /**
   * Validate email address
   */
  abstract validateEmail(email: string): Promise<EmailValidationResult>;

  /**
   * Validate multiple email addresses
   */
  abstract validateEmails(emails: string[]): Promise<EmailValidationResult[]>;

  /**
   * Get email sending statistics
   */
  abstract getStats(
    startDate?: Date,
    endDate?: Date
  ): Promise<EmailStats>;

  /**
   * Create or update email template
   */
  abstract createTemplate(
    template: {
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
    }
  ): Promise<boolean>;

  /**
   * Delete email template
   */
  abstract deleteTemplate(templateId: string): Promise<boolean>;

  /**
   * List available templates
   */
  abstract listTemplates(): Promise<Array<{
    id: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
  }>>;

  /**
   * Add email to suppression list
   */
  abstract addSuppression(
    email: string,
    type: 'bounce' | 'spam' | 'unsubscribe' | 'invalid'
  ): Promise<boolean>;

  /**
   * Remove email from suppression list
   */
  abstract removeSuppression(email: string): Promise<boolean>;

  /**
   * Check if email is suppressed
   */
  abstract isSuppressed(email: string): Promise<boolean>;

  // ========================================
  // Utility Methods
  // ========================================

  /**
   * Validate email format
   */
  protected validateEmailFormat(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Sanitize email content
   */
  protected sanitizeContent(content: string): string {
    // Basic HTML sanitization for email
    return content
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/on\w+="[^"]*"/gi, '')
      .replace(/javascript:/gi, '');
  }

  /**
   * Convert HTML to plain text
   */
  protected htmlToPlainText(html: string): string {
    return html
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#x27;/g, "'")
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Process template variables
   */
  protected processTemplate(
    content: string,
    variables: Record<string, any>
  ): string {
    let processed = content;
    
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      processed = processed.replace(regex, String(value || ''));
    }
    
    return processed;
  }

  /**
   * Generate organization-scoped message ID
   */
  protected generateMessageId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2);
    return `${timestamp}-${random}-${this.organizationId}`;
  }

  /**
   * Chunk recipients for bulk sending
   */
  protected chunkRecipients<T>(
    recipients: T[],
    chunkSize: number
  ): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < recipients.length; i += chunkSize) {
      chunks.push(recipients.slice(i, i + chunkSize));
    }
    return chunks;
  }

  /**
   * Calculate processing delay between batches
   */
  protected calculateBatchDelay(
    batchSize: number,
    totalRecipients: number,
    maxDelayMs = 5000
  ): number {
    // Gradually increase delay for larger batches to avoid rate limits
    const factor = Math.min(totalRecipients / 1000, 1);
    return Math.min(factor * maxDelayMs, maxDelayMs);
  }

  /**
   * Health check implementation for email providers
   */
  async healthCheck(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      // Test email validation
      const testEmail = 'test@example.com';
      const validationResult = await this.validateEmail(testEmail);
      
      if (!validationResult.isValid) {
        throw new Error('Email validation test failed');
      }

      // Test stats retrieval
      const stats = await this.getStats();
      
      if (typeof stats.totalSent !== 'number') {
        throw new Error('Stats retrieval test failed');
      }

      const responseTime = Date.now() - startTime;
      
      return {
        status: 'healthy',
        timestamp: new Date(),
        responseTime,
        metadata: {
          provider: this.getName(),
          organization: this.organizationId,
          operations: ['validate', 'stats'],
          emailsSent: stats.totalSent
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        timestamp: new Date(),
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          provider: this.getName(),
          organization: this.organizationId,
          operation: 'health-check'
        }
      };
    }
  }
}

// ========================================
// Email Provider Registry
// ========================================

/**
 * Registry for managing email providers by organization
 */
export class EmailProviderRegistry {
  private static instance: EmailProviderRegistry;
  private providers = new Map<string, EmailProvider>();

  static getInstance(): EmailProviderRegistry {
    if (!EmailProviderRegistry.instance) {
      EmailProviderRegistry.instance = new EmailProviderRegistry();
    }
    return EmailProviderRegistry.instance;
  }

  registerProvider(organizationId: string, provider: EmailProvider): void {
    const key = `${organizationId}:email`;
    this.providers.set(key, provider);
  }

  getProvider(organizationId: string): EmailProvider | undefined {
    const key = `${organizationId}:email`;
    return this.providers.get(key);
  }

  removeProvider(organizationId: string): void {
    const key = `${organizationId}:email`;
    this.providers.delete(key);
  }

  getRegisteredOrganizations(): string[] {
    const organizationIds = new Set<string>();
    for (const key of this.providers.keys()) {
      const [orgId] = key.split(':');
      organizationIds.add(orgId);
    }
    return Array.from(organizationIds);
  }

  clear(): void {
    this.providers.clear();
  }
} 