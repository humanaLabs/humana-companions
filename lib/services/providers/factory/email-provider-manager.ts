import {
  EmailProvider,
  EmailProviderRegistry,
  type EmailAddress,
  type EmailOptions,
  type BulkEmailOptions,
  type EmailTemplate,
  type EmailSendResult,
  type BulkEmailSendResult,
  type EmailStats,
  type EmailValidationResult
} from '../email/email-provider-interface';
import { SendGridEmailProvider, SendGridEmailProviderFactory, createSendGridEmailConfig } from '../email/sendgrid-email-provider';
import { SMTPEmailProvider, SMTPEmailProviderFactory, createSMTPEmailConfig } from '../email/smtp-email-provider';
import type { ProviderConfiguration, HealthCheckResult } from '../base/base-provider';

// ========================================
// Email Provider Manager
// ========================================

/**
 * Manages email providers with automatic fallback and health monitoring
 */
export class EmailProviderManager {
  private static instance: EmailProviderManager;
  private registry = EmailProviderRegistry.getInstance();
  private healthCheckInterval: NodeJS.Timer | null = null;
  private readonly logger = console; // Replace with proper logger

  static getInstance(): EmailProviderManager {
    if (!EmailProviderManager.instance) {
      EmailProviderManager.instance = new EmailProviderManager();
    }
    return EmailProviderManager.instance;
  }

  // ========================================
  // Provider Management
  // ========================================

  /**
   * Create and register an email provider for an organization
   */
  async createProvider(
    organizationId: string,
    config: ProviderConfiguration
  ): Promise<EmailProvider> {
    try {
      let provider: EmailProvider;

      switch (config.type) {
        case 'sendgrid-email':
          const sendgridFactory = new SendGridEmailProviderFactory();
          provider = sendgridFactory.create(organizationId, config as any);
          break;
        case 'smtp-email':
          const smtpFactory = new SMTPEmailProviderFactory();
          provider = smtpFactory.create(organizationId, config as any);
          break;
        default:
          throw new Error(`Unsupported email provider type: ${config.type}`);
      }

      await provider.initialize();
      this.registry.registerProvider(organizationId, provider);

      this.logger.info('Email provider created and registered', {
        organizationId,
        provider: provider.getName(),
        type: config.type
      });

      return provider;
    } catch (error) {
      this.logger.error('Failed to create email provider', {
        organizationId,
        config: config.type,
        error
      });
      throw error;
    }
  }

  /**
   * Create providers from environment variables
   */
  async createProvidersFromEnvironment(): Promise<Map<string, EmailProvider[]>> {
    const providers = new Map<string, EmailProvider[]>();
    const organizationIds = ['default']; // Add logic to get organization IDs

    for (const organizationId of organizationIds) {
      const orgProviders: EmailProvider[] = [];

      try {
        // Try SendGrid first
        if (process.env.SENDGRID_API_KEY && process.env.SENDGRID_FROM_EMAIL) {
          const sendgridConfig = createSendGridEmailConfig(organizationId);
          const sendgridProvider = await this.createProvider(organizationId, sendgridConfig);
          orgProviders.push(sendgridProvider);
        }
      } catch (error) {
        this.logger.warn('SendGrid email provider failed, will use SMTP fallback', {
          organizationId,
          error
        });
      }

      try {
        // Always create SMTP as fallback if configured
        if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
          const smtpConfig = createSMTPEmailConfig(organizationId);
          const smtpProvider = await this.createProvider(organizationId, smtpConfig);
          orgProviders.push(smtpProvider);
        }
      } catch (error) {
        this.logger.error('SMTP email provider failed', {
          organizationId,
          error
        });
      }

      if (orgProviders.length > 0) {
        providers.set(organizationId, orgProviders);
      }
    }

    // Start health monitoring
    this.startHealthMonitoring();

