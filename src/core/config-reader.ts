import * as fs from 'fs';
import * as path from 'path';

/**
 * Reads Playwright configuration file and extracts custom attribute name
 * Supports both JavaScript and TypeScript config files
 */
export function readPlaywrightConfig(): { attributeName?: string } | null {
  const possibleConfigPaths = [
    'playwright.config.js',
    'playwright.config.ts',
    'playwright.config.mjs',
    'playwright.config.cjs',
  ];

  for (const configPath of possibleConfigPaths) {
    const fullPath = path.resolve(process.cwd(), configPath);
    
    if (fs.existsSync(fullPath)) {
      try {
        // Try to read and parse the config file
        const configContent = fs.readFileSync(fullPath, 'utf-8');
        
        // Look for playwrightAttrAudit or similar patterns
        // Pattern 1: playwrightAttrAudit: { attributeName: '...' }
        // Pattern 2: use: { playwrightAttrAudit: { attributeName: '...' } }
        const attrAuditMatch = configContent.match(
          /playwrightAttrAudit\s*:\s*\{[^}]*attributeName\s*:\s*['"`]([^'"`]+)['"`]/s
        );
        
        if (attrAuditMatch) {
          return { attributeName: attrAuditMatch[1] };
        }

        // Try to find in use block
        const useBlockMatch = configContent.match(
          /use\s*:\s*\{[^}]*playwrightAttrAudit\s*:\s*\{[^}]*attributeName\s*:\s*['"`]([^'"`]+)['"`]/s
        );
        
        if (useBlockMatch) {
          return { attributeName: useBlockMatch[1] };
        }

        // Try to evaluate the config file (for JS files only)
        if (configPath.endsWith('.js') || configPath.endsWith('.mjs') || configPath.endsWith('.cjs')) {
          try {
            // Clear require cache to get fresh config
            delete require.cache[require.resolve(fullPath)];
            const config = require(fullPath);
            
            // Check various export formats
            const configObj = config.default || config;
            
            if (configObj.playwrightAttrAudit?.attributeName) {
              return { attributeName: configObj.playwrightAttrAudit.attributeName };
            }
            
            if (configObj.use?.playwrightAttrAudit?.attributeName) {
              return { attributeName: configObj.use.playwrightAttrAudit.attributeName };
            }
          } catch (evalError) {
            // Config file might use ES modules or have other issues
            // Continue to next method
          }
        }
      } catch (error) {
        // File exists but couldn't read it, continue to next path
        continue;
      }
    }
  }

  return null;
}

/**
 * Gets the attribute name from Playwright config, test options, or defaults to regex pattern
 * Priority: Playwright config > Test options > Default regex pattern
 */
export function getAttributeName(options?: { attributeName?: string }): string | RegExp {
  // Priority 1: Check Playwright config file
  const configValue = readPlaywrightConfig();
  if (configValue?.attributeName) {
    return configValue.attributeName;
  }

  // Priority 2: Check test options
  if (options?.attributeName) {
    return options.attributeName;
  }

  // Priority 3: Default to regex pattern matching any data-* attribute
  return /^data-/i; // Matches any attribute starting with "data-" (case insensitive)
}

