'use strict';

const opentelemetry = require('@opentelemetry/sdk-node');
const { TraceIdRatioBasedSampler } = require('@opentelemetry/sdk-trace-node');
const { OTLPTraceExporter } =  require('@opentelemetry/exporter-trace-otlp-http');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');

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
});

sdk.start();