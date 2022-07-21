const { app, axios } = require('../app.js');
const { getRegion, formatDate } = require('../func.js');

app.get('/api/gogitem/:id', async (req, res, next) => {
  const { id } = req.params;
  const { region, locale } = getRegion(req);
  try {
    console.log('requesting gog item');
    const item = await axios.get(`https://api.gog.com/v2/games/${id}`);
    const {
      inDevelopment: { active: inDevelopment },
      _embedded: {
        product: {
          title: name,
          globalReleaseDate,
          gogReleaseDate,
          _links: {
            image: { href: img, formatters },
            prices: { href: pricesUrl },
          },
          // productType,
        },
      },
      _links: {
        store: { href: productUrl },
      },
    } = item.data;
    const prices = await axios.get(pricesUrl.replace('{country}', region));
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
    res.send({
      name,
      currencyCode,
      basePrice: slicePrice(basePrice),
      finalPrice: slicePrice(finalPrice),
      productUrl,
      status: basePrice[0] === '0' ? 'free' : inDevelopment && 'coming soon',
      releaseDate: gogReleaseDate
        ? formatDate(gogReleaseDate, locale)
        : formatDate(globalReleaseDate, locale),
      headerImg: img.replace('{formatter}', formatters[4]),
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
