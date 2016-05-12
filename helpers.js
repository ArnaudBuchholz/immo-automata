(function () {
    "use strict";

    module.exports = {

        /**
         * Extend the object with the members of provided dictionaries
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
        }

    };

}());
