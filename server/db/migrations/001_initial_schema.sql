-- =============================================================================
-- Silver Scout Enterprise Relational Database Schema
-- Compatible with PostgreSQL 15+ / 16+ (pgvector) and Google Cloud Spanner (PG dialect)
-- =============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Notice: vector extension enabled when pgvector is installed
DO $$
BEGIN
    CREATE EXTENSION IF NOT EXISTS "vector";
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'pgvector extension not installed or unsupported in current environment; proceeding with text-vector fallback';
END
$$;

-- -----------------------------------------------------------------------------
-- 1. FUNDS & TENANTS (Multi-Tenant Root)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS funds (
    fund_id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    subdomain VARCHAR(128) UNIQUE,
    branding_config JSONB DEFAULT '{}'::jsonb,
    deployment_config JSONB DEFAULT '{}'::jsonb,
    status VARCHAR(32) DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_funds_subdomain ON funds(subdomain);

-- -----------------------------------------------------------------------------
-- 2. ENTERPRISE USERS & SSO IDENTITIES
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    user_id VARCHAR(64) PRIMARY KEY,
    fund_id VARCHAR(64) NOT NULL REFERENCES funds(fund_id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    display_name VARCHAR(255),
    role VARCHAR(32) NOT NULL DEFAULT 'analyst', -- admin, partner, associate, analyst
    is_active BOOLEAN DEFAULT TRUE,
    sso_provider VARCHAR(64),                     -- okta, google, azure_ad, saml
    sso_sub VARCHAR(255),                        -- External IdP unique subject identifier
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_fund_user_email UNIQUE (fund_id, email)
);

CREATE INDEX IF NOT EXISTS idx_users_fund_id ON users(fund_id);
CREATE INDEX IF NOT EXISTS idx_users_sso ON users(sso_provider, sso_sub);

-- -----------------------------------------------------------------------------
-- 3. PROPRIETARY LEADS & TARGET ACQUISITIONS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS leads (
    id VARCHAR(64) PRIMARY KEY,
    fund_id VARCHAR(64) NOT NULL REFERENCES funds(fund_id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    industry VARCHAR(128) NOT NULL,
    location VARCHAR(255) NOT NULL,
    address TEXT,
    phone VARCHAR(64),
    email VARCHAR(255),
    website VARCHAR(255),
    agent_name VARCHAR(255),
    owner_title VARCHAR(128),
    registration_date DATE,
    employee_count INTEGER,
    status VARCHAR(64) DEFAULT 'new',             -- new, qualified, outreach_triggered, replied, in_loi, closed, passed
    exit_propensity_score NUMERIC(4, 2),
    valuation_estimate NUMERIC(14, 2),
    revenue NUMERIC(14, 2),
    ebitda NUMERIC(14, 2),
    profit_margin NUMERIC(5, 2),
    permit_volume_historical INTEGER,
    permit_volume_current INTEGER,
    permit_drop INTEGER,
    ai_thesis TEXT,
    deal_source_channel VARCHAR(64) DEFAULT 'OFF_MARKET_SCOUT',
    data_fingerprint VARCHAR(64) NOT NULL,       -- SHA-256 deduplication hash
    lead_payload JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_fund_lead_fingerprint UNIQUE (fund_id, data_fingerprint)
);

CREATE INDEX IF NOT EXISTS idx_leads_fund_id ON leads(fund_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(fund_id, status);
CREATE INDEX IF NOT EXISTS idx_leads_exit_score ON leads(fund_id, exit_propensity_score DESC);
CREATE INDEX IF NOT EXISTS idx_leads_ebitda ON leads(fund_id, ebitda DESC);

-- -----------------------------------------------------------------------------
-- 4. CONTROL PLANE DEALS & FINITE STATE MACHINE (FSM)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS deals (
    deal_id VARCHAR(64) PRIMARY KEY,
    fund_id VARCHAR(64) NOT NULL REFERENCES funds(fund_id) ON DELETE CASCADE,
    lead_id VARCHAR(64) NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    company_name VARCHAR(255) NOT NULL,
    current_stage VARCHAR(64) NOT NULL,          -- NEW_DISCOVERY, ENRICHED, OUTREACH_ACTIVE, ENGAGED_FOUNDER, UNDER_LOI, DILIGENCE, CLOSED_PORTCO, ARCHIVED
    execution_history JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_deals_fund_stage ON deals(fund_id, current_stage);

-- -----------------------------------------------------------------------------
-- 5. OUTREACH ACTIVITY LOGS & INTERACTION HISTORY
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS activity_logs (
    id VARCHAR(64) PRIMARY KEY,
    fund_id VARCHAR(64) NOT NULL REFERENCES funds(fund_id) ON DELETE CASCADE,
    lead_id VARCHAR(64) NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    actor_id VARCHAR(64) NOT NULL,
    action VARCHAR(128) NOT NULL,
    channel VARCHAR(64) NOT NULL,                -- direct_mail, cold_email, phone_call, in_person
    outcome VARCHAR(64),                         -- delivered, opened, replied, bounced, no_answer
    notes TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_lead ON activity_logs(fund_id, lead_id, created_at DESC);

-- -----------------------------------------------------------------------------
-- 6. TRANSACTIONAL OUTBOX (Durable Delivery & Replay Engine)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS outbox_events (
    id VARCHAR(64) PRIMARY KEY,
    fund_id VARCHAR(64) NOT NULL REFERENCES funds(fund_id) ON DELETE CASCADE,
    aggregate_type VARCHAR(64) NOT NULL,
    aggregate_id VARCHAR(64) NOT NULL,
    event_type VARCHAR(128) NOT NULL,
    payload JSONB NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING', -- PENDING, PUBLISHED, FAILED, DEAD_LETTER
    retry_count INTEGER DEFAULT 0,
    last_error TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_outbox_pending ON outbox_events(status, created_at) WHERE status = 'PENDING';

-- -----------------------------------------------------------------------------
-- 7. AUDIT PROVENANCE LEDGER (Cryptographically Chained Proofs)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_ledger (
    entry_id VARCHAR(64) PRIMARY KEY,
    fund_id VARCHAR(64) NOT NULL REFERENCES funds(fund_id) ON DELETE CASCADE,
    sequence BIGSERIAL NOT NULL,
    action VARCHAR(128) NOT NULL,
    actor_id VARCHAR(64) NOT NULL,
    target_id VARCHAR(64) NOT NULL,
    prev_hash VARCHAR(64) NOT NULL,
    entry_hash VARCHAR(64) NOT NULL,
    payload JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_audit_sequence UNIQUE (fund_id, sequence)
);

CREATE INDEX IF NOT EXISTS idx_audit_ledger_fund ON audit_ledger(fund_id, sequence);

-- -----------------------------------------------------------------------------
-- 8. ENTERPRISE RAG VECTOR STORE & HYBRID RETRIEVAL (Zero-Trust ACL Isolation)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS rag_documents (
    doc_id VARCHAR(64) PRIMARY KEY,
    fund_id VARCHAR(64) NOT NULL REFERENCES funds(fund_id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    source_type VARCHAR(64) NOT NULL,            -- cim, pnl, tax_return, transcript, note
    total_chunks INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS rag_chunks (
    chunk_id VARCHAR(64) PRIMARY KEY,
    doc_id VARCHAR(64) NOT NULL REFERENCES rag_documents(doc_id) ON DELETE CASCADE,
    fund_id VARCHAR(64) NOT NULL REFERENCES funds(fund_id) ON DELETE CASCADE,
    chunk_index INTEGER NOT NULL,
    content TEXT NOT NULL,
    token_count INTEGER NOT NULL,
    allowed_roles VARCHAR(32)[] NOT NULL,        -- Array of authorized roles: e.g. {'partner', 'admin'}
    embedding_text TEXT,                         -- Comma-separated or fallback vector representation
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_rag_chunks_fund_roles ON rag_chunks(fund_id, allowed_roles);
CREATE INDEX IF NOT EXISTS idx_rag_chunks_doc ON rag_chunks(doc_id);

-- -----------------------------------------------------------------------------
-- SEED INITIAL REDWOOD CAPITAL TENANT
-- -----------------------------------------------------------------------------
INSERT INTO funds (fund_id, name, subdomain, branding_config)
VALUES ('redwood-cap', 'Redwood Capital Search Fund', 'redwood', '{"primaryColor": "#15803d", "secondaryColor": "#166534"}'::jsonb)
ON CONFLICT (fund_id) DO NOTHING;

INSERT INTO users (user_id, fund_id, email, display_name, role)
VALUES 
    ('partner_1', 'redwood-cap', 'partner@redwood-cap.com', 'Managing Partner', 'partner'),
    ('associate_1', 'redwood-cap', 'associate@redwood-cap.com', 'Investment Associate', 'associate'),
    ('analyst_1', 'redwood-cap', 'analyst@redwood-cap.com', 'Deal Analyst', 'analyst')
ON CONFLICT (fund_id, email) DO NOTHING;
