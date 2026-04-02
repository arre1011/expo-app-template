import { CREATE_JOURNAL_ENTRY_DATE_INDEX, CREATE_JOURNAL_ENTRY_TABLE } from '@/features/optional/calendar/data/journalEntry.schema';
import { CREATE_USER_MOTIVATIONS_TABLE } from '@/features/core/onboarding/data/userMotivations.schema';
import { CREATE_USER_PROFILE_TABLE } from '@/features/core/onboarding/data/userProfile.schema';

export const SCHEMA_VERSION = 1;

export const CREATE_SCHEMA_VERSION_TABLE = `
  CREATE TABLE IF NOT EXISTS schema_version (
    version INTEGER PRIMARY KEY
  );
`;

export const ALL_CREATE_STATEMENTS = [
  CREATE_SCHEMA_VERSION_TABLE,
  CREATE_USER_PROFILE_TABLE,
  CREATE_JOURNAL_ENTRY_TABLE,
  CREATE_JOURNAL_ENTRY_DATE_INDEX,
  CREATE_USER_MOTIVATIONS_TABLE,
];
