"use strict";

var CONSTANTS = require("../constants.js"),
    helpers = require("../helpers.js");

module.exports = {

    /**
     * @inheritdoc extractors#start
     *
     * Simulates extraction by enumerating items array from the configuration.
     * A timeout can be specified to slow down the process
     */
    start: function (config, callback) {
        var idx = 0,
            done,
            promise = new Promise(function (resolve) {
                done = resolve;
            });

        function loop () {
            setTimeout(function () {
                var record = {};
                record[CONSTANTS.RECORD_UID] = config.id + "." + idx;
                helpers.extend(record, config.items[idx]);
                callback(record)
                    .then(function () {
                        if (++idx < config.items.length) {
                            loop();
                        } else {
                            done();
                        }
                    }, function () {
                        done();
                    });
            }, config.timeout || 0);
        }

        loop();
        return promise;
    }

};
