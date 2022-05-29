const express = require('express');
const axios = require('axios').default;
const fs = require('fs');
// const zlib = require('zlib');
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

// app.get('/api/steamapps/:name', (req, res, next) => {
//   const { name } = req.params;
//   fs.readFile('steamapps', 'base64', (err, data) => {
//     if (err) {
//       next(err);
//     } else {
//       const apps = JSON.parse(data)
//         .filter((a) => a.name.toLowerCase().includes(name.toLowerCase()))
//         .sort((a, b) => a.name.localeCompare(b.name));
//       apps.length > 1 ? res.send(apps) : res.send(apps[0]);
//     }
//   });
// });

const getSteamApps = async () => {
  try {
    const url = 'http://api.steampowered.com/ISteamApps/GetAppList/v2/';
    const { data } = await axios.get(url);
    let writeStream = fs.createWriteStream('steamapps');
    writeStream.write(JSON.stringify(data.applist));
    writeStream.end();
  } catch (err) {
    if (err) console.log(err);
  }
};

/* Get steam appid and name list on script load */
getSteamApps();

const msInADay = 86400000;

setInterval(() => {
  getSteamApps();
}, msInADay);

app.get('/api/gogproducts/:name', async (req, res, next) => {
  const { name } = req.params;
  const region = getRegion(req);
  const API = 'https://www.gogdb.org/';
  const url = new URL('products?search=' + name, API);
  try {
    const { data } = await axios.get(url.href);
    const nameHtml = name.replace("'", '&#39;');
    const regex = new RegExp(
      `<a href="/product/\\d+" class="[a-z]+">(\n|\\s)+${nameHtml}(\n|\\s)+</a>`
    );
    const parsed = data.match(regex);
    const id = parsed[0].match(/(?<=\/product\/)\d+/g);
    const prices = await axios.get(
      `https://api.gog.com/products/${id[0]}/prices?countryCode=${region}`
    );
    const r = prices.data._embedded.prices[0];
    res.send(r);
  } catch (err) {
    next(err);
    res.status(500).send({ error: err.toString() });
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
