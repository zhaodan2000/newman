var jsface = require('jsface'),
    DefaultResponseHandler = require('./DefaultResponseHandler'),
    path = require('path'),
    fs = require('fs');

/**
 * @class ResponseHandlerFactory
 * @classdesc
 */
var ResponseHandlerFactory = jsface.Class({
    $singleton: true,

    /**
     * @function
     * @memberOf ResponseHandlerFactory
     * @param {JSON} options
     * returns a responseHandler that inherits from the
     * AbstractRequestHandler class
     */
    createResponseHandler: function (options) {
        var handler = null;
        if (options.responseHandler === undefined) {
            handler = DefaultResponseHandler;
            return handler;
        } else {
            var filePath = path.join(__dirname, options.responseHandler.split(".")[0] + '.js');
            try {
                fs.statSync(filePath); // make sure the file exists
                handler = require(filePath);
                return handler;
            }
            catch (e) {
                return false;
            }
        }
    }
});

module.exports = ResponseHandlerFactory;
