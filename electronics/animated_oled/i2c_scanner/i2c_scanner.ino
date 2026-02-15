#include <Wire.h>
void setup() {
  Wire.begin(21, 22); // SDA on 21, SCK on 22
  Serial.begin(115200);
  while (!Serial);
  Serial.println("\nI2C Scanner");
}
void loop() {
  byte error, address;
  int nDevices = 0;
  for(address = 1; address < 127; address++ ) {
    Wire.beginTransmission(address);
    error = Wire.endTransmission();
    if (error == 0) {
      Serial.print("I2C device found at address 0x");
      if (address<16) Serial.print("0");
      Serial.print(address,HEX);
      Serial.println("  !");
      nDevices++;
    }
  }
  if (nDevices == 0) Serial.println("No I2C devices found\n");
  delay(5000);
}
