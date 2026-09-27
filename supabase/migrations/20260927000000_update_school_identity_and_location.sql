-- Keep the school identity and map location consistent with the current school.
UPDATE schools
SET name = 'Janta Vidyalaya',
    address = 'Mohopada, Rasayani',
    latitude = 18.863100,
    longitude = 73.130900
WHERE name = 'Green Valley Government School'
   OR address = 'Green Valley, Bengaluru, Karnataka 560001, India';

-- Update any existing survey record that still uses the former school name.
UPDATE survey
SET organization_name = 'Janta Vidyalaya'
WHERE organization_name = 'Green Valley Government School';

-- Ensure school needs continue to reference the renamed school.
UPDATE school_needs
SET school_id = (
  SELECT id FROM schools
  WHERE name = 'Janta Vidyalaya'
     OR address = 'Mohopada, Rasayani'
  ORDER BY created_at
  LIMIT 1
)
WHERE school_id IS NULL
   OR school_id IN (
     SELECT id FROM schools
     WHERE name = 'Green Valley Government School'
        OR address = 'Green Valley, Bengaluru, Karnataka 560001, India'
   );
