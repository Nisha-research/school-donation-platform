-- Ensure existing production data uses the requested school identity and map location.
UPDATE schools
SET name = 'Janta Vidyalaya',
    address = 'Mohopada, Rasayani',
    latitude = 18.863100,
    longitude = 73.130900
WHERE name = 'Green Valley Government School'
   OR address = 'Green Valley, Bengaluru, Karnataka 560001, India';

UPDATE survey
SET organization_name = 'Janta Vidyalaya'
WHERE organization_name = 'Green Valley Government School';

UPDATE school_needs sn
SET school_id = s.id
FROM schools s
WHERE (s.name = 'Janta Vidyalaya' OR s.address = 'Mohopada, Rasayani')
  AND sn.school_id IS NULL;
