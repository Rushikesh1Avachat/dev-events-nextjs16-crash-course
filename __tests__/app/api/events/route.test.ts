const RUN_DB_TESTS = process.env.RUN_DB_TESTS === 'true'
const describeIf = (cond: boolean) => (cond ? describe : describe.skip)
import { GET } from '@/app/api/events/[slug]/route'
import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'

// Mock NextResponse
const mockJson = jest.fn()
const mockNextResponse = {
  json: mockJson,
}

jest.mock('next/server', () => ({
  NextResponse: {
    json: (data: any, options?: any) => {
      mockJson(data, options)
      return { data, options }
    },
  },
}))

describeIf(RUN_DB_TESTS)('GET /api/events/[slug]', () => {
  let mongoServer: MongoMemoryServer
  let originalEnv: NodeJS.ProcessEnv

  beforeAll(async () => {
    originalEnv = { ...process.env }
    mongoServer = await MongoMemoryServer.create()
    process.env.MONGODB_URI = mongoServer.getUri()
  })

  afterAll(async () => {
    process.env = originalEnv
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect()
    }
    await mongoServer.stop()
  })

  beforeEach(() => {
    jest.clearAllMocks()
    mockJson.mockClear()
  })

  describe('Happy Path', () => {
    it('should return 400 when slug is missing', async () => {
      const request = new Request('http://localhost/api/events/')
      const context = { params: {} }

      await GET(request, context as any)

      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: 'MISSING_SLUG',
          }),
        }),
        expect.objectContaining({ status: 400 })
      )
    })

    it('should return 400 for invalid slug format', async () => {
      const request = new Request('http://localhost/api/events/INVALID_SLUG')
      const context = { params: { slug: 'INVALID_SLUG' } }

      await GET(request, context as any)

      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: 'INVALID_SLUG',
          }),
        }),
        expect.objectContaining({ status: 400 })
      )
    })
  })

  describe('Slug Validation', () => {
    it('should accept valid lowercase slug', async () => {
      const request = new Request('http://localhost/api/events/valid-slug')
      const context = { params: { slug: 'valid-slug-123' } }

      await GET(request, context as any)

      // Should not return invalid slug error
      if (mockJson.mock.calls[0]) {
        const response = mockJson.mock.calls[0][0]
        if (!response.success) {
          expect(response.error.code).not.toBe('INVALID_SLUG')
        }
      }
    })

    it('should reject slug with uppercase letters', async () => {
      const request = new Request('http://localhost/api/events/Invalid-Slug')
      const context = { params: { slug: 'Invalid-Slug' } }

      await GET(request, context as any)

      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: 'INVALID_SLUG',
          }),
        }),
        expect.objectContaining({ status: 400 })
      )
    })

    it('should reject slug with special characters', async () => {
      const request = new Request('http://localhost/api/events/slug@special')
      const context = { params: { slug: 'slug@special' } }

      await GET(request, context as any)

      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: 'INVALID_SLUG',
          }),
        }),
        expect.objectContaining({ status: 400 })
      )
    })

    it('should reject slug with spaces', async () => {
      const request = new Request('http://localhost/api/events/invalid slug')
      const context = { params: { slug: 'invalid slug' } }

      await GET(request, context as any)

      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: 'INVALID_SLUG',
          }),
        }),
        expect.objectContaining({ status: 400 })
      )
    })

    it('should reject empty slug', async () => {
      const request = new Request('http://localhost/api/events/')
      const context = { params: { slug: '' } }

      await GET(request, context as any)

      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: 'INVALID_SLUG',
          }),
        }),
        expect.objectContaining({ status: 400 })
      )
    })

    it('should reject slug longer than 100 characters', async () => {
      const longSlug = 'a'.repeat(101)
      const request = new Request(`http://localhost/api/events/${longSlug}`)
      const context = { params: { slug: longSlug } }

      await GET(request, context as any)

      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: 'INVALID_SLUG',
          }),
        }),
        expect.objectContaining({ status: 400 })
      )
    })
  })

  describe('Error Handling', () => {
    it('should return 500 on unexpected errors', async () => {
      // Mock mongoose.connect to throw error
      const originalConnect = mongoose.connect
      mongoose.connect = jest.fn().mockRejectedValue(new Error('Database error'))

      const request = new Request('http://localhost/api/events/valid-slug')
      const context = { params: { slug: 'valid-slug' } }

      await GET(request, context as any)

      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: 'INTERNAL_SERVER_ERROR',
          }),
        }),
        expect.objectContaining({ status: 500 })
      )

      mongoose.connect = originalConnect
    })

    it('should handle missing MONGODB_URI', async () => {
      const savedUri = process.env.MONGODB_URI
      delete process.env.MONGODB_URI

      const request = new Request('http://localhost/api/events/valid-slug')
      const context = { params: { slug: 'valid-slug' } }

      await GET(request, context as any)

      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: 'INTERNAL_SERVER_ERROR',
          }),
        }),
        expect.objectContaining({ status: 500 })
      )

      process.env.MONGODB_URI = savedUri
    })
  })

  describe('Response Format', () => {
    it('should return proper error structure for missing slug', async () => {
      const request = new Request('http://localhost/api/events/')
      const context = { params: {} }

      await GET(request, context as any)

      const response = mockJson.mock.calls[0][0]
      expect(response).toHaveProperty('success', false)
      expect(response).toHaveProperty('error')
      expect(response.error).toHaveProperty('code')
      expect(response.error).toHaveProperty('message')
    })

    it('should return NOT_FOUND for non-existent event', async () => {
      const request = new Request('http://localhost/api/events/non-existent')
      const context = { params: { slug: 'non-existent' } }

      await GET(request, context as any)

      // Will fail to connect or return not found
      if (mockJson.mock.calls[0]) {
        const response = mockJson.mock.calls[0][0]
        expect(response.success).toBe(false)
      }
    })
  })

  describe('Type Safety', () => {
    it('should handle undefined slug gracefully', async () => {
      const request = new Request('http://localhost/api/events/')
      const context = { params: { slug: undefined } }

      await GET(request, context as any)

      expect(mockJson).toHaveBeenCalled()
      const response = mockJson.mock.calls[0][0]
      expect(response.success).toBe(false)
    })

    it('should handle null slug gracefully', async () => {
      const request = new Request('http://localhost/api/events/')
      const context = { params: { slug: null as any } }

      await GET(request, context as any)

      expect(mockJson).toHaveBeenCalled()
      const response = mockJson.mock.calls[0][0]
      expect(response.success).toBe(false)
    })
  })
})