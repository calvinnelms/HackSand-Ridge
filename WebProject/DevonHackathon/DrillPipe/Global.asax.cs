using DrillPipe.Config;
using DrillPipe.DataAccessLayer;
using System;
using System.Web.Routing;
using System.Reflection;
using System.Web;
using System.Collections.Specialized;

namespace DrillPipe
{
    public class Global : System.Web.HttpApplication
    {
        protected void Application_AuthorizeRequest(Object source, EventArgs e)
        {
            try
            {
                HttpApplication app = (HttpApplication)source;
                Repository._HostName = app.Context.Request.Url.Host;

                NameValueCollection q = app.Context.Request.QueryString;

                //Check for alias param on request
                if (!string.IsNullOrEmpty(q["alias"]))
                {
                    if (app.Context.Request.LogonUserIdentity != null)
                        Repository.ConfigureUser(app.Context.Request.LogonUserIdentity.Name, q["alias"]);
                }
                else
                {
                    if (app.Context.Request.LogonUserIdentity != null)
                        Repository._UserName = app.Context.Request.LogonUserIdentity.Name;
                }
            }
            catch (Exception ex)
            {
                Repository.Log(ex, MethodBase.GetCurrentMethod());
            }
        }

        protected void Application_Start(object sender, EventArgs e)
        {
            try
            {
                RouteConfig.RegisterRoutes(RouteTable.Routes);
            }
            catch (Exception ex)
            {
                Repository.Log(ex, MethodBase.GetCurrentMethod());
            }
        }
    }
}