import type { Page, Locator } from '@playwright/test';
import { expect } from '../fixtures';

export class VisualTestHelper {
  constructor(private page: Page) {}

  /**
   * Tira screenshot da página completa
   */
  async takeFullPageScreenshot(name: string) {
    await this.page.screenshot({
      path: `tests/screenshots/${name}.png`,
      fullPage: true,
      animations: 'disabled'
    });
  }

  /**
   * Tira screenshot de um elemento específico
   */
  async takeElementScreenshot(selector: string, name: string) {
    const element = this.page.locator(selector);
    await element.screenshot({
      path: `tests/screenshots/elements/${name}.png`,
      animations: 'disabled'
    });
  }

  /**
   * Compara screenshot atual com baseline
   */
  async compareScreenshot(name: string) {
    await expect(this.page).toHaveScreenshot(`${name}.png`);
  }

  /**
   * Compara elemento específico com baseline
   */
  async compareElementScreenshot(selector: string, name: string) {
    const element = this.page.locator(selector);
    await expect(element).toHaveScreenshot(`${name}.png`);
  }

  /**
   * Testa responsividade em diferentes tamanhos
   */
  async testResponsiveScreenshots(name: string) {
    const viewports = [
      { width: 320, height: 568, name: 'mobile' },
      { width: 768, height: 1024, name: 'tablet' },
      { width: 1920, height: 1080, name: 'desktop' }
    ];

    for (const viewport of viewports) {
      await this.page.setViewportSize({
        width: viewport.width,
        height: viewport.height
      });
      
      await this.page.waitForTimeout(500); // Aguardar layout se ajustar
      
      await this.takeFullPageScreenshot(`${name}-${viewport.name}`);
    }
  }

  /**
   * Testa estados diferentes de um componente
   */
  async testComponentStates(
    selector: string,
    states: { action: () => Promise<void>; name: string }[],
    baseName: string
  ) {
    const element = this.page.locator(selector);
    
    // Screenshot do estado inicial
    await this.takeElementScreenshot(selector, `${baseName}-initial`);
    
    // Screenshot de cada estado
    for (const state of states) {
      await state.action();
      await this.page.waitForTimeout(300);
      await this.takeElementScreenshot(selector, `${baseName}-${state.name}`);
    }
  }

  /**
   * Testa tema claro vs escuro
   */
  async testThemeScreenshots(name: string) {
    // Tema claro
    await this.page.emulateMedia({ colorScheme: 'light' });
    await this.page.waitForTimeout(500);
    await this.takeFullPageScreenshot(`${name}-light`);
    
    // Tema escuro
    await this.page.emulateMedia({ colorScheme: 'dark' });
    await this.page.waitForTimeout(500);
    await this.takeFullPageScreenshot(`${name}-dark`);
  }

  /**
   * Gera documentação visual automatizada
   */
  async generateVisualDocumentation(
    page: string,
    scenarios: {
      name: string;
      setup: () => Promise<void>;
      description: string;
    }[]
  ) {
    for (const scenario of scenarios) {
      await scenario.setup();
      await this.page.waitForLoadState('networkidle');
      
      // Screenshot principal
      await this.takeFullPageScreenshot(`docs-${page}-${scenario.name}`);
      
      // Screenshot responsivo
      await this.testResponsiveScreenshots(`docs-${page}-${scenario.name}`);
      
      // Screenshot dos temas
      await this.testThemeScreenshots(`docs-${page}-${scenario.name}`);
    }
  }
}

/**
 * Helper para testes de acessibilidade visual
 */
export class AccessibilityTestHelper {
  constructor(private page: Page) {}

  /**
   * Testa navegação por teclado
   */
  async testKeyboardNavigation(startSelector?: string) {
    if (startSelector) {
      await this.page.locator(startSelector).focus();
    }

    const focusableElements: string[] = [];
    
    // Navegar por todos os elementos focáveis
    for (let i = 0; i < 20; i++) {
      await this.page.keyboard.press('Tab');
      
      const focusedElement = await this.page.evaluate(() => {
        const el = document.activeElement;
        return el ? `${el.tagName}${el.id ? '#' + el.id : ''}${el.className ? '.' + el.className.split(' ').join('.') : ''}` : null;
      });
      
      if (focusedElement) {
        focusableElements.push(focusedElement);
      }
    }
    
    return focusableElements;
  }

  /**
   * Verifica contraste de cores
   */
  async checkColorContrast(selector: string) {
    const element = this.page.locator(selector);
    
    const styles = await element.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        color: computed.color,
        backgroundColor: computed.backgroundColor,
        fontSize: computed.fontSize
      };
    });
    
    return styles;
  }

  /**
   * Verifica atributos de acessibilidade
   */
  async checkAccessibilityAttributes(selector: string) {
    const element = this.page.locator(selector);
    
    const attributes = await element.evaluate((el) => ({
      'aria-label': el.getAttribute('aria-label'),
      'aria-describedby': el.getAttribute('aria-describedby'),
      'role': el.getAttribute('role'),
      'tabindex': el.getAttribute('tabindex'),
      'alt': el.getAttribute('alt')
    }));
    
    return attributes;
  }
}

