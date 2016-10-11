/**
 * Created by xiaodou_chenxiaoxiang on 16/8/7.
 */
var Newman = require('./src/Newman');
var JSON5 = require('json5');
var fs = require('fs');

// read the collectionjson file
var collectionJson = {
    "uniqID": "1476158446588",
    "name": "登录接口1",
    "description": "登录接口1",
    "url": "http://192.168.103.101:8201/user/login",
    "disabled": false,
    "dev": "赵聃",
    "method": "POST",
    "mode": "a/json",
    "headers": {
        "Content-Type": "application/json;charset=utf-8",
        "clientType": "android",
        "version": "1.0.0",
        "module": "3",
        "deviceId": "999",
        "clientIp": "192.168.0.1",
        "sessionToken": "bb93c10b-7fea-4384-bbeb-8d63e8533b54"
    },
    "queryParam": {
        "phoneNum": "13718037894",
        "pwd": "123456",
        "platform": "local"
    },
    "response": {
        "retcode": "0"
    },
    "ReqFolderID": "57fb647206e1b1270e013de6",
    "createdAt": "2016-10-11T04:00:46.629Z",
    "updatedAt": "2016-10-11T06:11:01.009Z",
    "dataType": "application/json",
    "prescript": "pre.setGlobalVar('test','3');",
    "testscript": "test.checkJsonValue('retcode',0);",
    "id": "57fc63eeeccbc220913ce86a"
};

// define Newman options
newmanOptions = {

    iterationCount: 1,                    // define the number of times the runner should run
    outputFile: "outfile.json",            // the file to export to
    responseHandler: "TestResponseHandler", // the response handler to use
    asLibrary: true,         				// this makes sure the exit code is returned as an argument to the callback function
    stopOnError: true
}

// Optional Callback function which will be executed once Newman is done executing all its tasks.
new Newman().execute(collectionJson, newmanOptions, function (exitCode, results) {
    console.log(exitCode);
    console.log(results);
});