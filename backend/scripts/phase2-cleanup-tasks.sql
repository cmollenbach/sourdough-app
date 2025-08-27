-- Phase 2 Database Cleanup Tasks
-- Strategic cleanup operations to be run after migration
-- This file contains the specific cleanup tasks identified in our analysis

-- 1. Data Migration Safety Checks
-- Check for any DURATION parameter types before cleanup
SELECT COUNT(*) as duration_params FROM "StepParameter" WHERE type = 'DURATION';

-- Check for any MODERATOR users before cleanup  
SELECT COUNT(*) as moderator_users FROM "User" WHERE role = 'MODERATOR';

-- 2. Bake System Assessment
-- Identify rarely used bake tracking features for potential simplification
SELECT 
    'BakeRating' as table_name,
    COUNT(*) as total_records,
    COUNT(DISTINCT "bakeId") as unique_bakes,
    AVG(rating) as avg_rating
FROM "BakeRating"
UNION ALL
SELECT 
    'BakeTargetSnapshot' as table_name,
    COUNT(*) as total_records,
    COUNT(DISTINCT "bakeId") as unique_bakes,
    NULL as avg_rating
FROM "BakeTargetSnapshot";

-- 3. Performance Index Assessment
-- Check if our new indexes are being used effectively
-- (This would be run after some usage to assess effectiveness)

-- 4. Unused Parameter Cleanup Assessment
-- Check for parameters that are never actually used
SELECT 
    sp.key,
    sp.type,
    COUNT(DISTINCT sp."stepTemplateId") as templates_using,
    COUNT(*) as total_occurrences
FROM "StepParameter" sp
GROUP BY sp.key, sp.type
HAVING COUNT(DISTINCT sp."stepTemplateId") = 1  -- Only used in one template
ORDER BY total_occurrences ASC;

-- 5. Ingredient Rules Simplification Check
-- Identify overly complex ingredient rules that could be simplified
SELECT 
    stir."templateId",
    stir."ingredientId", 
    stir.condition,
    COUNT(*) as rule_count
FROM "StepTemplateIngredientRule" stir
GROUP BY stir."templateId", stir."ingredientId", stir.condition
HAVING COUNT(*) > 3  -- Templates with many rules per ingredient
ORDER BY rule_count DESC;

-- 6. User Experience Validation
-- Ensure our merged user profile data is consistent
SELECT 
    "experienceLevel",
    COUNT(*) as user_count,
    AVG("recipesCreated") as avg_recipes,
    AVG("bakesCompleted") as avg_bakes
FROM "UserProfile"
GROUP BY "experienceLevel"
ORDER BY user_count DESC;

-- 7. Final Data Integrity Checks
-- Ensure all foreign key relationships are intact after merge
SELECT 
    'UserProfile-User' as relationship,
    COUNT(up.id) as profiles,
    COUNT(u.id) as matching_users
FROM "UserProfile" up
LEFT JOIN "User" u ON up."userId" = u.id;

-- Check UserAction foreign keys
SELECT 
    'UserAction-UserProfile' as relationship,
    COUNT(ua.id) as actions,
    COUNT(up.id) as matching_profiles
FROM "UserAction" ua
LEFT JOIN "UserProfile" up ON ua."profileId" = up.id;

-- Check UserPreference foreign keys  
SELECT 
    'UserPreference-UserProfile' as relationship,
    COUNT(upref.id) as preferences,
    COUNT(up.id) as matching_profiles
FROM "UserPreference" upref
LEFT JOIN "UserProfile" up ON upref."profileId" = up.id;
