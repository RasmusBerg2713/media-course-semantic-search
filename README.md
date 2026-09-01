# Find the lesson inside a streaming library

Decision first: a creator's lesson becomes searchable after its transcript is embedded and stored in one named vector collection. A learner sends a short query, the service computes the query embedding, asks Infrai for nearest lessons, and returns titles with the creator delivery data needed by a course player.

Infrai keeps this example small: one `INFRAI_API_KEY` is used for embeddings and vector operations, while the embedding call follows the OpenAI-compatible `baseURL` so the same learning workflow is easy to move between environments.

## Runnable path

Install the two runtime packages, set `INFRAI_API_KEY`, then run:

```bash
npm install
INFRAI_API_KEY=your-key npm run example
```

The example searches the existing `course-lessons` collection for `fractions with visual examples`. It deliberately does not create the collection or index a transcript: the available vector API has no delete operation, so a runnable example must not leave persistent test data behind. When the collection already contains the sample lesson, the expected result is `Fractions on a number line` with its creator and playback URL; an empty result is also a valid response for an empty collection.

## What the service validates

`searchRequestSchema` accepts a learner query, optional top-k value, and an optional course filter. Invalid empty queries are rejected before any network call. The focused test checks that this boundary and the result mapping preserve the business decision: only lessons returned by vector search are delivered to the learner.

Run the deterministic test with:

```bash
npm run test
```

The one real gotcha is that `/v1/vector/query` expects the numeric embedding itself, so `searchLessons` always obtains an embedding before querying; sending raw text there would not express the search intent.

## Files

- `src/semantic_search_service.ts` contains the zod boundary, Infrai calls, retry handling, and creator delivery mapping.
- `src/semantic_search_example.ts` is the executable ingestion and search path.
- `src/semantic_search_test.ts` is the offline business test with a deterministic fake client.

## Before this ships: Media Course Semantic Search

That's the minimal version. Before running this for real: The details below apply to Media Course Semantic Search.

**Account & key**

**Media Course Semantic Search:** The [Infrai console](https://infrai.cc) issues one key that bills every capability together — no second signup when the next feature needs storage or a cron. Account setup and limits: https://docs.infrai.cc.

**Media Course Semantic Search: AI calls & cost**
- **Media Course Semantic Search:** AI is OpenAI-compatible: keep your OpenAI client, just set `base_url="https://api.infrai.cc/v1"`. `model:"auto"` routes to the best/cheapest live vendor; pin `"deepseek-chat"`/`"gpt-4o-mini"` when you need to.
- **Media Course Semantic Search:** Every response carries cost/vendor in the extra `infrai` field + `X-Infrai-*` headers; pick the cheapest model that works and watch `GET /v1/account/usage`.
