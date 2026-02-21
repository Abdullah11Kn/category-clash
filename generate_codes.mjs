import fs from 'fs';
import crypto from 'crypto';

const NUM_CODES = 5000;
// We exclude confusing characters like O, 0, I, 1, L to make it easily readable for customers.
const LETTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const NUMBERS = '23456789';

function getRandomChar(str) {
  return str.charAt(Math.floor(Math.random() * str.length));
}

// Generates a 6-character code where a letter is in the 2nd or 3rd position (User's preferred format)
function generateCode() {
  const isLetterSecond = Math.random() > 0.5;
  let code = '';
  for (let i = 0; i < 6; i++) {
    if ((i === 1 && isLetterSecond) || (i === 2 && !isLetterSecond)) {
      code += getRandomChar(LETTERS);
    } else {
      code += getRandomChar(NUMBERS);
    }
  }
  return code;
}

const codes = new Set();
while (codes.size < NUM_CODES) {
  codes.add(generateCode());
}

function sha256(message) {
  return crypto.createHash('sha256').update(message).digest('hex');
}

// For Supabase Table Import (We don't save the actual code on your database, only the anonymous hash!)
// Assuming table is "activation_codes" with columns: code_hash, status
const dbCsvLines = ['code_hash,status,created_at'];

// For the User to Sell / Put on Salla
const sallaCsvLines = ['code'];

for (const code of codes) {
  const hash = sha256(code);
  const now = new Date().toISOString();
  dbCsvLines.push(`${hash},unused,${now}`);
  sallaCsvLines.push(code);
}

// Output to root folder
fs.writeFileSync('supabase_import_5000.csv', dbCsvLines.join('\n'));
fs.writeFileSync('salla_inventory_5000.csv', sallaCsvLines.join('\n'));

console.log(`✅ Successfully generated ${codes.size} perfectly unique codes.`);
console.log(`📁 Wrote 'supabase_import_5000.csv' containing SHA-256 hashes for maximum database security.`);
console.log(`📁 Wrote 'salla_inventory_5000.csv' containing the plain shiny codes for you to upload to your store!`);
