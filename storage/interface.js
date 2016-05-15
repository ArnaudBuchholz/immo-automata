/*eslint-disable no-unused-vars*/
"use strict";

module.exports = {

    /**
     * Open storage.
     *
     * An empty object is allocated and used as a this context for the storage.
     *
     * @param {Object} config Storage specific config
     * @returns {Promise} Resolved when the storage is opened
     */
    open: function (config) {
        return Promise.resolve();
    },

    /**
     * Retrieve a record.
     *
     * An empty object is allocated and used as a this context for the storage.
     *
     * @param {Object} config Storage specific config
     * @param {String} uid Record unique id
     * @return {Promise<Object|null>} Resolved with the retrieved record (null if none)
     */
    find: function (config, uid) {
        return Promise.resolve(null);
    },

    /**
     * Add a record to the storage.
     *
     * An empty object is allocated and used as a this context for the storage.
     *
     * @param {Object} config Storage specific config
     * @param {Object} record Record values
     * @param {Boolean} updated Record was updated (or is new if false)
     * @return {Promise} Resolved when added
     */
    add: function (config, record, updated) {
        return Promise.resolve();
    },

    /**
     * Close storage.
     *
     * An empty object is allocated and used as a this context for the storage.
     *
     * @param {Object} config Storage specific config
     * @returns {Promise<Object|undefined>} Resolved when closed,
     *  may provide storage statistics dictionary (label: value)
     */
    close: function (config) {
        return Promise.resolve();
    }

};
