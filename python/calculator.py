from math import *

def ter_calc():
    print("Terminal Scientific Calculator")
    while True:
        exp = input("Enter full expression (or type 'exit' to quit): ")
        if exp.lower() == "exit":
            break

        try:
            result = eval(exp)
            print(">>>", result)
        except Exception:
            print("Error: Invalid expression")

ter_calc()
