const geoip = require('geoip-lite');

function formatCurrency(amount, locale, currencyCode) {
  const options = currencyCode && {
    style: 'currency',
    currency: currencyCode,
  };
  return amount.toLocaleString(locale, options).replace(/[,.]0+(?=$|\s)/, '');
}

function formatDate(date, locale) {
  const formatted = new Date(date);
  return date.length === 4
    ? date
    : formatted.toString() !== 'Invalid Date' &&
        formatted.toLocaleString(locale, {
          dateStyle: 'medium',
        });
}

function getRegion(req) {
  const geo = geoip.lookup(req.ip);
  const header = req.headers['accept-language'].split(',')[0];
  const locale = (geo && geo.country) || header;
  const lang = locale.split('-')[0];
  const region = locale.split('-').length === 1 ? lang : locale.split('-')[1];
  console.log(
    'ip: ' + req.ip,
    'geo: ' + geo,
    'lang: ' + lang,
    'region: ' + region
  );
  return { locale, region, lang };
}

module.exports = { getRegion, formatDate, formatCurrency };
