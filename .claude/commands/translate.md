# Translate i18n Messages

Translate untranslated language messages in the Angular i18n XLF files.

## Arguments

- `$ARGUMENTS`: Target language code (e.g., `et` for Estonian). Defaults to `et` if not provided.

## Instructions

1. **Extract new translations from source code**
   ```bash
   pnpm --filter frontend extract-i18n
   ```

2. **Extract TODOs for untranslated items**
   ```bash
   pnpm --filter frontend extract-untranslated
   ```

3. **Read the translation examples file** to understand existing translation patterns and style:
   - Path: `./packages/frontend/src/i18n/{language}-translations.json`
   - This JSON file contains source-to-target translation pairs that demonstrate the translation style

4. **Read and process the XLF file**
   - Path: `packages/frontend/src/i18n/{language}.xlf`
   - Find all items that need translation

5. **Handle two types of TODOs**

   **Type 1: New translations**
   - Identified by `<target>TODO: add {Language} translation</target>`
   - Example:
     ```xml
     <source>Create new group</source>
     <target>TODO: add Estonian translation</target>
     ```
   - Action: Replace the TODO target with the proper translation

   **Type 2: Fuzzy translations (source changed)**
   - Identified by `<note priority="1" from="todo">TODO: fuzzy - source changed from: "..."</note>`
   - The existing `<target>` may be outdated because the `<source>` changed
   - Example:
     ```xml
     <source>Account with email <x id="PH" equiv-text="error.customData?.email"/> already exists.</source>
     <target>Konto emailiga <x id="PH" equiv-text="error.email"/> juba eksisteerib.</target>
     <note priority="1" from="todo">TODO: fuzzy - source changed from: "Account with email &lt;x id=&quot;PH&quot; equiv-text=&quot;error.email&quot;/&gt; already exists."</note>
     ```
   - Action: Review the source change (compare old vs new in the note), update the target if needed, then remove the `<note>` element

6. **Translation guidelines**
   - Preserve all XML elements like `<x id="..."/>` exactly as they appear in the source
   - Match the translation style from the examples JSON file
   - Keep translations natural and contextually appropriate
   - For ICU message format expressions, translate only the text content, not the syntax

7. **After translating each item**
   - Remove the TODO placeholder or fuzzy note
   - This makes it clear which items have been translated

8. **Summary**
   - Report how many items were translated
   - List any items that were skipped or need human review
