-- Create a simple table to store the board state as a single JSON object
CREATE TABLE IF NOT EXISTS board_state (
  id integer PRIMARY KEY,
  data jsonb NOT NULL,
  updated_at timestamp with time zone DEFAULT now()
);

-- Insert the initial empty board (id = 1) if it doesn't exist
INSERT INTO board_state (id, data)
VALUES (1, '{}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS but allow anonymous read/write (for single-user simplicity)
ALTER TABLE board_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read" ON board_state
  FOR SELECT TO public USING (true);

CREATE POLICY "Allow public update" ON board_state
  FOR UPDATE TO public USING (true);

CREATE POLICY "Allow public insert" ON board_state
  FOR INSERT TO public WITH CHECK (true);
