-- 1. Add pipeline tracking to detected_problems
ALTER TABLE detected_problems ADD COLUMN IF NOT EXISTS pipeline_status TEXT DEFAULT 'pending';
ALTER TABLE detected_problems ADD COLUMN IF NOT EXISTS pipeline_error TEXT;

-- 2. Add source_problem_id to tools and calendario_conteudo if not exists
ALTER TABLE tools ADD COLUMN IF NOT EXISTS source_problem_id UUID REFERENCES detected_problems(id) ON DELETE CASCADE;
ALTER TABLE calendario_conteudo ADD COLUMN IF NOT EXISTS source_problem_id UUID REFERENCES detected_problems(id) ON DELETE CASCADE;

-- 3. Update existing ON DELETE actions to CASCADE for clean TTL removals
-- content_opportunities
ALTER TABLE content_opportunities DROP CONSTRAINT IF EXISTS content_opportunities_source_problem_id_fkey;
ALTER TABLE content_opportunities ADD CONSTRAINT content_opportunities_source_problem_id_fkey 
  FOREIGN KEY (source_problem_id) REFERENCES detected_problems(id) ON DELETE CASCADE;

-- tool_combinations
ALTER TABLE tool_combinations DROP CONSTRAINT IF EXISTS tool_combinations_source_problem_id_fkey;
ALTER TABLE tool_combinations ADD CONSTRAINT tool_combinations_source_problem_id_fkey 
  FOREIGN KEY (source_problem_id) REFERENCES detected_problems(id) ON DELETE CASCADE;

-- opportunities
ALTER TABLE opportunities DROP CONSTRAINT IF EXISTS opportunities_detected_problem_id_fkey;
ALTER TABLE opportunities ADD CONSTRAINT opportunities_detected_problem_id_fkey 
  FOREIGN KEY (detected_problem_id) REFERENCES detected_problems(id) ON DELETE CASCADE;

-- 4. Mark existing as completed so UI doesn't break
UPDATE detected_problems SET pipeline_status = 'completed' WHERE pipeline_status = 'pending' OR pipeline_status IS NULL;
