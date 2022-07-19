const { app, axios } = require('../app.js');

app.get('/api/gogproducts/:name', async (req, res, next) => {
  const { name } = req.params;
  const baseUrl = 'https://www.gogdb.org/';
  const url = new URL('products?search=' + name, baseUrl);
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
    const regex = new RegExp(
      `<a href="/product/\\d+" class="[a-z]+">(\n|\\s)+${nameHtml}.*(\n|\\s)+</a>`,
      'ig'
    );
    const parsed = data.match(regex);
    if (!parsed) {
      throw new Error();
    }
    const items = parsed.map((item) => ({
      id: item.match(/(?<=\/product\/)\d+/)[0],
      name: item.match(new RegExp(`(?<=\n\\s+)${nameHtml}.*`, 'i'))[0],
    }));
    res.send(items);
  } catch (err) {
    res.status(404).send({ serviceName: 'gog' });
    next(err);
  }
});
