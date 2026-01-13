-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    display_name VARCHAR(100),
    role VARCHAR(50) DEFAULT 'viewer',
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Customers Table
-- Dropping previous to ensure clean slate for testing (in dev)
DROP TABLE IF EXISTS customers CASCADE;

CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    landline VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL, -- Match frontend 'name' roughly
    email VARCHAR(255),
    mobile_no VARCHAR(20) NOT NULL,
    alt_mobile_no VARCHAR(20),
    
    -- Technical
    vlan_id VARCHAR(50),
    bb_id VARCHAR(50),
    voip_password VARCHAR(100),
    
    -- Hardware
    ont_make VARCHAR(100),
    ont_type VARCHAR(100),
    ont_mac_address VARCHAR(100),
    ont_bill_no VARCHAR(100),
    ont VARCHAR(50), -- 'Paid ONT', 'Free ONT' etc.
    offer_prize VARCHAR(50), -- Frontend uses 'offerPrize'
    
    router_make VARCHAR(100),
    router_mac_id VARCHAR(100),
    olt_ip VARCHAR(50),
    
    installation_date DATE,
    
    -- Status
    status VARCHAR(20) DEFAULT 'Active',
    plan_status VARCHAR(50),
    ott_subscription VARCHAR(100),
    
    source VARCHAR(50),
    plan VARCHAR(100), -- Store plan name directly for now
    
    address TEXT,
    
    -- Financials  
    wallet_balance DECIMAL(12, 2) DEFAULT 0.00,
    pending_amount DECIMAL(12, 2) DEFAULT 0.00,
    renewal_date DATE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Payments Table
DROP TABLE IF EXISTS payments CASCADE;

CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES customers(id), 
    
    -- Core Payment Details
    amount DECIMAL(10, 2) NOT NULL,
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    mode VARCHAR(50), -- 'Cash', 'Online'
    status VARCHAR(20) DEFAULT 'Completed',
    
    -- Context
    transaction_id VARCHAR(100),
    source VARCHAR(50), -- 'BSNL', etc.
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
