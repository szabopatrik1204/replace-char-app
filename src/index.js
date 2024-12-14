// src/index.js
const http = require('http');
const url = require('url');
const { replaceCharAtMods } = require('./calculate');
const promClient = require('prom-client');

// Create a Registry to store metrics
const register = new promClient.Registry();

// Add default metrics (CPU, memory, etc.)
promClient.collectDefaultMetrics({
  register,
  prefix: 'mathapp_'
});

// Create custom metrics
const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'path', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1]
});

const httpRequestTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'path', 'status_code']
});

const calculationErrors = new promClient.Counter({
  name: 'calculation_errors_total',
  help: 'Total number of calculation errors',
  labelNames: ['error_type']
});

const calculationTotal = new promClient.Counter({
  name: 'calculations_total',
  help: 'Total number of calculations performed',
});

// Register custom metrics
register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestTotal);
register.registerMetric(calculationErrors);
register.registerMetric(calculationTotal);


const PORT = process.env.PORT || 3000;

const server = http.createServer(async (req, res) => {

  const startTime = process.hrtime();

  const endTimer = (statusCode) => {
    const [seconds, nanoseconds] = process.hrtime(startTime);
    const duration = seconds + nanoseconds / 1e9;
    const path = url.parse(req.url).pathname;
    
    httpRequestDuration
      .labels(req.method, path, statusCode)
      .observe(duration);
    
    httpRequestTotal
      .labels(req.method, path, statusCode)
      .inc();
  };

  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  const { pathname, query } = url.parse(req.url, true);

  // Add metrics endpoint
  if (pathname === '/metrics' && req.method === 'GET') {
    console.log('/metrics endpoint called.');
    res.setHeader('Content-Type', register.contentType);
    try {
      const metrics = await register.metrics();
      res.writeHead(200);
      res.end(metrics);
      console.log('metrics set correctly');
      endTimer(200);
      return;
    } catch (error) {
      res.writeHead(500);
      res.end('Error collecting metrics');
      console.error('error occured while collecting metrics');
      endTimer(500);
      return;
    }
  }

  if (pathname === '/calculate' && req.method === 'GET') {
    console.log('/calculate endpoint called.');
    const { str, num } = query;
    
    if (!str || !num) {
      res.writeHead(400, { 'Content-Type': 'text/plain' });
      res.end('Please provide a valid string and a number as query parameter: str, num');
      calculationErrors.labels('missing_parameters').inc();
      endTimer(400);
      console.error('bad query parameters at /calculate endpoint');
      return;
    }

    const parsedNum2 = parseFloat(num);
    if (isNaN(num)) {
      console.error('The second argument must be a valid number.');
      res.writeHead(400, { 'Content-Type': 'text/plain' });
      res.end('The second argument must be a valid number.');
      calculationErrors.labels('invalid_number').inc();
      endTimer(400);
      return;
    }

    try {
      const sum = replaceCharAtMods(str, parsedNum2);
      calculationTotal.inc();
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end(`Replacing characters in ${str} by ${num} is ${sum}`);
      endTimer(200);
      console.log(`Replacing characters in ${str} by ${num} is ${sum}`);
    } catch (error) {
      calculationErrors.labels('calculation_error').inc();
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('An error occurred while processing your request.');
      endTimer(500);
    }
  } else if (pathname !== '/metrics') {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
    endTimer(404);
  }
}).on('error', (err) => {
  console.error('Server error:', err);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
  process.exit(1);
});

function createServer() {
  return server;
}

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
  });
}

module.exports = { createServer };