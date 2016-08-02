var _ = require('lodash'),
    xml = require('xmlbuilder'),
    fs = require('fs'),

    /**
     * Formats a date object.
     *
     * @param {Date=} date
     * @returns {string}
     */
    formatDate = function formatDate(date) {
        !date && (date = new Date());
        var year = date.getFullYear(),
            month = date.getMonth() + 1, // months are zero indexed
            day = date.getDate(),
            hour = date.getHours(),
            minute = date.getMinutes(),
            second = date.getSeconds();
        return `${month}-${day}-${year}.${hour}-${minute}-${second}`;
    },

    JunitReporter = function (emitter, reporterOptions) {
        var output = reporterOptions.output || 'newman-report-' + formatDate() + '.xml';

        emitter.on('done', function () {
            var report = _.get(emitter, 'summary.run.executions'),
                collection = _.get(emitter, 'summary.collection'),
                root,

                cache = {};

            if (!report) {
                return;
            }

            root = xml.create('testsuites', { version: '1.0', encoding: 'UTF-8' });
            root.att('name', collection.name);

            // Build up the cache
            _.each(report, function (execution) {
                (cache[execution.id] || (cache[execution.id] = [])).push(execution);
            });

            // id: [ex1, ex2]
            _.each(cache, function (executions, id) {
                var suite,
                    testCases = {},
                    currentItem;

                collection.forEachItem(function (item) {
                    if (item.id === id) {
                        currentItem = item;
                    }
                });

                if (!currentItem) { return; }

                suite = root.ele('testsuite');

                // todo: add timestamp of when the request was made
                suite.att('name', currentItem.name);
                suite.att('id', currentItem.id);

                _.each(executions, function (execution) {
                    var requestError = execution.requestError,
                        prerequestErrors = _.isArray(execution.prerequestScript) ?
                            _.map(execution.prerequestScript, 'error') : [],
                        testErrors = _.isArray(execution.testScript) ?
                            _.map(execution.testScript, 'error') : [],
                        // Pull out all errors in each execution
                        errors = _.concat(requestError ? [requestError] : [], prerequestErrors, testErrors),
                        stack;

                    if (errors.length) {
                        console.log(errors);
                        suite.ele('error').dat(_.map(errors, 'stack').join('\n---\n'));
                    }

                    _.each(execution.assertions, function (each) {
                        var testCase = testCases[each.assertion] = (testCases[each.assertion] ||
                                suite.ele('testcase').att('name', each.assertion));
                        each.error && testCase.ele('failure').dat('failed in iteration: ' + each.cursor.iteration);
                    });
                });
            });

            summary.exports.push({
                key: output,
                value: root.end({
                    pretty: true,
                    indent: '  ',
                    newline: '\n',
                    allowEmpty: false
                })
            });
        });
    };

module.exports = JunitReporter;
