# Vector | Precision News Radar

[简体中文](./README_zh.md) | [日本語](./README_ja.md) | [한국어](./README_ko.md) | [English](./README.md)

**Vector** is an intelligent, AI-driven tech news aggregator that learns your cognitive preferences to filter out noise and deliver high-signal information.

Unlike traditional RSS readers or algorithmic feeds that optimize for engagement, Vector optimizes for **information density and relevance** based on a transparent "Natural Language Filter" that you co-create with the AI.

## 🚀 Key Features

*   **Global Tech Surveillance**: Aggregates news from top-tier sources (TechCrunch, Wired, Nature, IEEE Spectrum, etc.).
*   **Multi-Language Support**: Automatically translates titles and summaries into your preferred language (**English, Chinese, Japanese, or Korean**) for rapid scanning.
*   **Preference Lab (Calibration)**:
    *   Swipe-style voting (Like/Dislike) on raw news feeds.
    *   Generates a deep **Psychological Persona** analyzing your information metabolic rate.
    *   Constructs a **Natural Language Filter (System Prompt)** that explicitly defines what constitutes "Signal" vs. "Noise" for you.
*   **Smart Reader**: Applies your custom filter to incoming news, explaining *why* specific items were selected in your chosen language.
*   **Privacy First**: All preferences and API keys are stored in your browser's **LocalStorage**. No external database.
*   **BYOK (Bring Your Own Key)**: Supports custom Google Gemini API Keys to avoid rate limits.

## 🛠 Tech Stack

*   **Frontend**: React 19, TypeScript, Tailwind CSS.
*   **AI Engine**: Google Gemini API (`@google/genai` SDK).
    *   Models: Gemini 3.0 Flash (Default), Gemini 3.0 Pro (Optional).
*   **Data Source**: Real-time RSS feeds via CORS proxies.

## 📦 Installation & Setup

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/your-username/vector-news-radar.git
    cd vector-news-radar
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Start the development server**:
    ```bash
    npm start
    ```

## ⚙️ Configuration

To ensure stable usage, especially for high-volume filtering:

1.  Click the **Settings (Gear Icon)** in the top navigation bar.
2.  Enter your **Google Gemini API Key**. You can get one at [Google AI Studio](https://aistudio.google.com/app/apikey).
3.  Select your **Output Language** (Default is Chinese, switchable to English, Japanese, or Korean).
4.  Select your preferred model (Gemini 3.0 Flash is recommended for speed/cost balance).

## 📖 How to Use

1.  **Lab Mode (Default on first load)**:
    *   Read the raw news feed (automatically translated to your target language).
    *   Mark at least 10 items as "Interested" or "Not Interested".
    *   Click **"Generate Filter"**.
    *   Review your generated Persona and Filter Logic. Click **"Enable & Read"**.
2.  **Reader Mode**:
    *   Vector now automatically filters incoming news batches using your generated logic.
    *   Hover over the "Match Reason" tag to see why the AI selected an article.
3.  **Refining**:
    *   You can manually edit the System Prompt in the Reader view if the AI misses something.
    *   Return to the Lab to re-train from scratch if your interests change.

## 📄 License

MIT