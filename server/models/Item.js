import mongoose from 'mongoose';

const wardenLogsSchema = new mongoose.Schema(
  {
    matchedWithId: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', default: null },
    resolvedByWarden: { type: String, default: null },
    resolvedAt: { type: Date, default: null },
  },
  { _id: false }
);

const metadataSchema = new mongoose.Schema(
  {
    serialNumber: { type: String, default: null },
    associatedDepartment: { type: String, default: null },
  },
  { _id: false }
);

const itemSchema = new mongoose.Schema(
  {
    /**
     * reporterId — a free-form string identifying the submitter.
     * Stored as: rollOrEmployeeId (preferred) → email → user._id.toString().
     * Queried with $in on all three possible values in getMyItems.
     */
    sihId: { type: String, default: 'SIH1516', immutable: true },
    reporterId: { type: String, required: true, trim: true, index: true },
    type: {
      type: String,
      enum: ['personal', 'institutional'],
      required: true,
    },
    reportType: {
      type: String,
      enum: ['lost', 'found'],
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: [3, 'Title must be at least 3 characters.'],
      maxlength: [120, 'Title must be 120 characters or less.'],
    },
    category: {
      type: String,
      enum: ['Electronics', 'Documents', 'Wallets/Bags', 'Books', 'Sports Gear', 'Keys', 'Other'],
      required: true,
    },
    description: { type: String, trim: true, maxlength: 500 },
    location: { type: String, required: true, trim: true },
    timestamp: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ['unclaimed', 'claimed'],
      default: 'unclaimed',
    },
    metadata: { type: metadataSchema, default: () => ({}) },
    wardenLogs: { type: wardenLogsSchema, default: () => ({}) },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

// Index for fast active-item queries
itemSchema.index({ status: 1, reportType: 1, timestamp: -1 });

const Item = mongoose.model('Item', itemSchema);

export default Item;
