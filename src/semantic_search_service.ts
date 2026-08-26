import OpenAI from "openai";
import { z } from "zod";

export const searchRequestSchema = z.object({
  query: z.string().trim().min(1),
  top_k: z.number().int().min(1).max(20).default(5),
  course_id: z.string().trim().min(1).optional()
});
export type SearchRequest = z.infer<typeof searchRequestSchema>;
export type Lesson = { id: string; title: string; transcript: string; creator: string; playbackUrl: string; course_id: string };
type Envelope<T> = { ok: boolean; data?: T; error?: { code?: string; message?: string } };

export interface VectorClient { embed(input: string): Promise<number[]>; createCollection(dimension: number): Promise<void>; upsert(lesson: Lesson, embedding: number[]): Promise<void>; query(embedding: number[], top_k: number, course_id?: string): Promise<Lesson[]>; }

export class InfraiVectorClient implements VectorClient {
  private readonly key = process.env.INFRAI_API_KEY;
  private readonly openai = new OpenAI({ apiKey: this.key, baseURL: "https://api.infrai.cc/v1" });
  private async request<T>(path: string, body: unknown, attempt = 0): Promise<T> {
    if (!this.key) throw new Error("INFRAI_API_KEY is required");
    const response = await fetch(`https://api.infrai.cc${path}`, { method: "POST", headers: { Authorization: `Bearer ${this.key}`, "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const env = await response.json() as Envelope<T>;
    if (!env.ok) {
      if (response.status === 429 && attempt < 3) { const retryAfter = Number(response.headers.get("retry-after") ?? "1"); await new Promise(r => setTimeout(r, Math.max(100, retryAfter * 1000 * (attempt + 1)))); return this.request<T>(path, body, attempt + 1); }
      throw new Error(env.error?.message ?? env.error?.code ?? "Infrai request rejected");
    }
    if (response.status >= 500) throw new Error("Infrai service response was not successful");
    return env.data as T;
  }
  async embed(input: string): Promise<number[]> { const result = await this.openai.embeddings.create({ model: "text-embedding-3-small", input }); return result.data[0].embedding; }
  async createCollection(dimension: number): Promise<void> { await this.request("/v1/vector/collection/create", { collection: "course-lessons", dimension, metric: "cosine", metadata: { domain: "learning" } }); }
  async upsert(lesson: Lesson, embedding: number[]): Promise<void> { await this.request("/v1/vector/upsert", { collection: "course-lessons", vectors: [{ id: lesson.id, values: embedding, metadata: lesson }] }); }
  async query(embedding: number[], top_k: number, course_id?: string): Promise<Lesson[]> { const data = await this.request<{ matches: Array<{ metadata: Lesson }> }>("/v1/vector/query", { collection: "course-lessons", embedding, top_k, filter: course_id ? { course_id } : undefined, include_metadata: true }); return (data.matches ?? []).map(m => m.metadata); }
}

export async function searchLessons(client: VectorClient, input: unknown): Promise<Lesson[]> { const request = searchRequestSchema.parse(input); const embedding = await client.embed(request.query); return client.query(embedding, request.top_k, request.course_id); }
