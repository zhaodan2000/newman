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
        this.directoryRoot = '/home/';
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
                    description: "Directory to which you want your collections to be saved (folders called collections, environments, globals will be created here)",
                    default: "/home/username"
                }
            }
        }, function (err, result) {
            if(err) {
                console.log();
                process.exit(1);
            }
            syncModule.directory = result.directory;
            syncModule.beginFlow(syncModule.username, result.password);
        });
    },


    beginFlow: function(username, password) {
        var syncModule = this;
        console.log("Connecting to Postman server...");

        //get access token from postman server
        this.doPostmanAuth(username, password).then(function(response) {
            console.log("Authentication successful!");
            console.log(JSON.stringify(response));
            return response;
        }, function(error) {
            console.error("There was an error: " + error);
            console.error("Cannot continue :(");
            process.exit(1);
        })

        .then(function() {
            console.log("Deleting old directory");
            return syncModule.deleteUserFiles();
        })
        .catch(function(e) {
            console.error("Error deleting directory: " + syncModule.directory);
            console.error(JSON.stringify(e));
            process.exit(1);
        })

        //Get collections for user
        .then(function() {
            console.log("Connecting to Postman Sync server..");
            var userId = syncModule.user_id;
            var accessToken = syncModule.access_token;
            return syncModule.getUserCollectionsFromSync(userId, accessToken);
        })
        .catch(function(error) {
            console.log("Could not get collections: " + error);
            process.exit(1);
        })


        //Get folders for collection, and requests for collection
        .then(function(resolveObject) {
            console.log("Resolved...");
            var userId = resolveObject.userId;
            var collectionArray = resolveObject.collectionArray;
            var numCollections = collectionArray.length;
            var collectionPromises = [];
            for(var i=0;i<numCollections;i++) {
                console.log("Saving collection");
                //this will NOT return a promise
                collectionPromises.push(syncModule.saveCollection(userId, collectionArray[i]));
            }
            Promise.all(collectionPromises).then(function() {
                console.log("All collections saved");
            }); //something something (just print the message)
        })

        .catch(function() {
            console.log("Something went wrong :(");
        });
    },

    deleteUserFiles: function() {
        var syncModule = this;
        return new Promise(function(resolve, reject) {
            fs.remove(syncModule.directory, function(err) {
                if (err) {
                    console.log("Rejecting...");
                    reject(err);
                }
                else {
                    resolve();
                }
            });
        });
    },

    /**
     * This needs to return a resolved promise when everything is done
     * @param userId
     * @param collectionJson
     */
    saveCollection: function(userId, collectionJson) {
        var syncModule = this;

        return new Promise(function(cResolve, cReject) {
            console.log("Save collection function for collection " + collectionJson.id);
            var fp = syncModule.getFoldersForCollection(userId, collectionJson);
            fp.then(function(resolveObject) {
                console.log("Get folders for collection (" + resolveObject.collection.id+") resolved");
                var userId = resolveObject.userId;
                var folderArray = resolveObject.folderArray;
                var numCollections = folderArray.length;
                var collection = resolveObject.collection;
                collectionJson.folders = folderArray;
            })

            var rp = syncModule.getRequestsForCollection(userId, collectionJson);
            rp.then(function(resolveObject) {
                console.log("Get requests for collection (" + resolveObject.collection.id+") resolved");
                var requestArray = resolveObject.requestArray;
                collectionJson.requests = requestArray;
            });

            Promise.all([fp, rp]).then(function() {
                console.log("Savecollection (" + collectionJson.id+") resolved");
                syncModule.saveCollectionToFile(collectionJson).then(function() {
                    cResolve(collectionJson);
                });
            });
        });
    },

    saveCollectionToFile: function(json)
    {
        var file = this.directory + '/collections/' + json.name;

        fs.outputFile(file, JSON.stringify(json,null,2), function(err) {
            if(err) {
                console.log(err)
            } // => null
        });
    },

    getRequestsForCollection: function(userId, collectionJson) {
        var syncModule = this;
        return new Promise(function(resolve, reject) {
            //assume you've got the collections
            request(syncModule.syncServerUrl + '/api/request?user_id=' + userId + "&collection=" + collectionJson.id, function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    //pluck only the data field from each array element
                    try {
                        body = JSON.parse(body);
                        console.log("Requests (" + body.length + ") retrieved");
                        var resolveObject = {
                            userId: userId,
                            requestArray: _und.pluck(body,'data'),
                            collection: collectionJson
                        };
                        resolve(resolveObject);
                    }
                    catch(e) {
                        reject("Error parsing JSON");
                    }
                }
                else {
                    reject("Error getting collections");
                }
            });
        });
    },

    getFoldersForCollection: function(userId, collectionJson) {
        var syncModule = this;
        return new Promise(function(resolve, reject) {
            //assume you've got the collections
            request(syncModule.syncServerUrl + '/api/folder?user_id=' + userId + "&collection=" + collectionJson.id, function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    //pluck only the data field from each array element
                    try {
                        body = JSON.parse(body);
                        console.log("Folder (" + body.id + ") retrieved");
                        var resolveObject = {
                            userId: userId,
                            folderArray: _und.pluck(body,'data'),
                            collection: collectionJson
                        };
                        resolve(resolveObject);
                    }
                    catch(e) {
                        reject("Error parsing JSON");
                    }
                }
                else {
                    reject("Error getting collections");
                }
            });
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
                        syncModule.access_token = body.access_token;
                        syncModule.user_id = body.user_id;
                        syncModule.username = username;
                        resolve(body);
                    }
                }
            });
        });
    },

    getUserCollectionsFromSync: function(userId, accessToken) {
        var syncModule = this;
        return new Promise(function(resolve, reject) {
            //assume you've got the collections
            request(syncModule.syncServerUrl + '/api/collection?user_id=' + userId, function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    //pluck only the data field from each array element
                    try {
                        body = JSON.parse(body);
                        var resolveObject = {
                            userId: userId,
                            collectionArray: _und.pluck(body,'data')
                        };
                        resolve(resolveObject);
                    }
                    catch(e) {
                        reject("Error parsing JSON");
                    }
                }
                else {
                    reject("Error getting collections");
                }
            });
        });
    }
});

module.exports = NewmanSyncDownloader;
