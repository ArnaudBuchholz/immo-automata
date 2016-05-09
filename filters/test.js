"use strict";

function _extend (obj, members) {
    for (var name in members) {
        if (members.hasOwnProperty(name)) {
            obj[name] = members[name];
        }
    }
}

module.exports = {

    filter: function (config, record) {
        return new Promise(function (resolve, reject) {
            var result = record;
            if (config.exclude && -1 < config.exclude.indexOf(record.label)) {
                result = null;
            }
            if (result && config.add) {
                result = {};
                _extend(result, record);
                _extend(result, config.add);
            }
            setTimeout(function () {
                resolve(result);
            }, config.timeout || 0);
        })
    }

};
