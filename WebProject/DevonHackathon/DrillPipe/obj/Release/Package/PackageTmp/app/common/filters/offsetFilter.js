(function () {
    'use strict';

    angular
        .module('app')
        .filter('offsetFilter', offsetFilter);
    
    function offsetFilter() {
        return function (input, offset) {
            return (input instanceof Array)
              ? input.slice(+offset)
              : input;
        };
    }
})();