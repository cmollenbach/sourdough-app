import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import { useAuth } from "../hooks/useAuthHook";
import { useToast } from "../context/ToastContext";

export default function AccountPage() {
  // Removed 'login' from useAuth() as it's for authentication, not profile updates.
  // You'll need a dedicated function in useAuth (e.g., updateUserProfile) or a direct API call
  // to update user information.
  const { user } = useAuth();
  const { showToast } = useToast();

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
      showToast("You need to be logged in to update your profile.", {
        type: "error"
      });
      return;
    }

    try {
      // Implement actual profile update logic
      // await updateUserProfile({ name: displayName });
      // For now, we'll simulate the API call
      console.log("Attempting to update profile with name:", displayName);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Show success message
      showToast("Profile updated successfully!", {
        type: "success"
      });
      
      // You would typically update the user context here with the new name
      // setUser({ ...user, name: displayName });
      
    } catch (error) {
      console.error("Failed to update profile:", error);
      showToast("Failed to update profile. Please try again.", {
        type: "error"
      });
    }
  }

  if (!user) {
    return <div className="py-10 text-center text-text-secondary">Loading user information&hellip;</div>;
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <header className="space-y-1 text-center sm:text-left">
        <h1 className="text-3xl font-bold text-text-primary">Account</h1>
        <p className="text-text-secondary">Update your display details for shared activity.</p>
      </header>

      <form
        onSubmit={handleSave}
        className="space-y-6 rounded-2xl border border-border bg-surface-elevated p-6 shadow-card"
      >
        <div className="space-y-2">
          <label htmlFor="displayName" className="form-label">
            Display name
          </label>
          <input
            id="displayName"
            className="form-input"
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            placeholder="Your display name"
          />
          <p className="text-xs text-text-tertiary">
            This name appears alongside your recipes and bake history.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button type="submit" className="btn-primary sm:w-auto">
            Save changes
          </button>
        </div>
      </form>
    </div>
  );
}