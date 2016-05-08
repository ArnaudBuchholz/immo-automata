"use strict";

function _ignore() {}

module.exports = {

    /**
     * Initialize filter based on provided configuration
     *
     * @param {Object} config Filter specific config
     * @returns {Promise}
     */
    init: function (config) {
        _ignore(config);
        return Promise.resolve();
    },

    /**
     * Filter the record.
     * The resolved value might be either:
     * - The original record itself
     * - A modified record
     * - null (the record is ignored)
     *
     * @param {Object} record
     * @returns {Promise<Object|null>}
     */
    process: function (record) {
        return Promise.resolve(record);
    }

};
