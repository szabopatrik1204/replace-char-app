const http=require("http"),url=require("url"),{replaceCharAtMods:replaceCharAtMods}=require("./calculate"),promClient=require("prom-client"),register=new promClient.Registry;promClient.collectDefaultMetrics({register:register,prefix:"mathapp_"});const httpRequestDuration=new promClient.Histogram({name:"http_request_duration_seconds",help:"Duration of HTTP requests in seconds",labelNames:["method","path","status_code"],buckets:[.01,.05,.1,.5,1]}),httpRequestTotal=new promClient.Counter({name:"http_requests_total",help:"Total number of HTTP requests",labelNames:["method","path","status_code"]}),calculationErrors=new promClient.Counter({name:"calculation_errors_total",help:"Total number of calculation errors",labelNames:["error_type"]}),calculationTotal=new promClient.Counter({name:"calculations_total",help:"Total number of calculations performed"});register.registerMetric(httpRequestDuration),register.registerMetric(httpRequestTotal),register.registerMetric(calculationErrors),register.registerMetric(calculationTotal);const PORT=process.env.PORT||3e3,server=http.createServer((async(e,r)=>{const t=process.hrtime(),o=r=>{const[o,n]=process.hrtime(t),a=o+n/1e9,s=url.parse(e.url).pathname;httpRequestDuration.labels(e.method,s,r).observe(a),httpRequestTotal.labels(e.method,s,r).inc()};r.setHeader("X-XSS-Protection","1; mode=block"),r.setHeader("X-Frame-Options","DENY"),r.setHeader("X-Content-Type-Options","nosniff");const{pathname:n,query:a}=url.parse(e.url,!0);if("/metrics"===n&&"GET"===e.method){console.log("/metrics endpoint called."),r.setHeader("Content-Type",register.contentType);try{const e=await register.metrics();return r.writeHead(200),r.end(e),console.log("metrics set correctly"),void o(200)}catch(e){return r.writeHead(500),r.end("Error collecting metrics"),console.error("error occured while collecting metrics"),void o(500)}}if("/calculate"===n&&"GET"===e.method){console.log("/calculate endpoint called.");const{str:e,num:t}=a;if(!e||!t)return r.writeHead(400,{"Content-Type":"text/plain"}),r.end("Please provide a valid string and a number as query parameter: str, num"),calculationErrors.labels("missing_parameters").inc(),o(400),void console.error("bad query parameters at /calculate endpoint");const n=parseFloat(t);if(isNaN(t))return console.error("The second argument must be a valid number."),r.writeHead(400,{"Content-Type":"text/plain"}),r.end("The second argument must be a valid number."),calculationErrors.labels("invalid_number").inc(),void o(400);try{const a=replaceCharAtMods(e,n);calculationTotal.inc(),r.writeHead(200,{"Content-Type":"text/plain"}),r.end(`Replacing characters in ${e} by ${t} is ${a}`),o(200),console.log(`Replacing characters in ${e} by ${t} is ${a}`)}catch(e){calculationErrors.labels("calculation_error").inc(),r.writeHead(500,{"Content-Type":"text/plain"}),r.end("An error occurred while processing your request."),o(500)}}else"/metrics"!==n&&(r.writeHead(404,{"Content-Type":"text/plain"}),r.end("Not Found"),o(404))})).on("error",(e=>{console.error("Server error:",e)}));function createServer(){return server}process.on("uncaughtException",(e=>{console.error("Uncaught exception:",e),process.exit(1)})),require.main===module&&server.listen(PORT,(()=>{console.log(`Server running at http://localhost:${PORT}/`)})),module.exports={createServer:createServer};