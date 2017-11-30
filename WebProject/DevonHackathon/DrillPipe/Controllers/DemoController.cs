using DrillPipe.DataAccessLayer;
using DrillPipe.Filters;
using SDHelpers.ErrorLoggerWrapper.ErrorLoggerSvc;
using SDHelpers.ErrorLoggerWrapper;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.Reflection;
using System.Web;
using System.Web.Mvc;
using System.Text;

namespace DrillPipe.Controllers
{
    [OutputCache(VaryByParam = "*", Duration = 0, NoStore = true)]          //Disables cache for all actions.
    //[CompressFilter]                                                        //Compresses returned data, see CompressFilter in ActionFilter.cs
    public class DemoController : Controller
    {
        [HttpPost]
        public JsonResult CreatePipeSelection(pipeselection pipeSelection)
        {
            try
            {
                var ps = Repository.CreatePipeSelection(pipeSelection);

                return Json(ps, JsonRequestBehavior.AllowGet);
            }
            catch (Exception e)
            {
                throw;
            }
        }

        [HttpPost]
        public JsonResult CreatePipeLengths(List<pipelength> pipeLengths)
        {
            try
            {
                var pl = Repository.CreatePipeLengths(pipeLengths);

                return Json(pl, JsonRequestBehavior.AllowGet);
            }
            catch (Exception e)
            {
                Console.WriteLine(e);
                throw;
            }
        }

        [HttpGet]
        public JsonResult GetWells()
        {
            try
            {
                var w = Repository.Wells();

                return Json(w, JsonRequestBehavior.AllowGet);
            }
            catch (Exception e)
            {
                throw;
            }
        }

        [HttpGet]
        public JsonResult GetPresets()
        {
            try
            {
                var p = Repository.Presets();

                return Json(p, JsonRequestBehavior.AllowGet);
            }
            catch (Exception e)
            {
                throw;
            }
        }

        [HttpGet]
        public JsonResult GetMeasurement()
        {
            try
            {
                var m = Repository.GetMeasurement();

                return Json(m, JsonRequestBehavior.AllowGet);
            }
            catch (Exception e)
            {
                throw;
            }
        }

        public JsonResult DeleteArduino()
        {
            try
            {
                Repository.DeleteArduino();

                return Json("Success", JsonRequestBehavior.AllowGet);
            }
            catch (Exception e)
            {
                throw;
            }
        }

        [HttpGet]
        public JsonResult GetAll()
        {
            try
            {
                var a = Repository.All();

                return Json(a, JsonRequestBehavior.AllowGet);
            }
            catch (Exception e)
            {
                throw;
            }
        }

        [HttpGet]
        public string GetDemo(string alias)
        {
            try
            {
                Repository.ConfigureUser(User.Identity.Name, alias);

                Repository.Wait(5);

                return Repository.GetUser();
            }
            catch (Exception ex)
            {
                Repository.Log(ex, MethodBase.GetCurrentMethod());

                throw;
            }
        }

        [HttpPost]
        public JsonResult FileUpload()
        {
            HttpFileCollectionBase files = Request.Files;

            int fileCount = 0;
            // ReSharper disable once UnusedVariable
            var str = String.Empty;

            if (files != null && files.Count > 0)
            {
                for (int i = 0; i < files.Count; i++)
                {
                    //***to get it to a binary array to store in sql:
                    //using (System.IO.MemoryStream ms = new System.IO.MemoryStream())
                    //{
                    //    files[i].InputStream.CopyTo(ms);
                    //    //***to store as a binary
                    //    //StoreDataToDatabase(files[i].FileName, files[i].ContentType, ms.ToArray());
                    //    //***to store as a base64-encoded string - useful for redisplaying images in html
                    //    //StoreDataToDatabase(files[i].FileName, String.Format("data:{0};base64,{1}", files[i].ContentType, Convert.ToBase64String(ms.ToArray())));
                    //    //***for a demo on redisplaying in HTML, uncomment the following three lines and return str in place of fileCount
                    //    if (i == 0)
                    //    {
                    //        str = Newtonsoft.Json.JsonConvert.SerializeObject(new { base64 = String.Format("data:{0};base64,{1}", files[i].ContentType, Convert.ToBase64String(ms.ToArray())) });
                    //    }
                    //}
                    //***to store it to the file system:
                    //string filePath = HttpContext.Current.Server.MapPath("~/uploads");
                    //if(!Directory.Exists(filePath)){
                    //    Directory.CreateDirectory(filePath);
                    //}
                    //files[i].SaveAs(String.Format("{0}/{1}", filePath, files[i].FileName));
                    fileCount++;
                }
            }
            return Json(fileCount.ToString(), JsonRequestBehavior.AllowGet); //str; //
        }

        [HttpGet]
        public JsonResult GetData()
        {
            try
            {
                string dataFile = System.Web.HttpContext.Current.Server.MapPath(Repository.Path());

                List<Data> d = Repository.Data(dataFile);

                return Json(d, JsonRequestBehavior.AllowGet);// JsonConvert.SerializeObject(d);
            }
            catch (Exception ex)
            {
                Repository.Log(ex, MethodBase.GetCurrentMethod());

                throw;
            }
        }

        [HttpGet]
        public string GetKey()
        {
            try
            {
                return ConfigurationManager.AppSettings["secret"];
            }
            catch (Exception ex)
            {
                Repository.Log(ex, MethodBase.GetCurrentMethod());

                throw;
            }
        }

        [HttpGet]
        public string GetUser(string alias)
        {
            try
            {
                Repository.ConfigureUser(User.Identity.Name, alias);

                return Repository.GetUser();
            }
            catch (Exception ex)
            {
                Repository.Log(ex, MethodBase.GetCurrentMethod());

                throw;
            }
        }

        [HttpGet]
        public void Redirect()
        {
            StringBuilder sb = new StringBuilder();
            sb.AppendFormat("{0}#", Request.ApplicationPath);

            foreach (string key in Request.QueryString)
            {
                string value = Request.QueryString[key];

                if (!String.IsNullOrEmpty(value))
                {
                    //exclude "_" querystring parameters
                    if (key != null && key.Equals("_"))
                    {
                        sb.AppendFormat("/{0}", key);
                    }
                }
            }

            sb.Append("/");

            Response.Redirect(sb.ToString());
        }

    }
}
