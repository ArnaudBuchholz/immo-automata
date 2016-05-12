"use strict";

var fs = require("fs"),
    configFilename = process.argv[2] || "config",
    config = JSON.parse(fs.readFileSync(configFilename).toString()),
    enableVerbose = "-verbose" === process.argv[3],
    verbose,
    filters = [],
    extractorPromises = [],
    storageContext,
    storage,
    pendingExtractions = 0,
    extractionPromise,
    extractionDone;

if (enableVerbose) {
    verbose = console.log.bind(console);
} else {
    verbose = function () {};
}

function recordExtracted (record) {
    var idx = 0;
    ++pendingExtractions;

    function done () {
        if (0 === --pendingExtractions && extractionDone) {
            extractionDone();
        }
    }

    function loop () {
        filters[idx](record)
            .then(function (newRecord) {
                if (newRecord) {
                    record = newRecord;
                    if (++idx < filters.length) {
                        loop();
                    } else {
                        storage.add.call(storageContext, config.storage, record, false).then(done);
                    }
                } else {
                    done();
                }

            }, function (reason) {
                console.error(reason);
                done();
            });
    }
    if (filters.length) {
        loop();
    }
    // For now, no need to wait
    return Promise.resolve();
}

verbose("Processing filters...");
config.filters.forEach(function (filterConfig) {
    var filterModule = require("./filters/" + filterConfig.type + ".js");
    filters.push(filterModule.filter.bind({}, filterConfig));
});

verbose("Opening storage...");
storageContext = {};
storage = require("./storage/" + config.storage.type + ".js");
storage.open.call(storageContext, config.storage)
    .then(function () {

        verbose("Running extractors...");
        config.extractors.forEach(function (extractorConfig) {
            var extractorModule = require("./extractors/" + extractorConfig.type + ".js");
            extractorPromises.push(extractorModule.start.call({}, extractorConfig, recordExtracted));
        });

        Promise.all(extractorPromises)
            .then(function (/*statuses*/) {
                verbose("end of extractors, waiting for pending extractions...");
                extractionPromise = new Promise(function (resolve) {
                    extractionDone = resolve;
                });
                return extractionPromise;
            })
            .then(function () {
                verbose("end of extraction, waiting for storage closing...");
                return storage.close.call(storageContext);
            })
            .then(function () {
                verbose("end.");
            });
    });
