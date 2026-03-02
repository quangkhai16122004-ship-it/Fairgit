// Những thư mục/file "quan trọng" → impact cao
export const CORE_PREFIXES: string[] = [
  // Generic (hay gặp)
  "src/",
  "packages/",
  "apps/",
  "lib/",
  "server/",
  "client/",
  "backend/",
  "frontend/",
  "compiler/",

  // React/Node style
  "src/controllers/",
  "src/services/",
  "src/routes/",
  "src/middlewares/",
  "src/modules/",
  "src/api/",
  "src/pages/",
  "src/components/",
  "src/hooks/",
  "src/store/",
];

// Những thứ hay tạo "đóng góp ảo" → clean thấp hoặc bỏ qua
export const NOISE_EXACT: string[] = [
  "package-lock.json",
  "yarn.lock",
  "pnpm-lock.yaml",
];

export const NOISE_PREFIXES: string[] = [
  "dist/",
  "build/",
  ".next/",
  "coverage/",
  "node_modules/",

  // file build artifacts hay gặp
  "out/",
];

// File docs/test vẫn có giá trị nhưng không nên ngang core (để bước 10/11)
export const TEST_PREFIXES: string[] = ["__tests__/", "test/", "tests/"];
export const DOC_PREFIXES: string[] = ["docs/"];
export const DOC_EXACT: string[] = ["README.md", "readme.md"];