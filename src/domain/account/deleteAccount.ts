// src/domain/account/deleteAccount.ts
// User-initiated account and data deletion

import { getDb } from '../../data/db';
import { supabase } from '../../data/supabaseClient';
import { clearAllSyncState } from '../sync/syncStateRepo';
import { logger } from '../../utils/logger';

export interface DeleteAccountResult {
  success: boolean;
  error?: string;
}

/**
 * Delete all user data from local SQLite cache
 */
async function clearLocalData(): Promise<void> {
  const db = await getDb();
  
  // Delete all user-created data (not practices - those are system data)
  await db.runAsync('DELETE FROM meaning_entries');
  await db.runAsync('DELETE FROM practice_sessions');
  
  // Clear sync state
  await clearAllSyncState();
  
  logger.info('DeleteAccount', 'Local data cleared');
}

/**
 * Delete all user data from Supabase
 */
async function deleteRemoteData(userId: string): Promise<void> {
  // Delete meaning entries
  const { error: entriesError } = await supabase
    .from('meaning_entries')
    .delete()
    .eq('user_id', userId);
  
  if (entriesError) {
    logger.error('DeleteAccount', 'Failed to delete remote entries', entriesError);
    throw new Error('Failed to delete entries from server');
  }
  
  // Delete practice sessions
  const { error: sessionsError } = await supabase
    .from('practice_sessions')
    .delete()
    .eq('user_id', userId);
  
  if (sessionsError) {
    logger.error('DeleteAccount', 'Failed to delete remote sessions', sessionsError);
    throw new Error('Failed to delete sessions from server');
  }
  
  logger.info('DeleteAccount', 'Remote data deleted');
}

/**
 * Delete account and all associated data
 * 
 * This will:
 * 1. Delete all user data from Supabase (entries, sessions)
 * 2. Clear local SQLite cache
 * 3. Sign out the user
 * 
 * Note: The Supabase user account itself is NOT deleted by this function.
 * Full account deletion requires admin API or Supabase dashboard.
 * This function deletes all USER DATA, not the auth account.
 */
export async function deleteAccountData(): Promise<DeleteAccountResult> {
  try {
    logger.info('DeleteAccount', 'Starting account data deletion');
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { success: false, error: 'Not signed in' };
    }
    
    // Delete remote data first (while still authenticated)
    await deleteRemoteData(user.id);
    
    // Clear local data
    await clearLocalData();
    
    // Sign out
    await supabase.auth.signOut();
    
    logger.info('DeleteAccount', 'Account data deletion complete');
    return { success: true };
    
  } catch (err) {
    logger.error('DeleteAccount', 'Account deletion failed', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to delete account data',
    };
  }
}
