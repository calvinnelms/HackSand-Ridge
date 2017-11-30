(function() {
    'use strict';

    angular
        .module('app')
        .directive('dashboardInfobox', dashboardInfobox);

    function dashboardInfobox() {
        return {
            restrict: "E",
            templateUrl: "app/common/directives/dashboardInfobox/dashboardInfobox.html",
            scope: {
                title: "@",
                count: "@",
                boxstyle: "@",
                control: "@",
                color: "@",
                icon: "@"
            },
            link: function(scope) {
                scope.boxstyle = angular.isDefined(scope.boxstyle) ? scope.boxstyle : 'infobox';
                scope.color = angular.isDefined(scope.color) ? scope.color : 'bg-primary';
                scope.icon = angular.isDefined(scope.icon) ? scope.icon : 'glyphicon glyphicon-flash';

                if (angular.isDefined(scope.control)) {
                    if (scope.control !== "")
                        scope.control = "" + scope.control;
                }

                // Example Colors: bg-green, bg-yellow, bg-red, bg-navy, bg-aqua, bg-olive, bg-purple, bg-red-active, bg-light-blue-active, bg-yellow-active, bg-primary, bg-gray-active
            }
        }

    }
})();