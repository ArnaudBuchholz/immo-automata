/*eslint-disable no-unused-vars*/
"use strict";

module.exports = {

    /**
     * Configure and start extraction.
     *
     * For each extracted record that should be processed, the callback must be used.
     * Records must have a member with the name require("../constants.js").RECORD_UID
     *
     * The callback returns a promise:
     * - The extractor must wait for the promise to resolve to continue its work
     * - If the promise is rejected, the extractor must stop
     *
     * An empty object is allocated and used as a this context for the extractor (one per config).
     *
     * @param {Object} config Extractor specific config
     * @param {Function} callback:
     *  function (record) { return Promise.resolve(); }
     *
     * @returns {Promise} A promise resolved when the extractor ends
     */
    start: function (config, callback) {
        return Promise.resolve();
    }

};
