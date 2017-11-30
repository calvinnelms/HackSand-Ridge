using System.Collections.Generic;

namespace DrillPipe.DataAccessLayer
{
    public class AdminOptions
    {
        public string AdminLink { get; set; }
        public string AdminOption { get; set; }
    }
    public class AdUser
    {
        public string ObjectGuid { get; set; }
        public string UserName { get; set; }
        public string FirstName { get; set; }
        public string MiddleName { get; set; }
        public string LastName { get; set; }
        public string DisplayName { get; set; }
        public string EmailAddress { get; set; }
        public string OfficePhoneNumber { get; set; }
        public string MobilePhoneNumber { get; set; }
        public string EmployeeNumber { get; set; }
        public string Title { get; set; }
    }
    public class Data
    {
        public string Val { get; set; }
    }
    public class ReturnError
    {
        public string Message { get; set; }
    }

    public class All
    {
        public pipeselection PipeSelection { get; set; }
        public List<pipelength> PipeLengths { get; set; }
    }
}