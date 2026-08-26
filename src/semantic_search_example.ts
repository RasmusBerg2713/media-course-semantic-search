import { InfraiVectorClient, searchLessons } from "./semantic_search_service.js";

const client = new InfraiVectorClient();
const results = await searchLessons(client, { query: "fractions with visual examples", course_id: "math-foundations", top_k: 3 });
console.log(JSON.stringify(results.map(({ title, creator, playbackUrl }) => ({ title, creator, playbackUrl })), null, 2));
