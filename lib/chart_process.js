#!/usr/bin/env node

const { doRenderChart } = require('./charts');

process.on('message', async params => {
  const { width, height, backgroundColor, devicePixelRatio, untrustedChart } = params;
  try {
    const result = await doRenderChart(
      width,
      height,
      backgroundColor,
      devicePixelRatio,
      untrustedChart,
    );
    process.send({
      success: true,
      buffer: result.toString('base64'),
    });
    process.exit(0);
  } catch (err) {
    process.send({
      success: false,
      error: err.message,
    });
    process.exit(1);
  }
});
