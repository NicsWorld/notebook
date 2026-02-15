import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { CameraCapture } from "../components/CameraCapture";
import { StatusBadge } from "../components/StatusBadge";
import { TagBadge } from "../components/TagBadge";
import { getPages, getPageStatus, type Page } from "../api/client";

export function HomePage() {
    const [pages, setPages] = useState<Page[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const fetchPages = useCallback(async () => {
        try {
            const data = await getPages({ limit: 50 });
            setPages(data.pages);
        } catch (err) {
            console.error("Failed to fetch pages:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPages();
    }, [fetchPages]);

    // Poll for processing pages
    useEffect(() => {
        const processingPages = pages.filter((p) => p.status === "processing");
        if (processingPages.length === 0) return;

        const interval = setInterval(async () => {
            let updated = false;
            for (const page of processingPages) {
                try {
                    const status = await getPageStatus(page.id);
                    if (status.status !== "processing") {
                        updated = true;
                    }
                } catch {
                    // ignore
                }
            }
            if (updated) fetchPages();
        }, 3000);

        return () => clearInterval(interval);
    }, [pages, fetchPages]);

    const handleUploadComplete = (_pageId: string) => {
        fetchPages();
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
        });
    };

    return (
        <div>
            <CameraCapture onUploadComplete={handleUploadComplete} />

            <div style={{ marginTop: "var(--space-xl)" }}>
                <div className="section-header">
                    <h2 className="section-title">📚 Your Pages</h2>
                    {pages.length > 0 && (
                        <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
                            {pages.length} page{pages.length !== 1 ? "s" : ""}
                        </span>
                    )}
                </div>

                {loading ? (
                    <div className="page-grid">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="card">
                                <div className="skeleton" style={{ height: 180, marginBottom: 16 }} />
                                <div className="skeleton" style={{ height: 16, width: "60%", marginBottom: 8 }} />
                                <div className="skeleton" style={{ height: 14, width: "80%" }} />
                            </div>
                        ))}
                    </div>
                ) : pages.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">📓</div>
                        <div className="empty-state-title">No pages yet</div>
                        <p>Capture or upload your first notebook page to get started!</p>
                    </div>
                ) : (
                    <div className="page-grid">
                        {pages.map((page) => (
                            <div
                                key={page.id}
                                className="card page-card"
                                onClick={() => navigate(`/page/${page.id}`)}
                            >
                                <img
                                    src={page.imageUrl}
                                    alt="Notebook page"
                                    className="page-card-image"
                                    loading="lazy"
                                />
                                <div className="page-card-meta">
                                    <span className="page-card-date">{formatDate(page.createdAt)}</span>
                                    <StatusBadge status={page.status} />
                                </div>
                                {page.cleanText && (
                                    <p className="page-card-preview">{page.cleanText}</p>
                                )}
                                {page.tags && page.tags.length > 0 && (
                                    <div className="page-card-tags">
                                        {page.tags.map((tag) => (
                                            <TagBadge key={tag.id} name={tag.name} />
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
