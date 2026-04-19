-- Reference schema (app uses GORM AutoMigrate). Use for manual DBA / review.

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    bio TEXT,
    expert_rating_avg DOUBLE PRECISION DEFAULT 0,
    expert_rating_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS expert_ratings (
    id SERIAL PRIMARY KEY,
    expert_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rater_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    score INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT ux_expert_rater UNIQUE (expert_id, rater_id)
);

CREATE INDEX IF NOT EXISTS idx_expert_ratings_expert_id ON expert_ratings(expert_id);

CREATE TABLE IF NOT EXISTS journal_checklist_templates (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(160) NOT NULL,
    items JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_journal_checklist_templates_user_id ON journal_checklist_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_journal_checklist_templates_deleted_at ON journal_checklist_templates(deleted_at);

CREATE TABLE IF NOT EXISTS trading_journals (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    symbol VARCHAR(20) NOT NULL,
    direction VARCHAR(5),
    entry_price DOUBLE PRECISION NOT NULL,
    exit_price DOUBLE PRECISION,
    volume INTEGER NOT NULL,
    pnl DOUBLE PRECISION,
    screenshot_url TEXT,
    notes TEXT,
    traded_at TIMESTAMPTZ NOT NULL,
    checklist_template_id INTEGER REFERENCES journal_checklist_templates(id) ON DELETE SET NULL,
    checklist_snapshot JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_journals_user_id ON trading_journals(user_id);
CREATE INDEX IF NOT EXISTS idx_journals_traded_at ON trading_journals(traded_at);
CREATE INDEX IF NOT EXISTS idx_journals_checklist_template_id ON trading_journals(checklist_template_id);

CREATE TABLE IF NOT EXISTS posts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    chart_image_url TEXT,
    symbols TEXT[],
    timeframe VARCHAR(20),
    analysis_type VARCHAR(20) DEFAULT 'technical',
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);

CREATE TABLE IF NOT EXISTS comments (
    id SERIAL PRIMARY KEY,
    post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    parent_id INTEGER REFERENCES comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);

CREATE TABLE IF NOT EXISTS likes (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, post_id)
);

CREATE TABLE IF NOT EXISTS followers (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    follower_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, follower_id)
);

CREATE INDEX IF NOT EXISTS idx_followers_user_id ON followers(user_id);

CREATE TABLE IF NOT EXISTS email_otp_challenges (
    id SERIAL PRIMARY KEY,
    email VARCHAR(100) NOT NULL,
    purpose VARCHAR(32) NOT NULL,
    code_hash VARCHAR(255) NOT NULL,
    username VARCHAR(50),
    expires_at TIMESTAMPTZ NOT NULL,
    attempts INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (email, purpose)
);

CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(24) NOT NULL,
    body VARCHAR(500) NOT NULL,
    actor_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read_at ON notifications(user_id, read_at);
