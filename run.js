"use strict";

var CONSTANTS = require("./constants.js"),
    helpers = require("./helpers.js"),
    fs = require("fs-extra"),
    path = require("path"),
    configFilename = process.argv[2] || "config",
    config = JSON.parse(fs.readFileSync(configFilename).toString()),
    enableVerbose = "-verbose" === process.argv[3],
    verbose,
    filters = [],
    storageConfig,
    storageContext,
    storage,
    runningExtractors = 0,
    extractorsPromise,
    extractorsDone,
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

function nop () {}

if (enableVerbose) {
    verbose = console.log.bind(console);
} else {
    verbose = nop;
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
        try {
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
        } catch (e) {
            failed(e);
        }
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
        runningExtractors = config.extractors.length;
        extractorsPromise = new Promise(function (resolve) {
            extractorsDone = resolve;
        });

        function extractorEnded () {
            if (0 === --runningExtractors) {
                extractorsDone();
            }
        }

        config.extractors.forEach(function (extractorConfig, index) {
            try {
                var tmpDir = path.join(process.env.TEMP, //eslint-disable-line no-process-env
                    "immo-automata", index.toString()),
                    extractorContext,
                    extractorModule,
                    log,
                    type;
                fs.emptyDirSync(tmpDir);
                extractorContext = {
                    _uid: index,
                    _tmpDir: tmpDir
                };
                extractorConfig = checkForExtension(extractorConfig);
                if (true === extractorConfig[".process"]) {
                    type = "process";
                } else {
                    type = extractorConfig.type;
                }
                extractorModule = require("./extractors/" + type + ".js");
                if (extractorConfig.verbose) {
                    log = function (text) {
                        console.log("[extractor" + extractorContext._uid + "] " + text);
                    };
                } else {
                    log = nop;
                }
                extractorModule.start.call(extractorContext, extractorConfig, recordExtracted, log)
                    .then(function () {
                        verbose("[extractor" + extractorContext._uid + "] ended");
                        extractorEnded();
                    }, function (reason) {
                        verbose("[extractor" + extractorContext._uid + "] failed: " + JSON.stringify(reason));
                        extractorEnded();
                    });
            } catch (e) {
                console.error(e);
                verbose(JSON.stringify(extractorConfig));
            }
        });

        verbose(runningExtractors + " extractors running...");

        extractorsPromise
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
                return storage.close.call(storageContext, storageConfig);
            })
            .then(function (storageStatistics) {
                verbose("Extraction statistics:");
                verbose("\titems extracted: " + statistics.extracted);
                verbose("\titems filtered: " + statistics.filtered);
                verbose("Records statistics:");
                verbose("\tnot modified: " + statistics.untouched);
                verbose("\tcreated: " + statistics.created);
                verbose("\tupdated: " + statistics.updated);
                if (storageStatistics) {
                    verbose("Storage statistics:");
                    Object.keys(storageStatistics).forEach(function (label) {
                        verbose("\t" + label + ": " + storageStatistics[label]);
                    });
                }
                verbose("end.");
            });
    }, function (reason) {
        console.error(reason);
    });
