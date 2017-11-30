(function() {
    'use strict';

    angular
        .module('app')
        .directive('sdFocus', sdFocus);

    sdFocus.$inject = ['$timeout'];
    
    function sdFocus($timeout) {
        // Usage:
        //     <input sd-focus="{delay: 100, select: true}">
        //  -or- 
        //     <input sd-focus>
        //
        //  The optional delay property represents miliseconds.  If undefined, the value is defaulted to 500.
        //  The optional select property is used to determine whether or not to run the select() function on the element.  
        //      If undefined, the value is defaulted to false.
        // 
        var directive = {
            scope: { trigger: '=sdFocus'},
            link: link,
            restrict: 'A'
        };
        return directive;

        function link(scope, element) {
            scope.$watch('trigger', function (value) {
                var delay = 500,    //default to half-second delay -- useful if used in modal being displayed
                    select = false;
                if (value) {
                    if (value.delay && angular.isNumber(value.delay)) {
                        delay = parseInt(value.delay);
                    }
                    if (value.select !== undefined && typeof value.select === 'boolean') {
                        select = value.select;
                    }
                }
                $timeout(function () {
                    element[0].focus();
                    if (select) {
                        element[0].select();
                    }
                }, delay);
            });
        }
    }

})();