/**
 * Helper para testes de performance visual
 */
export class PerformanceTestHelper {
  constructor(private page: Page) {}

  /**
   * Mede tempo de carregamento visual
   */
  async measureLoadTime() {
    const startTime = Date.now();
    
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForFunction(() => {
      return document.readyState === 'complete';
    });
    
    const endTime = Date.now();
    return endTime - startTime;
  }

  /**
   * Mede Core Web Vitals
   */
  async measureCoreWebVitals() {
    const metrics = await this.page.evaluate(() => {
      return new Promise((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const vitals: any = {};
          
          entries.forEach((entry: any) => {
            if (entry.name === 'FCP') vitals.fcp = entry.value;
            if (entry.name === 'LCP') vitals.lcp = entry.value;
            if (entry.name === 'FID') vitals.fid = entry.value;
            if (entry.name === 'CLS') vitals.cls = entry.value;
          });
          
          resolve(vitals);
        }).observe({ entryTypes: ['paint', 'largest-contentful-paint', 'first-input', 'layout-shift'] });
        
        // Timeout após 5 segundos
        setTimeout(() => resolve({}), 5000);
      });
    });
    
    return metrics;
  }

  /**
   * Monitora uso de memória
   */
  async measureMemoryUsage() {
    const metrics = await this.page.evaluate(() => {
      // @ts-ignore
      if (performance.memory) {
        // @ts-ignore
        return {
          // @ts-ignore
          usedJSHeapSize: performance.memory.usedJSHeapSize,
          // @ts-ignore
          totalJSHeapSize: performance.memory.totalJSHeapSize,
          // @ts-ignore
          jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
        };
      }
      return null;
    });
    
    return metrics;
  }
}

/**
 * Helper para testes de interação
 */
export class InteractionTestHelper {
  constructor(private page: Page) {}

  /**
   * Testa hover states
   */
  async testHoverStates(selectors: string[], baseName: string) {
    const visualHelper = new VisualTestHelper(this.page);
    
    for (const selector of selectors) {
      const element = this.page.locator(selector);
      
      // Estado normal
      await visualHelper.takeElementScreenshot(selector, `${baseName}-${selector.replace(/[^a-zA-Z0-9]/g, '_')}-normal`);
      
      // Estado hover
      await element.hover();
      await this.page.waitForTimeout(200);
      await visualHelper.takeElementScreenshot(selector, `${baseName}-${selector.replace(/[^a-zA-Z0-9]/g, '_')}-hover`);
    }
  }

  /**
   * Testa animações
   */
  async testAnimations(
    trigger: () => Promise<void>,
    selector: string,
    duration: number,
    baseName: string
  ) {
    const visualHelper = new VisualTestHelper(this.page);
    
    // Screenshot antes da animação
    await visualHelper.takeElementScreenshot(selector, `${baseName}-before`);
    
    // Trigger da animação
    await trigger();
    
    // Screenshots durante a animação
    const frames = 5;
    const interval = duration / frames;
    
    for (let i = 0; i < frames; i++) {
      await this.page.waitForTimeout(interval);
      await visualHelper.takeElementScreenshot(selector, `${baseName}-frame-${i}`);
    }
    
    // Screenshot final
    await this.page.waitForTimeout(interval);
    await visualHelper.takeElementScreenshot(selector, `${baseName}-after`);
  }

  /**
   * Testa formulários
   */
  async testFormInteractions(formSelector: string, baseName: string) {
    const visualHelper = new VisualTestHelper(this.page);
    const form = this.page.locator(formSelector);
    
    // Estado inicial
    await visualHelper.takeElementScreenshot(formSelector, `${baseName}-initial`);
    
    // Encontrar todos os inputs
    const inputs = await form.locator('input, textarea, select').all();
    
    for (let i = 0; i < inputs.length; i++) {
      const input = inputs[i];
      
      // Focus no input
      await input.focus();
      await visualHelper.takeElementScreenshot(formSelector, `${baseName}-focus-${i}`);
      
      // Preencher com dados de teste
      const tagName = await input.evaluate(el => el.tagName.toLowerCase());
      const type = await input.getAttribute('type');
      
      if (tagName === 'input') {
        if (type === 'email') {
          await input.fill('teste@exemplo.com');
        } else if (type === 'password') {
          await input.fill('senha123');
        } else if (type === 'text') {
          await input.fill('Texto de teste');
        }
      } else if (tagName === 'textarea') {
        await input.fill('Descrição de teste mais longa para verificar o comportamento do textarea.');
      }
      
      await visualHelper.takeElementScreenshot(formSelector, `${baseName}-filled-${i}`);
    }
    
    // Estado final preenchido
    await visualHelper.takeElementScreenshot(formSelector, `${baseName}-completed`);
  }
} 