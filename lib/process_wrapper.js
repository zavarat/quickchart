const os = require('os');
const path = require('path');
const { fork } = require('child_process');

const { logger } = require('../logging');

const NUM_RENDER_PROCESSES = parseInt(process.env.NUM_RENDER_PROCESSES, 10) || os.cpus().length * 2;

const MAX_RENDER_MEMORY_MB = parseInt(process.env.MAX_RENDER_MEMORY_MB, 10) || 32;

const MAX_NUM_RENDER_FAILURES = 20;

const RENDER_TIMEOUT_MS = 3000;

const renderProcesses = {};
const pids = [];
let processCount = 0;
let nextPid = 0;

const failedCount = {};

function getRequestKey(context) {
  return new Date().toISOString().slice(0, 10) + '__' + context.ip;
}

function checkRequest(reqId, context) {
  const key = getRequestKey(context);
  if (failedCount[key] > MAX_NUM_RENDER_FAILURES) {
    return false;
  }
  return true;
}

function recordFailedRequest(reqId, context) {
  if (context && context.ip) {
    logger.info('Recording failed request for ip', context.ip);
    const key = getRequestKey(context);
    if (!failedCount[key]) {
      failedCount[key] = 0;
    }
    failedCount[key]++;
  }
}

function startProcess() {
  const scriptPath = path.join(__dirname, './chart_process.js');
  proc = fork(scriptPath, {
    execArgv: [`--max_old_space_size=${MAX_RENDER_MEMORY_MB}`],
    stdio: 'ignore',
  });
  proc.setMaxListeners(NUM_RENDER_PROCESSES + 2);

  processCount++;
  renderProcesses[proc.pid] = proc;
  pids.push(proc.pid);

  proc.on('exit', function() {
    processCount--;
    const pidIdx = pids.indexOf(proc.pid);
    pids.splice(pidIdx, 1);
    delete renderProcesses[proc.pid];

    logger.error(`Removed render process ${proc.pid}, ${pids.length} remaining`);
  });

  logger.info(`Started render process #${processCount}: ${proc.pid}`);
  return proc;
}

function getProcess(reqId, context, resolve, reject) {
  if (!checkRequest(reqId, context)) {
    // TODO(ian): Move this logic up to web layer.
    logger.info('Rejected render for IP', context.ip);
    reject('Render failed with error code 15');
    return;
  }

  let proc;
  if (processCount < NUM_RENDER_PROCESSES) {
    proc = startProcess();
  } else {
    proc = renderProcesses[pids[nextPid]];
    nextPid = (nextPid + 1) % pids.length;
  }

  const t = setTimeout(function() {
    proc.kill('SIGKILL');
    proc.removeListener('exit', onCrash);
    proc.removeListener('message', onFinished);
    reject(`Render timed out. reqId: ${reqId}`);
    recordFailedRequest(reqId, context);
  }, RENDER_TIMEOUT_MS);

  let promiseResolved = false;
  const onFinished = result => {
    if (result.reqId !== reqId) {
      // This is someone else's chart using the same worker.
      return;
    }
    clearTimeout(t);
    if (result.success) {
      resolve(Buffer.from(result.buffer, 'base64'));
    } else {
      reject(result.error);
    }
    promiseResolved = true;

    proc.removeListener('exit', onCrash);
    proc.removeListener('message', onFinished);
  };

  const onCrash = result => {
    clearTimeout(t);
    if (!promiseResolved) {
      reject('Render memory limit reached');
      recordFailedRequest(reqId, context);
    }
    proc.removeListener('exit', onCrash);
    proc.removeListener('message', onFinished);
  };
  proc.on('message', onFinished);
  proc.on('exit', onCrash);

  return proc;
}

function bootstrap() {
  for (let i = 0; i < NUM_RENDER_PROCESSES; i++) {
    startProcess();
  }
}

if (!process.send) {
  logger.info('Starting worker processes...');
  bootstrap();
}

module.exports = {
  getProcess,
};
