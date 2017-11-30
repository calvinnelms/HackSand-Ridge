(function () {
    'use strict';

    angular
        .module('app')
        .factory('navService', navService);

    navService.$inject = [];

    function navService() {
        var activeNav = '',
            showOptionalNav = true,
            inPrivate = false;
        var service = {
            activeNav: getActiveNav,
            setActiveNav: setActiveNav,
            getOptionalNav: getOptionalNav,
            setOptionalNav: setOptionalNav,
            inPrivate: getInPrivate,
            setInPrivate: setInPrivate
        };

        return service;

        function getActiveNav() {
            return activeNav.toLowerCase();
        }

        function setActiveNav(path) {
            var cleanPath = path.split("/");

            path = (cleanPath && cleanPath.length && cleanPath.length > 1 && cleanPath[0] === "" ? cleanPath[1] : "");
            if (path || path === "") {  //set active nav
                activeNav = path;
            }
        }

        function getOptionalNav() {
            return showOptionalNav;
        }

        function setOptionalNav(showNav) {
            showOptionalNav = showNav;
        }

        function getInPrivate() {
            return inPrivate;
        }

        function setInPrivate() {
            inPrivate = true;
        }
    }
})();