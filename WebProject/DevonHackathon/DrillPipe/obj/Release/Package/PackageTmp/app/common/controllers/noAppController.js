(function () {
    'use strict';

    angular
        .module('app')
        .controller('noAppController', noAppController);

    noAppController.$inject = ['$uibModalStack', 'commonService', 'navService'];

    function noAppController($uibModalStack, commonService, navService ) {
        /* jshint validthis:true */
        activate();

        function activate() {
            navService.setInPrivate();
            $uibModalStack.dismissAll();    //clears any open modals
            commonService.showMessage({
                headerText: 'Private Mode Detected',
                bodyText: 'This application does not support running in Private/Incognito mode.  Please close this private browsing session and open a regular browsing session.',
                showClose: false,
                showOK: false,
                backdrop: false
            });
        }
    }
})();
