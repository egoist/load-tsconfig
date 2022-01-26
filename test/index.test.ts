import path from "path"
import { test, expect } from "vitest"
import { loadTsConfig } from "../dist"

const fixture = (name: string) => path.join(__dirname, "fixtures", name)

test("paths", () => {
  const loaded = loadTsConfig(fixture("paths"))
  expect(loaded?.data.compilerOptions?.paths).toEqual({
    "@bar/*": ["./bar/*"],
  })
  expect(loaded?.data.compilerOptions?.baseUrl).toBe(fixture("paths"))
  expect(loaded?.files.map((file) => path.basename(file))).toEqual([
    "tsconfig.base.json",
    "tsconfig.json",
  ])
})

test("extends package", () => {
  const cwd = fixture("extends-package")
  const loaded = loadTsConfig(cwd, "./tsconfig-a.json")

  expect(loaded?.files.map((file) => path.relative(cwd, file))).toEqual([
    "node_modules/tsconfig-pkg-a/tsconfig.json",
    "tsconfig-a.json",
  ])
})

test("find nearest file", () => {
  expect(loadTsConfig(fixture("find-nearest/nested/dir"))).not.toBe(null)
})
