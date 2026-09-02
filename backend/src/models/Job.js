const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide a job title'],
      trim: true,
    },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'Job must be linked to a company'],
    },
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    drive: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RecruitmentDrive',
    },
    role: {
      type: String,
      default: 'Software Engineer',
    },
    jobType: {
      type: String,
      enum: ['Full-time', 'Internship', 'Internship + PPO', 'Contract'],
      default: 'Full-time',
    },
    location: {
      type: String,
      default: 'Hybrid / Multiple',
    },
    packageCtc: {
      type: String,
      required: [true, 'Please specify salary / CTC'],
      default: '6 - 10 LPA',
    },
    description: {
      type: String,
      required: [true, 'Please provide job description'],
    },
    requirements: {
      type: [String],
      default: [],
    },
    skillsRequired: {
      type: [String],
      default: [],
    },
    // Eligibility criteria
    minCgpa: {
      type: Number,
      default: 6.5,
    },
    maxBacklogs: {
      type: Number,
      default: 0,
    },
    eligibleBranches: {
      type: [String],
      default: [
        'Computer Science and Engineering',
        'Information Technology',
        'Electronics and Communication Engineering',
        'Artificial Intelligence & Data Science',
      ],
    },
    eligiblePassingYears: {
      type: [Number],
      default: [2026],
    },
    deadline: {
      type: Date,
      required: [true, 'Please provide application deadline'],
    },
    status: {
      type: String,
      enum: ['active', 'closed', 'draft'],
      default: 'active',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Job', jobSchema);
