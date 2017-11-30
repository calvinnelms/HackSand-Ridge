using System.Web.Mvc;
using System.Web.Routing;

namespace DrillPipe.Config
{
    public class RouteConfig
    {
        public static void RegisterRoutes(RouteCollection routes)
        {
            routes.IgnoreRoute("{resource}.axd/{*pathInfo}");

            routes.MapPageRoute("DefaultIndex", "", "~/index.html");

            routes.MapRoute(
                "Default",
                "{controller}/{action}/{id}",
                new { controller = "DrillPipe", action = "Index", id = UrlParameter.Optional },
                new[] { "DrillPipe.Controllers" }
            );
        }
    }
}