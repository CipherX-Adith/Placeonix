const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const StudentProfile = require('./models/StudentProfile');
const RecruiterProfile = require('./models/RecruiterProfile');
const Company = require('./models/Company');
const Job = require('./models/Job');
const Application = require('./models/Application');
const RecruitmentDrive = require('./models/RecruitmentDrive');
const Notification = require('./models/Notification');

dotenv.config();

const seedData = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/placeonix';
    console.log(`Connecting to MongoDB at: ${mongoUri}...`);
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB. Clearing existing database collections...');

    // Clear old data
    await User.deleteMany();
    await StudentProfile.deleteMany();
    await RecruiterProfile.deleteMany();
    await Company.deleteMany();
    await Job.deleteMany();
    await Application.deleteMany();
    await RecruitmentDrive.deleteMany();
    await Notification.deleteMany();

    console.log('🔄 Seeding initial Placeonix demo data...');

    // 1. Create Placement Admin
    const admin = await User.create({
      name: 'Dr. Placement Officer',
      email: 'admin@placeonix.edu',
      password: 'admin123',
      role: 'admin',
      isActive: true,
    });

    // 2. Create Companies
    const googleCompany = await Company.create({
      name: 'Google India',
      website: 'https://careers.google.com',
      industry: 'Internet & Cloud Technology',
      description: 'Global technology leader in search, cloud computing, and AI systems.',
      location: 'Bengaluru / Hyderabad',
      verifiedStatus: 'verified',
      createdBy: admin._id,
    });

    const msftCompany = await Company.create({
      name: 'Microsoft IDC',
      website: 'https://careers.microsoft.com',
      industry: 'Software & Enterprise Services',
      description: 'Empowering every person and organization on the planet to achieve more.',
      location: 'Hyderabad / Noida',
      verifiedStatus: 'verified',
      createdBy: admin._id,
    });

    const techCorp = await Company.create({
      name: 'NextGen Innovations',
      website: 'https://nextgen.example.com',
      industry: 'FinTech & AI Solutions',
      description: 'Fast-growing fintech startup building high-frequency algorithmic payment tools.',
      location: 'Bengaluru (Remote Available)',
      verifiedStatus: 'pending',
      createdBy: admin._id,
    });

    // 3. Create Recruiters
    const googleRecruiter = await User.create({
      name: 'Sarah Jenkins',
      email: 'recruiter.google@placeonix.com',
      password: 'recruiter123',
      role: 'recruiter',
      isActive: true,
    });

    await RecruiterProfile.create({
      user: googleRecruiter._id,
      company: googleCompany._id,
      designation: 'University Talent Lead',
      phone: '+91 98765 43210',
    });

    const msftRecruiter = await User.create({
      name: 'Vikram Malhotra',
      email: 'recruiter.msft@placeonix.com',
      password: 'recruiter123',
      role: 'recruiter',
      isActive: true,
    });

    await RecruiterProfile.create({
      user: msftRecruiter._id,
      company: msftCompany._id,
      designation: 'Senior Technical Recruiter',
      phone: '+91 98765 43211',
    });

    // 4. Create Campus Recruitment Drive
    const drive = await RecruitmentDrive.create({
      title: 'Annual Campus Placement Drive 2026',
      description: 'Premier campus recruitment season for graduating batch of 2026 engineering students.',
      academicYear: '2025-2026',
      startDate: new Date('2026-08-01'),
      endDate: new Date('2026-12-31'),
      eligibleBranches: [
        'Computer Science and Engineering',
        'Information Technology',
        'Electronics and Communication Engineering',
        'Artificial Intelligence & Data Science',
      ],
      minCgpa: 6.5,
      coordinatorName: 'Prof. Ramesh Sharma (Head of Placements)',
      createdBy: admin._id,
      status: 'ongoing',
    });

    // 5. Create Job Openings
    const job1 = await Job.create({
      title: 'Associate Software Development Engineer (SDE-1)',
      company: googleCompany._id,
      postedBy: googleRecruiter._id,
      drive: drive._id,
      role: 'Software Development Engineer',
      jobType: 'Full-time',
      location: 'Bengaluru / Hyderabad',
      packageCtc: '18 - 24 LPA',
      description: 'Join Google Core engineering team to architect distributed cloud services and intelligent user applications.',
      requirements: [
        'Proficiency in Data Structures, Algorithms, and Object-Oriented Design.',
        'Hands-on knowledge of Python, Java, Go, or C++.',
        'Strong problem-solving mindset and collaborative communication.',
      ],
      skillsRequired: ['C++', 'Java', 'Python', 'Algorithms', 'Distributed Systems', 'System Design'],
      minCgpa: 7.5,
      maxBacklogs: 0,
      eligibleBranches: [
        'Computer Science and Engineering',
        'Information Technology',
        'Artificial Intelligence & Data Science',
      ],
      eligiblePassingYears: [2026],
      deadline: new Date('2026-11-30'),
      status: 'active',
    });

    const job2 = await Job.create({
      title: 'Software Engineer - Cloud & AI',
      company: msftCompany._id,
      postedBy: msftRecruiter._id,
      drive: drive._id,
      role: 'Cloud Solutions Engineer',
      jobType: 'Full-time',
      location: 'Hyderabad / Noida',
      packageCtc: '16 - 20 LPA',
      description: 'Build enterprise-scale cloud microservices on Azure and develop modern AI-integrated productivity tools.',
      requirements: [
        'Strong fundamentals in OS, Networking, and Databases.',
        'Experience with Node.js, C#, or modern JavaScript/TypeScript.',
        'Passion for cloud technologies and scalable architectures.',
      ],
      skillsRequired: ['Node.js', 'C#', 'Azure', 'TypeScript', 'SQL', 'Git'],
      minCgpa: 7.0,
      maxBacklogs: 0,
      eligibleBranches: [
        'Computer Science and Engineering',
        'Information Technology',
        'Electronics and Communication Engineering',
        'Artificial Intelligence & Data Science',
      ],
      eligiblePassingYears: [2026],
      deadline: new Date('2026-12-15'),
      status: 'active',
    });

    const job3 = await Job.create({
      title: 'Frontend & UI Engineer Intern',
      company: msftCompany._id,
      postedBy: msftRecruiter._id,
      drive: drive._id,
      role: 'Frontend Engineer',
      jobType: 'Internship + PPO',
      location: 'Hyderabad / Remote',
      packageCtc: '45,000 / month Stipend (PPO: 14 LPA)',
      description: 'Design and implement accessible, ultra-responsive web interfaces with modern CSS and JavaScript frameworks.',
      requirements: [
        'Deep understanding of HTML5, CSS3, DOM manipulation, and modern JavaScript (ES6+).',
        'Understanding of component architecture and UI performance.',
      ],
      skillsRequired: ['HTML5', 'CSS3', 'JavaScript', 'Responsive Design', 'Web Performance'],
      minCgpa: 6.5,
      maxBacklogs: 1,
      eligibleBranches: [
        'Computer Science and Engineering',
        'Information Technology',
        'Electronics and Communication Engineering',
        'Electrical and Electronics Engineering',
        'Artificial Intelligence & Data Science',
      ],
      eligiblePassingYears: [2026],
      deadline: new Date('2026-10-31'),
      status: 'active',
    });

    // 6. Create Students
    const student1 = await User.create({
      name: 'Rahul Sharma',
      email: 'rahul.sharma@placeonix.edu',
      password: 'student123',
      role: 'student',
      isActive: true,
    });

    const student1Profile = await StudentProfile.create({
      user: student1._id,
      rollNo: '22CS045',
      phone: '+91 98450 11223',
      branch: 'Computer Science and Engineering',
      cgpa: 8.85,
      passingYear: 2026,
      backlogs: 0,
      skills: ['JavaScript', 'Node.js', 'React', 'Data Structures', 'MongoDB', 'Python'],
      linkedin: 'https://linkedin.com/in/rahulsharma',
      github: 'https://github.com/rahulsharma',
      bio: 'Enthusiastic full-stack engineer passionate about scalable backend systems and distributed algorithms.',
      isProfileComplete: true,
    });

    const student2 = await User.create({
      name: 'Priya Patel',
      email: 'priya.patel@placeonix.edu',
      password: 'student123',
      role: 'student',
      isActive: true,
    });

    const student2Profile = await StudentProfile.create({
      user: student2._id,
      rollNo: '22IT018',
      phone: '+91 98450 22334',
      branch: 'Information Technology',
      cgpa: 8.2,
      passingYear: 2026,
      backlogs: 0,
      skills: ['Python', 'SQL', 'Machine Learning', 'Data Analysis', 'HTML', 'CSS'],
      linkedin: 'https://linkedin.com/in/priyapatel',
      github: 'https://github.com/priyapatel',
      bio: 'AI/ML enthusiast focused on predictive analytics and natural language processing applications.',
      isProfileComplete: true,
    });

    const student3 = await User.create({
      name: 'Arjun Kumar',
      email: 'arjun.kumar@placeonix.edu',
      password: 'student123',
      role: 'student',
      isActive: true,
    });

    const student3Profile = await StudentProfile.create({
      user: student3._id,
      rollNo: '22EC062',
      phone: '+91 98450 33445',
      branch: 'Electronics and Communication Engineering',
      cgpa: 6.8,
      passingYear: 2026,
      backlogs: 1,
      skills: ['Embedded C', 'IoT', 'Python', 'Web Basics', 'MATLAB'],
      linkedin: 'https://linkedin.com/in/arjunkumar',
      github: 'https://github.com/arjunkumar',
      bio: 'ECE undergraduate passionate about IoT systems and embedded programming.',
      isProfileComplete: true,
    });

    // 7. Create Sample Applications across diverse stages
    await Application.create({
      job: job1._id,
      student: student1._id,
      studentProfile: student1Profile._id,
      status: 'selected',
      appliedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      feedback: 'Outstanding technical performance across all rounds. Offer confirmed!',
    });

    await Application.create({
      job: job2._id,
      student: student1._id,
      studentProfile: student1Profile._id,
      status: 'interview',
      appliedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      interviewDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      interviewMode: 'Microsoft Teams Video Interview',
      feedback: 'Shortlisted for Technical Round 2.',
    });

    await Application.create({
      job: job2._id,
      student: student2._id,
      studentProfile: student2Profile._id,
      status: 'shortlisted',
      appliedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      feedback: 'Resume profile shortlisted. Online assessment link sent.',
    });

    await Application.create({
      job: job3._id,
      student: student3._id,
      studentProfile: student3Profile._id,
      status: 'applied',
      appliedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    });

    // 8. Create Sample Notifications
    await Notification.create({
      recipient: student1._id,
      title: '🌟 Offer Letter Confirmed!',
      message: 'Congratulations! Google India has extended you an offer for the Associate SDE role.',
      type: 'application_update',
      link: '/student-dashboard.html#applications',
      isRead: false,
    });

    await Notification.create({
      recipient: student1._id,
      title: '📅 Technical Interview Scheduled',
      message: 'Microsoft IDC scheduled your Technical Round 2 interview for Friday at 3:00 PM.',
      type: 'application_update',
      link: '/student-dashboard.html#applications',
      isRead: true,
    });

    await Notification.create({
      recipient: googleRecruiter._id,
      title: 'Candidate Application',
      message: 'Rahul Sharma submitted application for Associate SDE.',
      type: 'application_update',
      link: `/recruiter-dashboard.html?jobId=${job1._id}`,
      isRead: true,
    });

    console.log(`
  =======================================================
  ✅ PLACEONIX DATABASE SEEDED SUCCESSFULLY!
  =======================================================

  Demo Logins:
  -------------------------------------------------------
  👑 ADMIN:
     Email:    admin@placeonix.edu
     Password: admin123

  🏢 RECRUITER (Google India):
     Email:    recruiter.google@placeonix.com
     Password: recruiter123

  🏢 RECRUITER (Microsoft IDC):
     Email:    recruiter.msft@placeonix.com
     Password: recruiter123

  🎓 STUDENT (CSE - High CGPA):
     Email:    rahul.sharma@placeonix.edu
     Password: student123

  🎓 STUDENT (IT):
     Email:    priya.patel@placeonix.edu
     Password: student123

  🎓 STUDENT (ECE):
     Email:    arjun.kumar@placeonix.edu
     Password: student123
  =======================================================
    `);

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
};

seedData();
