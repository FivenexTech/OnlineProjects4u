export type Project = {
  id: string
  title: string
  shortDescription: string
  description: string
  category: string
  technologies: string[]
  price: number
  level: string
  accent: 'violet' | 'cyan' | 'pink' | 'amber'
  includes: string[]
}

export const categories = [
  { name: 'Web Development', icon: '⌘', description: 'Full-stack builds for the modern web', color: 'violet' },
  { name: 'Java Projects', icon: '☕', description: 'Robust desktop and enterprise ideas', color: 'amber' },
  { name: 'Python Projects', icon: '◈', description: 'Practical automation and applications', color: 'cyan' },
  { name: 'AI / ML', icon: '✦', description: 'Intelligent, research-ready systems', color: 'pink' },
  { name: 'Data Analytics', icon: '▥', description: 'Turn datasets into clear insights', color: 'cyan' },
  { name: 'Mobile Apps', icon: '▣', description: 'Useful experiences for every screen', color: 'violet' },
]

export const projects: Project[] = [
  { id: 'campus-connect', title: 'Campus Connect', shortDescription: 'A student community platform with events, notices and peer collaboration.', description: 'A polished full-stack campus community platform designed to bring announcements, student clubs and peer collaboration into one focused experience.', category: 'Web Development', technologies: ['React', 'Node.js', 'MongoDB'], price: 2499, level: 'Intermediate', accent: 'violet', includes: ['Complete source code', 'Project documentation', 'Database schema and seed data', 'Local setup guide', 'Viva preparation notes'] },
  { id: 'smart-expense', title: 'Smart Expense', shortDescription: 'A personal finance dashboard that helps students understand their spending.', description: 'A thoughtful expense tracking dashboard with category breakdowns, monthly summaries and clean data visualisations for a strong academic presentation.', category: 'Python Projects', technologies: ['Python', 'Flask', 'SQLite'], price: 1899, level: 'Beginner', accent: 'cyan', includes: ['Complete source code', 'Project documentation', 'Database files', 'Installation instructions', 'Suggested viva questions'] },
  { id: 'mediscan-ai', title: 'MediScan AI', shortDescription: 'An educational machine learning project for image-based health classification.', description: 'An educational AI/ML project that demonstrates image preprocessing, model training and result interpretation in a clear, presentation-ready flow.', category: 'AI / ML', technologies: ['Python', 'TensorFlow', 'Streamlit'], price: 3299, level: 'Advanced', accent: 'pink', includes: ['Complete source code', 'Model training notebook', 'Sample dataset guide', 'Project documentation', 'Viva preparation notes'] },
  { id: 'library-lens', title: 'Library Lens', shortDescription: 'A fast library management system for students, librarians and administrators.', description: 'A reliable Java application covering book discovery, issue tracking and member management with a structured architecture that is easy to explain in a viva.', category: 'Java Projects', technologies: ['Java', 'Spring Boot', 'MySQL'], price: 2199, level: 'Intermediate', accent: 'amber', includes: ['Complete source code', 'ER diagram and schema', 'Project report template', 'Setup instructions', 'Viva preparation notes'] },
  { id: 'insight-board', title: 'Insight Board', shortDescription: 'A visual analytics workspace for exploring academic and business datasets.', description: 'A data analytics workspace that turns messy CSV data into useful charts, trends and takeaways suitable for a project demonstration.', category: 'Data Analytics', technologies: ['Python', 'Pandas', 'Plotly'], price: 1999, level: 'Intermediate', accent: 'cyan', includes: ['Analysis notebooks', 'Sample datasets', 'Chart explanations', 'Project documentation', 'Presentation checklist'] },
  { id: 'fittrack', title: 'FitTrack', shortDescription: 'A mobile-first wellness tracker with simple goals and progress views.', description: 'A friendly mobile application concept for tracking routines, goals and progress, with a component structure designed for easy extension.', category: 'Mobile Apps', technologies: ['React Native', 'Firebase', 'Expo'], price: 2799, level: 'Intermediate', accent: 'violet', includes: ['Complete source code', 'Screen flow diagram', 'Firebase setup guide', 'Project documentation', 'Demo checklist'] },
]

export const formatPrice = (price: number) => `₹${price.toLocaleString('en-IN')}`