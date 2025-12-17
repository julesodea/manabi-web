-- Temporary fix to allow user collections without authentication
-- This allows the app to work without auth implemented yet
-- TODO: Remove this and require proper auth when authentication is added

-- Drop the restrictive INSERT policy
DROP POLICY IF EXISTS "Users can create their own collections" ON collections;

-- Create a more permissive INSERT policy that allows NULL user_id (for now)
CREATE POLICY "Allow collection creation with or without auth"
  ON collections FOR INSERT
  WITH CHECK (
    type = 'system' OR
    type = 'user' AND (auth.uid() = user_id OR user_id IS NULL)
  );

-- Also update SELECT policy to allow viewing user collections with NULL user_id
DROP POLICY IF EXISTS "Users can view their own collections" ON collections;

CREATE POLICY "Users can view their own or unowned collections"
  ON collections FOR SELECT
  USING (
    type = 'system' OR
    (type = 'user' AND (auth.uid() = user_id OR user_id IS NULL))
  );

-- Update UPDATE policy to allow updating collections without user_id
DROP POLICY IF EXISTS "Users can update their own collections" ON collections;

CREATE POLICY "Users can update their own or unowned collections"
  ON collections FOR UPDATE
  USING (
    auth.uid() = user_id OR user_id IS NULL
  );

-- Update DELETE policy to allow deleting collections without user_id
DROP POLICY IF EXISTS "Users can delete their own collections" ON collections;

CREATE POLICY "Users can delete their own or unowned collections"
  ON collections FOR DELETE
  USING (
    auth.uid() = user_id OR user_id IS NULL
  );
