"use strict";

var fs = require("fs"),
    configFilename = process.argv[2] || "config",
    config = JSON.parse(fs.readFileSync(configFilename).toString()),
    enableVerbose = "-verbose" === process.argv[3],
    verbose,
    filters = [],
    extractorPromises = [],
    storageContext,
    storage;

if (enableVerbose) {
    verbose = console.log.bind(console);
} else {
    verbose = function () {};
}

function recordExtracted (uid, record) {
    var idx = 0;
    function loop () {
        filters[idx](record)
            .then (function (newRecord) {
                if (newRecord) {
                    record = newRecord;
                    if (++idx < filters.length) {
                        loop();
                    } else {
                        storage.set(uid, record, false).then(resolve);
                    }
                } else {
                    resolve();
                }

            }, function (reason) {
                console.error(reason);
            });
    }
    if (filters.length) {
        loop();
    }
    // For now, no need to wait
    return Promise.resolve();
}

verbose("Processing filters...");
config.filters.forEach(function (config) {
    var filterModule = require("./filters/" + config.type + ".js");
    filters.push(filterModule.filter.bind({}, config));
});

verbose("Opening storage...");
storageContext = {};
storage = require("./storage/" + config.storage.type + ".js");
storage.open.call(storageContext, config.storage)
    .then(function () {
        verbose("Running extractors...");
        config.extractors.forEach(function (config) {
            var extractorModule = require("./extractors/" + config.type + ".js");
            extractorPromises.push(extractorModule.start.call({}, config, recordExtracted));
        });

        Promise.all(extractorPromises)
            .then(function (statuses) {
                verbose("end.");
                storage.close.call(storageContext);
            });
    });




