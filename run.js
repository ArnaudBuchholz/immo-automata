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
    storageConfig,
    storageContext,
    storage,
    pendingExtractions = 0,
    extractionPromise,
    extractionDone,
    statistics = {
        extracted: 0,
        filtered: 0,
        untouched: 0,
        created: 0,
        updated: 0
    };

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
    ++statistics.extracted;

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
                ++statistics.untouched;
                done();
                return;
            }
            updated = true;
            ++statistics.updated;
        } else {
            updated = false;
            ++statistics.created;
        }
        storage.add.call(storageContext, storageConfig, record, updated).then(done, failed);
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
                    ++statistics.filtered;
                    done();
                }

            }, failed);
    }

    storage.find.call(storageContext, storageConfig, extractorRecord[CONSTANTS.RECORD_UID])
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

function checkForExtension (typedConfig) {
    var extension = typedConfig[".extends"];
    if (extension) {
        return helpers.extend(typedConfig, config.commons[extension]);
    }
    return typedConfig;
}

verbose("Processing filters...");
(config.filters || []).forEach(function (filterConfig) {
    filterConfig = checkForExtension(filterConfig);
    var filterModule = require("./filters/" + filterConfig.type + ".js");
    filters.push(filterModule.filter.bind({}, filterConfig));
});

verbose("Opening storage...");
storageConfig = checkForExtension(config.storage);
storageContext = {};
storage = require("./storage/" + storageConfig.type + ".js");
storage.open.call(storageContext, storageConfig)
    .then(function () {

        verbose("Running extractors...");
        config.extractors.forEach(function (extractorConfig) {
            try {
                extractorConfig = checkForExtension(extractorConfig);
                var extractorModule = require("./extractors/" + extractorConfig.type + ".js");
                extractorPromises.push(extractorModule.start.call({}, extractorConfig, recordExtracted));
            } catch (e) {
                console.error(e);
                verbose(JSON.stringify(extractorConfig));
            }
        });

        verbose(extractorPromises.length + " extractors running...");

        Promise.all(extractorPromises)
            .then(function (/*statuses*/) {
                if (pendingExtractions) {
                    verbose("end of extractors, waiting for pending extractions...");
                    extractionPromise = new Promise(function (resolve) {
                        extractionDone = resolve;
                    });
                    return extractionPromise;
                }
                return Promise.resolve();
            })
            .then(function () {
                verbose("end of extraction, waiting for storage closing...");
                return storage.close.call(storageContext);
            })
            .then(function () {
                verbose("Items extracted   : " + statistics.extracted);
                verbose("Items filtered    : " + statistics.filtered);
                verbose("Records untouched : " + statistics.untouched);
                verbose("Records created   : " + statistics.created);
                verbose("Records updated   : " + statistics.updated);
                verbose("end.");
            });
    }, function (reason) {
        console.error(reason);
    });
