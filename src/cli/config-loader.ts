import { AuditConfig } from '../core/types';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Supported config file names (in order of preference)
 */
const CONFIG_FILE_NAMES = [
  'attr-audit.config.ts',
  'attr-audit.config.js',
  'attr-audit.config.mjs',
  '.attr-audit.config.ts',
  '.attr-audit.config.js',
  '.attr-audit.config.mjs',
];

/**
 * Loads configuration from a config file if it exists
 * 
 * @param workingDir - Directory to search for config file (default: process.cwd())
 * @returns Configuration object or null if no config file found
 */
export async function loadConfigFile(
  workingDir: string = process.cwd()
): Promise<AuditConfig | null> {
  for (const configFileName of CONFIG_FILE_NAMES) {
    const configPath = path.join(workingDir, configFileName);
    
    if (fs.existsSync(configPath)) {
      try {
        // For TypeScript config files, we'd need ts-node or similar
        // For now, support JS/MJS files
        if (configPath.endsWith('.ts')) {
          // Try to require with ts-node if available
          try {
            require('ts-node/register');
            const config = require(configPath);
            return config.default || config;
          } catch {
            console.warn(
              `Found TypeScript config file ${configFileName} but ts-node is not available. ` +
              `Please install ts-node or use a .js config file.`
            );
            return null;
          }
        } else {
          // For .js and .mjs files
          delete require.cache[require.resolve(configPath)];
          const config = require(configPath);
          return config.default || config;
        }
      } catch (error) {
        console.error(`Error loading config file ${configFileName}:`, error);
        return null;
      }
    }
  }

  return null;
}

