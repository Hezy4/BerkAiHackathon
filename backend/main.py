# backend/main.py
import os, psycopg2, numpy as np
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from orchestrator import smartshop

DB_DSN = os.getenv("POSTGRES_URL") or "postgresql://smartshopper:strongpassword@localhost:5432/smartshopper"
conn   = psycopg2.connect(DB_DSN)
app    = FastAPI()

class RankReq(BaseModel):
    ingredients: list[str] = Field(..., min_items=1)
    mode: str = Field("balanced", regex="^(price|quality|balanced)$")

WEIGHTS = {
    "price":     (0.7, 0.3),
    "quality":   (0.3, 0.7),
    "balanced":  (0.5, 0.5)
}

@app.post("/shop")
def shop(req: RankReq):
    return smartshop(" ".join(req.ingredients), req.mode)

@app.post("/rank")
def rank(req: RankReq):
    wp, wq = WEIGHTS[req.mode]

    cur = conn.cursor()
    # — prices —
    placeholders = ','.join(['%s'] * len(req.ingredients))
    cur.execute(f"""
        SELECT store_id, SUM(price)
        FROM price
        WHERE item IN ({placeholders})
        GROUP BY store_id;
    """, [i.lower() for i in req.ingredients])
    cost_map = {sid: float(total) for sid, total in cur.fetchall()}
    if not cost_map:
        raise HTTPException(404, "No matching items in catalog.")

    # — reviews —
    cur.execute("SELECT store_id, stars FROM review;")
    star_map = {sid: float(stars) for sid, stars in cur.fetchall()}

    stores = list(cost_map.keys())
    costs  = np.array([cost_map[s] for s in stores])
    quals  = np.array([5 - star_map.get(s, 3.0) for s in stores])  # invert stars

    norm_cost = (costs - costs.min()) / (costs.ptp() or 1)
    norm_qual = (quals - quals.min()) / (quals.ptp() or 1)

    scores = wp * norm_cost + wq * norm_qual
    ranked = sorted(zip(stores, scores), key=lambda t: t[1])

    def rec(t):
        sid, _ = t
        return {
            "id": sid,
            "name": sid,  # swap for display name if you have one
            "reason": f"${cost_map[sid]:.2f} basket, {star_map.get(sid,3):.1f}★"
        }

    top, *rest = ranked
    avoid      = ranked[-1]

    return {
        "top_pick":   rec(top),
        "runners_up": [rec(r) for r in rest[:3]],
        "avoid":      rec(avoid)
    }
