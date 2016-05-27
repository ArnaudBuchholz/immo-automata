"use strict";

var CONSTANTS = require("../constants.js"),
    helpers = require("../helpers.js"),
    webDriver = require("selenium-webdriver"),
    chromeDriver = require("selenium-webdriver/chrome"),
    By = require("selenium-webdriver").By;

function extractProperty (chrome, callback) {
    var record = {};
    return chrome.getCurrentUrl()
        .then(function (url) {
            record[CONSTANTS.TYPE] = "duproprio";
            record[CONSTANTS.URL] = url;
            return chrome.findElements(By.tagName("body"));
        })
        .then(function (elements) {
            return elements[0].getAttribute("data-code");
        })
        .then(function (dataCode) {
            record[CONSTANTS.RECORD_UID] = "duproprio." + dataCode;
            return chrome.findElements(By.className("price-title"));
        })
        .then(function (elements) {
            return elements[0].getText();
        })
        .then(function (priceText) {
            var price = parseInt(priceText.replace(/ /g, ""), 10);
            if (!isNaN(price)) {
                record[CONSTANTS.PRICE] = price;
            }
            return chrome.findElements(By.id("search-map-street-view"));
        })
        .then(function (elements) {
            return elements[0].findElements(By.tagName("a"));
        })
        .then(function (elements) {
            return elements[0].getAttribute("href");
        })
        .then(function (text) {
            // https://www.google.ca/maps/?cbll=45.445036900000000000,-73.694598600000000000&cbp=12,20.09,,0,5&layer=c
            var gps = text.split("?cbll=")[1].split("&")[0].split(",");
            // trim leading 0s
            gps[0] = parseFloat(gps[0]).toString();
            gps[1] = parseFloat(gps[1]).toString();
            record[CONSTANTS.GPS] = gps.join(",");
            return callback(record);
        });
}

module.exports = {

    /**
     * @inheritdoc extractors#start
     *
     * http://www.duproprio.com
     */
    start: function (config, callback, log) {
        var options = new chromeDriver.Options();
        options.addArguments("--user-data-dir=" + this._tmpDir);
        var chrome = new webDriver.Builder()
            .withCapabilities(options.toCapabilities())
            .build();
        log("Opening http://www.duproprio.com/");
        return chrome.get(config.url)
            .then(function () {
                // Click the first image
                return chrome.findElements(By.className("showimage-house"));
            })
            .then(function (firstHouseImages) {
                return firstHouseImages[0].click();
            })
            // Loop on properties
            .then(function () {
                return helpers.asyncLoop(function () {
                    function onceExtracted () {
                        return chrome.findElements(By.className("next"))
                            .then(function (elements) {
                                var button = elements[0];
                                return button.getText()
                                    .then(function (buttonText) {
                                        if ("Propriété suivante" === buttonText) {
                                            return button.click()
                                                .then(function () {
                                                    return true;
                                                });
                                        }
                                        return false;
                                    });
                            });
                    }
                    // Due to synchronization issue, we may have to repeat once the extraction
                    return extractProperty(chrome, callback)
                        .then(onceExtracted, function () {
                            return extractProperty(chrome, callback)
                                .then(onceExtracted);
                        });
                });
            });
    }

};
