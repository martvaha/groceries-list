import { XMLParser, XMLBuilder } from 'fast-xml-parser';
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const i18nDir = join(__dirname, '../../packages/frontend/src/i18n');

const MESSAGES_FILE = join(i18nDir, 'messages.xlf');
const ET_FILE = join(i18nDir, 'et.xlf');
const JSON_OUTPUT_FILE = join(i18nDir, 'et-translations.json');

const parserOptions = {
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  textNodeName: '#text',
  preserveOrder: true,
  trimValues: false,
  parseTagValue: false,
  parseAttributeValue: false,
};

const builderOptions = {
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  textNodeName: '#text',
  preserveOrder: true,
  format: true,
  indentBy: '  ',
  suppressEmptyNode: false,
  suppressBooleanAttributes: false,
};

interface TransUnit {
  source: string;
  sourceXml: string;
  target?: string;
  targetXml?: string;
  contexts: unknown[];
  notes: unknown[];
}

function extractTransUnits(parsed: unknown[]): Map<string, TransUnit> {
  const units = new Map<string, TransUnit>();

  function traverse(node: unknown): void {
    if (!node || typeof node !== 'object') return;

    if (Array.isArray(node)) {
      for (const item of node) {
        traverse(item);
      }
      return;
    }

    const obj = node as Record<string, unknown>;

    if ('trans-unit' in obj) {
      const transUnitContent = obj['trans-unit'] as unknown[];
      const attrs = obj[':@'] as Record<string, unknown> | undefined;
      const id = attrs?.['@_id'] as string;

      if (id) {
        let source = '';
        let sourceXml = '';
        let target: string | undefined;
        const contexts: unknown[] = [];
        const notes: unknown[] = [];

        let targetXml: string | undefined;

        for (const child of transUnitContent) {
          if (typeof child === 'object' && child !== null) {
            const childObj = child as Record<string, unknown>;
            if ('source' in childObj) {
              source = extractTextContent(childObj['source'] as unknown[]);
              sourceXml = buildSourceXml(childObj['source'] as unknown[]);
            } else if ('target' in childObj) {
              target = extractTextContent(childObj['target'] as unknown[]);
              targetXml = buildSourceXml(childObj['target'] as unknown[]);
            } else if ('context-group' in childObj) {
              contexts.push(child);
            } else if ('note' in childObj) {
              notes.push(child);
            }
          }
        }

        units.set(id, { source, sourceXml, target, targetXml, contexts, notes });
      }
    }

    for (const key of Object.keys(obj)) {
      if (key !== ':@') {
        traverse(obj[key]);
      }
    }
  }

  traverse(parsed);
  return units;
}

function extractTextContent(nodes: unknown[]): string {
  if (!Array.isArray(nodes)) return '';
  let result = '';
  for (const node of nodes) {
    if (typeof node === 'object' && node !== null) {
      const obj = node as Record<string, unknown>;
      if ('#text' in obj) {
        result += obj['#text'];
      } else if ('x' in obj) {
        // Interpolation placeholder
        const attrs = obj[':@'] as Record<string, unknown> | undefined;
        const id = attrs?.['@_id'] || '';
        const equiv = attrs?.['@_equiv-text'] || '';
        result += `<x id="${id}" equiv-text="${equiv}"/>`;
      }
    }
  }
  return result;
}

