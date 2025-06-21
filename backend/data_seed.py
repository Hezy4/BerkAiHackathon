# data_seed.py  (run once at startup)
import json, psycopg2, pathlib, decimal, os
conn = psycopg2.connect(dsn=os.getenv("POSTGRES_URL"))
cur  = conn.cursor()

cur.execute("""
CREATE TABLE IF NOT EXISTS price (
  store_id TEXT, item TEXT, price NUMERIC
);
CREATE TABLE IF NOT EXISTS review (
  store_id TEXT, stars NUMERIC
);
""")

# 1. load prices
for row in json.load(open("data/storeprice.json")):         # {store_id,item,price}
    cur.execute("INSERT INTO price VALUES (%s,%s,%s)",
                (row["store_id"], row["item"].lower(), decimal.Decimal(row["price"])))

# 2. load reviews
for row in json.load(open("data/reviews.json")):            # {store_id,stars}
    cur.execute("INSERT INTO review VALUES (%s,%s)",
                (row["store_id"], decimal.Decimal(row["stars"])))

conn.commit()