    return providers;
  }

  /**
   * Get or create an email provider for an organization
   */
  async getOrCreateProvider(organizationId: string): Promise<EmailProvider> {
    let provider = this.registry.getProvider(organizationId);
    
    if (!provider) {
      // Try to create SendGrid provider first
      try {
        if (process.env.SENDGRID_API_KEY && process.env.SENDGRID_FROM_EMAIL) {
          const sendgridConfig = createSendGridEmailConfig(organizationId);
          provider = await this.createProvider(organizationId, sendgridConfig);
        }
      } catch (error) {
        this.logger.warn('SendGrid provider creation failed, using SMTP', {
          organizationId,
          error
        });
      }

      // Fallback to SMTP
      if (!provider && process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
        try {
          const smtpConfig = createSMTPEmailConfig(organizationId);
          provider = await this.createProvider(organizationId, smtpConfig);
        } catch (error) {
          this.logger.error('SMTP provider creation failed', {
            organizationId,
            error
          });
          throw new Error('No email provider could be created');
        }
      }

      if (!provider) {
        throw new Error('No email provider configuration available');
      }
    }

    return provider;
  }

  /**
   * Execute email operation with automatic fallback
   */
  async executeWithFallback<T>(
    organizationId: string,
    operation: (provider: EmailProvider) => Promise<T>,
    defaultValue: T
  ): Promise<T> {
    try {
      const provider = await this.getOrCreateProvider(organizationId);
      return await operation(provider);
    } catch (error) {
      this.logger.error('Email operation failed', {
        organizationId,
        error
      });

      // Try fallback to SMTP if we were using SendGrid
      try {
        if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
          const smtpConfig = createSMTPEmailConfig(organizationId);
          const smtpProvider = new SMTPEmailProvider(organizationId, smtpConfig);
          await smtpProvider.initialize();
          this.registry.registerProvider(organizationId, smtpProvider);
          
          return await operation(smtpProvider);
        }
      } catch (fallbackError) {
        this.logger.error('Email fallback operation failed', {
          organizationId,
          error: fallbackError
        });
      }

      return defaultValue;
    }
  }

  // ========================================
  // Health Monitoring
  // ========================================

  /**
   * Start health check monitoring for all providers
   */
  startHealthMonitoring(intervalMs = 5 * 60 * 1000): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    this.healthCheckInterval = setInterval(async () => {
      await this.performHealthChecks();
    }, intervalMs);

    this.logger.info('Email provider health monitoring started', { intervalMs });
  }

  /**
   * Stop health check monitoring
   */
  stopHealthMonitoring(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
      this.logger.info('Email provider health monitoring stopped');
    }
  }

  /**
   * Perform health checks on all registered providers
   */
  async performHealthChecks(): Promise<Map<string, HealthCheckResult>> {
    const results = new Map<string, HealthCheckResult>();
    const organizationIds = this.registry.getRegisteredOrganizations();

    for (const organizationId of organizationIds) {
      const provider = this.registry.getProvider(organizationId);
      if (provider) {
        try {
          const result = await provider.healthCheck();
          results.set(organizationId, result);

          if (result.status === 'unhealthy') {
            this.logger.warn('Email provider unhealthy', {
              organizationId,
              provider: provider.getName(),
              error: result.error
            });

            // Try to reinitialize unhealthy provider
            await this.reinitializeProvider(organizationId);
          }
        } catch (error) {
          this.logger.error('Health check failed', {
            organizationId,
            provider: provider.getName(),
            error
          });
        }
      }
    }

    return results;
  }

  /**
   * Reinitialize a provider that failed health check
   */
  private async reinitializeProvider(organizationId: string): Promise<void> {
    try {
      const provider = this.registry.getProvider(organizationId);
      if (provider) {
        await provider.dispose();
        this.registry.removeProvider(organizationId);
        
        // Create new provider
        await this.getOrCreateProvider(organizationId);
        
        this.logger.info('Email provider reinitialized', {
          organizationId,
          provider: provider.getName()
        });
      }
    } catch (error) {
      this.logger.error('Failed to reinitialize email provider', {
        organizationId,
        error
      });
    }
  }

  // ========================================
  // Organization Management
  // ========================================

  /**
   * Clear email provider for an organization
   */
  async clearOrganization(organizationId: string): Promise<boolean> {
    try {
      const provider = this.registry.getProvider(organizationId);
      if (provider) {
        await provider.dispose();
        this.registry.removeProvider(organizationId);
        
        this.logger.info('Organization email provider cleared', { organizationId });
        return true;
      }
      return false;
    } catch (error) {
      this.logger.error('Failed to clear organization email provider', {
        organizationId,
        error
      });
      return false;
    }
  }

  /**
   * Dispose all providers and cleanup
   */
  async dispose(): Promise<void> {
    this.stopHealthMonitoring();
    
    const organizationIds = this.registry.getRegisteredOrganizations();
    
    for (const organizationId of organizationIds) {
      const provider = this.registry.getProvider(organizationId);
      if (provider) {
        try {
          await provider.dispose();
        } catch (error) {
          this.logger.error('Error disposing email provider', {
            organizationId,
            error
          });
        }
      }
    }
    
    this.registry.clear();
    this.logger.info('Email provider manager disposed');
  }
}

// ========================================
// Email Provider Helper
// ========================================

/**
 * Helper class for simplified email operations
 */
export class EmailProviderHelper {
  private static manager = EmailProviderManager.getInstance();

