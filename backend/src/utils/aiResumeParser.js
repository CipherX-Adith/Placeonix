const { PDFExtract } = require('pdf-parse');
const fs = require('fs');

/**
 * Intelligent AI Resume Parser
 * Extracts candidate profile fields from PDF, DOC, DOCX, or text content.
 */

const KNOWN_SKILLS = [
  'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C', 'C#', 'PHP', 'Ruby', 'Go', 'Rust', 'Kotlin', 'Swift',
  'HTML', 'HTML5', 'CSS', 'CSS3', 'Sass', 'TailwindCSS', 'Bootstrap',
  'React', 'React.js', 'Next.js', 'Vue.js', 'Angular', 'Svelte', 'Redux',
  'Node.js', 'Express', 'Express.js', 'Nest.js', 'Django', 'Flask', 'FastAPI', 'Spring Boot', 'ASP.NET',
  'MongoDB', 'PostgreSQL', 'MySQL', 'SQLite', 'Redis', 'Firebase', 'Supabase', 'Cassandra', 'DynamoDB',
  'AWS', 'Azure', 'GCP', 'Google Cloud', 'Docker', 'Kubernetes', 'CI/CD', 'Jenkins', 'Terraform', 'Linux',
  'Git', 'GitHub', 'GitLab', 'REST APIs', 'GraphQL', 'Microservices', 'WebSockets', 'Kafka', 'RabbitMQ',
  'Machine Learning', 'Deep Learning', 'Data Science', 'TensorFlow', 'PyTorch', 'Scikit-learn', 'NLP', 'Computer Vision', 'Pandas', 'NumPy',
  'Data Structures', 'Algorithms', 'OOP', 'DBMS', 'Operating Systems', 'System Design', 'Agile', 'Scrum', 'Figma'
];

const BRANCH_MAP = [
  { match: /(computer\s*science|cse|cs\b|software\s*eng)/i, name: 'Computer Science and Engineering' },
  { match: /(information\s*tech|it\b|infotech)/i, name: 'Information Technology' },
  { match: /(electronics.*communication|ece\b|electronics\s*&\s*comm)/i, name: 'Electronics and Communication Engineering' },
  { match: /(artificial\s*intelligence|ai\s*(&|and)?\s*ds|data\s*science|ai\s*(&|and)?\s*ml)/i, name: 'Artificial Intelligence & Data Science' },
  { match: /(mechanical|mech\b)/i, name: 'Mechanical Engineering' },
  { match: /(civil\b|structural)/i, name: 'Civil Engineering' },
  { match: /(electrical|eee\b|electrical\s*&\s*electronics)/i, name: 'Electrical Engineering' }
];

async function extractTextFromResume(filePath, mimeType) {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    
    // Attempt pdf parse if PDF
    if (filePath.endsWith('.pdf') || mimeType === 'application/pdf') {
      try {
        const pdfParse = require('pdf-parse');
        // Handle both default function and object export depending on pdf-parse version
        if (typeof pdfParse === 'function') {
          const pdfData = await pdfParse(dataBuffer);
          if (pdfData && pdfData.text) return pdfData.text;
        } else if (pdfParse.default && typeof pdfParse.default === 'function') {
          const pdfData = await pdfParse.default(dataBuffer);
          if (pdfData && pdfData.text) return pdfData.text;
        }
      } catch (pdfErr) {
        console.warn('pdf-parse standard extraction fallback:', pdfErr.message);
      }
    }

    // Fallback: read as UTF-8 string or filter ascii characters
    const rawString = dataBuffer.toString('utf-8');
    const cleaned = rawString.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, ' ');
    if (cleaned.length > 50) return cleaned;

    return rawString;
  } catch (err) {
    console.error('Error reading resume file:', err);
    return '';
  }
}

