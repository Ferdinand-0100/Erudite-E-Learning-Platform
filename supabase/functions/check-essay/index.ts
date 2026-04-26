const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { essay, prompt, minWords, maxWords } = await req.json()

    if (!essay || !prompt) {
      return new Response(
        JSON.stringify({ error: 'Essay and prompt are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const apiKey = Deno.env.get('GROQ_API_KEY')
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const wordCount = essay.trim().split(/\s+/).filter(Boolean).length

    const systemPrompt = `You are an expert English writing coach and examiner. Evaluate the student's essay and return a JSON object with exactly this structure — no markdown, no explanation, just the raw JSON:
{
  "overall_score": <number 1-10>,
  "band_estimate": "<IELTS band estimate e.g. Band 6.5>",
  "word_count": <number>,
  "summary": "<2-3 sentence overall assessment>",
  "categories": {
    "task_achievement": { "score": <1-10>, "feedback": "<specific feedback>" },
    "coherence_cohesion": { "score": <1-10>, "feedback": "<specific feedback>" },
    "lexical_resource": { "score": <1-10>, "feedback": "<specific feedback>" },
    "grammatical_range": { "score": <1-10>, "feedback": "<specific feedback>" }
  },
  "strengths": ["<strength 1>", "<strength 2>"],
  "improvements": ["<improvement 1>", "<improvement 2>", "<improvement 3>"],
  "corrected_sentences": [
    { "original": "<sentence with error>", "corrected": "<corrected version>", "explanation": "<why>" }
  ]
}`

    const userMessage = `Essay Prompt: ${prompt}

Student's Essay (${wordCount} words):
${essay}
${minWords ? `\nMinimum required words: ${minWords}` : ''}
${maxWords ? `Maximum allowed words: ${maxWords}` : ''}`

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        temperature: 0.3,
        max_tokens: 2048,
        response_format: { type: 'json_object' },
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      return new Response(
        JSON.stringify({ error: `Groq API error: ${errText}` }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const groqData = await response.json()
    const rawText = groqData.choices?.[0]?.message?.content ?? ''

    let feedback
    try {
      feedback = JSON.parse(rawText)
    } catch {
      return new Response(
        JSON.stringify({ error: 'Failed to parse AI response', raw: rawText }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ feedback, wordCount }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
