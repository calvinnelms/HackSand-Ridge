///////////////////////////////////////////////////////////////////////////
//Find all TODO: lines and provide the indicated values or implementation
///////////////////////////////////////////////////////////////////////////
importScripts('sd.dataworker.js');      //include file relative to dataworker (this file)
var SDDataWorker = new SD.DataWorker() //create new instance
, _RefreshTables = [];

//////////////////////////////////////////////////////////////
//Worker methods
//////////////////////////////////////////////////////////////
//TODO (optional): implement POST and GET calls for the respective local database tables
//function PostName1() {
//    SDDataWorker.Post({
//        table: 'Name1',
//        callback: function (err) {
//            if (err && err.legnth > 0) { //at least one error occurred; iterate through the array letting the caller know
//                for (e in err) {
//                    postMessage(err[e]);
//                }
//            }
//            GetName2();
//        }
//    })
//}

//function GetName2() {
//    var tableName = 'Name2';
//    SDDataWorker.Get({
//        table: tableName,
//        callback: function (e) {
//            if (e) {
//                postMessage(e); //error occurred; let the caller know
//            } else {
//                postMessage({ tableName: tableName });    //let the caller know this data has been refreshed
//            }
//        }
//    })
//}

function ProcessTableRefresh(offline, revalidate) {
    for (rt in _RefreshTables) {
        if ((offline == undefined || !offline) && (revalidate == undefined || !revalidate)) { //only attempt the table action if online and doesn't need revalidation
            if (_RefreshTables[rt].action) {
                switch (_RefreshTables[rt].action.toLowerCase()) {
                    case 'post':
                        SDDataWorker.Post({ //post local data to the server
                            table: _RefreshTables[rt].name,
                            data: (_RefreshTables[rt].data ? _RefreshTables[rt].data : null),
                            callbackID: { tableName: _RefreshTables[rt].name, extra: _RefreshTables[rt].extra },
                            callback: function (obj) {
                                if (obj && obj.err && obj.err.legnth > 0) { //at least one error occurred; iterate through the array letting the caller know
                                    for (e in obj.err) {
                                        postMessage(obj.err[e]);
                                    }
                                }
                                if (obj.responseData) {
                                    obj.callbackID.responseData = obj.responseData;
                                }
                                postMessage(obj.callbackID);   //let the caller know this data has been refreshed
                            }
                        });
                        break;
                    case 'get':
                        SDDataWorker.Get({
                            table: _RefreshTables[rt].name,
                            data: (_RefreshTables[rt].data ? _RefreshTables[rt].data : null),
                            callbackID: { tableName: _RefreshTables[rt].name, extra: _RefreshTables[rt].extra },    
                            returnArr: (_RefreshTables[rt].returnArr ? _RefreshTables[rt].returnArr : false), //determine if data is to be returned in an array or table
                            callback: function (obj) {
                                if (obj && obj.err) {
                                    postMessage(obj.err); //error occurred; let the caller know
                                    return;
                                }
                                postMessage({ tableName: obj.callbackID.tableName, extra: obj.callbackID.extra, dataArr: (obj && obj.dataArr ? obj.dataArr : null), responseData: (obj.responseData ? obj.responseData : null) });   //let the caller know this data is being returned or has been refreshed
                            }
                        });
                        break;
                }
            }
        } else {//let the caller know this data is being returned or has been refreshed
            if (offline) {
                postMessage({ tableName: _RefreshTables[rt].name, extra: _RefreshTables[rt].extra, offline: true });
            } else {
                postMessage({ tableName: _RefreshTables[rt].name, extra: _RefreshTables[rt].extra, revalidate: true });
            }
        }
    }
}

function RefreshData() {
    SDDataWorker.CheckServerConnection(function (s) {
        if (SDDataWorker.IsOnline(s)) {
            //TODO (optional): implement custom method to begin synchronization of data
            //PostName1();    
            if (_RefreshTables.length > 0) {
                ProcessTableRefresh();
            }
        } else {
            //let the caller know that the action was not successful due to being offline
            if (_RefreshTables.length > 0) {    //auto-refresh table list
                ProcessTableRefresh(SDDataWorker.IsOffline(s), SDDataWorker.Revalidate(s));
            }
            //TODO (optional): post messages back indicating data is present (potentially) in local tables
            //postMessage({ tableName: 'Name1', offline: true });
            //postMessage({ tableName: 'Name2', offline: true });
        }
    })
}

