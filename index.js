const fs = require('fs').promises;
const path = require('path');
if (process.argv.length < 3) throw new Error('No paths provided')
const paths = process.argv.slice(2);


const MaxReport = 20;
const PathStat = new Map()
const NodeModules = 'node_modules'
const HumanSize = ['B', 'KB', 'MB', 'GB']

function toHumanSize(fileSize) {
    for (let i = 0; i < HumanSize.length; i++) {
        if (fileSize < 1000) return `${fileSize.toFixed(2)} ${HumanSize[i]}`;
        fileSize = fileSize / 1024
    }
}

function getModuleName(dTsPath) {
    const nodeModulesIndex = dTsPath.indexOf(NodeModules);
    if (nodeModulesIndex == -1) return null;
    const modulePath = dTsPath.slice(nodeModulesIndex + NodeModules.length + 1)
    const modules = modulePath.split('/')
    if (modulePath.startsWith('@')) {
        return modules[0] + '/' + modules[1];
    }
    return modules[0]
}

function getImportMap(buildInfo) {
    const refMap = buildInfo.program.referencedMap;

    const importMap = new Map()
    for (const [key, value] of Object.entries(refMap)) {
        const modName = getModuleName(key)
        let childModules = importMap.get(modName)
        if (childModules == null) {
            childModules = { refs: new Map(), name: modName }
        }
        for (const child of value) {
            const childModule = getModuleName(child);
            if (childModule == modName) continue;
            let existingRef = childModules.refs.get(childModule)
            if (existingRef == null) {
                existingRef = new Set();
                childModules.refs.set(childModule, existingRef)
            }
            existingRef.add(key)
        }
        importMap.set(modName, childModules)
    }
    return importMap
}

function findImportPath(importMap, toFind, current) {
    if (current == null) current = importMap.get(null);
    for (const [modName, modPath] of current.refs) {
        if (modName == toFind) return modPath;
    }

    return null;
}

async function processDts(dTsPath) {
    const moduleName = getModuleName(dTsPath);
    let existingSize = PathStat.get(dTsPath);
    if (existingSize == null) {
        const stat = await fs.stat(dTsPath);
        existingSize = stat.size
    }
    return { name: moduleName || '_self_', size: existingSize }
}

async function processBuildInfo(buildPath) {
    console.log('Processing', buildPath)
    const fileData = await fs.readFile(buildPath)
    const buildInfo = JSON.parse(fileData);
    if (buildInfo.version == null) throw new Error('Invalid build version');

    const buildDir = path.dirname(buildPath)
    const moduleStats = new Map()

    for (const dTsRelPath of buildInfo.program.semanticDiagnosticsPerFile) {
        const dTsPath = path.join(buildDir, dTsRelPath)
        const stat = await processDts(dTsPath)
        let existing = moduleStats.get(stat.name)
        if (existing == null) {
            existing = { name: stat.name, count: 0, size: 0 }
            moduleStats.set(stat.name, existing)
        }
        existing.count++;
        existing.size += stat.size

    }
    const importMap = getImportMap(buildInfo)

    const importedModules = Array.from(moduleStats.values()).sort((a, b) => b.size - a.size);
    let maxReport = Math.min(MaxReport, importedModules.length)
    if (importedModules.length > 0) {
        console.log('\nLargest Imported Modules: ')
        for (let i = 0; i < maxReport; i++) {
            const mod = importedModules[i]
            console.log(toHumanSize(mod.size).padEnd(10, ' '), `${mod.count}`.padEnd(5, ' '), mod.name)
        }

        console.log('\nImport Paths:')
        for (let i = 0; i < maxReport; i++) {
            const mod = importedModules[i]

            const importPaths = findImportPath(importMap, mod.name);
            if (importPaths == null) {
                continue;
            }
            for (const importPath of importPaths) {
                console.log('\t', importPath, '=>', mod.name)
            }
        }
    }
}


async function main() {
    for (const path of paths) {
        if (path.endsWith('tsconfig.tsbuildinfo')) {
            await processBuildInfo(path)
        }
    }
}

main().catch(e => console.error(e));