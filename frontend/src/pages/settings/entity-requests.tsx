import EntityRequestAdminList from '../../components/EntityRequest/EntityRequestAdminList';

export default function EntityRequestsSettingsPage() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Entity Requests (Admin)</h1>
      <EntityRequestAdminList />
    </div>
  );
}