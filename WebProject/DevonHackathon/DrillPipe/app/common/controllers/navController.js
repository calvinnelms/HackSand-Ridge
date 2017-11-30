(function () {
    'use strict';

    angular
        .module('app')
        .controller('navController', navController);

    navController.$inject = ["$scope", "aliasService", "authService", "commonService", "dataWorkerService", "geoLocationService", "navService"];

    function navController($scope, aliasService, authService, commonService, dataWorkerService, geoLocationService, navService) {
        /* jshint validthis:true */
        var vm = this;
        vm.activeNav = navService.activeNav;
        vm.inPrivate = navService.inPrivate;
        vm.changePath = changePath;
        vm.changeView = changeView;
        vm.showOptionalNav = showOptionalNav;
        vm.changeOptionalNav = changeOptionalNav;
        vm.runAs = '';

        isAdmin();

        function changePath(path) {
            //check for active controller utilizing DataWorkerService to ensure a cleanup
            try {
                switch (vm.activeNav()) { //list all controllers using DataWorkerService - e.g. case 'somepath': case 'someotherpath':
                    case 'offline': 
                        dataWorkerService.cleanup().then(navigate(path), cleanupError);
                        break;
                    case 'geo': 
                        geoLocationService.clearWatch().then(navigate(path), cleanupError);
                        break;
                    default:
                        navigate(path);
                }
            } catch (e) {
                navigate(path);
            }
        }

        function navigate(path) {
            commonService.changePath('/' + path);
        }

        function cleanupError(e) {
            commonService.showMessage({
                headerText: 'Error',
                bodyText: (e.message ? e.message : e),
                showClose: false
            });
        }

        function isAdmin() {
            authService.getUser()
            .then(function (data) {
                if (data &&
                    data.IsAdmin !== null &&
                    data.IsAdmin &&
                    data.AdminLink !== undefined &&
                    data.AdminLink !== '') {
                    vm.adminLink = data.AdminLink;
                    vm.isAdmin = data.IsAdmin;
                    if (data.AdminOption !== '') {
                        vm.other = data.AdminOption;
                    }
                } else {
                    vm.isAdmin = false;
                }
            });
        }

        function changeView () {
            authService.setUser(vm.runAs);
            vm.runAs = aliasService.getAlias();

            isAdmin();

            changePath('~'); //non-existant path to force refresh
            //.then(function () {
            //    vm.runAs = '';
            //    changePath('~'); //non-existant path to force refresh
            //});
        }

        //***Optional Navigation Buttons**
        //Method #1: Static, based on list of routes provided from within the template
        function showOptionalNav(paths) {    //check the array of nav paths
            if (paths && paths.length && paths.length > 0) {
                for (var i = 0; i < paths.length; i++) {
                    if (navService.activeNav() === paths[i]) {
                        return true;
                    }
                }
            }
            return false;
        }

        //Method #2: Dynamic, based on outside criteria (via NavService)
        $scope.$watch(
            function watchOptionalNav() {  //watcher
                return navService.getOptionalNav();
            },
            function handleOptionalNavChange(newVal) {  //change handler
                vm.optionalNav = newVal;
            },
            true
        );
        //demo method
        function changeOptionalNav() {
            //this call ideally would be placed in a controller where optional nav is needed
            navService.setOptionalNav(!vm.optionalNav); //just flips visibility for demo purposes
        }
    }
})();
