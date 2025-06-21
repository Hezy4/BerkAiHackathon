# UC Berkeley AI Hackathon 2025

### **Smart-Shopper** — “Where should I buy it, and why?”

> **24-hour mission:** Build a split-screen web app that ingests store-catalog data and recommends the best store based on **price, quality,** and **distance**—using only sponsor APIs that add *real* value.

---

## 1 · Problem & vision

Shoppers weigh three constants:

1. **Cheap** – keep the receipt small
2. **Good** – don’t sacrifice quality
3. **Close** – limit travel time

Smart-Shopper balances all three in real-time, then *explains the trade-off* in plain language.

---

## 2 · Core Feature Matrix

| Pane             | User Experience                                                                                   | Tech / Sponsor                                                                    |
| ---------------- | ------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| **Left (Map)**   | Leaflet map with store pins → hover shows a 50-word blurb; click syncs chat                       | **Leaflet/Mapbox**, **Groq** LLM (ultra-fast micro-summaries)                     |
| **Right (Chat)** | Conversational assistant recommends stores, embeds “Open on Map” buttons, justifies every ranking | **Letta** agent → routes reasoning calls to an underlying **Google Gemini** model |
| **Backend**      | Real-time scoring (price, quality, distance) with adjustable sliders; REST + WebSocket            | **FastAPI**, **PostgreSQL**, **Fetch.ai** (geocode & distance)                    |
| **Data**         | One-shot JSON parser → DB seed script (python)                                                    | —                                                                                 |

> **Why these APIs and only these?**
> • **Letta** simplifies LLM orchestration + function calls; we point it at Gemini and gain agent tooling.
> • **Groq** is ideal for sub-100 ms hover blurbs.
> • **Fetch.ai** gives drop-in geospatial helpers.
> Any other sponsor would be overhead for this scope.

---

## 3 · Project Layout

```
backend/
  main.py            # FastAPI entry
  ranking.py         # scoring logic
  data_seed.py       # parse JSON → Postgres
frontend/
  src/
    App.jsx          # two-pane flex layout
    MapPane.jsx      # Leaflet + Groq hover
    ChatPane.jsx     # Letta-streamed chat
data/
  storeprice.json    # sample catalog
README.md
```

---

## 4 · Local Dev Quick-Start

```bash
# clone
git clone <repo> && cd <repo>

# install deps
pnpm i
python -m venv .venv && source .venv/bin/activate
pip install -r backend/requirements.txt

# environment
export LETTA_API_KEY=...
export GROQ_API_KEY=...
export FETCHAI_API_KEY=...
export POSTGRES_URL=postgres://...
# Letta will forward to your Gemini key internally or via its settings

# seed + run
python backend/data_seed.py
uvicorn backend.main:app --reload      # API
pnpm --filter frontend dev             # React/Vite
```

---

## 5 · Scoring Formula

$$
\text{rankScore} = 
w_p \cdot \text{normPrice} +
w_q \cdot \text{qualityScore} +
w_d \cdot \text{distanceKm}
$$

Defaults: **wₚ = 0.5**, **w\_q = 0.3**, **w\_d = 0.2**.
All inputs are min–max normalised so **lower = better**.

---

## 6 · 24-Hour Task Board

| Hours       | ✅    | Deliverable                                               |
| ----------- | ---- | --------------------------------------------------------- |
| **0 – 2**   | \[ ] | Repo boot-strap, env-vars, Trello board                   |
| **2 – 4**   | \[ ] | Parse `storeprice.json`, Fetch.ai geocode, seed Postgres  |
| **4 – 7**   | \[ ] | FastAPI skeleton (`/rank`, `/summary`, WS chat stream)    |
| **7 – 10**  | \[ ] | Letta agent → Gemini function-calling for ranking/explain |
| **10 – 13** | \[ ] | React + Vite scaffold; split-pane layout                  |
| **13 – 15** | \[ ] | Leaflet map, Groq hover summaries                         |
| **15 – 17** | \[ ] | Map-to-chat sync; weight sliders; live re-rank            |
| **17 – 20** | \[ ] | Mobile tweaks; cache Groq responses; DB indexes           |
| **20 – 22** | \[ ] | QA + performance pass (Letta, latency budget)             |
| **22 – 24** | \[ ] | 90-sec demo video, README polish, submit 🚀               |

---

## 7 · Nice-to-Haves (only if time remains)

* 🛒 **Per-item cart optimizer**
* 🔔 **Price-drop push alerts** via Letta scheduled function
* 📱 **PWA offline mode** (static tiles & catalog)

---

## 8 · License & Acknowledgements

MIT.
Thanks to **Letta**, **Groq**, and **Fetch.ai** for API credits, and to the UC Berkeley AI Hackathon crew for the caffeine.

> *Ship fast, save shoppers, crash later.*
