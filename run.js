"use strict";

var fs = require("fs"),
    configFilename = process.argv[2] || "config",
    config = JSON.parse(fs.readFileSync(configFilename).toString()),
    enableVerbose = "-verbose" === process.argv[3],
    verbose,
    filters = [],
    extractorPromises = [];

if (enableVerbose) {
    verbose = console.log.bind(console);
} else {
    verbose = function () {};
}

function recordExtracted (uid, record) {
    return new Promise(function (resolve, reject) {
        var idx = 0;
        function loop () {
            filters[idx](record)
                .then (function (newRecord) {
                    console.log(idx + " " + JSON.stringify(newRecord));
                    if (newRecord) {
                        record = newRecord;
                        if (++idx < filters.length) {
                            loop();
                            return;
                        } else {
                            console.log(uid + ": " + JSON.stringify(record));
                        }
                    }
                    resolve();

                }, function (reason) {
                    console.error(reason);
                });
        }
        if (idx < filters.length) {
            loop();
        } else {
            resolve(record);
        }
    });
}

verbose("Processing filters");
config.filters.forEach(function (config) {
    var filterModule = require("./filters/" + config.type + ".js");
    filters.push(filterModule.filter.bind(config));
});

verbose("Running extractors");
config.extractors.forEach(function (config) {
    var extractorModule = require("./extractors/" + config.type + ".js");
    extractorPromises.push(extractorModule.start(config, recordExtracted));
});

Promise.all(extractorPromises)
    .then(function () {
        verbose("end.");
    });
