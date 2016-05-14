"use strict";

var CONSTANTS = require("../constants.js")/*,
    helpers = require("../helpers.js")*/;

module.exports = {

    // @inheritdoc storage#open
    open: function (config) {
        this.config = config;
        return Promise.resolve();
    },

    // @inheritdoc storage#find
    find: function (config, uid) {
        var record = null;
        if (config.records) {
            record = config.records[uid] || null;
        }
        return Promise.resolve(record);
    },

    // @inheritdoc storage#add
    add: function (config, record, updated) {
        if (config.verbose) {
            console.log(record[CONSTANTS.RECORD_UID] + "(" + updated + "): " + JSON.stringify(record));
        }
        return Promise.resolve();
    },

    // @inheritdoc storage#close
    close: function (/*config*/) {
        return Promise.resolve();
    }

};
