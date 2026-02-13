# Vector | 精准科技雷达 (Precision News Radar)

[English](./README.md) | [日本語](./README_ja.md) | [한국어](./README_ko.md)

**Vector** 是一款由 AI 驱动的智能科技新闻聚合器。它通过学习您的认知偏好，过滤噪音，为您提供高信噪比的信息流。

与传统 RSS 阅读器或优化点击率的推荐算法不同，Vector 致力于优化**信息密度和相关性**。它通过您与 AI 共同构建的透明“自然语言过滤器”来运作。

## 🚀 核心功能

*   **全球科技监测**: 聚合来自顶级科技媒体（TechCrunch, Wired, Nature, IEEE Spectrum 等）的实时新闻。
*   **多语言支持**: 自动将标题和摘要翻译成您偏好的语言（**简体中文、英语、日语或韩语**），实现无障碍快速阅读。
*   **偏好实验室 (校准)**:
    *   对原始新闻流进行“感兴趣/不感兴趣”的投票。
    *   生成深度的**用户心理画像**，分析您的信息代谢机制。
    *   构建**自然语言过滤器 (System Prompt)**，明确定义什么是“信号”，什么是“噪音”。
*   **智能阅读器**: 使用生成的过滤器处理新流入的新闻，并解释 AI *为什么*选择了这篇文章（提供匹配理由）。
*   **隐私至上**: 所有的偏好数据、API Key 均存储在您浏览器的 **LocalStorage** 中。没有外部数据库。
*   **BYOK (自备 Key)**: 支持填写您自己的 Google Gemini API Key，以避免共享配额限制并获得更快的速度。

## 🛠 技术栈

*   **前端**: React 19, TypeScript, Tailwind CSS.
*   **AI 引擎**: Google Gemini API (`@google/genai` SDK).
    *   模型: Gemini 3.0 Flash (默认), Gemini 3.0 Pro (可选).
*   **数据源**: 通过 CORS 代理获取的实时 RSS Feeds。

## 📦 安装与设置

1.  **克隆仓库**:
    ```bash
    git clone https://github.com/your-username/vector-news-radar.git
    cd vector-news-radar
    ```

2.  **安装依赖**:
    ```bash
    npm install
    ```

3.  **启动开发服务器**:
    ```bash
    npm start
    ```

## ⚙️ 配置指南

为了获得最佳体验（特别是用于大量筛选时）：

1.  点击顶部导航栏的 **设置 (齿轮图标)**。
2.  输入您的 **Google Gemini API Key**。您可以在 [Google AI Studio](https://aistudio.google.com/app/apikey) 免费获取。
3.  选择您的 **输出语言**（默认为中文，可切换为英/日/韩）。
4.  选择推理模型（推荐 Gemini 3.0 Flash 以平衡速度与成本）。

## 📖 使用说明

1.  **实验室模式 (Lab Mode)**:
    *   阅读原始新闻流（已自动翻译）。
    *   至少标记 10 条新闻为“感兴趣”或“不感兴趣”。
    *   点击 **"生成过滤器"**。
    *   审阅生成的心理画像和过滤逻辑。点击 **"启用并阅读"**。
2.  **阅读模式 (Reader Mode)**:
    *   Vector 将自动使用您的逻辑过滤新流入的新闻批次。
    *   新闻卡片上会显示“命中规则”，解释 AI 推荐的原因。
3.  **微调**:
    *   您可以在阅读视图中手动编辑 System Prompt 指令。
    *   如果兴趣发生变化，随时返回实验室重新训练。

## 📄 许可证

MIT