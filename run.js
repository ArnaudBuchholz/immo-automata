"use strict";

var CONSTANTS = require("./constants.js"),
    helpers = require("./helpers.js"),
    fs = require("fs"),
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

function recordExtracted (extractorRecord) {
    var idx = 0,
        record,
        storedRecord;
    ++pendingExtractions;

    function done () {
        if (0 === --pendingExtractions && extractionDone) {
            extractionDone();
        }
    }

    function failed (reason) {
        console.error(reason);
        done();
    }

    function succeeded () {
        var updated;
        if (storedRecord) {
            if (helpers.equal(storedRecord, record)) {
                done();
                return;
            }
            updated = true;
        } else {
            updated = false;
        }
        storage.add.call(storageContext, config.storage, record, updated).then(done, failed);
    }

    function loop () {
        filters[idx](record)
            .then(function (filteredRecord) {
                if (filteredRecord) {
                    record = filteredRecord;
                    if (++idx < filters.length) {
                        loop();
                    } else {
                        succeeded();
                    }
                } else {
                    done();
                }

            }, failed);
    }

    storage.find.call(storageContext, config.storage, extractorRecord[CONSTANTS.RECORD_UID])
        .then(function (storageRecord) {

            record = {};
            if (storageRecord) {
                storedRecord = storageRecord;
                helpers.extend(record, storageRecord);
            }
            helpers.extend(record, extractorRecord);

            if (filters.length) {
                loop();
            } else {
                succeeded();
            }

        }, failed);

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
    }, function (reason) {
        console.error(reason);
    });
