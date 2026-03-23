-- Add ON DELETE CASCADE to nodes.source_video_id and edges.source_video_id
-- so deleting a video automatically cleans up associated graph data.

ALTER TABLE nodes
  DROP CONSTRAINT IF EXISTS nodes_source_video_id_fkey,
  ADD CONSTRAINT nodes_source_video_id_fkey
    FOREIGN KEY (source_video_id) REFERENCES videos(id) ON DELETE CASCADE;

ALTER TABLE edges
  DROP CONSTRAINT IF EXISTS edges_source_video_id_fkey,
  ADD CONSTRAINT edges_source_video_id_fkey
    FOREIGN KEY (source_video_id) REFERENCES videos(id) ON DELETE CASCADE;
