const { app, axios } = require('../app.js');
const { getRegion } = require('../func.js');

app.get('/api/epicitem/:id', async (req, res, next) => {
  const { id } = req.params;
  const { lang, region, locale } = getRegion(req);
  const baseUrl = 'https://epicgames-db.info/';
  const url = new URL('en-US/p/' + id, baseUrl);
  try {
    console.log('requesting epic item');
    const { data } = await axios.get(url.href);
    const titleRegex = /(?<=<h1 class="text-4xl mb-5">).+(?=<\/h1>)/;
    const titleParsed = data.match(titleRegex)[0];
    const imgRegex = new RegExp(
      'https://epicgames-db.info/storage/thumbnails/.+(?=" />)'
    );
    const imgParsed = data.match(imgRegex)[0];
    const priceRegex = new RegExp(
      `(?<=${region}.png(.+[\n\r]){3}.+>).+(?=</td>)`,
      'i'
    );
    const priceParsed = data.match(priceRegex)[0];
    const slicePrice = (price) => price.replace(',', '.').replace(/\.00/, '');
    const result = {
      name: titleParsed,
      productUrl: `https://store.epicgames.com/${locale}/p/${id}`,
      headerImg: imgParsed,
      // currencyCode,
      // basePrice,
      finalPrice: slicePrice(priceParsed),
    };
    res.send(result);
  } catch (err) {
    if (err.response) {
      const { data, status } = err.response;
      const { message } = data;
      res.status(status).send({ message });
    } else res.status(404).send();
    next(err);
  }
});
