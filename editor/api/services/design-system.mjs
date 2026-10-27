import fs from 'node:fs';
import path from 'node:path';
import { DESIGN_SYSTEM_ICONS_DIR } from '../../config.mjs';

export async function listDesignSystemIcons() {
  if (!fs.existsSync(DESIGN_SYSTEM_ICONS_DIR)) {
    return [];
  }

  const icons = [];
  const entries = fs.readdirSync(DESIGN_SYSTEM_ICONS_DIR, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isDirectory()) {
      const category = entry.name;
      const categoryPath = path.join(DESIGN_SYSTEM_ICONS_DIR, category);
      const files = fs.readdirSync(categoryPath);

      for (const file of files) {
        if (file.endsWith('.svg')) {
          const filePath = path.join(categoryPath, file);
          const svgContent = fs.readFileSync(filePath, 'utf-8');
          icons.push({
            category,
            filename: file,
            svgContent
          });
        }
      }
    }
  }

  return icons;
}
