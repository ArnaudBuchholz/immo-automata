"use strict";

module.exports = {

    start: function (config, callback) {
        var idx = 0,
            done,
            failed,
            result = new Promise(function (resolve, reject) {
                done = resolve;
                failed = reject;
            });
        function loop () {
            setTimeout(function () {
                callback(config.id + "." + idx, config.items[idx])
                    .then(function () {
                        if (++idx < config.items.length) {
                            loop();
                        } else {
                            done ();
                        }
                    }, function () {
                        done();
                    });
            }, config.timeout || 0);
        }
        loop();
        return result;
    }

};
