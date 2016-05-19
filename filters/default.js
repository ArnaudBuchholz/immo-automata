"use strict";

/*
 {
 type: "default",
 field: "fieldName",
 value: "value",
 set: {
    "fieldName": "value"
 }
 }
 */

var helpers = require("../helpers.js");

module.exports = {

    // @inheritdoc filters#filter
    filter: function (config, record) {
        var match;
        if (config.field) {
            match = record[config.field].toString() === config.value;
        } else {
            match = true;
        }
        if (match) {
            helpers.extend(record, config.set);
        }
        return Promise.resolve(record);
    }

};
