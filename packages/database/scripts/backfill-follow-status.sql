-- Run once after adding FollowStatus to UserFollow (existing rows were mutual follows).
UPDATE "UserFollow" SET status = 'ACCEPTED' WHERE status IS NULL OR status = 'PENDING' AND "respondedAt" IS NULL;
