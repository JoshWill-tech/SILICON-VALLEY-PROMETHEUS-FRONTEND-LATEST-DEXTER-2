CREATE TABLE IF NOT EXISTS user_connections (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    provider text NOT NULL CHECK (provider IN (
        'youtube', 'tiktok', 'instagram', 'x', 'google_drive', 
        'dropbox', 'facebook', 'linkedin'
    )),
    encrypted_access_token text NOT NULL,
    encrypted_refresh_token text,
    iv text NOT NULL,
    key_version text NOT NULL,
    scope text NOT NULL,
    expires_at timestamptz,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(user_id, provider)
);

CREATE INDEX idx_user_connections_user_id ON user_connections(user_id);
CREATE INDEX idx_user_connections_provider ON user_connections(provider);

ALTER TABLE user_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own connections"
    ON user_connections FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own connections"
    ON user_connections FOR DELETE USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ language 'plpgsql';

CREATE TRIGGER update_user_connections_updated_at
    BEFORE UPDATE ON user_connections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
