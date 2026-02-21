-- 1. First, make sure RLS is actually enabled (it likely already is)
ALTER TABLE activation_codes ENABLE ROW LEVEL SECURITY;

-- 2. Allow the game to read the code hashes to check if they are valid
CREATE POLICY "Allow public read access" 
ON activation_codes 
FOR SELECT 
TO public 
USING (true);

-- 3. Allow the game to update the code status to 'used' when claimed
CREATE POLICY "Allow public update access" 
ON activation_codes 
FOR UPDATE 
TO public 
USING (true);
