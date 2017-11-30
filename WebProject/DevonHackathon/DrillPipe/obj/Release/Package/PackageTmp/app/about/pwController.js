(function () {
    'use strict';

    angular
        .module('app')
        .controller('pwController', pwController);

    pwController.$inject = ['$uibModalInstance'];

    function pwController($uibModalInstance) {
        /* jshint validthis:true */
        var vm = this;
        vm.pw = null;
        vm.ok = ok;
        vm.cancel = cancel;

        function ok() {
            $uibModalInstance.close(vm.pw);
        }

        function cancel() {
            $uibModalInstance.dismiss('cancel');
        }
    }
})();
