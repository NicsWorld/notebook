import type { KnowledgeUnit } from "../api/client";

interface KnowledgeCardProps {
    unit: KnowledgeUnit;
}

const typeIcons: Record<KnowledgeUnit["type"], string> = {
    task: "✅",
    idea: "💡",
    note: "📝",
    question: "❓",
    action_item: "🎯",
};

const typeLabels: Record<KnowledgeUnit["type"], string> = {
    task: "Task",
    idea: "Idea",
    note: "Note",
    question: "Question",
    action_item: "Action Item",
};

export function KnowledgeCard({ unit }: KnowledgeCardProps) {
    return (
        <div className={`ku-card ${unit.type}`}>
            <div className="ku-card-type">
                {typeIcons[unit.type]} {typeLabels[unit.type]}
            </div>
            <div className="ku-card-content">{unit.content}</div>
        </div>
    );
}

interface KnowledgeSectionProps {
    type: KnowledgeUnit["type"];
    units: KnowledgeUnit[];
}

export function KnowledgeSection({ type, units }: KnowledgeSectionProps) {
    if (units.length === 0) return null;

    return (
        <div className="ku-section">
            <h3 className="ku-section-title">
                {typeIcons[type]} {typeLabels[type]}s ({units.length})
            </h3>
            <div className="ku-list">
                {units.map((unit) => (
                    <KnowledgeCard key={unit.id} unit={unit} />
                ))}
            </div>
        </div>
    );
}
