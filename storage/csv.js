"use strict";

/*
{
    type: "csv",
    path: "filename",
    add-timestamp: false,
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
    csv = require("csv");

module.exports = {

    // @inheritdoc storage#open
    open: function (config) {
        var ctx = this;

        function getColumns (row) {
            if (config.columns) {
                return config.columns;
            }
            return row;
        }

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
                        columns: getColumns,
                        relax: true,
                        "skip_empty_lines": true
                    });
                stream.pipe(parser);
                parser.on("readable", function () {
                    var record = parser.read();
                    while (record) {
                        helpers.convertColumns(record, config.types || {});
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
        if (!record) {
            record = null;
        }
        return Promise.resolve(record);
    },

    // @inheritdoc storage#add
    add: function (config, record, updated) {
        console.log(record[CONSTANTS.RECORD_UID] + "(" + updated + "): " + JSON.stringify(record));
        return Promise.resolve();
    },

    // @inheritdoc storage#close
    close: function (/*config*/) {
        return Promise.resolve();
    }

};
