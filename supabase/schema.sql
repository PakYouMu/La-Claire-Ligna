


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;




ALTER SCHEMA "public" OWNER TO "postgres";


CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."app_role" AS ENUM (
    'admin',
    'member',
    'viewer'
);


ALTER TYPE "public"."app_role" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_payment_schedule"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_amortization numeric(12, 2);
  v_current_date date;
  v_end_date date;
  v_year integer;
  v_month integer;
  v_due_date_1 date;
  v_due_date_2 date;
BEGIN
  -- Calculate bi-monthly amortization
  v_amortization := round(
    (new.principal + (new.principal * (new.interest_rate / 100.0) * new.duration_months)) 
    / (new.duration_months * 2.0), 
    2
  );

  v_current_date := new.start_date;
  v_end_date := new.start_date + (new.duration_months || ' months')::interval;
  
  -- Loop through every month of the loan duration
  WHILE v_current_date <= v_end_date LOOP
    v_year := date_part('year', v_current_date);
    v_month := date_part('month', v_current_date);

    -- 1. Set First Due Date: Always the 15th
    v_due_date_1 := make_date(v_year, v_month, 15);

    -- 2. Set Second Due Date: 
    -- If February, use the actual last day (28 or 29). 
    -- For ALL other months, force it to the 30th (ignoring the 31st).
    IF v_month = 2 THEN
       v_due_date_2 := (date_trunc('month', v_current_date) + interval '1 month' - interval '1 day')::date;
    ELSE
       v_due_date_2 := make_date(v_year, v_month, 30);
    END IF;

    -- INSERT 15th (If valid)
    IF v_due_date_1 > new.start_date AND v_due_date_1 <= v_end_date THEN
       INSERT INTO public.payment_schedule (loan_id, due_date, expected_amount, status)
       VALUES (new.id, v_due_date_1, v_amortization, 'PENDING')
       ON CONFLICT (loan_id, due_date) DO NOTHING;
    END IF;

    -- INSERT 30th (If valid)
    IF v_due_date_2 > new.start_date AND v_due_date_2 <= v_end_date THEN
       INSERT INTO public.payment_schedule (loan_id, due_date, expected_amount, status)
       VALUES (new.id, v_due_date_2, v_amortization, 'PENDING')
       ON CONFLICT (loan_id, due_date) DO NOTHING;
    END IF;

    -- Advance to next month
    v_current_date := v_current_date + interval '1 month';
  END LOOP;
  
  RETURN new;
END;
$$;


ALTER FUNCTION "public"."generate_payment_schedule"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_loan_update"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- Only regenerate if financial terms changed
  IF NEW.principal <> OLD.principal OR 
     NEW.interest_rate <> OLD.interest_rate OR 
     NEW.duration_months <> OLD.duration_months OR
     NEW.start_date <> OLD.start_date THEN
     
     -- 1. Delete all PENDING schedules (Keep PAID ones)
     DELETE FROM public.payment_schedule 
     WHERE loan_id = NEW.id AND status = 'PENDING';

     -- 2. Call the generator (It will fill in the gaps based on new start date/terms)
     -- Note: You might need to adjust generate_payment_schedule to not duplicate if you have specific logic,
     -- but for a simple "reset", we usually treat it as a fresh generation for the remaining time.
     -- Ideally, for a robust system, you prevent editing active loans with payments, 
     -- but for this app, we will allow it.
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_loan_update"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_fund_creation"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- Automatically insert the owner as an admin member
  INSERT INTO public.fund_members (fund_id, user_id, role)
  VALUES (new.id, new.owner_id, 'admin');
  
  RETURN new;
END;
$$;


ALTER FUNCTION "public"."handle_new_fund_creation"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_loan"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO public.ledger (
    amount, 
    category, 
    loan_id, 
    notes, 
    transaction_date, 
    fund_id
  )
  VALUES (
    -new.principal,
    'LOAN_DISBURSEMENT', 
    new.id,
    'Disbursement for Loan ' || new.id,
    new.start_date,
    new.fund_id  -- CRITICAL: Explicitly pass fund_id
  );
  RETURN new;
END;
$$;


