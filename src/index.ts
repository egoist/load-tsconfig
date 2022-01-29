import path from "path"
import fs from "fs"
import { createRequire } from "module"
import { jsoncParse } from "./utils"

const req =
  typeof require === "function" ? require : createRequire(import.meta.url)

const findUp = (
  name: string,
  startDir: string,
  stopDir = path.parse(startDir).root,
) => {
  let dir = startDir
  while (dir !== stopDir) {
    const file = path.join(dir, name)
    if (fs.existsSync(file)) return file
    dir = path.dirname(dir)
  }
  return null
}

const resolveTsConfigFromFile = (cwd: string, filename: string) => {
  if (path.isAbsolute(filename))
    return fs.existsSync(filename) ? filename : null
  return findUp(filename, cwd)
}

const resolveTsConfigFromExtends = (cwd: string, name: string) => {
  if (path.isAbsolute(name)) return fs.existsSync(name) ? name : null
  if (name.startsWith(".")) return findUp(name, cwd)
  const id = req.resolve(name, { paths: [cwd] })
  return id
}

export type Loaded = {
  /** Path to the nearest config file */
  path: string
  /** Merged config data */
  data: any
  /** Discovered config files */
  files: string[]
}

const loadTsConfigInternal = (
  dir = process.cwd(),
  name = "tsconfig.json",
  files: string[] = [],
  isExtends = false,
): Loaded | null => {
  dir = path.resolve(dir)
  const id = isExtends
    ? resolveTsConfigFromExtends(dir, name)
    : resolveTsConfigFromFile(dir, name)
  if (!id) return null

  const data = jsoncParse(fs.readFileSync(id, "utf-8"))
  files.unshift(id)
  const configDir = path.dirname(id)
  if (data.compilerOptions?.baseUrl) {
    data.compilerOptions.baseUrl = path.join(
      configDir,
      data.compilerOptions.baseUrl,
    )
  }
  if (data.extends) {
    const parentConfig = loadTsConfigInternal(
      configDir,
      data.extends,
      files,
      true,
    )
    if (parentConfig) {
      Object.assign(data, {
        ...parentConfig.data,
        ...data,
        compilerOptions: {
          ...parentConfig.data.compilerOptions,
          ...data.compilerOptions,
        },
      })
    }
  }
  delete data.extends
  return { path: id, data, files }
}

export const loadTsConfig = (dir: string, name?: string) =>
  loadTsConfigInternal(dir, name)
