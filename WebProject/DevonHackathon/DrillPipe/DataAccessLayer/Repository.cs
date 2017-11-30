using SDHelpers.ErrorLoggerWrapper;
using SDHelpers.ErrorLoggerWrapper.ErrorLoggerSvc;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data.Entity.Validation;
using System.IO;
using System.Linq;
using System.Reflection;

namespace DrillPipe.DataAccessLayer
{
    /// <summary>
    /// Use the Repository to retrieve data from the data source.  Once retrieved, format, and then return to the controller
    /// </summary>
    public sealed class Repository
    {
        public static string _HostName { get; set; }
        private static AdUser _UserInfo { get; set; }
        public static string _UserName { get; set; }

        private static readonly string _Appname = ConfigurationManager.AppSettings["AppName"];
        private static readonly string _LogLocation = ConfigurationManager.AppSettings["LogLocation"];
        private static readonly string _ExceptionsEmail = ConfigurationManager.AppSettings["ExceptionsEmail"];
        private static readonly string _Path = "~/app/localdata/livedata.txt";
        private static readonly int _NotifySeverityLevel = int.Parse(ConfigurationManager.AppSettings["NotifySeverityLevel"]);

        /*
         * App specific code goes here! 
         */


        public static pipeselection CreatePipeSelection(pipeselection pipeSelection)
        {
            using (var db = new SDHackathonSQLEntities())
            {
                var ps = new pipeselection();

                ps = db.pipeselections.Add(pipeSelection);

                db.SaveChanges();

                return ps;
            }
        }

        public static List<pipelength> CreatePipeLengths(List<pipelength> pipeLengths)
        {
            using (var db = new SDHackathonSQLEntities())
            {
                var returnData = new List<pipelength>();

                foreach (var pls in pipeLengths)
                {
                    var pl = new pipelength();

                    pl = db.pipelengths.Add(pls);

                    db.SaveChanges();

                    returnData.Add(pl);
                }

                return returnData;
            }
        }

        public static List<well> Wells()
        {
            using (var db = new SDHackathonSQLEntities())
            {
                return db.wells.ToList();
            }
        }

        public static List<preset> Presets()
        {
            using (var db = new SDHackathonSQLEntities())
            {
                return db.presets.ToList();
            }
        }

        public static List<All> All()
        {
            using (var db = new SDHackathonSQLEntities())
            {
                var all = new List<All>();

                var pipeSelections = db.pipeselections.ToList();

                foreach (var ps in pipeSelections)
                {
                    var a = new All();

                    a.PipeSelection = ps;
                    a.PipeLengths = db.pipelengths.Where(x => x.PIPEID == ps.ID).ToList();
                    
                    all.Add(a);
                }

                return all;
            }
        }

        public static double GetMeasurement()
        {
            try
            {
                using (var db = new SDHackathonSQLEntities())
                {
                    return db.arduinoes.Take(1).OrderByDescending(x => x.ID).Select(x => x.LENGTH).FirstOrDefault();
                }
            }
            catch
            {
                throw;
            }
        }

        public static void DeleteArduino()
        {
            try
            {
                using (var db = new SDHackathonSQLEntities())
                {
                    db.Database.ExecuteSqlCommand("TRUNCATE TABLE [arduino]");
                }
               // return "SUCCESS";
            }
            catch
            {
                throw;
            }
        }

        /*
         * Catch DbEntityValidationException when db.SaveChanges() is called
         */
        public static void DemoUpdate()
        {
            try
            {
                using (var db = new AppDbTemplateEntities())
                {
                    db.SaveChanges();
                }
            }
            catch (DbEntityValidationException ex)
            {
                // Retrieve the error messages as a list of strings.
                var errorMessages = ex.EntityValidationErrors
                    .SelectMany(x => x.ValidationErrors)
                    .Select(x => x.ErrorMessage);

                // Join the list to a single string.
                var fullErrorMessage = string.Join("; ", errorMessages);

                // Combine the original exception message with the new one.
                var exceptionMessage = string.Concat(ex.Message, " The validation errors are: ", fullErrorMessage);

                // Throw a new DbEntityValidationException with the improved exception message.
                throw new DbEntityValidationException(exceptionMessage, ex.EntityValidationErrors);
            }
        }


