# Algorithm & Logic Explanation

**Project**: Vector  
**Component**: AI Service Layer (`services/geminiService.ts`)

This document outlines the three-stage AI pipeline used in Vector to transform raw RSS feeds into a personalized news stream.

## 1. Data Ingestion & Normalization

Before AI processing, the system performs "Federated Fetching":
1.  **Source**: Iterates through a weighted list of 16+ RSS feeds (TechCrunch, Nature, IEEE, etc.).
2.  **Rotation strategy**: Fetches feeds in pages (groups of 5) to ensure variety without overwhelming the network.
3.  **Resilience**: Uses a waterfall strategy for CORS proxies (AllOrigins -> CORSProxy -> CodeTabs).
4.  **Parsing**: Converts XML/Atom feeds into a standardized JSON structure.

## 2. Stage I: Standardization (The Translator)

**Goal**: Convert diverse English inputs into uniform summaries in the user's preferred language.

*   **Model**: Gemini 3.0 Flash (Optimized for speed/cost).
*   **Input**: Batch of 10-15 raw RSS items (Source, Title, Description, Link).
*   **Configuration**: The system checks `Settings.language` to determine the target language (`TargetLang`).
*   **Prompt Logic**:
    *   Role: "Tech News Editor".
    *   Task: Translate Title to `TargetLang`; Summarize Description to **one** sentence in `TargetLang`; Assign a generic Category in `TargetLang`.
    *   Constraint: Return strict JSON array.
*   **Output**: Hydrated `NewsItem` objects used in the UI.

## 3. Stage II: The Analyst (Profile Generation)

**Goal**: Convert binary user signals (Like/Dislike) into a complex logic filter.

*   **Trigger**: User submits >10 votes.
*   **Input**: Arrays of `[Category] Title` for Liked and Disliked items.
*   **Prompt Logic**:
    *   **Role**: "Chief Intelligence Officer & Cognitive Architect".
    *   **Language Instruction**: "Output all content in `TargetLang`."
    *   **Analysis Dimensions**:
        1.  **Granularity**: Distinguish specific sub-fields (e.g., "AI Engineering" vs "AI Hype").
        2.  **Conflict Resolution**: How to handle articles with mixed signals.
        3.  **Thresholds**: Define the quality bar (e.g., "Engineering Blog" vs "Press Release").
    *   **Output Schema**:
        *   `persona`: A 300-word psychological profile of the user.
        *   `naturalLanguageFilter`: A pseudo-code System Prompt structured with `[PASS_GATES]`, `[BLOCK_GATES]`, and `[RESOLUTION_LOGIC]`.
        *   `tags`: High-level keywords.

## 4. Stage III: The Gatekeeper (Smart Filtering)

**Goal**: Apply the Stage II filter to new, unseen content.

*   **Input**:
    *   `systemInstruction`: The `naturalLanguageFilter` string generated in Stage II.
    *   `newsItems`: A new batch of standardized news items from Stage I.
*   **Prompt Logic**:
    *   **Task**: "Review the following news items based STRICTLY on the system instruction."
    *   **Requirement**: Return a JSON list of *only* the items that pass.
    *   **Explanation**: For each passed item, provide a `passReason` referencing the specific gate hit, written in `TargetLang`.
*   **Output**: A list of `FilteredNewsItem` displayed in the "Smart Reader" view.

## 5. Error Handling & Robustness

*   **Rate Limiting**: The service intercepts `429 RESOURCE_EXHAUSTED` errors from the Gemini SDK and throws a specific error prompting the user to supply their own API Key in Settings.
*   **Hallucination Control**: By enforcing strict JSON schemas (`responseMimeType: "application/json"`), we minimize formatting errors.
*   **Context Window Optimization**: Input descriptions are truncated to 200 characters during Stage I to save tokens and improve latency.