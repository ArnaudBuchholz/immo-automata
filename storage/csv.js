"use strict";

/*
{
    type: "csv",
    path: "filename",
    add-file-timestamp: false,
    delimiter: ",",
    quote: "\"",
    escape: "\"",
    types: {
        updated: "boolean"
    }
    columns: ["RUID", "NAME"]
}
*/

var CONSTANTS = require("../constants.js"),
    helpers = require("../helpers.js"),
    fs = require("fs"),
    path = require("path"),
    csv = require("csv"),
    CSV_STATE = "__csv_state__",
    timestamp = helpers.getTimestamp();

module.exports = {

    // @inheritdoc storage#open
    open: function (config) {
        var ctx = this;

        ctx.records = {};

        return new Promise(function (resolve, reject) {
            try {
                var stream = fs.createReadStream(config.path, {
                        flags: "r",
                        encoding: "utf8",
                        autoClose: true
                    }),
                    parser = csv.parse({
                        delimiter: config.delimiter || ",",
                        quote: config.quote || "\"",
                        escape: config.escape || "\"",
                        columns: helpers.getColumnsHandler(),
                        relax: true,
                        "skip_empty_lines": true
                    });
                stream.pipe(parser);
                stream.on("error", function (e) {
                    if (-4058 === e.errno) {
                        // no file
                        resolve();
                    } else {
                        reject(e);
                    }
                });
                parser.on("readable", function () {
                    var record = parser.read();
                    while (record) {
                        helpers.deserializeColumns(record, config.types || {});
                        ctx.records[record[CONSTANTS.RECORD_UID]] = record;
                        if (config.verbose) {
                            console.log(JSON.stringify(record));
                        }
                        record = parser.read();
                    }
                });
                parser.on("end", function () {
                    resolve();
                });
            } catch (e) {
                reject(e);
            }
        });
    },

    // @inheritdoc storage#find
    find: function (config, uid) {
        var record = this.records[uid];
        if (record) {
            record[CSV_STATE] = "fetched";
        } else {
            record = null;
        }
        return Promise.resolve(record);
    },

    // @inheritdoc storage#add
    add: function (config, record, updated) {
        var ruid = record[CONSTANTS.RECORD_UID];
        if (updated) {
            record[CSV_STATE] = "updated";
            record[CONSTANTS.CSV_UPDATED] = timestamp;
        } else {
            record[CSV_STATE] = "created";
            record[CONSTANTS.CSV_CREATED] = timestamp;
        }
        record[CONSTANTS.CSV_REMOVED] = ""; // Just in case
        this.records[ruid] = record;
        if (config.verbose) {
            console.log(ruid + "(" + updated + "): " + JSON.stringify(record));
        }
        return Promise.resolve();
    },

    // @inheritdoc storage#close
    close: function (config) {
        var ctx = this,
            obsoleteCount = 0,
            totalCount = 0,
            statistics,
            outputFileName,
            stream,
            stringifier;
        if (config["add-file-timestamp"]) {
            outputFileName = path.parse(config.path);
            outputFileName.base = outputFileName.name += "." + timestamp + outputFileName.ext;
            outputFileName = path.format(outputFileName);
        } else {
            outputFileName = config.path;
        }
        stream = fs.createWriteStream(outputFileName, {
            flags: "w",
            defaultEncoding: "utf8",
            autoClose: true
        });
        stringifier = csv.stringify({
            delimiter: config.delimiter || ",",
            quote: config.quote || "\"",
            escape: config.escape || "\"",
            header: true,
            columns: config.columns
        });
        stringifier.pipe(stream);
        Object.keys(ctx.records).forEach(function (ruid) {
            ++totalCount;
            var record = ctx.records[ruid];
            if (undefined === record[CSV_STATE]) {
                record[CONSTANTS.CSV_REMOVED] = timestamp;
                ++obsoleteCount;
            }
            helpers.serializeColumns(record, config.types || {});
            stringifier.write(record);
        });
        stringifier.end();
        statistics = {
            "output filename": outputFileName,
            "obsolete records": obsoleteCount,
            "total number of records": totalCount
        };
        return Promise.resolve(statistics);
    }

};
