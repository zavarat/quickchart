// Google Image Charts compatibility

const { renderChart } = require('./charts');

/**
 * Converts a set of image chart params to a Chart.js object.
 */
function imageChartToChartjs(params) {}

function renderImageChart(query) {
  //renderChart(width, height, backgroundColor, devicePixelRatio, untrustedChart) {
  const size = query.chs.split('x');
  const width = size[0];
  const height = size[1];

  let chartType;
  switch (query.cht) {
    case 'bhs':
    // Horizontal with stacked bars
    case 'bvs':
    // Vertical with stacked bars
    case 'bvo':
    // Vertical stacked in front of each other
    case 'bhg':
    // Horizontal with grouped bars
    case 'bvg':
    // Vertical with grouped bars
  }

  let seriesColors;
  let valueColors;
  if (query.chco) {
    seriesColors = query.chco.split('|');
  }
}

module.exports = {
  imageChartToChartjs,
};
