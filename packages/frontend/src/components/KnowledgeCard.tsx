import { useState } from "react";
import type { KnowledgeUnit } from "../api/client";

const typeConfig: Record<KnowledgeUnit["type"], { icon: string; label: string; color: string }> = {
    task: { icon: "✅", label: "Tasks", color: "var(--accent-emerald)" },
    action_item: { icon: "🎯", label: "Action Items", color: "var(--accent-rose)" },
    idea: { icon: "💡", label: "Ideas", color: "var(--accent-amber)" },
    question: { icon: "❓", label: "Questions", color: "var(--accent-cyan)" },
    note: { icon: "📝", label: "Notes", color: "var(--accent-blue)" },
};

interface KnowledgeItemProps {
    unit: KnowledgeUnit;
    checkable?: boolean;
}

export function KnowledgeItem({ unit, checkable = false }: KnowledgeItemProps) {
    const [checked, setChecked] = useState(false);
    const config = typeConfig[unit.type];

    return (
        <div
            className={`ku-item ${unit.type}${checked ? " checked" : ""}`}
            onClick={checkable ? () => setChecked(!checked) : undefined}
            style={checkable ? { cursor: "pointer" } : undefined}
        >
            {checkable ? (
                <span className={`ku-checkbox${checked ? " checked" : ""}`}>
                    {checked ? "✓" : ""}
                </span>
            ) : (
                <span className="ku-item-icon" style={{ color: config.color }}>
                    {config.icon}
                </span>
            )}
            <span className={`ku-item-content${checked ? " struck" : ""}`}>
                {unit.content}
            </span>
        </div>
    );
}

interface KnowledgeSectionProps {
    type: KnowledgeUnit["type"];
    units: KnowledgeUnit[];
    defaultExpanded?: boolean;
}

export function KnowledgeSection({ type, units, defaultExpanded = true }: KnowledgeSectionProps) {
    const [expanded, setExpanded] = useState(defaultExpanded);
    const config = typeConfig[type];
    const isCheckable = type === "task" || type === "action_item";

    if (units.length === 0) return null;

    return (
        <div className={`ku-section ${type}`} id={`ku-section-${type}`}>
            <button
                className="ku-section-header"
                onClick={() => setExpanded(!expanded)}
            >
                <span className="ku-section-icon">{config.icon}</span>
                <span className="ku-section-label">{config.label}</span>
                <span className="ku-section-count" style={{ background: `${config.color}20`, color: config.color }}>
                    {units.length}
                </span>
                <span className={`ku-section-chevron${expanded ? " open" : ""}`}>›</span>
            </button>
            {expanded && (
                <div className="ku-item-list">
                    {units.map((unit) => (
                        <KnowledgeItem key={unit.id} unit={unit} checkable={isCheckable} />
                    ))}
                </div>
            )}
        </div>
    );
}

interface KnowledgeDashboardProps {
    groups: Partial<Record<KnowledgeUnit["type"], KnowledgeUnit[]>>;
}

const typeOrder: KnowledgeUnit["type"][] = ["task", "action_item", "idea", "question", "note"];

export function KnowledgeDashboard({ groups }: KnowledgeDashboardProps) {
    const activeTypes = typeOrder.filter((t) => groups[t] && groups[t]!.length > 0);
    if (activeTypes.length === 0) return null;

    const scrollTo = (type: string) => {
        document.getElementById(`ku-section-${type}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    return (
        <div className="ku-dashboard">
            {activeTypes.map((type) => {
                const config = typeConfig[type];
                return (
                    <button
                        key={type}
                        className="ku-dashboard-chip"
                        style={{
                            background: `${config.color}15`,
                            borderColor: `${config.color}30`,
                            color: config.color,
                        }}
                        onClick={() => scrollTo(type)}
                    >
                        <span>{config.icon}</span>
                        <span className="ku-dashboard-count">{groups[type]!.length}</span>
                        <span className="ku-dashboard-label">{config.label}</span>
                    </button>
                );
            })}
        </div>
    );
}

export { typeConfig, typeOrder };
