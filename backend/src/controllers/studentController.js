const StudentProfile = require('../models/StudentProfile');
const Job = require('../models/Job');
const Application = require('../models/Application');
const Notification = require('../models/Notification');
const User = require('../models/User');

/* =========================================================
   MATCH SCORE ENGINE
   Transparent, rule-based. Weights add to 100.

   Skills        40%  – requiredSkills ∩ studentSkills / requiredSkills.length
   Eligibility   25%  – CGPA, branch, backlogs, passing year (binary: all or nothing)
   Academics     15%  – CGPA normalised vs job minCgpa  (cgpa/10 * 15)
   Preferences   10%  – Location + jobType + role preference match
   Experience    10%  – Stub: partial credit based on skills count (improves later)
   ========================================================= */
const calculateMatchScore = (studentProfile, job) => {
  if (!studentProfile) {
    return {
      totalScore: 0,
      isEligible: false,
      eligibilityReasons: ['Profile not found'],
      breakdown: {},
    };
  }

  const studentSkillsLower = (studentProfile.skills || []).map((s) =>
    s.toLowerCase().trim()
  );
  const requiredSkills = (job.skillsRequired || []).map((s) =>
    s.toLowerCase().trim()
  );

  // ── 1. Skills (40%) ──────────────────────────────────────
  let skillsScore = 40; // full marks if no required skills
  let skillsMatched = [];
  let skillsMissing = [];

  if (requiredSkills.length > 0) {
    skillsMatched = requiredSkills.filter((s) =>
      studentSkillsLower.some(
        (ss) => ss.includes(s) || s.includes(ss)
      )
    );
    skillsMissing = requiredSkills.filter((s) => !skillsMatched.includes(s));
    skillsScore = Math.round((skillsMatched.length / requiredSkills.length) * 40);
  }

  // ── 2. Eligibility (25%) ─────────────────────────────────
  const eligibilityReasons = [];

  if (job.minCgpa && studentProfile.cgpa < job.minCgpa) {
    eligibilityReasons.push(
      `CGPA ${studentProfile.cgpa.toFixed(2)} is below required ${job.minCgpa}`
    );
  }
  if (
    job.eligibleBranches &&
    job.eligibleBranches.length > 0 &&
    !job.eligibleBranches.includes(studentProfile.branch)
  ) {
    eligibilityReasons.push(`Branch '${studentProfile.branch}' not in eligible list`);
  }
  if (
    job.maxBacklogs !== undefined &&
    studentProfile.backlogs > job.maxBacklogs
  ) {
    eligibilityReasons.push(
      `${studentProfile.backlogs} active backlog(s) exceed allowed max of ${job.maxBacklogs}`
    );
  }
  if (
    job.eligiblePassingYears &&
    job.eligiblePassingYears.length > 0 &&
    !job.eligiblePassingYears.includes(studentProfile.passingYear)
  ) {
    eligibilityReasons.push(`Batch ${studentProfile.passingYear} is not eligible`);
  }

  const isEligible = eligibilityReasons.length === 0;
  const eligibilityScore = isEligible ? 25 : 0;

  // ── 3. Academics (15%) ───────────────────────────────────
  const maxCgpa = 10;
  const cgpa = Math.min(studentProfile.cgpa || 0, maxCgpa);
  const academicsScore = Math.round((cgpa / maxCgpa) * 15);

  // ── 4. Preferences (10%) ────────────────────────────────
  const prefs = studentProfile.preferences || {};
  let prefHits = 0;
  let prefTotal = 0;

  if (prefs.locations && prefs.locations.length > 0) {
    prefTotal++;
    const jobLoc = (job.location || '').toLowerCase();
    if (prefs.locations.some((l) => jobLoc.includes(l.toLowerCase()))) prefHits++;
  }
  if (prefs.jobTypes && prefs.jobTypes.length > 0) {
    prefTotal++;
    if (prefs.jobTypes.includes(job.jobType)) prefHits++;
  }
  if (prefs.roles && prefs.roles.length > 0) {
    prefTotal++;
    const jobRole = (job.role || '').toLowerCase();
    if (prefs.roles.some((r) => jobRole.includes(r.toLowerCase()))) prefHits++;
  }

  const preferencesScore = prefTotal === 0
    ? 7  // neutral default when preferences not set
    : Math.round((prefHits / prefTotal) * 10);

  // ── 5. Experience / Projects (10%) ───────────────────────
  // Stub: reward students with more listed skills as proxy for experience.
  // Replace with actual project/experience data later.
  const studentSkillCount = studentProfile.skills ? studentProfile.skills.length : 0;
  const experienceScore = Math.min(10, Math.round((studentSkillCount / 8) * 10));

  // ── Total ─────────────────────────────────────────────────
  const totalScore = Math.min(
    100,
    skillsScore + eligibilityScore + academicsScore + preferencesScore + experienceScore
  );

  return {
    totalScore,
    isEligible,
    eligibilityReasons,
    breakdown: {
      skills: {
        score: skillsScore,
        max: 40,
        weight: '40%',
        matched: skillsMatched,
        missing: skillsMissing,
      },
      eligibility: {
        score: eligibilityScore,
        max: 25,
        weight: '25%',
        passed: isEligible,
        reasons: eligibilityReasons,
      },
      academics: {
        score: academicsScore,
        max: 15,
        weight: '15%',
        cgpa: studentProfile.cgpa,
      },
      preferences: {
        score: preferencesScore,
        max: 10,
        weight: '10%',
        prefHits,
        prefTotal,
      },
      experience: {
        score: experienceScore,
        max: 10,
        weight: '10%',
        note: 'Based on skills count (proxy)',
      },
    },
  };
};

