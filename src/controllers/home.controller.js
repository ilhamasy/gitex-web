/**
 * Home controller
 */
export const getHome = (req, res) => {
  res.render('index', {
    title: 'GitEx — Every Repository, Explained.',
  });
};

export default {
  getHome,
};

