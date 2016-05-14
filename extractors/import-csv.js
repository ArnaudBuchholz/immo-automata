"use strict";

/*
{
    type: "import-csv",
    path: "filename",
    delimiter: ",",
    quote: "\"",
    escape: "\"",
    id: "pattern-{COLUMN}"
}
*/

var CONSTANTS = require("../constants.js"),
    helpers = require("../helpers.js"),
    fs = require("fs"),
    csv = require("csv");

module.exports = {

    // @inheritdoc extractors#open
    start: function (config, callback) {
        var done,
            failed,
            promise = new Promise(function (resolve, reject) {
                done = resolve;
                failed = reject;
            });

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
                    columns: helpers.getColumnsHandler(config.columns),
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
                    record[CONSTANTS.RECORD_UID] = Math.floor(Math.random() * 10000);
                    callback(record);
                    record = parser.read();
                }
            });
        } catch (e) {
            console.error(e);
            failed(e);
        }

        return promise;
    }

};