ALTER FUNCTION "public"."handle_new_loan"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_payment"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO public.ledger (
    amount, 
    category, 
    payment_id, 
    notes, 
    transaction_date, 
    fund_id
  )
  VALUES (
    new.amount,
    'LOAN_REPAYMENT', 
    new.id,
    COALESCE(new.notes, 'Collection for Payment ' || new.id),
    new.payment_date,
    new.fund_id  -- CRITICAL: Explicitly pass fund_id
  );
  RETURN new;
END;
$$;


ALTER FUNCTION "public"."handle_new_payment"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO public.profiles (id, role)
  VALUES (new.id, 'admin');
  RETURN new;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."has_fund_access"("_fund_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN EXISTS (
    -- 1. Check if user is a direct MEMBER
    SELECT 1 FROM public.fund_members 
    WHERE fund_id = _fund_id AND user_id = auth.uid()
  ) 
  OR EXISTS (
    -- 2. Check if user is the OWNER (This was missing!)
    SELECT 1 FROM public.funds 
    WHERE id = _fund_id AND owner_id = auth.uid()
  )
  OR EXISTS (
    -- 3. Check if user is a SUPERUSER
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'superuser'
  );
END;
$$;


ALTER FUNCTION "public"."has_fund_access"("_fund_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."record_audit"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO public.audit_logs (
    table_name, 
    record_id, 
    action, 
    old_data, 
    new_data, 
    changed_by, 
    fund_id
  )
  VALUES (
    TG_TABLE_NAME,
    COALESCE(new.id, old.id),
    TG_OP,
    to_jsonb(old),
    to_jsonb(new),
    auth.uid(),
    COALESCE(new.fund_id, old.fund_id)
  );
  RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."record_audit"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_loan_schedule_status"("target_loan_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_total_paid numeric;
  v_schedule RECORD;
BEGIN
  -- 1. Get total cash paid for this loan
  SELECT COALESCE(SUM(amount), 0) INTO v_total_paid
  FROM public.payments
  WHERE loan_id = target_loan_id;

  -- 2. Reset all schedules to PENDING first (to be safe)
  UPDATE public.payment_schedule 
  SET status = 'PENDING' 
  WHERE loan_id = target_loan_id;

  -- 3. Loop through schedules chronologically and mark as PAID if money exists
  FOR v_schedule IN 
    SELECT * FROM public.payment_schedule 
    WHERE loan_id = target_loan_id 
    ORDER BY due_date ASC
  LOOP
    IF v_total_paid >= v_schedule.expected_amount THEN
      -- Mark as PAID
      UPDATE public.payment_schedule 
      SET status = 'PAID' 
      WHERE id = v_schedule.id;
      
      -- Deduct from stack
      v_total_paid := v_total_paid - v_schedule.expected_amount;
    ELSE
      -- Not enough money left to pay this schedule
      EXIT; 
    END IF;
  END LOOP;
END;
$$;


ALTER FUNCTION "public"."sync_loan_schedule_status"("target_loan_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_schedule_on_payment"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_remaining_payment numeric;
  v_schedule_record RECORD;
BEGIN
  v_remaining_payment := new.amount;

  -- 1. Loop through all PENDING schedules for this loan, ordered by oldest date first
  FOR v_schedule_record IN
    SELECT * FROM public.payment_schedule
    WHERE loan_id = new.loan_id
      AND status = 'PENDING'
    ORDER BY due_date ASC
  LOOP
    
    -- 2. Check if we have enough money to cover this specific schedule
    -- We allow a small buffer (e.g. if they are short 1 peso, we still count it) if you want, 
    -- but strict >= is safer for now.
    IF v_remaining_payment >= v_schedule_record.expected_amount THEN
      
      -- A. Mark this date as PAID
      UPDATE public.payment_schedule
      SET status = 'PAID'
      WHERE id = v_schedule_record.id;

      -- B. Deduct the cost from our payment stack
      v_remaining_payment := v_remaining_payment - v_schedule_record.expected_amount;
    
    ELSE
      -- C. Not enough money to fully pay this specific date?
      -- We stop here. The schedule remains PENDING until they pay the rest.
      EXIT;
    END IF;

    -- D. If we ran out of payment money, stop looping
    IF v_remaining_payment <= 0 THEN
      EXIT;
    END IF;

  END LOOP;

  RETURN new;
END;
$$;


ALTER FUNCTION "public"."update_schedule_on_payment"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."audit_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "fund_id" "uuid",
    "table_name" "text" NOT NULL,
    "record_id" "uuid" NOT NULL,
    "action" "text" NOT NULL,
    "old_data" "jsonb",
    "new_data" "jsonb",
    "changed_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."audit_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."borrowers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "fund_id" "uuid",
    "first_name" "text" NOT NULL,
    "last_name" "text" NOT NULL,
    "email" "text",
    "phone" "text",
    "address" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "deleted_at" timestamp with time zone,
    "signature_url" "text"
);


