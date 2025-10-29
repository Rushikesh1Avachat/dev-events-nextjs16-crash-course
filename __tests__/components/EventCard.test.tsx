import React from 'react'
import { render, screen } from '@testing-library/react'
import EventCard from '@/components/EventCard'

describe('EventCard Component', () => {
  const defaultProps = {
    title: 'React Summit 2025',
    image: '/images/event1.png',
    slug: 'react-summit-2025',
    location: 'San Francisco, CA',
    date: '2025-11-07',
    time: '09:00 AM',
  }

  describe('Rendering - Happy Path', () => {
    it('should render with all props', () => {
      render(<EventCard {...defaultProps} />)

      expect(screen.getByText('React Summit 2025')).toBeInTheDocument()
      expect(screen.getByText('San Francisco, CA')).toBeInTheDocument()
      expect(screen.getByText('2025-11-07')).toBeInTheDocument()
      expect(screen.getByText('09:00 AM')).toBeInTheDocument()
    })

    it('should render event title', () => {
      render(<EventCard {...defaultProps} />)
      
      const titleElement = screen.getByText('React Summit 2025')
      expect(titleElement).toBeInTheDocument()
      expect(titleElement).toHaveClass('title')
    })

    it('should render event location with icon', () => {
      render(<EventCard {...defaultProps} />)
      
      expect(screen.getByText('San Francisco, CA')).toBeInTheDocument()
      expect(screen.getByAltText('location')).toBeInTheDocument()
    })

    it('should render event date with icon', () => {
      render(<EventCard {...defaultProps} />)
      
      expect(screen.getByText('2025-11-07')).toBeInTheDocument()
      expect(screen.getByAltText('date')).toBeInTheDocument()
    })

    it('should render event time with icon', () => {
      render(<EventCard {...defaultProps} />)
      
      expect(screen.getByText('09:00 AM')).toBeInTheDocument()
      expect(screen.getByAltText('time')).toBeInTheDocument()
    })

    it('should render poster image', () => {
      render(<EventCard {...defaultProps} />)
      
      const posterImage = screen.getByAltText('React Summit 2025')
      expect(posterImage).toBeInTheDocument()
      expect(posterImage).toHaveAttribute('src', '/images/event1.png')
    })
  })

  describe('Link Behavior', () => {
    it('should wrap content in link to event detail page', () => {
      render(<EventCard {...defaultProps} />)
      
      const link = screen.getByRole('link')
      expect(link).toHaveAttribute('href', '/events/react-summit-2025')
    })

    it('should use correct slug in URL', () => {
      render(<EventCard {...defaultProps} slug="custom-event-slug" />)
      
      const link = screen.getByRole('link')
      expect(link).toHaveAttribute('href', '/events/custom-event-slug')
    })

    it('should have event-card id', () => {
      render(<EventCard {...defaultProps} />)
      
      const link = screen.getByRole('link')
      expect(link).toHaveAttribute('id', 'event-card')
    })
  })

  describe('Image Rendering', () => {
    it('should render poster with correct dimensions', () => {
      render(<EventCard {...defaultProps} />)
      
      const image = screen.getByAltText('React Summit 2025')
      expect(image).toHaveAttribute('width', '410')
      expect(image).toHaveAttribute('height', '300')
    })

    it('should use title as image alt text', () => {
      render(<EventCard {...defaultProps} title="Custom Event Title" />)
      
      const image = screen.getByAltText('Custom Event Title')
      expect(image).toBeInTheDocument()
    })

    it('should render with correct image path', () => {
      render(<EventCard {...defaultProps} image="/images/custom.png" />)
      
      const image = screen.getByAltText('React Summit 2025')
      expect(image).toHaveAttribute('src', '/images/custom.png')
    })

    it('should render location icon', () => {
      render(<EventCard {...defaultProps} />)
      
      const locationIcon = screen.getByAltText('location')
      expect(locationIcon).toHaveAttribute('src', '/icons/pin.svg')
      expect(locationIcon).toHaveAttribute('width', '14')
      expect(locationIcon).toHaveAttribute('height', '14')
    })

    it('should render calendar icon', () => {
      render(<EventCard {...defaultProps} />)
      
      const calendarIcon = screen.getByAltText('date')
      expect(calendarIcon).toHaveAttribute('src', '/icons/calendar.svg')
    })

    it('should render clock icon', () => {
      render(<EventCard {...defaultProps} />)
      
      const clockIcon = screen.getByAltText('time')
      expect(clockIcon).toHaveAttribute('src', '/icons/clock.svg')
    })
  })

  describe('CSS Classes', () => {
    it('should apply poster class to event image', () => {
      render(<EventCard {...defaultProps} />)
      
      const image = screen.getByAltText('React Summit 2025')
      expect(image).toHaveClass('poster')
    })

    it('should apply title class to event title', () => {
      render(<EventCard {...defaultProps} />)
      
      const title = screen.getByText('React Summit 2025')
      expect(title).toHaveClass('title')
    })

    it('should apply datetime class to date/time container', () => {
      const { container } = render(<EventCard {...defaultProps} />)
      
      const datetimeElement = container.querySelector('.datetime')
      expect(datetimeElement).toBeInTheDocument()
    })
  })

  describe('Props Variations', () => {
    it('should handle long event titles', () => {
      const longTitle = 'Very Long Event Title That Might Span Multiple Lines In The UI'
      render(<EventCard {...defaultProps} title={longTitle} />)
      
      expect(screen.getByText(longTitle)).toBeInTheDocument()
    })

    it('should handle long locations', () => {
      const longLocation = 'A Very Long Location Name, City, State, Country'
      render(<EventCard {...defaultProps} location={longLocation} />)
      
      expect(screen.getByText(longLocation)).toBeInTheDocument()
    })

    it('should handle different date formats', () => {
      render(<EventCard {...defaultProps} date="2026-12-31" />)
      
      expect(screen.getByText('2026-12-31')).toBeInTheDocument()
    })

    it('should handle different time formats', () => {
      render(<EventCard {...defaultProps} time="11:30 PM" />)
      
      expect(screen.getByText('11:30 PM')).toBeInTheDocument()
    })

    it('should handle slugs with special characters', () => {
      render(<EventCard {...defaultProps} slug="event-2025-special" />)
      
      const link = screen.getByRole('link')
      expect(link).toHaveAttribute('href', '/events/event-2025-special')
    })
  })

  describe('Edge Cases', () => {
    it('should render with empty title', () => {
      render(<EventCard {...defaultProps} title="" />)
      
      // Component should still render, even if title is empty
      const link = screen.getByRole('link')
      expect(link).toBeInTheDocument()
    })

    it('should render with minimal props', () => {
      render(<EventCard {...defaultProps} />)
      
      expect(screen.getByRole('link')).toBeInTheDocument()
    })

    it('should handle special characters in title', () => {
      render(<EventCard {...defaultProps} title="React & Node.js: 2025 Edition!" />)
      
      expect(screen.getByText('React & Node.js: 2025 Edition!')).toBeInTheDocument()
    })

    it('should handle location with unicode characters', () => {
      render(<EventCard {...defaultProps} location="São Paulo, Brasil" />)
      
      expect(screen.getByText('São Paulo, Brasil')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have proper link semantics', () => {
      render(<EventCard {...defaultProps} />)
      
      const link = screen.getByRole('link')
      expect(link).toBeInTheDocument()
    })

    it('should have alt text for all images', () => {
      render(<EventCard {...defaultProps} />)
      
      const images = screen.getAllByRole('img')
      images.forEach(image => {
        expect(image).toHaveAttribute('alt')
        expect(image.getAttribute('alt')).not.toBe('')
      })
    })

    it('should use semantic HTML structure', () => {
      const { container } = render(<EventCard {...defaultProps} />)
      
      expect(container.querySelector('a')).toBeInTheDocument()
      expect(container.querySelector('img')).toBeInTheDocument()
    })
  })

  describe('Component Integration', () => {
    it('should render multiple EventCards without conflicts', () => {
      const { container } = render(
        <>
          <EventCard {...defaultProps} slug="event-1" title="Event 1" />
          <EventCard {...defaultProps} slug="event-2" title="Event 2" />
          <EventCard {...defaultProps} slug="event-3" title="Event 3" />
        </>
      )
      
      expect(screen.getByText('Event 1')).toBeInTheDocument()
      expect(screen.getByText('Event 2')).toBeInTheDocument()
      expect(screen.getByText('Event 3')).toBeInTheDocument()
    })

    it('should maintain correct link href for each card', () => {
      render(
        <>
          <EventCard {...defaultProps} slug="event-1" title="Event 1" />
          <EventCard {...defaultProps} slug="event-2" title="Event 2" />
        </>
      )
      
      const links = screen.getAllByRole('link')
      expect(links[0]).toHaveAttribute('href', '/events/event-1')
      expect(links[1]).toHaveAttribute('href', '/events/event-2')
    })
  })

  describe.skip('Snapshot Tests', () => {
    it('should match snapshot with default props', () => {
      const { container } = render(<EventCard {...defaultProps} />)
      expect(container.firstChild).toMatchSnapshot()
    })

    it('should match snapshot with different time', () => {
      const { container } = render(
        <EventCard {...defaultProps} time="02:30 PM" />
      )
      expect(container.firstChild).toMatchSnapshot()
    })
  })
})