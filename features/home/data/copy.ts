export const HOME_TITLE = "Know what changed before you update.";

export const HOME_DESCRIPTION =
  "SecureStack watches the open-source dependencies a company actually uses. When a new version lands, it shows what changed, whether it is a security fix, and whether you should update.";

export const HOME_CTA = {
  primary: "Sign up",
  secondary: "See how it works",
  secondaryHref: "/#how-it-works",
  signupHref: "/#signup",
} as const;

export const HOME_NAV = [
  { name: "How it works", href: "/#how-it-works" },
  { name: "Features", href: "/#features" },
  { name: "FAQ", href: "/#faq" },
] as const;

export const HOME_HERO = {
  id: "hero",
  eyebrow: "Patch / dependency update intelligence",
  title: HOME_TITLE,
  body: HOME_DESCRIPTION,
  support:
    "One dashboard for available updates, what changed, security impact, and a recommended action.",
  trust: "Built for companies. Connect GitHub and see what to fix first.",
} as const;

export const HOME_PROBLEM = {
  id: "why",
  title: "You already run other people's code. You need to know if it is safe.",
  body: "Every application depends on open-source libraries. Versions drift, CVEs land, and packages go end-of-life. Spreadsheets and one-off scans do not give security and engineering a shared view.",
  points: [
    {
      title: "Know what you ship",
      body: "Discover the open-source components and pinned binaries in a GitHub repository, including the version you actually use.",
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
      title: "Connect GitHub",
      body: "Create a project and authorize GitHub. Select the repository SecureStack should read.",
      visual: "GitHub → SecureStack",
    },
    {
      number: "02",
      title: "Compare current to latest",
      body: "We identify the version you run, fetch the latest upstream release, and pull GitHub release notes when they exist.",
      visual: "Current → Latest → Release notes",
    },
    {
      number: "03",
      title: "See what changed, then decide",
      body: "Compare current vs latest, read the release changes, and get Update urgently, Update, Review, or Wait. Inventory is discovery — this is the product.",
      visual: "Current → New → What changed → Recommend",
    },
  ],
  footer: "GitHub connection, scanning, findings, and scheduled monitoring are live.",
} as const;

export const HOME_FEATURES = {
  id: "features",
  title: "Discover. Compare. Recommend.",
  body: "SecureStack is built so security and engineering share one picture of open-source health instead of separate trackers.",
  points: [
    {
      title: "Component inventory",
      body: "Discover every open-source component from GitHub, with the version your company actually runs.",
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

export const HOME_FAQ_HEADING = "Questions teams ask before they connect a repository.";

export const HOME_FAQS = [
  {
    question: "What does SecureStack do?",
    answer:
      "It is patch and dependency update intelligence. You connect GitHub, then see current vs latest, what changed, security impact, and whether to update.",
  },
  {
    question: "Who is a company?",
    answer:
      "Every customer account is a company. Projects, repositories, scans, and findings all belong to that company.",
  },
  {
    question: "What do I need to sign up?",
    answer:
      "Name, email, and password. After you sign up you name your company, then land on the dashboard.",
  },
  {
    question: "Do I have to finish extra setup after signup?",
    answer: "Yes — enter your company name once. Then you can add projects and connect GitHub.",
  },
  {
    question: "Can I sign in if I already have an account?",
    answer:
      "Yes. Use Sign in in the header. If you forgot your password, use Forgot password on the sign-in page.",
  },
  {
    question: "What if my email is invalid?",
    answer:
      "Signup checks the email field before creating an account. You will see an error on that field until the address is valid.",
  },
  {
    question: "Is GitHub scanning live yet?",
    answer:
      "Yes. Connect GitHub, start a scan, and SecureStack lists dependencies and pinned binaries, compares latest versions, pulls GitHub release notes, flags CVEs via OSV, and recommends Update urgently, Update, Review, or Wait.",
  },
  {
    question: "Where is documentation?",
    answer:
      "Public product and UI documentation lives at /documentation. It does not require a session.",
  },
] as const;

export const HOME_SIGNUP = {
  id: "signup",
  title: "Create your account",
  body: "Name, email, and password. Then you name your company and go to the dashboard.",
} as const;

export const HOME_FOOTER = {
  blurb: "Patch and dependency update intelligence.",
  copyright: "© 2026 SecureStack",
} as const;