ALTER TABLE "public"."borrowers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."fund_members" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "fund_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role" "public"."app_role" DEFAULT 'admin'::"public"."app_role",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."fund_members" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."funds" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "owner_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "currency" "text" DEFAULT 'PHP'::"text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."funds" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ledger" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "fund_id" "uuid",
    "amount" numeric(12,2) NOT NULL,
    "category" "text" NOT NULL,
    "loan_id" "uuid",
    "payment_id" "uuid",
    "notes" "text",
    "transaction_date" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."ledger" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."loans" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "fund_id" "uuid",
    "borrower_id" "uuid" NOT NULL,
    "principal" numeric(12,2) NOT NULL,
    "interest_rate" numeric(5,2) NOT NULL,
    "duration_months" integer NOT NULL,
    "start_date" "date" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "deleted_at" timestamp with time zone,
    "is_void" boolean DEFAULT false,
    "void_reason" "text"
);


ALTER TABLE "public"."loans" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payment_schedule" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "loan_id" "uuid" NOT NULL,
    "due_date" "date" NOT NULL,
    "expected_amount" numeric(12,2) NOT NULL,
    "status" "text" DEFAULT 'PENDING'::"text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."payment_schedule" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "fund_id" "uuid",
    "loan_id" "uuid" NOT NULL,
    "amount" numeric(12,2) NOT NULL,
    "payment_date" "date" NOT NULL,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "deleted_at" timestamp with time zone
);


ALTER TABLE "public"."payments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "role" "text" DEFAULT 'admin'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."view_loan_summary" AS
SELECT
    NULL::"uuid" AS "id",
    NULL::"uuid" AS "fund_id",
    NULL::"uuid" AS "borrower_id",
    NULL::"text" AS "first_name",
    NULL::"text" AS "last_name",
    NULL::numeric(12,2) AS "principal",
    NULL::numeric(5,2) AS "interest_rate",
    NULL::integer AS "duration_months",
    NULL::"date" AS "start_date",
    NULL::numeric(12,2) AS "total_interest",
    NULL::numeric(12,2) AS "total_due",
    NULL::numeric AS "amortization_per_payday",
    NULL::numeric AS "total_paid",
    NULL::numeric(12,2) AS "remaining_balance",
    NULL::"text" AS "status";


ALTER VIEW "public"."view_loan_summary" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."view_borrower_stats" WITH ("security_invoker"='true') AS
 SELECT "b"."id",
    "b"."fund_id",
    "b"."first_name",
    "b"."last_name",
    "b"."created_at",
    "count"("l"."id") FILTER (WHERE ("vs"."status" = 'ACTIVE'::"text")) AS "active_loan_count",
    COALESCE("sum"("vs"."remaining_balance"), (0)::numeric) AS "total_debt"
   FROM (("public"."borrowers" "b"
     LEFT JOIN "public"."loans" "l" ON ((("b"."id" = "l"."borrower_id") AND ("l"."deleted_at" IS NULL))))
     LEFT JOIN "public"."view_loan_summary" "vs" ON (("l"."id" = "vs"."id")))
  GROUP BY "b"."id", "b"."fund_id", "b"."first_name", "b"."last_name", "b"."created_at";


ALTER VIEW "public"."view_borrower_stats" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."view_wallet_balance" WITH ("security_invoker"='true') AS
 SELECT "fund_id",
    COALESCE("sum"("amount"), (0)::numeric) AS "cash_on_hand"
   FROM "public"."ledger"
  GROUP BY "fund_id";


ALTER VIEW "public"."view_wallet_balance" OWNER TO "postgres";


ALTER TABLE ONLY "public"."audit_logs"
    ADD CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."borrowers"
    ADD CONSTRAINT "borrowers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."fund_members"
    ADD CONSTRAINT "fund_members_fund_id_user_id_key" UNIQUE ("fund_id", "user_id");



