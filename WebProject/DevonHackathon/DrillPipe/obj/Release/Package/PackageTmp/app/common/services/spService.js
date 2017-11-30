/**
 This service can be used to access SharePoint data from any web based (javascript-based) application.
 **/
(function () {
    'use strict';

    angular
        .module('app')
        .factory('spService', spService);

    spService.$inject = ['$http', '$q'];

    function spService($http, $q) {
        //var _ContextInfo = {
        //    List: 100,
        //    Library: 101,
        //    Survey: 102,
        //    Links: 103,
        //    Announcements: 104,
        //    Contacts: 105,
        //    Calendar: 106,
        //    Tasks: 107,
        //    PictureLib: 109
        //},
        var service = {
            getContextInfo: getContextInfo,
            getLists: getLists,
            getListItems: getListItems,
            getUserInfo: getUserInfo,
            getUserInfoByAcct: getUserInfoByAcct,
            createList: createList,
            createFolder: createFolder,
            uploadFile: uploadFile//,
            //ContextInfo: _ContextInfo
        };

        return service;

        function getContextInfo(site) {
            return $q(function (resolve, reject) {
                $http.post(site + '/_api/contextinfo', { headers: { 'accept': 'application/json;odata=verbose' } })
                .then(function (response) {
                    var x2Js = new X2JS();
                    var jsondig = x2Js.xml_str2json(response.data);
                    resolve(jsondig.GetContextWebInformation.FormDigestValue.__text);
                }, function (response) {
                    if (response && response.data && response.data.error) {
                        reject(response.data.error);
                    } else {
                        reject(response);
                    }
                });
            });
        }

        //Returns an array of lists from a site.
        function getLists(site) {
            return $q(function (resolve, reject) {
                var url = site + '/_api/web/lists';
                $http.get(url, { headers: { 'accept': 'application/json;odata=verbose' } })
                .then(function (response) {
                    resolve(response.data.d.results);
                }, function (response) {
                    if (response && response.data && response.data.error) {
                        reject(response.data.error);
                    } else {
                        reject(response);
                    }
                });
            });
        }

        //Returns an array of list items.  This only returns the metadata and cannot return files (although the URL is part of the metadata).
        //The query is in the form of $filter=' '.  A good URL for the study of these types of queries: http://wiki.sensenet.com/index.php?title=OData_REST_API
        function getListItems(site, list, query) {
            return $q(function (resolve, reject) {
                var items = [];
                var url = site + '/_vti_bin/ListData.svc/' + list + '?' + query;
                $http.get(url)
                .then(function (response) {
                    resolve(response.data.d.results);
                }, function (response) {
                    if (response && response.data && response.data.error) {
                        reject(response.data.error);
                    } else {
                        reject(response);
                    }
                });
            });
        }

        //Returns a SharePoint user's information if the ID of the user is known.  
        //Best use case is when getting the user id from Lookup fields (such as Author and Editor) from running the getListItems.
        function getUserInfo(site, id) {
            return $q(function (resolve, reject) {
                var url = site + '/_api/web/GetUserById(' + id + ')';
                $http.get(url, { headers: { 'accept': 'application/json;odata=verbose' } })
                .then(function (response) {
                    var data = response.data;
                    resolve({ loginname: data.d.LoginName, displayname: data.d.Title, email: data.d.Email });
                }, function (response) {
                    if (response && response.data && response.data.error) {
                        reject(response.data.error);
                    } else {
                        reject(response);
                    }
                });
            });
        }

        //Returns a SharePoint user's information based on the current variable.
        //If current is true, then the current user's information is accessed.
        //If current is false or undefined, then the "acct"'s data is found.
        function getUserInfoByAcct(site, current, acct) {
            return $q(function (resolve, reject) {
                var url = site + '/_api/SP.UserProfiles.PeopleManager/';
                if (current) {
                    url = url + 'GetMyProperties';
                } else {
                    if (!~acct.toUpperCase().indexOf('SDRGE')) {
                        acct = 'SDRGE\\' + acct;
                    }
                    url = url + 'GetPropertiesFor(accountname=@v)?@v=\'' + acct + '\'';
                }
                $http.get(url, { headers: { 'accept': 'application/json;odata=verbose' } })
                .then(function (response) {
                    resolve(response.data);
                }, function (response) {
                    if (response && response.data && response.data.error) {
                        reject(response.data.error);
                    } else {
                        reject(response);
                    }
                });
            });
        }

        //Creates a SharePoint list (see the bottom for templates)
        function createList(site, ci, description, title, template) {
            return $q(function (resolve, reject) {
                $http.post(site + '/_api/web/lists', {
                    '__metadata': { 'type': 'SP.List' },
                    'AllowContentTypes': true,
                    'BaseTemplate': template,
                    'ContentTypesEnabled': true,
                    'Description': description,
                    'Title': title
                }, { headers: { 'accept': 'application/json;odata=verbose', 'content-type': 'application/json; odata=verbose', 'X-RequestDigest': ci } })
                .then(function (response) {
                    resolve(response.data);
                }, function (response) {
                    if (response && response.data && response.data.error) {
                        reject(response.data.error);
                    } else {
                        reject(response);
                    }
                });
            });
        }

        //Creates a folder within a SharePoint library
        function createFolder(site, ci, library, folder) {
            return $q(function (resolve, reject) {
                //var path = '/' + library + '/' + folder; //****is this used???
                $http.post(site + '/_api/web/GetFolderByServerRelativeUrl(\'' + library + '\')/folders',
                {
                    '__metadata': { 'type': 'SP.Folder' },
                    'ServerRelativeUrl': library + '/' + folder
                }, { headers: { 'accept': 'application/json;odata=verbose', 'content-type': 'application/json; odata=verbose', 'X-RequestDigest': ci } })
                .then(resolve, function (response) {
                    if (response && response.data && response.data.error) {
                        reject(response.data.error);
                    } else {
                        reject(response);
                    }
                });
            });
        }

        //This can be used for any file type NOT associated with Office
        function uploadFile(site, ci, listname, filename, buffer, type) {
            return $q(function (resolve, reject) {
                $http.post(site + '/_api/web/Lists/getByTitle(\'' + listname + '\')/RootFolder/files/add(url=\'' + filename + '\',overwrite=\'true\')',
                    buffer,
                    { headers: { 'accept': type, 'content-length': buffer.byteLength, 'X-RequestDigest': ci } })
                .then(resolve, function (response) {
                    if (response && response.data && response.data.error) {
                        reject(response.data.error);
                    } else {
                        reject(response);
                    }
                });
            });
        }        
    }
})();


//Any function requiring the 'ci' parameter must pass through the result from getContextInfo

/**

Type            TemplateID
List            100
Library         101
Survey          102
Links           103
Announcements   104
Contacts        105
Calendar        106
Tasks           107
Picture Lib     109

**/