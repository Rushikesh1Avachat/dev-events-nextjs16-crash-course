const RUN_DB_TESTS = process.env.RUN_DB_TESTS === 'true'
const describeIf = (cond: boolean) => (cond ? describe : describe.skip)
import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import Event from '@/database/event.model'
import type { IEvent } from '@/database/event.model'

describeIf(RUN_DB_TESTS)('Event Model', () => {
  let mongoServer: MongoMemoryServer

  beforeAll(async () => {
    // Setup in-memory MongoDB
    mongoServer = await MongoMemoryServer.create()
    const mongoUri = mongoServer.getUri()
    await mongoose.connect(mongoUri)
  })

  afterAll(async () => {
    await mongoose.disconnect()
    await mongoServer.stop()
  })

  afterEach(async () => {
    // Clean up after each test
    await Event.deleteMany({})
  })

  describe('Schema Validation - Happy Path', () => {
    it('should create event with all required fields', async () => {
      const eventData = {
        title: 'Test Conference 2025',
        description: 'A great conference about testing',
        overview: 'Learn about testing best practices',
        image: '/images/test-event.png',
        venue: 'Convention Center',
        location: 'San Francisco, CA',
        date: '2025-12-01',
        time: '09:00',
        mode: 'In-person',
        audience: 'Developers',
        agenda: ['Opening keynote', 'Technical sessions', 'Networking'],
        organizer: 'Test Org',
        tags: ['testing', 'conference', 'tech'],
      }

      const event = await Event.create(eventData)

      expect(event._id).toBeDefined()
      expect(event.title).toBe(eventData.title)
      expect(event.description).toBe(eventData.description)
      expect(event.slug).toBe('test-conference-2025')
      expect(event.createdAt).toBeDefined()
      expect(event.updatedAt).toBeDefined()
    })

    it('should auto-generate slug from title', async () => {
      const event = await Event.create({
        title: 'React Summit 2025',
        description: 'React conference',
        overview: 'All about React',
        image: '/images/react.png',
        venue: 'Tech Center',
        location: 'New York, NY',
        date: '2025-11-15',
        time: '10:00',
        mode: 'Hybrid',
        audience: 'React Developers',
        agenda: ['React 19 features'],
        organizer: 'React Team',
        tags: ['react', 'javascript'],
      })

      expect(event.slug).toBe('react-summit-2025')
    })

    it('should normalize date to ISO format', async () => {
      const event = await Event.create({
        title: 'Date Test Event',
        description: 'Testing date normalization',
        overview: 'Date testing',
        image: '/images/test.png',
        venue: 'Test Venue',
        location: 'Test City, TC',
        date: '2025-12-25',
        time: '14:30',
        mode: 'Online',
        audience: 'Everyone',
        agenda: ['Session 1'],
        organizer: 'Test Org',
        tags: ['test'],
      })

      expect(event.date).toBe('2025-12-25')
    })
  })

  describe('Slug Generation', () => {
    it('should convert title to lowercase slug', async () => {
      const event = await Event.create({
        title: 'UPPERCASE TITLE',
        description: 'desc',
        overview: 'overview',
        image: '/images/test.png',
        venue: 'venue',
        location: 'location',
        date: '2025-12-01',
        time: '10:00',
        mode: 'Online',
        audience: 'All',
        agenda: ['item'],
        organizer: 'org',
        tags: ['tag'],
      })

      expect(event.slug).toBe('uppercase-title')
    })

    it('should replace spaces with hyphens', async () => {
      const event = await Event.create({
        title: 'Multi Word Title',
        description: 'desc',
        overview: 'overview',
        image: '/images/test.png',
        venue: 'venue',
        location: 'location',
        date: '2025-12-01',
        time: '10:00',
        mode: 'Online',
        audience: 'All',
        agenda: ['item'],
        organizer: 'org',
        tags: ['tag'],
      })

      expect(event.slug).toBe('multi-word-title')
    })

    it('should remove special characters', async () => {
      const event = await Event.create({
        title: 'Event: 2025 @ #Tech!',
        description: 'desc',
        overview: 'overview',
        image: '/images/test.png',
        venue: 'venue',
        location: 'location',
        date: '2025-12-01',
        time: '10:00',
        mode: 'Online',
        audience: 'All',
        agenda: ['item'],
        organizer: 'org',
        tags: ['tag'],
      })

      expect(event.slug).toBe('event-2025-tech')
    })

    it('should remove leading and trailing hyphens', async () => {
      const event = await Event.create({
        title: '---Event---',
        description: 'desc',
        overview: 'overview',
        image: '/images/test.png',
        venue: 'venue',
        location: 'location',
        date: '2025-12-01',
        time: '10:00',
        mode: 'Online',
        audience: 'All',
        agenda: ['item'],
        organizer: 'org',
        tags: ['tag'],
      })

      expect(event.slug).toBe('event')
    })

    it('should replace multiple hyphens with single hyphen', async () => {
      const event = await Event.create({
        title: 'Multiple   Spaces   Event',
        description: 'desc',
        overview: 'overview',
        image: '/images/test.png',
        venue: 'venue',
        location: 'location',
        date: '2025-12-01',
        time: '10:00',
        mode: 'Online',
        audience: 'All',
        agenda: ['item'],
        organizer: 'org',
        tags: ['tag'],
      })

      expect(event.slug).toBe('multiple-spaces-event')
    })

    it('should trim whitespace before generating slug', async () => {
      const event = await Event.create({
        title: '  Trimmed Title  ',
        description: 'desc',
        overview: 'overview',
        image: '/images/test.png',
        venue: 'venue',
        location: 'location',
        date: '2025-12-01',
        time: '10:00',
        mode: 'Online',
        audience: 'All',
        agenda: ['item'],
        organizer: 'org',
        tags: ['tag'],
      })

      expect(event.slug).toBe('trimmed-title')
    })
  })

  describe('Required Field Validation', () => {
    const baseEvent = {
      title: 'Test Event',
      description: 'Description',
      overview: 'Overview',
      image: '/images/test.png',
      venue: 'Venue',
      location: 'Location',
      date: '2025-12-01',
      time: '10:00',
      mode: 'Online',
      audience: 'All',
      agenda: ['Item 1'],
      organizer: 'Organizer',
      tags: ['tag1'],
    }

    it('should require title', async () => {
      const eventData = { ...baseEvent }
      delete (eventData as any).title

      await expect(Event.create(eventData)).rejects.toThrow()
    })

    it('should require description', async () => {
      const eventData = { ...baseEvent }
      delete (eventData as any).description

      await expect(Event.create(eventData)).rejects.toThrow()
    })

    it('should require overview', async () => {
      const eventData = { ...baseEvent }
      delete (eventData as any).overview

      await expect(Event.create(eventData)).rejects.toThrow()
    })

    it('should require image', async () => {
      const eventData = { ...baseEvent }
      delete (eventData as any).image

      await expect(Event.create(eventData)).rejects.toThrow()
    })

    it('should require venue', async () => {
      const eventData = { ...baseEvent }
      delete (eventData as any).venue

      await expect(Event.create(eventData)).rejects.toThrow()
    })

    it('should require location', async () => {
      const eventData = { ...baseEvent }
      delete (eventData as any).location

      await expect(Event.create(eventData)).rejects.toThrow()
    })

    it('should require date', async () => {
      const eventData = { ...baseEvent }
      delete (eventData as any).date

      await expect(Event.create(eventData)).rejects.toThrow()
    })

    it('should require time', async () => {
      const eventData = { ...baseEvent }
      delete (eventData as any).time

      await expect(Event.create(eventData)).rejects.toThrow()
    })

    it('should require mode', async () => {
      const eventData = { ...baseEvent }
      delete (eventData as any).mode

      await expect(Event.create(eventData)).rejects.toThrow()
    })

    it('should require audience', async () => {
      const eventData = { ...baseEvent }
      delete (eventData as any).audience

      await expect(Event.create(eventData)).rejects.toThrow()
    })

    it('should require agenda', async () => {
      const eventData = { ...baseEvent }
      delete (eventData as any).agenda

      await expect(Event.create(eventData)).rejects.toThrow()
    })

    it('should require organizer', async () => {
      const eventData = { ...baseEvent }
      delete (eventData as any).organizer

      await expect(Event.create(eventData)).rejects.toThrow()
    })

    it('should require tags', async () => {
      const eventData = { ...baseEvent }
      delete (eventData as any).tags

      await expect(Event.create(eventData)).rejects.toThrow()
    })
  })

  describe('Array Validation', () => {
    it('should require at least one agenda item', async () => {
      await expect(Event.create({
        title: 'Test',
        description: 'desc',
        overview: 'overview',
        image: '/images/test.png',
        venue: 'venue',
        location: 'location',
        date: '2025-12-01',
        time: '10:00',
        mode: 'Online',
        audience: 'All',
        agenda: [],
        organizer: 'org',
        tags: ['tag'],
      })).rejects.toThrow()
    })

    it('should require at least one tag', async () => {
      await expect(Event.create({
        title: 'Test',
        description: 'desc',
        overview: 'overview',
        image: '/images/test.png',
        venue: 'venue',
        location: 'location',
        date: '2025-12-01',
        time: '10:00',
        mode: 'Online',
        audience: 'All',
        agenda: ['item'],
        organizer: 'org',
        tags: [],
      })).rejects.toThrow()
    })

    it('should accept multiple agenda items', async () => {
      const event = await Event.create({
        title: 'Test',
        description: 'desc',
        overview: 'overview',
        image: '/images/test.png',
        venue: 'venue',
        location: 'location',
        date: '2025-12-01',
        time: '10:00',
        mode: 'Online',
        audience: 'All',
        agenda: ['Item 1', 'Item 2', 'Item 3'],
        organizer: 'org',
        tags: ['tag'],
      })

      expect(event.agenda).toHaveLength(3)
    })

    it('should accept multiple tags', async () => {
      const event = await Event.create({
        title: 'Test',
        description: 'desc',
        overview: 'overview',
        image: '/images/test.png',
        venue: 'venue',
        location: 'location',
        date: '2025-12-01',
        time: '10:00',
        mode: 'Online',
        audience: 'All',
        agenda: ['item'],
        organizer: 'org',
        tags: ['tag1', 'tag2', 'tag3'],
      })

      expect(event.tags).toHaveLength(3)
    })
  })

  describe('Time Validation', () => {
    it('should accept valid time in HH:MM format', async () => {
      const event = await Event.create({
        title: 'Test',
        description: 'desc',
        overview: 'overview',
        image: '/images/test.png',
        venue: 'venue',
        location: 'location',
        date: '2025-12-01',
        time: '14:30',
        mode: 'Online',
        audience: 'All',
        agenda: ['item'],
        organizer: 'org',
        tags: ['tag'],
      })

      expect(event.time).toBe('14:30')
    })

    it('should reject invalid time format', async () => {
      await expect(Event.create({
        title: 'Test',
        description: 'desc',
        overview: 'overview',
        image: '/images/test.png',
        venue: 'venue',
        location: 'location',
        date: '2025-12-01',
        time: '25:00',
        mode: 'Online',
        audience: 'All',
        agenda: ['item'],
        organizer: 'org',
        tags: ['tag'],
      })).rejects.toThrow()
    })

    it('should reject time without colon', async () => {
      await expect(Event.create({
        title: 'Test',
        description: 'desc',
        overview: 'overview',
        image: '/images/test.png',
        venue: 'venue',
        location: 'location',
        date: '2025-12-01',
        time: '1400',
        mode: 'Online',
        audience: 'All',
        agenda: ['item'],
        organizer: 'org',
        tags: ['tag'],
      })).rejects.toThrow()
    })
  })

  describe('Date Validation', () => {
    it('should accept valid ISO date', async () => {
      const event = await Event.create({
        title: 'Test',
        description: 'desc',
        overview: 'overview',
        image: '/images/test.png',
        venue: 'venue',
        location: 'location',
        date: '2025-12-31',
        time: '10:00',
        mode: 'Online',
        audience: 'All',
        agenda: ['item'],
        organizer: 'org',
        tags: ['tag'],
      })

      expect(event.date).toBe('2025-12-31')
    })

    it('should reject invalid date', async () => {
      await expect(Event.create({
        title: 'Test',
        description: 'desc',
        overview: 'overview',
        image: '/images/test.png',
        venue: 'venue',
        location: 'location',
        date: 'invalid-date',
        time: '10:00',
        mode: 'Online',
        audience: 'All',
        agenda: ['item'],
        organizer: 'org',
        tags: ['tag'],
      })).rejects.toThrow()
    })
  })

  describe('Slug Uniqueness', () => {
    it('should enforce unique slugs', async () => {
      await Event.create({
        title: 'Same Title',
        description: 'desc1',
        overview: 'overview1',
        image: '/images/test1.png',
        venue: 'venue1',
        location: 'location1',
        date: '2025-12-01',
        time: '10:00',
        mode: 'Online',
        audience: 'All',
        agenda: ['item'],
        organizer: 'org',
        tags: ['tag'],
      })

      await expect(Event.create({
        title: 'Same Title',
        description: 'desc2',
        overview: 'overview2',
        image: '/images/test2.png',
        venue: 'venue2',
        location: 'location2',
        date: '2025-12-02',
        time: '11:00',
        mode: 'Online',
        audience: 'All',
        agenda: ['item'],
        organizer: 'org',
        tags: ['tag'],
      })).rejects.toThrow()
    })
  })

  describe('String Trimming', () => {
    it('should trim whitespace from title', async () => {
      const event = await Event.create({
        title: '  Trimmed Title  ',
        description: 'desc',
        overview: 'overview',
        image: '/images/test.png',
        venue: 'venue',
        location: 'location',
        date: '2025-12-01',
        time: '10:00',
        mode: 'Online',
        audience: 'All',
        agenda: ['item'],
        organizer: 'org',
        tags: ['tag'],
      })

      expect(event.title).toBe('Trimmed Title')
    })

    it('should trim whitespace from all string fields', async () => {
      const event = await Event.create({
        title: '  Title  ',
        description: '  Description  ',
        overview: '  Overview  ',
        image: '  /images/test.png  ',
        venue: '  Venue  ',
        location: '  Location  ',
        date: '2025-12-01',
        time: '10:00',
        mode: '  Online  ',
        audience: '  All  ',
        agenda: ['item'],
        organizer: '  Org  ',
        tags: ['tag'],
      })

      expect(event.title).toBe('Title')
      expect(event.description).toBe('Description')
      expect(event.overview).toBe('Overview')
      expect(event.image).toBe('/images/test.png')
      expect(event.venue).toBe('Venue')
      expect(event.location).toBe('Location')
      expect(event.mode).toBe('Online')
      expect(event.audience).toBe('All')
      expect(event.organizer).toBe('Org')
    })
  })

  describe('Timestamps', () => {
    it('should auto-generate createdAt timestamp', async () => {
      const event = await Event.create({
        title: 'Test',
        description: 'desc',
        overview: 'overview',
        image: '/images/test.png',
        venue: 'venue',
        location: 'location',
        date: '2025-12-01',
        time: '10:00',
        mode: 'Online',
        audience: 'All',
        agenda: ['item'],
        organizer: 'org',
        tags: ['tag'],
      })

      expect(event.createdAt).toBeInstanceOf(Date)
    })

    it('should auto-generate updatedAt timestamp', async () => {
      const event = await Event.create({
        title: 'Test',
        description: 'desc',
        overview: 'overview',
        image: '/images/test.png',
        venue: 'venue',
        location: 'location',
        date: '2025-12-01',
        time: '10:00',
        mode: 'Online',
        audience: 'All',
        agenda: ['item'],
        organizer: 'org',
        tags: ['tag'],
      })

      expect(event.updatedAt).toBeInstanceOf(Date)
    })

    it('should update updatedAt on modification', async () => {
      const event = await Event.create({
        title: 'Original Title',
        description: 'desc',
        overview: 'overview',
        image: '/images/test.png',
        venue: 'venue',
        location: 'location',
        date: '2025-12-01',
        time: '10:00',
        mode: 'Online',
        audience: 'All',
        agenda: ['item'],
        organizer: 'org',
        tags: ['tag'],
      })

      const originalUpdatedAt = event.updatedAt

      // Wait a bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 10))

      event.title = 'Updated Title'
      await event.save()

      expect(event.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime())
    })
  })

  describe('Query Operations', () => {
    it('should find event by slug', async () => {
      await Event.create({
        title: 'Findable Event',
        description: 'desc',
        overview: 'overview',
        image: '/images/test.png',
        venue: 'venue',
        location: 'location',
        date: '2025-12-01',
        time: '10:00',
        mode: 'Online',
        audience: 'All',
        agenda: ['item'],
        organizer: 'org',
        tags: ['tag'],
      })

      const found = await Event.findOne({ slug: 'findable-event' })
      expect(found).toBeTruthy()
      expect(found?.title).toBe('Findable Event')
    })

    it('should use index on slug for efficient queries', async () => {
      const indexes = Event.schema.indexes()
      const slugIndex = indexes.find(index => 
        index[0].slug !== undefined
      )
      expect(slugIndex).toBeDefined()
    })
  })
})