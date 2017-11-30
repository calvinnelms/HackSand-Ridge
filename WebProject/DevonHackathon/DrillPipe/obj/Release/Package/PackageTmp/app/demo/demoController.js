(function () {
    'use strict';

    angular
        .module('app')
        .controller('demoController', demoController);

    demoController.$inject = ['$location', 'authService', 'dataService', 'commonService', 'navService', 'sdErrorLoggerService'];

    function demoController($location, authService, dataService, commonService, navService, sdErrorLoggerService) {
        /* jshint validthis:true */
        var vm = this;
      
        activate();

        function activate() {
            if (navService.inPrivate()) commonService.changePath('/noapp');
            navService.setActiveNav($location.$$path);
        }
    }
})();
