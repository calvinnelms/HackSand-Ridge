(function () {
    'use strict';

    angular
        .module('app')
        .controller('modalController', modalController);

    modalController.$inject = ["$uibModalInstance", "customModalOptions"];

    function modalController($uibModalInstance, customModalOptions) {
        /* jshint validthis:true */
        var vm = this,
            defaultModalOptions = {
                closeButtonText: 'Close',
                actionButtonText: 'OK',
                headerText: 'App Alert',
                bodyText: 'App Message',
                showOK: true,
                showClose: true
            };

        vm.modalOptions = {};

        angular.extend(vm.modalOptions, defaultModalOptions, customModalOptions);

        //vm.data = data;

        vm.ok = function () {
            $uibModalInstance.close();
        };

        vm.cancel = function () {
            $uibModalInstance.dismiss('cancel');
        };
    }
})();