        /*
         * System code
         */

        #region Authentication

        public static string BuildRunAsOption(bool _isAdmin)
        {
            return (_isAdmin && IsTestUser(_UserName) ?
                "<form class=\"form-inline\" style=\"margin-top: 10px;\">" +
                "<span class=\"input-group\">" +
                "<input type=\"text\" class=\"form-control\" ng-model=\"ctrl.runAs\" placeholder\"Enter a User Name\" />" +
                "<span class=\"input-group-btn\">" +
                "<button class=\"btn btn-primary\" ng-click=\"ctrl.changeView()\">GO</button>" +
                "</span>" +
                "</span>" +
                "</form>" :
                String.Empty);
        }

        private static bool IsTestUser(string _userName)
        {
            string testUsers = ConfigurationManager.AppSettings["TestAsUsers"];

            if (!String.IsNullOrEmpty(testUsers) && testUsers.ToLower().Replace(" ", String.Empty).Split(',').Contains(_userName.ToLower()))
            {
                return true;
            }

            return UserInGroup(ConfigurationManager.AppSettings["TestAsGroups"]);
        }

        private static bool IsValidUserName(string un)
        {
            try
            {
                try
                { //attempt to get information from AD
                    string domain = GetFqd((!string.IsNullOrEmpty(un) && un.Contains("\\") ? un.Split('\\')[0] : string.Empty));
                    using (System.DirectoryServices.AccountManagement.PrincipalContext ctx = new System.DirectoryServices.AccountManagement.PrincipalContext(System.DirectoryServices.AccountManagement.ContextType.Domain, domain))
                    {
                        using (System.DirectoryServices.AccountManagement.UserPrincipal up = System.DirectoryServices.AccountManagement.UserPrincipal.FindByIdentity(ctx, un ?? throw new ArgumentNullException(nameof(un))))
                        {
                            if (up != null)
                                using (System.DirectoryServices.DirectoryEntry de =
                                    (System.DirectoryServices.DirectoryEntry)up.GetUnderlyingObject())
                                {
                                    System.DirectoryServices.PropertyCollection
                                        pc = de.Properties; //all properties AD maintains for a user
                                    //List<string> availableProperties = new List<string>();
                                    //foreach (string pn in pc.PropertyNames)
                                    //{
                                    //    availableProperties.Add(String.Format("{0} -> {1}", pn, pc[pn].Value));
                                    //}
                                    _UserInfo = new AdUser()
                                    {
                                        ObjectGuid =
                                            BitConverter.ToString((byte[])pc["objectguid"].Value)
                                                .Replace("-", string.Empty),
                                        UserName = un,
                                        EmployeeNumber = (string)pc["employeenumber"].Value,
                                        FirstName = up.GivenName,
                                        MiddleName = up.MiddleName,
                                        LastName = up.Surname,
                                        DisplayName = up.DisplayName,
                                        EmailAddress = up.EmailAddress,
                                        OfficePhoneNumber = up.VoiceTelephoneNumber,
                                        MobilePhoneNumber = (string)pc["mobile"].Value,
                                        Title = (string)pc["title"].Value
                                    };
                                }
                        }
                    }
                }
                catch
                {
                    _UserInfo = null;
                }
                return true;    //valid/active user
            }
            catch (Exception ex)
            {
                Log(ex, MethodBase.GetCurrentMethod());
            }

            return false;
        }

        public static void ConfigureUser(string _userName, string _userAlias)
        {
            if (!string.IsNullOrEmpty(_userAlias))
            {
                if (IsTestUser(_userName) && IsValidUserName(_userAlias))
                {
                    string domain;
                    if (_userAlias.Contains("\\"))
                    {
                        domain = _userAlias.Split('\\')[0];
                        _userAlias = _userAlias.Split('\\')[1];
                    }
                    else
                    {
                        domain = _UserName.Split('\\')[0];
                    }

                    _UserName = string.Format("{0}\\{1}", domain, _userAlias);
                }
            }
        }

