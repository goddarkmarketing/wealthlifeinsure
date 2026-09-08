-- Add preferred_agent to leads (contact form agent routing)
ALTER TABLE leads
  ADD COLUMN preferred_agent VARCHAR(191) NULL AFTER insurance_plan;
