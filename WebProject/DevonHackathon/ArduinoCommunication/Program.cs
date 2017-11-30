using System;
using System.Collections.Generic;
using System.IO.Ports;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ArduinoCommunication
{
    class Program
    { 


        //Code to read serial data. Find out more at http://www.therobotlab.co.uk/2011/read-serial-c-sharp-arduino-tutorial/.
        //-------------------------------------------------------------------------------------------------------------------------------------
        //Set up the serial port. Use the following values for an Arduino, changing "COM3" to your own Serial Port.
        SerialPort sp = new SerialPort("COM4", 9600, Parity.None, 8, StopBits.One);

        static void Main(string[] args)
        {
            Console.WriteLine("Application Starting");
           
            //Console.ReadLine();
            //Open the Program function
            new Program();
        }

        private Program()
        {
            //Set the datareceived event handler
            sp.DataReceived += new SerialDataReceivedEventHandler(sp_DataReceived);
            //Open the serial port
            sp.Open();
            //Read from the console, to stop it from closing.
            Console.Read();
        }

        private void sp_DataReceived(object sender, SerialDataReceivedEventArgs e)
        {
            var val = sp.ReadExisting();
            //Write the serial port data to the console.
            Console.Write(val);

            using (var db = new SDHackathonSQLEntities())
            {
                db.arduinoes.Add(new arduino
                {
                    ID = 0
                    , LENGTH = Convert.ToDouble(val)
                });

                db.SaveChanges();
            }

            Console.WriteLine("Value written to database");
        }
    }
}
