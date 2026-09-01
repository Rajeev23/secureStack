export const appConfig = {
  name: "SecureStack",
  description:
    "Patch and dependency update intelligence — connect GitHub or upload a file, see what changed, decide whether to update. No accounts.",
  github: {
    url: "https://github.com/Rajeev23/secureStack",
    fullName: "Rajeev23/secureStack",
  },
  documentation: {
    /** Docs link on the public home header and footer. `/documentation` always works. */
    home: true,
    /** Documentation row in the app sidebar (Dashboard / Scan / Report). */
    sidebar: false,
  },
} as const;
