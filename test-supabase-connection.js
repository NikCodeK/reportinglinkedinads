#!/usr/bin/env node

/**
 * Test Supabase Connection and Tables
 * This script verifies that Supabase tables exist and are accessible
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load .env.local manually
const envPath = path.join(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) {
    const key = match[1].trim();
    const value = match[2].trim();
    envVars[key] = value;
  }
});

const supabaseUrl = envVars.SUPABASE_URL || envVars.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 Testing Supabase Connection...');
console.log('='.repeat(60));
console.log();

if (!supabaseUrl) {
  console.error('❌ Missing SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL');
  process.exit(1);
}

if (!supabaseKey) {
  console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

console.log('✅ Environment variables found');
console.log(`   URL: ${supabaseUrl}`);
console.log(`   Key: ${supabaseKey.substring(0, 20)}...`);
console.log();

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  console.log('📡 Testing connection...');
  
  // Test 1: Check if we can connect
  try {
    const { data, error } = await supabase.from('_test_').select('*').limit(1);
    if (error && !error.message.includes('not found') && !error.message.includes('schema cache')) {
      console.log('❌ Connection failed:', error.message);
      return false;
    }
    console.log('✅ Connection successful (API key valid)');
  } catch (err) {
    console.log('❌ Connection error:', err.message);
    return false;
  }
  
  console.log();
  console.log('🔍 Checking tables...');
  console.log();
  
  const tables = ['fact_daily', 'weekly_briefings', 'events'];
  
  for (const table of tables) {
    console.log(`Checking table: ${table}`);
    try {
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.log(`  ❌ ERROR: ${error.message}`);
        console.log(`     Code: ${error.code}`);
        console.log(`     Hint: ${error.hint || 'No hint'}`);
        
        if (error.message.includes('not found') || error.message.includes('does not exist')) {
          console.log(`     → Table '${table}' does NOT exist!`);
        } else if (error.message.includes('permission denied') || error.message.includes('RLS')) {
          console.log(`     → Row Level Security might be blocking access`);
        }
      } else {
        console.log(`  ✅ Table exists! (${count || 0} rows)`);
      }
    } catch (err) {
      console.log(`  ❌ Exception: ${err.message}`);
    }
    console.log();
  }
  
  // Additional check: List all tables in public schema
  console.log('📋 Listing all tables in public schema...');
  try {
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_type', 'BASE TABLE');
    
    if (error) {
      console.log('  ❌ Could not list tables:', error.message);
    } else if (data) {
      console.log('  Tables found:');
      data.forEach(row => {
        console.log(`    - ${row.table_name}`);
      });
    }
  } catch (err) {
    console.log('  ⚠️  Could not query information_schema');
  }
  
  console.log();
  console.log('='.repeat(60));
  console.log('🎯 Summary:');
  console.log();
  console.log('If you see "Table does NOT exist" above:');
  console.log('  → Run the schema.sql in Supabase SQL Editor');
  console.log('  → https://supabase.com/dashboard/project/afdzzkvtynnrcagyunaa/sql');
  console.log();
  console.log('If you see "permission denied" or "RLS":');
  console.log('  → Disable Row Level Security on the tables');
  console.log('  → Or add policies to allow service role access');
  console.log('='.repeat(60));
}

testConnection();

