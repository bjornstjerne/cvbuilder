
function parseSections(text) {
    const sections = [];
    const lines = text.split('\n');
    let currentSection = { title: 'Header/Intro', content: [] };

    // Common section headers regex
    const headerRegex = /^(experience|education|skills|summary|profile|projects|certifications|languages|objective)/i;

    lines.forEach(line => {
        const trimmed = line.trim();
        if (!trimmed) return;

        // Heuristic: Short lines that match keywords are likely headers
        if (trimmed.length < 30 && headerRegex.test(trimmed)) {
            if (currentSection.content.length > 0) {
                sections.push({ ...currentSection, content: currentSection.content.join('\n') });
            }
            currentSection = { title: trimmed, content: [] };
        } else {
            currentSection.content.push(line);
        }
    });

    // Push last section
    if (currentSection.content.length > 0) {
        sections.push({ ...currentSection, content: currentSection.content.join('\n') });
    }

    return sections;
}

const sampleCV = `
John Doe
Software Engineer

Summary
Experienced developer with 5 years of experience.

Experience
Senior Developer at Tech Corp
- Built things
- Managed teams

Education
BS in Computer Science
University of Tech

Skills
JavaScript, Node.js, Python
`;

const sections = parseSections(sampleCV);
console.log(JSON.stringify(sections, null, 2));

if (sections.length === 4) {
    console.log("SUCCESS: Found 4 sections");
} else {
    console.error("FAILURE: Expected 4 sections, found " + sections.length);
}

const expectedTitles = ['Header/Intro', 'Summary', 'Experience', 'Education', 'Skills'];
// Note: Header/Intro is the first one, so total 5 if we count it.
// Wait, my manual count was 4 + header = 5.
// Let's see what the output is.
