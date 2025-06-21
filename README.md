# UC Berkeley AI Hackathon 2025

### **Smart-Shopper** — “Where should I buy it, and why?”

> **24-hour mission:** Build a split-screen web app that recommends the best store based on **price** and **quality** (with a **balanced** mode)—using only sponsor APIs that add *real* value.

---

## 1 · Problem & Vision

Shoppers still juggle trade-offs, but for an MVP we ignore location:

1. **Cheap** – keep the receipt small
2. **Good** – don’t sacrifice quality

Smart-Shopper weighs just those two factors (plus a 50 / 50 balanced option) and *explains the trade-off* in plain language.

---

## 2 · Sponsor Stack (rationalised)

| Component                         | Why It Matters                                        | Sponsor API                            |
| --------------------------------- | ----------------------------------------------------- | -------------------------------------- |
| **LLM Orchestration & Reasoning** | Two fast Gemini-Flash agents behind a single API key. | **Letta** (routes to Gemini 2.5 Flash) |
| **Hover Micro-Summaries**         | Sub-100 ms, 60-token blurbs for map pins.             | **Groq** Llama-3-8B                    |
| **Data Storage**                  | Catalog prices + review stars.                        | **PostgreSQL**                         |
| **Front-End Maps**                | Pretty pins; no distance math.                        | **Leaflet / Mapbox tiles**             |

All other potential sponsor APIs were dropped because they added latency or duplicated work.

---

## 3 · Two-Agent Architecture

| Agent                             | Job                                                                                                                             | Tool(s)                                      | Output                                                       |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------ |
| **Agent 1 – Ingredient Resolver** | Turn any user text or dish name into a **canonical ingredient list**. Handles synonyms (*“flour” → “all-purpose flour”*).       | `getRecipeIngredients`, `normalizeItemNames` | `json { "ingredients": ["all-purpose flour","milk","egg"] }` |
| **Agent 2 – Store Recommender**   | Call `/rank` with the ingredient list and a mode (`price`, `quality`, `balanced`). Return: **top pick, 3 runners-up, 1 avoid**. | `rankStores`                                 | Human-readable answer **+** JSON fallback block              |

A five-line Python wrapper (`shop()`) chains Agent 1 → Agent 2.

---

## 4 · Backend API

### 4.1 `/rank` (POST)

```jsonc
# request body
{
  "ingredients": ["all-purpose flour", "milk", "egg"],
  "mode": "quality"          // "price" | "quality" | "balanced"
}
```

| Mode       |  wprice | wquality |
| ---------- | :-----: | :------: |
| `price`    | **0.7** |    0.3   |
| `quality`  |   0.3   |  **0.7** |
| `balanced` |   0.5   |    0.5   |

*Lower score = better. Price is min-max-normalised; quality uses (5★ − stars).*

```jsonc
# example response
{
  "top_pick":   { "id":"st02","name":"FreshMart","reason":"4.8★ reviews & mid-pack price" },
  "runners_up": [
    { "id":"st05","name":"BudgetFoods","reason":"cheapest basket but lower stars" },
    { "id":"st03","name":"GreenGrocer","reason":"best organic rating" },
    { "id":"st01","name":"MegaStore","reason":"good price/quality blend" }
  ],
  "avoid":      { "id":"st04","name":"CornerExpress","reason":"high price, 3★ average" }
}
```

---

## 5 · Project Layout

```
backend/
  main.py            # FastAPI + /rank
  ranking.py         # scoring logic
  data_seed.py       # storeprice.json + reviews.json → Postgres
frontend/
  src/
    App.jsx          # two-pane layout
    MapPane.jsx      # Leaflet + Groq hover
    ChatPane.jsx     # Letta chain (Agent1 → Agent2)
data/
  storeprice.json    # price catalog
  reviews.json       # quality data
README.md
```

---

## 6 · Local Dev Quick-Start

```bash
# clone
git clone <repo> && cd <repo>

# install deps
pnpm i
python -m venv .venv && source .venv/bin/activate
pip install -r backend/requirements.txt

# env
export LETTA_API_KEY=...
export GEMINI_API_KEY=...      # configured inside Letta
export GROQ_API_KEY=...
export POSTGRES_URL=postgres://...
export MAPBOX_TOKEN=...        # if using Mapbox tiles

# seed + run
python backend/data_seed.py
uvicorn backend.main:app --reload
pnpm --filter frontend dev
```

---

## 7 · 24-Hour Task Board (updated)

|       Hrs | ✅    | Deliverable                                 |
| --------: | ---- | ------------------------------------------- |
|   **0–2** | \[ ] | Repo boot-strap, env vars                   |
|   **2–4** | \[ ] | Seed Postgres with prices + reviews         |
|   **4–6** | \[ ] | FastAPI `/rank` with 2-factor weights       |
|   **6–8** | \[ ] | Register `rankStores` tool in Letta         |
|  **8–10** | \[ ] | Agent 1 prompt + tools                      |
| **10–12** | \[ ] | Agent 2 prompt + tool                       |
| **12–14** | \[ ] | Write 5-line Python chain wrapper           |
| **14–17** | \[ ] | React two-pane scaffold; Groq hover         |
| **17–19** | \[ ] | Connect chain to chat pane; add mode toggle |
| **19–21** | \[ ] | Caching, DB indexes, mobile tweaks          |
| **21–24** | \[ ] | Demo video, README polish, submit 🚀        |

---

## 8 · Nice-to-Haves (post-demo)

* 🛒 **Per-item cart optimiser**
* 🔔 **Letta cron** – daily “price drop” alerts
* 📱 **Offline PWA** – static catalog download

---

## 9 · License & Thanks

MIT.
Huge thanks to **Letta**, **Groq**, and the UC Berkeley AI Hackathon crew for caffeine and credits.

> *Ship fast, save shoppers, crash later.*
