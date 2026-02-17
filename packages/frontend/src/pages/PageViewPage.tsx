import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getPage, getPageStatus, deletePage, type Page, type KnowledgeUnit } from "../api/client";
import { StatusBadge } from "../components/StatusBadge";
import { TagBadge } from "../components/TagBadge";
import { KnowledgeSection, KnowledgeDashboard, typeOrder } from "../components/KnowledgeCard";

export function PageViewPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [page, setPage] = useState<Page | null>(null);
    const [loading, setLoading] = useState(true);
    const [showRawText, setShowRawText] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const fetchPage = useCallback(async () => {
        if (!id) return;
        try {
            const data = await getPage(id);
            setPage(data);
        } catch (err) {
            console.error("Failed to fetch page:", err);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchPage();
    }, [fetchPage]);

    // Poll while processing
    useEffect(() => {
        if (!page || page.status !== "processing") return;

        const interval = setInterval(async () => {
            try {
                const status = await getPageStatus(page.id);
                if (status.status !== "processing") {
                    fetchPage();
                }
            } catch {
                // ignore
            }
        }, 2500);

        return () => clearInterval(interval);
    }, [page, fetchPage]);

    const handleDelete = async () => {
        if (!page || !confirm("Delete this page? This cannot be undone.")) return;
        setDeleting(true);
        try {
            await deletePage(page.id);
            navigate("/");
        } catch (err) {
            console.error("Failed to delete:", err);
            setDeleting(false);
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
        });
    };

    const groupByType = (units: KnowledgeUnit[]) => {
        const groups: Partial<Record<KnowledgeUnit["type"], KnowledgeUnit[]>> = {};
        for (const unit of units) {
            if (!groups[unit.type]) groups[unit.type] = [];
            groups[unit.type]!.push(unit);
        }
        return groups;
    };

    if (loading) {
        return (
            <div className="page-detail">
                <div className="skeleton" style={{ height: 40, width: 200, marginBottom: 24 }} />
                <div className="skeleton" style={{ height: 300, marginBottom: 24 }} />
                <div className="skeleton" style={{ height: 20, width: "80%", marginBottom: 12 }} />
                <div className="skeleton" style={{ height: 20, width: "60%" }} />
            </div>
        );
    }

    if (!page) {
        return (
            <div className="empty-state">
                <div className="empty-state-icon">🔍</div>
                <div className="empty-state-title">Page not found</div>
                <button className="btn btn-ghost" onClick={() => navigate("/")}>
                    ← Back to pages
                </button>
            </div>
        );
    }

    const kuGroups = groupByType(page.knowledgeUnits || []);

    return (
        <div className="page-detail">
            <div className="page-detail-header">
                <button className="btn btn-ghost" onClick={() => navigate("/")}>
                    ← Back
                </button>
                <StatusBadge status={page.status} />
                <span style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginLeft: "auto" }}>
                    {formatDate(page.createdAt)}
                </span>
                <button
                    className="btn btn-ghost"
                    style={{ color: "var(--accent-rose)" }}
                    onClick={handleDelete}
                    disabled={deleting}
                >
                    {deleting ? "Deleting..." : "🗑️ Delete"}
                </button>
            </div>

            {/* Image */}
            <img src={page.imageUrl} alt="Notebook page" className="page-detail-image" />

            {/* Tags */}
            {page.tags && page.tags.length > 0 && (
                <div className="page-card-tags" style={{ marginBottom: "var(--space-lg)" }}>
                    {page.tags.map((tag) => (
                        <TagBadge key={tag.id} name={tag.name} />
                    ))}
                </div>
            )}

            {page.status === "processing" && (
                <div className="card" style={{ textAlign: "center", padding: "var(--space-xl)" }}>
                    <div className="spinner" style={{ margin: "0 auto var(--space-md)" }} />
                    <p style={{ color: "var(--text-secondary)" }}>
                        AI is reading your notebook page... This usually takes 10-30 seconds.
                    </p>
                </div>
            )}

            {page.status === "failed" && (
                <div className="toast error" style={{ position: "relative", bottom: "auto", right: "auto", maxWidth: "100%" }}>
                    <strong>Processing failed:</strong> {page.errorMessage || "Unknown error"}
                </div>
            )}

            {page.status === "completed" && (
                <>
                    {/* Summary Dashboard */}
                    <KnowledgeDashboard groups={kuGroups} />

                    {/* Clean text */}
                    {page.cleanText && (
                        <div className="text-section">
                            <h3 className="text-section-title">📝 Clean Text</h3>
                            <div className="text-content">{page.cleanText}</div>
                        </div>
                    )}

                    {/* Raw OCR text (collapsible) */}
                    {page.rawOcrText && (
                        <div className="text-section">
                            <div
                                className="collapsible-trigger"
                                onClick={() => setShowRawText(!showRawText)}
                            >
                                <span className={`collapsible-arrow ${showRawText ? "open" : ""}`}>▶</span>
                                Raw OCR Text
                            </div>
                            {showRawText && (
                                <div className="text-content" style={{ opacity: 0.7 }}>
                                    {page.rawOcrText}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Knowledge units grouped by type */}
                    {typeOrder.map((type) =>
                        kuGroups[type] ? (
                            <KnowledgeSection key={type} type={type} units={kuGroups[type]} />
                        ) : null
                    )}

                    {(!page.knowledgeUnits || page.knowledgeUnits.length === 0) && (
                        <div className="empty-state" style={{ padding: "var(--space-lg)" }}>
                            <p>No knowledge units were extracted from this page.</p>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
