-- ============================================
-- AUTO PAYMENTS SCHEMA & CRON JOB
-- Please run this in the Supabase SQL Editor
-- ============================================

-- 1. Create the auto_payments table
CREATE TABLE IF NOT EXISTS auto_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    category_name TEXT NOT NULL,
    description TEXT,
    frequency TEXT NOT NULL CHECK (frequency IN ('Daily', 'Monthly', 'Yearly', 'Custom')),
    custom_days INTEGER,
    execute_time TIME NOT NULL DEFAULT '05:00',
    end_date DATE NOT NULL,
    next_execution_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Enable Row Level Security
ALTER TABLE auto_payments ENABLE ROW LEVEL SECURITY;

-- 3. Write RLS Policies
CREATE POLICY "Users can view their own auto payments"
    ON auto_payments FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own auto payments"
    ON auto_payments FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own auto payments"
    ON auto_payments FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own auto payments"
    ON auto_payments FOR DELETE
    USING (auth.uid() = user_id);

-- 4. Process Function
CREATE OR REPLACE FUNCTION process_auto_payments()
RETURNS void AS $$
DECLARE
    payment RECORD;
    new_next_execution TIMESTAMP WITH TIME ZONE;
    wallet_allowance NUMERIC;
    total_spent NUMERIC;
    total_savings NUMERIC;
    available_balance NUMERIC;
    execution_date DATE;
BEGIN
    FOR payment IN 
        SELECT * FROM auto_payments 
        WHERE is_active = true AND next_execution_at <= now()
    LOOP
        SELECT COALESCE(monthly_allowance, 0)
        INTO wallet_allowance
        FROM profiles
        WHERE id = payment.user_id;

        SELECT COALESCE(SUM(amount), 0)
        INTO total_spent
        FROM expenses
        WHERE user_id = payment.user_id
          AND expense_date >= date_trunc('month', payment.next_execution_at AT TIME ZONE 'Asia/Kolkata')::date
          AND expense_date <= (date_trunc('month', payment.next_execution_at AT TIME ZONE 'Asia/Kolkata') + INTERVAL '1 month - 1 day')::date;

        SELECT COALESCE(SUM(amount), 0)
        INTO total_savings
        FROM savings
        WHERE user_id = payment.user_id;

        available_balance := GREATEST(0, wallet_allowance - total_spent - total_savings);
        execution_date := (payment.next_execution_at AT TIME ZONE 'Asia/Kolkata')::date;

        IF available_balance < payment.amount THEN
            RAISE NOTICE 'Skipping auto payment % for user % due to insufficient wallet balance.', payment.id, payment.user_id;
        ELSE
        -- Insert expense
        INSERT INTO expenses (user_id, amount, category_id, category_name, description, expense_date, created_at)
        VALUES (
            payment.user_id, 
            payment.amount, 
            payment.category_id, 
            payment.category_name, 
            COALESCE(payment.description, 'Auto Payment: ' || payment.category_name), 
            execution_date,
            payment.next_execution_at
        );
        END IF;

        -- Calculate next execution time
        IF payment.frequency = 'Daily' THEN
            new_next_execution := payment.next_execution_at + INTERVAL '1 day';
        ELSIF payment.frequency = 'Monthly' THEN
            new_next_execution := payment.next_execution_at + INTERVAL '1 month';
        ELSIF payment.frequency = 'Yearly' THEN
            new_next_execution := payment.next_execution_at + INTERVAL '1 year';
        ELSIF payment.frequency = 'Custom' AND payment.custom_days IS NOT NULL THEN
            new_next_execution := payment.next_execution_at + (payment.custom_days || ' days')::INTERVAL;
        END IF;

        -- Deactivate if past end_date, else update next execution
        IF new_next_execution::DATE > payment.end_date THEN
            UPDATE auto_payments SET is_active = false, next_execution_at = new_next_execution WHERE id = payment.id;
        ELSE
            UPDATE auto_payments SET next_execution_at = new_next_execution WHERE id = payment.id;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Enable pg_cron and Schedule Hourly Job
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Unschedule first if it exists to avoid errors on re-run
DO $$
BEGIN
  PERFORM cron.unschedule('process_auto_payments_hourly');
EXCEPTION WHEN OTHERS THEN
  -- ignore error if it wasn't scheduled
END $$;

SELECT cron.schedule('process_auto_payments_hourly', '0 * * * *', 'SELECT process_auto_payments();');
