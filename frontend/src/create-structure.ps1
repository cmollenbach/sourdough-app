$folders = @(
  "components/Navbar",
  "components/Recipe",
  "components/Bake",
  "components/History",
  "components/EntityRequest",
  "components/Settings",
  "components/Shared",
  "pages/recipes",
  "pages/bakes",
  "pages/history",
  "pages/settings",
  "hooks",
  "context",
  "utils",
  "styles",
  "types"
)

$files = @(
  "components/Navbar/Navbar.tsx",
  "components/Recipe/RecipeForm.tsx",
  "components/Recipe/RecipeCalculator.tsx",
  "components/Recipe/RecipeStepList.tsx",
  "components/Recipe/RecipeStepEditor.tsx",
  "components/Bake/ActiveBakeIndicator.tsx",
  "components/Bake/BakeList.tsx",
  "components/History/BakeHistoryList.tsx",
  "components/EntityRequest/EntityRequestModal.tsx",
  "components/EntityRequest/EntityRequestDropdownItem.tsx",
  "components/EntityRequest/EntityRequestAdminList.tsx",
  "components/Settings/SettingsMenu.tsx",
  "components/Settings/IngredientAdminPanel.tsx",
  "components/Shared/Modal.tsx",
  "components/Shared/Dropdown.tsx",
  "pages/index.tsx",
  "pages/recipes/index.tsx",
  "pages/recipes/[id].tsx",
  "pages/bakes/index.tsx",
  "pages/history/index.tsx",
  "pages/settings/index.tsx",
  "pages/settings/ingredients.tsx",
  "pages/settings/entity-requests.tsx",
  "pages/login.tsx",
  "hooks/useRecipes.ts",
  "hooks/useEntityRequests.ts",
  "context/AuthContext.tsx",
  "context/SettingsContext.tsx",
  "utils/api.ts",
  "utils/formatters.ts",
  "App.tsx"
)

# Create folders if they don't exist
foreach ($folder in $folders) {
  if (-not (Test-Path $folder)) {
    New-Item -ItemType Directory -Path $folder | Out-Null
  }
}

# Create files if they don't exist
foreach ($file in $files) {
  if (-not (Test-Path $file)) {
    New-Item -ItemType File -Path $file | Out-Null
  }
}

Write-Host "Folder and file structure created (existing files were not overwritten)."