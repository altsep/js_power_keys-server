const { app, axios } = require('../app.js');
const { getRegion, formatDate } = require('../func.js');

app.get('/api/gogitem/:id', async (req, res, next) => {
  const { id } = req.params;
  const { region, locale } = getRegion(req);
  try {
    const prices = await axios.get(
      `https://api.gog.com/products/${id}/prices?countryCode=${region}`
    );
    const {
      currency: { code: currencyCode },
      basePrice,
      finalPrice,
    } = prices.data._embedded.prices[0];
    const slicePrice = (price) =>
      price
        .split(/\s(?=[a-z])/i)[0]
        .replace(/(?=\d{2}$)/, '.')
        .replace(/\.00$/, '');
    const {
      data: {
        title: name,
        links: { product_card: productUrl },
        in_development: { active, until },
        release_date,
      },
    } = await axios.get(`https://api.gog.com/products/${id}`);
    res.send({
      name,
      currencyCode,
      basePrice: slicePrice(basePrice),
      finalPrice: slicePrice(finalPrice),
      productUrl,
      status: basePrice[0] === '0' ? 'free' : active && 'coming soon',
      releaseDate: until
        ? formatDate(until, locale)
        : release_date && formatDate(release_date, locale),
    });
  } catch (err) {
    if (err.response) {
      const { data, status } = err.response;
      const { message } = data;
      res.status(status).send({ message });
    }
    next(err);
  }
});
