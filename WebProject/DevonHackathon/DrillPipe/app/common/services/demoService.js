(function () {
    'use strict';

    angular
        .module('app')
        .factory('demoService', demoService);

    demoService.$inject = ['$http', '$q', '$uibModal', 'actionService', 'aliasService'];

    function demoService($http, $q, $uibModal, actionService, aliasService) {
        var actionController = 'demo',
            pipeId = 0,
            service = {
                createPipeSelection: createPipeSelection,
                createPipeLengths: createPipeLengths,
                deleteArduino:deleteArduino,
                getWells: getWells,
                getAll: getAll,
                getData: getData,
                getDemo: getDemo,
                getMeasurement: getMeasurement,
                getPresets: getPresets,
                getUser: getUser,
                setView: setView,
                setId: setId,
                getId: getId
            };

            return service;
            function deleteArduino() {
                return actionService.getAction(actionController, "DeleteArduino");
            }

        function getAll() {
            return actionService.getAction(actionController, "GetAll");
        }

        function createPipeSelection(pipeSelection) {
            return actionService.postObjectAction(actionController, "CreatePipeSelection", { pipeSelection: pipeSelection });
        }

        function createPipeLengths(pipeLengths) {
            return actionService.postObjectAction(actionController, "CreatePipeLengths", { pipeLengths: pipeLengths });
        }

        function getWells() {
            return actionService.getAction(actionController, "GetWells");
        }

        function getData() {
            return actionService.getAction(actionController, "GetData");
        }

        function getDemo() {
            return actionService.getByObjectAction(actionController, "GetDemo", { alias: aliasService.getAlias() });
        }

        function getMeasurement() {
            return actionService.getAction(actionController, "GetMeasurement");
        }

        function getPresets() {
            return actionService.getAction(actionController, "GetPresets");
        }

        function getUser() {
            return actionService.getByObjectAction(actionController, "GetUser", { alias: aliasService.getAlias() });
        }

        function setView(user) {
            aliasService.setAlias(user);
        }

        function setId(id) {
            pipeId = id;
        }

        function getId() {
            return pipeId;
        }
    }
})();
