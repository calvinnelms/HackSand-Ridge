(function () {
    'use strict';

    angular.module('app', [
        // Angular modules
        //'ngAnimate',
        'ngRoute',
        'ngSanitize',

        // Custom modules

        // 3rd Party Modules
        'ui.bootstrap',
        'ui.validate',
        'ngMessages',
        //'ngFileUpload',
        'ui.grid',
        'ui.grid.selection',
        'ui.grid.pagination',
        'ui.grid.autoResize'
    ])
    .config(init)
    .factory('configService', configService);

    init.$inject = ['$httpProvider', '$routeProvider'];//, '$locationProvider'];

    function init($httpProvider, $routeProvider){//, $locationProvider) {
        if (!$httpProvider.defaults.headers.get) {
            $httpProvider.defaults.headers.get = {};
        }

        $httpProvider.defaults.headers.get['Cache-Control'] = 'no-cache';
        $httpProvider.defaults.headers.get['Pragma'] = 'no-cache';

        $routeProvider
        .when('/', {
            controller: 'pipeSelectionController',
            templateUrl: 'app/pipeSelection/pipeSelection.html',
            controllerAs: 'ctrl'
        })
        .when('/admin', {
            controller: 'adminController',
            templateUrl: 'app/admin/admin.html',
            controllerAs: 'ctrl'
        })
        .when('/pipeSelection', {
            controller: 'pipeSelectionController',
            templateUrl: 'app/pipeSelection/pipeSelection.html',
            controllerAs: 'ctrl'
            })
            .when('/pipeLength', {
                controller: 'pipeLengthController',
                templateUrl: 'app/pipeLength/pipeLength.html',
                controllerAs: 'ctrl'
            })
        .when('/about', {
            controller: 'aboutController',
            templateUrl: 'app/about/about.html',
            controllerAs: 'ctrl'
        })
        .when('/noapp', {
            controller: 'noAppController',
            templateUrl: 'app/common/controllers/noapp.html',
            controllerAs: 'ctrl'
        })
        .otherwise({
            redirectTo: '/'
        });
    }

    function configService() {
        if (!location.origin)
            location.origin = location.protocol + "//" + location.host;

        //https://github.com/angular-ui/bootstrap/issues/1812
        if (navigator.userAgent.match(/iPhone|iPad|iPod/i)) {
            var styleEl = document.createElement('style'), styleSheet;
            document.head.appendChild(styleEl);
            styleSheet = styleEl.sheet;
            styleSheet.insertRule(".modal { position:absolute; bottom:auto; }", 0);
        }

        var appPingObject = 'test.ico',
            proxyPingObject = getPathToPing(appPingObject);
        var service = {
            appInfo: {
                //***do not remove the "beginversion" and "endversion" comments below as they are used by the gulp process***
                //beginversion
                version: '20171129 v0.06'
                //endversion
                , onlineURL: appPingObject  //if app is *NOT* using a proxy server for authentication, supply local "ping" object's URL
                //****if app is using a proxy server for authentication (F5), use these config settings****
                //, onlineURL: proxyPingObject  //proxy's "ping" object URL
                //, validationURL: appPingObject  //supply only if app is using proxy server for authentication (F5)
                //, autoReload: true              //true || false -- automatically reload the page (from DataService.js) when authentication is lost
                //*****************************************************************************************
                , localServerRedirect: '/demo/redirect'
            },
            templateInfo: {
                version: '2.1',  //see README.TXT for change log
                lastUpdated: '11/14/2016',
                additionalInfo: ''
            },
            errorLogger: {
                baseURL: 'http://deverrorlogger.sandridgeenergy.com',
                version: '1.2',
                application: 'Demo Template',
                localServerPost: 'demo/errorlogger'
            },//, emailAddress: 'user@sandridgeenergy.com'
            dataWorker: {
                path: 'Scripts/WebWorker/dataworker.js',
                onlineURL: '../../' + appPingObject,  //if app is *NOT* using a proxy server for authentication, supply local "ping" object's URL relative to dataworker script file
                //****if app is using a proxy server for authentication (F5), use these config settings****
                //onlineURL: proxyPingObject,  //proxy's "ping" object URL
                //validationURL: '../../' + appPingObject,   //local "ping" object's URL relative to dataworker script file
                //*****************************************************************************************
                onlineTimeout: 5000
                //, hide: {}    //default key
                //, hide: {key: "test"} //hard-coded key
                //, hide: {URL: "demo/getkey"}  //server call to retrieve key -- relative to DataWorkerService
            },
            baseUrl: location.origin // "http://localhost:63136"
        };

        function getPathToPing(appPingObject) {
            if (window.location.protocol === 'https:') {
                return 'https://' + window.location.host + ':4443';
            }
            else {
                return '../../' + appPingObject;
            }
        }
        return service;
    }
})();
