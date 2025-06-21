# backend/main.py  (excerpt)
from fastapi import FastAPI
from pydantic import BaseModel
import psycopg2
import os
import numpy as np

app  = FastAPI()
conn = psycopg2.connect(dsn=os.getenv("POSTGRES_URL"))

class RankReq(BaseModel):
    ingredients: list[str]
    mode: str = "balanced"    # price | quality | balanced

WEIGHTS = {
    "price":     (0.7, 0.3),
    "quality":   (0.3, 0.7),
    "balanced":  (0.5, 0.5)
}

@app.post("/rank")
def rank(req: RankReq):
    wp, wq = WEIGHTS[req.mode]

    # 1. sum basket cost per store
    cur = conn.cursor()
    format_strings = ','.join(['%s'] * len(req.ingredients))
    cur.execute(f"""
        SELECT store_id, SUM(price) AS basket_cost
        FROM price
        WHERE item IN ({format_strings})
        GROUP BY store_id;
    """, [i.lower() for i in req.ingredients])
    cost_map = {row[0]: float(row[1]) for row in cur.fetchall()}

    # 2. get review stars
    cur.execute("SELECT store_id, stars FROM review;")
    star_map = {row[0]: float(row[1]) for row in cur.fetchall()}

    # 3. normalise to 0-1
    costs  = np.array(list(cost_map.values()))
    stars  = np.array([star_map.get(s, 3.0) for s in cost_map.keys()])  # default 3★

    norm_cost = (costs - costs.min()) / (costs.ptp() or 1)
    norm_qual = (5 - stars - (5 - stars).min()) / ((5 - stars).ptp() or 1)

    scores = wp * norm_cost + wq * norm_qual
    stores = list(cost_map.keys())
    ranked = sorted(zip(stores, scores), key=lambda t: t[1])

    top, *rest = ranked
    avoid      = ranked[-1]

    def as_rec(t):
        sid, sc = t
        return {
            "id": sid,
            "name": sid,              # swap for display name if you have one
            "reason": f"${cost_map[sid]:.2f} basket, {star_map.get(sid,3):0.1f}★"
        }

    return {
        "top_pick":   as_rec(top),
        "runners_up": [as_rec(r) for r in rest[:3]],
        "avoid":      as_rec(avoid)
    }
