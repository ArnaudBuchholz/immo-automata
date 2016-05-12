/*eslint-disable no-unused-vars*/
"use strict";

module.exports = {

    /**
     * Filter record.
     *
     * This method is triggered with the filter configuration *and* the record.
     * The resolved record might be either:
     * - The original record itself (if untouched)
     * - A new record (if modified), the property require("../constants.js").RECORD_UID must be copied
     * - null (the record is ignored)
     *
     * An empty object is allocated and used as a this context for the filter (one per config).
     *
     * @param {Object} config Filter specific config
     * @param {Object} record Record to process
     * @returns {Promise<Object|null>} A promise resolving to the filtered record
     */
    filter: function (config, record) {
        return Promise.resolve(record);
    }

};
