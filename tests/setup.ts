import { vi } from 'vitest'

// Setup mocks para variáveis de ambiente
process.env.AUTH_SECRET = 'test-secret'
process.env.POSTGRES_URL = 'postgresql://test:test@localhost:5432/test'

// Mock next-auth/jwt
vi.mock('next-auth/jwt', () => ({
  getToken: vi.fn(),
}))

// Mock NextResponse para testes de middleware
vi.mock('next/server', async () => {
  const actual = await vi.importActual('next/server')
  return {
    ...actual,
    NextResponse: {
      next: vi.fn(() => ({
        headers: new Map(),
        status: 200,
        json: vi.fn(),
      })),
      json: vi.fn((data, options) => ({
        data,
        status: options?.status || 200,
        headers: new Map(),
      })),
    },
  }
}) 