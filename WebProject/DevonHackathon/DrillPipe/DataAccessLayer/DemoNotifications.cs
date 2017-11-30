using System;
using System.Collections.Generic;
using SDHelpers.EmailWrapper;
using SDHelpers.ErrorLoggerWrapper;

namespace DrillPipe.DataAccessLayer
{
    public class DemoNotifications
    {
        private static string _Path = "~/EmailTemplates/";
        private static string _EmailFrom = System.Configuration.ConfigurationManager.AppSettings["EmailFrom"];

        public static void SendDemoEmail(string currentUser, List<EmployeeInformation> users)
        {   //, List<EmailAttachment> attachments){
            EmailParts ep = GetEmailTemplate("SampleEmail.txt", currentUser);
            ReplaceInfo(users, ep); // , attachments);
            SendMail(ep);
        }

        private static EmailParts GetEmailTemplate(string templateFile, string currentUser)
        {
            EmailParts ep = new EmailParts();
            templateFile = System.Web.HttpContext.Current.Server.MapPath(_Path + templateFile);
            if (System.IO.File.Exists(templateFile))
            {
                using (System.IO.StreamReader sr = new System.IO.StreamReader(templateFile))
                {
                    //ep.ToAddresses = sr.ReadLine
                    ep.ToAddresses = string.Format("{0}@sandridgeenergy.com", currentUser);
                    ep.CcAddresses = sr.ReadLine();
                    ep.BccAddresses = sr.ReadLine();
                    ep.Subject = sr.ReadLine();
                    ep.Template = sr.ReadToEnd().Replace("\r\n", "<br />");    //assumes this email to be in HTML format
                    if (string.IsNullOrEmpty(ep.CcAddresses))
                    {
                        //ensure the address is not an empty string
                        ep.CcAddresses = null;
                    }
                    if (string.IsNullOrEmpty(ep.BccAddresses))
                    {
                        //ensure the address is not an empty string
                        ep.BccAddresses = null;
                    }
                }
                return ep;
            }
            return null;
        }

        private static void ReplaceInfo(List<EmployeeInformation> users, EmailParts ep)
        {
            System.Text.StringBuilder emps = new System.Text.StringBuilder();
            emps.Append("<ul>");
            foreach (var u in users)
            {
                emps.AppendFormat("<li>{0} {1}</li>", u.FirstName, u.LastName);
            }
            emps.Append("</ul>");
            if (DateTime.Now.Day % 2 == 0)
            {
                ep.Template = ReplaceBlockText(ep.Template, GetBlockTextContents(ep.Template, "<EVENDATES>", "</EVENDATES>"), "<EVENDATES>", "</EVENDATES>");
                ep.Template = ReplaceBlockText(ep.Template, string.Empty, "<ODDDATES>", "</ODDDATES>");
            }
            else
            {
                ep.Template = ReplaceBlockText(ep.Template, string.Empty, "<EVENDATES>", "</EVENDATES>");
                ep.Template = ReplaceBlockText(ep.Template, GetBlockTextContents(ep.Template, "<ODDDATES>", "</ODDDATES>"), "<ODDDATES>", "</ODDDATES>");
            }

            ep.Subject = ep.Subject.Replace("{URL}", GetServer());
            ep.Body = ep.Template.Replace("{Employees}", emps.ToString());
        }

        private static string GetServer()
        {
            return System.Web.HttpContext.Current.Request.Url.Scheme + "://" + System.Web.HttpContext.Current.Request.Url.Authority;
        }

        private static void SendMail(EmailParts ep)
        {//, List<EmailAttachment> attachments) {
            Email mail = new Email();
            int smtpPort;

            if (String.IsNullOrEmpty(_EmailFrom))
            {
                throw new Exception("Please provide an email address for the EmailFrom setting in the web.config file");
            }
            int.TryParse(System.Configuration.ConfigurationManager.AppSettings["SMTPPort"], out smtpPort);
            mail.SMTPHost = System.Configuration.ConfigurationManager.AppSettings["SMTPHost"];
            mail.SMTPPort = smtpPort;
            mail.FromAddress = _EmailFrom;
            mail.AddToAddresses(ep.ToAddresses);
            mail.AddCCAddresses(ep.CcAddresses);
            mail.AddBCCAddresses(ep.BccAddresses);
            mail.Subject = ep.Subject;
            mail.Body = ep.Body;

            //if a log of emails being sent from this application is beneficial, uncomment the following line and add any conditional checking if content security/privacy is of concern
            //LogEmailAttempt(ep);

            //if (attachments != null && attachments.Count > 0){
            //    mail.SendAttachment(attachments);
            //}else{
            mail.SendMail();
            //}
        }

        private static void LogEmailAttempt(EmailParts ep)
        {
            string logLocation = System.Configuration.ConfigurationManager.AppSettings["LogLocation"];
            if (!String.IsNullOrEmpty(logLocation))
            {
                ErrorLogger.UriBase = logLocation;
            }

            ErrorLogger.AdditionalInformation = String.Format("From: {0}{1}To: {2}{3}CC: {4}{5}BCC: {6}{7}Subject: {8}{9}Body: {10}",
                                                                                ep.FromAddress, Environment.NewLine, ep.ToAddresses, Environment.NewLine, ep.CcAddresses, Environment.NewLine, ep.BccAddresses, Environment.NewLine, ep.Subject, Environment.NewLine, ep.Body);
            ErrorLogger.LogInformation(System.Configuration.ConfigurationManager.AppSettings["AppName"], "Email");
        }

        private static string ReplaceBlockText(string origText, string replacementText, string beginTag, string endTag)
        {
            int beginTagIdx = origText.IndexOf(beginTag);
            int endTagIdx = origText.IndexOf(endTag);
            if (beginTagIdx >= 0 && endTagIdx > beginTagIdx)
            {
                string targetText = origText.Substring(beginTagIdx, endTagIdx + endTag.Length - beginTagIdx);
                return origText.Replace(targetText, replacementText);
            }
            else
            {
                return origText;
            }
        }

        private static string GetBlockTextContents(string text, string beginTag, string endTag)
        {
            int beginTagIdx = text.IndexOf(beginTag);
            int endTagIdx = text.IndexOf(endTag);
            if (beginTagIdx >= 0 && endTagIdx > beginTagIdx + beginTag.Length)
            {
                return text.Substring(beginTagIdx + beginTag.Length, endTagIdx - beginTagIdx - beginTag.Length);
            }
            else
            {
                return String.Empty;
            }
        }

        private class EmailParts
        {
            public string FromAddress { get; set; }
            public string ToAddresses { get; set; }
            public string CcAddresses { get; set; }
            public string BccAddresses { get; set; }
            public string Subject { get; set; }
            public string Body { get; set; }
            public string Template { get; set; }
        }
    }
}