        public static bool UserIsAdmin(string _userName)
        {
            try
            {
                string users = ConfigurationManager.AppSettings["AdminUsers"];
                string groups = ConfigurationManager.AppSettings["AdminGroups"];

                if (!String.IsNullOrEmpty(users))   //test the individual user list
                {
                    string[] userList = users.ToLower().Replace(" ", string.Empty).Split(',');  //an array of users

                    if (userList.Contains(_userName.ToLower()))
                    {
                        return true;
                    }
                }

                if (!String.IsNullOrEmpty(groups))
                {
                    return UserInGroup(groups);  //test the AD group list
                }
            }
            catch (Exception ex)
            {
                Log(ex, MethodBase.GetCurrentMethod(), "");   //log the error before moving on
            }

            return false;
        }

        private static bool UserInGroup(string groups)
        {
            if (!string.IsNullOrEmpty(groups))  //test the AD group list
            {
                String[] groupList = groups.ToLower().Replace(" ", String.Empty).Split(',');    //an array of groups
                foreach (string group in groupList)
                {
                    if (!group.Contains("\\"))  //ensure the group has a domain
                    {
                        //inform of missing domain and skip to the next group
                        Log(new Exception(String.Format("Configuration value '{0}' must contain a domain (i.e. [domain]\\{0})", group)), MethodBase.GetCurrentMethod(), null, ErrorLogger.SeverityTypes.Information);
                        continue;
                    }
                    using (System.DirectoryServices.AccountManagement.PrincipalContext ctx = new System.DirectoryServices.AccountManagement.PrincipalContext(System.DirectoryServices.AccountManagement.ContextType.Domain, GetFqd(group.Split('\\')[0])))
                    {
                        using (System.DirectoryServices.AccountManagement.GroupPrincipal gp = System.DirectoryServices.AccountManagement.GroupPrincipal.FindByIdentity(ctx, group))
                        {
                            using (System.DirectoryServices.AccountManagement.UserPrincipal up = System.DirectoryServices.AccountManagement.UserPrincipal.FindByIdentity(ctx, _UserName))    //user object
                            {
                                if (up != null && gp != null)
                                {  //ensure both the user and the group exist
                                    if (gp.GetMembers(true).Contains(up))   //recursively check for user in root group and member groups
                                    {
                                        return true;
                                    }
                                }
                            }
                        }
                    }
                }
                //using (System.Security.Principal.WindowsIdentity userID = new System.Security.Principal.WindowsIdentity(GetUPN()))   //windows user identity
                //{
                //    System.Security.Principal.WindowsPrincipal principal = new System.Security.Principal.WindowsPrincipal(userID);  //user's AD info including group memberships
                //    string[] groupList = groups.ToLower().Replace(" ", string.Empty).Split(',');  //an array of groups
                //    foreach (string group in groupList)
                //    {
                //        if (principal.IsInRole(group))
                //        {   //check if the user is in this group
                //            return true;
                //        }
                //    }
                //}
            }
            return false;
        }

        private static string GetFqd(string domain)
        {
            if (string.IsNullOrEmpty(domain))
            {
                domain = _UserName.Split('\\')[0];  //default domain is current user's domain
            }

            string upnDomains = ConfigurationManager.AppSettings["UPNDomains"];
            if (!string.IsNullOrEmpty(upnDomains))  //compare the domain with the UPN domain list
            {
                string d = (from upn in upnDomains.ToLower().Replace(" ", string.Empty).Split(',') where upn.Contains(string.Format("{0}:", domain.ToLower())) select upn).FirstOrDefault();

                if (!string.IsNullOrEmpty(d))
                {
                    return d.Split(':')[1];
                }
            }
            return domain;  //just return the original domain
        }

        #endregion

        #region DemoOnly

        public static string Path()
        {
            return _Path;
        }

        public static ReturnError SendEmail(string userName)
        {
            ReturnError retVal = null;

            try
            {
                DemoNotifications.SendDemoEmail(userName, DbTest());
            }
            catch (Exception ex)
            {
                retVal = new ReturnError { Message = ex.Message };
            }

            return retVal;
        }

        //*******************
        //For Demo purposes only

