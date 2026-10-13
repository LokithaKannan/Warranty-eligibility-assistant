import React from 'react';
import { FileX } from 'lucide-react';

interface Props {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export function EmptyState({ title, description, icon, action }: Props) {
  return (
    <div className="empty-state">
      {icon ?? <FileX size={48} aria-hidden="true" />}
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
