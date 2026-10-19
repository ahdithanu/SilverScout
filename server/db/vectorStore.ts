import { UserRole } from '../../src/types';

export interface StoredChunk {
  chunkId: string;
  docId: string;
  fundId: string;
  chunkIndex: number;
  content: string;
  tokenCount: number;
  allowedRoles: UserRole[];
  embedding: number[];
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface VectorSearchResult {
  chunkId: string;
  docId: string;
  content: string;
  score: number; // Cosine similarity: 0.0 to 1.0
  allowedRoles: UserRole[];
  metadata?: Record<string, any>;
}

export class EnterpriseVectorStore {
  private static instance: EnterpriseVectorStore;
  private chunks: StoredChunk[] = [];

  private constructor() {}

  public static getInstance(): EnterpriseVectorStore {
    if (!EnterpriseVectorStore.instance) {
      EnterpriseVectorStore.instance = new EnterpriseVectorStore();
    }
    return EnterpriseVectorStore.instance;
  }

  /**
   * Calculates cosine similarity between two float vectors
   */
  public static cosineSimilarity(a: number[], b: number[]): number {
    if (!a || !b || a.length !== b.length || a.length === 0) return 0;
    let dot = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    if (normA === 0 || normB === 0) return 0;
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Indexes a batch of document chunks into the vector store
   */
  public async insertChunks(fundId: string, chunks: Omit<StoredChunk, 'fundId' | 'createdAt'>[]): Promise<number> {
    const timestamp = new Date().toISOString();
    const preparedChunks: StoredChunk[] = chunks.map(c => ({
      ...c,
      fundId,
      createdAt: timestamp
    }));

    // Remove existing chunks with same chunkId
    const incomingIds = new Set(preparedChunks.map(c => c.chunkId));
    this.chunks = this.chunks.filter(c => !incomingIds.has(c.chunkId));
    this.chunks.push(...preparedChunks);

    return preparedChunks.length;
  }

  /**
   * Performs Semantic Vector Search with Zero-Trust Multi-Tenant and Role ACL enforcement
   */
  public async searchSimilar(
    fundId: string,
    userRole: UserRole,
    queryEmbedding: number[],
    limit: number = 5,
    minSimilarity: number = 0.5
  ): Promise<VectorSearchResult[]> {
    // 1. Enforce Multi-Tenant Isolation: only search chunks belonging to fundId
    const fundChunks = this.chunks.filter(c => c.fundId === fundId);

    // 2. Enforce Zero-Trust ACL: callers can only retrieve chunks where their role is authorized
    // Global admin can inspect all fund chunks
    const authorizedChunks = fundChunks.filter(c => {
      if (userRole === 'admin') return true;
      return c.allowedRoles && c.allowedRoles.includes(userRole);
    });

    // 3. Compute cosine similarity against query embedding
    const scored = authorizedChunks.map(c => ({
      chunkId: c.chunkId,
      docId: c.docId,
      content: c.content,
      score: EnterpriseVectorStore.cosineSimilarity(queryEmbedding, c.embedding),
      allowedRoles: c.allowedRoles,
      metadata: c.metadata
    }));

    // 4. Filter by minimum similarity threshold and sort descending
    return scored
      .filter(s => s.score >= minSimilarity)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  /**
   * Returns total indexed chunk count
   */
  public getCount(fundId?: string): number {
    if (fundId) {
      return this.chunks.filter(c => c.fundId === fundId).length;
    }
    return this.chunks.length;
  }

  /**
   * Clears in-memory index
   */
  public clear(): void {
    this.chunks = [];
  }
}

export const vectorStore = EnterpriseVectorStore.getInstance();
