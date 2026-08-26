import assert from "node:assert/strict";
import { searchLessons, type Lesson, type VectorClient } from "./semantic_search_service.js";

const expected: Lesson = { id: "l1", title: "Fractions on a number line", transcript: "visual fractions", creator: "Mina Chen", playbackUrl: "https://media.example/l1", course_id: "math-foundations" };
const fake: VectorClient = { embed: async () => [0.1, 0.2], createCollection: async () => {}, upsert: async () => {}, query: async (_embedding, _top_k, course_id) => course_id === expected.course_id ? [expected] : [] };
const found = await searchLessons(fake, { query: "fractions", course_id: "math-foundations" });
assert.deepEqual(found, [expected]);
await assert.rejects(() => searchLessons(fake, { query: "   " }));
console.log("semantic search boundary and delivery decision passed");
