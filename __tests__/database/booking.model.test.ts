const RUN_DB_TESTS = process.env.RUN_DB_TESTS === 'true'
const describeIf = (cond: boolean) => (cond ? describe : describe.skip)
import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import Booking from '@/database/booking.model'
import Event from '@/database/event.model'
import type { IBooking } from '@/database/booking.model'
import type { IEvent } from '@/database/event.model'

describeIf(RUN_DB_TESTS)('Booking Model', () => {
  let mongoServer: MongoMemoryServer
  let testEventId: mongoose.Types.ObjectId

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create()
    const mongoUri = mongoServer.getUri()
    await mongoose.connect(mongoUri)
  })

  afterAll(async () => {
    await mongoose.disconnect()
    await mongoServer.stop()
  })

  beforeEach(async () => {
    // Create a test event for bookings
    const event = await Event.create({
      title: 'Test Event for Booking',
      description: 'Test description',
      overview: 'Test overview',
      image: '/images/test.png',
      venue: 'Test Venue',
      location: 'Test City, TC',
      date: '2025-12-01',
      time: '10:00',
      mode: 'Online',
      audience: 'All',
      agenda: ['Session 1'],
      organizer: 'Test Org',
      tags: ['test'],
    })
    testEventId = event._id
  })

  afterEach(async () => {
    await Booking.deleteMany({})
    await Event.deleteMany({})
  })

  describe('Schema Validation - Happy Path', () => {
    it('should create booking with valid eventId and email', async () => {
      const bookingData = {
        eventId: testEventId,
        email: 'test@example.com',
      }

      const booking = await Booking.create(bookingData)

      expect(booking._id).toBeDefined()
      expect(booking.eventId).toEqual(testEventId)
      expect(booking.email).toBe('test@example.com')
      expect(booking.createdAt).toBeDefined()
      expect(booking.updatedAt).toBeDefined()
    })

    it('should allow multiple bookings for same event with different emails', async () => {
      const booking1 = await Booking.create({
        eventId: testEventId,
        email: 'user1@example.com',
      })

      const booking2 = await Booking.create({
        eventId: testEventId,
        email: 'user2@example.com',
      })

      expect(booking1._id).not.toEqual(booking2._id)
      expect(booking1.eventId).toEqual(booking2.eventId)
      expect(booking1.email).not.toBe(booking2.email)
    })

    it('should populate event reference', async () => {
      const booking = await Booking.create({
        eventId: testEventId,
        email: 'test@example.com',
      })

      const populatedBooking = await Booking.findById(booking._id).populate('eventId')
      
      expect(populatedBooking).toBeTruthy()
      expect((populatedBooking!.eventId as any).title).toBe('Test Event for Booking')
    })
  })

  describe('Email Validation', () => {
    it('should accept valid email addresses', async () => {
      const validEmails = [
        'test@example.com',
        'user.name@example.com',
        'user+tag@example.co.uk',
        'user123@test-domain.com',
      ]

      for (const email of validEmails) {
        const booking = await Booking.create({
          eventId: testEventId,
          email,
        })
        expect(booking.email).toBe(email.toLowerCase())
      }
    })

    it('should convert email to lowercase', async () => {
      const booking = await Booking.create({
        eventId: testEventId,
        email: 'Test@EXAMPLE.COM',
      })

      expect(booking.email).toBe('test@example.com')
    })

    it('should trim whitespace from email', async () => {
      const booking = await Booking.create({
        eventId: testEventId,
        email: '  test@example.com  ',
      })

      expect(booking.email).toBe('test@example.com')
    })

    it('should reject invalid email format - missing @', async () => {
      await expect(Booking.create({
        eventId: testEventId,
        email: 'invalidemail.com',
      })).rejects.toThrow()
    })

    it('should reject invalid email format - missing domain', async () => {
      await expect(Booking.create({
        eventId: testEventId,
        email: 'test@',
      })).rejects.toThrow()
    })

    it('should reject invalid email format - missing local part', async () => {
      await expect(Booking.create({
        eventId: testEventId,
        email: '@example.com',
      })).rejects.toThrow()
    })

    it('should reject email with spaces', async () => {
      await expect(Booking.create({
        eventId: testEventId,
        email: 'test user@example.com',
      })).rejects.toThrow()
    })

    it('should reject empty email', async () => {
      await expect(Booking.create({
        eventId: testEventId,
        email: '',
      })).rejects.toThrow()
    })
  })

  describe('EventId Validation', () => {
    it('should require eventId', async () => {
      await expect(Booking.create({
        email: 'test@example.com',
      })).rejects.toThrow()
    })

    it('should reject booking for non-existent event', async () => {
      const fakeEventId = new mongoose.Types.ObjectId()
      
      await expect(Booking.create({
        eventId: fakeEventId,
        email: 'test@example.com',
      })).rejects.toThrow()
    })

    it('should reject invalid ObjectId format', async () => {
      await expect(Booking.create({
        eventId: 'invalid-id' as any,
        email: 'test@example.com',
      })).rejects.toThrow()
    })

    it('should validate event existence on update', async () => {
      const booking = await Booking.create({
        eventId: testEventId,
        email: 'test@example.com',
      })

      // Delete the event
      await Event.findByIdAndDelete(testEventId)

      // Create new event
      const newEvent = await Event.create({
        title: 'New Event',
        description: 'desc',
        overview: 'overview',
        image: '/images/test.png',
        venue: 'venue',
        location: 'location',
        date: '2025-12-02',
        time: '11:00',
        mode: 'Online',
        audience: 'All',
        agenda: ['item'],
        organizer: 'org',
        tags: ['tag'],
      })

      // Update should succeed with valid event
      booking.eventId = newEvent._id
      await expect(booking.save()).resolves.toBeTruthy()
    })
  })

  describe('Required Fields', () => {
    it('should require email', async () => {
      await expect(Booking.create({
        eventId: testEventId,
      })).rejects.toThrow()
    })

    it('should require eventId', async () => {
      await expect(Booking.create({
        email: 'test@example.com',
      })).rejects.toThrow()
    })

    it('should not create booking with null eventId', async () => {
      await expect(Booking.create({
        eventId: null,
        email: 'test@example.com',
      })).rejects.toThrow()
    })

    it('should not create booking with null email', async () => {
      await expect(Booking.create({
        eventId: testEventId,
        email: null,
      })).rejects.toThrow()
    })
  })

  describe('Timestamps', () => {
    it('should auto-generate createdAt timestamp', async () => {
      const booking = await Booking.create({
        eventId: testEventId,
        email: 'test@example.com',
      })

      expect(booking.createdAt).toBeInstanceOf(Date)
      expect(booking.createdAt.getTime()).toBeLessThanOrEqual(Date.now())
    })

    it('should auto-generate updatedAt timestamp', async () => {
      const booking = await Booking.create({
        eventId: testEventId,
        email: 'test@example.com',
      })

      expect(booking.updatedAt).toBeInstanceOf(Date)
      expect(booking.updatedAt.getTime()).toBeLessThanOrEqual(Date.now())
    })

    it('should update updatedAt on modification', async () => {
      const booking = await Booking.create({
        eventId: testEventId,
        email: 'original@example.com',
      })

      const originalUpdatedAt = booking.updatedAt

      await new Promise(resolve => setTimeout(resolve, 10))

      booking.email = 'updated@example.com'
      await booking.save()

      expect(booking.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime())
    })

    it('should not modify createdAt on update', async () => {
      const booking = await Booking.create({
        eventId: testEventId,
        email: 'original@example.com',
      })

      const originalCreatedAt = booking.createdAt

      await new Promise(resolve => setTimeout(resolve, 10))

      booking.email = 'updated@example.com'
      await booking.save()

      expect(booking.createdAt).toEqual(originalCreatedAt)
    })
  })

  describe('Query Operations', () => {
    it('should find bookings by eventId', async () => {
      await Booking.create({
        eventId: testEventId,
        email: 'user1@example.com',
      })

      await Booking.create({
        eventId: testEventId,
        email: 'user2@example.com',
      })

      const bookings = await Booking.find({ eventId: testEventId })
      expect(bookings).toHaveLength(2)
    })

    it('should find booking by email', async () => {
      await Booking.create({
        eventId: testEventId,
        email: 'specific@example.com',
      })

      const booking = await Booking.findOne({ email: 'specific@example.com' })
      expect(booking).toBeTruthy()
      expect(booking!.email).toBe('specific@example.com')
    })

    it('should use index on eventId for efficient queries', async () => {
      const indexes = Booking.schema.indexes()
      const eventIdIndex = indexes.find(index => 
        index[0].eventId !== undefined
      )
      expect(eventIdIndex).toBeDefined()
    })

    it('should count bookings for an event', async () => {
      await Booking.create({
        eventId: testEventId,
        email: 'user1@example.com',
      })

      await Booking.create({
        eventId: testEventId,
        email: 'user2@example.com',
      })

      const count = await Booking.countDocuments({ eventId: testEventId })
      expect(count).toBe(2)
    })
  })

  describe('Edge Cases', () => {
    it('should handle concurrent bookings for same event', async () => {
      const promises = [
        Booking.create({
          eventId: testEventId,
          email: 'user1@example.com',
        }),
        Booking.create({
          eventId: testEventId,
          email: 'user2@example.com',
        }),
        Booking.create({
          eventId: testEventId,
          email: 'user3@example.com',
        }),
      ]

      const bookings = await Promise.all(promises)
      expect(bookings).toHaveLength(3)
      
      const uniqueEmails = new Set(bookings.map(b => b.email))
      expect(uniqueEmails.size).toBe(3)
    })

    it('should handle very long email addresses', async () => {
      const longEmail = 'a'.repeat(50) + '@' + 'b'.repeat(50) + '.com'
      
      const booking = await Booking.create({
        eventId: testEventId,
        email: longEmail,
      })

      expect(booking.email).toBe(longEmail)
    })

    it('should allow duplicate emails for different events', async () => {
      const event2 = await Event.create({
        title: 'Second Event',
        description: 'desc',
        overview: 'overview',
        image: '/images/test2.png',
        venue: 'venue',
        location: 'location',
        date: '2025-12-02',
        time: '11:00',
        mode: 'Online',
        audience: 'All',
        agenda: ['item'],
        organizer: 'org',
        tags: ['tag'],
      })

      const booking1 = await Booking.create({
        eventId: testEventId,
        email: 'same@example.com',
      })

      const booking2 = await Booking.create({
        eventId: event2._id,
        email: 'same@example.com',
      })

      expect(booking1.email).toBe(booking2.email)
      expect(booking1.eventId).not.toEqual(booking2.eventId)
    })
  })

  describe('Pre-save Hook Validation', () => {
    it('should validate event existence before saving', async () => {
      const fakeEventId = new mongoose.Types.ObjectId()
      
      await expect(Booking.create({
        eventId: fakeEventId,
        email: 'test@example.com',
      })).rejects.toThrow()
    })

    it('should only validate on new or modified eventId', async () => {
      const booking = await Booking.create({
        eventId: testEventId,
        email: 'original@example.com',
      })

      // Modify only email (not eventId)
      booking.email = 'updated@example.com'
      await expect(booking.save()).resolves.toBeTruthy()
    })
  })

  describe('Deletion Operations', () => {
    it('should delete booking successfully', async () => {
      const booking = await Booking.create({
        eventId: testEventId,
        email: 'test@example.com',
      })

      await Booking.findByIdAndDelete(booking._id)

      const found = await Booking.findById(booking._id)
      expect(found).toBeNull()
    })

    it('should allow deleting all bookings for an event', async () => {
      await Booking.create({
        eventId: testEventId,
        email: 'user1@example.com',
      })

      await Booking.create({
        eventId: testEventId,
        email: 'user2@example.com',
      })

      await Booking.deleteMany({ eventId: testEventId })

      const bookings = await Booking.find({ eventId: testEventId })
      expect(bookings).toHaveLength(0)
    })
  })
})