process.env.DEBUG = 'actions-on-google:*';

const Assistant = require('actions-on-google').ApiAiApp;
var FlightStatsAPI = require('flightstats')
var express = require('express');
var bodyParser = require('body-parser');
var request_lib = require('request'); // for sending the http requests to Numbers API
var assert = require('assert');
var rp = require('request-promise');
let apiId = process.env.API_ID;
let apiKey = process.env.API_key;
console.log(apiId);
console.log(apiKey);
var app = express();

app.set('port', (process.env.PORT || 8080));
app.use(bodyParser.json({
    type: 'application/json'
}));

// get by action

const TrackByFlight_ID = "TrackByFlightID";
const TrackByStarting_Date = "TrackByStartingDate";
const Help_Intent = "HelpIntent";
const WelcomeIntent = "input.welcome";
const quit_Intent = "quit_Intent";

// Options are optional; 
// defaults to retrieve all currently active airlines 
// api.getAirlines(options, callback)
// // Options (iata, icao, fs are mutually exclusive): 
// var options = {
//     all: {
//         Boolean
//     },
//     date: {
//         Date
//     },
//     iata: {
//         String
//     },
//     icao: {
//         String
//     },
//     fs: {
//         String
//     },
// }

app.post('/', function (req, res) {
    const assistant = new Assistant({
        request: req,
        response: res
    });
    var intent = assistant.getIntent();
    console.log("hi this is intent" + intent);

    function WelcomeSpeach(assistant) {
        console.log("this is assistant" + assistant);
        var reply = "Welcome to FlightStat.. give me you flight number will let you know currently where the flight is";
        assistant.ask(reply);
    }

    function provideDetailsByID(request, response) {
        var flightNumber_url = assistant.getArgument('flightNumber');
        console.log("the response is " + response);
        if (flightNumber_url) {
            console.log(apiId);
            console.log(apiKey);
            var p = Promise.resolve();
            var getDetails = {
                method: 'GET',
                // 933427129 flight number
                // uri: `https://api.flightstats.com/flex/flightstatus/rest/v2/json/flight/track/933427129?appId=6aac18a6&appKey=40a7e359cb020a07ead5159c2d5d8162&includeFlightPlan=false&maxPositions=2`,
                uri: `https://api.flightstats.com/flex/flightstatus/rest/v2/json/flight/track/${flightNumber_url}?appId=${apiId}&appKey=${apiKey}&includeFlightPlan=false&maxPositions=2`,
                json: true,
                resolveWithFullResponse: true,
            };
            console.log("get details log " + getDetails);
            p = rp(getDetails)
                .then(function (res) {
                    let flightId = res.body.request.flightId.requested;
                    let maxPositions = res.body.request.maxPositions.requested;
                    let fLNumber = res.body.flightTrack.flightNumber;
                    let carrierCode = res.body.flightTrack.carrierFsCode;
                    // "dateLocal": "2017-09-14T07:05:00.000",
                    let departureDate = res.body.flightTrack.departureDate.dateLocal;
                    let airName = res.body.appendix.airlines[0].name;
                    let airPortName = res.body.appendix.airports[0].name;
                    let airPortCity = res.body.appendix.airports[0].city;
                    let airPortCountryName = res.body.appendix.airports[0].countryName;
                    let airPortregionName = res.body.appendix.airports[0].regionName;
                    let airPortlat = res.body.appendix.airports[0].latitude;
                    let airPortlong = res.body.appendix.airports[0].longitude;

                    var deptdate = new Date(departureDate);

                    console.log("logging flight id " + flightId);

                    FlightTrackdata = `Your flight Id is ${flightId} the maximum positions is ${maxPositions} and flight number is ${fLNumber} the carrier code is  ${carrierCode} and the departure date is ${departureDate} and the airport name is ${airPortName} and the airport city name is ${airPortCity} and the country name is ${airPortCountryName} the lattitude are ${airPortlat} logitude is ${airPortlong}. Do you want to continue. `;
                    assistant.ask(FlightTrackdata);
                    //  response.say(JSON.stringify(res));
                    response.send();
                });
            return p;
        } else {
            assistant.ask("please tell me your Flight Id Number example 933427129 ");
        }
    }
    // ---------------------------------------search by date------------------
    function provideDetailsByDate(request, response) {
        var AirLineCode = assistant.getArgument('AirLineCode');
        var startDate = assistant.getArgument('startDate');
        var flightNumber = assistant.getArgument('flightNumber');
        console.log("date is been displayed" + startDate);
        console.log("the response is " + response);
        var year = Date(startDate).year;

        var month = Date(startDate).month;
        var day = Date(startDate).day;
        console.log("this is year" + year);
        console.log("this is month" + month);
        console.log("this is day" + day);
        if (flightNumber) {
            if (AirLineCode) {
                if (startDate) {
                    var p = Promise.resolve();
                    var getDetails_date = {
                        method: 'GET',
                        // 933427129 flight number
                        // https://api.flightstats.com/flex/flightstatus/rest/v2/json/flight/tracks/AA/100/arr/2017/09/13?appId=6aac18a6&appKey=40a7e359cb020a07ead5159c2d5d8162&utc=false&includeFlightPlan=false&maxPositions=2
                        // uri: `https://api.flightstats.com/flex/flightstatus/rest/v2/json/flight/track/${flightNumber_url}?appId=${apiId}&appKey=${apiKey}&includeFlightPlan=false&maxPositions=2`,
                        uri: `https://api.flightstats.com/flex/flightstatus/rest/v2/json/flight/tracks/${AirLineCode}/${flightNumber}/arr/${year}/${month}/${date}?appId=6aac18a6&appKey=40a7e359cb020a07ead5159c2d5d8162&utc=false&includeFlightPlan=false&maxPositions=2`,
                        json: true,
                        resolveWithFullResponse: true,
                    };
                    console.log("get details log " + getDetails_date);
                    p = rp(getDetails_date)
                        .then(function (res) {
                            let flightId = res.body.request.airline.requestedCode;
                            let maxPositions = res.body.request.maxPositions.requested;
                            let fLNumber = res.body.flightTrack[0].flightNumber;
                            let carrierCode = res.body.flightTrack[0].carrierFsCode;
                            let departureDate = res.body.flightTrack[0].departureDate.dateLocal;
                            let airName = res.body.appendix.airlines[0].name;

                            let airPortName = res.body.appendix.airports[0].name;
                            let airPortCity = res.body.appendix.airports[0].city;
                            let airPortCountryName = res.body.appendix.airports[0].countryName;
                            let airPortregionName = res.body.appendix.airports[0].regionName;
                            let airPortlat = res.body.appendix.airports[0].latitude;
                            let airPortlong = res.body.appendix.airports[0].longitude;

                            console.log("logging flight id " + flightId);

                            FlightTrackByDatedata = `Your flight Id is ${flightId}  the maximum positions is ${maxPositions}  and flight number is ${fLNumber} the carrier code is  ${carrierCode} and the departure date is today and the airport name is ${airPortName} and the airport city name is ${airPortCity} and the country name is ${airPortCountryName} the lattitude are ${airPortlat} logitude is ${airPortlong} `;
                            assistant.ask(FlightTrackByDatedata);
                            //  response.say(JSON.stringify(res));
                            response.send();
                        });
                    return p;
                } else {
                    assistant.ask("please give me your Arrival date");
                }
            } else {
                assistant.ask("please give me your Air line code example AA");
            }
        } else {
            assistant.ask("please tell me your Flight Number example 100");
        }
    }

    // function ThankyouSpeach(assistant) {
    //     var TnkYou = "Welcome to FlightStat.. give me you flight number will let you know currently where the flight is";
    //     assistant.ask(TnkYou);
    // }


    let actionMap = new Map();
    let actionSee = actionMap.get(TrackByFlight_ID);
    console.log("this is action" + actionSee);

    actionMap.set(TrackByFlight_ID, provideDetailsByID);
    actionMap.set(TrackByStarting_Date, provideDetailsByDate);
    actionMap.set(WelcomeIntent, WelcomeSpeach);
    // actionMap.set(quit_Intent, ThankyouSpeach);
    assistant.handleRequest(actionMap);
});

app.get('/', function (req, res) {
    res.send("Server is up and running.")
});

var server = app.listen(app.get('port'), function () {
    console.log('App listening on port %s', server.address().port);
});