## FinRisk-AI - S&P Global & Crisil Campus Hackathon
## Candidate Name: Shivakant Kurmi
## College Email ID: shivkant.23bcg10140@vitbhopal.ac.in
## College / Campus: VIT Bhopal University
### Demo Video Link: [Pending]
### Slide Deck Link (if hosted externally): [Pending]
1. Project Overview / Problem Statement & Approach
Financial markets react instantly to global news, making manual risk assessment inefficient. This project features a unified AI/NLP Risk Engine that ingests unstructured textual data from multiple sources and converts it into structured, machine-readable risk signals (Sentiment, Event Type, and Impact Score). To demonstrate its utility, the engine powers a Tactical Index Rebalancer (Module A), dynamically shifting the portfolio weights of a mock stock index based on real-time sentiment polarity.
2. Architecture & Tech Stack
Data Ingestion: News API for live feeds; Python for data processing.
Core NLP Engine: Python, Hugging Face Transformers (FinBERT, Zero-shot classification).
Backend / API: FastAPI serving structured signals.
Frontend Dashboard: React.js, Tailwind CSS, Recharts for dynamic weight visualization.
3. Dataset Used
News Data: News API and synthetic Kaggle Financial News Sentiment datasets.
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
