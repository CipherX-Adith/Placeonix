const Job = require('../models/Job');

// @desc    Get all active public/shared jobs with filter & search
// @route   GET /api/jobs
// @access  Public / Authenticated
exports.getJobs = async (req, res, next) => {
  try {
    const { keyword, branch, minCgpa, jobType, location } = req.query;

    let query = { status: 'active' };

    if (keyword) {
      query.$or = [
        { title: { $regex: keyword, $options: 'i' } },
        { description: { $regex: keyword, $options: 'i' } },
        { role: { $regex: keyword, $options: 'i' } },
        { skillsRequired: { $in: [new RegExp(keyword, 'i')] } },
      ];
    }

    if (branch) {
      query.eligibleBranches = { $in: [branch] };
    }

    if (minCgpa) {
      query.minCgpa = { $lte: Number(minCgpa) };
    }

    if (jobType) {
      query.jobType = jobType;
    }

    if (location) {
      query.location = { $regex: location, $options: 'i' };
    }

    const jobs = await Job.find(query)
      .populate('company', 'name website industry location logoUrl verifiedStatus')
      .populate('drive', 'title startDate endDate status')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: jobs.length,
      jobs,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single job by ID
// @route   GET /api/jobs/:id
// @access  Public / Authenticated
exports.getJobById = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('company')
      .populate('drive');

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job posting not found',
      });
    }

    res.status(200).json({
      success: true,
      job,
    });
  } catch (error) {
    next(error);
  }
};
