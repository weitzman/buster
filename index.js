/**


/**
 *
 * Examples:
 * One-shot model:
 *  User: "Alexa, ask Space Geek for a space fact"
 *  Alexa: "Here's your space fact: ..."
 */

/**
 * App ID for the skill
 */
var APP_ID = "amzn1.echo-sdk-ams.app.743fa602-cccd-46cd-ada8-ac3273dedef6"; //replace with "amzn1.echo-sdk-ams.app.[your-unique-value-here]";

/**
 * The AlexaSkill prototype and helper functions
 */
var AlexaSkill = require('./AlexaSkill');

var http = require('http');

/**
 * SpaceGeek is a child of AlexaSkill.
 * To read more about inheritance in JavaScript, see the link below.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Introduction_to_Object-Oriented_JavaScript#Inheritance
 */
var SpaceGeek = function () {
    AlexaSkill.call(this, APP_ID);
};

// Extend AlexaSkill
SpaceGeek.prototype = Object.create(AlexaSkill.prototype);
SpaceGeek.prototype.constructor = SpaceGeek;

SpaceGeek.prototype.eventHandlers.onSessionStarted = function (sessionStartedRequest, session) {
    console.log("SpaceGeek onSessionStarted requestId: " + sessionStartedRequest.requestId
        + ", sessionId: " + session.sessionId);
    // any initialization logic goes here
};

SpaceGeek.prototype.eventHandlers.onLaunch = function (launchRequest, session, response) {
    console.log("SpaceGeek onLaunch requestId: " + launchRequest.requestId + ", sessionId: " + session.sessionId);
    handleNewFactRequest(response);
};

/**
 * Overridden to show that a subclass can override this function to teardown session state.
 */
SpaceGeek.prototype.eventHandlers.onSessionEnded = function (sessionEndedRequest, session) {
    console.log("SpaceGeek onSessionEnded requestId: " + sessionEndedRequest.requestId
        + ", sessionId: " + session.sessionId);
    // any cleanup logic goes here
};

SpaceGeek.prototype.intentHandlers = {
    "GetNewFactIntent": function (intent, session, response) {
        handleNewFactRequest(response);
    },

    "AMAZON.HelpIntent": function (intent, session, response) {
        response.ask("You can ask Buster when is my next bus, or, you can say exit.");
    },

    "AMAZON.StopIntent": function (intent, session, response) {
        var speechOutput = "Goodbye";
        response.tell(speechOutput);
    },

    "AMAZON.CancelIntent": function (intent, session, response) {
        var speechOutput = "Goodbye";
        response.tell(speechOutput);
    }
};

/**
 * Gets a random new fact from the list and returns to the user.
 */
function handleNewFactRequest(response) {
    makeNextBusRequest("mbta", 2276, function nextBusRequestCallback(err, nextBusResponse) {
        var speechOutput;

        if (err) {
            speechOutput = "Sorry, the Next Bus service is experiencing a problem. Please try again later";
        } else {
            speechOutput = "The next buses are " + nextBusResponse;
        }

        response.tellWithCard(speechOutput, "BusTimes", speechOutput)
    });

}

/**
 * Uses NextBus API, currently agency and stop ID are hardcoded.
 * Get agency name from: http://webservices.nextbus.com/service/publicXMLFeed?command=agencyList
 * For SF Muni, get stop ID from: http://www.nextbus.com/wirelessConfig/stopNumbers.jsp?a=sf-muni
 */
function makeNextBusRequest(agency, stopId, nextBusRequestCallback) {

    var endpoint = 'http://webservices.nextbus.com/service/publicXMLFeed';
    var queryString = '?command=predictions&a=' + agency + '&stopId=' + stopId;

    http.get(endpoint + queryString, function(res) {
        var nextBusResponseString = '';

        res.on('data', function(data) {
            nextBusResponseString += data;
        });

        res.on('end', function() {
            var data = []
            var parseString = require('xml2js').parseString;
            var nextBusResponseObject = parseString(nextBusResponseString, function(err, result) {
                for (var i = 0; i < result.body.predictions.length; i++) {
                    var currPredictions = result.body.predictions[i];
                    if (currPredictions.direction != undefined) {
                        for (var j = 0; j < currPredictions.direction.length; j++) {
                            for (var k = 0; k < currPredictions.direction[j].prediction.length; k++) {
                                var dict = {};
                                dict["route"] = currPredictions.$.routeTitle;
                                dict["minutes"] = Number(currPredictions.direction[j].prediction[k].$.minutes);
                                data[data.length] = dict;
                            }
                        }
                    }
                }

                // Sort by arrival times
                data.sort(function(a, b) {
                    if (a["minutes"] < b["minutes"]) return -1;
                    if (a["minutes"] > b["minutes"]) return 1;
                    return 0;
                });
            });

            if (nextBusResponseObject.error) {
                console.log("NextBus error: " + nextBusResponseObject.error.message);
                nextBusRequestCallback(new Error(nextBusResponseObject.error.message));
            } else {
                nextBusRequestCallback(null, convertDataToString(data));
            }
        });
    }).on('error', function(e) {
        console.log("Communications error: " + e.message);
        nextBusRequestCallback(new Error(e.message));
    });
}

function convertDataToString(data) {
    var string = ""
    var n = Math.min(data.length, 3)
    for (var i = 0; i < n; i++) {
        string += data[i]["route"] + " in " + data[i]["minutes"] + (data[i]["minutes"] == 1 ? " minute" : " minutes")
        if (i < (n - 1)) {
            string += ", "
            if (i == (n - 2)) {
                string += "and "
            }
        } else {
            string += "."
        }
    }
    return string
}

// Create the handler that responds to the Alexa Request.
exports.handler = function (event, context) {
    // Create an instance of the SpaceGeek skill.
    var spaceGeek = new SpaceGeek();
    spaceGeek.execute(event, context);
};

