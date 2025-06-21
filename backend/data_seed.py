# backend/data_seed.py
import os, json, decimal, psycopg2, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
DATA = ROOT / "data"
dsn = os.getenv("POSTGRES_URL") \
      or "postgresql://smartshopper:strongpassword@localhost:5432/smartshopper"
conn = psycopg2.connect(dsn)

cur  = conn.cursor()

cur.execute("""
CREATE TABLE IF NOT EXISTS price (
  store_id TEXT,
  item     TEXT,
  price    NUMERIC
);
CREATE TABLE IF NOT EXISTS review (
  store_id TEXT,
  stars    NUMERIC
);
""")

# 1. load prices
with open(DATA / "storepriceTEST.json") as f:
    for row in json.load(f):                     # [{store_id,item,price}, …]
        cur.execute(
            "INSERT INTO price VALUES (%s,%s,%s)",
            (row["store_id"], row["item"].lower(),
             decimal.Decimal(str(row["price"])))
        )

# 2. load reviews
with open(DATA / "reviewsTEST.json") as f:
    for row in json.load(f):                     # [{store_id,stars}, …]
        cur.execute(
            "INSERT INTO review VALUES (%s,%s)",
            (row["store_id"], decimal.Decimal(str(row["stars"])))
        )

conn.commit()
print("Data seeded.")
