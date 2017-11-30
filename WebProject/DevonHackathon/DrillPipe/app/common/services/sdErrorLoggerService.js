(function () {
    'use strict';

    angular
        .module('app')
        .factory('sdErrorLoggerService', sdErrorLoggerService);

    sdErrorLoggerService.$inject = ["$http", "$q", "commonService", "configService"];

    function sdErrorLoggerService($http, $q, commonService, configService) {
        var config = angular.extend({},
            {baseURL: 'http://deverrorlogger.sandridgeenergy.com', version: '1.5'},
            configService.errorLogger),   //,application: '', emailAddress: ''
        severityObj = {
            Information: 0,
            Warning: 1,
            Error: 2
        };

        postLocalExceptions()   //on load, attempt to post any locally stored exceptions
            .then(function (errors) {
                clearLocalExceptions(errors);
            }, function (e) {
                if (e && e.code === DOMException.QUOTA_EXCEEDED_ERR) {
                    commonService.changePath('/noapp');
                }
            });

        var service = {
            log: log,
            logInformation: logInformation,
            logWarning: logWarning,
            logError: logError,
            ping: ping
        };

        return service;

        function clearLocalExceptions(errors) {
            //check which item should be cleared
            for (var i = 0; i < errors.length; i++) {
                if (errors[i].transmitted) {    //if this error was transmitted (flag was set), remove it from the local array
                    errors.splice(i, 1);
                    i--;
                }
            }
            localStorage.SDErrorLog = JSON.stringify(errors);   //reset the localStorage to reflect the array
        }

        function postLocalExceptions() {
            var promises = [];
            if (localStorage) {
                if (localStorage.SDErrorLog === undefined) {
                    try {
                        localStorage.SDErrorLog = JSON.stringify([]);   //initialized -- nothing more to do
                    } catch (e) {
                        promises.push($q.reject(e));
                    }
                } else {
                    var errors = JSON.parse(localStorage.SDErrorLog);
                    angular.forEach(errors, function (error) {  //loop through each error
                        var deferred = $q.defer();              //set up the deferred object
                        isOnline()
                        .then(function () {
                            storeException(error)               //we're online, post the exception
                            .then(function (retval) {
                                error.transmitted = retval.logged;       //set the transmitted flag and resolve
                                deferred.resolve(error);
                            }, function () {
                                deferred.resolve(error);            //just resolve
                            });
                        }, function () {
                            if (config.localServerPost) {   //try logging utilizing app's server
                                storeException(error, config.localServerPost)               //post the exception
                                .then(function (retval) {
                                    error.transmitted = retval.logged;       //set the transmitted flag and resolve
                                    deferred.resolve(error);
                                }, function () {
                                    deferred.resolve(error);    //just resolve
                                });
                            } else {
                                deferred.resolve(error);    //just resolve
                            }
                        });
                        promises.push(deferred.promise);        //add the deferred promsie to the array
                    });
                }
            }
            return $q.all(promises);                            //wait for all deferred promises to resolve
        }

        function setSeverity(data, sev) {
            if (data && data.sdError) {
                data.sdError.Severity = sev;
            } else {
                data = angular.extend({sdError: {Severity: sev}}, data);
            }
            return data;
        }

        function ensureSeverityBounds(sdError) {
            if (sdError && sdError.Severity) {
                if (sdError.Severity < severityObj.Information || !isInt(sdError.Severity)) {
                    sdError.Severity = severityObj.Information; //default to Information if less than 0 or not an integer
                } else if (sdError.Severity > severityObj.Error) {
                    sdError.Severity = severityObj.Error;
                }
            }
        }

        function isInt(n) {
            return typeof n === 'number' && n % 1 === 0;
        }

        function isOnline() {
            return $http.get(config.baseURL);
        }

        function logException(data) {
            return $q(function (resolve, reject) {
                isOnline()
                .then(function () {
                    storeException(data)
                    .then(function (retval) {
                        if (retval.logged) {
                            resolve(retval.data);
                        } else {
                            reject(retval.data);
                        }
                    }, function (retval) {
                        reject(retval.data);
                    });
                }, function () {    //error logger service unreachable
                    if (data.ping) {
                        reject(data);
                    } else {
                        if (config.localServerPost) {//try logging utilizing app's server
                            storeException(data, config.localServerPost)
                            .then(function (retval) {
                                if (retval.logged) {
                                    resolve(retval.data);
                                } else {    //not able to log with app's server -- store locally
                                    storeOfflineException(data)
                                    .then(function (retval) {
                                        if (retval.logged) {
                                            resolve(retval.data);
                                        } else {
                                            reject(retval.data);
                                        }
                                    }, function (retval) {
                                        reject(retval.data);
                                    });
                                }
                            }, function () {  //error occurred logging with app's server -- store locally
                                    storeOfflineException(data)
                                .then(function (retval) {
                                    if (retval.logged) {
                                        resolve(retval.data);
                                    } else {
                                        reject(retval.data);
                                    }
                                }, function (retval) {
                                    reject(retval.data);
                                });
                            });
                        } else {    //log locally
                            storeOfflineException(data)
                            .then(function (retval) {
                                if (retval.logged) {
                                    resolve(retval.data);
                                } else {
                                    reject(retval.data);
                                }
                            }, function (retval) {
                                reject(retval.data);
                            });
                        }
                    }
                });
            });
        }

        function storeException(data, serverUrl) {
            var returnVals = data.returnVals || {};
            var sdError = data.sdError;
            var clientAlert = Boolean(data.clientAlert) || false;
            var clientMessage = (data.showError ? sdError.Message : (data.clientMessage || ''));
            return $q(function (resolve, reject) {
                checkApplication(sdError);
                checkEmailAddress(sdError);
                if (sdError && sdError.Application && sdError.Message) {
                    ensureSeverityBounds(sdError);
                    var logged = false;
                    $http.post((serverUrl ? serverUrl : config.baseURL + '/' + config.version +
                        '/errorlogger/' + (data.ping ? 'ping' : 'log')),
                        JSON.stringify(sdError), {
                            headers: {
                                'Content-Type': 'application/json; charset=utf-8'
                            }
                        })
                        .then(function (retval) {
                            if (clientAlert && ((retval && typeof retval.Message !== 'undefined') ||
                                clientMessage !== '')) {
                                showException(data, clientMessage);
                            }
                            if (retval && typeof retval.Message === 'undefined') {
                                returnVals.errorID = retval;
                                logged = true;
                            }
                            data.returnVals = returnVals;
                            resolve({logged: logged, data: data});
                        }, function (retval) {
                            returnVals.scriptException = retval;
                            reject({data: data});
                        });
                } else {
                    if (!sdError) {
                        returnVals.scriptException = {responseText: 'sdError object not found'};
                    } else if (!sdError.Application) {
                        returnVals.scriptException = {
                            responseText:
                                'sdError.Application is required'
                        };
                    } else if (!sdError.Message) {
                        returnVals.scriptException = {responseText: 'sdError.Message is required'};
                    }
                    data.returnVals = returnVals;
                    reject(data);
                }
            });
        }

        function storeOfflineException(data) {
            var returnVals = data.returnVals || {},
                sdError = data.sdError;
            return $q(function (resolve, reject) {
                checkApplication(sdError);
                checkEmailAddress(sdError);
                if (localStorage && sdError && sdError.Application && sdError.Message) {
                    var dt = new Date(),
                        clientTs = {
                            Name: 'clientTs',
                            Value: dt.getMonth() + 1 + '/' + dt.getDate() + '/' +
                                dt.getFullYear() + ' ' + ('0' + dt.getHours()).slice(-2) + ':' +
                                ('0' + dt.getMinutes()).slice(-2) + ':' + ('0' +
                                dt.getSeconds()).slice(-2)
                        };
                    if (sdError.ExtendedProperties) {
                        sdError.ExtendedProperties.push(clientTs);
                    } else {
                        sdError.ExtendedProperties = [clientTs];
                    }
                    var errors = JSON.parse(localStorage.SDErrorLog);
                    errors.push(data);
                    localStorage.SDErrorLog = JSON.stringify(errors);
                    resolve({logged: true, data: data});
                } else {
                    if (!localStorage) {
                        returnVals.scriptException = {
                            responseText:
                                'localStorage is not available'
                        };
                    } else if (!sdError) {
                        returnVals.scriptException = {responseText: 'sdError object not found'};
                    } else if (!sdError.Application) {
                        returnVals.scriptException = {
                            responseText:
                                'sdError.Application is required'
                        };
                    } else if (!sdError.Message) {
                        returnVals.scriptException = {responseText: 'sdError.Message is required'};
                    }
                    data.returnVals = returnVals;
                    reject({data: data});
                }
            });
        }

        function checkApplication(sdError) {
            if (sdError && (!sdError.Application || sdError.Application === '')) {
                //check the config value
                if (config.application && config.application !== '') {
                    sdError.Application = config.application;
                }
            }
        }

        function checkEmailAddress(sdError) {
            if (sdError && (!sdError.EmailAddress || sdError.EmailAddress === '')) {
                //check the config value
                if (config.emailAddress && config.emailAddress !== '') {
                    sdError.EmailAddress = config.emailAddress;
                    sdError.Notify = true;
                }
            }
        }

        function showException(data, clientMessage) {
            if (commonService && commonService.showMessage !== undefined) {
                commonService.showMessage({
                    headerText: 'Error Occurred',
                    bodyText: buildException(data, clientMessage, true),
                    showClose: false
                });
            } else {
                window.alert(buildException(data, clientMessage, false));
            }
        }

        function buildException(data, clientMessage, useHtml) {
            if (data && typeof data.Message !== "undefined") {
                var sep = (useHtml ? "<br />" : "\n");
                return data.Message + sep + data.Source + sep + data.StackTrace;
            } else if (clientMessage !== '') {
                return clientMessage;
            } else { return ""; }
        }

        function log(data) {
            return $q(function (resolve, reject) {
                logException(data)
                    .then(function (result) {
                        resolve(result);
                    }, function (result) {
                        reject(result);
                    });
            });
        }
        function logInformation(data) {
            data = setSeverity(data, severityObj.Information);
            return $q(function (resolve, reject) {
                logException(data)
                    .then(function (result) {
                        resolve(result);
                    }, function (result) {
                        reject(result);
                    });
            });
        }
        function logWarning(data) {
            data = setSeverity(data, severityObj.Warning);
            return $q(function (resolve, reject) {
                logException(data)
                    .then(function (result) {
                        resolve(result);
                    }, function (result) {
                        reject(result);
                    });
            });
        }
        function logError(data) {
            data = setSeverity(data, severityObj.Error);
            return $q(function (resolve, reject) {
                logException(data)
                    .then(function (result) {
                        resolve(result);
                    }, function (result) {
                        reject(result);
                    });
            });
        }
        function ping(data) {
            data = setSeverity(data, severityObj.Information);
            data.ping = true;
            return $q(function (resolve, reject) {
                logException(data)
                    .then(function (result) {
                        resolve(result);
                    }, function (result) {
                        reject(result);
                    });
            });
        }
    }
})();
