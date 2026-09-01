export const HOME_TITLE = "Know what to update. We keep none of your data.";

export const HOME_DESCRIPTION =
  "SecureStack reads a GitHub repository or a file you upload, then shows current vs latest, what changed, and whether you should update. There is no signup and no database of your projects.";

export const HOME_CTA = {
  primary: "Scan a repository",
  secondary: "See how it works",
  secondaryHref: "/#how-it-works",
  signupHref: "/scan",
} as const;

export const HOME_NAV = [
  { name: "How it works", href: "/#how-it-works" },
  { name: "FAQ", href: "/#faq" },
] as const;

export const HOME_HERO = {
  id: "hero",
  eyebrow: "Open-source patch intelligence",
  title: HOME_TITLE,
  body: HOME_DESCRIPTION,
  support:
    "Connect GitHub or drop an SBOM (Software Bill of Materials). The report stays in this browser tab.",
  trust: "Self-host it. No accounts. GitHub tokens are not written to a database.",
} as const;

export const HOME_PROBLEM = {
  id: "why",
  title: "You already run other people's code. You need to know if it is safe.",
  body: "Every application depends on open-source libraries. Versions drift, CVEs land, and packages go end-of-life. You should not have to create an account for a one-shot report.",
  points: [
    {
      title: "Know what you ship",
      body: "Discover the open-source components and pinned binaries in a GitHub repository or an SBOM, including the version you actually use.",
    },
    {
      title: "Catch CVEs and EOL early",
      body: "See known vulnerabilities and end-of-life software before they become an incident.",
    },
    {
      title: "Decide with a recommendation",
      body: "See what changed between your version and the latest, then get Update urgently, Update, Review, or Wait — not only “a newer version exists.”",
    },
  ],
} as const;

export const HOME_HOW_IT_WORKS = {
  id: "how-it-works",
  title: "From repository to an update recommendation.",
  steps: [
    {
      number: "01",
      title: "Connect GitHub or drop a file",
      body: "Authorize GitHub for this session, or upload CycloneDX/SPDX JSON or manifests. Tokens are held in a short-lived cookie, never a user table.",
    },
    {
      number: "02",
      title: "Compare current to latest",
      body: "We identify the version you run, fetch the latest upstream release, and pull GitHub release notes when they exist.",
    },
    {
      number: "03",
      title: "See what changed, then decide",
      body: "Compare current vs latest, read the release changes, and get Update urgently, Update, Review, or Wait. Close the tab and the report is gone.",
    },
  ],
} as const;

export const HOME_FEATURES = {
  id: "features",
  title: "Discover. Compare. Recommend.",
  body: "SecureStack is built so you get a single picture of open-source health without handing over an account.",
  points: [
    {
      title: "Component inventory",
      body: "Discover every open-source component from GitHub or an uploaded SBOM, with the version you actually run.",
    },
    {
      title: "CVE, EOL, and drift",
      body: "Track latest releases, known vulnerabilities, and end-of-life packages against your current versions.",
    },
    {
      title: "What changed",
      body: "Explain the gap between your version and the latest, including security fixes and breaking changes, then recommend Update urgently, Update, Review, or Wait.",
    },
  ],
} as const;

export const HOME_FAQ_HEADING = "Questions before you connect a repository.";

export const HOME_FAQS = [
  {
    question: "What does SecureStack do?",
    answer:
      "It is patch and dependency update intelligence. You connect GitHub or upload a file, then see current vs latest, what changed, security impact, and whether to update.",
  },
  {
    question: "Do I need an account?",
    answer:
      "No. There is no signup, no company record, and no user database in this mode.",
  },
  {
    question: "Do you store my GitHub token or inventory?",
    answer:
      "No. A GitHub token is kept in an httpOnly cookie for this session so the server can read the repo, then it expires. Scan results live in your browser tab (sessionStorage). Close the tab and they are gone.",
  },
  {
    question: "Can I run this myself?",
    answer:
      "Yes. Clone the repo, set GitHub OAuth or GITHUB_TOKEN, and run pnpm dev.",
  },
  {
    question: "Is GitHub scanning live?",
    answer:
      "Yes. Connect GitHub or upload files. SecureStack lists dependencies and pinned binaries, compares latest versions, pulls GitHub release notes, flags CVEs via OSV, and recommends Update urgently, Update, Review, or Wait.",
  },
  {
    question: "Where is documentation?",
    answer: "Public product documentation lives at /documentation.",
  },
] as const;

export const HOME_SIGNUP = {
  id: "scan",
  title: "Scan without an account",
  body: "Connect GitHub or upload an SBOM. The report is not saved on our servers.",
} as const;

export const HOME_FOOTER = {
  blurb: "Patch and dependency update intelligence. No accounts. No stored user data.",
  copyright: "© 2026 SecureStack",
} as const;
