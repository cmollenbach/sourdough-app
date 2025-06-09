import { useState, useEffect } from "react";
import type { FormEvent } from "react"; // Import FormEvent as a type
import { useAuth } from "../hooks/useAuthHook";
import { useToast } from "../context/ToastContext";

export default function AccountPage() {
  // Removed 'login' from useAuth() as it's for authentication, not profile updates.
  // You'll need a dedicated function in useAuth (e.g., updateUserProfile) or a direct API call
  // to update user information.
  const { user } = useAuth();
  const { addToast } = useToast();

  // State for the editable display name. Initialize as empty and populate via useEffect.
  // Assuming 'user.name' or 'user.username' or 'user.email' is the field to be displayed/edited.
  const [displayName, setDisplayName] = useState("");

  useEffect(() => {
    if (user) {
      // Set the initial value for the input field from the user object.
      // The errors indicate 'user.name' and 'user.username' do not exist on type 'User'.
      // Assuming 'user.email' is a valid property. Adjust if your User type has a different display field.
      setDisplayName(user.email || "");
    }
  }, [user]); // Re-run if the user object changes

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    if (!user) {
      addToast({
        message: "You need to be logged in to update your profile.",
        type: "error"
      });
      return;
    }

    // TODO: Implement actual profile update logic here.
    // This would typically involve calling a function like:
    // await updateUserProfile({ name: displayName });
    // or making a direct API call to your backend.
    console.log("Attempting to update profile with name:", displayName);
    addToast({
      message: "Profile update functionality is a placeholder.",
      type: "info"
    });
    // Simulating success for now:
    addToast({
      message: "Profile updated (simulated)!",
      type: "success"
    });
  }

  if (!user) {
    return <div className="p-4 text-center">Loading user information or please log in.</div>;
  }

  return (
    <div className="p-4 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Account</h1>
      <form onSubmit={handleSave} className="flex flex-col gap-2">
        <label>
          Name: {/* Changed from "Username" for clarity, adjust if needed */}
          <input
            className="border rounded px-2 py-1 ml-2"
            value={displayName} // displayName is now guaranteed to be a string
            onChange={e => setDisplayName(e.target.value)}
            placeholder="Your display name"
          />
        </label>
        <button type="submit" className="bg-blue-600 text-white rounded px-4 py-2 mt-2">
          Save
        </button>
      </form>
    </div>
  );
}