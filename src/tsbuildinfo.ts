export interface TsBuildInfo {
  program: {
    fileInfos: Record<string, { version: string; signature: string; affectsGlobalScope: boolean }>;
    options: Record<string, unknown>;
    referencedMap: Record<string, string[]>;
    exportedModulesMap: Record<string, string[]>;
    semanticDiagnosticsPerFile: string[];
  };
  version: string;
}
