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
// Translate natural language to Midjourney prompt
router.post('/translate', async (req, res) => {
    try {
        const { text, mode = 'balanced' } = req.body;
        if (!text) {
            return res.status(400).json({ error: 'Missing text parameter' });
        }
        const systemPrompt = `You are a Midjourney V8.1 prompt engineer. Translate user requests into optimal prompts.

Rules:
1. Physique description MUST be in first 10 tokens
2. Use specific light sources, never generic "dramatic lighting"
3. Keep active tokens < 40
4. AR 9:20 for phone wallpapers
5. Stylize inverse: lower = more realism (250 = sweet spot)
6. Chaos 15 for density without incoherence

Mode: ${mode}
- balanced: Standard optimization
- brutal: Auto-inject hyper musculature hierarchy
- anime: Exuberant style, focus on protagonist

Output ONLY the prompt. No explanations. No markdown.`;
        const response = await client.chat.completions.create({
            model: 'kimi-k2.6',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: text }
            ],
            temperature: 0.7,
            max_tokens: 2000,
        });
        const prompt = response.choices[0]?.message?.content || '';
        res.json({
            original: text,
            prompt: prompt.trim(),
            mode,
            tokens_used: response.usage?.total_tokens || 0
        });
    }
    catch (error) {
        console.error('Kimi translate error:', error);
        res.status(500).json({
            error: 'Translation failed',
            details: error.message
        });
    }
});
// Enhance existing prompt
router.post('/enhance', async (req, res) => {
    try {
        const { prompt, focus = 'general' } = req.body;
        if (!prompt) {
            return res.status(400).json({ error: 'Missing prompt parameter' });
        }
        const focusInstructions = {
            general: 'Improve overall quality while keeping intent',
            physique: 'Enhance muscular definition hierarchy, add anatomical detail',
            lighting: 'Make light sources specific and cinematic',
            composition: 'Optimize subject placement and camera angle',
            clothing: 'Add fabric tension and material detail'
        };
        const systemPrompt = `You are a Midjourney V8.1 prompt optimizer. Enhance the given prompt.

Focus: ${focusInstructions[focus] || focusInstructions.general}

Rules:
1. Maintain original intent
2. Add specificity without length bloat
3. Prioritize token hierarchy (physique > light > camera > background)
4. AR 9:20 if not specified

Output ONLY the enhanced prompt. No explanations.`;
        const response = await client.chat.completions.create({
            model: 'kimi-k2.6',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: prompt }
            ],
            temperature: 0.6,
            max_tokens: 2000,
        });
        const enhanced = response.choices[0]?.message?.content || '';
        res.json({
            original: prompt,
            enhanced: enhanced.trim(),
            focus,
            tokens_used: response.usage?.total_tokens || 0
        });
    }
    catch (error) {
        console.error('Kimi enhance error:', error);
        res.status(500).json({
            error: 'Enhancement failed',
            details: error.message
        });
    }
});
exports.default = router;
