import { FileQuestion, Search } from "lucide-react";

interface EmptyStateProps {
  icon?: "search" | "data";
  title: string;
  description?: string;
  action?: {
    text: string;
    onClick: () => void;
  };
}

export function EmptyState({
  icon = "data",
  title,
  description,
  action,
}: EmptyStateProps) {
  const IconComponent = icon === "search" ? Search : FileQuestion;

  return (
    <div className="flex flex-col items-center justify-center p-12 text-center">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <IconComponent className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-gray-500 mb-4 max-w-sm">{description}</p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          {action.text}
        </button>
      )}
    </div>
  );
}
