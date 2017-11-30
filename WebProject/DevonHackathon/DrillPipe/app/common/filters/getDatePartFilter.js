(function () {
    'use strict';

    angular
        .module('app')
        .filter('getDatePartFilter', getDatePartFilter);
    
    function getDatePartFilter() {
        return getDatePartFilterFilter;

        function getDatePartFilterFilter(dateStr) {
            if (dateStr.indexOf('T') > 0) {
                dateStr = dateStr.split('T')[0];
            }
            return new Date(dateStr.replace(/-/g, '/'));
        }
    }
})();