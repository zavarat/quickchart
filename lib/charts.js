const path = require('path');
const { performance } = require('perf_hooks');
const { spawn } = require('child_process');

const { logger } = require('../logging');

const LOOPS_REGEX = /(for|while)\s*\(/gi;

const DEFAULT_COLORS = {
  blue: 'rgba(54, 162, 235, 0.5)',
  orange: 'rgba(255, 159, 64, 0.5)',
  purple: 'rgba(153, 102, 255, 0.5)',
  red: 'rgba(255, 99, 132, 0.5)',
  yellow: 'rgba(255, 205, 86, 0.5)',
  green: 'rgba(75, 192, 192, 0.5)',
  grey: 'rgba(201, 203, 207, 0.5)',
};

const ROUND_CHART_TYPES = new Set([
  'pie',
  'doughnut',
  'polarArea',
  'outlabeledPie',
  'outlabeledDoughnut',
]);

const DEFAULT_COLOR_WHEEL = Object.values(DEFAULT_COLORS);

function renderChart(width, height, backgroundColor, devicePixelRatio, untrustedChart) {
  logger.debug('Chart:', untrustedChart);

  if (untrustedChart.match(LOOPS_REGEX)) {
    return Promise.reject(new Error('Input is not allowed'));
  }

  const scriptPath = path.join(__dirname, './chart_process.js');

  return new Promise((resolve, reject) => {
    const start = performance.now();

    const proc = spawn('node', [
      '--max_old_space_size=8',
      scriptPath,
      width,
      height,
      backgroundColor,
      devicePixelRatio,
      untrustedChart,
    ]);
    setTimeout(function() {
      proc.kill();
    }, 500);

    let result = '';
    let error = '';
    proc.stdout.on('data', data => {
      result += data;
    });
    proc.stderr.on('data', data => {
      error += data;
    });
    proc.on('close', code => {
      if (code === 0) {
        resolve(Buffer.from(result, 'base64'));
      } else {
        reject(error);
      }

      const end = performance.now();
      logger.info(`Execution took ${Math.trunc(end - start)} ms`);
    });
  });
}

module.exports = {
  DEFAULT_COLORS,
  DEFAULT_COLOR_WHEEL,
  ROUND_CHART_TYPES,
  renderChart,
};
