"use strict";

function out (data) {
    process.stdout.write(JSON.stringify(data) + "\n");
}

function log (message) {
    out({
        type: "log",
        message: message
    });
}

function recordExtracted (record) {
    out({
        type: "callback",
        record: record
    });
    return Promise.resolve();
}

function start (config) {
    var extractorContext = config.context,
        extractorConfig = config.config,
        extractorModule = require("./extractors/" + extractorConfig.type + ".js");
    return extractorModule.start.call(extractorContext, extractorConfig, recordExtracted, log);
}

process.stdin.on("data", function (data) {
    start(JSON.parse(data))
        .then(function () {
            out({
                type: "done"
            });
            process.exit(0);
        }, function (reason) {
            out({
                type: "error",
                reason: reason
            });
            process.exit(-1);
        });
});
