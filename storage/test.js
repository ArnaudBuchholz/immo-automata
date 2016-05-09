"use strict";

function _ignore() {}

module.exports = {

    open: function (config) {
        _ignore(config);
        return Promise.resolve();
    },

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
        console.log(uid + "(" + updated + "): " + JSON.stringify(record));
        return Promise.resolve();
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
