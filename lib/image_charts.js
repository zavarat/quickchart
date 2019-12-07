// Google Image Charts compatibility

const { renderChart } = require('./charts');

/**
 * Converts a set of image chart params to a Chart.js object.
 */
function imageChartToChartjs(params) {}

function parseSeriesData(chd, chds) {
  let seriesData;
  const [encodingType, seriesStr] = chd.split(':');
  switch (encodingType) {
    case 't':
      if (chds === 'a') {
        // Basic text format with auto scaling
        seriesData = seriesStr.split('|').map(valuesStr => {
          return valuesStr.split(',').map(val => {
            if (val === '_') {
              return null;
            }
            return parseFloat(val);
          });
        });
      } else {
        // Basic text format with set range
        const seriesValues = seriesStr.split('|');
        const seriesRanges = [];
        if (chds) {
          const ranges = chds.split(',');
          for (let i = 0; i < ranges.length; i += 2) {
            const min = parseFloat(ranges[i]);
            const max = parseFloat(ranges[i + 1]);
            seriesRanges.push({ min, max });
          }
        } else {
          // Apply default minimums of 0 and maximums of 100.
          seriesValues.forEach(() => {
            seriesRanges.push({ min: 0, max: 100 });
          });
        }
        seriesData = seriesValues.map((valuesStr, idx) => {
          return valuesStr.split(',').map(val => {
            if (val === '_') {
              return null;
            }
            const floatVal = parseFloat(val);
            if (floatVal < seriesRanges[idx].min) {
              return null;
            }
            if (floatVal > seriesRanges[idx].max) {
              return seriesRanges[idx].max;
            }
            return floatVal;
          });
        });
      }
      break;
    case 's':
      // Simple encoding format
      const SIMPLE_LOOKUP = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      seriesData = seriesStr.split(',').map(encoded => {
        const vals = [];
        for (let i = 0; i < encoded.length; i++) {
          const char = encoded.charAt(i);
          if (char === '_') {
            vals.push(null);
          } else {
            vals.push(SIMPLE_LOOKUP.indexOf(char));
          }
        }
        return vals;
      });
      break;
    case 'e':
      const EXTENDED_LOOKUP = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-.';
      seriesData = seriesStr.split(',').map(encoded => {
        const vals = [];
        for (let i = 0; i < encoded.length; i += 2) {
          const word = encoded.slice(i, i + 2);
          if (word === '__') {
            vals.push(null);
          } else {
            const idx1 = EXTENDED_LOOKUP.indexOf(word[0]);
            const idx2 = EXTENDED_LOOKUP.indexOf(word[1]);

            const val = idx1 * EXTENDED_LOOKUP.length + idx2;
            vals.push(val);
          }
        }
        return vals;
      });
      break;
    case 'a':
      // Image Chart "awesome" format
      seriesData = seriesStr.split('|').map(valuesStr => {
        return valuesStr.split(',').map(parseFloat);
      });
      break;
  }
  return seriesData;
}

function parseColors(chco) {
  if (!chco) {
    return null;
  }

  let seriesColors;
  return chco.split(',').map(colors => {});
  return seriesColors;
}

function renderImageChart(query) {
  //renderChart(width, height, backgroundColor, devicePixelRatio, untrustedChart) {
  const size = query.chs.split('x');
  const width = size[0];
  const height = size[1];

  // Parse data
  parseSeriesData(query.chd, query.chds);
  parseColors(query.chco);

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

  // chds - axis range
  // https://developers.google.com/chart/image/docs/data_formats#text-format-with-custom-scaling
}

module.exports = {
  imageChartToChartjs,
  parseSeriesData,
};
