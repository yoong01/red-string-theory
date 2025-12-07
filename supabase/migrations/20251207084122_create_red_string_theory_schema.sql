/*
  # Red String Theory - Autonomous Garment Swap Platform

  ## Overview
  Database schema for an AI-powered garment swap platform where autonomous agents
  negotiate trades on behalf of clothing items based on compatibility scoring.

  ## New Tables

  ### `users`
  - `id` (uuid, primary key) - Unique user identifier
  - `email` (text, unique) - User email
  - `display_name` (text) - User's display name
  - `created_at` (timestamptz) - Account creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### `garments`
  - `id` (uuid, primary key) - Unique garment identifier
  - `owner_id` (uuid, foreign key) - References users table
  - `name` (text) - Garment name/title
  - `category` (text) - Type of garment (jacket, dress, tops, etc.)
  - `size` (text) - Size (S, M, L, XL, etc.)
  - `condition` (decimal) - Condition rating from 0-1 (0.8 = 8/10)
  - `rarity` (decimal) - Rarity score from 0-1
  - `style_tags` (jsonb) - Array of style tags (vintage, streetwear, etc.)
  - `personality` (jsonb) - Array of personality traits (bold, refined, etc.)
  - `vibe` (text) - Overall vibe/aesthetic
  - `image_url` (text) - URL to garment image
  - `patience` (decimal) - Willingness to compromise (0-1)
  - `min_acceptable_score` (decimal) - Minimum compatibility threshold
  - `metadata_hash` (text) - Hash for blockchain reference
  - `active` (boolean) - Whether garment is available for swapping
  - `last_match_attempt` (timestamptz) - Last time agent searched for matches
  - `created_at` (timestamptz) - Registration timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### `swap_intents`
  - `id` (uuid, primary key) - Unique intent identifier
  - `garment_a_id` (uuid, foreign key) - First garment in swap
  - `garment_b_id` (uuid, foreign key) - Second garment in swap
  - `owner_a_id` (uuid, foreign key) - Owner of garment A
  - `owner_b_id` (uuid, foreign key) - Owner of garment B
  - `status` (text) - PENDING, ACCEPTED, DECLINED, CONFIRMED
  - `compatibility_score` (decimal) - Calculated compatibility (0-1)
  - `fairness_score` (decimal) - Fairness assessment (0-1)
  - `dialogue_text` (jsonb) - Generated conversation between garments
  - `audio_url` (text) - URL to synthesized voice dialogue
  - `blockchain_tx_id` (text) - Neo blockchain transaction ID
  - `proposed_at` (timestamptz) - When swap was proposed
  - `responded_at` (timestamptz) - When response was given
  - `confirmed_at` (timestamptz) - When swap was confirmed
  - `created_at` (timestamptz) - Record creation timestamp

  ### `swap_history`
  - `id` (uuid, primary key) - Unique history record identifier
  - `swap_intent_id` (uuid, foreign key) - Reference to original intent
  - `garment_a_id` (uuid) - First garment (stored for history)
  - `garment_b_id` (uuid) - Second garment (stored for history)
  - `garment_a_data` (jsonb) - Snapshot of garment A at time of swap
  - `garment_b_data` (jsonb) - Snapshot of garment B at time of swap
  - `owner_a_id` (uuid) - Original owner of garment A
  - `owner_b_id` (uuid) - Original owner of garment B
  - `compatibility_score` (decimal) - Final compatibility score
  - `fairness_score` (decimal) - Final fairness score
  - `blockchain_tx_id` (text) - Neo blockchain transaction ID
  - `completed_at` (timestamptz) - When swap was completed
  - `created_at` (timestamptz) - Record creation timestamp

  ## Security
  - Enable RLS on all tables
  - Users can only read/modify their own data
  - Swap intents visible to both parties involved
  - History records are permanent and read-only after creation
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  display_name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create garments table
CREATE TABLE IF NOT EXISTS garments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  category text NOT NULL,
  size text NOT NULL,
  condition decimal NOT NULL CHECK (condition >= 0 AND condition <= 1),
  rarity decimal NOT NULL DEFAULT 0.5 CHECK (rarity >= 0 AND rarity <= 1),
  style_tags jsonb NOT NULL DEFAULT '[]'::jsonb,
  personality jsonb NOT NULL DEFAULT '[]'::jsonb,
  vibe text NOT NULL DEFAULT '',
  image_url text,
  patience decimal NOT NULL DEFAULT 0.5 CHECK (patience >= 0 AND patience <= 1),
  min_acceptable_score decimal NOT NULL DEFAULT 0.65 CHECK (min_acceptable_score >= 0 AND min_acceptable_score <= 1),
  metadata_hash text,
  active boolean DEFAULT true,
  last_match_attempt timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create swap_intents table
CREATE TABLE IF NOT EXISTS swap_intents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  garment_a_id uuid REFERENCES garments(id) ON DELETE CASCADE,
  garment_b_id uuid REFERENCES garments(id) ON DELETE CASCADE,
  owner_a_id uuid REFERENCES users(id) ON DELETE CASCADE,
  owner_b_id uuid REFERENCES users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'DECLINED', 'CONFIRMED')),
  compatibility_score decimal NOT NULL CHECK (compatibility_score >= 0 AND compatibility_score <= 1),
  fairness_score decimal NOT NULL CHECK (fairness_score >= 0 AND fairness_score <= 1),
  dialogue_text jsonb,
  audio_url text,
  blockchain_tx_id text,
  proposed_at timestamptz DEFAULT now(),
  responded_at timestamptz,
  confirmed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create swap_history table
CREATE TABLE IF NOT EXISTS swap_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  swap_intent_id uuid REFERENCES swap_intents(id) ON DELETE SET NULL,
  garment_a_id uuid NOT NULL,
  garment_b_id uuid NOT NULL,
  garment_a_data jsonb NOT NULL,
  garment_b_data jsonb NOT NULL,
  owner_a_id uuid REFERENCES users(id) ON DELETE SET NULL,
  owner_b_id uuid REFERENCES users(id) ON DELETE SET NULL,
  compatibility_score decimal NOT NULL,
  fairness_score decimal NOT NULL,
  blockchain_tx_id text,
  completed_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE garments ENABLE ROW LEVEL SECURITY;
ALTER TABLE swap_intents ENABLE ROW LEVEL SECURITY;
ALTER TABLE swap_history ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY "Users can read own profile"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Garments table policies
CREATE POLICY "Users can read own garments"
  ON garments FOR SELECT
  TO authenticated
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can read active garments for matching"
  ON garments FOR SELECT
  TO authenticated
  USING (active = true);

CREATE POLICY "Users can insert own garments"
  ON garments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update own garments"
  ON garments FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can delete own garments"
  ON garments FOR DELETE
  TO authenticated
  USING (auth.uid() = owner_id);

-- Swap intents policies
CREATE POLICY "Users can read swap intents involving their garments"
  ON swap_intents FOR SELECT
  TO authenticated
  USING (auth.uid() = owner_a_id OR auth.uid() = owner_b_id);

CREATE POLICY "System can insert swap intents"
  ON swap_intents FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update swap intents involving their garments"
  ON swap_intents FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_a_id OR auth.uid() = owner_b_id)
  WITH CHECK (auth.uid() = owner_a_id OR auth.uid() = owner_b_id);

-- Swap history policies
CREATE POLICY "Users can read their swap history"
  ON swap_history FOR SELECT
  TO authenticated
  USING (auth.uid() = owner_a_id OR auth.uid() = owner_b_id);

CREATE POLICY "System can insert swap history"
  ON swap_history FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_garments_owner_id ON garments(owner_id);
CREATE INDEX IF NOT EXISTS idx_garments_active ON garments(active);
CREATE INDEX IF NOT EXISTS idx_swap_intents_status ON swap_intents(status);
CREATE INDEX IF NOT EXISTS idx_swap_intents_garments ON swap_intents(garment_a_id, garment_b_id);
CREATE INDEX IF NOT EXISTS idx_swap_history_owners ON swap_history(owner_a_id, owner_b_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_garments_updated_at
  BEFORE UPDATE ON garments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