        public static List<Data> Data(string _dataFile)
        {
            List<Data> newList = new List<Data>();

            if (File.Exists(_dataFile))
            {
                using (StreamReader sr = new StreamReader(File.OpenRead(_dataFile)))
                {
                    string line = sr.ReadLine();
                    while (!String.IsNullOrEmpty(line))
                    {
                        newList.Add(new Data { Val = line });
                        line = sr.ReadLine();
                    }
                }
            }
            return newList;
        }

        public static List<EmployeeInformation> DbTest()
        {
            using (var db = new AppDbTemplateEntities())
            {
                return db.EmployeeInformations
                    .Where(x => x.CurrentStatusCode.ToLower() != "t")
                    .OrderBy(x => x.LastHireDate)
                    .Take(10)
                    .ToList();
            }
        }
        public static void Wait(int seconds)
        {
            Wait(seconds, 0);
        }

        public static void Wait(int waitSeconds, int maxWaitSeconds)
        {
            if (waitSeconds > maxWaitSeconds)
            {
                System.Threading.Thread.Sleep((waitSeconds - maxWaitSeconds) * 1000);    //ensure we wait at least max wait seconds
            }
        }

        public static string GetUser()
        {
            IsValidUserName(_UserName); //get user's ad information
            bool isAdmin = UserIsAdmin(_UserName);

            return Newtonsoft.Json.JsonConvert.SerializeObject(new
            {
                AdminLink = (isAdmin ? "<a href=\"#/admin\">Administration</a>" : string.Empty),
                AdminOption = BuildRunAsOption(isAdmin),
                UserInfo = _UserInfo,
                IsAdmin = isAdmin
            });
        }

        public static bool UpdateUserInfo()
        {
            try
            {
                string domain = GetFqd((!string.IsNullOrEmpty(_UserName) && _UserName.Contains("\\") ? _UserName.Split('\\')[0] : string.Empty));
                using (System.DirectoryServices.AccountManagement.PrincipalContext ctx = new System.DirectoryServices.AccountManagement.PrincipalContext(System.DirectoryServices.AccountManagement.ContextType.Domain, domain))
                {
                    // ReSharper disable once UnusedVariable
                    bool val = ctx.ValidateCredentials(null, null, System.DirectoryServices.AccountManagement.ContextOptions.Negotiate);
                    using (System.DirectoryServices.AccountManagement.UserPrincipal up = System.DirectoryServices.AccountManagement.UserPrincipal.FindByIdentity(ctx, _UserName))
                    {
                        // ReSharper disable once UnusedVariable
                        if (up != null)
                            using (System.DirectoryServices.DirectoryEntry de =
                                (System.DirectoryServices.DirectoryEntry)up.GetUnderlyingObject())
                            {
                                //string adProperty = "";
                                //if (!de.Properties.Contains(adProperty))
                                //{
                                //    throw new Exception(String.Format("Property {0} does not exist for user {1}", adProperty, userID.Name));
                                //}
                                //switch(adProperty.ToLower()) {
                                //    case "accountexpires":
                                //    case "badpasswordtime":
                                //    case "lastlogon":
                                //    case "pwlastset":
                                //    case "whencreated":  //examples of AD date fields
                                //        DateTime adVal = SDHelpers.ADHelper.FromADDate(de.Properties[adProperty].Value);
                                //        //example of setting an AD Date value
                                //        //de.Properties[adProperty].Value = SDHelpers.ADHelper.ToADDate(DateTime.FromFileTimeUtc(0)); //0 for never(1 / 1 / 1601)-- i.e. for account expiration
                                //        //de.Properties[adProperty].Value = SDHelpers.ADHelper.ToADDate(DateTime.Now.AddMonths(3));   //actual date value
                                //        break;
                                //    case "objectguid":  //example of binary array (GUID) values
                                //        string adVal = SDHelpers.ADHelper.FromBinaryArray((byte[])de.Properties[adProperty].Value);   //equivilent to SDHelpers.ADHelper.FromBinaryArray(de.Properties(adProperty).Value, True)
                                //        //for no hypens
                                //        //string adVal = SDHelpers.ADHelper.FromBinaryArray((byte[])de.Properties[adProperty].Value, false);
                                //        break;
                                //    default:
                                //        string adVal = (string)de.Properties[adProperty].Value;
                                //        //example of setting an AD value
                                //        //de.Properties[adProperty].Value = "somevalue";
                                //        break;
                                //}
                                //  de.CommitChanges();   //save the changes   
                                return true;
                            }
                    }
                }
            }
            catch (Exception)
            {
                return false;   //error creating the windowidentity object -- not a valid user
            }

            return false;
        }

