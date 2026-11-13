/**
 * Home controller
 */
export const getHome = (req, res) => {
  res.render('index', {
    title: 'GitEx — From Repository to Clarity',
  });
};

export default {
  getHome,
};

