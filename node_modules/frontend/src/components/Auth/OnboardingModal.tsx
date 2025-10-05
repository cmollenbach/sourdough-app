export function OnboardingModal({ name, onClose }: { name: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
      <div className="bg-white rounded-lg p-8 shadow-lg max-w-sm w-full text-center">
        <h2 className="text-2xl font-bold mb-2">Hi, {name}!</h2>
        <p className="mb-4">Loafly is your companion for every bake. Want a quick tour?</p>
        <div className="flex flex-col gap-2">
          <button className="btn-primary" onClick={onClose}>Start Baking</button>
          <button className="btn-secondary" onClick={() => { /* show tour */ }}>Show Me Around</button>
          <button className="btn-secondary" onClick={() => { /* go to recipes */ }}>Browse Recipes</button>
        </div>
      </div>
    </div>
  );
}