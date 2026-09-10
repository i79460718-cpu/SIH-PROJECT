import * as fs from 'fs';

let filePath = 'artifacts/api-server/src/routes/ai.ts';
let code = fs.readFileSync(filePath, 'utf8');

code = code.replace(/from "\.\.\/domain\/issueRepository\.ts";/, 'from "../domain/issueRepository";');

fs.writeFileSync(filePath, code);
