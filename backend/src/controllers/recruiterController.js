const RecruiterProfile = require('../models/RecruiterProfile');
const Company = require('../models/Company');
const Job = require('../models/Job');
const Application = require('../models/Application');
const Notification = require('../models/Notification');
const RecruitmentDrive = require('../models/RecruitmentDrive');

// @desc    Get recruiter profile & company
// @route   GET /api/recruiter/profile
// @access  Private (Recruiter)
exports.getProfile = async (req, res, next) => {
  try {
    let profile = await RecruiterProfile.findOne({ user: req.user.id })
      .populate('user', 'name email role')
      .populate('company');

    if (!profile) {
      profile = await RecruiterProfile.create({ user: req.user.id });
    }

    res.status(200).json({
      success: true,
      profile,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update recruiter profile and company information
// @route   PUT /api/recruiter/profile
// @access  Private (Recruiter)
exports.updateProfile = async (req, res, next) => {
  try {
    const {
      designation,
      phone,
      companyName,
      website,
      industry,
      description,
      location,
    } = req.body;

    let profile = await RecruiterProfile.findOne({ user: req.user.id });

    // Handle company
    let companyDoc;
    if (profile && profile.company) {
      companyDoc = await Company.findById(profile.company);
    }

    if (companyName) {
      if (companyDoc) {
        companyDoc.name = companyName.trim();
        if (website !== undefined) companyDoc.website = website.trim();
        if (industry !== undefined) companyDoc.industry = industry.trim();
        if (description !== undefined) companyDoc.description = description.trim();
        if (location !== undefined) companyDoc.location = location.trim();
        await companyDoc.save();
      } else {
        companyDoc = await Company.create({
          name: companyName.trim(),
          website: website || '',
          industry: industry || 'Information Technology',
          description: description || '',
          location: location || '',
          createdBy: req.user.id,
          verifiedStatus: 'pending',
        });
      }
    }

    profile = await RecruiterProfile.findOneAndUpdate(
      { user: req.user.id },
      {
        $set: {
          designation: designation || 'Technical Recruiter',
          phone: phone || '',
          company: companyDoc ? companyDoc._id : profile ? profile.company : null,
        },
      },
      { new: true, upsert: true }
    )
      .populate('user', 'name email role')
      .populate('company');

    res.status(200).json({
      success: true,
      message: 'Profile and company updated successfully',
      profile,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new Job Posting
// @route   POST /api/recruiter/jobs
// @access  Private (Recruiter)
exports.createJob = async (req, res, next) => {
  try {
    const profile = await RecruiterProfile.findOne({ user: req.user.id });
    if (!profile || !profile.company) {
      return res.status(400).json({
        success: false,
        message: 'Please complete your company profile before posting jobs.',
      });
    }

    const company = await Company.findById(profile.company);
    if (!company) {
      return res.status(400).json({
        success: false,
        message: 'Company profile not found.',
      });
    }

    const {
      title,
      role,
      jobType,
      location,
      packageCtc,
      description,
      requirements,
      skillsRequired,
      minCgpa,
      maxBacklogs,
      eligibleBranches,
      eligiblePassingYears,
      deadline,
      driveId,
    } = req.body;

    if (!title || !packageCtc || !description || !deadline) {
      return res.status(400).json({
        success: false,
        message: 'Please provide title, package (CTC), description, and application deadline.',
      });
    }

    // Parse array fields
    const reqArray = Array.isArray(requirements)
      ? requirements
      : typeof requirements === 'string'
      ? requirements.split('\n').map((s) => s.trim()).filter(Boolean)
      : [];

    const skillsArray = Array.isArray(skillsRequired)
      ? skillsRequired
      : typeof skillsRequired === 'string'
      ? skillsRequired.split(',').map((s) => s.trim()).filter(Boolean)
      : [];

    const branchArray = Array.isArray(eligibleBranches)
      ? eligibleBranches
      : typeof eligibleBranches === 'string'
      ? eligibleBranches.split(',').map((s) => s.trim()).filter(Boolean)
      : [
          'Computer Science and Engineering',
          'Information Technology',
          'Electronics and Communication Engineering',
          'Artificial Intelligence & Data Science',
        ];

    const job = await Job.create({
      title,
      company: company._id,
      postedBy: req.user.id,
      role: role || 'Software Engineer',
      jobType: jobType || 'Full-time',
      location: location || company.location || 'Multiple / On-site',
      packageCtc,
      description,
      requirements: reqArray,
      skillsRequired: skillsArray,
      minCgpa: minCgpa !== undefined ? Number(minCgpa) : 6.0,
      maxBacklogs: maxBacklogs !== undefined ? Number(maxBacklogs) : 0,
      eligibleBranches: branchArray,
      eligiblePassingYears: eligiblePassingYears || [2026],
      deadline: new Date(deadline),
      drive: driveId || null,
      status: 'active',
    });

    res.status(201).json({
      success: true,
      message: 'Job opening posted successfully!',
      job,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all jobs posted by current recruiter
// @route   GET /api/recruiter/jobs
// @access  Private (Recruiter)
exports.getMyJobs = async (req, res, next) => {
  try {
    const jobs = await Job.find({ postedBy: req.user.id })
      .populate('company', 'name website verifiedStatus logoUrl')
      .populate('drive', 'title startDate endDate')
      .sort({ createdAt: -1 });

    // Attach applicant counts
    const jobsWithCounts = await Promise.all(
      jobs.map(async (job) => {
        const applicantCount = await Application.countDocuments({ job: job._id });
        const shortlistedCount = await Application.countDocuments({
          job: job._id,
          status: { $in: ['shortlisted', 'interview', 'selected'] },
        });
        const selectedCount = await Application.countDocuments({
          job: job._id,
          status: 'selected',
        });

        return {
          ...job.toObject(),
          stats: {
            totalApplicants: applicantCount,
            shortlisted: shortlistedCount,
            selected: selectedCount,
          },
        };
      })
    );

    res.status(200).json({
      success: true,
      count: jobsWithCounts.length,
      jobs: jobsWithCounts,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get applicants for a specific job
// @route   GET /api/recruiter/jobs/:jobId/applicants
// @access  Private (Recruiter)
exports.getJobApplicants = async (req, res, next) => {
  try {
    const { jobId } = req.params;
    const { status, branch, minCgpa } = req.query;

    const job = await Job.findById(jobId).populate('company', 'name');
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job posting not found.',
      });
    }

    let filter = { job: jobId };
    if (status) {
      filter.status = status;
    }

    const applications = await Application.find(filter)
      .populate('student', 'name email')
      .populate('studentProfile')
      .sort({ appliedAt: -1 });

    // Client/query filtering for populated fields
    let filteredApps = applications;
    if (branch) {
      filteredApps = filteredApps.filter(
        (app) => app.studentProfile && app.studentProfile.branch === branch
      );
    }
    if (minCgpa) {
      filteredApps = filteredApps.filter(
        (app) => app.studentProfile && app.studentProfile.cgpa >= Number(minCgpa)
      );
    }

    res.status(200).json({
      success: true,
      job,
      count: filteredApps.length,
      applicants: filteredApps,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update applicant status – STATE MACHINE ENFORCED
// @route   PUT /api/recruiter/applications/:applicationId/status
// @access  Private (Recruiter)
exports.updateApplicationStatus = async (req, res, next) => {
  try {
    const { applicationId } = req.params;
    const { status, feedback, interviewDate, interviewMode, interviewLink, recruiterNotes } = req.body;

    const application = await Application.findById(applicationId)
      .populate('job', 'title company postedBy')
      .populate('student', 'name email');

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }

    // Verify recruiter owns this job
    const job = await require('../models/Job').findById(application.job._id);
    if (!job || job.postedBy.toString() !== req.user.id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this application.' });
    }

    // Enforce state machine
    if (!application.canTransitionTo(status)) {
      const allowed = Application.VALID_TRANSITIONS[application.status] || [];
      return res.status(400).json({
        success: false,
        message: `Cannot move from '${application.status}' to '${status}'. Allowed next: [${allowed.join(', ')}]`,
      });
    }

    // Capture stage timestamps
    const now = new Date();
    if (status === 'under_review')  application.reviewedAt   = now;
    if (status === 'shortlisted')   application.shortlistedAt = now;
    if (status === 'interview')     application.interviewAt  = now;
    if (['selected', 'rejected', 'withdrawn'].includes(status)) application.resolvedAt = now;

    application.status = status;
    if (feedback !== undefined)       application.feedback = feedback;
    if (interviewDate)                application.interviewDate = new Date(interviewDate);
    if (interviewMode !== undefined)  application.interviewMode = interviewMode;
    if (interviewLink !== undefined)  application.interviewLink = interviewLink;
    if (recruiterNotes !== undefined) application.recruiterNotes = recruiterNotes;

    await application.save();

    // Build student notification
    const messages = {
      under_review:  { title: 'Application Under Review', msg: `Your application for '${application.job.title}' is now under review.` },
      shortlisted:   { title: '🎉 You are Shortlisted!', msg: `Congratulations! You have been shortlisted for '${application.job.title}'.` },
      interview:     { title: '📅 Interview Scheduled', msg: `Interview scheduled for '${application.job.title}'${interviewDate ? ` on ${new Date(interviewDate).toLocaleDateString()}` : ''}. ${interviewMode ? `Mode: ${interviewMode}` : ''}` },
      selected:      { title: '🌟 You are Selected!', msg: `Congratulations! You have been selected for '${application.job.title}'. Expect further communication.` },
      rejected:      { title: 'Application Update', msg: `Thank you for applying to '${application.job.title}'. Unfortunately, you were not selected at this time.` },
    };

    const notif = messages[status];
    if (notif) {
      await Notification.create({
        recipient: application.student._id,
        title: notif.title,
        message: notif.msg,
        type: 'application_update',
        link: '/student-dashboard.html#applications',
      });
    }

    res.status(200).json({
      success: true,
      message: `Status updated to '${status}'.`,
      application,
    });
  } catch (error) { next(error); }
};

// @desc    Toggle job status (active / closed)
// @route   PUT /api/recruiter/jobs/:jobId/status
// @access  Private (Recruiter)
exports.toggleJobStatus = async (req, res, next) => {
  try {
    const { jobId } = req.params;
    const { status } = req.body;

    const job = await Job.findOne({ _id: jobId, postedBy: req.user.id });
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job posting not found.',
      });
    }

    job.status = status || (job.status === 'active' ? 'closed' : 'active');
    await job.save();

    res.status(200).json({
      success: true,
      message: `Job status updated to '${job.status}'.`,
      job,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get recruiter dashboard summary
// @route   GET /api/recruiter/dashboard-summary
// @access  Private (Recruiter)
exports.getDashboardSummary = async (req, res, next) => {
  try {
    const profile = await RecruiterProfile.findOne({ user: req.user.id }).populate('company');
    const jobs = await Job.find({ postedBy: req.user.id });
    const jobIds = jobs.map((j) => j._id);

    const totalJobs = jobs.length;
    const activeJobs = jobs.filter((j) => j.status === 'active').length;
    const totalApplications = await Application.countDocuments({ job: { $in: jobIds } });
    const shortlistedCandidates = await Application.countDocuments({
      job: { $in: jobIds },
      status: { $in: ['shortlisted', 'interview'] },
    });
    const hiredCandidates = await Application.countDocuments({
      job: { $in: jobIds },
      status: 'selected',
    });

    res.status(200).json({
      success: true,
      metrics: {
        totalJobs,
        activeJobs,
        totalApplications,
        shortlistedCandidates,
        hiredCandidates,
        isCompanyVerified: profile?.company?.verifiedStatus === 'verified',
      },
      profile,
    });
  } catch (error) {
    next(error);
  }
};
