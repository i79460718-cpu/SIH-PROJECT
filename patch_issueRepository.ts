import * as fs from 'fs';

const filePath = 'artifacts/api-server/src/domain/issueRepository.ts';
let code = fs.readFileSync(filePath, 'utf8');

// Add imports
code = code.replace(
  'import { calculatePriorityScore } from "../services/priorityScoring.ts";',
  'import { calculatePriorityScore } from "../services/priorityScoring.ts";\nimport { normalizeComplaint } from "../services/languageNormalization.ts";'
);

// Update analyseReport
code = code.replace(
  '    // 2. Department Routing & Language\n    const routing = routeIssue(description, category, location);',
  `    // 2. Language Detection & Normalization\n    const normalization = normalizeComplaint(description);\n\n    // 3. Department Routing\n    const routing = routeIssue(normalization.normalizedDescription, category, location);`
);

// We also need to map the output properly in analyseReport return
code = code.replace(
  /detectedLanguage: routing\.detectedLanguage,\s+normalizedIntent: routing\.normalizedIntent,/g,
  `detectedLanguage: normalization.originalLanguage,\n      languageConfidence: normalization.confidence,\n      normalizedDescription: normalization.normalizedDescription,\n      normalizedIntent: normalization.normalizedIntent,`
);

// Also need to pass normalization to findDuplicateMatches!
code = code.replace(
  `const duplicateMatches = findDuplicateMatches(description, location, this.issues, 60);`,
  `const duplicateMatches = findDuplicateMatches(normalization.normalizedDescription, location, this.issues, 60);`
);

// And we need to add these fields to Issue creation:
code = code.replace(
  `description: input.description,`,
  `description: input.description,\n      originalLanguage: analysis.detectedLanguage,\n      normalizedDescription: analysis.normalizedDescription,\n      detectedIntent: analysis.normalizedIntent,`
);

fs.writeFileSync(filePath, code);
