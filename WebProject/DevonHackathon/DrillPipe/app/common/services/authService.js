(function () {
    'use strict';

    angular
        .module('app')
        .factory('authService', authService);

    authService.$inject = ['$http', '$q', '$sce', 'aliasService', 'commonService', 'dataService', 'securityService'];

    function authService($http, $q, $sce, aliasService, commonService, dataService, securityService) {
        var
            storageKey = 'ServerHash',
            switchUser = false,
            authResult,
            service = {
                getUser: getUser,
                setUser: setUser
            };

        initAuthResult();
        return service;

        // if needed, makes one single call to the server and retrieves all parts of the authResult; 
        // otherwise varifies object integrity and returns stored authorization
        function getUser() {
            return $q(function (resolve, reject) {
                // if dealing with a new alias
                if (switchUser) {
                    getUserAuthorization()
                    .then(function () {
                        switchUser = false;
                        resolve(authResult);
                    }, reject);
                }
                else {
                    // if the currentUser is NOT set, set it
                    if (Object.keys(authResult.UserInfo).length === 0) {
                        getUserAuthorization()
                        .then(function () {
                            resolve(authResult);
                        }, reject);
                    }
                    else {
                        if (isValidAuthResult()) {
                            resolve(authResult);
                        } else {
                            //checksum is different; rehydrate from server
                            getUserAuthorization()
                            .then(function () {
                                resolve(authResult);
                            }, reject);
                        }
                    }
                }
            });
        }

        //set the view for the given user
        function setUser(u) {
            return $q(function (resolve, reject) {
                aliasService.setAlias(u);
                switchUser = true;
                //.then(function () {
                //    switchUser = true;
                //    resolve();
                //}, reject);
            });
        }

        function initAuthResult() {
            authResult = {
                UserInfo: {},
                IsAdmin: false,
                AdminOption: '',
                AdminLink: ''
            };
        }

        function getUserAuthorization() {
            return $q(function (resolve, reject) {
                dataService.getUser()
                .then(function (data) {
                    if (data && data.UserInfo) {
                        authResult.UserInfo = data.UserInfo;
                        authResult.IsAdmin = data.IsAdmin;
                        authResult.AdminLink = data.AdminLink;
                        authResult.AdminOption = data.AdminOption;
                    } else {
                        initAuthResult();   //reset the object
                    }
                    storeAuthResult();
                    resolve();
                }, function (e) {
                    var error = e.message !== undefined ? e.message + "\n\n" + e.exceptionType + "\n\n" + e.exceptionMessage : e;
                        commonService.showMessage({
                            headerText: 'Get User Authorization Error',
                            bodyText: $sce.trustAsHtml(error),
                            showClose: false
                        });
                        initAuthResult();   //reset the object
                        storeAuthResult();
                        reject(e);
                    }
                );
            });
        }

        function isValidAuthResult() {
            var val = localStorage[storageKey];
            return val &&
                securityService.isValidHiddenData(val) &&
                val === securityService.hideData(JSON.stringify(authResult));
        }

        function storeAuthResult() {
            localStorage[storageKey] = securityService.hideData(JSON.stringify(authResult));
        }
    }
})();