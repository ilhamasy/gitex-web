/**
 * Home controller
 */
export const getHome = (req, res) => {
  res.render('index', {
    title: 'GitEx — Understand any repository without reading everything',
  });
};

export default {
  getHome,
};
