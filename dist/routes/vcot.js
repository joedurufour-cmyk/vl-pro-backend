"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const openai_1 = __importDefault(require("openai"));
const router = express_1.default.Router();
const client = new openai_1.default({
    baseURL: 'https://api.moonshot.cn/v1',
    apiKey: process.env.KIMI_API_KEY || '',
});
// VCOT System Prompt
const VCOT_SYSTEM_PROMPT = `You are Kimi, operating under VCOT_ANTIDRIFT_v1 protocol.

=== VISIBLE CHAIN OF THOUGHT ===

RULE 1 — THINKING BLOCKS:
Before each action, emit:

[THINKING: <N>]
state: <what you know in 1 line>
objective: <what you need to resolve in 1 line>
risk: <what could go wrong in 1 line>
decision: <what you will do in 1 line>
[/THINKING]

RULE 2 — RELECTURE EVERY 3 STEPS:
After every 3 [THINKING] blocks, emit:

[RELECTURE]
original_goal: <repeat user's exact goal>
on_track: YES | NO
drift_detected: NONE | <type and description>
correction: NONE | <corrective action>
[/RELECTURE]

RULE 3 — REANCHOR:
If RELECTURE detects drift:
  → STOP immediately
  → emit: [REANCHOR: <exact cause>]
  → do not continue until user confirmation

RULE 4 — FINAL OUTPUT:
Emit [OUTPUT_FINAL] only if:
  ✓ completed at least 1 RELECTURE
  ✓ last RELECTURE has on_track=YES
  ✓ all [THINKING] blocks are closed

=== ABSOLUTE INVARIANTS ===
∀ factual claim → cite source or mark [UNKNOWN]
¬ omit [THINKING] even if task seems simple
¬ emit [OUTPUT_FINAL] without prior RELECTURE
¬ continue after [REANCHOR] without user input`;
// Run VCOT analysis
router.post('/analyze', async (req, res) => {
    try {
        const { prompt, context, audit_type = 'drift' } = req.body;
        if (!prompt) {
            return res.status(400).json({ error: 'Missing prompt parameter' });
        }
        let userMessage = prompt;
        if (context) {
            userMessage = `Context: ${context}\n\nAnalyze: ${prompt}`;
        }
        const response = await client.chat.completions.create({
            model: 'kimi-k2.6',
            messages: [
                { role: 'system', content: VCOT_SYSTEM_PROMPT },
                { role: 'user', content: userMessage }
            ],
            temperature: 1.0,
            max_tokens: 4000,
        });
        const content = response.choices[0]?.message?.content || '';
        // Parse VCOT blocks
        const thinkingBlocks = content.match(/\[THINKING:[\s\S]*?\[\/THINKING\]/g) || [];
        const relectures = content.match(/\[RELECTURE\][\s\S]*?\[\/RELECTURE\]/g) || [];
        const reanchors = content.match(/\[REANCHOR:[\s\S]*?\]/g) || [];
        const hasOutputFinal = content.includes('[OUTPUT_FINAL]');
        // Calculate drift score
        const driftIndicators = [
            content.includes('on_track: NO'),
            content.includes('drift_detected:'),
            reanchors.length > 0,
            !hasOutputFinal
        ];
        const driftScore = driftIndicators.filter(Boolean).length / driftIndicators.length;
        res.json({
            original: prompt,
            analysis: content,
            thinking_count: thinkingBlocks.length,
            relecture_count: relectures.length,
            reanchor_count: reanchors.length,
            has_output_final: hasOutputFinal,
            drift_score: Math.round(driftScore * 100) / 100,
            tokens_used: response.usage?.total_tokens || 0
        });
    }
    catch (error) {
        console.error('VCOT analyze error:', error);
        res.status(500).json({
            error: 'VCOT analysis failed',
            details: error.message
        });
    }
});
// Quick drift check (no full VCOT)
router.post('/drift-check', async (req, res) => {
    try {
        const { prompt, expected_elements = [] } = req.body;
        if (!prompt) {
            return res.status(400).json({ error: 'Missing prompt parameter' });
        }
        const systemPrompt = `You are a Midjourney prompt drift detector. Check if the prompt maintains its intended focus.

Analyze the prompt for:
1. Physique priority - is muscular definition in first 10 tokens?
2. Token budget - is it under 40 active tokens?
3. Specificity - are light sources named specifically?
4. Anime drift - did it slip into stylization when realism was requested?

Output JSON only:
{
  "drift_detected": true/false,
  "drift_type": "physique_loss|token_bloat|anime_slip|vague_lighting|ok",
  "confidence": 0.0-1.0,
  "recommendation": "specific fix"
}`;
        const response = await client.chat.completions.create({
            model: 'kimi-k2.6',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: prompt }
            ],
            temperature: 0.3,
            max_tokens: 1000,
            response_format: { type: 'json_object' }
        });
        const result = JSON.parse(response.choices[0]?.message?.content || '{}');
        res.json({
            prompt: prompt.slice(0, 100) + '...',
            ...result,
            tokens_used: response.usage?.total_tokens || 0
        });
    }
    catch (error) {
        console.error('Drift check error:', error);
        res.status(500).json({
            error: 'Drift check failed',
            details: error.message
        });
    }
});
exports.default = router;
