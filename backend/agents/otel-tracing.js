'use strict';

const opentelemetry = require('@opentelemetry/sdk-node');
const { TraceIdRatioBasedSampler } = require('@opentelemetry/sdk-trace-node');
const { OTLPTraceExporter } =  require('@opentelemetry/exporter-trace-otlp-http');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const { diag, DiagConsoleLogger, DiagLogLevel } = require('@opentelemetry/api');
// const {
//     dockerCGroupV1Detector,
//   } = require('@opentelemetry/resource-detector-docker');

// For troubleshooting, set the log level to DiagLogLevel.DEBUG
diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.WARN);

console.log("Starting OpenTelemetry Node SDK");
console.log("OTEL_EXPORTER_OTLP_ENDPOINT: " + process.env.OTEL_EXPORTER_OTLP_ENDPOINT);
console.log("OTEL_EXPORTER_OTLP_HEADERS: " + process.env.OTEL_EXPORTER_OTLP_HEADERS);
console.log("OTEL_SERVICE_NAME: " + process.env.OTEL_SERVICE_NAME);


const samplePercentage = 0.05;

const sdk = new opentelemetry.NodeSDK({
    traceExporter: new OTLPTraceExporter(),
    sampler: new TraceIdRatioBasedSampler(samplePercentage),
    instrumentations: [
        getNodeAutoInstrumentations({
            // we recommend disabling fs autoinstrumentation since it can be noisy
            // and expensive during startup
            '@opentelemetry/instrumentation-fs': {
                enabled: false,
            },
        }),
    ],
  //resourceDetectors: [dockerCGroupV1Detector],
});

sdk.start();