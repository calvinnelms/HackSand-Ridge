(function () {
    'use strict';

    angular
        .module('app')
        .controller('adminController', adminController);

    adminController.$inject = ['$location', 'authService', 'commonService', 'dataService', 'navService'];

    function adminController($location, authService, commonService, dataService, navService) {
        /* jshint validthis:true */
        var vm = this;
        var title = 'Welcome to the AdminController';
        vm.user = null;

        activate();

        function activate() {
            if (navService.inPrivate()) {
                commonService.changePath('/noapp');
            }

            authService.getUser()
                .then(function (data) {
                    if (!data || data.IsAdmin === null || !data.IsAdmin || !data.AdminLink || data.AdminLink === '') {
                        commonService.changePath('');
                    } else {
                        if (navService.inPrivate()) commonService.changePath('/noapp');
                        navService.setActiveNav($location.$$path);

                        vm.title = title;
                        vm.user = data.UserInfo;

                        vm.isAdmin = data.IsAdmin;

                        
                    }
                },
                function () {
                    commonService.changePath('');
                });
        }
    }
})();
