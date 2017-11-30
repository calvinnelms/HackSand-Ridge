(function () {
    'use strict';

    angular
        .module('app')
        .factory('dataService', dataService);

    dataService.$inject = ['$http', '$q', 'aliasService', 'commonService', 'configService']; // , 'Upload'];

    function dataService($http, $q, aliasService, commonService, configService) { //, upload) {
        var _URL = "demo",
            service = {
                getUser: getUser
            };

        return service;

        //function getAlias() {
        //    return url;
        //}

        function getUser() {
            return $q(function (resolve, reject) {
                $http.get(_URL + "/getuser" + "?alias=" + aliasService.getAlias())
                .then(function (response) {
                        resolve(response.data);
                    }, function (response) {
                        reject(response.data);
                    });
            });
        }
        //function demo() {
        //    return $q(function (resolve, reject) {
        //        $http.get(_URL + "/demo" + url)
        //        .then(function (response) {
        //            resolve(response.data);
        //        }, function (response) {
        //            reject(response.data);
        //        });
        //    });
        //}
        //function getLocalData() {
        //    return $q(function (resolve, reject) {
        //        $http.get('app/localdata/data.txt')
        //        .then(function (response) {
        //            resolve(response.data);
        //        }, function (response) {
        //            reject(response.data);
        //        });
        //    });
        //}
        //function getData() {
        //    return $q(function (resolve, reject) {
        //        $http.get(_URL + "/db" + url)
        //        .then(function (response) {
        //            resolve(response.data);
        //        }, function (response) {
        //            reject(response.data);
        //        });
        //    });
        //}
        //function setView(u) {
        //    return $q(function (resolve, reject) {
        //        url = "?alias=" + u;
        //        currentUser = u;
        //        resolve();
        //    });
        //}
        //function sendEmail() {
        //    return $q(function (resolve, reject) {
        //        checkConnection()   //ensure we have a validated connection before attempting
        //        .then(function () {
        //            $http.get(_URL + '/email')
        //            .then(function (response) {
        //                    resolve(response.data);
        //                }, function (response) {
        //                    reject(response.data);
        //                });
        //        }, function (response) {
        //            reject(response);
        //        });
        //    });
        //}
        //function uploadFiles(data) {
        //    return $q(function (resolve, reject) {
        //        upload.upload({
        //            url: _URL + "/fileupload" + url,
        //            file: data.file
        //        }).success(function (data, status, headers, config) {
        //            resolve({ data: data, status: status, headers: headers, config: config });
        //        }).error(function (e) {
        //            reject(e);
        //        });
        //    });
        //}
        //function embedFile() {
        //    return $q(function (resolve, reject) {
        //        checkConnection()
        //        .then(function () {
        //            $http.post(url + '/embedfile', null, { responseType: 'arraybuffer' })
        //            .then(function (response) {
        //                resolve(response.data);
        //            }, function (response) {
        //                reject(response.data);
        //            });
        //        }, function (response) {
        //            reject(response);
        //        });
        //    });
        //}
        //*****************
        //private functions
        //*****************
        function checkConnection() {
            return $q(function (resolve, reject) {
                checkOnline()
                .then(function () {
                    checkAuthentication()
                    .then(resolve, reject); //function(response) {reject(response);}
                }, function (response) {
                        reject({ offline: true });
                    });
            });
        }
        function checkOnline() {
            return $q(function (resolve, reject) {
                //ensure checking for "online" is necessary for this app
                if (configService.appInfo.onlineURL === undefined || configService.appInfo.onlineURL === '') {
                    resolve();
                } else {
                    AJAXGet(configService.appInfo.onlineURL + '?_=' + new Date().getTime())
                    .then(resolve, reject);
                }
            });
        }
        function checkAuthentication() {
            return $q(function (resolve, reject) {
                //ensure checking for "validation" is necessary for this app
                if (configService.appInfo.validationURL === undefined || configService.appInfo.validationURL === '') {
                    resolve();
                } else {
                    AJAXGet(configService.appInfo.validationURL + '?_=' + new Date().getTime())
                    .then(resolve,
                    function () {
                        if (configService.appInfo.autoReload !== undefined && configService.appInfo.autoReload) {
                            commonService.reload(); //*optional* -- pass array of {name: 'somename', value: 'somevalue'} to be converted to querystring: {redirectURL}?{datestamp}&somename=somevalue&somename2=somevalue2
                        } else {
                            reject({ revalidate: true });
                        }
                    });
                }
            });
        }
        function AJAXGet(url) {
            return $q(function (resolve, reject) {
                var r = new XMLHttpRequest();
                r.open('GET', url, true);
                r.timeout = 5000;   //5-second timeout
                r.ontimeout = function () { reject(getResponseData(r)); };
                r.onerror = function () { reject(getResponseData(r)); };
                r.onload = function () {
                    if (r.readyState === 4 && r.status === 200) {   //completed successfully
                        resolve(getResponseData(r));
                    } else {    //completed but not successfully
                        reject(getResponseData(r));
                    }
                };
                r.onabort = function () { reject(getResponseData(r)); };
                r.send();
            });
        }
        function getResponseData(r) {
            return {
                responseHeaders: splitResponseHeaders(r.getAllResponseHeaders()),
                responseText: r.responseText,
                status: r.status,
                statusText: r.statusText
            };
        }
        function splitResponseHeaders(rawHeaders) {
            if (rawHeaders) {
                var splitHeaders = rawHeaders.toLowerCase().split("\r\n");
                if (splitHeaders && splitHeaders.length > 0) {
                    var headers = [];
                    var keyValue;
                    for (var i = 0; i < splitHeaders.length; i++) {
                        if (splitHeaders[i].indexOf(": ") > 0) {    //splittable value
                            keyValue = splitHeaders[i].split(": ");
                            if (keyValue && keyValue.length === 2)  //valid key-value pair
                                headers.push({ name: keyValue[0], value: keyValue[1] });
                        }
                    }
                    return headers;
                } else { //no delimited value returned
                    return [];
                }
            } else {    //no headers returned
                return [];
            }
        }
    }
})();