function CompleteInit(init) {
    postMessage({ event: init.dataReadyListener });  //let the caller know everything is set up
    if (init.refresh && init.refresh.interval && init.refresh.interval > 0) {
        if (init.refresh.refreshTables) {
            _RefreshTables = init.refresh.refreshTables;
        }
        setInterval(RefreshData, init.refresh.interval);                    //set up the recurring refresh
        RefreshData();                                                      //run intial refresh immediately
    }
}
//////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////
//Worker handlers
//////////////////////////////////////////////////////////////

//handler for incoming messages
onmessage = function (m) {
    try {
        var message = m.data;
        if (message.init) {  //initialize for automated data retrieval
            //Init the dataworker processes
            if (message.init.database && message.init.database.name) {
                //Init the db connection
                SDDataWorker.OpenDB({
                    dbName: message.init.database.name
                    , onlineURL: message.init.onlineURL
                    , onlineTimeout: message.init.onlineTimeout
                    , validationURL: message.init.validationURL
                    , shim: (message.init.shim ? message.init.shim : false) //default to not load shim if the setting is no provided
                    , dbTables: message.init.database.tables
                    , success: function () {
                        CompleteInit(message.init);
                    }
                    , error: function (e) { postMessage({ err: this.error }) }
                });
            } else {
                //init the worker without indexeddb support
                SDDataWorker.Init({
                    onlineURL: message.init.onlineURL
                    , onlineTimeout: message.init.onlineTimeout
                    , validationURL: message.init.validationURL
                    , dbTables: (message.init.database && message.init.database.tables ? message.init.database.tables : null)
                });
                CompleteInit(message.init);
            }
        } else if (message.tableName) {    //on-demand
            SDDataWorker.CheckServerConnection(function (s) {
                if (SDDataWorker.IsOnline(s)) {
                    if (message.action && message.action.toLowerCase() == 'post') {
                        SDDataWorker.Post({ //post local data to the server
                            table: message.tableName,
                            data: (message.data ? message.data : null),
                            callbackID: { tableName: message.tableName, extra: message.extra },
                            callback: function (obj) {
                                if (obj && obj.err && obj.err.legnth > 0) { //at least one error occurred; iterate through the array letting the caller know
                                    for (e in obj.err) {
                                        postMessage(obj.err[e]);
                                    }
                                }
                                if (obj.responseData) {
                                    obj.callbackID.responseData = obj.responseData;
                                }
                                postMessage(obj.callbackID);   //let the caller know this data has been refreshed
                            }
                        });
                    } else {
                        //default to get
                        SDDataWorker.Get({
                            table: message.tableName,
                            data: (message.data ? message.data : null),
                            callbackID: { tableName: message.tableName, extra: message.extra },
                            returnArr: (message.returnArr ? message.returnArr : false), //determine if data is to be returned in an array or table
                            callback: function (obj) {
                                if (obj) {
                                    if (obj.err) {
                                        postMessage(obj.err); //error occurred; let the caller know
                                        return;
                                    }
                                }
                                postMessage({ tableName: obj.callbackID.tableName, extra: obj.callbackID.extra, dataArr: (obj && obj.dataArr ? obj.dataArr : null), responseData: (obj.responseData ? obj.responseData : null) });   //let the caller know this data is being returned or has been refreshed
                            }
                        });
                    }
                } else {
                    if (SDDataWorker.Revalidate(s)) {
                        //let the caller know that the server call was not successful due to needing validation
                        postMessage({ tableName: message.tableName, revalidate: true, extra: message.extra });
                    } else {
                        //let the caller know that the server call was not successful due to being offline
                        postMessage({ tableName: message.tableName, offline: true, extra: message.extra });
                    }
                }
            });
        } else if (message.online != undefined) {    //client browser online/offline
            SDDataWorker.SetOnline(message.online);
        }
    } catch (e) {
        postMessage({ err: (e ? (e.stack ? e.stack : e) : 'undefined error') })
    }
};

//handler for errors
onerror = function (e) {
    postMessage({ err: 'internal error occurred: ' + e });
};
//////////////////////////////////////////////////////////////
