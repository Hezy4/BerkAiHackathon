````markdown
# UC Berkeley AI Hackathon 2025  
### “Smart-Shopper” — Multi-Agent Price & Proximity Recommender

> **Goal (24 hrs):** Build a two-pane web app that reads local store-catalog data and, using a “kitchen-sink” stack of sponsor APIs, tells users where to shop based on **price, quality,** and **distance**.

---

## 1 · Why it matters
Finding the best place to buy groceries isn’t just about the cheapest price—it’s a trade-off between cost, product quality, and how far you have to travel. Our prototype answers that in real time, and shows **why** a store was recommended.

---

## 2 · Key Features
| Pane | Functionality | APIs/Tools |
|------|---------------|------------|
| **Left (Map)** | Interactive map with store pins ➜ hover for quick summary; click syncs chat | **Leaflet/Mapbox**, **Groq** (ultra-fast hover summaries) |
| **Right (Chat)** | Natural-language conversation; dynamic recommendations with inline “Open on Map” buttons | **Google Gemini**, **Anthropic Claude** (explain-my-ranking), **Letta** agent router |
| **Backend** | Score stores via weighted formula (price, quality, distance) | Custom FastAPI + **Fetch.ai** (geo/distances) |
| **ETL / Data** | Ingest & normalize catalogs (JSON → Postgres) | **Orkes Conductor** workflow |

---

## 3 · Sponsor Tool Integration at a Glance
| Tool | Role in App |
|------|-------------|
| **Letta** | Fronts all LLM calls, routing to Gemini/Groq/Claude based on task (ranking, summary, explanation) |
| **Google Gemini** | Main chat reasoning + ranking scoring |
| **Groq** | 1-shot 60-token store hover blurbs in \<50 ms |
| **Fetch.ai** | Address-to-lat/long geocoding + Haversine distance |
| **Anthropic Claude** | “Why did you choose this store?” detailed explanations |
| **Orkes Conductor** | Kick-off ETL → Postgres → daily catalog refresh |

---

## 4 · Folder Structure
```text
├── backend/
│   ├── main.py          # FastAPI entry
│   ├── ranking.py       # weighted score
│   └── workflows/       # Orkes JSON defs
├── frontend/
│   ├── src/
│   │   ├── App.jsx      # two-pane layout
│   │   ├── MapPane.jsx  # Leaflet map + Groq hover
│   │   └── ChatPane.jsx # Gemini/Claude streaming
│   └── vite.config.js
├── data/
│   └── storeprice.json  # sample catalog (10 stores) :contentReference[oaicite:0]{index=0}
└── README.md            # you are here
````

---

## 5 · Quick-Start (local dev)

```bash
# 1. clone && install
git clone <repo> && cd repo
pnpm i && cd backend && pip install -r requirements.txt

# 2. env vars (examples)
export LETTA_API_KEY=...
export GEMINI_API_KEY=...
export GROQ_API_KEY=...
export FETCHAI_API_KEY=...
export CLAUDE_API_KEY=...
export POSTGRES_URL=postgres://...

# 3. run services
cd backend && uvicorn main:app --reload
cd ../frontend && pnpm dev
```

---

## 6 · 24-Hour Sprint Roadmap

| Time (hrs) | ✅    | Milestone & Tasks                                                                      | Owners      |
| ---------- | ---- | -------------------------------------------------------------------------------------- | ----------- |
| **0-2**    | \[ ] | Kickoff, clone repo, env vars, task board                                              | All         |
| **2-4**    | \[ ] | **ETL**: parse `storeprice.json`, geo-enrich via Fetch.ai → load to Postgres via Orkes | *Data Lead* |
| **4-6**    | \[ ] | **Backend skeleton** (FastAPI), `/rank` & `/summary` endpoints                         | *Backend*   |
| **6-9**    | \[ ] | Integrate Letta router → Gemini & Claude; unit tests for ranking logic                 | *AI Lead*   |
| **9-12**   | \[ ] | Front-end scaffolding (Vite + React), two-pane layout, Leaflet map                     | *FE Lead*   |
| **12-15**  | \[ ] | Wire Groq hover summaries; WebSocket chat stream                                       | *FE/AI*     |
| **15-18**  | \[ ] | Slider UI for weight tuning; click-to-sync map ↔ chat                                  | *UX*        |
| **18-20**  | \[ ] | **Explain-my-ranking** w/ Claude; mobile tweaks                                        | *AI/FE*     |
| **20-22**  | \[ ] | Perf pass (Gemini streaming, Groq batch, DB indexes)                                   | *All*       |
| **22-24**  | \[ ] | Record 90-sec demo video, update README, submit 🎉                                     | *All*       |

---

## 7 · Scoring Formula (v1)

```text
score =
  w_price   * normalized_price   +
  w_quality * quality_score      +
  w_dist    * distance_km
```

* Default weights: `w_price = 0.5`, `w_quality = 0.3`, `w_dist = 0.2`
* All terms min–max normalized (0 = best, 1 = worst).

---

## 8 · Stretch Goals

* 🛒 **“Build my cart”** — per-item price comparison across stores
* 🔔 **Letta + Cloud Events** — send push when a price drops
* 🤖 **RAG** — augment chat with weekly circular PDFs via Gemini 1.5 Pro Vision
* 📱 **PWA** — offline catalog browsing

---

## 9 · License & Credits

MIT.
Powered by generous API credits from **Letta**, **Google**, **Groq**, **Fetch.ai**, **Anthropic**, and **Orkes**. Massive thanks to the **UC Berkeley AI Hackathon 2025** organizers.

> *“Ship fast, break nothing, and save shoppers money.”*

```
```
