"use strict";

var deepEqual = require("deep-equal");

module.exports = {

    /**
     * Extend the object with the members of provided dictionaries.
     *
     * @param {Object} obj receiving object
     * @param {Object} ..members additional members dictionaries
     * @returns {Object} the object
     */
    extend: function (obj) {
        [].slice.call(arguments, 1).forEach(function (members) {
            Object.keys(members).forEach(function (name) {
                obj[name] = members[name];
            });
        });
        return obj;
    },

    /**
     * Deep compare objects.
     *
     * @param {Object} obj1
     * @param {Object} obj2
     * @returns {Boolean} The objects are equal
     */
    equal: function (obj1, obj2) {
        return deepEqual(obj1, obj2, {
            strict: true
        });
    },

    /**
     * Used for CSV import: process columns definition
     *
     * @param {String[]} defaultColumns
     * returns {Function}
     */
    getColumnsHandler: function (defaultColumns) {
        if (defaultColumns) {
            return function () {
                return defaultColumns;
            };
        }
        return function (row) {
            while (!row[row.length - 1]) {
                row.pop(); // Removes empty columns
            }
            return row;
        };
    },

    /**
     * Used for CSV import: build new columns on the record by applying mapping dictionary
     *
     * @param {Object} record Record to update
     * @param {Object} mapping Field definition dictionary
     * @returns {Object} record
     */
    mapColumns: function (record, mapping) {
        Object.keys(mapping).forEach(function (key) {
            var value = mapping[key];
            Object.keys(record).forEach(function (member) {
                var search = "{" + member + "}";
                if (-1 < value.indexOf(search)) {
                    value = value.split(search).join(record[member]);
                }
            });
            record[key] = value;
        });
    },

    /**
     * Used for CSV records: convert fields based on types definition
     *
     * @param {Object} record Record to convert
     * @param {Object} types Types definition dictionary, supported types are:
     * - boolean
     * - number
     * @returns {Object} record
     */
    convertColumns: function (record, types) {
        Object.keys(types).forEach(function (fieldName) {
            var type = types[fieldName],
                value = record[fieldName];
            if ("boolean" === type) {
                value = "true" === value;
            } else if ("number" === type) {
                value = parseFloat(value);
            }
            record[fieldName] = value;
        });
    }

};
