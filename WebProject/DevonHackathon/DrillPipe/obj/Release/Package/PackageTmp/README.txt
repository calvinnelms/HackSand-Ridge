************************************************
Before deploying app to server:
************************************************

1.	Change the application name settings in two places (in addition to HTML page title and Nav Bar text):
	a. errorLogger.application in configService (app.js)
	b. AppName in appSettings section (web.config)

2. Ensure Error Logger URIs are pointed to the production Error Logger (web.config, app.js)
	a. app.js should be changed before minifying script


************************************************
Steps for utilizing Task Runner Explorer to run 
Gulp tasks in VS 2013 (except where noted)
************************************************

1.  Ensure the Task Runner Explorer is installed and viewable in the Visual Studio environment
	a.  If installed but not in view, in the VS menu click on View|Other Windows|Task Runner Explorer
	b.  If not installed, in the VS menu click on Tools|Extensions and Updates
		1.  from the Online node, search for Task Runner Explorer and install it
	c.	Task Runner Explorer should see the gulpfile.js file in the project but will have no tasks associated with it

2.  Ensure Node.js is installed on your system (includes VS 2015)
	a.  If installed, skip to Step 3
	b.  Go to https://nodejs.org/ and install the current version of Node.js
	c.  Once installed click on "Node.js Command Prompt" under Node.js on the Start menu
	d.  Go to the C drive and run the following command by typing or pasting it at the command prompt:

		npm install gulp -g

	e.  Restart Visual Studio and reopen this project

3.  Run a Node.js command prompt (if not already running)
	a.  Click on "Node.js Command Prompt" under Node.js on the Start menu
	b.  In the command window navigate to your project directory (i.e. c:\projects\ng-SD Mobile1)
	c.  Run the following command by typing or pasting it at the command prompt:

		npm install --save-dev del gulp gulp-concat gulp-if gulp-inject gulp-jscs gulp-jshint gulp-load-plugins gulp-print gulp-uglify jshint-stylish yargs

	d.  Close the Node.js command prompt

4.  In Task Runner Explorer, click the Refresh button next to the Project dropdown list
	a.	Tasks and Sub Tasks should be displayed beneath gulpfile.js
	c.	Test the node package installation
		1.	open the index.html file
		2.	in Task Runner Explorer right-click on the injectDev task and click Run
		3.	VS should inform you that index.html was modified outside the editor and ask you to reload it.
		4.	index.html should now contain a reference to all the individual project javascript files

************************************************
Steps for utilizing bower.json config file
************************************************

1.	In the "dependencies" section of the file add the name of the package you wish to use in double-quotes followed by a colon (see example below)
	a.	if there is one or more packages already listed, ensure you append a comma to the previous item (or prepend your new entry with a comma)

2.	Choose the version you wish to include in your project
	a.	if you want the option to ensure the latest stable version is always downloaded to your project, prepend the version number with a "^" or "~" symbol.
		1.	"^" matches the latest major version (1.x.x)
		2.	"~" matches the latest minor version (1.2.x)
		3.	the version number alone matches exactly what is supplied and does not automatically update

