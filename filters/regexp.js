"use strict";

/*
{
    type: "regexp",
    from: "fieldName",
    to: "fieldName",
    regexp: "regexp with ()"
}
*/

module.exports = {

    // @inheritdoc filters#filter
    filter: function (config, record) {
        var ctx = this;
        if (!ctx.regexp) {
            ctx.regexp = new RegExp(config.regexp);
        }
        ctx.regexp.lastIndex = 0;
        var match = ctx.regexp.exec(record[config.from]),
            value;
        if (match) {
            value = match[1] || "";
        } else {
            value = "";
        }
        record[config.to] = value;
        return Promise.resolve(record);
    }

};
