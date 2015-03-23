var jsface          = require("jsface"),
    request         = require('request'),
    fs              = require('fs-extra'),
    _und            = require('underscore'),
    prompt          = require('prompt');

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

        console.log("We need some more info to continue...");
        prompt.start();
        prompt.get({
            properties: {
                //setting space as the property to prevent any extra message being printed
                password: {
                    description: "Password: ",
                    hidden: true
                },

                directory: {
                    description: "Directory to which you want your collections to be saved",
                    default: "/home"
                }
            }
        }, function (err, result) {
            syncModule.directory = result.directory;
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

            //Get collections for user
        .then(function(response) {
            console.log("Connecting to Postman Sync server..");
            var userId = response.user_id;
            var accessToken = response.access_token;
            return syncModule.getUserCollectionsFromSync(userId, accessToken);
        })

        .then(function(userId, collectionArray) {
            return syncModule.deleteUserFiles(userId);
        })

            //Get folders for collection, and requests for collection
        .then(function(userId, collectionArray) {
            var numCollections = collectionArray.length;
            for(var i=0;i<numCollections;i++) {
                syncModule.saveCollection(userId, collectionArray[i]);
            }
        });
    },

    deleteUserFiles: function(userId) {
        return new Promise(function(resolve, reject) {
    },

    saveCollection: function(userId, collectionJson) {

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
            });
        });
    },

    getUserCollectionsFromSync: function(userId, accessToken) {
        return new Promise(function(resolve, reject) {
            //assume you've got the collections
            request(syncModule.syncServerUrl + '/api/collection?user_id=' + userId, function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    var collections = [];
                    //pluck only the data field from each array elemeent
                    resolve(userId, _und.pluck(body,'data'));
                }
                else {
                    reject("Error getting collections");
                }
            });


        });
    }
});

module.exports = NewmanSyncDownloader;
