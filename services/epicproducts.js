const { app, axios } = require('../app.js');

app.get('/api/epicproducts/:term', async (req, res, next) => {
  const { term } = req.params;
  console.log(term);
  const baseUrl = 'https://epicgames-db.info/';
  const url = new URL('en-US/search-autocomplete?q=' + term, baseUrl);
  try {
    console.log('requesting epic products');
    const { data } = await axios.get(url.href);
    const urlName = term.replace(/\s/g, '-').replace(/\W/g, '');
    const urlRegex = new RegExp(
      `(?<=href=")https://epicgames-db.info/en-US/p/${urlName}.*(?=</a>)`,
      'ig'
    );
    const parsed = data.match(urlRegex);
    if (!parsed) throw new Error();
    const items = parsed.map((item) => {
      const [id, name] = item.split('">');
      return {
        id: id.match(/(?<=\/)[\w-]+$/)[0],
        name,
      };
    });
    res.send(items);
  } catch (err) {
    if (err) {
      if (err) res.status(404).send({ serviceName: 'epic' });
    }
    next(err);
  }
});
