const API_BASE = "/api";

export interface Page {
    id: string;
    userId: string | null;
    imageUrl: string;
    rawOcrText: string | null;
    cleanText: string | null;
    status: "uploading" | "processing" | "completed" | "failed";
    errorMessage: string | null;
    metadata: Record<string, unknown> | null;
    createdAt: string;
    updatedAt: string;
    tags?: Tag[];
    knowledgeUnits?: KnowledgeUnit[];
}

export interface KnowledgeUnit {
    id: string;
    pageId: string;
    type: "task" | "idea" | "note" | "question" | "action_item";
    content: string;
    completed: boolean;
    metadata: Record<string, unknown> | null;
    createdAt: string;
    page?: Pick<Page, "id" | "imageUrl" | "createdAt">;
}

export interface Tag {
    id: string;
    name: string;
    createdAt: string;
}

export interface PageListResponse {
    pages: Page[];
    total: number;
    limit: number;
    offset: number;
}

export interface KnowledgeUnitListResponse {
    knowledgeUnits: KnowledgeUnit[];
    total: number;
    limit: number;
    offset: number;
}

export interface PageStatusResponse {
    id: string;
    status: Page["status"];
    errorMessage: string | null;
    updatedAt: string;
}

export async function uploadPage(file: File): Promise<{ id: string; status: string; imageUrl: string }> {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(`${API_BASE}/pages/upload`, {
        method: "POST",
        body: formData,
    });

    if (!res.ok) throw new Error(`Upload failed: ${res.statusText}`);
    return res.json();
}

export async function getPages(params?: {
    status?: string;
    limit?: number;
    offset?: number;
}): Promise<PageListResponse> {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.set("status", params.status);
    if (params?.limit) searchParams.set("limit", String(params.limit));
    if (params?.offset) searchParams.set("offset", String(params.offset));

    const res = await fetch(`${API_BASE}/pages?${searchParams}`);
    if (!res.ok) throw new Error(`Failed to fetch pages: ${res.statusText}`);
    return res.json();
}

export async function getPage(id: string): Promise<Page> {
    const res = await fetch(`${API_BASE}/pages/${id}`);
    if (!res.ok) throw new Error(`Failed to fetch page: ${res.statusText}`);
    return res.json();
}

export async function getPageStatus(id: string): Promise<PageStatusResponse> {
    const res = await fetch(`${API_BASE}/pages/${id}/status`);
    if (!res.ok) throw new Error(`Failed to fetch status: ${res.statusText}`);
    return res.json();
}

export async function deletePage(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/pages/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error(`Failed to delete page: ${res.statusText}`);
}

export async function getKnowledgeUnits(params?: {
    type?: string;
    limit?: number;
    offset?: number;
}): Promise<KnowledgeUnitListResponse> {
    const searchParams = new URLSearchParams();
    if (params?.type) searchParams.set("type", params.type);
    if (params?.limit) searchParams.set("limit", String(params.limit));
    if (params?.offset) searchParams.set("offset", String(params.offset));

    const res = await fetch(`${API_BASE}/knowledge-units?${searchParams}`);
    if (!res.ok) throw new Error(`Failed to fetch knowledge units: ${res.statusText}`);
    return res.json();
}

export async function getTags(): Promise<{ tags: Tag[] }> {
    const res = await fetch(`${API_BASE}/tags`);
    if (!res.ok) throw new Error(`Failed to fetch tags: ${res.statusText}`);
    return res.json();
}

export async function toggleKnowledgeUnit(id: string): Promise<{ id: string; completed: boolean }> {
    const res = await fetch(`${API_BASE}/knowledge-units/${id}/toggle`, { method: "PATCH" });
    if (!res.ok) throw new Error(`Failed to toggle: ${res.statusText}`);
    return res.json();
}
