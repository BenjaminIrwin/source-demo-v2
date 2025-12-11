#!/usr/bin/env node
/**
 * Script to fetch Wikidata information for entities used in claims.
 * Run with: node scripts/fetch-wikidata.js
 */

const fs = require('fs');
const path = require('path');

const CLAIMS_PATH = path.join(__dirname, '../src/data/claims.json');
const OUTPUT_PATH = path.join(__dirname, '../src/data/wikidata-cache.json');

// Extract all unique Wikidata IDs from claims
function extractWikidataIds(claims) {
  const ids = new Set();
  
  for (const claim of claims) {
    const roleRecipes = claim.recipes?.roleRecipes;
    if (roleRecipes) {
      for (const recipe of Object.values(roleRecipes)) {
        if (recipe.wikidata) {
          ids.add(recipe.wikidata);
        }
      }
    }
  }
  
  return Array.from(ids);
}

// Fetch entity data from Wikidata API
async function fetchWikidataEntity(qid) {
  const url = `https://www.wikidata.org/wiki/Special:EntityData/${qid}.json`;
  
  console.log(`Fetching ${qid}...`);
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${qid}: ${response.statusText}`);
  }
  
  const data = await response.json();
  const entity = data.entities[qid];
  
  if (!entity) {
    throw new Error(`Entity ${qid} not found`);
  }
  
  // Extract relevant information
  const result = {
    id: qid,
    label: entity.labels?.en?.value || null,
    description: entity.descriptions?.en?.value || null,
    image: null,
    instanceOf: [],
    birthDate: null,
    deathDate: null,
    occupation: [],
    country: null,
  };
  
  const claims = entity.claims || {};
  
  // P18 = image
  if (claims.P18?.[0]?.mainsnak?.datavalue?.value) {
    const imageName = claims.P18[0].mainsnak.datavalue.value;
    // Construct Wikimedia Commons URL for the image
    const encodedName = encodeURIComponent(imageName.replace(/ /g, '_'));
    // Use the thumbnail API for a reasonable sized image
    result.image = `https://commons.wikimedia.org/wiki/Special:FilePath/${encodedName}?width=300`;
  }
  
  // P31 = instance of
  if (claims.P31) {
    result.instanceOf = claims.P31
      .map(c => c.mainsnak?.datavalue?.value?.id)
      .filter(Boolean);
  }
  
  // P569 = date of birth
  if (claims.P569?.[0]?.mainsnak?.datavalue?.value?.time) {
    result.birthDate = claims.P569[0].mainsnak.datavalue.value.time;
  }
  
  // P570 = date of death
  if (claims.P570?.[0]?.mainsnak?.datavalue?.value?.time) {
    result.deathDate = claims.P570[0].mainsnak.datavalue.value.time;
  }
  
  // P106 = occupation (get IDs for now, we'll resolve labels later)
  if (claims.P106) {
    result.occupation = claims.P106
      .map(c => c.mainsnak?.datavalue?.value?.id)
      .filter(Boolean)
      .slice(0, 3); // Limit to first 3 occupations
  }
  
  // P27 = country of citizenship
  if (claims.P27?.[0]?.mainsnak?.datavalue?.value?.id) {
    result.country = claims.P27[0].mainsnak.datavalue.value.id;
  }
  
  return result;
}

// Resolve QIDs to labels using Wikidata API
async function resolveLabels(qids) {
  if (qids.length === 0) return {};
  
  const url = `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${qids.join('|')}&props=labels&languages=en&format=json`;
  
  const response = await fetch(url);
  if (!response.ok) {
    console.error('Failed to resolve labels');
    return {};
  }
  
  const data = await response.json();
  const labels = {};
  
  for (const [qid, entity] of Object.entries(data.entities || {})) {
    labels[qid] = entity.labels?.en?.value || qid;
  }
  
  return labels;
}

async function main() {
  // Read claims
  const claimsData = JSON.parse(fs.readFileSync(CLAIMS_PATH, 'utf8'));
  const wikidataIds = extractWikidataIds(claimsData.claims);
  
  console.log(`Found ${wikidataIds.length} Wikidata entities to fetch:`);
  console.log(wikidataIds.join(', '));
  console.log('');
  
  if (wikidataIds.length === 0) {
    console.log('No Wikidata entities found in claims.');
    return;
  }
  
  // Fetch all entities
  const entities = {};
  const qidsToResolve = new Set();
  
  for (const qid of wikidataIds) {
    try {
      const entity = await fetchWikidataEntity(qid);
      entities[qid] = entity;
      
      // Collect QIDs that need label resolution
      entity.occupation.forEach(id => qidsToResolve.add(id));
      entity.instanceOf.forEach(id => qidsToResolve.add(id));
      if (entity.country) qidsToResolve.add(entity.country);
    } catch (error) {
      console.error(`Error fetching ${qid}:`, error.message);
    }
  }
  
  // Resolve all labels at once
  console.log('\nResolving labels for related entities...');
  const labels = await resolveLabels(Array.from(qidsToResolve));
  
  // Replace QIDs with labels in entities
  for (const entity of Object.values(entities)) {
    entity.occupation = entity.occupation.map(id => labels[id] || id);
    entity.instanceOf = entity.instanceOf.map(id => labels[id] || id);
    if (entity.country) {
      entity.country = labels[entity.country] || entity.country;
    }
  }
  
  // Write output
  const output = {
    fetchedAt: new Date().toISOString(),
    entities
  };
  
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2));
  console.log(`\nSaved ${Object.keys(entities).length} entities to ${OUTPUT_PATH}`);
  
  // Print summary
  console.log('\nSummary:');
  for (const [qid, entity] of Object.entries(entities)) {
    console.log(`  ${qid}: ${entity.label || 'No label'}`);
    console.log(`    - ${entity.description || 'No description'}`);
    console.log(`    - Image: ${entity.image ? 'Yes' : 'No'}`);
  }
}

main().catch(console.error);
