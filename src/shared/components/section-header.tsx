interface SectionHeaderProps {
  title: string;
  description?: string;
  gradientClass?: string;
}

export function SectionHeader({
  title,
  description,
  gradientClass = "from-orange-50 via-orange-25 to-orange-50",
}: SectionHeaderProps) {
  return (
    <div
      className={`bg-gradient-to-r ${gradientClass} rounded-xl p-6 border border-orange-100`}
    >
      <h2 className="text-xl font-bold text-gray-900 mb-2 heading-optimized">
        {title}
      </h2>
      {description && (
        <p className="text-sm text-gray-600 text-small-optimized">
          {description}
        </p>
      )}
    </div>
  );
}
