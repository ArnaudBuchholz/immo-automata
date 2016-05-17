"use strict";

/*
{
    type: "csv-import",
    path: "filename",
    delimiter: ",",
    quote: "\"",
    escape: "\"",
    mappings: {
        "record-field": "pattern-{record-field}"
   },
   types: {
       updated: "boolean"
   }
}
*/

var helpers = require("../helpers.js"),
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
            stream.pipe(parser);
            parser.on("readable", function () {
                var record = parser.read();
                while (record) {
                    helpers.mapColumns(record, config.mappings || {});
                    helpers.deserializeColumns(record, config.types || {});
                    callback(record);
                    record = parser.read();
                }
            });
            parser.on("end", function () {
                done();
            });
        } catch (e) {
            console.error(e);
            failed(e);
        }

        return promise;
    }

};
