export interface CvData {
    personalInfo: {
        fullName: string;
        jobTitle: string;
        email: string;
        phoneNumber: string;
        address: string;
        website: string;
        linkedin: string;
        github: string;
    };
    summary: string;
    workExperience: {
        id: string;
        jobTitle: string;
        company: string;
        location: string;
        startDate: string;
        endDate: string;
        responsibilities: string[];
    }[];
    education: {
        id: string;
        degree: string;
        institution: string;
        location: string;
        startDate: string;
        endDate: string;
        details?: string;
    }[];
    skills: {
        id: string;
        category: string;
        items: string[];
    }[];
    projects: {
        id: string;
        projectName: string;
        description: string;
        technologies: string[];
        link?: string;
    }[];
    languages: {
        id: string;
        language: string;
        proficiency: string;
    }[];
}

export const sampleCvData: CvData = {
    personalInfo: {
        fullName: "Jane Doe",
        jobTitle: "Senior Software Engineer",
        email: "jane.doe@example.com",
        phoneNumber: "+1 (555) 123-4567",
        address: "San Francisco, CA",
        website: "https://janedoe.dev",
        linkedin: "linkedin.com/in/janedoe",
        github: "github.com/janedoe",
    },
    summary:
        "Results-driven Senior Software Engineer with over 8 years of experience in designing, developing, and deploying scalable web applications. Proficient in JavaScript, React, and Node.js with a passion for creating intuitive user experiences.",
    workExperience: [
        {
            id: "work-1",
            jobTitle: "Senior Software Engineer",
            company: "Tech Solutions Inc.",
            location: "San Francisco, CA",
            startDate: "2020-01",
            endDate: "Present",
            responsibilities: [
                "Led the development of a new customer-facing analytics dashboard using React and D3.js, resulting in a 20% increase in user engagement.",
                "Mentored junior engineers, providing code reviews and guidance on best practices.",
                "Collaborated with product managers to define feature requirements and technical specifications.",
            ],
        },
        {
            id: "work-2",
            jobTitle: "Software Engineer",
            company: "Web Innovators LLC",
            location: "Palo Alto, CA",
            startDate: "2016-06",
            endDate: "2019-12",
            responsibilities: [
                "Developed and maintained RESTful APIs using Node.js and Express.",
                "Wrote unit and integration tests to ensure code quality and reliability.",
            ],
        },
    ],
    education: [
        {
            id: "edu-1",
            degree: "Master of Science in Computer Science",
            institution: "Stanford University",
            location: "Stanford, CA",
            startDate: "2014-09",
            endDate: "2016-05",
            details: "GPA: 3.9/4.0",
        },
    ],
    skills: [
        { id: "skill-cat-1", category: "Programming Languages", items: ["JavaScript (ES6+)", "TypeScript", "Python"] },
        { id: "skill-cat-2", category: "Frameworks & Libraries", items: ["React", "Node.js", "Express", "Next.js"] },
        { id: "skill-cat-3", category: "Databases", items: ["PostgreSQL", "MongoDB", "Redis"] },
    ],
    projects: [
        {
            id: "proj-1",
            projectName: "Personal Portfolio Website",
            description: "A responsive personal portfolio built with Next.js and deployed on Vercel to showcase my projects and skills.",
            technologies: ["Next.js", "React", "Tailwind CSS"],
            link: "https://janedoe.dev",
        },
    ],
    languages: [
        { id: "lang-1", language: "English", proficiency: "Native" },
        { id: "lang-2", language: "Spanish", proficiency: "Conversational" },
    ],
};