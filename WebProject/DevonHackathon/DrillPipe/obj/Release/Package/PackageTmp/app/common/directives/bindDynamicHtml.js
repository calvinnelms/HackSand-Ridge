(function() {
    'use strict';

    angular
        .module('app')
        .directive('bindDynamicHtml', bindDynamicHtml);

    bindDynamicHtml.$inject = ['$compile'];
    
    function bindDynamicHtml($compile) {
        return function (scope, element, attrs) {
            scope.$watch(
              function (scope) {
                  // watch the 'bindDynamicHtml' expression for changes
                  return scope.$eval(attrs.bindDynamicHtml);
              },
              function (value) {
                  // when the 'bindDynamicHtml' expression changes
                  // assign it into the current DOM
                  element.html(value);

                  // compile the new DOM and link it to the current
                  // scope.
                  // NOTE: we only compile .childNodes so that
                  // we don't get into infinite loop compiling ourselves
                  $compile(element.contents())(scope);
              }
          );
        };
    }

})();