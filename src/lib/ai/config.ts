/**
 * AI SDK Configuration
 *
 * Sets up the Vercel AI SDK with OpenAI provider for medical summaries.
 * Uses gpt-4o-mini for cost-effective yet accurate medical text generation.
 *
 * Created: 2026-02-10 - MV2-030 AI Patient Summary Generation
 */

import { createOpenAI } from '@ai-sdk/openai'

/**
 * OpenAI provider instance configured with API key from environment.
 */
export const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

/**
 * Default model for medical summary generation.
 * gpt-4o-mini provides a good balance of quality and cost for medical text.
 */
export const model = openai('gpt-4o-mini')

/**
 * Maximum retry attempts for AI generation calls.
 */
export const MAX_RETRIES = 3

/**
 * Delay between retry attempts in milliseconds.
 */
export const RETRY_DELAY_MS = 1000

/**
 * Helper function to delay execution (for retries).
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
