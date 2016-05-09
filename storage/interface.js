"use strict";

function _ignore() {}

module.exports = {

    /**
     * Initialize storage based on provided configuration
     *
     * @param {Object} config Storage specific config
     * @returns {Promise}
     */
    open: function (config) {
        _ignore(config);
        return Promise.resolve();
    },

    /**
     * Retrieve a record from the storage
     *
     * @param {String} uid Record unique id
     * @return {Promise<Object|null>}
     */
    find: function (uid) {
        _ignore(uid);
        return Promise.resolve(null);
    },

    /**
     * Adds a record to the storage
     *
     * @param {String} uid Record unique id
     * @param {Object} record Record values
     * @param {Boolean} updated Record was updated (or is new if false)
     * @return {Promise}
     */
    set: function (uid, record, updated) {
        _ignore(uid);
        _ignore(record);
        _ignore(updated);
        return Promise.resolve(null);
    },

    /**
     * Terminate the storage
     *
     * @returns {Promise}
     */
    close: function () {
        return Promise.resolve();
    }

};