  /**
   * Send single email
   */
  static async sendEmail(
    organizationId: string,
    to: EmailAddress | EmailAddress[],
    from: EmailAddress,
    options: EmailOptions
  ): Promise<EmailSendResult | null> {
    return this.manager.executeWithFallback(
      organizationId,
      (provider) => provider.sendEmail(to, from, options),
      null
    );
  }

  /**
   * Send bulk emails
   */
  static async sendBulkEmails(
    organizationId: string,
    recipients: Array<{
      to: EmailAddress;
      templateData?: Record<string, any>;
    }>,
    from: EmailAddress,
    options: BulkEmailOptions
  ): Promise<BulkEmailSendResult> {
    return this.manager.executeWithFallback(
      organizationId,
      (provider) => provider.sendBulkEmails(recipients, from, options),
      {
        success: false,
        results: [],
        total: recipients.length,
        sent: 0,
        failed: recipients.length,
        processingTime: 0
      }
    );
  }

  /**
   * Send transactional email using template
   */
  static async sendTransactionalEmail(
    organizationId: string,
    to: EmailAddress,
    from: EmailAddress,
    template: EmailTemplate,
    options?: Omit<EmailOptions, 'template' | 'html' | 'text'>
  ): Promise<EmailSendResult | null> {
    return this.manager.executeWithFallback(
      organizationId,
      (provider) => provider.sendTransactionalEmail(to, from, template, options),
      null
    );
  }

  /**
   * Validate email address
   */
  static async validateEmail(
    organizationId: string,
    email: string
  ): Promise<EmailValidationResult> {
    return this.manager.executeWithFallback(
      organizationId,
      (provider) => provider.validateEmail(email),
      {
        email,
        isValid: false,
        details: 'No provider available'
      }
    );
  }

  /**
   * Validate multiple email addresses
   */
  static async validateEmails(
    organizationId: string,
    emails: string[]
  ): Promise<EmailValidationResult[]> {
    return this.manager.executeWithFallback(
      organizationId,
      (provider) => provider.validateEmails(emails),
      emails.map(email => ({
        email,
        isValid: false,
        details: 'No provider available'
      }))
    );
  }

  /**
   * Get email sending statistics
   */
  static async getStats(
    organizationId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<EmailStats> {
    return this.manager.executeWithFallback(
      organizationId,
      (provider) => provider.getStats(startDate, endDate),
      {
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
      }
    );
  }

  /**
   * Create or update email template
   */
  static async createTemplate(
    organizationId: string,
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
  ): Promise<boolean> {
    return this.manager.executeWithFallback(
      organizationId,
      (provider) => provider.createTemplate(template),
      false
    );
  }

  /**
   * Delete email template
   */
  static async deleteTemplate(organizationId: string, templateId: string): Promise<boolean> {
    return this.manager.executeWithFallback(
      organizationId,
      (provider) => provider.deleteTemplate(templateId),
      false
    );
  }

  /**
   * List available templates
   */
  static async listTemplates(organizationId: string): Promise<Array<{
    id: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
  }>> {
    return this.manager.executeWithFallback(
      organizationId,
      (provider) => provider.listTemplates(),
      []
    );
  }

  /**
   * Add email to suppression list
   */
  static async addSuppression(
    organizationId: string,
    email: string,
    type: 'bounce' | 'spam' | 'unsubscribe' | 'invalid'
  ): Promise<boolean> {
    return this.manager.executeWithFallback(
      organizationId,
      (provider) => provider.addSuppression(email, type),
      false
    );
  }

  /**
   * Remove email from suppression list
   */
  static async removeSuppression(organizationId: string, email: string): Promise<boolean> {
    return this.manager.executeWithFallback(
      organizationId,
      (provider) => provider.removeSuppression(email),
      false
    );
  }

  /**
   * Check if email is suppressed
   */
  static async isSuppressed(organizationId: string, email: string): Promise<boolean> {
    return this.manager.executeWithFallback(
      organizationId,
      (provider) => provider.isSuppressed(email),
      false
    );
  }

  /**
   * Perform health check
   */
  static async healthCheck(organizationId: string): Promise<HealthCheckResult> {
    return this.manager.executeWithFallback(
      organizationId,
      (provider) => provider.healthCheck(),
      {
        status: 'unhealthy',
        timestamp: new Date(),
        responseTime: 0,
        error: 'No provider available'
      }
    );
  }

  /**
   * Initialize email providers from environment
   */
  static async initializeFromEnvironment(): Promise<void> {
    await this.manager.createProvidersFromEnvironment();
  }

  /**
   * Dispose all email providers
   */
  static async dispose(): Promise<void> {
    await this.manager.dispose();
  }
} 