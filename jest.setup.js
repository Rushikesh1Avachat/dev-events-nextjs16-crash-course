// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Mock environment variables for tests
process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/test-db'
process.env.NEXT_PUBLIC_POSTHOG_KEY = 'test-posthog-key'
process.env.NODE_ENV = 'test'
process.env.RUN_DB_TESTS = process.env.RUN_DB_TESTS || 'false'

// Mock Next.js Image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props) => {
    // eslint-disable-next-line jsx-a11y/alt-text
    return <img {...props} />
  },
}))

// Mock Next.js Link component
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...props }) => {
    return <a href={href} {...props}>{children}</a>
  },
}))

// Mock posthog
jest.mock('posthog-js', () => ({
  init: jest.fn(),
  capture: jest.fn(),
  identify: jest.fn(),
}))

// Global test utilities
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
}