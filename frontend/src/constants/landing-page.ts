export const LANDING_PAGE_SECTIONS = [
  { id: "hero", label: "Hero", required: true },
  { id: "problem", label: "Problem Statement", required: false },
  { id: "solution", label: "Solution", required: false },
  { id: "benefits", label: "Benefits", required: false },
  { id: "features", label: "Features", required: false },
  { id: "howItWorks", label: "How It Works", required: false },
  { id: "testimonials", label: "Testimonials", required: false },
  { id: "statistics", label: "Statistics", required: false },
  { id: "pricing", label: "Pricing", required: false },
  { id: "faq", label: "FAQ", required: false },
  { id: "finalCta", label: "Final CTA", required: false },
  { id: "contact", label: "Contact", required: false },
] as const;

export const LANDING_PAGE_INDUSTRIES = [
  "SaaS",
  "E-commerce",
  "Finance",
  "Healthcare",
  "Education",
  "Real Estate",
  "Marketing",
  "Legal",
  "Restaurant",
  "Nonprofit",
  "Technology",
  "Travel",
  "Fitness",
  "Fashion",
  "Food & Beverage",
  "Automotive",
  "Entertainment",
  "Other",
];

export const BRAND_VOICES = [
  "Professional",
  "Friendly",
  "Luxury",
  "Startup",
  "Technical",
  "Casual",
  "Authoritative",
  "Playful",
];

export const GOALS = [
  "Generate Leads",
  "Drive Sales",
  "Build Brand Awareness",
  "Launch Product",
  "Get App Downloads",
  "Collect Emails",
  "Book Demo",
  "Register Users",
];

export const COPY_ACTIONS = [
  { id: "improve", label: "Improve" },
  { id: "regenerate", label: "Regenerate" },
  { id: "shorten", label: "Shorten" },
  { id: "expand", label: "Expand" },
  { id: "professional", label: "Make Professional" },
  { id: "friendly", label: "Make Friendly" },
  { id: "luxury", label: "Make Luxury" },
  { id: "startup", label: "Make Startup" },
  { id: "technical", label: "Make Technical" },
] as const;

export const COLOR_PRESETS = [
  { name: "Ocean", primary: "#0066CC", secondary: "#004499", accent: "#00AAFF" },
  { name: "Forest", primary: "#2D5016", secondary: "#1A3A0A", accent: "#4CAF50" },
  { name: "Sunset", primary: "#E63946", secondary: "#A4161A", accent: "#F4A261" },
  { name: "Royal", primary: "#7B2CBF", secondary: "#5A189A", accent: "#C77DFF" },
  { name: "Midnight", primary: "#1A1A2E", secondary: "#16213E", accent: "#E94560" },
  { name: "Gold", primary: "#B8860B", secondary: "#8B6508", accent: "#FFD700" },
  { name: "Coral", primary: "#FF6B6B", secondary: "#EE5A5A", accent: "#FFE66D" },
  { name: "Teal", primary: "#008080", secondary: "#006666", accent: "#20B2AA" },
];

export const TYPOGRAPHY_OPTIONS = [
  "Modern Sans-Serif",
  "Classic Serif",
  "Monospace",
  "Rounded",
  "Condensed",
  "Display",
];
