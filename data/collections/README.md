# Course vocabulary collections

Saved for later study on 2026-11-12 from the public Dutch term lists linked to Inburgering Online's A2 writing vocabulary material:

| Collection | Source cards | Distinct main Dutch entries | Source |
| --- | ---: | ---: | --- |
| Easy | 493 | 485 | https://quizlet.com/nl/518910606/1-easy-flash-cards/ |
| Medium | 255 | 251 | https://quizlet.com/nl/518909415/2-medium-flash-cards/ |
| Difficult | 364 | 362 | https://quizlet.com/nl/518921786/3-difficult-flash-cards/ |

The JSON files preserve all 1,112 source cards, their order and repeated terms. `sourceTerm` preserves the original Dutch text; `sourceIndex` is one-based. Articles and alternative Dutch forms are stored in `nlAliases`, accepted when answering in Dutch. Across the three collections there are 1,057 distinct main Dutch entries; synonyms are not counted as extra entries.

English and Brazilian Portuguese equivalents were added independently or reused from the app's existing vocabulary. They are study aids, not a transcription of the course's hidden English definitions or an official exam word list. Words can have further meanings in context.

These are collections, not dated study days. Adding them does not mark words as studied or change saved selections, attempts or error counts. Training merges repeated main Dutch entries and accepts their combined equivalents. Existing daily lists remain separate.

The standalone app embeds the same JSON records in `bundledDays` so it can work without fetching additional files. Keep the embedded records and these files in sync. Run `node tests/check-library.cjs` after changes.
