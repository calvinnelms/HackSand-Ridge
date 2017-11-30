(function () {
    'use strict';

    angular
        .module('app')
        .controller('pipeLengthController', pipeLengthController);

    pipeLengthController.$inject = ['$location', 'authService', 'dataService', 'commonService', 'navService', 'sdErrorLoggerService', 'demoService'];

    function pipeLengthController($location, authService, dataService, commonService, navService, sdErrorLoggerService, demoService) {
        /* jshint validthis:true */
        var vm = this;
        var flag = false;
        var run = 1;
        var myMeasurement;

        vm.rows = [];
        vm.row = {
            RUN: run
        };

        vm.UNITS = 'feet';
      
        activate();

        function activate() {
            myMeasurement = setInterval(getMeasurement, 1000);
        }

        function getMeasurement() {
            demoService.getMeasurement()
                .then(function (s) {
                    if (vm.row.LENGTH && vm.row.LENGTH > 0) { }
                    else {
                        if (s === 0) { vm.row.LENGTH = undefined; }
                        else { vm.row.LENGTH = s;}
                    }
                }, function (e) {
                    console.log(e);
                });
        }

        vm.addRow = function () {
            vm.row.ID = vm.rows.length;
            vm.row.PIPEID = demoService.getId();
            vm.row.UNITS = vm.UNITS;
            if (flag === false) {
                vm.row.RUN = run;
                vm.rows.push(vm.row);
                run += 1;
            }

            vm.row = {RUN:run};
            flag = false;
            var length = window.document.getElementById('length');
            length.focus();
            demoService.deleteArduino();
        };

        vm.editRow = function (id) {
            flag = true;
            var row = Enumerable.From(vm.rows)
                .Where(function (x) {
                    if (x.ID === id) {
                        return x;
                    }
                })
                .SingleOrDefault();

            if (row) {
                vm.row = row;
            }
        };

        vm.save = function () {
            demoService.createPipeLengths(vm.rows)
                .then(function (s) {
                    commonService.showMessage({ headerText: 'Lengths Saved', bodyText: 'Pipe data saved' });
                    commonService.changePath('/pipeSelection');
                });
        };

        vm.downloadCSV = function() {
            commonService.showMessage({ headerText: 'CSV File', bodyText: 'Downloading CSV File...' });
            const rows = vm.rows;
            var csvContent = '';//"data:text/csv;charset=utf-8,";
            for (var c = 0; c < rows.length; c++) {
                csvContent += JSON.stringify(rows[c]) + '\r\n';
            }
            //rows.forEach(function (rowArray) {
            //    let row = rowArray.join(",");
            //    csvContent += row + '\r\n';
            //});
            var encodedUri = encodeURI(csvContent);
            var link = document.createElement('a');
            link.setAttribute('href', encodedUri);
            link.setAttribute('download', 'tally_data.csv');
            link.setAttribute('target', '_blank');
            document.body.appendChild(link);

            if (navigator.msSaveBlob) { // IE 10+ 
                navigator.msSaveBlob(new Blob([csvContent], { type: 'text/csv;charset=utf-8;' }), "filename.csv");
            }

            link.click();
        }

        vm.mailCSV = function() {
            commonService.showMessage({ headerText: 'CSV File', bodyText: 'Mailing CSV File...' });
        }

    }
})();
