import { Link } from 'react-router-dom';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  actionLabel?: string;
  actionTo?: string;
  secondary?: React.ReactNode;
}

export function EmptyState({ title, description, icon, actionLabel, actionTo, secondary }: EmptyStateProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-8 text-center">
      <div className="text-4xl mb-3">{icon ?? '🧺'}</div>
      <h3 className="text-xl font-semibold text-gray-800 mb-2">{title}</h3>
      {description && <p className="text-gray-600 mb-6">{description}</p>}
      {actionLabel && actionTo && (
        <Link
          to={actionTo}
          className="inline-block bg-green-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-green-700"
        >
          {actionLabel}
        </Link>
      )}
      {secondary && <div className="mt-4">{secondary}</div>}
    </div>
  );
}
