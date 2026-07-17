export const CATEGORIES = [
  // Engineering & coding core
  { slug: "tutorial-coding", name_id: "Tutorial Coding", name_en: "Coding Tutorial" },
  { slug: "error-solutions", name_id: "Cara Fix Error", name_en: "Error Solutions" },
  { slug: "system-design", name_id: "Arsitektur & System Design", name_en: "Architecture & System Design" },
  { slug: "database-data", name_id: "Database & Data Engineering", name_en: "Database & Data Engineering" },
  { slug: "devops-infra", name_id: "DevOps & Infrastruktur", name_en: "DevOps & Infrastructure" },
  { slug: "testing-quality", name_id: "Testing & Kualitas Kode", name_en: "Testing & Code Quality" },
  { slug: "security-privacy", name_id: "Security & Privacy", name_en: "Security & Privacy" },
  { slug: "dev-workflow", name_id: "Produktivitas & Workflow", name_en: "Productivity & Workflow" },
  // Tools & platforms
  { slug: "tools-review", name_id: "Review Tools", name_en: "Tools Review" },
  { slug: "nocode-lowcode", name_id: "No-Code & Low-Code", name_en: "No-Code / Low-Code" },
  // AI
  { slug: "ai-prompt", name_id: "AI & Prompt Engineering", name_en: "AI & Prompt Engineering" },
  { slug: "ai-agents", name_id: "AI Agents", name_en: "AI Agents" },
  // Career & business
  { slug: "career-interview", name_id: "Karir & Interview", name_en: "Career & Interview" },
  { slug: "developer-finance", name_id: "Finansial Developer", name_en: "Developer Finance" },
  { slug: "saas-indie", name_id: "SaaS & Indie Hacker", name_en: "SaaS & Indie Hacker" },
  { slug: "learning-mindset", name_id: "Belajar & Mindset", name_en: "Learning & Mindset" },
  // Web3 & markets
  { slug: "blockchain-crypto", name_id: "Blockchain & Cryptocurrency", name_en: "Blockchain & Cryptocurrency" },
  { slug: "trading", name_id: "Trading Stock/Crypto/Forex", name_en: "Trading Stock/Crypto/Forex" },
];

export type Role = "owner" | "editor" | "author";
export type Status = "draft" | "published" | "review";
export type CommentStatus = "approved" | "spam" | "pending";
export type Lang = "id" | "en";
