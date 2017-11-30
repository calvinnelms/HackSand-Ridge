(function () {
    'use strict';

    angular
        .module('app')
        .service('actionService', actionService);

    actionService.$inject = ['$http', '$q', 'configService'];

    //actionService
    function actionService($http, $q, configService) {
        var baseUrl = configService.baseUrl //'http://localhost:63136'
            , service = {
                getAction: getAction
                , getByObjectAction: getByObjectAction
                , postObjectAction: postObjectAction
                , putObjectAction: putObjectAction
                , deleteObjectAction: deleteObjectAction
            };

        return service;

        function getAction(controller, action) {
            return $q(function (resolve, reject) {
                $http.get(baseUrl + '/' + controller + '/' + action)
                    .success(function (data) {
                        resolve(data);
                    })
                    .error(function (data, status, headers, config) {
                        console.log(data);
                    });
            });
        }

        function getByObjectAction(controller, action, object) {
            return $q(function (resolve, reject) {
                $http.get(baseUrl + '/' + controller + '/' + action, { params: object })
                    .success(function (data) {
                        resolve(data);
                    })
                    .error(function (data, status, headers, config) {
                        console.log(data);  
                    });
            });
        }

        function postObjectAction(controller, action, object, c) {
            return $q(function (resolve, reject) {
                $http.post(baseUrl + '/' + controller + '/' + action, object )
                    .success(function (data) {
                        data.count = c;
                        resolve(data);
                    })
                    .error(function (data, status, headers, config) {
                        console.log(data);
                    });
            });
        }

        //PutObjectAction
        //object = { id: _id, ..., object: _object }
        function putObjectAction(controller, action, object) {
            return $q(function (resolve, reject) {
                $http.put(baseUrl + '/' + controller + '/' + action, object)
                    .success(function (data) {
                        resolve(data);
                    })
                    .error(function (data, status, headers, config) {
                        console.log(data);
                    });
            });
        }

        //DeleteObjectAction
        //delete = { id: _id, ..., object: _object }
        function deleteObjectAction(controller, action, object) {
            return $q(function (resolve, reject) {
                $http.delete(baseUrl + '/' + controller + '/' + action, object)
                    .success(function (data) {
                        resolve(data);
                    })
                    .error(function (data, status, headers, config) {
                        console.log(data);
                    });
            });
        }
    }
})();