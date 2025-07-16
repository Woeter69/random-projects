characters={}
class Character:
  def __init__(self,name,hp,power,role):
    self.name = name
    self.hp = hp
    self.power = power
    self.role = role.lower()
    characters[self.name] = self
    
  def show_info(self):
    print(f"[{self.role.upper()}] {self.name} --> HP {self.hp} Power {self.power}]")

aang=Character("Aang",500,45,"hero")
katara=Character("Katara",200,80,"hero")
zuko=Character("Zuko",600,90,"villan")

user_input = input("Enter Hero/Villan Name to check stats")

for c in characters.values():
  if c.name.lower() == user_input.lower():
    c.show_info()


  


  
