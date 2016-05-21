"use strict";

var deepEqual = require("deep-equal");

module.exports = {

    /**
     * Extend the object with the members of provided dictionaries.
     * Allows recursive extension of objects.
     *
     * @param {Object} obj receiving object
     * @param {Object} ..members additional members dictionaries
     * @returns {Object} the object
     */
    extend: function _extend (obj) {
        [].slice.call(arguments, 1).forEach(function (members) {
            Object.keys(members).forEach(function (name) {
                var source = obj[name],
                    overwrite = members[name];
                if ("object" === typeof source && "object" === typeof overwrite) {
                    obj[name] = _extend(source, overwrite);
                } else {
                    obj[name] = overwrite;
                }
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
     * Used for CSV import: build new columns on the record by applying mapping dictionary.
     * Columns can be order using a numeric prefix, for instance 99:TYPE
     * This allows using the initial value TYPE and then replace it with a new value
     *
     * @param {Object} record Record to update
     * @param {Object} mapping Field definition dictionary
     * @returns {Object} record
     */
    mapColumns: function (record, mapping) {
        Object.keys(mapping)
            .map(function (column) {
                var pos = column.indexOf(":");
                if (-1 < pos) {
                    return {
                        id: column,
                        order: parseInt(column.substr(0, pos), 10),
                        name: column.substr(pos + 1)
                    };
                }
                return {
                    id: column,
                    order: 0,
                    name: column
                };
            })
            .sort(function (a, b) {
                return a.order - b.order;
            })
            .forEach(function (columnDef) {
                var name = columnDef.name,
                    value = mapping[columnDef.id];
                Object.keys(record).forEach(function (member) {
                    var search = "{" + member + "}";
                    if (-1 < value.indexOf(search)) {
                        value = value.split(search).join(record[member]);
                    }
                });
                record[name] = value;
            });
    },

    /**
     * Used to read CSV records: adapt CSV fields based on types definition
     *
     * @param {Object} record Record read from CSV
     * @param {Object} types Types definition dictionary, supported types are:
     * - boolean
     * - number
     * @returns {Object} record
     */
    deserializeColumns: function (record, types) {
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
    },

    /**
     * Used to write CSV records: adapt CSV fields based on types definition
     *
     * @param {Object} record Record to write to CSV
     * @param {Object} types Types definition dictionary, supported types are:
     * - boolean
     * - number
     * @returns {Object} record
     */
    serializeColumns: function (record, types) {
        Object.keys(types).forEach(function (fieldName) {
            var value = record[fieldName];
            record[fieldName] = value.toString();
        });
    },

    /**
     * Gets a formatted timestamp
     *
     * @returns {String}
     */
    getTimestamp: function () {
        var now = new Date();
        function z (value) {
            if (value < 10) {
                return "0" + value;
            }
            return value.toString();
        }
        return [now.getFullYear(), z(now.getMonth() + 1), z(now.getDate())].join("-");
    },

    /**
     * Returns a promise that is resolve after the given delay.
     *
     * @param {Number} delay in ms
     * @returns {Promise}
     */
    wait: function (delay) {
        return new Promise(function (resolve) {
            setTimeout(resolve, delay);
        });
    },

    /**
     * Asynchronous loop helper.
     *
     * @param {Function} iteration Function returning a promise that must resolve to a boolean:
     * - true to call it again
     * - false to stop
     *
     * @returns {Promise}
     */
    asyncLoop: function (iteration) {
        function loop () {
            return iteration()
                .then(function (anotherCall) {
                    if (anotherCall) {
                        return loop();
                    }
                });
        }
        return loop();
    }

};
