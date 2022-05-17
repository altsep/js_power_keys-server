const express = require('express');
const axios = require('axios').default;
const path = require('path');
const fs = require('fs');
const zlib = require('zlib');

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
  const url = `https://store.steampowered.com/api/appdetails?appids=${id}&format=json${
    filters ? '&filters=' + filters : ''
  }`;
  try {
    const axiosRes = await axios(url);
    const { status, headers, data } = axiosRes;
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
    } else {
      res.send(data);
    }
  });
});

app.get('/api/steamapps/:name', (req, res, next) => {
  const { name } = req.params;
  fs.readFile('steamapps', 'base64', (err, data) => {
    if (err) {
      next(err);
    } else {
      const apps = JSON.parse(data)
        .filter((a) => a.name.toLowerCase().includes(name.toLowerCase()))
        .sort((a, b) => a.name.localeCompare(b.name));
      apps.length > 1 ? res.send(apps) : res.send(apps[0]);
    }
  });
});

const getSteamApps = () => {
  const url = 'http://api.steampowered.com/ISteamApps/GetAppList/v2/';
  axios.get(url).then(({ data }) => {
    if (data) {
      let writeStream = fs.createWriteStream('steamapps');
      writeStream.write(JSON.stringify(data.applist));
      writeStream.end();
    }
  });
};

/* Get steam appid and name list on script load */
// getSteamApps();

const msInADay = 86400000;

setInterval(() => {
  getSteamApps();
}, msInADay);
