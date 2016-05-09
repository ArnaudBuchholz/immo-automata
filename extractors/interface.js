"use strict";

function _ignore() {}

module.exports = {

    /**
     * Configure and start extraction.
     * For each extracted record you want to keep, the callback must be used.
     * The extractor must wait for the callback to resolve to continue its work.
     * If the callback promise is rejected, the extractor must stop.
     *
     * An empty object is allocated and used as a this context for the filter.
     *
     * @param {Object} config Extractor specific config
     * @param {Function} callback:
     *  function (record) { return Promise.resolve(); }
     *
     * @returns {Promise}
     */
    start: function (config, callback) {
        _ignore(config);
        _ignore(callback);
        return Promise.resolve();
    }

};
