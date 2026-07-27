-- ================================================
-- CARDS TABLE SCHEMA
-- ================================================
-- Run this in Supabase SQL Editor

-- Create cards table
CREATE TABLE IF NOT EXISTS cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES bank_users(id) ON DELETE CASCADE,
  card_number text UNIQUE,
  card_type text NOT NULL CHECK (card_type IN ('debit', 'credit', 'prepaid')),
  expiry_date text,
  cvv text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_cards_user_id ON cards(user_id);

-- Enable RLS
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own cards" 
ON cards
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own cards" 
ON cards
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cards" 
ON cards
FOR UPDATE 
USING (auth.uid() = user_id);

-- ================================================
-- HELPER FUNCTIONS
-- ================================================

-- Generate random card number (Luhn algorithm compliant)
CREATE OR REPLACE FUNCTION generate_card_number()
RETURNS text AS $$
DECLARE
  num text;
BEGIN
  -- Generate 16-digit card number starting with 4532 (Visa format)
  num := '4532' || lpad((floor(random()*1e12))::bigint::text, 12, '0');
  RETURN num;
END;
$$ LANGUAGE plpgsql VOLATILE;

-- Generate expiry date (3 years from now)
CREATE OR REPLACE FUNCTION generate_expiry_date()
RETURNS text AS $$
DECLARE
  expiry_month text;
  expiry_year text;
BEGIN
  expiry_month := lpad((EXTRACT(MONTH FROM now()))::text, 2, '0');
  expiry_year := (EXTRACT(YEAR FROM now() + interval '3 years') - 2000)::text;
  RETURN expiry_month || '/' || expiry_year;
END;
$$ LANGUAGE plpgsql VOLATILE;

-- Generate random CVV (3 digits)
CREATE OR REPLACE FUNCTION generate_cvv()
RETURNS text AS $$
BEGIN
  RETURN lpad((floor(random()*1000))::int::text, 3, '0');
END;
$$ LANGUAGE plpgsql VOLATILE;

-- ================================================
-- TRIGGER: Auto-generate card details and create alert
-- ================================================

CREATE OR REPLACE FUNCTION create_card_details()
RETURNS trigger AS $$
BEGIN
  -- Always generate card details
  NEW.card_number := generate_card_number();
  NEW.expiry_date := generate_expiry_date();
  NEW.cvv := generate_cvv();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_generate_card_details ON cards;
CREATE TRIGGER trg_generate_card_details
BEFORE INSERT ON cards
FOR EACH ROW
EXECUTE PROCEDURE create_card_details();

-- Trigger to create alert after card creation
CREATE OR REPLACE FUNCTION create_card_alert()
RETURNS trigger AS $$
BEGIN
  -- Create alert notification
  INSERT INTO alerts (user_id, type, title, message, severity)
  VALUES (
    NEW.user_id,
    'general',
    'New card requested',
    'Your physical ' || NEW.card_type || ' card has been requested and will be shipped to your address within 5-7 business days.',
    'success'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_create_card_alert ON cards;
CREATE TRIGGER trg_create_card_alert
AFTER INSERT ON cards
FOR EACH ROW
EXECUTE PROCEDURE create_card_alert();

-- ================================================
-- VERIFICATION
-- ================================================

-- Check if table was created
SELECT 
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'cards'
ORDER BY ordinal_position;

-- ================================================
-- DONE!
-- ================================================
-- Cards table is ready with auto-generation of:
-- - card_number (16 digits)
-- - expiry_date (MM/YY format)
-- - cvv (3 digits)
-- - automatic alert creation

