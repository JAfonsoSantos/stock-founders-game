-- Add missing updated_at column to notifications table
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

-- Create trigger to automatically update the updated_at column
DROP TRIGGER IF EXISTS update_notifications_updated_at ON notifications;
CREATE TRIGGER update_notifications_updated_at
    BEFORE UPDATE ON notifications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Update existing notifications to have updated_at = created_at
UPDATE notifications SET updated_at = created_at WHERE updated_at IS NULL;