ALTER TABLE ONLY "public"."fund_members"
    ADD CONSTRAINT "fund_members_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."funds"
    ADD CONSTRAINT "funds_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ledger"
    ADD CONSTRAINT "ledger_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."loans"
    ADD CONSTRAINT "loans_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payment_schedule"
    ADD CONSTRAINT "payment_schedule_loan_id_due_date_key" UNIQUE ("loan_id", "due_date");



ALTER TABLE ONLY "public"."payment_schedule"
    ADD CONSTRAINT "payment_schedule_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



CREATE UNIQUE INDEX "funds_slug_idx" ON "public"."funds" USING "btree" ("slug");



CREATE INDEX "idx_audit_logs_action" ON "public"."audit_logs" USING "btree" ("action");



CREATE INDEX "idx_audit_logs_changed_by" ON "public"."audit_logs" USING "btree" ("changed_by");



CREATE INDEX "idx_audit_logs_fund_id" ON "public"."audit_logs" USING "btree" ("fund_id");



CREATE INDEX "idx_audit_logs_table_name" ON "public"."audit_logs" USING "btree" ("table_name");



CREATE INDEX "idx_borrowers_deleted_at" ON "public"."borrowers" USING "btree" ("deleted_at") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_borrowers_fund_active" ON "public"."borrowers" USING "btree" ("fund_id", "deleted_at");



CREATE INDEX "idx_borrowers_fund_id" ON "public"."borrowers" USING "btree" ("fund_id");



CREATE INDEX "idx_fund_members_fund_id" ON "public"."fund_members" USING "btree" ("fund_id");



CREATE INDEX "idx_fund_members_user_id" ON "public"."fund_members" USING "btree" ("user_id");



CREATE INDEX "idx_funds_owner_id" ON "public"."funds" USING "btree" ("owner_id");



CREATE INDEX "idx_ledger_category" ON "public"."ledger" USING "btree" ("category");



CREATE INDEX "idx_ledger_fund_category" ON "public"."ledger" USING "btree" ("fund_id", "category");



CREATE INDEX "idx_ledger_fund_date" ON "public"."ledger" USING "btree" ("fund_id", "transaction_date");



CREATE INDEX "idx_ledger_fund_id" ON "public"."ledger" USING "btree" ("fund_id");



CREATE INDEX "idx_ledger_loan_id" ON "public"."ledger" USING "btree" ("loan_id");



CREATE INDEX "idx_ledger_payment_id" ON "public"."ledger" USING "btree" ("payment_id");



CREATE INDEX "idx_ledger_transaction_date" ON "public"."ledger" USING "btree" ("transaction_date");



CREATE INDEX "idx_loans_borrower_id" ON "public"."loans" USING "btree" ("borrower_id");



CREATE INDEX "idx_loans_deleted_at" ON "public"."loans" USING "btree" ("deleted_at") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_loans_fund_active" ON "public"."loans" USING "btree" ("fund_id", "deleted_at");



CREATE INDEX "idx_loans_fund_id" ON "public"."loans" USING "btree" ("fund_id");



CREATE INDEX "idx_loans_start_date" ON "public"."loans" USING "btree" ("start_date");



CREATE INDEX "idx_payment_schedule_due_date" ON "public"."payment_schedule" USING "btree" ("due_date");



CREATE INDEX "idx_payment_schedule_loan_id" ON "public"."payment_schedule" USING "btree" ("loan_id");



CREATE INDEX "idx_payment_schedule_loan_status" ON "public"."payment_schedule" USING "btree" ("loan_id", "status");



CREATE INDEX "idx_payment_schedule_status" ON "public"."payment_schedule" USING "btree" ("status");



CREATE INDEX "idx_payments_deleted_at" ON "public"."payments" USING "btree" ("deleted_at") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_payments_fund_active" ON "public"."payments" USING "btree" ("fund_id", "deleted_at");



CREATE INDEX "idx_payments_fund_id" ON "public"."payments" USING "btree" ("fund_id");



CREATE INDEX "idx_payments_loan_id" ON "public"."payments" USING "btree" ("loan_id");



CREATE INDEX "idx_payments_payment_date" ON "public"."payments" USING "btree" ("payment_date");



