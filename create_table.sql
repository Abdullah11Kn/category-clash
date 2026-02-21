-- Create the activation_codes table
CREATE TABLE activation_codes (
    id BIGSERIAL PRIMARY KEY,
    code_hash VARCHAR(64) NOT NULL UNIQUE,
    status VARCHAR(20) NOT NULL DEFAULT 'unused', -- 'unused' or 'used'
    used_by VARCHAR(255), -- Will store the Device ID
    used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Note: We do not need the user_profiles table or any Auth connections anymore!
