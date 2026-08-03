// Single source of truth for resume content, shared between the on-page
// About resume (src/pages/about.astro) and the standalone print page
// used to generate public/resume.pdf (src/pages/resume-print.astro).
// Edit this file, not either page directly, so the two never drift.

export const name = 'Luke Worrell';

export const synopsis =
  "I'm a designer trained in architecture who persuades people to believe in an idea before it " +
  'exists. I draw, model, and visualize, choosing the medium that best supports the argument. I ' +
  "am most interested in the problems I don't have an answer to yet. Apart from architecture, I " +
  'enjoy making music with friends and being outside.';

export interface ResumeEntryData {
  subject: string;
  qualifier?: string;
  date: string;
  bullets?: string[];
}

export const experience: ResumeEntryData[] = [
  {
    subject: 'Architectural Intern',
    qualifier: 'Ziegler Cooper Architects | Houston, Texas',
    date: 'May 2025 – Present',
    bullets: [
      'Produced the client-facing visuals, including renderings, AI imagery, and presentations, that carried unbuilt projects to clients, donors, and municipal review. Developed campus master plans for several church clients, phasing worship, schools, and site programs. Worked on projects from proposal pursuit through construction administration and final punch walk.',
    ],
  },
  {
    subject: 'Architectural Intern',
    qualifier: 'Altar Group PLLC | Tomball, Texas',
    date: 'May 2023 – August 2024',
    bullets: [
      'Drafted and rendered projects alongside architects and engineers; completed permitting documents and site visits',
    ],
  },
];

export const education: ResumeEntryData[] = [
  {
    subject: 'Bachelor of Science in Architecture',
    qualifier: 'Texas A&M University',
    date: 'Graduating December 2026',
    bullets: ['GPA 3.96', 'Charles F. Dean Memorial Scholarship, College of Architecture (2024)'],
  },
];

export interface SkillGroup {
  label: string;
  items: string;
}

export const skills: SkillGroup[] = [
  {
    label: 'Modeling + Documentation',
    items: 'Rhino | Revit (Autodesk Certified User) | AutoCAD | SketchUp | Grasshopper (working knowledge)',
  },
  {
    label: 'Visualization',
    items: 'Lumion | Twinmotion | AI-assisted visualization, concept iteration through final imagery',
  },
  {
    label: 'Presentation',
    items: 'InDesign | Photoshop | Illustrator | Physical model making',
  },
];

export const service: ResumeEntryData[] = [
  {
    subject: 'Worship Team Member',
    qualifier: 'Restoration Church Bryan',
    date: '2024 – Present',
    bullets: ['Play the cajon with the worship team during Sunday morning services and Worship Night events.'],
  },
  {
    subject: 'Volunteer Leader',
    qualifier: 'Refuge, Restoration Church Bryan',
    date: '2025',
    bullets: [
      'After-school program bringing underprivileged children to the church to play, eat a meal, and learn about Jesus',
    ],
  },
];

export const music: ResumeEntryData[] = [
  { subject: 'Texas A&M Jazz Band', qualifier: 'Drum Set', date: 'Fall 2026' },
  { subject: 'Triangle Storage Band', qualifier: 'Drum Set', date: '2025' },
];

export const awards: ResumeEntryData[] = [
  {
    subject: 'Technology Student Association',
    date: '2022 – 2023',
    bullets: [
      '12th Place, National CAD On-Site Competition (2023)',
      'Three first-place State awards in CAD and presentation board composition',
    ],
  },
];

export const contact = {
  phone: '281-466-9809',
  email: 'lukeh.worrell@gmail.com',
};
