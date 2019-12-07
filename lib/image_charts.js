// Google Image Charts compatibility

function parseSize(chs) {
  if (!chs) {
    return {
      width: 500,
      height: 300,
    };
  }
  const size = chs.split('x');
  return {
    width: parseInt(size[0], 10),
    height: parseInt(size[1], 10),
  };
}

/**
 * Returns a list of series objects. Each series object is a list of values.
 */
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

/**
 * Returns a list of (seriesColor:string|valueColors:Array<string>)
 * TODO(ian): Gradient fills from 'chf' parameter.
 */
function parseColors(chco) {
  if (!chco) {
    return null;
  }

  let seriesColors;
  return chco.split(',').map(colors => {
    if (colors.indexOf('|') > -1) {
      return colors.split('|').map(color => `#${color}`);
    }
    return colors;
  });
  return seriesColors;
}

function setChartType(cht, chartObj) {
  let chartType;
  switch (cht) {
    case 'bhs':
      // Horizontal with stacked bars
      chartObj.type = 'horizontalBar';
      chartObj.options.scales = {
        xAxes: [
          {
            stacked: true,
          },
        ],
        yAxes: [
          {
            ticks: {
              beginAtZero: true,
            },
          },
        ],
      };
      break;
    case 'bvs':
      // Vertical with stacked bars
      chartObj.type = 'bar';
      chartObj.options.scales = {
        xAxes: [
          {
            stacked: true,
          },
        ],
        yAxes: [
          {
            ticks: {
              beginAtZero: true,
            },
          },
        ],
      };
      break;
    case 'bvo':
      // Vertical stacked in front of each other
      chartObj.type = 'bar';
      chartObj.options.scales = {
        xAxes: [
          {
            stacked: true,
          },
        ],
        yAxes: [
          {
            stacked: false,
            ticks: {
              beginAtZero: true,
            },
          },
        ],
      };
      break;
    case 'bhg':
      // Horizontal with grouped bars
      chartObj.type = 'horizontalBar';
      chartObj.options.scales = {
        xAxes: [{}],
        yAxes: [
          {
            ticks: {
              beginAtZero: true,
            },
          },
        ],
      };
      break;
    case 'bvg':
      // Vertical with grouped bars
      chartObj.type = 'bar';
      chartObj.options.scales = {
        xAxes: [{}],
        yAxes: [
          {
            ticks: {
              beginAtZero: true,
            },
          },
        ],
      };
      break;
  }
}

function setData(seriesData, chartObj) {
  chartObj.data.datasets = seriesData.map(series => {
    return {
      label: 'NYI',
      data: series,
    };
  });
}

function setTitle(chtt, chts, chartObj) {
  if (!chtt) {
    return;
  }

  let fontColor, fontSize;
  if (chts) {
    const splits = chts.split(',');
    fontColor = `#${splits[0]}`;
    fontSize = parseInt(splits[1], 10);
  }
  chartObj.options.title = {
    display: true,
    text: chtt,
    fontSize,
    fontColor,
  };
}

function setGridLines(chg, chartObj) {
  if (!chg) {
    return;
  }

  const splits = chg.split(',');
  if (splits.length >= 2) {
    const numGridLinesX = 100 / parseInt(splits[0], 10);
    const numGridLinesY = 100 / parseInt(splits[1], 10);

    chartObj.options.scales.xAxes[0].ticks = {
      maxTicksLimit: numGridLinesX,
    };
    chartObj.options.scales.yAxes[0].ticks = {
      maxTicksLimit: numGridLinesY,
    };
  }

  // TODO(ian): dash sizes etc
  // https://developers.google.com/chart/image/docs/gallery/line_charts
}

function setLabels(chl, chxt, chxl, chartObj) {
  if (!chl) {
    return;
  }

  if (chxt && chxl) {
    const labelsByAxis = {};
    const validAxesLabels = new Set();
    const axes = chxt.split(',');
    axes.forEach(axis => {
      labelsByAxis[axis] = [];
      validAxesLabels.add(`${axis}:`);
    });

    const splits = chxl.split('|');
    let currentAxis;
    splits.forEach(label => {
      if (validAxesLabels.has(label)) {
        currentAxis = label.replace(':', '');
      } else {
        labelsByAxis[currentAxis].push(label);
      }
    });
  } else if (chl) {
    const labels = chl.split('|');
    labels.forEach((label, idx) => {
      chartObj.data.datasets[idx].label = label;
    });
  }
}

function setLegend(chdl, chartObj) {
  if (!chdl) {
    chartObj.options.legend = {
      display: false,
    };
    return;
  }
  const labels = chdl.split(',');
  labels.forEach((label, idx) => {
    chartObj.data.datasets[idx].label = label;
  });
}

function toChartJs(query) {
  //renderChart(width, height, backgroundColor, devicePixelRatio, untrustedChart) {
  const { width, height } = parseSize(query.chs);

  // Parse data
  const seriesData = parseSeriesData(query.chd, query.chds);
  parseColors(query.chco);

  // Start building the chart
  const chartObj = {
    data: {},
    options: {},
  };

  setChartType(query.cht, chartObj);
  setData(seriesData, chartObj);
  setTitle(query.chtt, query.chts, chartObj);
  setGridLines(query.chg, chartObj);
  setLegend(query.chdl, chartObj);

  // TODO(ian): Finish implementing
  //setLabels(query.chl, chartObj);

  // chds - axis range
  // https://developers.google.com/chart/image/docs/data_formats#text-format-with-custom-scaling

  return {
    width,
    height,
    chart: chartObj,
  };
}

module.exports = {
  toChartJs,
  parseSeriesData,
};