function buildSourceXml(nodes: unknown[]): string {
  if (!Array.isArray(nodes)) return '';
  let result = '';
  for (const node of nodes) {
    if (typeof node === 'object' && node !== null) {
      const obj = node as Record<string, unknown>;
      if ('#text' in obj) {
        result += escapeXml(String(obj['#text']));
      } else if ('x' in obj) {
        const attrs = obj[':@'] as Record<string, unknown> | undefined;
        const id = attrs?.['@_id'] || '';
        const equiv = attrs?.['@_equiv-text'] || '';
        result += `<x id="${id}" equiv-text="${equiv}"/>`;
      }
    }
  }
  return result;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildChildrenXml(children: unknown[], indent: string): string {
  const builder = new XMLBuilder(builderOptions);
  let result = '';

  for (const child of children) {
    const xml = builder.build([child]) as string;
    const lines = xml.split('\n').filter((l) => l.trim());
    result += lines.map((l) => indent + l).join('\n') + '\n';
  }

  return result;
}

function findPreviousIdForKey(
  key: string,
  units: Map<string, TransUnit>,
  currentId: string
): string {
  for (const [id, unit] of units) {
    if (id === currentId) break;
    if (unit.source.trim() === key) {
      return id;
    }
  }
  return 'unknown';
}

function main(): void {
  console.log('Syncing et.xlf with messages.xlf...\n');
  console.log('Reading source files...');

  const messagesXml = readFileSync(MESSAGES_FILE, 'utf-8');
  const etXml = readFileSync(ET_FILE, 'utf-8');

  const parser = new XMLParser(parserOptions);

  console.log('Parsing messages.xlf...');
  const messagesParsed = parser.parse(messagesXml) as unknown[];

  console.log('Parsing et.xlf...');
  const etParsed = parser.parse(etXml) as unknown[];

  // Extract translations from et.xlf
  const etUnits = extractTransUnits(etParsed);
  console.log(`Found ${etUnits.size} translated entries in et.xlf`);

  // Extract all units from messages.xlf and rebuild with translations
  const messagesUnits = extractTransUnits(messagesParsed);
  console.log(`Found ${messagesUnits.size} entries in messages.xlf`);

  let untranslatedCount = 0;
  let fuzzyCount = 0;
  const transUnitXmls: string[] = [];
  const jsonTranslations: Record<string, string | Record<string, string>> = {};

  // Build trans-units in the order they appear in messages.xlf
  for (const [id, msgUnit] of messagesUnits) {
    const etUnit = etUnits.get(id);

    let targetXml: string;
    let todoNote: string | null = null;
    let status: 'translated' | 'fuzzy' | 'untranslated' = 'untranslated';

    // Check if target is a legacy TODO marker (not an actual translation)
    const isLegacyTodo = etUnit?.target?.startsWith('TODO:');

    if (etUnit?.target && !isLegacyTodo) {
      // Check if source has changed (fuzzy match)
      if (etUnit.source !== msgUnit.source) {
        // Source changed - preserve translation but add TODO note
        targetXml = etUnit.targetXml || escapeXml(etUnit.target);
        todoNote = `TODO: fuzzy - source changed from: "${etUnit.source.trim()}"`;
        status = 'fuzzy';
        fuzzyCount++;
      } else {
        // Source matches - use existing translation
        targetXml = etUnit.targetXml || escapeXml(etUnit.target);
        status = 'translated';
      }
    } else {
      targetXml = 'TODO: add Estonian translation';
      status = 'untranslated';
      untranslatedCount++;
    }

    // Add to JSON using source text as key (trimmed) - only for translated entries
    if (status === 'translated') {
      const jsonKey = msgUnit.source.trim();
      const jsonValue = etUnit!.target!.trim();

      if (jsonKey in jsonTranslations) {
        const existing = jsonTranslations[jsonKey];
        if (typeof existing === 'string') {
          // Convert to dict with ref_id keys - find the previous id for this key
          const prevId = findPreviousIdForKey(jsonKey, messagesUnits, id);
          jsonTranslations[jsonKey] = {
            [prevId]: existing,
            [id]: jsonValue,
          };
        } else {
          // Already a dict, add new entry
          existing[id] = jsonValue;
        }
      } else {
        jsonTranslations[jsonKey] = jsonValue;
      }
    }

    // Get existing TODO notes from et.xlf (filter out description/meaning notes)
    const existingTodoNotes = (etUnit?.notes || []).filter((note) => {
      if (typeof note === 'object' && note !== null) {
        const noteObj = note as Record<string, unknown>;
        const attrs = noteObj[':@'] as Record<string, unknown> | undefined;
        return attrs?.['@_from'] === 'todo';
      }
      return false;
    });
    const hasExistingTodo = existingTodoNotes.length > 0;

    // Build the trans-unit XML string
    let transUnitXml = `      <trans-unit id="${id}" datatype="html">\n`;
    transUnitXml += `        <source>${msgUnit.sourceXml}</source>\n`;
    transUnitXml += `        <target>${targetXml}</target>\n`;

    // Add TODO note if needed and doesn't already exist
    if (todoNote && !hasExistingTodo) {
      transUnitXml += `        <note priority="1" from="todo">${escapeXml(todoNote)}</note>\n`;
    }

    // Add existing TODO notes from et.xlf
    if (existingTodoNotes.length > 0) {
      transUnitXml += buildChildrenXml(existingTodoNotes, '        ');
    }

    // Add description/meaning notes from messages.xlf (source of truth)
    if (msgUnit.notes.length > 0) {
      transUnitXml += buildChildrenXml(msgUnit.notes, '        ');
    }

    // Add context groups
    if (msgUnit.contexts.length > 0) {
      transUnitXml += buildChildrenXml(msgUnit.contexts, '        ');
    }

    transUnitXml += `      </trans-unit>`;
    transUnitXmls.push(transUnitXml);
  }

  console.log(`\nUntranslated entries: ${untranslatedCount}`);
  console.log(`Fuzzy entries (source changed): ${fuzzyCount}`);

  // Build the complete XLF output
  const outputXml = `<?xml version="1.0" encoding="UTF-8" ?>
<xliff version="1.2" xmlns="urn:oasis:names:tc:xliff:document:1.2">
  <file source-language="en" target-language="et" datatype="plaintext" original="ng2.template">
    <body>
${transUnitXmls.join('\n')}
    </body>
  </file>
</xliff>
`;

  writeFileSync(ET_FILE, outputXml, 'utf-8');
  console.log(`Updated: ${ET_FILE}`);

  // Write JSON translations file
  writeFileSync(JSON_OUTPUT_FILE, JSON.stringify(jsonTranslations, null, 2), 'utf-8');
  console.log(`JSON output written to: ${JSON_OUTPUT_FILE}`);
}

main();
