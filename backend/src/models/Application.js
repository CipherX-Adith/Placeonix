const mongoose = require('mongoose');

// Valid state machine transitions
const VALID_TRANSITIONS = {
  applied:            ['under_review', 'rejected', 'withdrawn'],
  under_review:       ['shortlisted', 'rejected'],
  shortlisted:        ['interview', 'rejected'],
  interview:          ['selected', 'rejected'],
  selected:           [],    // terminal
  rejected:           [],    // terminal
  withdrawn:          [],    // terminal
};

const applicationSchema = new mongoose.Schema(
  {
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      required: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    studentProfile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StudentProfile',
    },
    status: {
      type: String,
      enum: ['applied', 'under_review', 'shortlisted', 'interview', 'selected', 'rejected', 'withdrawn'],
      default: 'applied',
    },
    appliedAt:  { type: Date, default: Date.now },
    reviewedAt: { type: Date },
    shortlistedAt: { type: Date },
    interviewAt:   { type: Date },
    resolvedAt:    { type: Date },

    interviewDate: { type: Date },
    interviewMode: { type: String, default: '' },
    interviewLink: { type: String, default: '' },

    feedback:      { type: String, default: '' },
    resumeSnapshot:{ type: String, default: '' },

    // Documents requested by recruiter
    documentsRequested: [{ type: String }],
    documentsUploaded:  [{
      name: String,
      url:  String,
      uploadedAt: { type: Date, default: Date.now },
    }],

    // Recruiter notes (internal, not visible to student)
    recruiterNotes: { type: String, default: '' },
  },
  { timestamps: true }
);

// Prevent duplicate applications
applicationSchema.index({ job: 1, student: 1 }, { unique: true });

// State machine transition guard
applicationSchema.methods.canTransitionTo = function (newStatus) {
  const allowed = VALID_TRANSITIONS[this.status] || [];
  return allowed.includes(newStatus);
};

applicationSchema.statics.VALID_TRANSITIONS = VALID_TRANSITIONS;

module.exports = mongoose.model('Application', applicationSchema);
