module.exports = [
    {
        id: 'excellent-platform-engineer',
        input: {
            rawScore: 92,
            rawJdScore: 94,
            rubric: { mustHaveCoverage: 92, experienceRelevance: 90, impactEvidence: 88, roleSpecificity: 90, writingClarity: 84 },
            riskFlags: [],
            missingKeywords: [],
            cvText: 'Senior platform engineer with 11 years of experience. Reduced cloud spend by 31% and improved uptime to 99.99%.',
            jdText: 'Principal platform engineer. Minimum of 10 years of experience. Must own Kubernetes, AWS, Terraform and SRE reliability.'
        },
        expected: { scoreBand: [72, 92], jdScoreBand: [75, 95] }
    },
    {
        id: 'strong-product-fit',
        input: {
            rawScore: 88,
            rawJdScore: 90,
            rubric: { mustHaveCoverage: 84, experienceRelevance: 86, impactEvidence: 79, roleSpecificity: 82, writingClarity: 80 },
            riskFlags: [],
            missingKeywords: ['PLG'],
            cvText: 'Product manager with 8 years of experience. Increased activation by 22% and reduced churn by 11%.',
            jdText: 'Senior PM role, 7+ years required, B2B SaaS growth and roadmap ownership.'
        },
        expected: { scoreBand: [66, 86], jdScoreBand: [64, 84] }
    },
    {
        id: 'good-analyst-fit-minor-gaps',
        input: {
            rawScore: 82,
            rawJdScore: 84,
            rubric: { mustHaveCoverage: 74, experienceRelevance: 76, impactEvidence: 70, roleSpecificity: 71, writingClarity: 78 },
            riskFlags: ['tooling_gap'],
            missingKeywords: ['Looker'],
            cvText: 'Data analyst with 6 years of experience. Built KPI dashboards and improved reporting cycle time by 40%.',
            jdText: 'Lead analyst, at least 5 years. SQL, Python, Looker and stakeholder communication.'
        },
        expected: { scoreBand: [58, 80], jdScoreBand: [52, 76] }
    },
    {
        id: 'mid-fit-partial-alignment',
        input: {
            rawScore: 78,
            rawJdScore: 76,
            rubric: { mustHaveCoverage: 62, experienceRelevance: 64, impactEvidence: 58, roleSpecificity: 60, writingClarity: 74 },
            riskFlags: ['vague_experience'],
            missingKeywords: ['CI/CD', 'AWS'],
            cvText: 'Software engineer with 5 years of experience in frontend and APIs.',
            jdText: 'Backend engineer role, 5+ years required, AWS, CI/CD, and distributed systems.'
        },
        expected: { scoreBand: [44, 68], jdScoreBand: [36, 62] }
    },
    {
        id: 'mid-fit-no-jd',
        input: {
            rawScore: 80,
            rawJdScore: 0,
            rubric: { mustHaveCoverage: 0, experienceRelevance: 72, impactEvidence: 68, roleSpecificity: 70, writingClarity: 80 },
            riskFlags: [],
            missingKeywords: [],
            cvText: 'Operations manager with 9 years of experience leading process improvement programs.',
            jdText: ''
        },
        expected: { scoreBand: [56, 78], jdScoreBand: [0, 0] }
    },
    {
        id: 'weaker-fit-domain-mismatch',
        input: {
            rawScore: 74,
            rawJdScore: 72,
            rubric: { mustHaveCoverage: 50, experienceRelevance: 56, impactEvidence: 52, roleSpecificity: 42, writingClarity: 72 },
            riskFlags: ['domain_mismatch'],
            missingKeywords: ['healthcare compliance', 'HIPAA', 'FHIR'],
            cvText: 'Generalist PM with 7 years experience in e-commerce and adtech.',
            jdText: 'Healthcare PM role, minimum of 6 years, HIPAA, FHIR, provider workflows.'
        },
        expected: { scoreBand: [34, 60], jdScoreBand: [20, 50] }
    },
    {
        id: 'seniority-gap-clear',
        input: {
            rawScore: 76,
            rawJdScore: 74,
            rubric: { mustHaveCoverage: 58, experienceRelevance: 55, impactEvidence: 54, roleSpecificity: 56, writingClarity: 70 },
            riskFlags: ['seniority_gap'],
            missingKeywords: ['org design', 'exec communication'],
            cvText: 'Engineering lead with 4 years of experience managing a small team.',
            jdText: 'Director of Engineering, 10+ years required, org design, executive communication.'
        },
        expected: { scoreBand: [28, 56], jdScoreBand: [10, 42] }
    },
    {
        id: 'missing-must-haves',
        input: {
            rawScore: 73,
            rawJdScore: 78,
            rubric: { mustHaveCoverage: 35, experienceRelevance: 60, impactEvidence: 57, roleSpecificity: 52, writingClarity: 75 },
            riskFlags: ['missing_required_skill'],
            missingKeywords: ['Python', 'AWS', 'Terraform', 'Kubernetes', 'Spark', 'Airflow'],
            cvText: 'Business analyst with 6 years of experience improving operations and reporting.',
            jdText: 'Data platform engineer, 6+ years required. Must have Python, AWS, Terraform, Kubernetes, Spark and Airflow.'
        },
        expected: { scoreBand: [24, 52], jdScoreBand: [6, 36] }
    },
    {
        id: 'strong-exec-cv-no-numbers-penalty',
        input: {
            rawScore: 86,
            rawJdScore: 88,
            rubric: { mustHaveCoverage: 82, experienceRelevance: 84, impactEvidence: 38, roleSpecificity: 80, writingClarity: 84 },
            riskFlags: ['weak_impact_metrics'],
            missingKeywords: [],
            cvText: 'VP Product with 15 years of experience leading global teams and launching multiple products.',
            jdText: 'VP Product, minimum 12 years, global leadership and portfolio strategy.'
        },
        expected: { scoreBand: [52, 74], jdScoreBand: [46, 72] }
    },
    {
        id: 'junior-cv-senior-jd',
        input: {
            rawScore: 70,
            rawJdScore: 68,
            rubric: { mustHaveCoverage: 44, experienceRelevance: 48, impactEvidence: 52, roleSpecificity: 44, writingClarity: 66 },
            riskFlags: ['seniority_gap', 'missing_required_skill'],
            missingKeywords: ['mentoring', 'architecture', 'scalability', 'kubernetes'],
            cvText: 'Software engineer with 2 years of experience building internal tools.',
            jdText: 'Senior backend engineer, 7+ years required, architecture and scalability ownership.'
        },
        expected: { scoreBand: [18, 42], jdScoreBand: [0, 24] }
    },
    {
        id: 'ats-friendly-marketing-good-fit',
        input: {
            rawScore: 84,
            rawJdScore: 85,
            rubric: { mustHaveCoverage: 78, experienceRelevance: 80, impactEvidence: 76, roleSpecificity: 77, writingClarity: 82 },
            riskFlags: [],
            missingKeywords: ['lifecycle email'],
            cvText: 'Growth marketer with 7 years of experience. Improved CAC efficiency by 18% and conversion by 26%.',
            jdText: 'Growth marketing manager, 6+ years, paid social, lifecycle and experimentation.'
        },
        expected: { scoreBand: [62, 84], jdScoreBand: [58, 82] }
    },
    {
        id: 'consultant-to-product-shift',
        input: {
            rawScore: 79,
            rawJdScore: 75,
            rubric: { mustHaveCoverage: 57, experienceRelevance: 60, impactEvidence: 66, roleSpecificity: 52, writingClarity: 81 },
            riskFlags: ['domain_mismatch'],
            missingKeywords: ['roadmap ownership', 'A/B testing', 'PLG'],
            cvText: 'Management consultant with 9 years of experience delivering transformation projects.',
            jdText: 'Senior Product Manager in SaaS, 7+ years required, roadmap, A/B testing, PLG.'
        },
        expected: { scoreBand: [40, 66], jdScoreBand: [26, 56] }
    },
    {
        id: 'ops-manager-to-project-manager-close-fit',
        input: {
            rawScore: 81,
            rawJdScore: 80,
            rubric: { mustHaveCoverage: 70, experienceRelevance: 72, impactEvidence: 69, roleSpecificity: 68, writingClarity: 76 },
            riskFlags: [],
            missingKeywords: ['PMP'],
            cvText: 'Operations manager with 8 years of experience. Improved on-time delivery from 82% to 96%.',
            jdText: 'Project manager role, minimum of 6 years, cross-functional delivery and stakeholder reporting.'
        },
        expected: { scoreBand: [56, 78], jdScoreBand: [52, 76] }
    },
    {
        id: 'cybersecurity-specialist-strong-fit',
        input: {
            rawScore: 90,
            rawJdScore: 92,
            rubric: { mustHaveCoverage: 90, experienceRelevance: 88, impactEvidence: 82, roleSpecificity: 91, writingClarity: 78 },
            riskFlags: [],
            missingKeywords: [],
            cvText: 'Security engineer with 10 years of experience. Reduced incident response time by 45% and led SOC automation.',
            jdText: 'Senior security engineer, 8+ years required, SIEM, threat detection, incident response leadership.'
        },
        expected: { scoreBand: [70, 90], jdScoreBand: [74, 94] }
    },
    {
        id: 'cybersecurity-to-data-role-mismatch',
        input: {
            rawScore: 76,
            rawJdScore: 69,
            rubric: { mustHaveCoverage: 42, experienceRelevance: 50, impactEvidence: 68, roleSpecificity: 34, writingClarity: 76 },
            riskFlags: ['domain_mismatch', 'missing_required_skill'],
            missingKeywords: ['dbt', 'Snowflake', 'Looker', 'ETL'],
            cvText: 'Security engineer with 9 years experience in SOC, incident response and IAM.',
            jdText: 'Senior analytics engineer, 7+ years required, dbt, Snowflake, ETL and BI tooling.'
        },
        expected: { scoreBand: [24, 50], jdScoreBand: [0, 28] }
    },
    {
        id: 'high-raw-but-vague-should-drop',
        input: {
            rawScore: 91,
            rawJdScore: 90,
            rubric: { mustHaveCoverage: 66, experienceRelevance: 58, impactEvidence: 28, roleSpecificity: 54, writingClarity: 82 },
            riskFlags: ['vague_experience', 'weak_impact_metrics'],
            missingKeywords: ['ownership', 'scalability'],
            cvText: 'Experienced leader with many accomplishments across industries and teams.',
            jdText: 'Head of Operations, 8+ years required, operations excellence and scalability ownership.'
        },
        expected: { scoreBand: [28, 58], jdScoreBand: [18, 52] }
    },
    {
        id: 'clear-entry-level-fit',
        input: {
            rawScore: 72,
            rawJdScore: 76,
            rubric: { mustHaveCoverage: 74, experienceRelevance: 70, impactEvidence: 62, roleSpecificity: 71, writingClarity: 72 },
            riskFlags: [],
            missingKeywords: ['Tableau'],
            cvText: 'Analyst with 1 year of experience in internships and junior reporting roles. Improved reporting quality by 15%.',
            jdText: 'Junior analyst role, 1+ years required, SQL, Tableau and stakeholder reporting.'
        },
        expected: { scoreBand: [50, 74], jdScoreBand: [48, 72] }
    },
    {
        id: 'job-hopping-concern-penalty',
        input: {
            rawScore: 83,
            rawJdScore: 80,
            rubric: { mustHaveCoverage: 75, experienceRelevance: 73, impactEvidence: 64, roleSpecificity: 70, writingClarity: 80 },
            riskFlags: ['job_hopping_concern'],
            missingKeywords: [],
            cvText: 'Engineer with 7 years of experience across six short roles, each under 12 months.',
            jdText: 'Senior engineer, 6+ years required, long-term ownership and platform stability.'
        },
        expected: { scoreBand: [50, 74], jdScoreBand: [46, 72] }
    },
    {
        id: 'leadership-gap-for-manager-role',
        input: {
            rawScore: 80,
            rawJdScore: 77,
            rubric: { mustHaveCoverage: 68, experienceRelevance: 70, impactEvidence: 66, roleSpecificity: 63, writingClarity: 79 },
            riskFlags: ['no_leadership_evidence'],
            missingKeywords: ['people management', 'hiring'],
            cvText: 'Senior IC engineer with 9 years of experience and strong technical delivery.',
            jdText: 'Engineering manager, minimum 8 years, people management and hiring experience required.'
        },
        expected: { scoreBand: [44, 70], jdScoreBand: [30, 60] }
    },
    {
        id: 'excellent-consulting-fit',
        input: {
            rawScore: 89,
            rawJdScore: 91,
            rubric: { mustHaveCoverage: 88, experienceRelevance: 86, impactEvidence: 82, roleSpecificity: 84, writingClarity: 83 },
            riskFlags: [],
            missingKeywords: [],
            cvText: 'Senior consultant with 12 years experience. Delivered programs worth $25M and improved NPS by 14 points.',
            jdText: 'Principal consultant, 10+ years required, transformation delivery and client leadership.'
        },
        expected: { scoreBand: [68, 88], jdScoreBand: [72, 92] }
    },
    {
        id: 'partial-tools-gap',
        input: {
            rawScore: 77,
            rawJdScore: 79,
            rubric: { mustHaveCoverage: 64, experienceRelevance: 69, impactEvidence: 67, roleSpecificity: 66, writingClarity: 74 },
            riskFlags: ['tooling_gap'],
            missingKeywords: ['Databricks', 'Kafka'],
            cvText: 'Data engineer with 7 years of experience. Built reliable batch pipelines and cut failures by 33%.',
            jdText: 'Senior data engineer, 6+ years required, Kafka, Databricks and cloud ETL.'
        },
        expected: { scoreBand: [48, 72], jdScoreBand: [38, 66] }
    },
    {
        id: 'poor-fit-low-evidence',
        input: {
            rawScore: 65,
            rawJdScore: 60,
            rubric: { mustHaveCoverage: 30, experienceRelevance: 38, impactEvidence: 22, roleSpecificity: 34, writingClarity: 68 },
            riskFlags: ['missing_required_skill', 'vague_experience', 'weak_impact_metrics'],
            missingKeywords: ['Python', 'AWS', 'Kubernetes', 'Terraform', 'CI/CD', 'microservices', 'observability'],
            cvText: 'Professional with experience in many areas and strong motivation.',
            jdText: 'Senior platform engineer, 7+ years required with AWS, Kubernetes, Terraform and CI/CD.'
        },
        expected: { scoreBand: [0, 30], jdScoreBand: [0, 20] }
    },
    {
        id: 'content-writer-to-engineer-role',
        input: {
            rawScore: 58,
            rawJdScore: 52,
            rubric: { mustHaveCoverage: 18, experienceRelevance: 24, impactEvidence: 36, roleSpecificity: 16, writingClarity: 82 },
            riskFlags: ['domain_mismatch', 'missing_required_skill'],
            missingKeywords: ['Java', 'Spring', 'AWS', 'microservices'],
            cvText: 'Content writer with 6 years experience producing editorial campaigns.',
            jdText: 'Backend engineer, minimum of 5 years, Java, Spring and AWS.'
        },
        expected: { scoreBand: [0, 24], jdScoreBand: [0, 16] }
    },
    {
        id: 'highly-relevant-but-understated',
        input: {
            rawScore: 74,
            rawJdScore: 78,
            rubric: { mustHaveCoverage: 80, experienceRelevance: 82, impactEvidence: 48, roleSpecificity: 80, writingClarity: 73 },
            riskFlags: ['weak_impact_metrics'],
            missingKeywords: [],
            cvText: 'Operations specialist with 9 years of experience in supply chain and planning.',
            jdText: 'Operations manager, 8+ years required, supply chain optimization and planning.'
        },
        expected: { scoreBand: [52, 74], jdScoreBand: [52, 76] }
    },
    {
        id: 'tight-fit-with-small-seniority-gap',
        input: {
            rawScore: 85,
            rawJdScore: 83,
            rubric: { mustHaveCoverage: 79, experienceRelevance: 78, impactEvidence: 74, roleSpecificity: 76, writingClarity: 77 },
            riskFlags: ['seniority_gap'],
            missingKeywords: ['budget ownership'],
            cvText: 'Program manager with 6 years of experience running cross-functional delivery programs.',
            jdText: 'Senior program manager, minimum of 8 years, budget ownership and stakeholder leadership.'
        },
        expected: { scoreBand: [52, 76], jdScoreBand: [40, 66] }
    }
];
