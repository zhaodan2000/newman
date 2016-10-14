var jsface = require('jsface'),
    AbstractResponseHandler = require('./AbstractResponseHandler');

/**
 * @class DefaultResponseHandler
 * @classdesc
 * @extends AbstractResponseHandler
 */
var DefaultResponseHandler = jsface.Class(AbstractResponseHandler, {
    $singleton: true,
    // function called when the event "requestExecuted" is fired. Takes 4 self-explanatory parameters
    _onRequestExecuted: function (error, response, body, request, runner) {
        AbstractResponseHandler._onRequestExecuted.call(this, error, response, body, request, runner.exporter);
        runner.emit("requestHandlerExecuted", error, response, body, request, runner, delay);
    }
});

module.exports = DefaultResponseHandler;
