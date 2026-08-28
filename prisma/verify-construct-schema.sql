DO $$
DECLARE
  construct_table_count integer;
BEGIN
  SELECT count(*)
  INTO construct_table_count
  FROM information_schema.tables
  WHERE table_schema = 'construct'
    AND table_type = 'BASE TABLE';

  IF construct_table_count <> 23 THEN
    RAISE EXCEPTION
      'Expected 23 Construct tables, found %',
      construct_table_count;
  END IF;
END $$;
