-- Check if the constraint exists before dropping it
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'Admin_superAdminId_fkey'
    ) THEN
        ALTER TABLE "Admin" DROP CONSTRAINT "Admin_superAdminId_fkey";
    END IF;
END $$;

-- Check if the column exists before dropping it
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'Admin' AND column_name = 'superAdminId'
    ) THEN
        ALTER TABLE "Admin" DROP COLUMN "superAdminId";
    END IF;
END $$; 