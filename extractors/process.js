"use strict";

/*
{
    ".process": true
}
*/

var childProcess = require("child_process");

module.exports = {

    // @inheritdoc extractors#start
    start: function (config, callback, log) {
        var done,
            failed,
            promise = new Promise(function (resolve, reject) {
                done = resolve;
                failed = reject;
            }),
            process;

        process = childProcess.spawn("node.exe", ["process.js"]);

        process.stdout.on("data", function (text) {
            text.toString().split("\n").forEach(function (line) {
                if (line) {
                    var command = JSON.parse(line);
                    if ("log" === command.type) {
                        log(command.message);
                    } else if ("callback" === command.type) {
                        callback(command.record);
                    }
                }
            });
        });

        process.on("close", function (code) {
            if (0 === code) {
                done();
            } else {
                failed();
            }
        });

        process.stdin.write(JSON.stringify({
            context: this,
            config: config
        }));

        return promise;
    }

};
