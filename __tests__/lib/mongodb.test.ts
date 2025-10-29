import mongoose from 'mongoose'

// Mock mongoose before importing connectDB
jest.mock('mongoose', () => ({
  connect: jest.fn(),
  connection: {
    readyState: 0,
  },
  models: {},
}))

describe('MongoDB Connection Module', () => {
  let connectDB: () => Promise<typeof mongoose>
  let originalEnv: NodeJS.ProcessEnv

  beforeEach(() => {
    // Save original environment
    originalEnv = { ...process.env }
    
    // Clear module cache to get fresh import
    jest.resetModules()
    jest.clearAllMocks()
    
    // Reset global mongoose cache
    ;(global as any).mongoose = undefined
    
    // Set test environment variable
    process.env.MONGODB_URI = 'mongodb://localhost:27017/test-db'
  })

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv
  })

  describe('Environment Variable Validation', () => {
    it('should throw error when MONGODB_URI is not defined', () => {
      delete process.env.MONGODB_URI
      
      expect(() => {
        require('@/lib/mongodb')
      }).toThrow('Please define the MONGODB_URI environment variable inside .env.local')
    })

    it('should not throw when MONGODB_URI is defined', () => {
      process.env.MONGODB_URI = 'mongodb://localhost:27017/test'
      
      expect(() => {
        require('@/lib/mongodb')
      }).not.toThrow()
    })
  })

  describe('Connection Management - Happy Path', () => {
    beforeEach(() => {
      connectDB = require('@/lib/mongodb').default
      ;(mongoose.connect as jest.Mock).mockResolvedValue(mongoose)
    })

    it('should establish connection on first call', async () => {
      const result = await connectDB()
      
      expect(mongoose.connect).toHaveBeenCalledWith(
        'mongodb://localhost:27017/test-db',
        { bufferCommands: false }
      )
      expect(result).toBe(mongoose)
    })

    it('should return cached connection on subsequent calls', async () => {
      await connectDB()
      await connectDB()
      await connectDB()
      
      // Should only connect once
      expect(mongoose.connect).toHaveBeenCalledTimes(1)
    })

    it('should log success message on connection', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()
      
      await connectDB()
      
      expect(consoleSpy).toHaveBeenCalledWith('✅ MongoDB connected successfully')
      consoleSpy.mockRestore()
    })

    it('should use correct connection options', async () => {
      await connectDB()
      
      expect(mongoose.connect).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          bufferCommands: false,
        })
      )
    })
  })

  describe('Connection Management - Concurrent Requests', () => {
    beforeEach(() => {
      connectDB = require('@/lib/mongodb').default
      ;(mongoose.connect as jest.Mock).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(mongoose), 100))
      )
    })

    it('should handle concurrent connection requests', async () => {
      const promises = [
        connectDB(),
        connectDB(),
        connectDB(),
      ]
      
      const results = await Promise.all(promises)
      
      // Should only call connect once
      expect(mongoose.connect).toHaveBeenCalledTimes(1)
      // All should return the same connection
      results.forEach(result => expect(result).toBe(mongoose))
    })

    it('should reuse pending promise for concurrent calls', async () => {
      const promise1 = connectDB()
      const promise2 = connectDB()
      
      expect(promise1).toBe(promise2)
      
      await Promise.all([promise1, promise2])
      expect(mongoose.connect).toHaveBeenCalledTimes(1)
    })
  })

  describe('Error Handling', () => {
    beforeEach(() => {
      connectDB = require('@/lib/mongodb').default
    })

    it('should handle connection errors', async () => {
      const error = new Error('Connection failed')
      ;(mongoose.connect as jest.Mock).mockRejectedValue(error)
      
      await expect(connectDB()).rejects.toThrow('Connection failed')
    })

    it('should log error on connection failure', async () => {
      const error = new Error('Network error')
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
      ;(mongoose.connect as jest.Mock).mockRejectedValue(error)
      
      await expect(connectDB()).rejects.toThrow()
      
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '❌ MongoDB connection error:',
        error
      )
      consoleErrorSpy.mockRestore()
    })

    it('should reset promise on error to allow retry', async () => {
      const error = new Error('Transient error')
      ;(mongoose.connect as jest.Mock)
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce(mongoose)
      
      // First call fails
      await expect(connectDB()).rejects.toThrow()
      
      // Second call should retry and succeed
      const result = await connectDB()
      expect(result).toBe(mongoose)
      expect(mongoose.connect).toHaveBeenCalledTimes(2)
    })

    it('should handle undefined global mongoose', async () => {
      ;(global as any).mongoose = undefined
      ;(mongoose.connect as jest.Mock).mockResolvedValue(mongoose)
      
      const result = await connectDB()
      expect(result).toBe(mongoose)
    })
  })

  describe('Cache Behavior', () => {
    beforeEach(() => {
      connectDB = require('@/lib/mongodb').default
      ;(mongoose.connect as jest.Mock).mockResolvedValue(mongoose)
    })

    it('should initialize global cache if not present', async () => {
      expect((global as any).mongoose).toBeUndefined()
      
      await connectDB()
      
      expect((global as any).mongoose).toBeDefined()
      expect((global as any).mongoose.conn).toBe(mongoose)
    })

    it('should persist cache across hot reloads', async () => {
      await connectDB()
      const firstCache = (global as any).mongoose
      
      // Simulate hot reload by re-requiring
      jest.resetModules()
      ;(global as any).mongoose = firstCache
      connectDB = require('@/lib/mongodb').default
      
      await connectDB()
      
      // Should reuse cached connection, not create new one
      expect(mongoose.connect).toHaveBeenCalledTimes(1)
    })
  })

  describe('Connection URI Handling', () => {
    it('should use exact URI from environment', async () => {
      process.env.MONGODB_URI = 'mongodb+srv://user:pass@cluster.mongodb.net/mydb?retryWrites=true'
      connectDB = require('@/lib/mongodb').default
      ;(mongoose.connect as jest.Mock).mockResolvedValue(mongoose)
      
      await connectDB()
      
      expect(mongoose.connect).toHaveBeenCalledWith(
        'mongodb+srv://user:pass@cluster.mongodb.net/mydb?retryWrites=true',
        expect.any(Object)
      )
    })

    it('should handle localhost URI', async () => {
      process.env.MONGODB_URI = 'mongodb://localhost:27017/local-db'
      connectDB = require('@/lib/mongodb').default
      ;(mongoose.connect as jest.Mock).mockResolvedValue(mongoose)
      
      await connectDB()
      
      expect(mongoose.connect).toHaveBeenCalledWith(
        'mongodb://localhost:27017/local-db',
        expect.any(Object)
      )
    })
  })

  describe('Type Safety', () => {
    beforeEach(() => {
      connectDB = require('@/lib/mongodb').default
      ;(mongoose.connect as jest.Mock).mockResolvedValue(mongoose)
    })

    it('should return mongoose instance', async () => {
      const result = await connectDB()
      expect(result).toBe(mongoose)
    })

    it('should return cached mongoose instance', async () => {
      const first = await connectDB()
      const second = await connectDB()
      expect(first).toBe(second)
    })
  })
})