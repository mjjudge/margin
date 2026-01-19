// src/domain/export/exportData.ts
// User-initiated JSON export of local data

import { 
  cacheDirectory, 
  writeAsStringAsync, 
  EncodingType 
} from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { getDb } from '../../data/db';
import { logger } from '../../utils/logger';

interface ExportedMeaningEntry {
  id: string;
  category: string;
  text: string | null;
  tags: string[];
  time_of_day: string | null;
  created_at: string;
  updated_at: string;
}

interface ExportedPracticeSession {
  id: string;
  practice_id: string;
  practice_title?: string;
  started_at: string;
  completed_at: string | null;
  status: string;
  user_rating: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface ExportData {
  exportedAt: string;
  version: '1.0';
  appName: 'Margin';
  description: string;
  whatIsIncluded: string[];
  whatIsNotIncluded: string[];
  meaningEntries: ExportedMeaningEntry[];
  practiceSessions: ExportedPracticeSession[];
  summary: {
    totalEntries: number;
    totalSessions: number;
    completedSessions: number;
  };
}

/**
 * Gather all non-deleted user data for export
 */
async function gatherExportData(): Promise<ExportData> {
  const db = await getDb();

  // Get meaning entries (non-deleted)
  const entryRows = await db.getAllAsync<{
    id: string;
    category: string;
    text: string | null;
    tags: string;
    time_of_day: string | null;
    created_at: string;
    updated_at: string;
  }>(
    'SELECT id, category, text, tags, time_of_day, created_at, updated_at FROM meaning_entries WHERE deleted_at IS NULL ORDER BY created_at DESC'
  );

  const meaningEntries: ExportedMeaningEntry[] = entryRows.map(row => {
    let tags: string[] = [];
    try {
      tags = JSON.parse(row.tags);
    } catch {
      // Invalid JSON
    }
    return {
      id: row.id,
      category: row.category,
      text: row.text,
      tags,
      time_of_day: row.time_of_day,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  });

  // Get practice sessions with practice titles (non-deleted)
  const sessionRows = await db.getAllAsync<{
    id: string;
    practice_id: string;
    practice_title: string;
    started_at: string;
    completed_at: string | null;
    status: string;
    user_rating: string | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
  }>(
    `SELECT 
      ps.id, ps.practice_id, p.title as practice_title,
      ps.started_at, ps.completed_at, ps.status, ps.user_rating, ps.notes,
      ps.created_at, ps.updated_at
     FROM practice_sessions ps
     LEFT JOIN practices p ON ps.practice_id = p.id
     WHERE ps.deleted_at IS NULL
     ORDER BY ps.started_at DESC`
  );

  const practiceSessions: ExportedPracticeSession[] = sessionRows.map(row => ({
    id: row.id,
    practice_id: row.practice_id,
    practice_title: row.practice_title,
    started_at: row.started_at,
    completed_at: row.completed_at,
    status: row.status,
    user_rating: row.user_rating,
    notes: row.notes,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }));

  const completedSessions = practiceSessions.filter(s => s.status === 'completed').length;

  return {
    exportedAt: new Date().toISOString(),
    version: '1.0',
    appName: 'Margin',
    description: 'Your personal Margin data export. This file contains your logged moments and practice sessions.',
    whatIsIncluded: [
      'All your meaning entries (text, categories, tags, timestamps)',
      'All your practice sessions (dates, completion status, notes)',
      'Summary statistics',
    ],
    whatIsNotIncluded: [
      'Your account email or user ID',
      'Authentication tokens',
      'Practice definitions (these are system data)',
      'Internal sync state',
    ],
    meaningEntries,
    practiceSessions,
    summary: {
      totalEntries: meaningEntries.length,
      totalSessions: practiceSessions.length,
      completedSessions,
    },
  };
}

/**
 * Generate filename with current date
 */
function generateFilename(): string {
  const date = new Date().toISOString().split('T')[0];
  return `margin-export-${date}.json`;
}

/**
 * Export user data to JSON and open share sheet
 */
export async function exportDataToJSON(): Promise<{ success: boolean; error?: string }> {
  try {
    logger.info('Export', 'Starting data export');

    // Check if sharing is available
    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) {
      logger.warn('Export', 'Sharing not available on this device');
      return { success: false, error: 'Sharing is not available on this device' };
    }

    // Gather data
    const exportData = await gatherExportData();
    logger.info('Export', 'Data gathered', {
      entries: exportData.summary.totalEntries,
      sessions: exportData.summary.totalSessions,
    });

    // Write to temporary file
    const filename = generateFilename();
    const fileUri = cacheDirectory + filename;
    
    await writeAsStringAsync(
      fileUri,
      JSON.stringify(exportData, null, 2),
      { encoding: EncodingType.UTF8 }
    );

    logger.info('Export', 'File written', { filename });

    // Open share sheet
    await Sharing.shareAsync(fileUri, {
      mimeType: 'application/json',
      dialogTitle: 'Export Margin Data',
      UTI: 'public.json',
    });

    logger.info('Export', 'Share sheet opened');
    return { success: true };

  } catch (err) {
    logger.error('Export', 'Export failed', err);
    return { 
      success: false, 
      error: err instanceof Error ? err.message : 'Export failed' 
    };
  }
}
