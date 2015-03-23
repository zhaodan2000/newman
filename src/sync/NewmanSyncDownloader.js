var jsface          = require("jsface"),
    request = require('request'),
    prompt = require('prompt');

/**
 * @name NewmanSyncDownloader
 * @classdesc Gets all the users sync data into a folder
 * @namespace
 */
var NewmanSyncDownloader = jsface.Class({

    constructor: function(username) {
        this.setDefaults();
        this.username = username;
        prompt.message = "";
        prompt.delimiter = "";
    },

    setDefaults: function() {
        this.postmanUrl = "https://getpostman.com";
        this.syncServerUrl = "https://sync-server.getpostman.com"
    },

    begin: function() {
        if(!this.username) {
            console.error("Username must be specified");
            return;
        }
        var syncModule = this;

        console.log("Please enter your password");
        prompt.start();
        prompt.get({
            properties: {
                //setting space as the property to prevent any extra message being printed
                password: {
                    description: "Password: ",
                    hidden: true
                }
            }
        }, function (err, result) {
            syncModule.beginFlow(syncModule.username, result.password);
        });
    },

    beginFlow: function(username, password) {
        var syncModule = this;
        console.log("Connecting to Postman server...");

        this.doPostmanAuth(username, password).then(function(response) {
            console.log("Authentication successful!");
            console.log(JSON.stringify(response));
            return response;
        }, function(error) {
            console.error("There was an error: " + error);
            console.error("Cannot continue :(");
            return;
        })

            //Do Sync Auth
        .then(function(response) {
            console.log("Connecting to Postman Sync server..");
            var userId = response.user_id;
            var accessToken = response.access_token;
            return syncModule.getUserCollectionsFromSync(userId, accessToken);
        })

            //Get folders for collection, and requests for collection
        .then(function(response) {
                var collections = response.collections;
                //this is an array
                //for each collection, save to a file
                //and trigger the getFolders and getRequests part
        });
    },

    /**
     * This returns a promise. Success = with access token
     * @param user
     */
    doPostmanAuth: function(username, password) {
        var syncModule = this;
        return new Promise(function(resolve, reject) {
            request.post({url: syncModule.postmanUrl + '/signin', json: {username:username, password:password}}, function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    if(body.result == "fail") {
                        reject(body.message);
                    }
                    else if(body.result == "success") {
                        resolve(body);
                    }
                }
            })
        });
    },

    getUserCollectionsFromSync: function(userId, accessToken) {
        return new Promise(function(resolve, reject) {
            //assume you've got the collections
            var collections = [];
            resolve(userId, collections);
        });
    }
});

module.exports = NewmanSyncDownloader;
