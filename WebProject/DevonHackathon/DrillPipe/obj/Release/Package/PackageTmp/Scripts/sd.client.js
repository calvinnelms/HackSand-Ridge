var SD = SD || {};
SD.Client = SD.Client || {};

SD.Client.HandleCacheEvent = function (e) {
	switch (e.target.status) {
		case e.target.UPDATEREADY:// UPDATEREADY == 4
			alert('An updated version of this site is now available.\nClick "OK" to download it.');
			window.location.reload();
			break;
		case e.target.OBSOLETE:// OBSOLETE == 5
			console.log('Cache Obsolete');
			alert('Please connect to the SD network then refresh this page');
			break;
		//case e.target.UNCACHED: e.target.IDLE: // UNCACHED == 0// IDLE == 1
		default:
			SD.Client.CacheReady();
			break;
		// CHECKING == 2
		// DOWNLOADING == 3
	}
};
SD.Client.HandleCacheError = function (e) {
    console.log('Cache Error');
    SD.Client.CacheReady();
    //***comment the line above and uncomment the entire if-else statement to force the to attempt a full refresh in case of an error***
    //if (navigator.onLine) {
    //    if (confirm('An error was detected during download.\nClick "OK" to try again.')) {   //change the text of this confirmation to fit the application's need
    //        window.location.reload(true);
    //    }
    //} else {
    //    alert('Please connect to the SD network then refresh this page');
    //    SD.Client.CacheReady();
    //}
};
SD.Client.CacheReady = function () {
	SD.Client.RaiseCustomEvent(document, SD.Client.CreateCustomEvent(document, "sd.client.cacheready"));
};

// SD.Client.OnlineOffLine = function () {
	// SD.Client.RaiseCustomEvent(document, SD.Client.CreateCustomEvent(document, "sd.client.cacheready"));
// };
SD.Client.CreateCustomEvent = function (element, eventName) {
	var event; // The custom event that will be created
	if (element.createEvent) {
		event = element.createEvent("HTMLEvents");
		event.initEvent(eventName, true, true);
	} else {
		event = element.createEventObject();
		event.eventType = eventName;
	}
	event.eventName = eventName;
	return event;
};
SD.Client.RaiseCustomEvent = function (element, event) {
	if (element.createEvent) {
		element.dispatchEvent(event);
	} else {
		element.fireEvent("on" + event.eventType, event);
	}
};

(function () {
    if (window.applicationCache) {
        // Fired after the first cache of the manifest.
        applicationCache.addEventListener('cached', SD.Client.HandleCacheEvent, false);

        // Checking for an update. Always the first event fired in the sequence.
        //applicationCache.addEventListener('checking', SD.Client.HandleCacheEvent, false);

        // An update was found. The browser is fetching resources.
        //applicationCache.addEventListener('downloading', SD.Client.HandleCacheEvent, false);

        // The manifest returns 404 or 410, the download failed,
        // or the manifest changed while the download was in progress.
        applicationCache.addEventListener('error', SD.Client.HandleCacheError, false);

        // Fired after the first download of the manifest.
        applicationCache.addEventListener('noupdate', SD.Client.HandleCacheEvent, false);

        // Fired if the manifest file returns a 404 or 410.
        // This results in the application cache being deleted.
        applicationCache.addEventListener('obsolete', SD.Client.HandleCacheEvent, false);

        // Fired for each resource listed in the manifest as it is being fetched.
        //applicationCache.addEventListener('progress', SD.Client.HandleCacheEvent, false);

        // Fired when the manifest resources have been newly redownloaded.
        applicationCache.addEventListener('updateready', SD.Client.HandleCacheEvent, false);
    };

    // window.addEventListener('online', SD.Client.OnlineOffLine, false);
    // window.addEventListener('offline', SD.Client.OnlineOffLine, false);
})();
