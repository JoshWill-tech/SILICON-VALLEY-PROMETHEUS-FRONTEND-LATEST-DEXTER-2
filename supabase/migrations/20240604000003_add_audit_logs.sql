CREATE TABLE IF NOT EXISTS audit_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    action text NOT NULL, -- 'token_decrypted', 'oauth_initiated', 'export_completed', etc.
    provider text,
    ip_address inet,
    user_agent text,
    success boolean,
    error_message text,
    created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
