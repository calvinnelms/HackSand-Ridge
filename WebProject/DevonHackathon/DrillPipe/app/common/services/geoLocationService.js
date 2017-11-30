(function () {
    'use strict';

    angular
        .module('app')
        .factory('geoLocationService', geoLocationService);

    geoLocationService.$inject = ['$q'];

    function geoLocationService($q) {
        var service = {
                getCurrentPosition: getCurrentPosition,
                watchPosition: watchPosition,
                clearWatch: clearWatch
            },
            config = {
                //timeout: 0, //in miliseconds -- Infinity by default
                enableHighAccuracy: true,
                maximumAge: 0//Infinity
            }, watchId;

        return service;

        function getCurrentPosition(setLocation, setError) {
            if (navigator && navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(setLocation, setError, config);
            } else {
                setError(returnNoBrowserSupport());
            }
        }

        function watchPosition(setLocation, setError) {
            if (navigator && navigator.geolocation) {
                watchId = navigator.geolocation.watchPosition(setLocation, setError, config);
            } else {
                setError(returnNoBrowserSupport());
            }
        }

        function returnNoBrowserSupport() {
            return { message: 'Browser does not support geolocation' };
        }

        function clearWatch() {
            return $q(function (resolve, reject) {
                try {
                    if (watchId && navigator && navigator.geolocation) {
                        navigator.geolocation.clearWatch(watchId);
                    }
                    resolve();  //return a resolved promise
                } catch (e) {
                    reject(e);  //something happened; reject promise with the caught exception
                }
            });
        }
    }
})();
