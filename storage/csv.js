"use strict";

/*
{
    type: "csv",
    path: "filename",
    delimiter: ",",
    quote: "\"",
    escape: "\"",
    columns: ["RUID", "NAME"]
}
*/

var CONSTANTS = require("../constants.js"),
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
                stream.on("readable", function () {
                    var data = stream.read();
                    while (data) {
                        parser.write(data);
                        data = stream.read();
                    }
                });
                parser.on("readable", function () {
                    var record = parser.read();
                    while (record) {
                        ctx.records[record[CONSTANTS.RECORD_UID]] = record;
                        record = parser.read();
                    }
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
