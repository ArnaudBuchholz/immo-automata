"use strict";

var // CONSTANTS = require("../constants.js"),
    helpers = require("../helpers.js");

module.exports = {

    filter: function (config, record) {
        return new Promise(function (resolve/*, reject*/) {
            var result = record;

            // Filter out based on label matching with exclude array
            if (config.exclude && -1 < config.exclude.indexOf(record.label)) {
                result = null;

            // Adds dynamic properties
            } else if (config.add) {
                result = helpers.extend({}, record, config.add);
                result.isVoyel = -1 < "aeiouy".indexOf(record.label);
            }

            setTimeout(function () {
                resolve(result);
            }, config.timeout || 0);
        });
    }

};
