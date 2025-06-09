interface ActiveBakeIndicatorProps {
  isActive: boolean;
  // You could extend this with more specific statuses in the future
  // status?: 'IN_PROGRESS' | 'COMPLETED' | 'CANCELED' | 'INACTIVE';
}

export default function ActiveBakeIndicator({ isActive }: ActiveBakeIndicatorProps) {
  if (isActive) {
    return <span className="font-medium text-green-600">In Progress</span>;
  }
  // You might want different styling or text for explicitly inactive/completed bakes
  // For now, we'll assume 'inactive' covers bakes that are not 'active: true'
  return <span className="font-medium text-gray-500">Inactive</span>;
}