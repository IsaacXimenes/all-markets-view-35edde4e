
-- ============================================================
-- Security fix: remover policies permissivas (true) e exigir auth
-- ============================================================

DO $$
DECLARE r record;
BEGIN
  FOR r IN (
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND policyname LIKE 'allow_all_%'
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I;', r.policyname, r.schemaname, r.tablename);
    EXECUTE format(
      'CREATE POLICY auth_all ON %I.%I FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);',
      r.schemaname, r.tablename
    );
  END LOOP;
END $$;
