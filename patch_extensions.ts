import * as fs from 'fs';

let filePath = 'artifacts/api-server/src/domain/issueRepository.ts';
let code = fs.readFileSync(filePath, 'utf8');
code = code.replace(/from "\.\.\/services\/languageNormalization\.ts";/, 'from "../services/languageNormalization";');
code = code.replace(/from "\.\.\/services\/spamDetection\.ts";/, 'from "../services/spamDetection";');
code = code.replace(/from "\.\.\/services\/duplicateDetection\.ts";/, 'from "../services/duplicateDetection";');
code = code.replace(/from "\.\.\/services\/departmentRouting\.ts";/, 'from "../services/departmentRouting";');
code = code.replace(/from "\.\.\/services\/priorityScoring\.ts";/, 'from "../services/priorityScoring";');
fs.writeFileSync(filePath, code);

filePath = 'artifacts/api-server/src/services/languageNormalization.ts';
code = fs.readFileSync(filePath, 'utf8');
code = code.replace(/from "\.\/languageDetection\.ts";/, 'from "./languageDetection";');
fs.writeFileSync(filePath, code);
