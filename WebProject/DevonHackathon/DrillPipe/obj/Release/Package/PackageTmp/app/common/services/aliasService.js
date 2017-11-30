(function () {
    'use strict';

    angular
        .module('app')
        .factory('aliasService', aliasService);

    function aliasService() {
        var _Alias = "",
            service = {
                getAlias: getAlias,
                setAlias: setAlias
            };

        return service;

        function getAlias() {
            return _Alias;
        }

        function setAlias(alias) {
            _Alias = alias;
        }
    }
})();