function parseResumeText(rawText) {
  if (!rawText || typeof rawText !== 'string') {
    return { extractedFieldsCount: 0, fields: {} };
  }

  const text = rawText.replace(/\r\n/g, '\n');
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const fullText = text.toLowerCase();

  const extracted = {};
  let count = 0;

  // 1. Extract Email
  const emailMatch = text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,7}\b/i);
  if (emailMatch) {
    extracted.email = emailMatch[0].trim();
    count++;
  }

  // 2. Extract Phone Number
  const phoneMatch = text.match(/(?:(?:\+91|0)?[ -]?)?[6-9]\d{9}\b|\(?\d{3}\)?[ -]?\d{3}[ -]?\d{4}\b/);
  if (phoneMatch) {
    extracted.phone = phoneMatch[0].trim();
    count++;
  }

  // 3. Extract Full Name
  // Heuristic: First non-empty line that doesn't look like a title/email/phone
  for (let i = 0; i < Math.min(lines.length, 8); i++) {
    const line = lines[i];
    if (
      !/resume|curriculum|vitae|profile|page\s*\d|contact|email|phone/i.test(line) &&
      !line.includes('@') &&
      !line.includes('http') &&
      !/\d{5,}/.test(line) &&
      line.length >= 3 &&
      line.length <= 40 &&
      /^[A-Za-z\s.]+$/.test(line)
    ) {
      extracted.name = line.trim();
      count++;
      break;
    }
  }

  // 4. Extract Roll / Registration / USN number
  const rollMatch = text.match(/(?:roll\s*(?:no|number)?|reg(?:istration)?\s*(?:no|number)?|usn|student\s*id)[\s:=#-]+([A-Za-z0-9]{5,15})/i) ||
                    text.match(/\b(2[0-4][A-Za-z]{2,4}\d{2,5}|RA\d{10,14}|1[A-Za-z]{2}\d{2}[A-Za-z]{2}\d{3})\b/);
  if (rollMatch) {
    extracted.rollNo = (rollMatch[1] || rollMatch[0]).trim().toUpperCase();
    count++;
  }

  // 5. Extract Branch / Department
  for (const b of BRANCH_MAP) {
    if (b.match.test(text)) {
      extracted.branch = b.name;
      count++;
      break;
    }
  }

  // 6. Extract CGPA / GPA / Percentage
  const cgpaMatch = text.match(/(?:cgpa|gpa|score)[\s:=#-]+(\d{1,2}(?:\.\d{1,2})?)(?:\s*(?:\/|\s*out of\s*)\s*10(?:\.0)?)?/i) ||
                    text.match(/\b([6-9]\.\d{1,2}|10\.0)\s*(?:cgpa|gpa|\/10)\b/i) ||
                    text.match(/(?:percentage|aggregate)[\s:=#-]+(\d{2}(?:\.\d{1,2})?)\s*%/i);
  if (cgpaMatch) {
    let val = parseFloat(cgpaMatch[1] || cgpaMatch[0]);
    if (val > 10 && val <= 100) {
      // Percentage to CGPA estimate
      val = +(val / 9.5).toFixed(2);
    }
    if (val >= 0 && val <= 10) {
      extracted.cgpa = val;
      count++;
    }
  }

  // 7. Extract Passing / Graduation Year
  const yearMatch = text.match(/(?:graduation|passing|batch|class of|expected)[\s:=#-]+(?:20)?(2[4-9]|30)\b/i) ||
                    text.match(/\b20(2[4-9]|30)\b/) ||
                    text.match(/202[0-4]\s*[-–—]\s*(202[4-9]|2030)/);
  if (yearMatch) {
    const rawYear = yearMatch[1] || yearMatch[0];
    const fullYear = rawYear.length === 2 ? `20${rawYear}` : rawYear;
    const numYear = parseInt(fullYear, 10);
    if (numYear >= 2024 && numYear <= 2030) {
      extracted.passingYear = numYear;
      count++;
    }
  }

  // 8. Extract Active Backlogs
  const backlogsMatch = text.match(/(?:backlogs?|arrears?)[\s:=#-]+(\d+)/i) ||
                        text.match(/(?:no\s*active\s*backlogs?|zero\s*backlogs?|nil\s*backlogs?|0\s*backlogs?)/i);
  if (backlogsMatch) {
    const bVal = backlogsMatch[1] ? parseInt(backlogsMatch[1], 10) : 0;
    extracted.backlogs = isNaN(bVal) ? 0 : bVal;
    count++;
  } else {
    extracted.backlogs = 0;
  }

  // 9. Extract Technical Skills
  const foundSkills = new Set();
  for (const skill of KNOWN_SKILLS) {
    const regex = new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (regex.test(text)) {
      foundSkills.add(skill);
    }
  }
  if (foundSkills.size > 0) {
    extracted.skills = Array.from(foundSkills);
    count++;
  }

  // 10. Extract LinkedIn & GitHub
  const linkedinMatch = text.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[A-Za-z0-9_-]+/i);
  if (linkedinMatch) {
    let url = linkedinMatch[0];
    if (!url.startsWith('http')) url = `https://${url}`;
    extracted.linkedin = url;
    count++;
  }

  const githubMatch = text.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/[A-Za-z0-9_-]+/i);
  if (githubMatch) {
    let url = githubMatch[0];
    if (!url.startsWith('http')) url = `https://${url}`;
    extracted.github = url;
    count++;
  }

  // 11. Extract Summary / Bio or synthesize intelligent one
  const summaryMatch = text.match(/(?:summary|professional summary|about me|career objective|objective)[\s:\n]+([\s\S]{40,300}?)(?=\n\s*(?:skills|education|experience|projects|technical|certifications|$))/i);
  if (summaryMatch && summaryMatch[1]) {
    const cleanBio = summaryMatch[1].replace(/\s+/g, ' ').trim();
    if (cleanBio.length > 25) {
      extracted.bio = cleanBio;
      count++;
    }
  } else if (extracted.skills && extracted.skills.length > 0) {
    const topSkills = extracted.skills.slice(0, 4).join(', ');
    const branchName = extracted.branch || 'Engineering';
    extracted.bio = `Motivated ${branchName} student with strong hands-on expertise in ${topSkills}. Eager to contribute technical knowledge and problem-solving skills in high-impact development teams.`;
    count++;
  }

  // 12. Smart Role & Location Preferences
  const roles = [];
  if (extracted.skills) {
    const s = extracted.skills.map(x => x.toLowerCase());
    if (s.some(x => ['react', 'vue', 'angular', 'html', 'css', 'javascript'].includes(x))) roles.push('Frontend Developer');
    if (s.some(x => ['node.js', 'express', 'django', 'spring boot', 'mongodb', 'postgresql'].includes(x))) roles.push('Backend Developer');
    if (roles.includes('Frontend Developer') && roles.includes('Backend Developer')) roles.push('Full Stack Engineer');
    if (s.some(x => ['machine learning', 'python', 'deep learning', 'tensorflow', 'data science'].includes(x))) roles.push('AI/ML Engineer');
  }
  if (roles.length === 0) roles.push('Software Engineer', 'Graduate Engineer Trainee');

  extracted.prefRoles = roles;
  extracted.prefLocations = ['Bengaluru', 'Hyderabad', 'Pune', 'Remote'];
  extracted.prefJobTypes = ['Full-time', 'Internship'];

  return {
    success: true,
    extractedFieldsCount: count,
    fields: extracted,
  };
}

module.exports = {
  extractTextFromResume,
  parseResumeText,
};