CREATE OR REPLACE VIEW "public"."view_loan_summary" WITH ("security_invoker"='true') AS
 SELECT "l"."id",
    "l"."fund_id",
    "l"."borrower_id",
    "b"."first_name",
    "b"."last_name",
    "l"."principal",
    "l"."interest_rate",
    "l"."duration_months",
    "l"."start_date",
    ((("l"."principal" * ("l"."interest_rate" / 100.0)) * ("l"."duration_months")::numeric))::numeric(12,2) AS "total_interest",
    (("l"."principal" + (("l"."principal" * ("l"."interest_rate" / 100.0)) * ("l"."duration_months")::numeric)))::numeric(12,2) AS "total_due",
    "round"((("l"."principal" + (("l"."principal" * ("l"."interest_rate" / 100.0)) * ("l"."duration_months")::numeric)) / (("l"."duration_months")::numeric * 2.0)), 2) AS "amortization_per_payday",
    COALESCE("sum"("p"."amount"), (0)::numeric) AS "total_paid",
    ((("l"."principal" + (("l"."principal" * ("l"."interest_rate" / 100.0)) * ("l"."duration_months")::numeric)) - COALESCE("sum"("p"."amount"), (0)::numeric)))::numeric(12,2) AS "remaining_balance",
        CASE
            WHEN ((("l"."principal" + (("l"."principal" * ("l"."interest_rate" / 100.0)) * ("l"."duration_months")::numeric)) - COALESCE("sum"("p"."amount"), (0)::numeric)) <= (0)::numeric) THEN 'PAID'::"text"
            ELSE 'ACTIVE'::"text"
        END AS "status"
   FROM (("public"."loans" "l"
     JOIN "public"."borrowers" "b" ON (("l"."borrower_id" = "b"."id")))
     LEFT JOIN "public"."payments" "p" ON ((("l"."id" = "p"."loan_id") AND ("p"."deleted_at" IS NULL))))
  WHERE ("l"."deleted_at" IS NULL)
  GROUP BY "l"."id", "l"."fund_id", "b"."first_name", "b"."last_name", "b"."id";



CREATE OR REPLACE TRIGGER "tr_audit_borrowers" AFTER INSERT OR DELETE OR UPDATE ON "public"."borrowers" FOR EACH ROW EXECUTE FUNCTION "public"."record_audit"();



CREATE OR REPLACE TRIGGER "tr_audit_loans" AFTER INSERT OR DELETE OR UPDATE ON "public"."loans" FOR EACH ROW EXECUTE FUNCTION "public"."record_audit"();



CREATE OR REPLACE TRIGGER "tr_audit_payments" AFTER INSERT OR DELETE OR UPDATE ON "public"."payments" FOR EACH ROW EXECUTE FUNCTION "public"."record_audit"();



CREATE OR REPLACE TRIGGER "tr_generate_payment_schedule" AFTER INSERT ON "public"."loans" FOR EACH ROW EXECUTE FUNCTION "public"."generate_payment_schedule"();



CREATE OR REPLACE TRIGGER "tr_handle_loan_update" AFTER UPDATE ON "public"."loans" FOR EACH ROW EXECUTE FUNCTION "public"."handle_loan_update"();



CREATE OR REPLACE TRIGGER "tr_handle_new_loan" AFTER INSERT ON "public"."loans" FOR EACH ROW EXECUTE FUNCTION "public"."handle_new_loan"();



CREATE OR REPLACE TRIGGER "tr_handle_new_payment" AFTER INSERT ON "public"."payments" FOR EACH ROW EXECUTE FUNCTION "public"."handle_new_payment"();



CREATE OR REPLACE TRIGGER "tr_on_fund_created" AFTER INSERT ON "public"."funds" FOR EACH ROW EXECUTE FUNCTION "public"."handle_new_fund_creation"();



CREATE OR REPLACE TRIGGER "tr_update_schedule_on_payment" AFTER INSERT ON "public"."payments" FOR EACH ROW EXECUTE FUNCTION "public"."update_schedule_on_payment"();



ALTER TABLE ONLY "public"."audit_logs"
    ADD CONSTRAINT "audit_logs_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."audit_logs"
    ADD CONSTRAINT "audit_logs_fund_id_fkey" FOREIGN KEY ("fund_id") REFERENCES "public"."funds"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."borrowers"
    ADD CONSTRAINT "borrowers_fund_id_fkey" FOREIGN KEY ("fund_id") REFERENCES "public"."funds"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."fund_members"
    ADD CONSTRAINT "fund_members_fund_id_fkey" FOREIGN KEY ("fund_id") REFERENCES "public"."funds"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."fund_members"
    ADD CONSTRAINT "fund_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."funds"
    ADD CONSTRAINT "funds_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."ledger"
    ADD CONSTRAINT "ledger_fund_id_fkey" FOREIGN KEY ("fund_id") REFERENCES "public"."funds"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ledger"
    ADD CONSTRAINT "ledger_loan_id_fkey" FOREIGN KEY ("loan_id") REFERENCES "public"."loans"("id");



