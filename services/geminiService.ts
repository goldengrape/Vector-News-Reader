import { GoogleGenAI, Type } from "@google/genai";
import { NewsItem, VoteRecord, AnalysisResult, FilteredNewsItem } from "../types";
import { getSettings } from "./settings";

// Helper to initialize client based on current settings
const getAIContext = () => {
  const settings = getSettings();
  // Prioritize user-provided key, fallback to env var
  const apiKey = settings.apiKey || process.env.API_KEY;
  const modelId = settings.modelId || "gemini-3-flash-preview";

  if (!apiKey) {
    throw new Error("API_KEY_MISSING");
  }

  return {
    ai: new GoogleGenAI({ apiKey }),
    modelId
  };
};

const handleGeminiError = (error: any) => {
  console.error("Gemini API Error:", error);
  const msg = error.toString();
  if (msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED") || (error.status === 429)) {
    throw new Error("API Quota Exceeded (429). Please go to Settings (Gear Icon) and add your own Gemini API Key to continue.");
  }
  if (error.message === "API_KEY_MISSING") {
    throw new Error("API Key is missing. Please go to Settings and configure your Gemini API Key.");
  }
  throw error;
};

// Real RSS Feeds configuration
const RSS_FEEDS = [
  { name: "TechCrunch", url: "https://techcrunch.com/feed/" },
  { name: "The Verge", url: "https://www.theverge.com/rss/index.xml" },
  { name: "Wired", url: "https://www.wired.com/feed/rss" },
  { name: "Ars Technica", url: "https://feeds.arstechnica.com/arstechnica/index" },
  { name: "Engadget", url: "https://www.engadget.com/rss.xml" },
  { name: "CNET", url: "https://www.cnet.com/rss/news/" },
  { name: "VentureBeat", url: "https://venturebeat.com/feed/" },
  { name: "ScienceAlert", url: "https://www.sciencealert.com/feed" },
  { name: "MIT Tech Review", url: "https://www.technologyreview.com/feed/" },
  { name: "IEEE Spectrum", url: "https://spectrum.ieee.org/rss/fulltext" },
  { name: "Scientific American", url: "https://www.scientificamerican.com/section/news/rss/" },
  { name: "Nature News", url: "https://www.nature.com/nature.rss" },
  { name: "The Next Web", url: "https://thenextweb.com/feed" },
  { name: "Mashable", url: "https://mashable.com/feed" },
  { name: "Fast Company", url: "https://www.fastcompany.com/latest/rss" },
  { name: "Business Insider", url: "https://www.businessinsider.com/rss" }
];

interface RawRSSItem {
  source: string;
  title: string;
  description: string;
  link: string;
}

// Fetch with timeout
const fetchWithTimeout = async (url: string, timeout = 5000) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
};

