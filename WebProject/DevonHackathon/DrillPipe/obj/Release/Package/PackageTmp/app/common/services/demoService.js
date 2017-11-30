(function () {
    'use strict';

    angular
        .module('app')
        .factory('demoService', demoService);

    demoService.$inject = ['$http', '$q', '$uibModal', 'actionService', 'aliasService'];

    function demoService($http, $q, $uibModal, actionService, aliasService) {
        var actionController = 'demo',
            service = {
                getData: getData,
                getDemo: getDemo,
                getUser: getUser,
                sendEmail: sendEmail,
                setView: setView
            };

        return service;

        function getData() {
            return ActionService.getAction(actionController, "GetData");
        }

        function getDemo() {
            return ActionService.getByObjectAction(actionController, "GetDemo", { alias: aliasService.getAlias() });
        }

        function getUser() {
            return ActionService.getByObjectAction(actionController, "GetUser", { alias: aliasService.getAlias() });
        }

        function setView(user) {
            aliasService.setAlias(user);
        }
    }
})();
