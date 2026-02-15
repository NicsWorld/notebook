import type { Page } from "../api/client";

interface StatusBadgeProps {
    status: Page["status"];
}

export function StatusBadge({ status }: StatusBadgeProps) {
    return (
        <span className={`status-badge ${status}`}>
            <span className="status-dot" />
            {status}
        </span>
    );
}
