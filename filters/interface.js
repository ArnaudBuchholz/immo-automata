"use strict";

function _ignore() {}

module.exports = {

    /**
     * Filter the record.
     * The resolved value might be either:
     * - The original record itself
     * - A modified record
     * - null (the record is ignored)
     *
     * An empty object is allocated and used as a this context for the filter.
     *
     * @param {Object} config Filter specific config
     * @param {Object} record
     * @returns {Promise<Object|null>}
     */
    filter: function (config, record) {
        _ignore(config);
        return Promise.resolve(record);
    }

};
