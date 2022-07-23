const { app, axios } = require('../app.js');
const { getRegion, formatDate, formatCurrency } = require('../func.js');

app.get('/api/steamitem/:id', async (req, res, next) => {
  const { id } = req.params;
  const { lang, region, locale } = getRegion(req);
  const url = `https://store.steampowered.com/api/appdetails?appids=${id}&cc=${region}&l=${lang}`;
  try {
    console.log('requesting steam item');
    const { data } = await axios.get(url);
    const exists = data[id].success;
    if (!exists) {
      throw new Error('The item might be unavailable in your region');
    }
    const {
      name,
      steam_appid,
      header_image: headerImg,
      is_free,
      price_overview,
      release_date: { coming_soon, date },
    } = data[id].data;
    const slicePrice = (price) => price / 100;
    const result = {
      name,
      productUrl: `https://store.steampowered.com/app/${steam_appid}/`,
      status: coming_soon ? 'coming soon' : is_free && 'free',
      releaseDate: formatDate(date, locale),
      headerImg,
    };
    if (price_overview) {
      const {
        currency: currencyCode,
        initial: basePrice,
        final: finalPrice,
      } = price_overview;
      console.log(finalPrice);
      const price = {
        currencyCode,
        basePrice: slicePrice(basePrice),
        finalPrice: slicePrice(finalPrice),
        formattedBasePrice: formatCurrency(slicePrice(basePrice), locale),
        formattedPrice: formatCurrency(
          slicePrice(finalPrice),
          locale,
          currencyCode
        ),
      };
      Object.assign(result, price);
    }
    res.send(result);
  } catch (err) {
    if (err.response) {
      const { data, status } = err.response;
      const { message } = data;
      res.status(status).send({ message });
    } else {
      res.status(404).send({
        message: err.message,
      });
    }
    next(err);
  }
});
