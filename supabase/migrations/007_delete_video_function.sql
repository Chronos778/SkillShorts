-- Function: delete_video_cascade
-- Allows creators to delete their own videos and dependent rows safely

CREATE OR REPLACE FUNCTION public.delete_video_cascade(p_video_id uuid, p_requester_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_creator uuid;
BEGIN
  SELECT creator_id INTO v_creator FROM videos WHERE id = p_video_id;
  IF v_creator IS NULL THEN
    RETURN FALSE;
  END IF;
  IF v_creator <> p_requester_id THEN
    RETURN FALSE;
  END IF;

  -- Delete dependent rows (best-effort)
  DELETE FROM quiz_questions WHERE video_id = p_video_id;
  DELETE FROM video_reactions WHERE video_id = p_video_id;
  DELETE FROM video_comments WHERE video_id = p_video_id;
  DELETE FROM progress WHERE video_id = p_video_id;

  -- Delete the video row
  DELETE FROM videos WHERE id = p_video_id AND creator_id = p_requester_id;
  RETURN FOUND; -- true if the row was deleted
END;
$$;

-- Grant execute to client roles
GRANT EXECUTE ON FUNCTION public.delete_video_cascade(uuid, uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.delete_video_cascade(uuid, uuid) TO authenticated;
