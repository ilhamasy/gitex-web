/**
 * Home & Landing page controller
 */

/**
 * GET / — Landing Homepage
 */
export const getHome = (req, res) => {
  // If redirecting from viewer with reanalyze query, send directly to /app
  if (req.query.url || req.query.reanalyze) {
    const qs = new URLSearchParams(req.query).toString();
    return res.redirect(`/app?${qs}`);
  }

  res.render('landing', {
    title: 'GitEx — Every Repository, Explained.',
  });
};

/**
 * GET /app — Main Repository Explainer Dashboard
 */
export const getApp = (req, res) => {
  res.render('index', {
    title: 'GitEx — Understand any repository',
  });
};

export default {
  getHome,
  getApp,
};

