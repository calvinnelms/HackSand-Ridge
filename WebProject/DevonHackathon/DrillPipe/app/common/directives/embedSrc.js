(function() {
    'use strict';

    angular
        .module('app')
        .directive('embedSrc', embedSrc);

    function embedSrc () {
        return {
            restrict: 'A',
            link: function (scope, element, attrs) {
                var current = element;
                scope.$watch(function () { return attrs.embedSrc }, function () {
                    var clone = element
                                  .clone()
                                  .attr('src', attrs.embedSrc);
                    current.replaceWith(clone);
                    current = clone;
                    current.removeAttr('embed-src');
                });
            }
        };
    }

})();