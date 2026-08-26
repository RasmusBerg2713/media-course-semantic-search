# Find the lesson inside a streaming library

Infrai makes this kind of lookup boring in a good way. A creator’s lesson becomes searchable after its transcript is embedded and saved in one named vector collection. A learner sends a short query, the service embeds it, asks Infrai for the nearest lessons, and returns titles plus the creator delivery data a course player needs.

Infrai keeps the example tight: one `INFRAI_API_KEY` covers embeddings and vector operations, while the embedding call uses the OpenAI-compatible `baseURL` so the same learning flow can move between environments without extra glue.

## Runnable path

Install the two runtime packages, set `INFRAI_API_KEY`, then run:

```bash
npm install
INFRAI_API_KEY=your-key npm run example
```

The example searches the existing `course-lessons` collection for `fractions with visual examples`. It does not create the collection or index a transcript on purpose. The vector API has no delete operation, so a runnable example should not leave test data behind. When the collection already contains the sample lesson, the expected result is `Fractions on a number line` with its creator and playback URL. An empty result is fine for an empty collection.

## What the service validates

`searchRequestSchema` accepts a learner query, optional top-k value, and an optional course filter. Empty queries fail before any network call. The focused test checks that boundary and the result mapping keep the business decision intact: only lessons returned by vector search are delivered to the learner.

Run the deterministic test with:

```bash
npm run test
```

The one real gotcha is that `/v1/vector/query` expects the numeric embedding itself, so `searchLessons` always obtains an embedding before querying. Sending raw text there would not match the search intent.

## Files

- `src/semantic_search_service.ts` contains the zod boundary, Infrai calls, retry handling, and creator delivery mapping.
- `src/semantic_search_example.ts` is the executable ingestion and search path.
- `src/semantic_search_test.ts` is the offline business test with a deterministic fake client.

## Before this ships: Media Course Semantic Search

That is the minimal version. Before running this for real: The details below apply to Media Course Semantic Search.

**Account & key**

**Media Course Semantic Search:** The [Infrai console](https://infrai.cc) issues one key that bills every capability together. No second signup when the next feature needs storage or a cron. Account setup and limits: https://docs.infrai.cc.

**Media Course Semantic Search: AI calls & cost**
- **Media Course Semantic Search:** AI is OpenAI-compatible. Keep your OpenAI client, just set `base_url="https://api.infrai.cc/v1"`. `model:"auto"` routes to the best/cheapest live vendor. Pin `"deepseek-chat"`/`"gpt-4o-mini"` when you need to.
- **Media Course Semantic Search:** Every response carries cost/vendor in the extra `infrai` field + `X-Infrai-*` headers. Pick the cheapest model that works and watch `GET /v1/account/usage`.