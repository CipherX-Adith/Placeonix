const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');
const RecruiterProfile = require('../models/RecruiterProfile');
const Company = require('../models/Company');
const Job = require('../models/Job');
const Application = require('../models/Application');
const RecruitmentDrive = require('../models/RecruitmentDrive');
const Notification = require('../models/Notification');

// @desc    Get complete administrator analytics & metrics
// @route   GET /api/admin/analytics
// @access  Private (Admin)
exports.getAnalytics = async (req, res, next) => {
  try {
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalRecruiters = await User.countDocuments({ role: 'recruiter' });
    const totalCompanies = await Company.countDocuments();
    const pendingCompanies = await Company.countDocuments({
      verifiedStatus: 'pending',
    });
    const totalJobs = await Job.countDocuments();
    const activeJobs = await Job.countDocuments({ status: 'active' });
    const totalApplications = await Application.countDocuments();
    const selectedApplications = await Application.countDocuments({
      status: 'selected',
    });

    // Unique students placed
    const uniquePlacedStudentIds = await Application.distinct('student', {
      status: 'selected',
    });
    const placedStudentsCount = uniquePlacedStudentIds.length;
    const placementRate =
      totalStudents > 0
        ? Math.round((placedStudentsCount / totalStudents) * 100)
        : 0;

    // Branch-wise distribution of students and placed students
    const branchDistribution = await StudentProfile.aggregate([
      {
        $group: {
          _id: '$branch',
          totalStudents: { $sum: 1 },
          avgCgpa: { $avg: '$cgpa' },
        },
      },
      { $sort: { totalStudents: -1 } },
    ]);

    // Active recruitment drives
    const activeDrives = await RecruitmentDrive.find().sort({ startDate: -1 });

    // Recent applications
    const recentApplications = await Application.find()
      .populate('student', 'name email')
      .populate('studentProfile', 'branch cgpa rollNo')
      .populate({
        path: 'job',
        select: 'title packageCtc',
        populate: { path: 'company', select: 'name logoUrl' },
      })
      .sort({ appliedAt: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      analytics: {
        totalStudents,
        placedStudentsCount,
        placementRate,
        totalRecruiters,
        totalCompanies,
        pendingCompanies,
        totalJobs,
        activeJobs,
        totalApplications,
        selectedApplications,
        branchDistribution,
        activeDrivesCount: activeDrives.length,
      },
      recentApplications,
      activeDrives,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all companies with verification filter
// @route   GET /api/admin/companies
// @access  Private (Admin)
exports.getCompanies = async (req, res, next) => {
  try {
    const { status } = req.query;
    let filter = {};
    if (status) filter.verifiedStatus = status;

    const companies = await Company.find(filter)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: companies.length,
      companies,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify or Reject Company Profile
// @route   PUT /api/admin/companies/:id/verify
// @access  Private (Admin)
exports.verifyCompany = async (req, res, next) => {
  try {
    const { status, notes } = req.body; // status: 'verified' | 'rejected'

    if (!['verified', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be 'verified', 'rejected', or 'pending'",
      });
    }

    const company = await Company.findById(req.params.id);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found',
      });
    }

    company.verifiedStatus = status;
    if (notes) company.verificationNotes = notes;
    await company.save();

    // Notify recruiter if createdBy exists
    if (company.createdBy) {
      const isApproved = status === 'verified';
      await Notification.create({
        recipient: company.createdBy,
        title: isApproved
          ? '🏢 Company Verification Approved'
          : '⚠️ Company Verification Update',
        message: isApproved
          ? `Your company profile '${company.name}' has been verified by the Placement Cell! You can now publish job openings.`
          : `Your company profile '${company.name}' verification was ${status}. Reason/Notes: ${notes || 'Contact admin'}`,
        type: 'verification',
        link: '/recruiter-dashboard.html',
      });
    }

    res.status(200).json({
      success: true,
      message: `Company '${company.name}' status updated to '${status}' successfully.`,
      company,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all users (Students & Recruiters) with filter
// @route   GET /api/admin/users
// @access  Private (Admin)
exports.getUsers = async (req, res, next) => {
  try {
    const { role } = req.query;
    let filter = {};
    if (role) filter.role = role;

    const users = await User.find(filter).sort({ createdAt: -1 });

    // Populate extra details depending on role
    const usersWithProfiles = await Promise.all(
      users.map(async (u) => {
        let profile = null;
        if (u.role === 'student') {
          profile = await StudentProfile.findOne({ user: u._id });
        } else if (u.role === 'recruiter') {
          profile = await RecruiterProfile.findOne({ user: u._id }).populate('company');
        }
        return {
          ...u.toObject(),
          profile,
        };
      })
    );

    res.status(200).json({
      success: true,
      count: usersWithProfiles.length,
      users: usersWithProfiles,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle user active/inactive status
// @route   PUT /api/admin/users/:id/toggle-status
// @access  Private (Admin)
exports.toggleUserStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.status(200).json({
      success: true,
      message: `User '${user.name}' account is now ${user.isActive ? 'Active' : 'Deactivated'}.`,
      user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create Recruitment Drive
// @route   POST /api/admin/drives
// @access  Private (Admin)
exports.createDrive = async (req, res, next) => {
  try {
    const {
      title,
      description,
      academicYear,
      startDate,
      endDate,
      eligibleBranches,
      minCgpa,
      coordinatorName,
    } = req.body;

    if (!title || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Please provide drive title, start date, and end date.',
      });
    }

    const drive = await RecruitmentDrive.create({
      title,
      description: description || '',
      academicYear: academicYear || '2025-2026',
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      eligibleBranches: eligibleBranches || [],
      minCgpa: minCgpa ? Number(minCgpa) : 6.0,
      coordinatorName: coordinatorName || 'Placement Cell',
      createdBy: req.user.id,
      status: 'ongoing',
    });

    // Notify all students about the new recruitment drive
    const students = await User.find({ role: 'student', isActive: true });
    const notificationDocs = students.map((stu) => ({
      recipient: stu._id,
      title: '🚀 New Campus Recruitment Drive Announced',
      message: `The '${drive.title}' campus drive is scheduled from ${new Date(
        startDate
      ).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()}.`,
      type: 'job_alert',
      link: '/student-dashboard.html#jobs',
    }));

    if (notificationDocs.length > 0) {
      await Notification.insertMany(notificationDocs);
    }

    res.status(201).json({
      success: true,
      message: 'Recruitment Drive created & students notified!',
      drive,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all recruitment drives
// @route   GET /api/admin/drives
// @access  Private (Admin, Recruiter, Student)
exports.getDrives = async (req, res, next) => {
  try {
    const drives = await RecruitmentDrive.find().sort({ startDate: -1 });

    res.status(200).json({
      success: true,
      count: drives.length,
      drives,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Generate Placement Reports (Structured Data for Download / Presentation)
// @route   GET /api/admin/reports/placement
// @access  Private (Admin)
exports.getPlacementReport = async (req, res, next) => {
  try {
    const applications = await Application.find({ status: 'selected' })
      .populate('student', 'name email')
      .populate('studentProfile', 'rollNo branch cgpa passingYear phone')
      .populate({
        path: 'job',
        select: 'title packageCtc role jobType location',
        populate: { path: 'company', select: 'name industry location' },
      })
      .sort({ updatedAt: -1 });

    const reportData = applications.map((app, index) => ({
      slNo: index + 1,
      studentName: app.student?.name || 'N/A',
      rollNo: app.studentProfile?.rollNo || 'N/A',
      email: app.student?.email || 'N/A',
      phone: app.studentProfile?.phone || 'N/A',
      branch: app.studentProfile?.branch || 'N/A',
      cgpa: app.studentProfile?.cgpa || 0,
      company: app.job?.company?.name || 'N/A',
      jobTitle: app.job?.title || 'N/A',
      packageCtc: app.job?.packageCtc || 'N/A',
      role: app.job?.role || 'N/A',
      selectionDate: new Date(app.updatedAt).toLocaleDateString(),
    }));

    res.status(200).json({
      success: true,
      generatedAt: new Date().toISOString(),
      totalSelections: reportData.length,
      report: reportData,
    });
  } catch (error) {
    next(error);
  }
};
