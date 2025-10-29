import mongoose, { Schema, Document, Model, Types } from 'mongoose';

// TypeScript interface for Booking document
export interface IBooking extends Document {
  eventId: Types.ObjectId;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

// Booking schema definition
const BookingSchema = new Schema<IBooking>(
  {
    eventId: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
      required: [true, 'Event ID is required'],
      validate: {
        validator: async function (value: Types.ObjectId): Promise<boolean> {
          // Verify that the referenced event exists in the database
          const Event = mongoose.models.Event || mongoose.model('Event');
          const event = await Event.findById(value);
          return event !== null;
        },
        message: 'Referenced event does not exist',
      },
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
      validate: {
        validator: function (value: string): boolean {
          // Validate email format using regex
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          return emailRegex.test(value);
        },
        message: 'Please provide a valid email address',
      },
    },
  },
  {
    timestamps: true, // Automatically manage createdAt and updatedAt
  }
);

// Pre-save hook: Additional validation for event existence
BookingSchema.pre('save', async function (next) {
  const booking = this as IBooking;

  // Only validate eventId if it's modified or new
  if (booking.isModified('eventId') || booking.isNew) {
    try {
      const Event = mongoose.models.Event || mongoose.model('Event');
      const eventExists = await Event.findById(booking.eventId);

      if (!eventExists) {
        return next(new Error('Cannot create booking: Event does not exist'));
      }
    } catch (error) {
      return next(
        new Error('Event validation failed: ' + (error as Error).message)
      );
    }
  }

  next();
});

// Add index on eventId for faster queries
BookingSchema.index({ eventId: 1 });

// Create and export Booking model, preventing model recompilation in development
const Booking: Model<IBooking> =
  mongoose.models.Booking || mongoose.model<IBooking>('Booking', BookingSchema);

export default Booking;
