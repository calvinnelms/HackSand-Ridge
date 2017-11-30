(function () {
    'use strict';

    angular
        .module('app')
        .factory('dataWorkerService', dataWorkerService);

    dataWorkerService.$inject = ["$http", "$q", "configService", "sdErrorLoggerService", "securityService"];

    function dataWorkerService($http, $q, configService, sdErrorLoggerService, securityService) {

        var database
            , dw
            , errorloggerNotify
            //, dataReadyEventHandler
            , hide = false;//,
            //_obfuscationKey;   //errorloggerAppName,

        window.addEventListener('online', notifyOnline, false);  //callback for browser indication of online
        window.addEventListener('offline', notifyOnline, false); //callback for browser indication of offline

        //public facing methods for this service (see public function section below)
        var service = {
            getLocalData: getLocalData,
            addLocalData: addLocalData,
            editLocalData: editLocalData,
            syncLocalData: syncLocalData,
            getServerData: getServerData,
            addServerData: addServerData,
            init: init,
            cleanup: cleanup,
            getRecordCount: getRecordCount
        };

        return service; //return an instance of this service

        //*************public functions*************

        //call addLocalData passing the configured dataset name and data to be added to
        //save in the respective localStorage object
        function addLocalData(dataset, data) {
            return $q(function (resolve, reject) {
                try {
                    if (dataset && data) {
                        var existingData = getLocalStorageData(dataset);
                        var obj = [];
                        if (existingData) {
                            obj = JSON.parse(existingData);   //get a native js array of objects (if any already exist)
                            obj.push(data);                                 //add to the array
                            setLocalStorageData(dataset,
                                JSON.stringify(obj));   //parse array of objects back to a string and overwrite previous value
                        }
                        resolve(obj);                                      //return resolved promise
                    } else {
                        throw new Error('\'dataset\' and \'data\' parameters must be supplied');  //throw error indicating both parameters needed
                    }
                } catch (e) {
                    reject(e);                                      //something happened; reject promise with the caught exception
                }
            });
        }

        //call editLocalData passing the configured dataset name, data to be updated and data's index
        //to save in the respective localStorage object; returns the native js array of objects
        function editLocalData(dataset, data, idx) {
            return $q(function (resolve, reject) {
                try {
                    if (dataset && data && idx) {
                        updateLocalStorage({ tableName: dataset, extra: { idx: idx, updatedData: data } });
                        getLocalData(dataset)
                        .then(function (data) {
                            resolve(data);
                        }, function (e) {
                            reject(e);                              //something happened; reject promise with the caught exception
                        });
                    } else {
                        throw new Error('\'dataset\', \'data\' and \'idx\' parameters must be supplied');  //throw error indicating all parameters needed
                    }
                } catch (e) {
                    reject(e);                                      //something happened; reject promise with the caught exception
                }
            });
        }

        //call getLocalData passing the configured dataset name to return the
        //native js array of objects
        function getLocalData(dataset) {
            return $q(function (resolve, reject) {
                try {
                    if (dataset) {
                        var data = getLocalStorageData(dataset);
                        if (data) {
                            resolve(JSON.parse(data)); //return resolved promise passing the native js array of objects
                        } else {
                            resolve(null);
                        }
                    } else {
                        throw new Error('\'dataset\' parameter must be supplied'); //return a rejected promise indicating the necessary parameter
                    }
                } catch (e) {
                    reject(e);                                      //something happened; reject promise with the caught exception
                }
            });
        }

        //call syncLocalData passing two configured dataset names ("from" and "to");
        //fromDataset should represent the local 'cache' of unsynchronized data that should be posted to the server for permanent storage
        //toDataset should represent the local data which represents the data stored on the server
        function syncLocalData(fromDataset, toDataset) {
            return $q(function (resolve, reject) {
                try {
                    if (fromDataset && toDataset) {
                        var data = JSON.parse(getLocalStorageData(fromDataset));    //get a native js array of objects
                        if (data && data.length && data.length > 0) {       //ensure the array is valid and has data
                            dw.postMessage({                        //post only the first record in the array
                                tableName: fromDataset,
                                action: 'post',
                                data: data[0],
                                extra: {idx: 0, loop: true, toDataset: toDataset}   //this object indicates:
                                //1) the index of the item being posted;
                                //2) a boolean to force a looping mechanism, grabbing one array object at a time
                                //3) preservation of the 'toDataset' object for use after the loop is complete (see function getServerData)
                            });
                        } else {
                            getServerData(toDataset);                      //no data exists locally; grab the latest data from the server
                        }
                        resolve();                                          //return a resolved promise
                    } else {
                        throw new Error('\'fromDataset\' and \'toDataset\' parameters must be ' +
                            'supplied');  //return a rejected promise indicating both parameters are needed
                    }
                } catch (e) {
                    reject(e);                                              //something happened; reject promise with the caught exception
                }
            });
        }

        //call getServerData passing the configured dataset name to return data from the server associated with that dataset
        function getServerData(dataset) {
            return $q(function (resolve, reject) {
                try {
                    if (dataset) {
                        dw.postMessage({   //post a 'get' message to retrieve information from the server associated with this dataset
                            tableName: dataset,
                            returnArr: true
                        });
                        resolve();                                                          //return a resolved promise
                    } else {
                        throw new Error('\'dataset\' parameter must be supplied');  //return a rejected promise indicating the necessary parameter
                    }
                } catch (e) {
                    reject(e);                                      //something happened; reject promise with the caught exception
                }
            });
        }

        //call addServerData passing in a full configuration containing:
        //1) dataset associated with the server action
        //2) the action ('post' or 'get')
        //3) data to send to the server (optional) -- default to null if not supplied
        function addServerData(config) {
            return $q(function (resolve, reject) {
                try {
                    if (config && config.dataset !== undefined && config.action !== undefined) {
                        dw.postMessage({   //post a message to server for given dataset with given action, including data element (if defined)
                            tableName: config.dataset,
                            action: config.action,
                            data: (config.data ? config.data : null)
                        });
                        resolve();                                                      //return a resolved promise
                    } else {
                        throw new Error('\'config\' object must contain both the \'dataset\' ' +
                            'and \'action\' properties');  //return a rejected promise indicating the two necessary parameters of the 'config' object
                    }
                } catch (e) {
                    reject(e);                                      //something happened; reject promise with the caught exception
                }
            });
        }

        //call init with all the configuration items necessary to run the data worker
        function init(config) {
            return $q(function (resolve, reject) {
                try {
                    //ensure the required config items are present
                    if (!config) {
                        throw new Error('No configuration supplied');
                    }
                    if (config.datasets === undefined || config.datasets.length <= 0) {
                        throw new Error('At least one dataset in \'datasets\' array ' +
                            'configuration is required');
                    }
                    if (!configService.dataWorker || configService.dataWorker.onlineURL ===
                        undefined || configService.dataWorker.onlineURL === '') {
                        throw new Error('\'onlineURL\' configuration not supplied');
                    } else {
                        config.onlineURL = configService.dataWorker.onlineURL;
                    }
                    if (!configService.dataWorker || configService.dataWorker.validationURL ===
                        undefined || configService.dataWorker.validationURL === '') {
                        config.validationURL = null;
                    } else {
                        config.validationURL = configService.dataWorker.validationURL;
                    }
                    if (!configService.dataWorker || configService.dataWorker.path ===
                        undefined || configService.dataWorker.path === '') {
                        throw new Error('\'dataWorker.path\' configuration not supplied');
                    } else {
                        config.dataWorkerPath = configService.dataWorker.path;
                    }

                    if (config.errorloggerNotify) { //will override base config for sdErrorLoggerService
                        errorloggerNotify = config.errorloggerNotify;
                    }
                    if (config.refresh && config.refresh.interval &&
                        (isNaN(config.refresh.interval) || config.refresh.interval < 1000)) {
                        config.refresh.interval = 10000;    //default to 10 seconds
                    }
                    if (!configService.dataWorker || configService.dataWorker.onlineTimeout ===
                        undefined || isNaN(configService.dataWorker.onlineTimeout) ||
                        configService.dataWorker.onlineTimeout < 1000) {
                        config.onlineTimeout = 5000;    //default to 5 seconds
                    } else {
                        config.onlineTimeout = configService.dataWorker.onlineTimeout;
                    }
                    if (configService.dataWorker && configService.dataWorker.hide !== undefined &&
                        configService.dataWorker.hide) {
                        config.hide = configService.dataWorker.hide;
                    }
                    if (config.hide) {
                        hide = true;
                        if (config.hide.URL) {
                            getServerKey(config.hide.URL, config.onlineTimeout)
                            .then(function () { setupWorker(config); });
                        } else {
                            securityService.setKey(config.hide.key);    //initialize the key -- if config.hide.key is defined, use it, otherwise use defeault
                            setupWorker(config);
                        }
                    } else {
                        setupWorker(config);
                    }
                    resolve();
                } catch (e) {
                    reject(e);                                      //something happened; reject promise with the caught exception
                }
            });
        }
        //call cleanup to terminate the running data worker
        function cleanup() {
            return $q(function (resolve, reject) {
                try {
                    dw.terminate();
                    resolve();                                      //return a resolved promise
                } catch (e) {
                    reject(e);                                      //something happened; reject promise with the caught exception
                }
            });
        }

        //call getRecordCount passing the configured dataset name to return the number of records associated with that dataset;
        //ex. determine if unsynchronized data exists locally
        function getRecordCount(dataset) {
            return $q(function (resolve, reject) {
                try {
                    if (dataset && localStorage[dataset]) {
                        var data = JSON.parse(localStorage[dataset]);   //get a native js array of objects
                        if (data && data.length !== undefined) {
                            resolve(data.length);                       //if data exists in the array return the length of the array
                        } else {
                            throw new Error('no valid data was found for ' + dataset);
                        }
                    } else {
                        throw new Error('valid \'dataset\' parameter must be defined');
                    }
                } catch (e) {
                    reject(e);                                      //something happened; reject promise with the caught exception
                }
            });
        }

        //*************private functions*************

        //handler for worker errors
        function workerOnError(e) {
            logError({
                Message: (e.message ? e.message : e),
                AdditionalInformation: 'WorkerOnError'
            });
        }

        //handler for browser online/offline notifications
        function notifyOnline() {
            if (dw) {
                dw.postMessage({ online: navigator.onLine });
            }
        }

        //handler for worker messages
        function workerOnMessage(message) {
            var m = message.data;
            if (m.err) {
                logError({
                    Message: m.err, AdditionalInformation: 'WorkerOnMessage -- worker reported ' +
                        'error'
                });
            } else if (m.info) {    //implement in dataworker for debug purposes only -- still needed???
                console.log('worker info: ' + m.info);
            } else if (m.tableName) {
                if (m.extra && m.extra.loop !== undefined && m.extra.loop) {    //looping through local data
                    if ((m.offline === undefined || !m.offline) && (m.revalidate === undefined || !m.revalidate)) { //online and validated so continue loop
                        updateLocalStorage(m);
                    } else {
                        handleDatatset(m);                                      //offline or need revalidation so check for returned data and a callback
                    }
                } else {                                                        //a normal call -- check for returned data and a callback
                    handleDatatset(m);
                }
            } else if (m.event) {   //by default the dataworker only implements the "dataready" event
                SD.Client.RaiseCustomEvent(document,
                    SD.Client.CreateCustomEvent(document, m.event));
                if (m.event.indexOf('dataready') >= 0) {//this is only needed once, so remove it
                    document.removeEventListener(m.event, getEventHandler(m.event), false);
                }
            } else {                                                            //message posted by worker unrecognized -- log it
                logError({
                    Message: 'invalid worker-posted message: ' + m,
                    AdditionalInformation: 'WorkerOnMessage'
                });
            }
        }

        //helper function for logging client-side errors
        function logError(sdError) {
            if (sdError) {
                if (errorloggerNotify) {
                    sdError.Notify = true;
                    sdError.EmailAddress = errorloggerNotify;
                }
                if (sdErrorLoggerService) {
                    sdErrorLoggerService.LogError({sdError: sdError});
                } else {
                    window.alert('Add a reference to the sdErrorLoggerService script to implement ' +
                        'client-side error logging');
                }
            }
        }

        //helper function for syncing local and server data
        function updateLocalStorage(m) {
            if (m.extra && m.extra.idx !== undefined) {
                var data = getLocalStorageData(m.tableName);   //get a native js array of objects
                if (data) {
                    data = JSON.parse(data);   //get a native js array of objects
                    if (m.extra.updatedData) {
                        if (data[m.extra.idx])
                            data[m.extra.idx] = m.extra.updatedData;    //update the item located at m.extra.idx
                    } else {
                        data.splice(m.extra.idx, 1);                    //remove the item located at m.extra.idx
                    }
                    setLocalStorageData(m.tableName, JSON.stringify(data));
                }
            }
            if (!m.extra.updatedData)
                syncLocalData(m.tableName, m.extra.toDataset);          //continue sync process
        }

        //helper function for handling data returned and/or callbacks associated with a dataset
        function handleDatatset(m) {
            for (var ds in database) {
                if (database.hasOwnProperty(ds)) {
                    if (database[ds].name === m.tableName) {
                        if (m.dataArr) { //data was returned -- store the data in localStorage
                            setLocalStorageData(m.tableName, JSON.stringify(m.dataArr));
                        }
                        if (database[ds].callback) { //there is a callback associated
                            database[ds].callback(m); //make the callback and pass the dataworker's message object
                        }
                        break;
                    }
                }
            }
        }

        function getLocalStorageSpaceVals(ds, newChars) {
            var utilized = ((decodeURIComponent(encodeURIComponent(JSON.stringify(localStorage))).length *
                16) / (8 * 1024) / 1024).toFixed(6),   //total MB currently in use
            dsLength = ((decodeURIComponent(encodeURIComponent(localStorage[ds])).length * 16) /
                (8 * 1024) / 1024).toFixed(6),                //total MB for selected key
            newLength = ((decodeURIComponent(encodeURIComponent(newChars)).length * 16) / (8 * 1024) /
                1024).toFixed(6);                      //total MB attempted to add
            return 'Current total utilized localStorage: ' + utilized + ' MB' +
                '<br />Current size of ' + ds + ': ' + dsLength + ' MB' +
                '<br />New data size: ' + newLength + ' MB';
            //var allStrings = '';
            //for (var key in window.localStorage) {
            //    if (window.localStorage.hasOwnProperty(key)) {
            //        allStrings += window.localStorage[key];
            //    }
            //}
            //return allStrings ? (3 + ((allStrings.length * 16) / (8 * 1024))).toFixed(2) + ' KB' : 'Empty (0 KB)';
        }

        //adds data to the given dataset, obfuscating if necessary
        function setLocalStorageData(dataset, data) {
            var e;
            try {
                var str, ds;
                if (hide) {
                    str = securityService.hideData(data);   //hide the data
                    ds = securityService.hideData(dataset);
                } else {
                    str = data;
                    ds = dataset;
                }

                try {   //attempt to store the data
                    localStorage.setItem(ds, str);
                } catch (e) {
                    if (e.name === 'QuotaExceededError') {  //no more room
                        logError({
                            Message: 'Local Storage Quota Exceeded',
                            AdditionalInformation: getLocalStorageSpaceVals(ds, str)
                        });
                    }
                }
            } catch (e) {
                throw new Error('data not saved in localStorage: ' + e);
            }
        }

        //returns data from the given dataset, deobfuscating if necessary
        function getLocalStorageData(dataset) {
            try {
                var str, ds;
                if (hide) {   //hiding data?
                    ds = securityService.hideData(dataset);    //retrieve hiden name
                } else {
                    ds = dataset;
                }
                if (securityService.isValidHiddenData(localStorage[ds])) {    //stored data hidden?
                    str = securityService.getHiddenData(localStorage[ds]);  //retrieve original data
                } else {
                    str = localStorage[ds];
                }
                return str;
            } catch (e) {
                return null;
            }
        }

        ////obfuscates the given string
        //function hideData(data) {
        //    return ('00' + _obfuscationKey.length.toString(16)).slice(-2) +
        //                keyRotate(_obfuscationKey,
        //                    window.location.hostname) +
        //                keyRotate(data.split('').reverse().join(''),
        //                    _obfuscationKey);
        //}

        ////deobfuscates the given string
        //function getHiddenData(data) {
        //    var keyLength = parseInt(data.substring(0, 2), 16),
        //        str = keyRotate(
        //                    data.substring(keyLength + 2),
        //                    keyRotate(data.substring(2, keyLength + 2),
        //                        window.location.hostname,
        //                        true),
        //                    true);
        //    return str.split('').reverse().join('');
        //}

        ////checks the "header" information for markers
        //function isValidHiddenData(data) {
        //    var isValid = false,
        //        keyLength;
        //    if (data.length > 3) {  //2 characters for the key length and at least one character for the key
        //        try {
        //            keyLength = parseInt(data.substring(0, 2), 16);
        //            if (!isNaN(keyLength) && data.length > keyLength + 2) {  //at least 1 character beyond the 2-digit hex value and key
        //                isValid = true;
        //            }
        //        } catch (e) {
        //            //
        //        }
        //    }
        //    return isValid;
        //}

        //function keyRotate(text, key, reverse) {
        //    // Surrogate pair limit
        //    var bound = 0x10000;
        //    // Create string from character codes
        //    return String.fromCharCode.apply(null,
        //        // Turn string to character codes
        //        text.split('').map(function (v, i) {
        //            // Get rotation from key
        //            var rotation = key[i % key.length].charCodeAt();

        //            // Are we decrypting?
        //            if (reverse) { rotation = -rotation; }

        //            // Return current character code + rotation
        //            return (v.charCodeAt() + rotation + bound) % bound;
        //        })
        //    );
        //}

        //private init helpers
        function setupWorker(config) {
            dw = new Worker(config.dataWorkerPath);        //init worker
            dw.onerror = workerOnError;                     //error callback
            dw.onmessage = workerOnMessage;                 //message callback

            var dataReadyListener = associateDataWorker(config.datasets);
            addDataSets(config.datasets);
            initLocalStorage(config.datasets);                      //ensure localStorage objects are in place

            postInitMessage({                                       //post the initialization message to the dataworker
                database: {tables: stripCallbacks(config.datasets)},
                refresh: (config.refresh ? config.refresh : null),
                onlineURL: config.onlineURL,
                onlineTimeout: config.onlineTimeout,
                validationURL: config.validationURL,
                dataReadyListener: dataReadyListener
            });
        }
        function associateDataWorker(datasets) {    //look for the dataready event and add the listener for it
            var foundCallback = false,
                dataReadyListener = '';

            for (var ds in datasets) {
                if (datasets.hasOwnProperty(ds)) {
                    if (!foundCallback && datasets[ds].dataReadyCallback
                    ) { //only associate the first callback if multiple are defined
                        foundCallback = true;
                        dataReadyListener = datasets[ds].name + 'dataready';
                        document.addEventListener(dataReadyListener,
                            datasets[ds].dataReadyCallback,
                            false); //add the event listener
                    }
                }
            }
            if (!foundCallback) {
                throw new Error('\'dataReadyCallback\' configuration not supplied in a dataset ' +
                    'configuration');
            }
            return dataReadyListener;
        }

        function getEventHandler(event) {   //find an return the event to raise for the caller
            var eventds = event.replace('dataready', '');
            for (var db in database) {
                if (database.hasOwnProperty(db)) {
                    if (database[db].name === eventds) {
                        return database[db].dataReadyCallback;
                    }
                }
            }
            return undefined;
        }

        function addDataSets(datasets) {    //add datasets to the database
            if (database && database.length !== undefined) {
                for (var ds in datasets) {
                    if (datasets.hasOwnProperty(ds)) {
                        var found = false;
                        for (var db in database) {
                            if (database.hasOwnProperty(db) && database[db].name === datasets[ds].name) {
                                database[db] = datasets[ds];
                                found = true;
                                break;
                            }
                        }
                        if (!found) {
                            database.push(datasets[ds]);    //add it to the database
                        }
                    }
                }
            } else {
                database = datasets;                    //whole database is new
            }
        }

        function stripCallbacks(datasets) {
            //remove any callback method information from dataworker's configured datasets -- not needed in dataworker
            var clean = angular.copy(datasets);
            for (var t in clean) {
                if (clean.hasOwnProperty(t)) {
                    clean[t].callback = null;
                    clean[t].dataReadyCallback = null;
                }
            }
            return clean;
        }
        function initLocalStorage(datasets) {   //ensures localStorage contains all necessary datasets
            if (!hide) {
                getClearTextDatasets(datasets);
            } else {
                getObfuscatedDatasets(datasets);
            }
        }
        function getClearTextDatasets(datasets) {
            var emptyData = '[]',
                ds, hds;
            for (var t in datasets) {
                if (datasets.hasOwnProperty(t)) {
                    ds = datasets[t].name;  //cleartext name
                    hds = findHiddenData(ds);     //get hidden name if it exists
                    if (!localStorage[ds] && !hds) { //new dataset  // || !localStorage[hds])
                        localStorage[ds] = emptyData;
                    } else if (hds && localStorage[hds]) { //dataset exists hidden
                        var data = localStorage[hds];   //store data temporarily
                        localStorage.removeItem(hds);    //remove the hidden element
                        localStorage.setItem(ds, securityService.getHiddenData(data));  //store it unhidden
                    }
                }
            }
        }
        function getObfuscatedDatasets(datasets) {
            var emptyData = '[]', ds, hds, data;
            for (var t in datasets) {
                if (datasets.hasOwnProperty(t)) {
                    ds = datasets[t].name;  //cleartext name
                    hds = findHiddenData(ds);     //get hidden name if it exists
                    if (hds && localStorage[hds] && !localStorage[securityService.hideData(ds)]) {  //dataset exists hidden using different key
                        data = securityService.getHiddenData(localStorage[hds]);    //store data temporarily
                        localStorage.removeItem(hds);    //remove the old hidden element
                        setLocalStorageData(ds, data);  //store it as hidden with new key
                    } else if (localStorage[ds]) {  //dataset exists unhidden
                        data = localStorage[ds];    //store data temporarily
                        localStorage.removeItem(ds);    //remove the unhidden element
                        setLocalStorageData(ds, data);  //store it as hidden
                    } else if (!localStorage[ds] && !localStorage[securityService.hideData(ds)]) {  //new dataset
                        setLocalStorageData(ds, emptyData);
                    }
                }
            }
        }
        function findHiddenData(ds) {   //determine if the current dataset already exists obfuscated
            var hds;
            for (var ls in localStorage) {
                if (localStorage.hasOwnProperty(ls)) {
                    if (securityService.isValidHiddenData(ls) && securityService.getHiddenData(ls) === ds) {
                        //is the dataset name a viable name and, "unhidden", is the one targeted

                        hds = ls;

                        return hds;
                    }
                }
            }
            return undefined;
        }
        function postInitMessage(config) {      //post initialization message to the dataworker
            dw.postMessage({init: config});
        }
        function getServerKey(url, timeout) {   //attempt to get the key from the server
            return $q(function (resolve) {
                $http.get(url, {timeout: timeout})
                .then(function (response) {
                    securityService.setKey(response.data);    //store the key and continue
                }, function () {
                    securityService.setKey(); //something happened while getting the server key, go with the defualt
                })
                .finally(function () {
                    resolve();
                });
            });
        }
        //function getDefaultKey(key) {
        //    return $q(function (resolve, reject) {
        //        var maxLen = 255;
        //        if (key) {
        //            securityService.setKey(key.length > maxLen ? key.substring(0, maxLen) : key);  //default key is defined by caller
        //        } else {
        //            var loc = window.location.hostname;
        //            securityService.setKey(loc.length > maxLen ? loc.substring(0, maxLen) : loc);  //default key is the current hostname
        //        }
        //        resolve();
        //    });
        //}
    }
})();
