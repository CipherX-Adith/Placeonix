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

    console.log('🔄 Seeding Placeonix demo database...');

    // Clear existing collections for fresh comprehensive seeding
    await User.deleteMany();
    await StudentProfile.deleteMany();
    await RecruiterProfile.deleteMany();
    await Company.deleteMany();
    await Job.deleteMany();
    await Application.deleteMany();
    await RecruitmentDrive.deleteMany();
    await Notification.deleteMany();

    // ── 1. CREATE PLACEMENT ADMIN ─────────────────────────────
    const admin = await User.create({
      name: 'Dr. Placement Officer',
      email: 'admin@placeonix.edu',
      password: 'admin123',
      role: 'admin',
      isActive: true,
      college: 'Placeonix Institute of Technology',
      designation: 'Head of Training & Placement',
    });

    // ── 2. CREATE 7 COMPANIES ─────────────────────────────────
    const googleCompany = await Company.create({
      name: 'Google India',
      website: 'https://careers.google.com',
      industry: 'Internet & Cloud Technology',
      description: 'Global technology leader specializing in search, cloud computing, artificial intelligence, and operating systems.',
      location: 'Bengaluru / Hyderabad',
      verifiedStatus: 'verified',
      createdBy: admin._id,
    });

    const msftCompany = await Company.create({
      name: 'Microsoft IDC',
      website: 'https://careers.microsoft.com',
      industry: 'Software & Cloud Services',
      description: 'Global developer of software, cloud infrastructure (Azure), consumer electronics, and enterprise solutions.',
      location: 'Hyderabad / Noida / Bengaluru',
      verifiedStatus: 'verified',
      createdBy: admin._id,
    });

    const amazonCompany = await Company.create({
      name: 'Amazon Web Services (AWS)',
      website: 'https://amazon.jobs',
      industry: 'E-Commerce & Cloud Infrastructure',
      description: 'The world\'s most comprehensive and broadly adopted cloud platform, offering over 200 fully featured services.',
      location: 'Bengaluru / Hyderabad / Chennai',
      verifiedStatus: 'verified',
      createdBy: admin._id,
    });

    const gsCompany = await Company.create({
      name: 'Goldman Sachs',
      website: 'https://goldmansachs.com/careers',
      industry: 'Investment Banking & FinTech',
      description: 'Leading global financial institution that delivers a broad range of financial services to a substantial and diversified client base.',
      location: 'Bengaluru / Hyderabad',
      verifiedStatus: 'verified',
      createdBy: admin._id,
    });

    const flipkartCompany = await Company.create({
      name: 'Flipkart India',
      website: 'https://flipkartcareers.com',
      industry: 'E-Commerce & Supply Chain',
      description: 'India\'s leading e-commerce marketplace with a registered customer base of over 400 million.',
      location: 'Bengaluru, Karnataka',
      verifiedStatus: 'verified',
      createdBy: admin._id,
    });

    const zomatoCompany = await Company.create({
      name: 'Zomato Media',
      website: 'https://zomato.com/careers',
      industry: 'FoodTech & Logistics',
      description: 'Indian multinational restaurant aggregator and food delivery company transforming hyperlocal logistics.',
      location: 'Gurugram / Remote',
      verifiedStatus: 'verified',
      createdBy: admin._id,
    });

    const nextgenCompany = await Company.create({
      name: 'NextGen Innovations',
      website: 'https://nextgen.example.com',
      industry: 'FinTech & AI Startups',
      description: 'High-growth fintech startup building next-generation algorithmic trading and micro-investment APIs.',
      location: 'Bengaluru (Remote Available)',
      verifiedStatus: 'pending',
      createdBy: admin._id,
    });

    // ── 3. CREATE RECRUITERS ──────────────────────────────────
    const googleRecruiter = await User.create({
      name: 'Sarah Jenkins',
      email: 'recruiter.google@placeonix.com',
      password: 'recruiter123',
      role: 'recruiter',
      isActive: true,
      college: 'Google India',
    });
    await RecruiterProfile.create({
      user: googleRecruiter._id,
      company: googleCompany._id,
      designation: 'University Talent Acquisition Lead',
      phone: '+91 98765 43210',
    });

    const msftRecruiter = await User.create({
      name: 'Vikram Malhotra',
      email: 'recruiter.msft@placeonix.com',
      password: 'recruiter123',
      role: 'recruiter',
      isActive: true,
      college: 'Microsoft IDC',
    });
    await RecruiterProfile.create({
      user: msftRecruiter._id,
      company: msftCompany._id,
      designation: 'Senior Technical Recruiter',
      phone: '+91 98765 43211',
    });

    const amazonRecruiter = await User.create({
      name: 'Ananya Sen',
      email: 'recruiter.amazon@placeonix.com',
      password: 'recruiter123',
      role: 'recruiter',
      isActive: true,
      college: 'Amazon Web Services (AWS)',
    });
    await RecruiterProfile.create({
      user: amazonRecruiter._id,
      company: amazonCompany._id,
      designation: 'Campus Hiring Manager',
      phone: '+91 98765 43212',
    });

    const gsRecruiter = await User.create({
      name: 'Rohan Joshi',
      email: 'recruiter.gs@placeonix.com',
      password: 'recruiter123',
      role: 'recruiter',
      isActive: true,
      college: 'Goldman Sachs',
    });
    await RecruiterProfile.create({
      user: gsRecruiter._id,
      company: gsCompany._id,
      designation: 'Engineering Recruitment Lead',
      phone: '+91 98765 43213',
    });

    const flipkartRecruiter = await User.create({
      name: 'Meera Nair',
      email: 'recruiter.flipkart@placeonix.com',
      password: 'recruiter123',
      role: 'recruiter',
      isActive: true,
      college: 'Flipkart India',
    });
    await RecruiterProfile.create({
      user: flipkartRecruiter._id,
      company: flipkartCompany._id,
      designation: 'Lead University Recruiter',
      phone: '+91 98765 43214',
    });

    // ── 4. CREATE CAMPUS RECRUITMENT DRIVE ────────────────────
    const drive = await RecruitmentDrive.create({
      title: 'Annual Campus Placement Drive 2026',
      description: 'Premier campus recruitment season for graduating batch of 2026 engineering and technology students.',
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
      coordinatorName: 'Dr. Placement Officer (Head of Placements)',
      createdBy: admin._id,
      status: 'ongoing',
    });

    // ── 5. CREATE 14 JOB OFFERS ───────────────────────────────
    const jobs = await Job.create([
      {
        title: 'Associate Software Development Engineer (SDE-1)',
        company: googleCompany._id,
        postedBy: googleRecruiter._id,
        drive: drive._id,
        role: 'Software Development Engineer',
        jobType: 'Full-time',
        location: 'Bengaluru / Hyderabad',
        packageCtc: '22 - 28',
        description: 'Join Google Core engineering team to architect distributed cloud services, high-throughput storage engines, and user-facing applications.',
        requirements: [
          'Proficiency in Data Structures, Algorithms, and Object-Oriented Design.',
          'Hands-on knowledge of Python, Java, Go, or C++.',
          'Strong problem-solving mindset and collaborative communication.',
        ],
        skillsRequired: ['C++', 'Java', 'Python', 'Algorithms', 'Distributed Systems', 'System Design'],
        minCgpa: 7.5,
        maxBacklogs: 0,
        eligibleBranches: ['Computer Science and Engineering', 'Information Technology', 'Artificial Intelligence & Data Science'],
        eligiblePassingYears: [2026],
        deadline: new Date('2026-11-30'),
        status: 'active',
      },
      {
        title: 'Cloud Platform Specialist Intern',
        company: googleCompany._id,
        postedBy: googleRecruiter._id,
        drive: drive._id,
        role: 'Cloud Engineer',
        jobType: 'Internship + PPO',
        location: 'Bengaluru / Remote',
        packageCtc: '50,000/mo (PPO: 18 - 22 LPA)',
        description: 'Work alongside Google Cloud architects on enterprise cloud migrations, container orchestration, and serverless architectures.',
        requirements: [
          'Understanding of Linux OS internals, networking, and virtualization.',
          'Experience with Docker, Kubernetes, or Google Cloud Platform.',
        ],
        skillsRequired: ['GCP', 'Docker', 'Kubernetes', 'Linux', 'Python', 'Networking'],
        minCgpa: 7.0,
        maxBacklogs: 0,
        eligibleBranches: ['Computer Science and Engineering', 'Information Technology', 'Electronics and Communication Engineering'],
        eligiblePassingYears: [2026],
        deadline: new Date('2026-10-31'),
        status: 'active',
      },
      {
        title: 'Software Engineer - Cloud & AI',
        company: msftCompany._id,
        postedBy: msftRecruiter._id,
        drive: drive._id,
        role: 'Cloud Solutions Engineer',
        jobType: 'Full-time',
        location: 'Hyderabad / Noida',
        packageCtc: '18 - 24',
        description: 'Build enterprise-scale cloud microservices on Azure and develop modern AI-integrated productivity tools and Copilot extensions.',
        requirements: [
          'Strong fundamentals in OS, Networking, and Databases.',
          'Experience with Node.js, C#, or modern JavaScript/TypeScript.',
          'Passion for cloud technologies and scalable architectures.',
        ],
        skillsRequired: ['Node.js', 'C#', 'Azure', 'TypeScript', 'SQL', 'Git'],
        minCgpa: 7.0,
        maxBacklogs: 0,
        eligibleBranches: ['Computer Science and Engineering', 'Information Technology', 'Electronics and Communication Engineering', 'Artificial Intelligence & Data Science'],
        eligiblePassingYears: [2026],
        deadline: new Date('2026-12-15'),
        status: 'active',
      },
      {
        title: 'Frontend & UI Engineer',
        company: msftCompany._id,
        postedBy: msftRecruiter._id,
        drive: drive._id,
        role: 'Frontend Engineer',
        jobType: 'Full-time',
        location: 'Hyderabad / Bengaluru',
        packageCtc: '14 - 18',
        description: 'Design and implement accessible, ultra-responsive web interfaces with modern CSS and JavaScript frameworks.',
        requirements: [
          'Deep understanding of HTML5, CSS3, DOM manipulation, and modern JavaScript (ES6+).',
          'Understanding of component architecture and UI performance.',
        ],
        skillsRequired: ['HTML5', 'CSS3', 'JavaScript', 'React', 'TypeScript', 'Responsive Design'],
        minCgpa: 6.5,
        maxBacklogs: 0,
        eligibleBranches: ['Computer Science and Engineering', 'Information Technology', 'Artificial Intelligence & Data Science'],
        eligiblePassingYears: [2026],
        deadline: new Date('2026-11-15'),
        status: 'active',
      },
      {
        title: 'Software Development Engineer - Backend',
        company: amazonCompany._id,
        postedBy: amazonRecruiter._id,
        drive: drive._id,
        role: 'Backend Engineer',
        jobType: 'Full-time',
        location: 'Bengaluru / Hyderabad',
        packageCtc: '20 - 26',
        description: 'Design resilient distributed backend services handling millions of daily customer transactions across Amazon E-Commerce.',
        requirements: [
          'Strong mastery in Java, Spring Boot, or Go.',
          'Database optimization experience (PostgreSQL, DynamoDB, Redis).',
        ],
        skillsRequired: ['Java', 'Spring Boot', 'AWS', 'Microservices', 'DynamoDB', 'Redis'],
        minCgpa: 7.2,
        maxBacklogs: 0,
        eligibleBranches: ['Computer Science and Engineering', 'Information Technology', 'Artificial Intelligence & Data Science'],
        eligiblePassingYears: [2026],
        deadline: new Date('2026-11-20'),
        status: 'active',
      },
      {
        title: 'Cloud Support & DevOps Associate',
        company: amazonCompany._id,
        postedBy: amazonRecruiter._id,
        drive: drive._id,
        role: 'DevOps Engineer',
        jobType: 'Full-time',
        location: 'Chennai / Hyderabad',
        packageCtc: '15 - 19',
        description: 'Support enterprise AWS customers with architecture debugging, infrastructure automation, and automated deployment pipelines.',
        requirements: [
          'Knowledge of AWS core services (EC2, S3, VPC, IAM).',
          'Proficiency in Bash/Python scripting and Terraform.',
        ],
        skillsRequired: ['AWS', 'Terraform', 'Linux', 'Python', 'CI/CD', 'Docker'],
        minCgpa: 6.5,
        maxBacklogs: 1,
        eligibleBranches: ['Computer Science and Engineering', 'Information Technology', 'Electronics and Communication Engineering'],
        eligiblePassingYears: [2026],
        deadline: new Date('2026-12-05'),
        status: 'active',
      },
      {
        title: 'Quantitative & FinTech Analyst',
        company: gsCompany._id,
        postedBy: gsRecruiter._id,
        drive: drive._id,
        role: 'Quantitative Analyst',
        jobType: 'Full-time',
        location: 'Bengaluru, Karnataka',
        packageCtc: '24 - 30',
        description: 'Develop algorithmic risk assessment models, pricing engines, and real-time quantitative trading analysis platforms.',
        requirements: [
          'Strong mathematical and statistical aptitude.',
          'Proficiency in Python (NumPy/SciPy/Pandas) or C++.',
        ],
        skillsRequired: ['Python', 'C++', 'Algorithms', 'Statistics', 'Financial Modeling', 'SQL'],
        minCgpa: 8.0,
        maxBacklogs: 0,
        eligibleBranches: ['Computer Science and Engineering', 'Information Technology', 'Artificial Intelligence & Data Science'],
        eligiblePassingYears: [2026],
        deadline: new Date('2026-11-25'),
        status: 'active',
      },
      {
        title: 'Systems & Reliability Engineer',
        company: gsCompany._id,
        postedBy: gsRecruiter._id,
        drive: drive._id,
        role: 'Systems Engineer',
        jobType: 'Full-time',
        location: 'Bengaluru / Hyderabad',
        packageCtc: '16 - 20',
        description: 'Ensure 99.999% availability of global banking transactional platforms through telemetry, automation, and resilience engineering.',
        requirements: [
          'Expertise in Linux system programming and network protocols.',
          'Experience with monitoring stacks (Prometheus, Grafana).',
        ],
        skillsRequired: ['Linux', 'Python', 'Go', 'Prometheus', 'Grafana', 'Networks'],
        minCgpa: 7.0,
        maxBacklogs: 0,
        eligibleBranches: ['Computer Science and Engineering', 'Information Technology', 'Electronics and Communication Engineering'],
        eligiblePassingYears: [2026],
        deadline: new Date('2026-12-10'),
        status: 'active',
      },
      {
        title: 'Software Development Engineer - E-Commerce Core',
        company: flipkartCompany._id,
        postedBy: flipkartRecruiter._id,
        drive: drive._id,
        role: 'Software Development Engineer',
        jobType: 'Full-time',
        location: 'Bengaluru, Karnataka',
        packageCtc: '18 - 22',
        description: 'Innovate on catalog discovery, search ranking, and high-concurrency checkout pipelines serving millions of shoppers.',
        requirements: [
          'Solid foundation in algorithms, concurrent programming, and distributed caching.',
          'Proficiency in Java or Kotlin.',
        ],
        skillsRequired: ['Java', 'Spring Boot', 'Kafka', 'Redis', 'MySQL', 'System Design'],
        minCgpa: 7.0,
        maxBacklogs: 0,
        eligibleBranches: ['Computer Science and Engineering', 'Information Technology', 'Artificial Intelligence & Data Science'],
        eligiblePassingYears: [2026],
        deadline: new Date('2026-11-28'),
        status: 'active',
      },
      {
        title: 'Mobile Application Engineer (Android / Flutter)',
        company: flipkartCompany._id,
        postedBy: flipkartRecruiter._id,
        drive: drive._id,
        role: 'Mobile Engineer',
        jobType: 'Full-time',
        location: 'Bengaluru, Karnataka',
        packageCtc: '15 - 19',
        description: 'Build fast, responsive mobile experiences for Flipkart shopper and seller mobile applications.',
        requirements: [
          'Strong understanding of Android SDK, Kotlin, or Flutter.',
          'Familiarity with REST APIs, offline sync, and memory optimization.',
        ],
        skillsRequired: ['Kotlin', 'Android SDK', 'Flutter', 'REST APIs', 'Git'],
        minCgpa: 6.5,
        maxBacklogs: 1,
        eligibleBranches: ['Computer Science and Engineering', 'Information Technology', 'Electronics and Communication Engineering'],
        eligiblePassingYears: [2026],
        deadline: new Date('2026-12-01'),
        status: 'active',
      },
      {
        title: 'Full Stack Web Developer',
        company: zomatoCompany._id,
        postedBy: googleRecruiter._id,
        drive: drive._id,
        role: 'Full Stack Engineer',
        jobType: 'Full-time',
        location: 'Gurugram / Remote',
        packageCtc: '14 - 18',
        description: 'Create delightful restaurant and consumer web applications utilizing React, Node.js, and modern cloud technologies.',
        requirements: [
          'Strong full-stack foundation in JavaScript/TypeScript.',
          'Hands-on experience with Node.js, Express, React, and MongoDB/PostgreSQL.',
        ],
        skillsRequired: ['React', 'Node.js', 'TypeScript', 'MongoDB', 'Express', 'Tailwind CSS'],
        minCgpa: 6.5,
        maxBacklogs: 0,
        eligibleBranches: ['Computer Science and Engineering', 'Information Technology', 'Artificial Intelligence & Data Science'],
        eligiblePassingYears: [2026],
        deadline: new Date('2026-11-18'),
        status: 'active',
      },
      {
        title: 'Machine Learning & Recommendation Engineer',
        company: zomatoCompany._id,
        postedBy: googleRecruiter._id,
        drive: drive._id,
        role: 'ML Engineer',
        jobType: 'Full-time',
        location: 'Gurugram / Remote',
        packageCtc: '18 - 24',
        description: 'Develop personalized food recommendation models and hyper-accurate delivery ETAs using deep learning algorithms.',
        requirements: [
          'Knowledge of machine learning algorithms (Collaborative Filtering, Deep Learning).',
          'Proficiency in Python, PyTorch/TensorFlow, and feature engineering.',
        ],
        skillsRequired: ['Python', 'Machine Learning', 'PyTorch', 'TensorFlow', 'SQL', 'Data Science'],
        minCgpa: 7.5,
        maxBacklogs: 0,
        eligibleBranches: ['Computer Science and Engineering', 'Information Technology', 'Artificial Intelligence & Data Science'],
        eligiblePassingYears: [2026],
        deadline: new Date('2026-12-20'),
        status: 'active',
      },
      {
        title: 'Junior Full-Stack Engineer',
        company: nextgenCompany._id,
        postedBy: googleRecruiter._id,
        drive: drive._id,
        role: 'Software Engineer',
        jobType: 'Full-time',
        location: 'Bengaluru (Remote)',
        packageCtc: '8 - 12',
        description: 'Join a fast-paced fintech startup to build customer-facing dashboards and micro-payment API integrations.',
        requirements: [
          'Comfortable with JavaScript/TypeScript, React, Node.js, and SQL databases.',
          'Quick learner enthusiastic about high-growth startup environments.',
        ],
        skillsRequired: ['JavaScript', 'Node.js', 'React', 'SQL', 'Git', 'REST APIs'],
        minCgpa: 6.0,
        maxBacklogs: 1,
        eligibleBranches: ['Computer Science and Engineering', 'Information Technology', 'Electronics and Communication Engineering', 'Artificial Intelligence & Data Science'],
        eligiblePassingYears: [2026],
        deadline: new Date('2026-12-30'),
        status: 'active',
      },
    ]);

    // ── 6. CREATE 8 DIVERSE STUDENTS ──────────────────────────
    const studentData = [
      {
        name: 'Rahul Sharma',
        email: 'rahul.sharma@placeonix.edu',
        rollNo: '22CS045',
        phone: '+91 98450 11223',
        branch: 'Computer Science and Engineering',
        cgpa: 8.85,
        passingYear: 2026,
        backlogs: 0,
        skills: ['JavaScript', 'Node.js', 'React', 'Data Structures', 'MongoDB', 'Python', 'AWS'],
        linkedin: 'https://linkedin.com/in/rahulsharma',
        github: 'https://github.com/rahulsharma',
        bio: 'Enthusiastic full-stack engineer passionate about scalable backend microservices and distributed algorithms.',
      },
      {
        name: 'Priya Patel',
        email: 'priya.patel@placeonix.edu',
        rollNo: '22IT018',
        phone: '+91 98450 22334',
        branch: 'Information Technology',
        cgpa: 8.40,
        passingYear: 2026,
        backlogs: 0,
        skills: ['Python', 'SQL', 'Machine Learning', 'Data Analysis', 'Pandas', 'Tableau'],
        linkedin: 'https://linkedin.com/in/priyapatel',
        github: 'https://github.com/priyapatel',
        bio: 'AI/ML enthusiast focused on predictive analytics, statistical modelling, and natural language processing applications.',
      },
      {
        name: 'Arjun Kumar',
        email: 'arjun.kumar@placeonix.edu',
        rollNo: '22EC062',
        phone: '+91 98450 33445',
        branch: 'Electronics and Communication Engineering',
        cgpa: 7.20,
        passingYear: 2026,
        backlogs: 0,
        skills: ['Embedded C', 'IoT', 'Python', 'Verilog', 'Microcontrollers', 'C++'],
        linkedin: 'https://linkedin.com/in/arjunkumar',
        github: 'https://github.com/arjunkumar',
        bio: 'ECE undergraduate with hands-on expertise in IoT hardware-software systems, embedded firmware, and microcontroller programming.',
      },
      {
        name: 'Sneha Reddy',
        email: 'sneha.reddy@placeonix.edu',
        rollNo: '22AI012',
        phone: '+91 98450 44556',
        branch: 'Artificial Intelligence & Data Science',
        cgpa: 9.25,
        passingYear: 2026,
        backlogs: 0,
        skills: ['PyTorch', 'TensorFlow', 'Deep Learning', 'Computer Vision', 'Python', 'NLP', 'Docker'],
        linkedin: 'https://linkedin.com/in/snehareddy',
        github: 'https://github.com/snehareddy',
        bio: 'Gold medalist candidate with research background in Computer Vision, Transformer models, and deep neural architecture design.',
      },
      {
        name: 'Ankit Verma',
        email: 'ankit.verma@placeonix.edu',
        rollNo: '22CS089',
        phone: '+91 98450 55667',
        branch: 'Computer Science and Engineering',
        cgpa: 7.80,
        passingYear: 2026,
        backlogs: 0,
        skills: ['Java', 'Spring Boot', 'Microservices', 'MySQL', 'Docker', 'Kafka', 'System Design'],
        linkedin: 'https://linkedin.com/in/ankitverma',
        github: 'https://github.com/ankitverma',
        bio: 'Backend specialist dedicated to high-availability Java enterprise architectures and asynchronous event-driven systems.',
      },
      {
        name: 'Divya Nair',
        email: 'divya.nair@placeonix.edu',
        rollNo: '22CS104',
        phone: '+91 98450 66778',
        branch: 'Computer Science and Engineering',
        cgpa: 8.60,
        passingYear: 2026,
        backlogs: 0,
        skills: ['TypeScript', 'React', 'Next.js', 'Tailwind CSS', 'GraphQL', 'Redux', 'Jest'],
        linkedin: 'https://linkedin.com/in/divyanair',
        github: 'https://github.com/divyanair',
        bio: 'Frontend engineer crafting pixel-perfect, accessible, and high-performance modern web experiences.',
      },
      {
        name: 'Karan Singh',
        email: 'karan.singh@placeonix.edu',
        rollNo: '22IT054',
        phone: '+91 98450 77889',
        branch: 'Information Technology',
        cgpa: 7.45,
        passingYear: 2026,
        backlogs: 0,
        skills: ['Go', 'Kubernetes', 'Cloud Infrastructure', 'Linux', 'CI/CD', 'AWS', 'Terraform'],
        linkedin: 'https://linkedin.com/in/karansingh',
        github: 'https://github.com/karansingh',
        bio: 'DevOps & Site Reliability engineer passionate about automating deployment pipelines and container cluster orchestration.',
      },
      {
        name: 'Ritu Gupta',
        email: 'ritu.gupta@placeonix.edu',
        rollNo: '22AI031',
        phone: '+91 98450 88990',
        branch: 'Artificial Intelligence & Data Science',
        cgpa: 8.10,
        passingYear: 2026,
        backlogs: 0,
        skills: ['Data Science', 'PowerBI', 'Tableau', 'SQL', 'Statistics', 'Python', 'Machine Learning'],
        linkedin: 'https://linkedin.com/in/ritugupta',
        github: 'https://github.com/ritugupta',
        bio: 'Data Analyst turning complex data into actionable operational insights through intuitive dashboards and predictive models.',
      },
    ];

    const studentUsers = [];
    const studentProfiles = [];

    for (const s of studentData) {
      const u = await User.create({
        name: s.name,
        email: s.email,
        password: 'student123',
        role: 'student',
        isActive: true,
        college: 'Placeonix Institute of Technology',
      });
      const p = await StudentProfile.create({
        user: u._id,
        rollNo: s.rollNo,
        phone: s.phone,
        branch: s.branch,
        cgpa: s.cgpa,
        passingYear: s.passingYear,
        backlogs: s.backlogs,
        skills: s.skills,
        linkedin: s.linkedin,
        github: s.github,
        bio: s.bio,
        isProfileComplete: true,
      });
      studentUsers.push(u);
      studentProfiles.push(p);
    }

    // ── 7. CREATE REALISTIC PIPELINE APPLICATIONS ──────────────
    // 1. Rahul Sharma -> Google Associate SDE (Selected)
    await Application.create({
      job: jobs[0]._id,
      student: studentUsers[0]._id,
      studentProfile: studentProfiles[0]._id,
      status: 'selected',
      appliedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
      feedback: 'Outstanding technical performance across all rounds. Formal offer extended 🎉',
    });

    // 2. Rahul Sharma -> Microsoft Cloud & AI (Interview)
    await Application.create({
      job: jobs[2]._id,
      student: studentUsers[0]._id,
      studentProfile: studentProfiles[0]._id,
      status: 'interview',
      appliedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      interviewDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      interviewMode: 'Microsoft Teams Video Interview',
      feedback: 'Shortlisted for Technical Round 2 (System Design & Distributed Systems).',
    });

    // 3. Sneha Reddy -> Goldman Sachs Quantitative Analyst (Selected)
    await Application.create({
      job: jobs[6]._id,
      student: studentUsers[3]._id,
      studentProfile: studentProfiles[3]._id,
      status: 'selected',
      appliedAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
      feedback: 'Exceptional mathematical and analytical capability. Offer confirmed at 28 LPA!',
    });

    // 4. Sneha Reddy -> Zomato Machine Learning Engineer (Interview)
    await Application.create({
      job: jobs[11]._id,
      student: studentUsers[3]._id,
      studentProfile: studentProfiles[3]._id,
      status: 'interview',
      appliedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      interviewDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      interviewMode: 'Google Meet',
      feedback: 'Coding assessment cleared with 100% score. Final ML architecture discussion scheduled.',
    });

    // 5. Divya Nair -> Microsoft Frontend & UI (Shortlisted)
    await Application.create({
      job: jobs[3]._id,
      student: studentUsers[5]._id,
      studentProfile: studentProfiles[5]._id,
      status: 'shortlisted',
      appliedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      feedback: 'Strong portfolio and clean UI component designs. Online assessment link dispatched.',
    });

    // 6. Ankit Verma -> Amazon SDE Backend (Interview)
    await Application.create({
      job: jobs[4]._id,
      student: studentUsers[4]._id,
      studentProfile: studentProfiles[4]._id,
      status: 'interview',
      appliedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
      interviewDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
      interviewMode: 'Amazon Chime',
      feedback: 'Round 1 cleared. Advanced concurrency and database scaling round scheduled.',
    });

    // 7. Priya Patel -> Zomato Machine Learning Engineer (Shortlisted)
    await Application.create({
      job: jobs[11]._id,
      student: studentUsers[1]._id,
      studentProfile: studentProfiles[1]._id,
      status: 'shortlisted',
      appliedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      feedback: 'Profile shortlisted based on machine learning project portfolio.',
    });

    // 8. Karan Singh -> Amazon Cloud Support (Applied)
    await Application.create({
      job: jobs[5]._id,
      student: studentUsers[6]._id,
      studentProfile: studentProfiles[6]._id,
      status: 'applied',
      appliedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    });

    // 9. Arjun Kumar -> Google Cloud Platform Intern (Applied)
    await Application.create({
      job: jobs[1]._id,
      student: studentUsers[2]._id,
      studentProfile: studentProfiles[2]._id,
      status: 'under_review',
      appliedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      feedback: 'Application under initial screening by university recruitment coordinator.',
    });

    // 10. Ritu Gupta -> Flipkart Core SDE (Applied)
    await Application.create({
      job: jobs[8]._id,
      student: studentUsers[7]._id,
      studentProfile: studentProfiles[7]._id,
      status: 'applied',
      appliedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    });

    // ── 8. CREATE SAMPLE NOTIFICATIONS ────────────────────────
    await Notification.create([
      {
        recipient: studentUsers[0]._id,
        title: '🌟 Placement Offer Confirmed!',
        message: 'Congratulations! Google India has confirmed your selection for Associate SDE-1.',
        type: 'application_update',
        link: '/student-dashboard.html',
        isRead: false,
      },
      {
        recipient: studentUsers[0]._id,
        title: '📅 Interview Scheduled',
        message: 'Microsoft IDC scheduled your Technical Round 2 interview for Friday.',
        type: 'application_update',
        link: '/student-dashboard.html',
        isRead: true,
      },
      {
        recipient: studentUsers[3]._id,
        title: '🎉 Placement Offer Extended!',
        message: 'Goldman Sachs extended you an offer for Quantitative & FinTech Analyst (28 LPA).',
        type: 'application_update',
        link: '/student-dashboard.html',
        isRead: false,
      },
      {
        recipient: googleRecruiter._id,
        title: 'Candidate Application Received',
        message: 'Rahul Sharma submitted application for Associate SDE-1.',
        type: 'application_update',
        link: `/recruiter-dashboard.html`,
        isRead: true,
      },
    ]);

    console.log(`
  =======================================================
  ✅ PLACEONIX DATABASE SEEDED WITH RICH DEMO DATA!
  =======================================================
  📊 Data Seeded:
     • 1 System Administrator
     • 7 Partner Companies (Google, Microsoft, AWS, Goldman Sachs, Flipkart, Zomato, NextGen)
     • 5 Active Recruiter Accounts
     • 13 Verified Job Offers / Openings
     • 8 Student Profiles across CSE, IT, ECE, AI/DS
     • 10 Applications across all stages (Selected, Interview, Shortlisted, Applied)
     • 4 Interactive Notifications

  Demo Login Credentials:
  -------------------------------------------------------
  👑 ADMIN:
     Email:    admin@placeonix.edu (or username: admin)
     Password: admin123

  🏢 RECRUITERS:
     • Google:        recruiter.google@placeonix.com (pass: recruiter123)
     • Microsoft:     recruiter.msft@placeonix.com   (pass: recruiter123)
     • AWS:           recruiter.amazon@placeonix.com (pass: recruiter123)
     • Goldman Sachs: recruiter.gs@placeonix.com     (pass: recruiter123)
     • Flipkart:      recruiter.flipkart@placeonix.com (pass: recruiter123)

  🎓 STUDENTS:
     • Rahul Sharma (CSE, 8.85 CGPA): rahul.sharma@placeonix.edu (pass: student123)
     • Sneha Reddy  (AI, 9.25 CGPA):  sneha.reddy@placeonix.edu  (pass: student123)
     • Divya Nair   (CSE, 8.60 CGPA): divya.nair@placeonix.edu   (pass: student123)
     • Priya Patel  (IT, 8.40 CGPA):  priya.patel@placeonix.edu  (pass: student123)
     • Ritu Gupta   (AI, 8.10 CGPA):  ritu.gupta@placeonix.edu   (pass: student123)
     • Ankit Verma  (CSE, 7.80 CGPA): ankit.verma@placeonix.edu  (pass: student123)
     • Karan Singh  (IT, 7.45 CGPA):  karan.singh@placeonix.edu  (pass: student123)
     • Arjun Kumar  (ECE, 7.20 CGPA): arjun.kumar@placeonix.edu  (pass: student123)
  =======================================================
    `);

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
};

seedData();
