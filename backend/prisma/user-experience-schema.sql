// Database schema additions for user experience tracking
-- Add to your existing Prisma schema

model UserProfile {
  id                    Int       @id @default(autoincrement())
  userId                Int       @unique
  experienceLevel       String    @default("beginner") // "beginner", "intermediate", "advanced"
  recipesCreated        Int       @default(0)
  bakesCompleted        Int       @default(0)
  advancedFeaturesUsed  Json      @default("[]") // Array of feature names
  preferences           Json      @default("{}") // User UI preferences
  lastLevelUpdate       DateTime  @default(now())
  createdAt            DateTime  @default(now())
  updatedAt            DateTime  @updatedAt
  
  // Relations
  user                 User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@map("user_profiles")
}

model UserAction {
  id          Int      @id @default(autoincrement())
  userId      Int
  actionType  String   // "recipe_created", "bake_completed", "advanced_feature_used", etc.
  actionData  Json?    // Additional context about the action
  createdAt   DateTime @default(now())
  
  // Relations
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@map("user_actions")
}

model UserPreference {
  id          Int      @id @default(autoincrement())
  userId      Int
  key         String   // "showAdvanced", "defaultHydration", "preferredStepTemplate", etc.
  value       String   // JSON string or simple value
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Relations
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@unique([userId, key])
  @@map("user_preferences")
}