ALTER TABLE ONLY "public"."ledger"
    ADD CONSTRAINT "ledger_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id");



ALTER TABLE ONLY "public"."loans"
    ADD CONSTRAINT "loans_borrower_id_fkey" FOREIGN KEY ("borrower_id") REFERENCES "public"."borrowers"("id");



ALTER TABLE ONLY "public"."loans"
    ADD CONSTRAINT "loans_fund_id_fkey" FOREIGN KEY ("fund_id") REFERENCES "public"."funds"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."payment_schedule"
    ADD CONSTRAINT "payment_schedule_loan_id_fkey" FOREIGN KEY ("loan_id") REFERENCES "public"."loans"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_fund_id_fkey" FOREIGN KEY ("fund_id") REFERENCES "public"."funds"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_loan_id_fkey" FOREIGN KEY ("loan_id") REFERENCES "public"."loans"("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Fund Member Access Audit" ON "public"."audit_logs" USING ("public"."has_fund_access"("fund_id"));



CREATE POLICY "Fund Member Access Borrowers" ON "public"."borrowers" USING ("public"."has_fund_access"("fund_id"));



CREATE POLICY "Fund Member Access Ledger" ON "public"."ledger" USING ("public"."has_fund_access"("fund_id"));



CREATE POLICY "Fund Member Access Loans" ON "public"."loans" USING ("public"."has_fund_access"("fund_id"));



CREATE POLICY "Fund Member Access Payments" ON "public"."payments" USING ("public"."has_fund_access"("fund_id"));



CREATE POLICY "Fund Member Access Schedule" ON "public"."payment_schedule" USING ((EXISTS ( SELECT 1
   FROM "public"."loans"
  WHERE (("loans"."id" = "payment_schedule"."loan_id") AND "public"."has_fund_access"("loans"."fund_id")))));



CREATE POLICY "Insert Funds" ON "public"."funds" FOR INSERT WITH CHECK (("auth"."uid"() = "owner_id"));



CREATE POLICY "Read Own Profile" ON "public"."profiles" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "id"));



CREATE POLICY "View Funds" ON "public"."funds" FOR SELECT TO "authenticated" USING ((("owner_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."fund_members"
  WHERE (("fund_members"."fund_id" = "funds"."id") AND ("fund_members"."user_id" = "auth"."uid"())))) OR (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'superuser'::"text"))))));



CREATE POLICY "View Memberships" ON "public"."fund_members" FOR SELECT TO "authenticated" USING ((("user_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'superuser'::"text"))))));



ALTER TABLE "public"."audit_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."borrowers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."fund_members" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."funds" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ledger" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."loans" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."payment_schedule" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."payments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


REVOKE USAGE ON SCHEMA "public" FROM PUBLIC;
GRANT ALL ON SCHEMA "public" TO PUBLIC;
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";








































































































































































GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."audit_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."audit_logs" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."borrowers" TO "authenticated";
GRANT ALL ON TABLE "public"."borrowers" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."fund_members" TO "authenticated";
GRANT ALL ON TABLE "public"."fund_members" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."funds" TO "authenticated";
GRANT ALL ON TABLE "public"."funds" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."ledger" TO "authenticated";
GRANT ALL ON TABLE "public"."ledger" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."loans" TO "authenticated";
GRANT ALL ON TABLE "public"."loans" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."payment_schedule" TO "authenticated";
GRANT ALL ON TABLE "public"."payment_schedule" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."payments" TO "authenticated";
GRANT ALL ON TABLE "public"."payments" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."view_loan_summary" TO "authenticated";
GRANT ALL ON TABLE "public"."view_loan_summary" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."view_borrower_stats" TO "authenticated";
GRANT ALL ON TABLE "public"."view_borrower_stats" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."view_wallet_balance" TO "authenticated";
GRANT ALL ON TABLE "public"."view_wallet_balance" TO "service_role";


































