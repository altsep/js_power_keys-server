const { app, axios } = require('../app.js');

app.get('/api/steamproducts/:term', async (req, res, next) => {
  const { term } = req.params;
  const baseUrl = 'https://store.steampowered.com/';
  const url = new URL('search/?term=' + term, baseUrl);
  try {
    console.log('requesting steam products');
    const { data } = await axios.get(url.href);
    const urlName = term.replace(/\s/g, '_').replace(/\W/g, '');
    const urlRegex = new RegExp(
      `(?<=<a href=")https://store.steampowered.com/app/\\d+/${urlName}.*(?="\r?\n)`,
      'ig'
    );
    const urlParsed = data.match(urlRegex);
    if (!urlParsed) throw new Error();
    const items = urlParsed.map((item) => ({
      id: item.match(/\d+/)[0],
      name: item.match(/(?=\d+\/)\w(?=")/),
      productUrl: item.split(/(?=\/\?)/)[0],
    }));
    res.send(items);
  } catch (err) {
    if (err) res.status(404).send({ serviceName: 'steam' });
    next(err);
  }
});
