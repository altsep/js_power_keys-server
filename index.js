const express = require('express');
const axios = require('axios').default;
const fs = require('fs');
const geoip = require('geoip-lite');

const app = express();

app.use(express.json());
app.use(express.text());

app.set('port', process.env.PORT || 3001);
app.set('json spaces', 2);

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept'
  );
  next();
});

const port = app.get('port');

app.listen(port, () => {
  console.log(`Server listening on ${port}`);
});

app.get('/api/steamappdetails/:id', async (req, res, next) => {
  const { id } = req.params;
  const { filters } = req.query;
  const region = getRegion(req);
  const url = `https://store.steampowered.com/api/appdetails?appids=${id}&format=json&cc=${region}${
    filters ? '&filters=' + filters : ''
  }`;
  try {
    const { data } = await axios(url);
    const exists = data[id].success;
    if (exists) {
      res.send(data[id].data);
    } else {
      res.status(404).send('Unknown app id');
    }
  } catch (err) {
    next(err);
  }
});

app.get('/api/steamapps', (req, res, next) => {
  fs.readFile('steamapps', 'utf8', (err, data) => {
    if (err) {
      next(err);
      res.status(500).send({ error: err.toString() });
    } else {
      res.send(data);
    }
  });
});

app.get('/api/gogproducts/:name', async (req, res, next) => {
  const { name } = req.params;
  const API = 'https://www.gogdb.org/';
  const url = new URL('products?search=' + name, API);
  try {
    const { data } = await axios.get(url.href);
    const symbols = ["'", '&'];
    const entities = {
      "'": '&#39;',
      '&': '&amp;',
    };
    const nameHtml = name.replace(
      new RegExp(symbols.join('|'), 'g'),
      (match) => entities[match]
    );
    console.log(nameHtml);
    const regex = new RegExp(
      `<a href="/product/\\d+" class="[a-z]+">(\n|\\s)+${nameHtml}.*(\n|\\s)+</a>`,
      'ig'
    );
    const parsed = data.match(regex);
    console.log(parsed);
    if (!parsed) {
      throw new Error();
    }
    const items = parsed.map((item) => ({
      id: item.match(/(?<=\/product\/)\d+/)[0],
      name: item.match(new RegExp(`(?<=\n\\s+)${nameHtml}.*`, 'i'))[0],
    }));
    console.log(items);
    res.send(items);
  } catch (err) {
    res.status(404).send({ serviceName: 'gog' });
    next(err);
  }
});

app.get('/api/gogitemprice/:id', async (req, res, next) => {
  const { id } = req.params;
  const region = getRegion(req);
  try {
    const prices = await axios.get(
      `https://api.gog.com/products/${id}/prices?countryCode=${region}`
    );
    const {
      currency: { code },
      basePrice,
      finalPrice,
    } = prices.data._embedded.prices[0];
    const slicePrice = (price) =>
      price[0] === '0' ? '0' : price.slice(0, price.length - 6);
    res.send({
      code,
      basePrice: slicePrice(basePrice),
      finalPrice: slicePrice(finalPrice),
    });
  } catch (err) {
    if (err) {
      const { data, status } = err.response;
      const { message } = data;
      res.status(status).send({ message });
      next(err);
    }
  }
});

function getRegion(req) {
  const geo = geoip.lookup(req.ip);
  const lang = req.headers['accept-language'].split(',')[0];
  const region =
    (geo && geo.country) || lang.split('-').length === 1
      ? lang
      : lang.split('-')[1];
  console.log(
    'ip: ' + req.ip,
    'geo: ' + geo,
    'lang: ' + lang,
    'region: ' + region
  );
  return region;
}
