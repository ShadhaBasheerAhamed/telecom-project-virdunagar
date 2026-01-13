-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users Table (for Authentication)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(100),
    role VARCHAR(50) DEFAULT 'viewer', -- 'admin', 'manager', 'operator', 'viewer'
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Master Records: Plans
CREATE TABLE plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    gst DECIMAL(5, 2) DEFAULT 18.00,
    total DECIMAL(10, 2) NOT NULL,
    validity VARCHAR(50),
    status VARCHAR(20) DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Master Records: Network Providers (for context selection)
CREATE TABLE network_providers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Customers Table
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    landline VARCHAR(50) UNIQUE NOT NULL, -- Core identifier
    customer_name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    mobile_no VARCHAR(20) NOT NULL,
    alt_mobile_no VARCHAR(20),
    
    -- Technical Details
    vlan_id VARCHAR(50),
    bb_id VARCHAR(50),
    voip_password VARCHAR(100),
    
    -- Hardware Details
    ont_make VARCHAR(100),
    ont_type VARCHAR(100),
    ont_mac_address VARCHAR(100),
    ont_bill_no VARCHAR(100),
    
    -- ONT Status
    ont_status VARCHAR(50), -- 'Paid ONT', 'Free ONT', 'Offer Price', 'Rented ONT'
    offer_price VARCHAR(50),
    
    router_make VARCHAR(100),
    router_mac_id VARCHAR(100),
    olt_ip VARCHAR(50),
    
    installation_date DATE,
    
    -- Status & Plan
    status VARCHAR(20) DEFAULT 'Active', -- 'Active', 'Inactive', 'Suspended', 'Expired'
    plan_status VARCHAR(50),
    ott_subscription VARCHAR(100),
    
    source VARCHAR(50), -- 'BSNL', 'RMAX', 'Private'
    plan_id UUID REFERENCES plans(id), -- Linked to Plans table
    
    address TEXT,
    
    -- Financials
    wallet_balance DECIMAL(12, 2) DEFAULT 0.00,
    pending_amount DECIMAL(12, 2) DEFAULT 0.00,
    
    last_renewal_date DATE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Leads Table
CREATE TABLE leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_name VARCHAR(255) NOT NULL,
    phone_no VARCHAR(20) NOT NULL,
    address TEXT,
    remarks TEXT,
    followup_date DATE,
    status VARCHAR(20) DEFAULT 'Pending', -- 'Success', 'Rejected', 'Sale', 'Pending'
    source VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Complaints Table
CREATE TABLE complaints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES customers(id), -- Optional link if complaint is from existing customer
    customer_name VARCHAR(255), -- Redundant but useful if not linked
    phone_no VARCHAR(20),
    description TEXT,
    category VARCHAR(50),
    status VARCHAR(20) DEFAULT 'Open', -- 'Open', 'In Progress', 'Resolved', 'Closed'
    assigned_to UUID REFERENCES users(id), -- Employee assigned
    priority VARCHAR(20) DEFAULT 'Medium',
    resolution_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP
);

-- Payments Table
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES customers(id),
    amount DECIMAL(10, 2) NOT NULL,
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    mode VARCHAR(50), -- 'Cash', 'Online', 'UPI'
    type VARCHAR(50), -- 'Bill Payment', 'Advance', 'Installation'
    status VARCHAR(20) DEFAULT 'Completed',
    transaction_id VARCHAR(100),
    created_by UUID REFERENCES users(id)
);

-- Inventory/Products Table
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    buy_price DECIMAL(10, 2) NOT NULL,
    sell_price DECIMAL(10, 2) NOT NULL,
    stock INTEGER DEFAULT 0,
    unit VARCHAR(20), -- 'Nos', 'Mtr'
    gst_percentage DECIMAL(5, 2),
    image_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
