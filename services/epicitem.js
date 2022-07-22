const { app, axios } = require('../app.js');
const { getRegion, formatCurrency } = require('../func.js');

app.get('/api/epicitem/:id', async (req, res, next) => {
  const { id } = req.params;
  const { region, locale } = getRegion(req);
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
    const pricesRegex = new RegExp(
      `(?<=\\w{2}.png(.+[\n\r]){3}.+>).+(?=</td>)`,
      'ig'
    );
    const regionsRegex = new RegExp(`(?<=16x16/)\\w{2}(?=.png)`, 'ig');
    const regionsParsed = data.match(regionsRegex);
    const pricesParsed = data.match(pricesRegex);
    const pricesEntries = regionsParsed.map((region, i) => [
      region,
      pricesParsed[i],
    ]);
    const prices = Object.fromEntries(pricesEntries);
    const slicePrice = (price) =>
      Number(price.replace(/[.,]0+(?=\s)/, '').replace(/\D/g, ''));
    const price = prices[region.toLowerCase()] || prices['us'];
    const [currencySymbol, currencySymbolIndex] = price.match(/^\D|\s?\D$/);
    const result = {
      name: titleParsed,
      productUrl: `https://store.epicgames.com/${locale}/p/${id}`,
      headerImg: imgParsed,
      formattedPrice:
        price.match(/\d/)[0] === '0'
          ? false
          : currencySymbolIndex === 0
          ? currencySymbol + formatCurrency(slicePrice(price), locale)
          : formatCurrency(slicePrice(price), locale) + currencySymbol,
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
