import { registerOTel } from '@vercel/otel';

export function register() {
  registerOTel({ serviceName: 'humana-companions' });
}
