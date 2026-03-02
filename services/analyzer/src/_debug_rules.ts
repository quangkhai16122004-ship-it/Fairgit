import { tagFile } from "./fileRules";

const samples = [
  "src/services/user.service.ts",
  "src/components/Button.tsx",
  "package-lock.json",
  "dist/bundle.js",
  "docs/guide.md",
  "src/__tests__/app.test.ts",
];

for (const s of samples) {
  console.log(s, "=>", tagFile(s));
}