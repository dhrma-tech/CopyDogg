/**
 * Website-only mode, for the public intro site (e.g. on Vercel). Set
 * COPYDOGG_SITE_ONLY=1 there and only the landing page is served: every
 * route that reads or writes data sends people to the repo instead, so no
 * one can save data or spend an API key on the hosted copy. Never set it
 * for a copy you actually use.
 */
export const isSiteOnly = process.env.COPYDOGG_SITE_ONLY === "1";

export const REPO_URL = "https://github.com/dhrma-tech/CopyDogg";
