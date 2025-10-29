import { Event, Booking } from '@/database/index'
import type { IEvent, IBooking } from '@/database/index'

describe('Database Index Exports', () => {
  describe('Model Exports', () => {
    it('should export Event model', () => {
      expect(Event).toBeDefined()
      expect(typeof Event).toBe('function')
    })

    it('should export Booking model', () => {
      expect(Booking).toBeDefined()
      expect(typeof Booking).toBe('function')
    })

    it('should have Event model with schema methods', () => {
      expect(Event.schema).toBeDefined()
      expect(Event.create).toBeDefined()
      expect(Event.find).toBeDefined()
      expect(Event.findOne).toBeDefined()
    })

    it('should have Booking model with schema methods', () => {
      expect(Booking.schema).toBeDefined()
      expect(Booking.create).toBeDefined()
      expect(Booking.find).toBeDefined()
      expect(Booking.findOne).toBeDefined()
    })
  })

  describe('Type Exports', () => {
    it('should allow using IEvent type', () => {
      const mockEvent: Partial<IEvent> = {
        title: 'Test Event',
        slug: 'test-event',
        description: 'Test description',
      }

      expect(mockEvent.title).toBe('Test Event')
    })

    it('should allow using IBooking type', () => {
      const mockBooking: Partial<IBooking> = {
        email: 'test@example.com',
      }

      expect(mockBooking.email).toBe('test@example.com')
    })
  })

  describe('Module Structure', () => {
    it('should provide named exports', async () => {
      const module = await import('@/database/index')
      
      expect(module.Event).toBeDefined()
      expect(module.Booking).toBeDefined()
    })

    it('should have consistent model names', () => {
      expect(Event.modelName).toBe('Event')
      expect(Booking.modelName).toBe('Booking')
    })
  })
})