(function () {
    'use strict';

    angular
        .module('app')
        .controller('drillPipesController', drillPipesController);

    drillPipesController.$inject = ['$location', 'authService', 'dataService', 'commonService', 'navService', 'sdErrorLoggerService'];

    function drillPipesController($location, authService, dataService, commonService, navService, sdErrorLoggerService) {
        /* jshint validthis:true */
        var vm = this;
      
        activate();

        function activate() {
            if (navService.inPrivate()) commonService.changePath('/noapp');
            navService.setActiveNav($location.$$path);
        }
    }
})();
