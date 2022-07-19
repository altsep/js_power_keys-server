const express = require('express');
const axios = require('axios').default;

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

module.exports = { app, axios };
