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
// ═══════════════════════════════════════════════════════
// KIMI_PERA_SYSTEM PIPELINE — NL → Deterministic Prompt
// ═══════════════════════════════════════════════════════
// STEP 1: CLASSIFY_INTENT
function classifyIntent(userInput) {
    const input = userInput.toLowerCase();
    const codingKeywords = ['código', 'app', 'función', 'script', 'refactor', 'bug', 'programa', 'desarrolla', 'crea una app', 'escribe'];
    const uiKeywords = ['ui', 'diseño', 'interfaz', 'mockup', 'frontend', 'visual', 'componente', 'página', 'web'];
    const swarmKeywords = ['agentes', 'swarm', 'delegar', 'orquestar', 'paralelo', 'coordinar', 'múltiples agentes'];
    const researchKeywords = ['investiga', 'analiza', 'reporte', 'explica', 'resume', 'investigación', 'estudio', 'busca'];
    const quickKeywords = ['responde', 'dime', 'cuál', 'qué es', 'rápido', 'solo', 'breve', 'simple'];
    if (swarmKeywords.some(k => input.includes(k)))
        return 'multi_agent_swarm';
    if (codingKeywords.some(k => input.includes(k)))
        return 'long_horizon_coding';
    if (uiKeywords.some(k => input.includes(k)))
        return 'visual_ui_generation';
    if (researchKeywords.some(k => input.includes(k)))
        return 'deep_reasoning';
    if (quickKeywords.some(k => input.includes(k)))
        return 'standard_chat';
    // Default: deep_reasoning for most tasks
    return 'deep_reasoning';
}
// STEP 2: SET_THINKING_MODE
function getThinkingConfig(intent) {
    const configs = {
        long_horizon_coding: { thinking: true, temp: 1.0, max_tokens: 16000 },
        visual_ui_generation: { thinking: true, temp: 1.0, max_tokens: 16000 },
        multi_agent_swarm: { thinking: true, temp: 1.0, max_tokens: 32000 },
        deep_reasoning: { thinking: true, temp: 1.0, max_tokens: 16000 },
        standard_chat: { thinking: false, temp: 0.6, max_tokens: 4000 }
    };
    return configs[intent] || configs.deep_reasoning;
}
// STEP 3: BUILD_SYSTEM_PROMPT
function buildSystemPrompt(intent, context = '') {
    const personas = {
        long_horizon_coding: 'senior software architect. Produce production-ready code with zero placeholders.',
        visual_ui_generation: 'UI/UX engineer specializing in production-ready frontend code. Complete implementations only.',
        multi_agent_swarm: 'swarm coordinator. Route subtasks to matching agents. Resolve conflicts via sequential locks.',
        deep_reasoning: 'research intelligence analyst. Extract and synthesize structured operational intelligence.',
        standard_chat: 'concise expert assistant. No preamble, no filler. Max 3 sentences unless asked for more.'
    };
    const constraints = {
        long_horizon_coding: '- Output: code only\n- Language: as specified\n- ¬ placeholder comments — implement fully\n- Include error handling and edge cases',
        visual_ui_generation: '- Output: complete, runnable HTML/React\n- Include responsive layout + accessibility\n- No placeholders, no TODOs',
        multi_agent_swarm: '- Define agent roster explicitly\n- Route each subtask to matching agent_id\n- Resolve shared_state conflicts via sequential write locks',
        deep_reasoning: '- Output in JSON when structured data needed\n- ¬ hallucinate — mark UNKNOWN if unverified\n- ∀ claim → cite source or evidence',
        standard_chat: '- ¬ preamble | ¬ filler\n- Max 3 sentences\n- Direct answers only'
    };
    const persona = personas[intent] || personas.deep_reasoning;
    const constraint = constraints[intent] || constraints.deep_reasoning;
    return `<role>
You are ${persona}
Your operational objective is to deliver exactly what the user requests with zero deviation.
</role>

<constraints>
${constraint}
- ∀ claim → ∃ evidence from <reference_data>
- ¬ apology | ¬ filler | ¬ preamble
</constraints>

${context ? `<reference_data>\n${context}\n</reference_data>` : ''}`;
}
// STEP 4: SET_OUTPUT_FORMAT
function getOutputFormat(intent) {
    if (intent === 'deep_reasoning')
        return 'json_schema';
    if (intent === 'long_horizon_coding')
        return 'text';
    if (intent === 'visual_ui_generation')
        return 'text';
    return 'text';
}
// STEP 5: STREAMING — always enabled
// STEP 6: EMIT — final payload assembled
async function emitKimiPayload(userInput, context = '') {
    const intent = classifyIntent(userInput);
    const config = getThinkingConfig(intent);
    const systemPrompt = buildSystemPrompt(intent, context);
    const outputFormat = getOutputFormat(intent);
    const payload = {
        model: 'kimi-k2.6',
        stream: true,
        temperature: config.temp,
        max_tokens: config.max_tokens,
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userInput }
        ]
    };
    if (config.thinking) {
        payload.extra_body = { thinking: { type: 'enabled' } };
    }
    return { payload, intent, config, outputFormat };
}
// ═══════════════════════════════════════════════════════
// MIDJOURNEY-SPECIFIC TRANSLATOR (uses PERA pipeline)
// ═══════════════════════════════════════════════════════
router.post('/translate', async (req, res) => {
    try {
        const { text, mode = 'balanced' } = req.body;
        if (!text) {
            return res.status(400).json({ error: 'Missing text parameter' });
        }
        // Use PERA pipeline for Midjourney translation
        const context = `Midjourney V8.1 optimization rules:
1. Physique description MUST be in first 10 tokens
2. Use specific light sources, never generic "dramatic lighting"
3. Keep active tokens < 40
4. AR 9:20 for phone wallpapers
5. Stylize inverse: lower = more realism (250 = sweet spot)
6. Chaos 15 for density without incoherence
7. Mode: ${mode} — balanced=standard, brutal=hyper musculature, anime=exuberant
8. Output ONLY the prompt. No explanations. No markdown.`;
        const { payload } = await emitKimiPayload(text, context);
        const response = await client.chat.completions.create(payload);
        const prompt = response.choices[0]?.message?.content || '';
        res.json({
            original: text,
            prompt: prompt.trim(),
            mode,
            tokens_used: response.usage?.total_tokens || 0,
            pipeline: 'KIMI_PERA_SYSTEM'
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
// ═══════════════════════════════════════════════════════
// ENHANCE PROMPT (uses PERA pipeline)
// ═══════════════════════════════════════════════════════
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
        const context = `Midjourney V8.1 prompt optimization.
Focus: ${focusInstructions[focus] || focusInstructions.general}
Rules:
1. Maintain original intent
2. Add specificity without length bloat
3. Prioritize token hierarchy (physique > light > camera > background)
4. AR 9:20 if not specified
Output ONLY the enhanced prompt. No explanations.`;
        const { payload } = await emitKimiPayload(prompt, context);
        const response = await client.chat.completions.create(payload);
        const enhanced = response.choices[0]?.message?.content || '';
        res.json({
            original: prompt,
            enhanced: enhanced.trim(),
            focus,
            tokens_used: response.usage?.total_tokens || 0,
            pipeline: 'KIMI_PERA_SYSTEM'
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
// ═══════════════════════════════════════════════════════
// GENERAL PERA CHAT (uses full pipeline)
// ═══════════════════════════════════════════════════════
router.post('/chat', async (req, res) => {
    try {
        const { message, context = '' } = req.body;
        if (!message) {
            return res.status(400).json({ error: 'Missing message parameter' });
        }
        const { payload, intent, config } = await emitKimiPayload(message, context);
        const response = await client.chat.completions.create(payload);
        const content = response.choices[0]?.message?.content || '';
        res.json({
            message: content,
            intent,
            thinking: config.thinking,
            temperature: config.temp,
            max_tokens: config.max_tokens,
            tokens_used: response.usage?.total_tokens || 0,
            pipeline: 'KIMI_PERA_SYSTEM'
        });
    }
    catch (error) {
        console.error('Kimi chat error:', error);
        res.status(500).json({
            error: 'Chat failed',
            details: error.message
        });
    }
});
exports.default = router;
