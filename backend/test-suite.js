const http = require('http');

const API_HOST = 'localhost';
const API_PORT = 5000;

function request(path, method = 'GET', body = null, token = null) {
  return new Promise((resolve, reject) => {
    const postData = body ? JSON.stringify(body) : null;
    const headers = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    if (postData) {
      headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = http.request(
      {
        host: API_HOST,
        port: API_PORT,
        path: `/api${path}`,
        method,
        headers,
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            resolve({ status: res.statusCode, data: parsed });
          } catch (e) {
            resolve({ status: res.statusCode, raw: data });
          }
        });
      }
    );

    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

async function runTests() {
  console.log('🚀 Starting Placeonix Full System End-to-End Validation...\n');
  let passCount = 0;
  let failCount = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passCount++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failCount++;
    }
  }

  try {
    // 1. Health Check
    console.log('--- 1. Testing Server Health ---');
    const health = await request('/health');
    assert(health.status === 200 && (health.data.status === 'success' || health.data.success), 'Health check returns 200 OK');

    // 2. Admin Authentication
    console.log('\n--- 2. Testing Admin Login & Operations ---');
    const adminLogin = await request('/auth/login', 'POST', {
      email: 'admin@placeonix.edu',
      password: 'admin123',
    });
    assert(adminLogin.status === 200 && adminLogin.data.token, 'Admin login with email returns JWT');
    const adminToken = adminLogin.data.token;

    // Admin Username Login
    const adminUserLogin = await request('/auth/login', 'POST', {
      email: 'admin',
      password: 'admin123',
    });
    assert(adminUserLogin.status === 200 && adminUserLogin.data.token, 'Admin login with "admin" username returns JWT');

    // Admin Analytics
    const adminStats = await request('/admin/analytics', 'GET', null, adminToken);
    assert(adminStats.status === 200 && adminStats.data.success, 'GET /admin/analytics succeeds');

    // Admin Users Directory
    const adminUsers = await request('/admin/users', 'GET', null, adminToken);
    assert(adminUsers.status === 200 && adminUsers.data.users.length >= 8, `GET /admin/users returned ${adminUsers.data.users?.length} stakeholders`);

    // Admin Companies
    const adminCompanies = await request('/admin/companies', 'GET', null, adminToken);
    assert(adminCompanies.status === 200 && adminCompanies.data.companies.length >= 7, `GET /admin/companies returned ${adminCompanies.data.companies?.length} companies`);

    // 3. Recruiter Authentication & Candidate Directory
    console.log('\n--- 3. Testing Recruiter Operations ---');
    const recLogin = await request('/auth/login', 'POST', {
      email: 'recruiter.google@placeonix.com',
      password: 'recruiter123',
    });
    assert(recLogin.status === 200 && recLogin.data.token, 'Google Recruiter login succeeds');
    const recToken = recLogin.data.token;

    // Recruiter Dashboard Summary
    const recSummary = await request('/recruiter/dashboard-summary', 'GET', null, recToken);
    assert(recSummary.status === 200 && recSummary.data.success, 'Recruiter dashboard summary returns metrics');

    // Recruiter Candidate Directory
    const recCandidates = await request('/recruiter/candidates', 'GET', null, recToken);
    assert(recCandidates.status === 200 && recCandidates.data.candidates.length >= 8, `Recruiter find talent returned ${recCandidates.data.candidates?.length} candidates`);

    // Recruiter Jobs
    const recJobs = await request('/recruiter/jobs', 'GET', null, recToken);
    assert(recJobs.status === 200 && recJobs.data.success, 'Recruiter get jobs succeeds');

    // 4. Student Authentication & Applications
    console.log('\n--- 4. Testing Student Operations ---');
    const studentLogin = await request('/auth/login', 'POST', {
      email: 'rahul.sharma@placeonix.edu',
      password: 'student123',
    });
    assert(studentLogin.status === 200 && studentLogin.data.token, 'Student (Rahul Sharma) login succeeds');
    const studentToken = studentLogin.data.token;

    // Student Dashboard Summary
    const studentSummary = await request('/student/dashboard-summary', 'GET', null, studentToken);
    assert(studentSummary.status === 200 && studentSummary.data.success, 'Student dashboard summary returns metrics');

    // Student Jobs Discover
    const studentJobs = await request('/student/jobs', 'GET', null, studentToken);
    assert(studentJobs.status === 200 && studentJobs.data.jobs.length >= 10, `Student discover returned ${studentJobs.data.jobs?.length} jobs`);

    // Student Applications
    const studentApps = await request('/student/applications', 'GET', null, studentToken);
    assert(studentApps.status === 200 && studentApps.data.applications.length >= 2, `Student applications returned ${studentApps.data.applications?.length} applications`);

    // Sneha Reddy Login
    const snehaLogin = await request('/auth/login', 'POST', {
      email: 'sneha.reddy@placeonix.edu',
      password: 'student123',
    });
    assert(snehaLogin.status === 200 && snehaLogin.data.user.name === 'Sneha Reddy', 'Student (Sneha Reddy) login succeeds');

    console.log(`\n=======================================================`);
    console.log(`🎉 TEST SUMMARY: ${passCount} PASSED, ${failCount} FAILED`);
    console.log(`=======================================================\n`);
  } catch (err) {
    console.error('Fatal test error:', err);
  }
}

runTests();
