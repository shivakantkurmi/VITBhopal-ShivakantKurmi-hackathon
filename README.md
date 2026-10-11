## FinRisk-AI - S&P Global & Crisil Campus Hackathon
### Candidate Name: Shivakant Kurmi
### College Email ID: shivkant.23bcg10140@vitbhopal.ac.in
### Personal Email ID: shivakantkurmi49@gmail.com
### College / Campus: VIT Bhopal University
### Demo Video Link: [Pending — upload an unlisted YouTube walkthrough]
### Slide Deck: [docs/FinRisk-AI-Presentation.pptx](docs/FinRisk-AI-Presentation.pptx)
### Architecture Diagram: [docs/architecture.svg](docs/architecture.svg)
1. Project Overview / Problem Statement & Approach
Financial markets react instantly to global news, making manual risk assessment inefficient. This project features a unified AI/NLP Risk Engine that ingests unstructured textual data from multiple sources and converts it into structured, machine-readable risk signals (Sentiment, Event Type, and Impact Score). To demonstrate its utility, the engine powers a Tactical Index Rebalancer (Module A), dynamically shifting the portfolio weights of a mock stock index based on real-time sentiment polarity.
2. Architecture & Tech Stack
Data Ingestion: News API for live feeds; Python for data processing.
Core NLP Engine: Python, Hugging Face Transformers (FinBERT, Zero-shot classification).
Backend / API: FastAPI serving structured signals.
Frontend Dashboard: React.js, Tailwind CSS, Recharts for dynamic weight visualization.
3. Dataset Used
News Data: NewsAPI and a 12,000-record synthetic financial-news dataset included in `data/sample_financial_news.json`.
Market Data: yfinance library for historical pricing.
Assumptions: Baseline weights for the mock portfolio are equally distributed before sentiment rebalancing.
4. Quickstart & Installation
Runtime: Python 3.10+ / Node.js 20
Bash
git clone <repo-url>
cd VITBhopal-ShivakantKurmi-hackathon
# Backend Setup
cd src/api
pip install -r ../../requirements.txt
uvicorn main:app --reload

# Frontend Setup
cd ../dashboard
npm install
npm run dev
5. Key Results & Domain Impact
Outputs: Parses unstructured news into structured sentiment (-1.0 to +1.0) and dynamically rebalances stock weights.
Domain Impact: Automates tactical asset allocation, allowing portfolio managers to react to macroeconomic events instantly, protecting portfolio value.

6. Submission Deliverables

| Deliverable | Repository location / link | Status |
|---|---|---|
| Source code and setup instructions | This public GitHub repository | Ready |
| Presentation deck (5–7 slides) | [docs/FinRisk-AI-Presentation.pptx](docs/FinRisk-AI-Presentation.pptx) | Ready |
| Architecture flow diagram | [docs/architecture.svg](docs/architecture.svg) | Ready |
| Synthetic and prototype data | [data/](data/) | Ready |
| Demo video walkthrough | Unlisted YouTube link | Pending recording |

The demo video will show the running FastAPI API, the React dashboard, an
end-to-end news analysis request, the risk signal, and the resulting normalized
portfolio weights. The project does not claim investment returns; it
demonstrates an explainable tactical-rebalancing workflow.
