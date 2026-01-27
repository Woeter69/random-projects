/*
Program: Calculator
Description: Performs basic arithmetic operations on two integers.

Sample I/O:
  Enter two integers: 10 5
  Addition: 10 + 5 = 15
  Subtraction: 10 - 5 = 5
  Multiplication: 10 * 5 = 50
  Division: 10 / 5 = 2
  Modulo: 10 % 5 = 0
*/
#include <iostream>
using namespace std;

int main() {
    // Declare variables to store the two input numbers
    int a, b;
    
    // Get input from user - two integers separated by space or newline
    cout << "Enter two integers: ";
    cin >> a >> b;
    
    // Perform and display addition
    cout << "Addition: " << a << " + " << b << " = " << a + b << endl;
    
    // Perform and display subtraction
    cout << "Subtraction: " << a << " - " << b << " = " << a - b << endl;
    
    // Perform and display multiplication
    cout << "Multiplication: " << a << " * " << b << " = " << a * b << endl;
    
    // Perform and display division (integer division)
    cout << "Division: " << a << " / " << b << " = " << a / b << endl;
    
    // Perform and display modulo (remainder)
    cout << "Modulo: " << a << " % " << b << " = " << a % b << endl;
    
    return 0; // Indicate successful program completion
}

    