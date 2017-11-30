(function () {
    'use strict';

    angular
        .module('app')
        .controller('pipeSelectionController', pipeSelectionController);

    pipeSelectionController.$inject = ['$location', 'authService', 'demoService', 'dataService', 'commonService', 'navService', 'sdErrorLoggerService'];

    function pipeSelectionController($location, authService, demoService, dataService, commonService, navService, sdErrorLoggerService) {
        /* jshint validthis:true */
        var vm = this;
        vm.pipe = {};

        vm.all = [];

        vm.popWellData = function () {
            //console.log(JSON.parse(vm.well));
            vm.pipe = JSON.parse(vm.well);
            vm.well = vm.pipe;
            //console.log(vm.pipe);
        };

        vm.setPipe = function () {
            vm.pipe = JSON.parse(vm.pipechoice);
            console.log(vm.pipe);
        };

        vm.tally = function () {
            vm.pipe.THREADLEN = 3.89;
            vm.pipe.WN = vm.well.WN;
            vm.pipe.CC = vm.well.CC;
            vm.pipe.AFE = vm.well.AFE;
            demoService.createPipeSelection(vm.pipe)
                .then(function (s) {
                    demoService.setId(s.ID);
                    commonService.changePath('/pipeLength')
                }, function (e) {
                    console.log(e);
                });
        };

        activate();

        function activate() {
            vm.options = {
                od: ['2.375','2.875','3.500','4.000','4.500','5.000','5.500','6.625','7.000','7.625']
                , ww: ['10.50#/0.224','11.60#/0.250','12.60#/0.271','13.50#/0.290','15.10#/0.337','17.00#/0.380','17.70#/0.380','18.90#/0.430','21.50#/0.500','23.70#/0.560']
                , grade: ['N80','L80','L80 13 CR','C90','R95','T95','P110','Q125','VM 80 13CR','VM 80 HC']
                , con: ['VAM 21','VAM TOP TUBING','VAM SLIJ-II','VAM HTTC','VAM FJL']
                , opt: ['Regular','SC80','SC90']
                , drift: ['Alt Drift','API Drift','Special Drift']
                , wt: ['87.50%']
                , desc: ['CASING JOINTS', 'DRILLING STRING','FLOAT COLLAR','PRODUCTION STRING','PUP JOINT','SHOE','TOE SLEEVE']
            };

            demoService.getAll()
                .then(function(data) {
                        vm.all = data;
                    },
                    function(e) {
                        console.log(e);
                    });

            demoService.getWells()
                .then(function(s) {
                        vm.wells = s;
                    },
                    function(e) {
                        console.log(e);
                });
            demoService.getPresets()
                .then(function (s) {
                    vm.pipes = s;
                }, function (e) {
                    console.log(e);
                });
        }
    }
})();
