

interface ActiveBakeIndicatorProps {
  time?: string; // e.g., "00:40:13"
  isActive?: boolean;
}

export default function ActiveBakeIndicator({ time = "00:40:13", isActive = true }: ActiveBakeIndicatorProps) {
  if (!isActive) return null;
  return (
    <span className="ml-4 text-red-600 font-semibold">
      Active Bake 🔴 {time}
    </span>
  );
}