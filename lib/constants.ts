import { generateDummyPassword } from './db/utils';

export const isProductionEnvironment = process.env.NODE_ENV === 'production';
export const isDevelopmentEnvironment = process.env.NODE_ENV === 'development';
export const isTestEnvironment = Boolean(
  process.env.PLAYWRIGHT_TEST_BASE_URL ||
    process.env.PLAYWRIGHT ||
    process.env.CI_PLAYWRIGHT,
);

export const guestRegex = /^guest-\d+$/;

export const DUMMY_PASSWORD = generateDummyPassword();

// ============================================================================
// ORGANIZAÇÕES PADRÃO - IDs FIXOS
// ============================================================================

export const SYSTEM_USER_ID = '00000000-0000-0000-0000-000000000001';
export const GUEST_ORGANIZATION_ID = '00000000-0000-0000-0000-000000000002';
export const DEFAULT_ORGANIZATION_ID = '00000000-0000-0000-0000-000000000003';

// Mapa para facilitar uso
export const ORGANIZATION_IDS = {
  SYSTEM_USER: SYSTEM_USER_ID,
  GUEST: GUEST_ORGANIZATION_ID,
  DEFAULT: DEFAULT_ORGANIZATION_ID,
} as const;
