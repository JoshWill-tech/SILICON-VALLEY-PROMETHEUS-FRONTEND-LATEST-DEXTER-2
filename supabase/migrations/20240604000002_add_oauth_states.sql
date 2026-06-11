CREATE TABLE IF NOT EXISTS oauth_states (
    state text PRIMARY KEY,
    user_id uuid NOT NULL,
    provider text NOT NULL,
    code_verifier text NOT NULL,
    redirect_uri text NOT NULL,
    expires_at timestamptz NOT NULL,
    created_at timestamptz DEFAULT now()
);
CREATE INDEX idx_oauth_states_expires ON oauth_states(expires_at);
