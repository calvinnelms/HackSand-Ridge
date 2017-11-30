
void setup() {
  // put your setup code here, to run once:
Serial.begin(9600);
}

void loop() {
  // put your main code here, to run repeatedly:
 int sensorValue = analogRead(A0);
 randomSeed(sensorValue);
Serial.println(random(1,100)/50.0+39);
while(1){}
}
