/* eslint-env node, mocha */

const assert = require('assert');
const imageSize = require('image-size');

const chartsLib = require('../../lib/charts');
const { BASIC_CHART, JS_CHART, BROKEN_CHART_1, BROKEN_CHART_2 } = require('./chart_helpers');

describe('charts.js', () => {
  it('renders a JSON chart', async () => {
    const buf = await chartsLib.renderChart(200, 100, 'white', 1.0, BASIC_CHART);

    assert(buf.length > 0);
    const dimensions = imageSize(buf);
    // Device pixel ratio is 2.0, so multiply dimensions by that.
    assert.equal(200, dimensions.width);
    assert.equal(100, dimensions.height);
  });

  it('adjusts chart size based on device pixel ratio', async () => {
    const buf = await chartsLib.renderChart(200, 100, 'white', 2.0, BASIC_CHART);

    assert(buf.length > 0);
    const dimensions = imageSize(buf);
    // Device pixel ratio is 2.0, so multiply dimensions by that.
    assert.equal(200 * 2, dimensions.width);
    assert.equal(100 * 2, dimensions.height);
  });

  it('renders a JS chart', async () => {
    const buf = await chartsLib.renderChart(200, 100, 'white', 2.0, JS_CHART);
    assert(buf.length > 0);
  });

  it('handles a breaking chart - memory', async () => {
    try {
      const result = await chartsLib.renderChart(200, 100, 'white', 2.0, BROKEN_CHART_1);
      assert(false);
    } catch (err) {
      assert(err.indexOf('Render memory limit') > -1);
    }
  });

  it('renders a JS chart fine after breaking', async () => {
    const buf = await chartsLib.renderChart(200, 100, 'white', 2.0, JS_CHART);
    assert(buf.length > 0);
  });

  it('handles a breaking chart - sandbox', async () => {
    try {
      const result = await chartsLib.renderChart(200, 100, 'white', 2.0, BROKEN_CHART_2);
      assert(false);
    } catch (err) {
      assert(err.indexOf('Cannot read property') > -1);
    }
  });
});
