import random

number = random.randint(1, 100)
print(number)

def guess_number():
    attempts = 0
    while True:
        try:
            guess = int(input("Guess a number between 1 and 100: "))
            attempts += 1
            differnce = abs(guess - number)
            if differnce <= 5 and guess < number:
                print("Low but very close!")
            elif guess < number:
                print("Too low! Try again.")
            elif differnce <= 5 and guess > number:
                print("High but very close!")
            elif guess > number:
                print("Too high! Try again.")
            else:
                print(f"Congratulations! You've guessed the number {number} in {attempts} attempts.")
                break
        except ValueError:
            print("Please enter a valid integer.")
  
guess_number()