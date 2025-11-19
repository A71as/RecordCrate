import express from "express";
import { geminiService } from "../services/gemini.js";

const router = express.Router();

/**
 * Process natural language search query
 * POST /api/search/natural-language
 */
router.post("/natural-language", async (req, res) => {
  try {
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({ error: "Query is required" });
    }

    // Check if it's actually a natural language query
    if (!geminiService.isNaturalLanguageQuery(query)) {
      return res.json({
        isNaturalLanguage: false,
        message: "Query appears to be a regular search term",
      });
    }

    // Process with Gemini
    const geminiResponse = await geminiService.processNaturalLanguageQuery(
      query
    );

    // Generate search suggestions
    const searchSuggestions = await geminiService.generateSearchSuggestions(
      geminiResponse
    );

    res.json({
      isNaturalLanguage: true,
      originalQuery: query,
      interpretation: geminiResponse.interpretation,
      recommendations: geminiResponse.recommendations,
      searchSuggestions,
      additionalSearchTerms: geminiResponse.additionalSearchTerms,
    });
  } catch (error) {
    console.error("Natural language search error:", error);
    res.status(500).json({
      error: "Failed to process natural language query",
      details: error.message,
    });
  }
});

/**
 * Health check for natural language search
 */
router.get("/health", (req, res) => {
  const hasGeminiKey = !!process.env.GEMINI_API_KEY;
  res.json({
    status: "ok",
    geminiConfigured: hasGeminiKey,
    service: "natural-language-search",
  });
});

export default router;
