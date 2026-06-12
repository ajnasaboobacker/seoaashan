import fs from 'fs';
import path from 'path';
import os from 'os';
import dotenv from 'dotenv';
import { createClient } from '@insforge/sdk';

dotenv.config();

const INSFORGE_URL = process.env.INSFORGE_URL;
const INSFORGE_ANON_KEY = process.env.INSFORGE_ANON_KEY;

const isInsforgeConfigured = !!(INSFORGE_URL && INSFORGE_ANON_KEY);

let insforgeClient = null;

if (isInsforgeConfigured) {
  console.log(`[DB] Initializing InsForge Client at ${INSFORGE_URL}`);
  try {
    insforgeClient = createClient({
      baseUrl: INSFORGE_URL,
      anonKey: INSFORGE_ANON_KEY,
      isServerMode: true
    });
  } catch (err) {
    console.error('[DB] Failed to build InsForge client:', err);
  }
} else {
  console.log('[DB] InsForge credentials not set in .env. Running in LOCAL PERSISTENT FALLBACK MODE.');
}

// Local File Persistence Fallback
const LOCAL_DB_DIR = path.resolve(os.homedir(), '.cache/claude-seo');
const LOCAL_DB_PATH = path.join(LOCAL_DB_DIR, 'users-db.json');

// In-memory fallback if disk is read-only
let memoryDb = { users: {} };
let useMemoryDb = false;

function initLocalDb() {
  if (useMemoryDb) return;
  try {
    if (!fs.existsSync(LOCAL_DB_DIR)) {
      fs.mkdirSync(LOCAL_DB_DIR, { recursive: true });
    }
    if (!fs.existsSync(LOCAL_DB_PATH)) {
      fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify({ users: {} }, null, 2));
    }
  } catch (err) {
    console.warn('[DB] Persistent filesystem is read-only or inaccessible. Falling back to IN-MEMORY database.', err.message);
    useMemoryDb = true;
  }
}

// Database helper functions
export async function saveCredentials(userId, credentials) {
  if (isInsforgeConfigured && insforgeClient) {
    // InsForge Cloud persistent save
    const { data, error } = await insforgeClient.database
      .from('user_credentials')
      .upsert({
        user_id: userId,
        google_api_key: credentials.googleApiKey || '',
        ads_developer_token: credentials.adsDevToken || '',
        ads_customer_id: credentials.adsCustomerId || '',
        ads_login_customer_id: credentials.adsLoginId || '',
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });

    if (error) {
      console.error('[DB] InsForge save error:', error);
      throw new Error(error.message || 'Failed to save to InsForge database');
    }
    return { status: 'synced', data };
  } else {
    // Local JSON File persistent save
    initLocalDb();
    if (useMemoryDb) {
      memoryDb.users[userId] = {
        googleApiKey: credentials.googleApiKey || '',
        adsDevToken: credentials.adsDevToken || '',
        adsCustomerId: credentials.adsCustomerId || '',
        adsLoginId: credentials.adsLoginId || '',
        updatedAt: new Date().toISOString()
      };
      return { status: 'memory', data: memoryDb.users[userId] };
    }
    try {
      const data = JSON.parse(fs.readFileSync(LOCAL_DB_PATH, 'utf8'));
      data.users[userId] = {
        googleApiKey: credentials.googleApiKey || '',
        adsDevToken: credentials.adsDevToken || '',
        adsCustomerId: credentials.adsCustomerId || '',
        adsLoginId: credentials.adsLoginId || '',
        updatedAt: new Date().toISOString()
      };
      fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(data, null, 2));
      return { status: 'local', data: data.users[userId] };
    } catch (err) {
      console.error('[DB] Failed to save credentials to file database. Falling back to memory:', err.message);
      useMemoryDb = true;
      memoryDb.users[userId] = {
        googleApiKey: credentials.googleApiKey || '',
        adsDevToken: credentials.adsDevToken || '',
        adsCustomerId: credentials.adsCustomerId || '',
        adsLoginId: credentials.adsLoginId || '',
        updatedAt: new Date().toISOString()
      };
      return { status: 'memory', data: memoryDb.users[userId] };
    }
  }
}

export async function loadCredentials(userId) {
  if (isInsforgeConfigured && insforgeClient) {
    // InsForge Cloud retrieval
    const { data, error } = await insforgeClient.database
      .from('user_credentials')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('[DB] InsForge load error:', error);
      throw new Error(error.message || 'Failed to load from InsForge database');
    }

    if (!data) {
      return {
        googleApiKey: '',
        adsDevToken: '',
        adsCustomerId: '',
        adsLoginId: ''
      };
    }

    return {
      googleApiKey: data.google_api_key || '',
      adsDevToken: data.ads_developer_token || '',
      adsCustomerId: data.ads_customer_id || '',
      adsLoginId: data.ads_login_customer_id || ''
    };
  } else {
    // Local JSON File retrieval
    initLocalDb();
    if (useMemoryDb) {
      const userCreds = memoryDb.users[userId];
      if (!userCreds) {
        return {
          googleApiKey: '',
          adsDevToken: '',
          adsCustomerId: '',
          adsLoginId: ''
        };
      }
      return userCreds;
    }
    try {
      const data = JSON.parse(fs.readFileSync(LOCAL_DB_PATH, 'utf8'));
      const userCreds = data.users[userId];
      if (!userCreds) {
        return {
          googleApiKey: '',
          adsDevToken: '',
          adsCustomerId: '',
          adsLoginId: ''
        };
      }
      return userCreds;
    } catch (err) {
      console.warn('[DB] Failed to load credentials from file database. Returning defaults or memory values:', err.message);
      return {
        googleApiKey: '',
        adsDevToken: '',
        adsCustomerId: '',
        adsLoginId: ''
      };
    }
  }
}

// Session Validation Bridge
export async function verifySession(token) {
  if (token === 'local-guest-token') {
    return {
      userId: 'local_guest_user',
      email: 'guest@localhost.local',
      mode: 'guest'
    };
  }

  if (isInsforgeConfigured) {
    try {
      const requestClient = createClient({
        baseUrl: INSFORGE_URL,
        anonKey: INSFORGE_ANON_KEY,
        isServerMode: true
      });
      requestClient.tokenManager.setAccessToken(token);
      const { data, error } = await requestClient.auth.getCurrentUser();
      
      if (error || !data || !data.user) {
        throw new Error(error?.message || 'Authentication session is invalid or expired.');
      }
      return {
        userId: data.user.id,
        email: data.user.email,
        mode: 'insforge'
      };
    } catch (err) {
      throw new Error(err.message || 'Authentication session is invalid or expired.');
    }
  } else {
    throw new Error('No active local guest token. Choose Continue as Guest.');
  }
}

// Export client directly for custom client usage (e.g. auth calls)
export function getInsforgeClient() {
  return insforgeClient;
}

export function isCloudEnabled() {
  return isInsforgeConfigured;
}
