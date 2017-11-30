(function () {
    'use strict';

    angular
        .module('app')
        .controller('footerController', footerController);

    footerController.$inject = ['configService'];

    function footerController(configService) {
        /* jshint validthis:true */
        var vm = this;
        vm.version = configService.appInfo.version;

        activate();

        function activate() { }
    }
})();