// ── GET Profile ─────────────────────────────────────────────
exports.getProfile = async (req, res, next) => {
  try {
    let profile = await StudentProfile.findOne({ user: req.user.id }).populate(
      'user', 'name email role'
    );
    if (!profile) {
      profile = await StudentProfile.create({ user: req.user.id });
    }
    res.status(200).json({ success: true, profile });
  } catch (error) { next(error); }
};

// ── UPDATE Profile ──────────────────────────────────────────
exports.updateProfile = async (req, res, next) => {
  try {
    const {
      rollNo, phone, branch, cgpa, passingYear, backlogs,
      skills, linkedin, github, bio, name,
      prefLocations, prefJobTypes, prefRoles,
    } = req.body;

    if (name) await User.findByIdAndUpdate(req.user.id, { name: name.trim() });

    const skillsArray = Array.isArray(skills)
      ? skills
      : typeof skills === 'string'
      ? skills.split(',').map((s) => s.trim()).filter(Boolean)
      : [];

    const toArray = (v) =>
      Array.isArray(v) ? v : typeof v === 'string' ? v.split(',').map((s) => s.trim()).filter(Boolean) : [];

    const isProfileComplete = Boolean(rollNo && phone && branch && cgpa && passingYear);

    const profile = await StudentProfile.findOneAndUpdate(
      { user: req.user.id },
      {
        $set: {
          rollNo: rollNo || '',
          phone: phone || '',
          branch: branch || 'Computer Science and Engineering',
          cgpa: Number(cgpa) || 0,
          passingYear: Number(passingYear) || 2026,
          backlogs: Number(backlogs) || 0,
          skills: skillsArray,
          linkedin: linkedin || '',
          github: github || '',
          bio: bio || '',
          isProfileComplete,
          'preferences.locations': toArray(prefLocations),
          'preferences.jobTypes':  toArray(prefJobTypes),
          'preferences.roles':     toArray(prefRoles),
        },
      },
      { new: true, upsert: true, runValidators: true }
    ).populate('user', 'name email role');

    res.status(200).json({ success: true, message: 'Profile updated successfully', profile });
  } catch (error) { next(error); }
};

const { extractTextFromResume, parseResumeText } = require('../utils/aiResumeParser');

// ── UPLOAD & AI PARSE Resume ────────────────────────────────
exports.uploadResume = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please select a resume file (PDF/DOC/DOCX)' });
    }
    const resumePath = `/uploads/resumes/${req.file.filename}`;
    const profile = await StudentProfile.findOneAndUpdate(
      { user: req.user.id },
      { $set: { resumeUrl: resumePath, resumeOriginalName: req.file.originalname } },
      { new: true, upsert: true }
    ).populate('user', 'name email');

    res.status(200).json({ success: true, message: 'Resume uploaded!', resumeUrl: resumePath, profile });
  } catch (error) { next(error); }
};

