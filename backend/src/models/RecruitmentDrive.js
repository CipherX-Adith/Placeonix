const mongoose = require('mongoose');

const recruitmentDriveSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide drive title'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    academicYear: {
      type: String,
      default: '2025-2026',
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    eligibleBranches: {
      type: [String],
      default: [],
    },
    minCgpa: {
      type: Number,
      default: 6.0,
    },
    status: {
      type: String,
      enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
      default: 'upcoming',
    },
    coordinatorName: {
      type: String,
      default: 'Placement Cell',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('RecruitmentDrive', recruitmentDriveSchema);