3.	Save the file and Visual Studio will fetch all packages not already present in the "packages" directory (hidden in the Solution Explorer unless you're showing hidden files)

4.	From each package's directory, copy the appropriate files (i.e. *.js or *.css) to the appropriate project folders (i.e. Scripts or Content)

5.	Take note of potential conflicts with local modifications and adjust appropriately

NOTE: Currently in VS2015, editing the bower.json file allows the programmer to include packages from the bower ecosystem by supplying the name
and version number (both with IntelliSense).  For now, this method should be used only for packages not available through Visual Studio's NuGet Package Manager.


************************************************
Change Log
************************************************

2.2
************************************************
- Added debug functionality (debug.html, gulp.js, web.config)
- Added in project name into title tag under the main index page (index.html)
- Added new ActionService, modularized http action verbs (ActionService.js)
- Added code to determine users current Url (app.js)
- Added code to correct bug with Bootstrap 3 modals and the iOS keyboard (app.js)
- Modified nav bar to match updated color scheme (nav.html, sd.css, sd.bootstrap.css)
- Added Angular Validation and ngMessages (app.js)

2.1
************************************************
- Added Angular service for embedding files (PDFs specifically) into view (app.js, embed.html, EmbedController.js, embedSrc.directive.js)
- Separated customizations out of Boostrap files and updated color scheme (sd.boostrap.css, sd.css)
- Added option to pull "Run As" user information in SP controller (SPController.js)
- Fixed sd.dataworker.js to expose the Revalidate method (sd.dataworker.js)
- Fixed pagination on Local view due to update/change in ui.boostrap implementation (local.html)
- Fixed JSON date filter by added more checks around incoming value (jsonDateFilter.js)
- Added css to remove IE's "clear" button on input boxes (sd.css)
- Added css to show new SD logo as favorite icon (index.html, favicon.ico)
- Changed watermark to new blue SD logo (watermark-logo_blue.png)

2.0
************************************************
- Added Angular service for accessing SharePoint functionality (app.js, sp.html, SPController.js, SPService.js)
- Added "external" routing for use when external programs (e.g. email) are needed for entry into the app (app.js, index.html, handler)
- Created a filters folder and moved global filters to individually named files (app.js, \app\common\filters\jsonDateFilter.js & offsetFilter.js)
- Added getDatePart filter (getDatePartFilter.js)
- Moved bindDynamicHtml directive to its own file (navController.js, bindDynamicHtml.directive.js)
- Added example for routing case-insensitive routing (app.js)
- Added functionality for conditional navigation buttons (nav.html, NavController.js, NavService.js)
- Added ability to utilize SDErrorLogger's informational and warning logging (handler)
- Added ability to configure logging activity level (web.config, handler)
- Fixed instructions on usage for sdFocus directive (sdFocus.directive.js)
- Added client functionality to catch "private/incognito" mode (app.js, noapp.html, NoAppController.js, NavService.js, SDErrorLoggerService.js) -- implementation on all client controllers
- Added functionality for handling proxy (F5) session timeout (app.js, CommonService.js, DataService.js, DataWorkerService.js, dataworker.js, sd.dataworker.js)
- Added Local Storage edit function (DataWorkerService.js)
- Removed deprecated .success/.error promise methods, replacing with standard .then methods (DataService.js, SDErrorLoggerService.js)
- Fixed dataworker error retrieval from server calls (sd.dataworker.js)
- Updated all NuGet packages to latest versions (Scripts)

1.8
************************************************
- Added About tab (app.js, index.html, about.html, AboutController.js, pw.html, PWController.js)
- Added new ADHelper reference, and updated existing ErrorLoggerWrapper and EmailWrapper references
- Added example code (commented out) to log email attempts (DemoNotifications)
- Added footer to index page (footer.html, FooterController.js, index.html)
- Moved navigation UI to its own view (nav.html, index.html)
- Changed primary gulp inject task names to be prepended with "_" so they appear at the top of the list of gulp tasks (gulp.js)
- Added functionality for the gulp tasks to 
	- dynamically insert build version into config service (gulp.js, app.js)
		- consumed and displayed via the new footer view and controller
		- _injectDev will include date-part of current build version; _injectProd includes just build version
	- update bower-based packages with new _bower-update task (gulp.js, bower.json, .bowerrc)
		- see notes above on utilizing bower.json file
- Added code (commented out) to the sd.client.js file in SD.Client.HandleCacheError to force refresh if a caching error (obsolete status) occurs (sd.client.js)

1.7
************************************************
- Added global filters to app (app.js, OfflineController.js, offline.html)
- Added app_offline.html for utilization in IIS migrations
- Minor fixes/tweaks to various script files (DemoController.js, app.js, DataService.js, modal.js)
- Added styling to "RunAs" HTML (handler)
- Added TestAsGroups setting and implementation (handler, web.config)
- Changed user/alias checking to use AD natively (handler)
- Added AuthService.js and example implementation (AdminController.js, NavController.js)
- Added SecurityService.js (extracted from DataWorderService.js)
- Expanded ADUser object and hydration (Structures .NET class, handler)
- Updated all NuGet packages to latest versions (Scripts)

1.6
************************************************
- Added two grid implementations, UI Grid and ag-grid (grid.html, GridController.js)
- Added fix for uploaded image deletion implementation (DemoController.js)
- Fixed version/build incremented number injection for manifest.appcache (gulpfile.js)
- Changed database implementation to utilize new development SQL environment (web.config, DemoHandler.ashx)
- Fixed spelling errors in local data file (data.txt)
- Updated items in conjunction with newest angular-ui-bootstrap script
	- Modal injection uses $uibModal because $modal has been deprecated (CommonService.js)
	- Pagination directive name changed to uib-pagination (local.html)
- Updated all NuGet packages to latest versions (Scripts)

1.5
************************************************
- Added instructions regarding application name config changes (readme.txt)
- Added geolocation functionality to template (app\app.js, app\geo\*, app\common\geolocationservice.js, app\navcontroller.js, index.html)
- Fixed file upload directive attribute regarding camera usage; added comment for attribute settings when used on iOS/Safari (demo.html)
- Added gulp function to automatically change manifest version information (gulpfile.js, manifest.appcache)
- Added media query for small screen to move loading overlay (content\sd.css, app\db\db.html)
- Fixed pagination on Local controller when filtering data (local.html, LocalController.js)
- Updated all NuGet packages to latest versions (Scripts)

1.4
************************************************
- Added navbar fix for webkit-based browsers (sd.css)
- Added navbar button border in case of button overlap on linear gradient (sd.css)
- Added js code to fix bootstrap for navbar to re-collapse automatically when a nav button is clicked in small-sized media (boostrap.js)
	- If the bootstrap script is updated (via npm) and this functionality is overwritten, the code below can be reinserted into bootstrap.js in the dropdown.js section:
		- currently dropdown.js v3.3.5 on line 908 (last line of the dropdown class)

		    .on('click', '.navbar-collapse.in', function (e) { if ($(e.target).is('a')) { $(this).collapse('hide'); } })

	- The .map file should automatically update the .min file when saving the .js file.  If not, re-minify the bootstrap.js file in order to ensure utilization while gulping.
- Updated all NuGet packages to latest versions (Scripts)

1.3
************************************************
- New directive sdFocus (example on local.html)
- Added linear gradient to navbar-inverse class (sd.css)
- Changed project reference for Newtonsoft.Json from local to NuGet package
	- If project is created without a separate solution directory, uninstall NuGet reference to Newtonsoft.Json then reinstall to resolve reference
- Updated all NuGet packages to latest versions (Scripts)
- Tested project template to work with VS 2015 (Pro & Enterprise) and VS 2013