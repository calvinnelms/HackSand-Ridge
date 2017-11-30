(function () {
    'use strict';

    angular
        .module('app')
        .filter('jsonDateFilter', jsonDateFilter);
    
    function jsonDateFilter() {
        var re = /(\d+)(?:-(\d+))?/;
        return function (x) {
            if (x) {
                var arr = x.toString().match(re);
                if (arr && arr.length > 1) {
                    return parseInt(arr[1]);
                } else {
                    return x;
                }
            } else {
                return x;
            }
        };
    }
})();