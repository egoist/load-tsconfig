import path from "path"
import fs from "fs"
import { createRequire } from "module"
import { jsoncParse } from "./utils"

// Injected by TSUP
declare const TSUP_FORMAT: "esm" | "cjs"

const req = TSUP_FORMAT === "esm" ? createRequire(import.meta.url) : require

const findUp = (
  name: string,
  startDir: string,
  stopDir = path.parse(startDir).root,
) => {
  let dir = startDir
  while (dir !== stopDir) {
    const file = path.join(dir, name)
    if (fs.existsSync(file)) return file
    if (!file.endsWith(".json")) {
      const fileWithExt = file + ".json"
      if (fs.existsSync(fileWithExt)) return fileWithExt
    }
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
  try {
    const id = req.resolve(name, { paths: [cwd] })
    return id
  }
  catch {
    const id = req.resolve(name+'/tsconfig.json', { paths: [cwd] })
    return id
  }
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
  isExtends = false,
): Loaded | null => {
  dir = path.resolve(dir)
  const id = isExtends
    ? resolveTsConfigFromExtends(dir, name)
    : resolveTsConfigFromFile(dir, name)
  if (!id) return null

  const data: {
    extends?: string | string[]
    [k: string]: any
  } = jsoncParse(fs.readFileSync(id, "utf-8"))

  const configDir = path.dirname(id)
  if (data.compilerOptions?.baseUrl) {
    data.compilerOptions.baseUrl = path.join(
      configDir,
      data.compilerOptions.baseUrl,
    )
  }

  let extendsFiles: string[] = []

  if (data.extends) {
    const extendsList = Array.isArray(data.extends)
      ? data.extends
      : [data.extends]
    const extendsData: Record<string, any> = {}
    for (const name of extendsList) {
      const parentConfig = loadTsConfigInternal(configDir, name, true)
      if (parentConfig) {
        Object.assign(extendsData, {
          ...parentConfig?.data,
          compilerOptions: {
            ...extendsData.compilerOptions,
            ...parentConfig?.data?.compilerOptions,
          },
        })
        extendsFiles.push(...parentConfig.files)
      }
    }
    Object.assign(data, {
      ...extendsData,
      ...data,
      compilerOptions: {
        ...extendsData.compilerOptions,
        ...data.compilerOptions,
      },
    })
  }
  delete data.extends
  return { path: id, data, files: [...extendsFiles, id] }
}

export const loadTsConfig = (dir: string, name?: string) =>
  loadTsConfigInternal(dir, name)
