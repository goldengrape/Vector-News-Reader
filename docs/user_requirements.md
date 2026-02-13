# User Requirements Document (URD)

**Project Name**: Vector (Precision News Radar)  
**Version**: 1.0  
**Status**: Active

## 1. Introduction

### 1.1 Purpose
The purpose of Vector is to solve the "information overload" problem for tech professionals, researchers, and investors. Current algorithms prioritize engagement (clickbait), whereas Vector allows users to define a "Natural Language Filter" to prioritize **information density** and **relevance**.

### 1.2 Target Audience
*   **Engineers & Developers**: Looking for specific architectural breakthroughs, not general "tech news".
*   **Researchers**: Tracking specific scientific domains (e.g., LLM interpretability, Material Science).
*   **Investors**: Filtering for specific market signals while ignoring PR fluff.

## 2. Functional Requirements

### 2.1 News Aggregation & Processing
*   **FR-01**: The system MUST fetch RSS feeds from a curated list of high-quality tech sources (e.g., The Verge, Ars Technica, IEEE Spectrum).
*   **FR-02**: The system MUST handle CORS issues using proxy services (AllOrigins, CORSProxy).
*   **FR-03**: The system MUST use AI to translate English titles to Simplified Chinese.
*   **FR-04**: The system MUST generate a one-sentence Chinese summary for each news item.

### 2.2 Preference Calibration (The "Lab")
*   **FR-05**: Users MUST be able to vote "Like" (Interested) or "Dislike" (Not Interested) on news items.
*   **FR-06**: The system REQUIRE a minimum of 10 votes to ensure statistical significance before generation.
*   **FR-07**: The system MUST analyze voting history to generate:
    *   **User Persona**: A psychological analysis of the user's information consumption habits.
    *   **Natural Language Filter**: An executable System Prompt containing Pass/Block gates.
    *   **Tags**: 3-5 keywords describing the user's niche.

### 2.3 Intelligent Filtering (The "Reader")
*   **FR-08**: The system MUST use the generated Natural Language Filter to process new batches of news.
*   **FR-09**: The system MUST hide items that do not pass the filter criteria.
*   **FR-10**: For passed items, the system MUST display a "Pass Reason" explaining which rule was triggered.
*   **FR-11**: Users MUST be able to manually edit the generated System Prompt.

### 2.4 Configuration & Persistence
*   **FR-12**: All user data (votes, generated filters, settings) MUST be stored in `LocalStorage`.
*   **FR-13**: Users MUST be able to input their own Google Gemini API Key.
*   **FR-14**: Users MUST be able to select between different AI models (Gemini 3.0 Flash, Gemini 3.0 Pro).

## 3. Non-Functional Requirements

### 3.1 Performance
*   **NFR-01**: News fetching and initial rendering should occur within 2 seconds.
*   **NFR-02**: AI processing for a batch of 10 items should complete within 5-10 seconds (dependent on API latency).

### 3.2 UI/UX
*   **NFR-03**: The interface MUST use a "Dark Mode" aesthetic ("Cyberpunk/Hacker" style) to reduce eye strain.
*   **NFR-04**: The UI MUST be responsive (Mobile and Desktop).

### 3.3 Reliability
*   **NFR-05**: The system MUST handle API Rate Limits (429 Errors) gracefully by prompting the user to check settings.
*   **NFR-06**: The system MUST have fallback mechanisms if primary RSS proxies fail.