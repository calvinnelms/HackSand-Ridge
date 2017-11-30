(function () {
    'use strict';

    angular
        .module('app')
        .factory('commonService', commonService);

    commonService.$inject = ['$location', '$uibModal', 'configService'];

    function commonService($location, $uibModal, configService) {
        var service = {
            changePath: changePath,
            getHtmlLineBreaks: getHtmlLineBreaks,
            showMessage: showMessage,
            getHeaderValue: getHeaderValue,
            reload: reload
        };

        return service;

        function changePath(hash) {
            $location.path(hash);
        }
        function getHtmlLineBreaks(val) {
            if (val) {
                return val.replace(/(\r\n|\n|\r)/g, '<br />');
            } else {
                return val;
            }
        }
        function showMessage(options) {
            options = options ? options : {};
            /*
            in addition to the 'size' and 'backdrop' options used on the $uibModal.open() method, other options available within modal:

                closeButtonText: {string} default to 'Close'
                actionButtonText: {string} default to 'OK'
                headerText: {string} default to 'App Alert'
                bodyText: {string} default to 'App Message'
                showOK: {boolean} default to true
                showClose: {boolean} default to true

             */
            return $uibModal.open({
                templateUrl: 'app/common/controllers/modal.html',
                controller: 'modalController',
                controllerAs: 'ctrl',
                size: options.size && ['sm', 'lg'].indexOf(options.size) >= 0 ? options.size :
                    'sm',
                backdrop: options.backdrop !== undefined && options.backdrop !== '' ?
                    options.backdrop : true,
                resolve: {
                     customModalOptions: function () {
                         return options;
                     }
                 }
            }).result;
        }
        function getHeaderValue(headers, key) {
            if (headers && headers.length > 0 && key) {
                return Enumerable
                        .From(headers)
                        .Where(function (x) {
                            return x.name === key;
                        })
                        .Select(function (x) {
                            return x.value;
                        })
                        .FirstOrDefault('');
            } else {
                return '';
            }
        }
        function reload(params) {
            var path = window.location.pathname;
            var url = window.location.protocol + '//' + window.location.host + path.substring(0, path.lastIndexOf('/')) + configService.appInfo.localServerRedirect + (configService.appInfo.localServerRedirect.indexOf('?') > 0 ? '&' : '?') + '_=' + new Date().getTime();
            if (params && params.length && params.length > 0) {
                url += Enumerable
                    .From(params)
                    .Select(function (x) {
                        return '&' + x.name + '=' + x.value;
                    })
                    .ToArray()
                    .join('');
            }
            window.location.href = url;
        }
    }
})();
