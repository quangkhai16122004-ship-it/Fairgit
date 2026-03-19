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

console.log("package-lock.json =>", tagFile("package-lock.json"));
console.log("pnpm-lock.yaml =>", tagFile("pnpm-lock.yaml"));
console.log("dist/bundle.js =>", tagFile("dist/bundle.js"));
console.log("build/index.js =>", tagFile("build/index.js"));
console.log("node_modules/react/index.js =>", tagFile("node_modules/react/index.js"));
console.log("coverage/lcov.info =>", tagFile("coverage/lcov.info"));