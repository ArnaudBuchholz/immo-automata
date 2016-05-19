"use strict";

var CONSTANTS = require("../constants.js"),
    webDriver = require("selenium-webdriver"),
    By = require("selenium-webdriver").By,
    until = require("selenium-webdriver").until;

module.exports = {

    /**
     * @inheritdoc extractors#start
     *
     * http://www.centris.ca
     */
    start: function (config, callback) {
        var done,
            promise = new Promise(function (resolve) {
                done = resolve;
            }),
            chrome = new webDriver.Builder()
                .forBrowser("chrome")
                .build();
        chrome.get("http://www.centris.ca/")
            // Process search field
            .then(function () {
                verbose("Locating search control");
                return chrome.findElements(By.id("search"))
                    .then(function (elements) {
                        verbose("Typing '" + config.search.centris.town + "'");
                        return elements[0].sendKeys(config.search.centris.town);
                    })
                    .then(function () {
                        verbose("Wait 1 second for autocomplete to appear");
                        return wait(1000); // TODO find a better way
                    })
                    .then(function () {
                        verbose("Getting autocomplete");
                        return chrome.findElements(By.className("ui-autocomplete"));
                    })
                    .then(function (elements) {
                        verbose("Listing second autocomplete children"); // TODO find a better way
                        return elements[1].findElements(By.tagName("li"));
                    })
                    .then(function (elements) {
                        var promises = [],
                            selectedIndex;
                        elements.forEach(function (element) {
                            promises.push(element.getText());
                        });
                        return Promise.all(promises)
                            .then(function (texts) {
                                texts.every(function (text, index) {
                                    verbose(">> " + text);
                                    if (-1 < text.indexOf(config.search.centris.suburb)) {
                                        selectedIndex = index;
                                        return false;
                                    }
                                    return true;
                                });
                                verbose("Selecting index " + selectedIndex);
                                if (undefined === selectedIndex) {
                                    return Promise.reject("Unable to locate '" + config.search.centris.suburb + "'");
                                }
                                return elements[selectedIndex].click();
                            });
                    });
            })
            // Process slider
            .then(function () {
                verbose("Finding price slider");
                var sliderRightHandle;
                return chrome.findElements(By.id("slider"))
                    .then(function (elements) {
                        // Get right handle of the slider
                        return elements[0].findElements(By.tagName("a"));
                    })
                    .then(function (elements) {
                        sliderRightHandle = elements.pop(); // Last
                        // Focus right handle
                        return sliderRightHandle.click();
                    })
                    .then(function () {
                        var done,
                            promise = new Promise(function (resolve) {
                                done = resolve;
                            });
                        function moveLeft () {
                            return sliderRightHandle.sendKeys(webDriver.Key.ARROW_LEFT)
                                .then(function () {
                                    return chrome.findElements(By.id("currentPrixMax"));
                                })
                                .then(function (elements) {
                                    return elements[0].getAttribute("data-value");
                                });
                        }
                        function processPrice (price) {
                            price = parseInt(price, 10);
                            console.log(">> " + price);
                            if (price <= config.search.centris["max-price"]) {
                                done();
                            } else {
                                moveLeft().then(processPrice);
                            }
                        }
                        moveLeft().then(processPrice);
                        return promise;
                    });
            })
            // Open advanced criteria
            .then(function () {
                verbose("Open advanced criteria");
                return chrome.findElements(By.id("btn-advanced-criterias"))
                    .then(function (elements) {
                        return elements[0].click();
                    });
            })
            // Process house type
            .then(function () {
                verbose("Process house type");
                return chrome.findElements(By.id("item-property"))
                    .then(function (elements) {
                        return elements[0].findElements(By.tagName("button"));
                    })
                    .then(function (elements) {
                        var promises = [],
                            selectedIndex;
                        elements.forEach(function (element) {
                            promises.push(element.getText());
                        });
                        return Promise.all(promises)
                            .then(function (texts) {
                                var clicked = [];
                                texts.forEach(function (text, index) {
                                    verbose(">> " + text);
                                    if (-1 < config.search.centris["house-types"].indexOf(text)) {
                                        clicked.push(elements[index].click());
                                    }
                                });
                                return Promise.all(clicked);
                            });
                    });
            })
            // Rooms
            .then(function () {
                verbose("Process number of rooms");
                return chrome.findElements(By.id("select-room"))
                    .then(function (elements) {
                        var dropDown = elements[0];
                        dropDown.click()
                            .then(function () {
                                return dropDown.findElements(By.className("dropdown"));
                            })
                            .then(function (elements) {
                                return elements[0].findElements(By.tagName("li"));
                            })
                            .then(function (elements) {
                                var promises = [],
                                    selectedIndex;
                                elements.forEach(function (element) {
                                    promises.push(element.getAttribute("data-option-value"));
                                });
                                return Promise.all(promises)
                                    .then(function (texts) {
                                        texts.every(function (text, index) {
                                            verbose(">> " + text);
                                            if (config.search.centris["room-type"] === text) {
                                                selectedIndex = index;
                                                return false;
                                            }
                                            return true;
                                        });
                                        verbose("Selecting index " + selectedIndex);
                                        if (undefined === selectedIndex) {
                                            return Promise.reject("Unable to locate '" + config.search.centris["room-type"] + "'");
                                        }
                                        return elements[selectedIndex].click();
                                    });
                            });
                    });
            })
            // SUBMIT SEARCH
            .then(function () {
                verbose("Submit search");
                return chrome.findElements(By.id("submit-search"))
                    .then(function (elements) {
                        return elements[0].click();
                    })
                    .then(function () {
                        return wait(5000); // TODO find a way to wait for the page to be loaded
                    })
                    .then(function () {
                        return chrome.findElements(By.id("ButtonViewSummary"));
                    })
                    .then(function (elements) {
                        return elements[0].click();
                    });
            })
            // Loop on properties
            .then (function () {
                var done,
                    promise = new Promise(function (resolve) {
                        done = resolve;
                    });
                function process () {
                    // Due to synchronization issue, we may have to repeat once the extraction
                    extractProperty()
                        .then(next)
                        .catch(function () {
                            extractProperty().then(next);
                        });
                }
                function next () {
                    chrome.findElements(By.id("divWrapperPager"))
                        .then(function (elements) {
                            return elements[0].findElements(By.className("next"));
                        })
                        .then(function (elements) {
                            var button = elements[0];
                            button.getAttribute("class")
                                .then(function (classNames) {
                                    if (-1 < classNames.indexOf("inactive")) {
                                        done();
                                    } else {
                                        button.click()
                                            .then(function () {
                                                return wait(250);
                                            })
                                            .then(function () {
                                                process();
                                            });
                                    }
                                });
                        });
                }
                process();
                return promise;
            })
            .then(done);

        return promise;
    }

};
