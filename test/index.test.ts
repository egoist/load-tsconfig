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
  const loaded = loadTsConfig(cwd, "tsconfig-a.json")

  expect(loaded?.files.map((file) => path.relative(cwd, file))).toEqual([
    "node_modules/tsconfig-pkg-a/tsconfig.json",
    "tsconfig-a.json",
  ])
})

test("extends package with explicit tsconfig", () => {
  const loaded = loadTsConfig(fixture("extends-package-explicit"))
  expect(loaded?.data.files).toEqual(["explicit"])
})

test("extends package subpath file without extension", () => {
  const loaded = loadTsConfig(
    fixture("extends-package-explicit"),
    "no-extn.json",
  )
  expect(loaded?.data.files).toEqual(["other-file"])
})

test("extends package subpath file with extension", () => {
  const loaded = loadTsConfig(
    fixture("extends-package-explicit"),
    "subpath.json",
  )
  expect(loaded?.data.files).toEqual(["other-file"])
})

test("extends package with implicit tsconfig", () => {
  const loaded = loadTsConfig(fixture("extends-package-implicit"))
  expect(loaded?.data.files).toEqual(["implicit"])
})

test("extends package with implicit subpath directory", () => {
  const loaded = loadTsConfig(
    fixture("extends-package-implicit"),
    "no-extn.json",
  )
  expect(loaded?.data.files).toEqual(["other-directory"])
})

test("extends package with implicit file subpath", () => {
  const loaded = loadTsConfig(
    fixture("extends-package-implicit"),
    "subpath.json",
  )
  expect(loaded?.data.files).toEqual(["other-directory-config"])
})

test("find nearest file", () => {
  expect(loadTsConfig(fixture("find-nearest/nested/dir"))).not.toBe(null)
})