        #endregion

        #region ErrorLogger

        public static LogResponse LogLocalError(SDError e)
        {
            try
            {
                return ErrorLogger.LogError(e);
            }
            catch (Exception ex)
            {
                return new LogResponse { LogMessage = ex.Message };
            }
        }

        public static void Log(Exception ex)
        {
            Log(ex, null, null);
        }

        public static void Log(Exception ex, MethodBase mb)
        {
            Log(ex, mb, null);
        }

        public static void Log(Exception ex, MethodBase mb, string additionalInfo)
        {
            Log(ex, mb, additionalInfo, ErrorLogger.SeverityTypes.Error);
        }

        // ReSharper disable once UnusedMember.Local
        private void LogInfo(string message)
        {
            // ReSharper disable once IntroduceOptionalParameters.Local
            LogInfo(message, null, null);
        }

        // ReSharper disable once UnusedMember.Local
        private void LogInfo(string message, MethodBase mb)
        {
            // ReSharper disable once IntroduceOptionalParameters.Local
            LogInfo(message, mb, null);
        }

        private void LogInfo(string message, MethodBase mb, string additionalInfo)
        {
            Log(new Exception(message), mb, additionalInfo, ErrorLogger.SeverityTypes.Information);
        }

        // ReSharper disable once UnusedMember.Local
        private void LogWarn(string message)
        {
            // ReSharper disable once IntroduceOptionalParameters.Local
            LogWarn(message, null, null);
        }

        // ReSharper disable once UnusedMember.Local
        private void LogWarn(string message, MethodBase mb)
        {
            // ReSharper disable once IntroduceOptionalParameters.Local
            LogWarn(message, mb, null);
        }

        private void LogWarn(string message, MethodBase mb, string additionalInfo)
        {
            Log(new Exception(message), mb, additionalInfo, ErrorLogger.SeverityTypes.Warning);
        }

        public static void Log(Exception ex, MethodBase mb, string additionalInfo, ErrorLogger.SeverityTypes severityType)
        {
            if (!string.IsNullOrEmpty(_LogLocation))
            {
                ErrorLogger.UriBase = _LogLocation;
            }

            //send email on errors or when set to notify for any kind of logging
            if (!string.IsNullOrEmpty(_ExceptionsEmail) && NotifySeverityLevel(severityType))
            {
                ErrorLogger.EmailAddress = _ExceptionsEmail;
            }

            if (!string.IsNullOrEmpty(additionalInfo))
            {
                ErrorLogger.AdditionalInformation = additionalInfo;
            }

            ErrorLogger.Server = _HostName;
            ErrorLogger.User = _UserName;
            switch (severityType)
            {
                case ErrorLogger.SeverityTypes.Error:
                    ErrorLogger.LogError(_Appname, ex.ToString(), mb);
                    break;
                case ErrorLogger.SeverityTypes.Information:
                    ErrorLogger.LogInformation(_Appname, ex.ToString(), mb);
                    break;
                case ErrorLogger.SeverityTypes.Warning:
                    ErrorLogger.LogWarning(_Appname, ex.ToString(), mb);
                    break;
            }
        }

        private static bool NotifySeverityLevel(ErrorLogger.SeverityTypes severityType)
        {
            switch (_NotifySeverityLevel)
            {
                case 1:
                    return severityType.Equals(ErrorLogger.SeverityTypes.Error);
                case 2:
                    return severityType.Equals(ErrorLogger.SeverityTypes.Error) || severityType.Equals(ErrorLogger.SeverityTypes.Warning);
                case 3:
                    return true;    //notify of all severities
                default:
                    return false;
            }
        }

        #endregion
    }
}