// Fetch RSS XML via multiple CORS proxies strategies
async function fetchRSS(feed: { name: string, url: string }): Promise<RawRSSItem[]> {
  const proxyGenerators = [
    // Primary: AllOrigins (Usually reliable, returns JSON or raw)
    (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
    // Backup 1: CORSProxy.io (Fast, direct proxy)
    (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
    // Backup 2: CodeTabs (Good fallback)
    (url: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`
  ];

  for (const generateProxyUrl of proxyGenerators) {
    try {
      const proxyUrl = generateProxyUrl(feed.url);
      const response = await fetchWithTimeout(proxyUrl, 6000); // 6s timeout per proxy

      if (!response.ok) continue;
      
      const text = await response.text();
      // Basic validation to ensure we got XML/HTML-like content
      if (!text || (!text.includes('<rss') && !text.includes('<feed') && !text.includes('<xml'))) {
        continue;
      }

      const parser = new DOMParser();
      const xml = parser.parseFromString(text, "text/xml");
      
      // Check for parsing errors
      if (xml.querySelector("parsererror")) {
        continue;
      }

      // Support both RSS <item> and Atom <entry>
      const items = Array.from(xml.querySelectorAll("item, entry")).slice(0, 5);
      
      if (items.length === 0) continue;

      const parsedItems = items.map(item => {
        const title = item.querySelector("title")?.textContent || "No Title";
        
        // Try multiple selectors for description/summary
        const descriptionNode = 
          item.querySelector("description") || 
          item.querySelector("summary") || 
          item.querySelector("content") ||
          item.getElementsByTagNameNS("*", "description")[0] ||
          item.getElementsByTagNameNS("*", "summary")[0];

        let description = descriptionNode?.textContent || "";
        
        // Link might be an element text or href attribute (Atom)
        let link = item.querySelector("link")?.textContent || "";
        if (!link) {
          link = item.querySelector("link")?.getAttribute("href") || "";
        }

        // Clean HTML tags from description (simple regex)
        const cleanDesc = description
          .replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1') // Extract CDATA
          .replace(/<[^>]*>?/gm, " ") // Remove HTML tags
          .replace(/\s+/g, " ") // Normalize whitespace
          .trim()
          .substring(0, 500); // Truncate

        return {
          source: feed.name,
          title: title.trim(),
          description: cleanDesc,
          link: link.trim()
        };
      }).filter(item => item.title && item.link && item.title !== "No Title");

      if (parsedItems.length > 0) {
        return parsedItems;
      }
    } catch (error) {
      // Proxy failed, try next one
      continue;
    }
  }

  // If we get here, all proxies failed for this feed
  console.warn(`Failed to fetch RSS for ${feed.name} after multiple attempts.`);
  return [];
}

export const fetchNewsBatch = async (batchSize: number = 10, page: number = 0): Promise<NewsItem[]> => {
  // Strategy: Try the selected page's feeds first.
  // If result is empty, try a random selection of other feeds to ensure we return *something*.
  
  const feedsCount = RSS_FEEDS.length;
  const startIndex = (page * 5) % feedsCount;
  
  // 1. Determine Target Feeds
  let selectedFeeds = [];
  for(let i = 0; i < 5; i++) {
    selectedFeeds.push(RSS_FEEDS[(startIndex + i) % feedsCount]);
  }

  // 2. Fetch
  let rawItems = (await Promise.all(selectedFeeds.map(fetchRSS))).flat();

  // 3. Fallback Mechanism: If we got very few items, pick random random feeds we haven't tried yet
  if (rawItems.length < 5) {
    console.log("Primary fetch yielded low results, attempting fallback feeds...");
    const otherFeeds = RSS_FEEDS.filter(f => !selectedFeeds.includes(f))
      .sort(() => Math.random() - 0.5)
      .slice(0, 5);
    
    const fallbackItems = (await Promise.all(otherFeeds.map(fetchRSS))).flat();
    rawItems = [...rawItems, ...fallbackItems];
  }

  // Shuffle
  const shuffledRaw = rawItems.sort(() => Math.random() - 0.5).slice(0, batchSize + 2);

  if (shuffledRaw.length === 0) {
    throw new Error("Unable to fetch news from any source. Please check your network connection.");
  }

  // 4. Gemini Processing
  try {
    const { ai, modelId } = getAIContext();

    // Only send the necessary fields to save tokens
    const minimizedInput = shuffledRaw.map(item => ({
      s: item.source,
      t: item.title,
      d: item.description.substring(0, 200), // Further truncate for context window efficiency
      l: item.link
    }));

    const prompt = `
      You are a tech news editor. Translate and summarize these RSS items into Simplified Chinese.
      
      Input Format: JSON Array of {s: source, t: title, d: description, l: link}
      
      Requirements:
      1. title: Translate to Chinese.
      2. summary: Summarize "d" into strictly ONE Chinese sentence.
      3. category: Assign (e.g., AI, Consumer Tech, Science, Business, Dev, Security).
      4. Return JSON Array.

      Input:
      ${JSON.stringify(minimizedInput)}
    `;

    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              summary: { type: Type.STRING },
              category: { type: Type.STRING },
              // We ask the model to echo these back to keep mapping simple
              link: { type: Type.STRING }, 
              source: { type: Type.STRING } 
            },
            required: ["title", "summary", "category", "link"]
          }
        }
      }
    });

    if (response.text) {
      const parsed = JSON.parse(response.text);
      return parsed.map((item: any, idx: number) => ({
        id: `news-${page}-${Date.now()}-${idx}`,
        title: item.title,
        summary: item.summary,
        category: item.category,
        source: item.source || "Tech News", // Fallback if model drops it
        link: item.link
      })) as NewsItem[];
    }
    throw new Error("Empty response from Gemini");
  } catch (error) {
    handleGeminiError(error);
    return []; // Should be unreachable due to throw above
  }
};

export const analyzeUserPreferences = async (votes: VoteRecord[]): Promise<AnalysisResult> => {
  const likes = votes.filter(v => v.vote === 'like').map(v => `[${v.item.category}] ${v.item.title}`);
  const dislikes = votes.filter(v => v.vote === 'dislike').map(v => `[${v.item.category}] ${v.item.title}`);

  const prompt = `
    你现在是该用户的“首席情报官”与“认知架构师”。任务是根据用户的投票历史，生成一份极高精度的心理画像和一份可执行的自然语言过滤器。

    用户投票数据:
    【喜欢的 (Likes)】:
    ${JSON.stringify(likes)}

    【不喜欢的 (Dislikes)】:
    ${JSON.stringify(dislikes)}

    ---
    
    ### 任务核心要求 (CRITICAL REQUIREMENTS)
    不要生成泛泛而谈的摘要。我需要**逻辑指令集**。必须严格遵守以下三个维度的标准：
    
    1. **极高的判别粒度 (Granularity)**: 
       - 禁止使用“关注科技前沿”这种废话。
       - 必须具体到子领域技术点（例如：是关注“AI 变现应用”还是“Transformer 架构优化”？是关注“消费电子参数”还是“供应链变革”？）。
       
    2. **逻辑冲突处理 (Conflict Resolution)**: 
       - 定义优先级。如果一篇被排除类型的新闻（如融资）中包含了用户喜欢的特征（如技术细节），该如何处理？建立 Explicit Rule。
       
    3. **准入门槛 (Thresholds)**: 
       - 定义什么级别的信息值得推送。是只有 Nature 级别的突破？还是 Hacker News 级别的工程讨论？
       - 剔除“噪音”的标准是什么？

    ---

    请生成 JSON 对象，包含以下字段：

    1. **"persona" (用户深度心理画像)**:
       请用中文撰写（300字左右）。不要堆砌形容词，要分析其**信息代谢机制**：
       - **认知带宽**: 用户倾向于消耗高密度的理论知识，还是快节奏的市场动态？
       - **价值锚点**: 用户对技术的评判标准是“商业落地”、“工程优美”还是“理论颠覆”？
       - **厌恶本质**: 深度分析用户点“踩”的深层原因（是厌恶软文？厌恶浅薄？还是厌恶特定意识形态？）。
       - **盲区预警**: 甚至可以指出用户过于关注某领域而忽略了哪些重要的相关变量。

    2. **"naturalLanguageFilter" (自然语言过滤器)**:
       这是一个**写给 AI Agent 看的 System Prompt**。请用第二人称“你”来指令 AI。
       必须包含以下结构化模块，行文必须像代码逻辑一样严谨：
       - **[ROLE DEFINITION]**: 定义 AI 的具体角色（如：无情的硬核技术筛选器）。
       - **[PASS_GATES] (放行标准)**: 具体的技术指标、新闻深度要求。
       - **[BLOCK_GATES] (拦截标准)**: 具体的噪音特征（如：仅含股价波动的商业新闻、无代码实现的 AI 宣发）。
       - **[RESOLUTION_LOGIC] (冲突仲裁)**: "IF... THEN..." 逻辑。例如：“如果新闻是关于马斯克的（通常拦截），但包含 Starship 的具体遥测数据（放行），则提取数据部分并放行。”
       - **[SUMMARIZATION_STYLE] (摘要风格)**: 指定输出的语气（如：学术、冷峻、反直觉）。

    3. **"tags"**: 3-5 个极其精准的中文标签（如：#硬核工程 #反叙事 #底层架构）。
  `;

  try {
    const { ai, modelId } = getAIContext();
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            persona: { type: Type.STRING },
            naturalLanguageFilter: { type: Type.STRING },
            tags: { 
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["persona", "naturalLanguageFilter", "tags"]
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as AnalysisResult;
    }
    throw new Error("Empty analysis response");
  } catch (error) {
    handleGeminiError(error);
    throw error;
  }
};

export const applyNaturalLanguageFilter = async (newsItems: NewsItem[], filterPrompt: string): Promise<FilteredNewsItem[]> => {
  const newsInput = newsItems.map(n => ({
    id: n.id,
    title: n.title,
    summary: n.summary
  }));

  const prompt = `
    [SYSTEM INSTRUCTION]
    ${filterPrompt}
    
    [TASK]
    Review the following news items based STRICTLY on the system instruction above.
    
    Return a JSON object containing a list of items that passed the filter.
    For each passed item, provide:
    1. "id": The original id.
    2. "passReason": A very short explanation (6-10 words) of why it passed, referencing the specific PASS_GATE it hit.
    
    [NEWS ITEMS]
    ${JSON.stringify(newsInput)}
  `;

  try {
    const { ai, modelId } = getAIContext();
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            passedItems: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  passReason: { type: Type.STRING }
                },
                required: ["id", "passReason"]
              }
            }
          }
        }
      }
    });

    if (response.text) {
      const result = JSON.parse(response.text);
      const passedMap = new Map<string, string>();
      result.passedItems.forEach((p: any) => passedMap.set(p.id, p.passReason));

      // Filter the original array
      return newsItems
        .filter(item => passedMap.has(item.id))
        .map(item => ({
          ...item,
          passReason: passedMap.get(item.id)
        }));
    }
    return [];
  } catch (error) {
    handleGeminiError(error);
    return [];
  }
};