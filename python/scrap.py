import requests
from bs4 import BeautifulSoup
import json

url = "https://books.toscrape.com/"

response = requests.get(url)

soup = BeautifulSoup(response.text,"html.parser")

data = []
for i in soup.select(".product_pod"):
    text = i.get_text(strip=True)
    data.append({"content":text})

with open("ideas.json","w",encoding="utf-8") as f:
    json.dump(data,f,ensure_ascii=False,indent=2)
