import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ── Per-format scoring rubrics ────────────────────────────────────────────────

function getSystemPrompt(essayType: string): string {
  const base = `Return a JSON object with no markdown, no explanation — raw JSON only.`

  switch (essayType) {

    case 'ielts_task1_academic':
      return `${base} You are an IELTS Academic examiner. The student has written a Task 1 Academic response describing visual data (graph, chart, table, diagram). Score using official IELTS Academic Task 1 criteria. Return:
{
  "overall_score": <number 1-10>,
  "band_estimate": "<e.g. Band 6.5>",
  "word_count": <number>,
  "summary": "<2-3 sentence overall assessment>",
  "categories": {
    "task_achievement": { "score": <1-10>, "feedback": "<did they cover key features, overview, data accurately?>" },
    "coherence_cohesion": { "score": <1-10>, "feedback": "<logical organisation, paragraphing, linking words>" },
    "lexical_resource": { "score": <1-10>, "feedback": "<range and accuracy of vocabulary for data description>" },
    "grammatical_range_accuracy": { "score": <1-10>, "feedback": "<range and accuracy of grammar>" }
  },
  "strengths": ["<strength 1>", "<strength 2>"],
  "improvements": ["<improvement 1>", "<improvement 2>", "<improvement 3>"],
  "corrected_sentences": [
    { "original": "<sentence with error>", "corrected": "<corrected version>", "explanation": "<why>" }
  ]
}`

    case 'ielts_task1_general':
      return `${base} You are an IELTS General Training examiner. The student has written a Task 1 General letter. Score using official IELTS General Task 1 criteria. Return:
{
  "overall_score": <number 1-10>,
  "band_estimate": "<e.g. Band 6.5>",
  "word_count": <number>,
  "summary": "<2-3 sentence overall assessment>",
  "categories": {
    "task_achievement": { "score": <1-10>, "feedback": "<did they address all bullet points, appropriate tone and format?>" },
    "coherence_cohesion": { "score": <1-10>, "feedback": "<logical organisation, paragraphing, linking words>" },
    "lexical_resource": { "score": <1-10>, "feedback": "<range and accuracy of vocabulary>" },
    "grammatical_range_accuracy": { "score": <1-10>, "feedback": "<range and accuracy of grammar>" }
  },
  "strengths": ["<strength 1>", "<strength 2>"],
  "improvements": ["<improvement 1>", "<improvement 2>", "<improvement 3>"],
  "corrected_sentences": [
    { "original": "<sentence with error>", "corrected": "<corrected version>", "explanation": "<why>" }
  ]
}`

    case 'ielts_task2':
      return `${base} You are an IELTS Task 2 examiner. The student has written an academic essay. Score using official IELTS Task 2 criteria. Return:
{
  "overall_score": <number 1-10>,
  "band_estimate": "<e.g. Band 6.5>",
  "word_count": <number>,
  "summary": "<2-3 sentence overall assessment>",
  "categories": {
    "task_response": { "score": <1-10>, "feedback": "<did they fully address all parts of the task, clear position?>" },
    "coherence_cohesion": { "score": <1-10>, "feedback": "<logical structure, paragraphing, cohesive devices>" },
    "lexical_resource": { "score": <1-10>, "feedback": "<range, accuracy, and appropriacy of vocabulary>" },
    "grammatical_range_accuracy": { "score": <1-10>, "feedback": "<range and accuracy of grammar>" }
  },
  "strengths": ["<strength 1>", "<strength 2>"],
  "improvements": ["<improvement 1>", "<improvement 2>", "<improvement 3>"],
  "corrected_sentences": [
    { "original": "<sentence with error>", "corrected": "<corrected version>", "explanation": "<why>" }
  ]
}`

    case 'pte_summarize':
      return `${base} You are a PTE Academic examiner. The student has written a "Summarize Written Text" response (one sentence summary). Score using official PTE criteria. Return:
{
  "overall_score": <number 1-10>,
  "band_estimate": "<PTE score estimate e.g. 65-79>",
  "word_count": <number>,
  "summary": "<2-3 sentence overall assessment>",
  "categories": {
    "content": { "score": <1-10>, "feedback": "<did they capture the main point accurately?>" },
    "form": { "score": <1-10>, "feedback": "<is it a single grammatically complete sentence within 5-75 words?>" },
    "grammar": { "score": <1-10>, "feedback": "<grammatical accuracy>" },
    "vocabulary": { "score": <1-10>, "feedback": "<appropriate and accurate word choice>" }
  },
  "strengths": ["<strength 1>", "<strength 2>"],
  "improvements": ["<improvement 1>", "<improvement 2>", "<improvement 3>"],
  "corrected_sentences": [
    { "original": "<sentence with error>", "corrected": "<corrected version>", "explanation": "<why>" }
  ]
}`

    case 'pte_essay':
      return `${base} You are a PTE Academic examiner. The student has written a "Write Essay" response. Score using official PTE Write Essay criteria. Return:
{
  "overall_score": <number 1-10>,
  "band_estimate": "<PTE score estimate e.g. 65-79>",
  "word_count": <number>,
  "summary": "<2-3 sentence overall assessment>",
  "categories": {
    "content": { "score": <1-10>, "feedback": "<relevance to topic, development of ideas, supporting details>" },
    "form": { "score": <1-10>, "feedback": "<appropriate length 200-300 words, essay structure>" },
    "grammar": { "score": <1-10>, "feedback": "<range and accuracy of grammatical structures>" },
    "vocabulary": { "score": <1-10>, "feedback": "<range, accuracy, and appropriacy of vocabulary>" },
    "spelling": { "score": <1-10>, "feedback": "<spelling accuracy>" },
    "linguistic_range": { "score": <1-10>, "feedback": "<variety of sentence structures and vocabulary>" }
  },
  "strengths": ["<strength 1>", "<strength 2>"],
  "improvements": ["<improvement 1>", "<improvement 2>", "<improvement 3>"],
  "corrected_sentences": [
    { "original": "<sentence with error>", "corrected": "<corrected version>", "explanation": "<why>" }
  ]
}`

    // GET / general English writing (default)
    default:
      return `${base} You are an expert English writing coach. Evaluate the student's essay. Return:
{
  "overall_score": <number 1-10>,
  "band_estimate": "<general level e.g. B2 Upper-Intermediate>",
  "word_count": <number>,
  "summary": "<2-3 sentence overall assessment>",
  "categories": {
    "task_achievement": { "score": <1-10>, "feedback": "<did they address the task fully?>" },
    "coherence_cohesion": { "score": <1-10>, "feedback": "<organisation, paragraphing, linking>" },
    "lexical_resource": { "score": <1-10>, "feedback": "<vocabulary range and accuracy>" },
    "grammatical_range": { "score": <1-10>, "feedback": "<grammar range and accuracy>" }
  },
  "strengths": ["<strength 1>", "<strength 2>"],
  "improvements": ["<improvement 1>", "<improvement 2>", "<improvement 3>"],
  "corrected_sentences": [
    { "original": "<sentence with error>", "corrected": "<corrected version>", "explanation": "<why>" }
  ]
}`
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { essay, prompt, minWords, maxWords, promptId, essayType = 'general', imageUrl } = await req.json()

    // ── Rate limit check ────────────────────────────────────────────────────
    const dailyLimit = parseInt(Deno.env.get('ESSAY_DAILY_LIMIT') ?? '3', 10)

    if (promptId) {
      const authHeader = req.headers.get('Authorization')
      if (authHeader) {
        const supabase = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_ANON_KEY') ?? '',
          { global: { headers: { Authorization: authHeader } } }
        )

        const startOfDay = new Date()
        startOfDay.setHours(0, 0, 0, 0)

        const { count, error: countErr } = await supabase
          .from('essay_submissions')
          .select('*', { count: 'exact', head: true })
          .eq('prompt_id', promptId)
          .gte('submitted_at', startOfDay.toISOString())

        if (!countErr && count !== null && count >= dailyLimit) {
          return new Response(
            JSON.stringify({
              error: `Daily limit reached. You can submit this prompt up to ${dailyLimit} time${dailyLimit !== 1 ? 's' : ''} per day.`,
              limitReached: true,
              dailyLimit,
              usedToday: count,
            }),
            { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
      }
    }

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
    const systemPrompt = getSystemPrompt(essayType)

    // Fetch and encode image server-side if a URL was provided
    let imageBase64: string | null = null
    let imageMimeType: string = 'image/jpeg'
    if (essayType === 'ielts_task1_academic' && imageUrl) {
      try {
        const imgRes = await fetch(imageUrl)
        if (imgRes.ok) {
          const buffer = await imgRes.arrayBuffer()
          const bytes = new Uint8Array(buffer)
          let binary = ''
          for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i])
          imageBase64 = btoa(binary)
          imageMimeType = imgRes.headers.get('content-type') ?? 'image/jpeg'
        }
      } catch {
        // If image fetch fails, continue without it
      }
    }

    const hasImage = !!imageBase64

    // Use vision model when an image is provided, text model otherwise
    const model = hasImage
      ? 'meta-llama/llama-4-scout-17b-16e-instruct'
      : 'llama-3.3-70b-versatile'

    const textContent = `Essay Prompt: ${prompt}

Student's Essay (${wordCount} words):
${essay}
${minWords ? `\nMinimum required words: ${minWords}` : ''}
${maxWords ? `Maximum allowed words: ${maxWords}` : ''}
${hasImage ? '\nThe student has also uploaded the visual data (chart/graph/diagram) they were asked to describe. Use it to verify whether their description is accurate, and include observations about accuracy in your task_achievement feedback.' : ''}`

    // Build user message — multimodal if image present
    const userMessage = hasImage
      ? [
          { type: 'text', text: textContent },
          { type: 'image_url', image_url: { url: `data:${imageMimeType};base64,${imageBase64}` } },
        ]
      : textContent

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        temperature: 0.3,
        max_tokens: 2048,
        // json_object mode not supported with vision model — rely on system prompt
        ...(hasImage ? {} : { response_format: { type: 'json_object' } }),
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
      // Strip markdown code fences if the vision model wraps its output
      const cleaned = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()
      feedback = JSON.parse(cleaned)
    } catch {
      return new Response(
        JSON.stringify({ error: 'Failed to parse AI response', raw: rawText }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ feedback, wordCount, dailyLimit }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
