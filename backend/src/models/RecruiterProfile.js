const mongoose = require('mongoose');

const recruiterProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
    },
    designation: {
      type: String,
      trim: true,
      default: 'Technical Recruiter',
    },
    companyWebsite: {
      type: String,
      trim: true,
      default: '',
    },
    companySize: {
      type: String,
      trim: true,
      default: '51-200',
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('RecruiterProfile', recruiterProfileSchema);
