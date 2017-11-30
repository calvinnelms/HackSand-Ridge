var SD = SD || {};

SD.DataWorker = function () { };

SD.DataWorker.prototype = function () {
    //private vars
    var _db
    , _OnlineTest = {}  //object containing information for testing client connectivity: base url, timeout value
    , _DBTables = []    //array of table objects: {name: '', url: ''}
    , _IsOnline = true  //assume client is connected to the network
    , _ServerConnection = { ONLINE: 1, TIMEDOUT: 2, OFFLINE: 3, REVALIDATE: 4 }    //constants for status checking

    ////////////////////////////////////////////////////
    //public methods
    ////////////////////////////////////////////////////
    , SetOnline = function (status) {
        if (status != undefined) {
            _IsOnline = status;
        }
    }
    , IsOnline = function (s) {
        return s == _ServerConnection.ONLINE;
    }
    , IsTimedOut = function (s) {
        return s == _ServerConnection.TIMEDOUT;
    }
    , IsOffline = function (s) {
        return s == _ServerConnection.OFFLINE;
    }
    , Revalidate = function (s) {
        return s == _ServerConnection.REVALIDATE;
    }
    , CheckServerConnection = function (callBack) {
        if (_IsOnline) {
            AJAX({
                url: _OnlineTest.url
                , timeout: _OnlineTest.timeout  //this will make the call asynchronous and will result in a timeout if it takes too long
                , success: function () {
                    if (_OnlineTest.validationURL) { //need to determine if the user is authenticated
                        AJAX({
                            url: _OnlineTest.validationURL
                            , timeout: _OnlineTest.timeout
                            , success: function () { callBack(_ServerConnection.ONLINE) }
                            , error: function (e) { if (e && e.message && e.message == 'timeout') { callBack(_ServerConnection.TIMEDOUT) } else { callBack(_ServerConnection.REVALIDATE) } }  //send the appropriate status timeout or revalidate (if error occurred)
                        });
                    } else {    //indicate user is able to contact the server
                        callBack(_ServerConnection.ONLINE);
                    }
                }   //indicate the client is not able to contact the server
                , error: function (e) { if (e && e.message && e.message == 'timeout') { callBack(_ServerConnection.TIMEDOUT) } else { callBack(_ServerConnection.OFFLINE) } }  //send the appropriate status timeout or offline (if error occurred)
            })
        } else {
            callBack(_ServerConnection.OFFLINE);    //immediately indicate offline since the browser is offline
        }
    }
    , Get = function (options) {
        //determine if the data is to be saved to the table or returned in an array
        if (options.returnArr != undefined && options.returnArr) {
            GetToArray(options)
        } else {
            GetToTable(options)
        }
    }
    , Post = function (options) {
        //determine if this is a one-time post with data in the options object
        if (options.data && options.data != null) {
            PostDataObj(options)
        } else {
            PostFromTable(options)
        }
    }
    , OpenDB = function (t) {
        //determine if the shim should be loaded
        if (t.shim) { importScripts('indexeddbshim.js'); }  //get shim for non-indexeddb supporting browsers (safari)

        var req = indexedDB.open(t.dbName);
        req.onsuccess = function (evt) {
            _db = this.result;  //set the global variable used by all other functions
            Init(t);
            t.success();  //callback
        };
        req.onerror = function (evt) {
            t.error(this.error);
            //postMessage({ err: this.error })
        };
    }
    , Init = function (t) {
        _OnlineTest.url = t.onlineURL;
        _OnlineTest.validationURL = t.validationURL;
        _OnlineTest.timeout = (t.onlineTimeout ? t.onlineTimeout : 5000); //default to 5 seconds
        _DBTables = t.dbTables;
    }

    ////////////////////////////////////////////////////
    //private methods
    ////////////////////////////////////////////////////
    , GetToArray = function (options) {
        var table = FindTable(options.table);
        AJAX({
            url: table.url
            , data: (options.data ? options.data : null)
            , success: function (response) {
                var data = response.responseText;
                if (data) data = JSON.parse(data);
                if (data && data.Message) {
                    options.callback({ callbackID: options.callbackID, err: 'handler error (Get) -- ' + data.Message, responseData: response });  //something happened on the server while posting data -- return the error information in the callback
                } else {
                    options.callback({ callbackID: options.callbackID, dataArr: data, responseData: response }); //success!  return array of data in the callback
                }
            }
            , error: function (response) { options.callback({ callbackID: options.callbackID, err: 'AJAX error (Get)' + (response.message ? ' -- ' + response.message : ''), responseData: response }) } //something happened in transmission while posting data -- return the error information in the callback
        });
    }
    , GetToTable = function (options) {
        //options = {table:str, callback: function(err)}
        var table = FindTable(options.table);
        AJAX({
            url: table.url
            , data: (options.data ? options.data : null)
            , success: function (response) {
                var data = response.responseText;
                if (data) data = JSON.parse(data);
                if (data && data.Message) {
                    options.callback({ callbackID: options.callbackID, err: 'handler error (Get) -- ' + data.Message, responseData: response });  //something happened on the server while posting data -- return the error information in the callback
                } else {
                    ClearTable({    //clear the local table data
                        tableName: table.name,
                        success: function () {
                            AddTableData({  //refresh the local table data with data just received from the server
                                tableName: table.name,
                                data: data
                            });
                            options.callback({ callbackID: options.callbackID, responseData: response }); //success!  return nothing in the callback
                        },
                        error: function (e) { options.callback({ callbackID: options.callbackID, err: 'ClearTable error (Get) ' + e }) } //ClearTable error callback -- return the error information in the callback
                    });
                }
            }
            , error: function (response) { options.callback({ callbackID: options.callbackID, err: 'AJAX error (Get)' + (response.message ? ' -- ' + response.message : ''), responseData: response }) } //something happened in transmission while posting data -- return the error information in the callback
        });
    }
    , PostDataObj = function (options) {
        var table = FindTable(options.table);
        AJAX({
            url: table.url
            , contentType: 'application/json'   //expecting json data being sent
            , type: 'POST'
            , data: JSON.stringify(options.data)
            , success: function (response) {
                var err = [], data = response.responseText;
                if (data) data = JSON.parse(data);
                if (data && data.Message) {   //something happened on the server while posting data -- record it and move on; don't remove it from the local table
                    err.push({ err: 'handler error (Post) -- ' + data.Message });
                }
                options.callback({ callbackID: options.callbackID, err: err, responseData: response });  //send back array of any errors that may have occurred
            }
            , error: function (response) { options.callback({ callbackID: options.callbackID, err: [{ err: 'AJAX error (Post)' + (response.message ? ' -- ' + response.message : '') }], responseData: response }); }   //something happened in transmission while posting data -- send back array of the error that occurred
        });
    }
    , PostFromTable = function (options) {
        //options = {table:str, callback: function([err])}
        var err = []
        , table = FindTable(options.table);
        GetTableData({
            tableName: table.name,
            success: function (dataObj) {    //data is an array of records from local table
                for (item in dataObj) { //send each record individually
                    AJAX({
                        url: table.url
                        , contentType: 'application/json'   //expecting json data being sent
                        , type: 'POST'
                        , data: JSON.stringify(dataObj[item].value)
                        , success: function (response) {
                            var data = response.responseText;
                            if (data) data = JSON.parse(data);
                            if (data && data.Message) {   //something happened on the server while posting data -- record it and move on; don't remove it from the local table
                                err.push({ err: 'handler error (Post) -- ' + data.Message });
                            } else {
                                //delete the record just successfully saved
                                DeleteTableData({
                                    tableName: table.name
                                    , key: dataObj[item].key
                                });
                            }
                        }
                        , error: function (response) { err.push({ err: 'AJAX error (Post) -- ' + e }); }   //something happened in transmission while posting data -- record it and move on
                    });
                };
                options.callback({ callbackID: options.callbackID, err: err, responseData: response });  //send back array of any errors that may have occurred
            },
            error: function (response) { options.callback({ callbackID: options.callbackID, err: [{ err: (response.message ? response.message : '') }], responseData: response }) }  //GetTableData error callback -- create a single-item array with the error information
        });
    }
    , FindTable = function (tableName) {
        for (t in _DBTables) {
            if (_DBTables[t].name == tableName) return _DBTables[t];
        }
    }

    ////XHR server communication
   , AJAX = function (request) {
        var timeout = (request.timeout ? request.timeout : 0)
            , url = request.url + (request.cache && request.cache == true ? '' : (request.url.indexOf('?') > 0 ? '&' : '?') + '_=' + new Date().getTime())
            , r = new XMLHttpRequest();
        r.open((request.type ? request.type : 'GET'), url, (timeout > 0 ? true : false));  //defaults to GET and synchronous
        if (request.contentType) { r.setRequestHeader('Content-Type', request.contentType) };   //if contentType is received, set it in the request header
        if (timeout > 0) {  //asynchronous
            r.timeout = timeout;
            r.ontimeout = function () { if (request.error) request.error(getResponseData(r, 'timeout')) };  //calls the error callback with 'timeout' as the value
            r.onerror = function () { if (request.error) request.error(getResponseData(r)) };
            r.onload = function () {
                if (r.readyState === 4 && r.status === 200) {   //completed successfully
                    if (request.success) request.success(getResponseData(r));
                } else {    //completed but not successfully
                    if (request.error) request.error(getResponseData(r, 'Invalid return'));
                }
            };
            r.onabort = function () { if (request.error) request.error(getResponseData(r, 'XHR aborted')) };
            r.send(request.data ? request.data : null); //if data is present, send it
        } else {    //synchronous
            r.send(request.data ? request.data : null); //if data is present, send it
            if (r.status === 200) {
                if (request.success)
                    request.success(getResponseData(r));
            } else {
                if (request.error)
                    request.error(getResponseData(r));
            }
        }
   }
    //populate the return object with XMLHttpRequest data
    , getResponseData = function (r, message) {
        if (r) {
            return { readyState: r.readyState, responseHeaders: splitResponseHeaders(r.getAllResponseHeaders()), responseText: r.responseText, status: r.status, statusText: r.statusText, message: (message ? message : null) };
        } else if (message) {
            return { message: (message ? message : null) };
        } else {
            return null;
        }
    }
    //parse XMLHttpRequest response headers into array of {name:<keyName>, value:<keyValue>}
    , splitResponseHeaders = function (rawHeaders) {
        if (rawHeaders) {
            var splitHeaders = rawHeaders.toLowerCase().split("\r\n");
            if (splitHeaders && splitHeaders.length > 0) {
                var headers = [], keyValue = [];
                for (var i = 0; i < splitHeaders.length; i++) {
                    if (splitHeaders[i].indexOf(": ") > 0) {    //splittable value
                        keyValue = splitHeaders[i].split(": ");
                        if (keyValue && keyValue.length === 2)  //valid key-value pair
                            headers.push({ name: keyValue[0], value: keyValue[1] });
                    }
                }
                return headers;
            } else { //no delimited value returned
                return [];
            }
        } else {    //no headers returned
            return [];
        }
    }

    /////////////////////////////////////////////////////
    ////DB functions
    , GetTable = function (tableName) {  //get reference to given table
        return _db.transaction(tableName, 'readwrite').objectStore(tableName);
    }
    , ClearTable = function (t) {    //delete data from given table
        var req = GetTable(t.tableName).clear();//.onsuccess = function (evt) {
        //postMessage({ info: 'ClearTable - ' + t.tableName });
        //    t.success();
        //};
        req.onsuccess = function (evt) {
            t.success();
        };
        req.onerror = function (evt) {
            t.error(this.error );
        }
    }
    , AddTableData = function (t) {  //add data to given table
        //postMessage({ info: 'AddTableData - ' + t.tableName +' - data length - '+ t.data.length });
        var table = GetTable(t.tableName);
        for (item in t.data) {
            table.add(t.data[item]);
        }
    }
    , GetTableData = function (t) {  //return data from given table in array of key/value pairs
        var data = [];
        GetTable(t.tableName).openCursor().onsuccess = function (evt) {
            var cursor = evt.target.result;
            if (cursor) {
                data.push({ key: cursor.key, value: cursor.value });
                cursor.continue();
            } else {
                t.success(data);
            }
        }
    }
    , DeleteTableData = function (t) {
        var req = GetTable(t.tableName).delete(t.key);
        //req.onsuccess = function (evt) { t.success() };
    }
    ;
    /////////////////////////////////////////////////////

    return {
        SetOnline: SetOnline
        , IsOnline: IsOnline
        , IsTimedOut: IsTimedOut
        , IsOffline: IsOffline
        , Revalidate: Revalidate
        , CheckServerConnection: CheckServerConnection
        , Get: Get
        , Post: Post
        , OpenDB: OpenDB
        , Init: Init
    }
}();