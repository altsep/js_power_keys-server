const { app, axios } = require('../app.js');

app.get('/api/steamproducts/:name', async (req, res, next) => {
  const { name } = req.params;
  const baseUrl = 'https://store.steampowered.com/';
  const url = new URL('search/?term=' + name, baseUrl);
  try {
    const { data } = await axios.get(url.href);
    const urlName = name.replace(/\s/g, '_').replace(/\W/g, '');
    const urlRegex = new RegExp(
      `(?<=<a href=")https://store.steampowered.com/app/\\d+/${urlName}.*(?="\r?\n)`,
      'ig'
    );
    const urlParsed = data.match(urlRegex);
    if (!urlParsed) throw new Error();
    const items = urlParsed.map((item) => ({
      id: item.match(/\d+/)[0],
      productUrl: item.split(/(?=\/\?)/)[0],
    }));
    console.log('requested steam products');
    res.send(items);
  } catch (err) {
    if (err) {
      next(err);
    }
  }
});
