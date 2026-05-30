ALTER TABLE public.knowledge_chunks
  DROP CONSTRAINT IF EXISTS knowledge_chunks_type_check;

ALTER TABLE public.knowledge_chunks
  ADD CONSTRAINT knowledge_chunks_type_check
  CHECK (type IN ('technique', 'workflow', 'motion_beat', 'qa', 'transcript_segment'));
