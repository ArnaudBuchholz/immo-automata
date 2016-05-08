"use strict";

module.exports = {

    /**
     * Initialize and start extraction.
     * For each extracted record you want to keep, the callback must be used.
     * The extractor must wait for the callback to resolve to continue its work.
     *
     * @param {Object} config Extractor specific config
     * @param {Function} callback:
     *  function (record) { return Promise.resolve(); }
     *
     * @returns {Promise}
     */
    init: function (config, callback) {
        return Promise.resolve();
    }

};