// ── AI AUTO-PARSE RESUME TO COMPLETE PROFILE ────────────────
exports.parseResumeAndAutoFill = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a resume file (PDF, DOC, DOCX, TXT)' });
    }

    const filePath = req.file.path;
    const mimeType = req.file.mimetype;
    const resumeUrl = `/uploads/resumes/${req.file.filename}`;

    // 1. Extract raw text from file
    const rawText = await extractTextFromResume(filePath, mimeType);

    // 2. Intelligent AI parsing of fields
    const parseResult = parseResumeText(rawText);
    const fields = parseResult.fields || {};

    // 3. Update User document if name is extracted
    if (fields.name) {
      await User.findByIdAndUpdate(req.user.id, { name: fields.name });
    }

    // 4. Prepare update object for StudentProfile
    const updateData = {
      resumeUrl,
      resumeOriginalName: req.file.originalname,
    };

    if (fields.rollNo) updateData.rollNo = fields.rollNo;
    if (fields.phone) updateData.phone = fields.phone;
    if (fields.branch) updateData.branch = fields.branch;
    if (fields.cgpa) updateData.cgpa = fields.cgpa;
    if (fields.passingYear) updateData.passingYear = fields.passingYear;
    if (fields.backlogs !== undefined) updateData.backlogs = fields.backlogs;
    if (fields.skills && fields.skills.length > 0) updateData.skills = fields.skills;
    if (fields.linkedin) updateData.linkedin = fields.linkedin;
    if (fields.github) updateData.github = fields.github;
    if (fields.bio) updateData.bio = fields.bio;
    if (fields.prefLocations) updateData['preferences.locations'] = fields.prefLocations;
    if (fields.prefJobTypes) updateData['preferences.jobTypes'] = fields.prefJobTypes;
    if (fields.prefRoles) updateData['preferences.roles'] = fields.prefRoles;

    const existingProfile = await StudentProfile.findOne({ user: req.user.id });
    const rollNo = fields.rollNo || existingProfile?.rollNo;
    const phone = fields.phone || existingProfile?.phone;
    const branch = fields.branch || existingProfile?.branch;
    const cgpa = fields.cgpa || existingProfile?.cgpa;
    const passingYear = fields.passingYear || existingProfile?.passingYear;
    updateData.isProfileComplete = Boolean(rollNo && phone && branch && cgpa && passingYear);

    const updatedProfile = await StudentProfile.findOneAndUpdate(
      { user: req.user.id },
      { $set: updateData },
      { new: true, upsert: true, runValidators: true }
    ).populate('user', 'name email role');

    // Send in-app notification to student
    await Notification.create({
      recipient: req.user.id,
      title: '✨ Profile Auto-Filled by AI',
      message: `Placeonix AI successfully extracted ${parseResult.extractedFieldsCount} details from your resume (${req.file.originalname})!`,
      type: 'system',
      link: '/student-dashboard.html#profile',
    });

    res.status(200).json({
      success: true,
      message: `✨ Placeonix AI successfully extracted ${parseResult.extractedFieldsCount} profile fields!`,
      extractedCount: parseResult.extractedFieldsCount,
      extracted: fields,
      profile: updatedProfile,
      resumeUrl,
    });
  } catch (error) {
    next(error);
  }
};

// ── GET Jobs with Match Scores ──────────────────────────────
exports.getAvailableJobs = async (req, res, next) => {
  try {
    const profile = await StudentProfile.findOne({ user: req.user.id });
    const jobs = await Job.find({ status: 'active' })
      .populate('company', 'name website industry location logoUrl verifiedStatus')
      .populate('drive', 'title startDate endDate status')
      .sort({ createdAt: -1 });

    const studentApplications = await Application.find({ student: req.user.id }).select('job status appliedAt');
    const appliedJobMap = {};
    studentApplications.forEach((app) => {
      appliedJobMap[app.job.toString()] = { applicationId: app._id, status: app.status, appliedAt: app.appliedAt };
    });

    const jobsWithScores = jobs.map((job) => {
      const match = calculateMatchScore(profile, job);
      const isPastDeadline = new Date(job.deadline) < new Date();
      const applicationInfo = appliedJobMap[job._id.toString()] || null;
      return {
        ...job.toObject(),
        matchScore: match.totalScore,
        isEligible: match.isEligible,
        eligibilityReasons: match.eligibilityReasons,
        matchBreakdown: match.breakdown,
        isPastDeadline,
        hasApplied: Boolean(applicationInfo),
        applicationInfo,
      };
    });

    // Sort: eligible first, then by match score descending
    jobsWithScores.sort((a, b) => {
      if (a.isEligible !== b.isEligible) return a.isEligible ? -1 : 1;
      return b.matchScore - a.matchScore;
    });

    res.status(200).json({ success: true, count: jobsWithScores.length, jobs: jobsWithScores });
  } catch (error) { next(error); }
};

