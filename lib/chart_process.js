#!/usr/bin/env node

const { doRenderChart } = require('./charts');

process.on('message', async params => {
  const { reqId, width, height, backgroundColor, devicePixelRatio, untrustedChart } = params;
  try {
    const result = await doRenderChart(
      width,
      height,
      backgroundColor,
      devicePixelRatio,
      untrustedChart,
    );
    process.send({
      reqId,
      success: true,
      buffer: result.toString('base64'),
    });
  } catch (err) {
    process.send({
      reqId,
      success: false,
      error: err.message,
    });
  }
});
