"use strict";

var fs = require("fs"),
    CONSTANTS = require("../constants.js"),
    GoogleMapsAPI = require("googlemaps"),

    PREFIX = "TRANSIT.",
    NAME_SEP = "@",
    CSV_MIN = PREFIX + "MIN" + NAME_SEP,
    CSV_MAX = PREFIX + "MAX" + NAME_SEP,
    CSV_MEAN = PREFIX + "MEAN" + NAME_SEP,

    WALKING_DISTANCE = ".WALKING_DISTANCE",
    SUBWAY = "SUBWAY",
    CSV_SUBWAY_NAME = PREFIX + SUBWAY,
    CSV_SUBWAY_STATION = PREFIX + SUBWAY + ".STATION",
    CSV_SUBWAY_WD = PREFIX + SUBWAY + WALKING_DISTANCE,

    BUS = "BUS",
    CSV_BUS_NAME = PREFIX + BUS,
    CSV_BUS_FAST = PREFIX + BUS + ".EXPRESS",
    CSV_BUS_WD = PREFIX + BUS + WALKING_DISTANCE,

    _transitNameByType = {
        "SUBWAY": function () {
            return this.line.name + " -> " + this.headsign + " @ " + this.departure_stop.name;
        },
        "BUS": function () {
            return this.headsign + " @ " + this.departure_stop.name;
        },
        "HEAVY_RAIL": function () {
            return this.line.name + " -> " + this.headsign + " @ " + this.departure_stop.name;
        }
    },

    _firstTransitProcessingByType = {
        "SUBWAY": function (transit, walkDuration) {
            if (undefined === this.subway.walkDuration || walkDuration < this.subway.walkDuration) {
                this.subway.walkDuration = walkDuration;
                this.subway.name = transit.line.name;
                this.subway.station = transit.departure_stop.name;
            }
        },
        "BUS": function (transit, walkDuration) {
            var isFastBus = -1 < (config["fast-bus"] || []).indexOf(transit.line.short_name),
                isShorterWalk = undefined === this.bus.walkDuration || walkDuration < this.bus.walkDuration;
            if (isFastBus && !this.bus.fast || isShorterWalk) {
                this.bus.walkDuration = walkDuration;
                this.bus.name = transit.headsign;
                this.bus.fast = isFastBus;
            }
        },
        "HEAVY_RAIL": function () {
            console.warn("Do not compute HEAVY_RAIL");
        }
    };


function _createGoogleMapAPIHandler (ctx, config) {
    var apiKey = fs.readFileSync(config["api-key"]).toString(),
        publicConfig = {
            key: apiKey,
            "stagger_time":     1000, // for elevationPath
            "encode_polylines": false,
            secure:             true // use https
        };
    ctx.gmAPI = new GoogleMapsAPI(publicConfig);
}

function _nextMonday (when) {
    var time = when.split["@"][1],
        result = new Date();
    while (2 !== result.getDay()) {
        result += 24 * 60 * 60 * 1000;
    }
    result.setHours(parseInt(time.split(":")[0], 10));
    result.setMinutes(parseInt(time.split(":")[1], 10));
    result.setSeconds(0);
    result.setMilliseconds(0);
    return result;
}

function _computeWhen (config) {
    if (0 === config.when.indexOf("monday(")) {
        return _nextMonday(config.when);
    }
    return new Date();
}

function _processRoute (config, route, index) {
    // this is the result
    var leg = route.legs[0],
        duration = leg.duration.value,
        firstTransit = true,
        walkDuration = 0;
    // duration
    this.minDuration = Math.min(duration, this.minDuration);
    this.maxDuration = Math.max(duration, this.maxDuration);
    this.meanDuration += duration;
    if (config.verbose) {
        console.log("[" + index + "] distance: " + leg.distance.text + " duration: " + leg.duration.text);
    }
    leg.steps.forEach(function (step) {
        var mode = step.travel_mode,
            msg = ["\t", mode],
            transit,
            transitType;
        if ("TRANSIT" === mode) {
            transit = step.transit_details;
            transitType = transit.line.vehicle.type;
            if (firstTransit) {
                firstTransit = false;
                try {
                    _firstTransitProcessingByType[transitType].call(this, transit, walkDuration);
                } catch (e) {
                    console.error("Error while processing transit " + transitType + "\n", JSON.stringify(transit));
                }

            }
            msg.push(" ", _transitNameByType[transitType].call(transit));
        } else {
            walkDuration = step.duration.value;
        }
        msg.push(" distance: ", step.distance.text, " duration: ", step.duration.text);
        if (config.verbose) {
            console.log(msg.join(""));
        }
    }, this);
}

function _toMin (seconds) {
    if (undefined !== seconds) {
        return Math.ceil(seconds / 60);
    }
}

function _analyzeRoutes (config, record, routes) {
    var result = {
        minDuration: 24 * 60 * 60,
        meanDuration: 0,
        maxDuration: 0,
        // Closest subway
        subway: {
            walkDuration: undefined,
            name: "",
            station: ""
        },
        // Closest bus
        bus: {
            walkDuration: undefined,
            name: "",
            fast: false
        }
    };
    routes.forEach(_processRoute.bind(config, result));
    // Approximate everything in minutes
    result.minDuration = _toMin(result.minDuration);
    result.meanDuration = _toMin(result.meanDuration / routes.length);
    result.maxDuration = _toMin(result.maxDuration);
    result.subway.walkDuration = _toMin(result.subway.walkDuration);
    result.bus.walkDuration = _toMin(result.bus.walkDuration);
    // Dump on record
    record[CSV_MIN + config.name] = result.minDuration;
    record[CSV_MEAN + config.name] = result.meanDuration;
    record[CSV_MAX + config.name] = result.maxDuration;
    record[CSV_SUBWAY_NAME] = result.subway.name;
    record[CSV_SUBWAY_STATION] = result.subway.station;
    record[CSV_SUBWAY_WD] = result.subway.walkDuration;
    record[CSV_BUS_NAME] = result.bus.name;
    record[CSV_BUS_FAST] = result.bus.fast;
    record[CSV_BUS_WD] = result.subway.walkDuration;
    return result;
}

module.exports = {

    // @inheritdoc filters#filter
    filter: function (config, record) {
        var ctx = this;
        if (!record[CONSTANTS.GPS] || record["TRANSIT.MIN@" + config.key]) {
            return Promise.resolve();
        }
        if (!ctx.gmAPI) {
            _createGoogleMapAPIHandler(ctx, config);
        }
        return new Promise(function (resolve, reject) {
            ctx.gmAPI.directions({
                origin: record[CONSTANTS.GPS],
                destination: config.to,
                mode: "transit",
                alternatives: true,
                units: "metric",
                "departure_time": _computeWhen(config)

            }, function (err, results) {
                // Ignore error for now
                if (!err) {
                    _analyzeRoutes(config, record, results.routes);
                    resolve();
                }
            });
        });
    }

};