// ── APPLY for Job ────────────────────────────────────────────
exports.applyForJob = async (req, res, next) => {
  try {
    const jobId = req.params.jobId;
    const profile = await StudentProfile.findOne({ user: req.user.id });

    if (!profile) return res.status(400).json({ success: false, message: 'Complete your profile before applying.' });
    if (!profile.resumeUrl) return res.status(400).json({ success: false, message: 'Upload your resume before applying.' });

    const job = await Job.findById(jobId).populate('company', 'name');
    if (!job) return res.status(404).json({ success: false, message: 'Job posting not found.' });
    if (job.status !== 'active') return res.status(400).json({ success: false, message: 'This job is no longer active.' });
    if (new Date(job.deadline) < new Date()) return res.status(400).json({ success: false, message: 'Application deadline has passed.' });

    const match = calculateMatchScore(profile, job);
    if (!match.isEligible) {
      return res.status(400).json({
        success: false,
        message: `Not eligible: ${match.eligibilityReasons.join(' • ')}`,
      });
    }

    const existingApp = await Application.findOne({ job: jobId, student: req.user.id });
    if (existingApp) return res.status(400).json({ success: false, message: 'You have already applied for this job.' });

    const application = await Application.create({
      job: jobId,
      student: req.user.id,
      studentProfile: profile._id,
      resumeSnapshot: profile.resumeUrl,
      status: 'applied',
    });

    await Notification.create({
      recipient: req.user.id,
      title: 'Application Submitted',
      message: `Your application for ${job.title} at ${job.company?.name || 'the company'} was submitted.`,
      type: 'application_update',
      link: '#applications',
    });

    if (job.postedBy) {
      await Notification.create({
        recipient: job.postedBy,
        title: 'New Application',
        message: `${req.user.name} applied for '${job.title}'.`,
        type: 'application_update',
      });
    }

    res.status(201).json({ success: true, message: 'Applied successfully!', application });
  } catch (error) { next(error); }
};

// ── GET My Applications ─────────────────────────────────────
exports.getMyApplications = async (req, res, next) => {
  try {
    const applications = await Application.find({ student: req.user.id })
      .populate({ path: 'job', populate: { path: 'company', select: 'name logoUrl location industry website' } })
      .sort({ appliedAt: -1 });

    res.status(200).json({ success: true, count: applications.length, applications });
  } catch (error) { next(error); }
};

// ── WITHDRAW Application ────────────────────────────────────
exports.withdrawApplication = async (req, res, next) => {
  try {
    const application = await Application.findOne({ _id: req.params.id, student: req.user.id });
    if (!application) return res.status(404).json({ success: false, message: 'Application not found.' });

    const withdrawable = ['applied', 'under_review'];
    if (!withdrawable.includes(application.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot withdraw after reaching '${application.status}' stage.`,
      });
    }

    application.status = 'withdrawn';
    await application.save();

    res.status(200).json({ success: true, message: 'Application withdrawn.' });
  } catch (error) { next(error); }
};

// ── Dashboard Summary ───────────────────────────────────────
exports.getDashboardSummary = async (req, res, next) => {
  try {
    const profile = await StudentProfile.findOne({ user: req.user.id });
    const totalJobs = await Job.countDocuments({ status: 'active' });
    const applications = await Application.find({ student: req.user.id });

    const statusCounts = {};
    applications.forEach((a) => {
      statusCounts[a.status] = (statusCounts[a.status] || 0) + 1;
    });

    res.status(200).json({
      success: true,
      metrics: {
        totalJobs,
        totalApplied:      applications.length,
        underReview:       statusCounts['under_review'] || 0,
        shortlistedCount:  statusCounts['shortlisted'] || 0,
        interviewsCount:   statusCounts['interview'] || 0,
        offersCount:       statusCounts['selected'] || 0,
        isProfileComplete: profile ? profile.isProfileComplete : false,
        hasResume:         profile ? Boolean(profile.resumeUrl) : false,
      },
      profile,
    });
  } catch (error) { next(error); }
};

// ── Check Match Score for a specific job ────────────────────
exports.getMatchScore = async (req, res, next) => {
  try {
    const profile = await StudentProfile.findOne({ user: req.user.id });
    const job = await Job.findById(req.params.jobId);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found.' });

    const match = calculateMatchScore(profile, job);
    res.status(200).json({ success: true, ...match });
  } catch (error) { next(error); }
};
