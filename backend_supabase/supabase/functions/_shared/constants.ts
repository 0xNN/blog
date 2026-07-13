export const CATEGORIES = [
  { slug: "tutorial-coding", name_id: "Tutorial Coding", name_en: "Coding Tutorial" },
  { slug: "error-solutions", name_id: "Cara Fix Error", name_en: "Error Solutions" },
  { slug: "tools-review", name_id: "Review Tools", name_en: "Tools Review" },
  { slug: "developer-finance", name_id: "Finansial Developer", name_en: "Developer Finance" },
  { slug: "ai-prompt", name_id: "AI & Prompt Engineering", name_en: "AI & Prompt Engineering" },
  { slug: "ai-agents", name_id: "AI Agents", name_en: "AI Agents" },
  { slug: "career-interview", name_id: "Karir & Interview", name_en: "Career & Interview" },
  { slug: "nocode-lowcode", name_id: "No-Code & Low-Code", name_en: "No-Code / Low-Code" },
  { slug: "saas-indie", name_id: "SaaS & Indie Hacker", name_en: "SaaS & Indie Hacker" },
  { slug: "blockchain-crypto", name_id: "Blockchain & Cryptocurrency", name_en: "Blockchain & Cryptocurrency" },
  { slug: "trading", name_id: "Trading Stock/Crypto/Forex", name_en: "Trading Stock/Crypto/Forex" },
];

export type Role = "owner" | "editor" | "author";
export type Status = "draft" | "published" | "review";
export type CommentStatus = "approved" | "spam" | "pending";
export type Lang = "id" | "en";
