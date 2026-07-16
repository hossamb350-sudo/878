import fs from 'fs';
import path from 'path';

async function syncResources() {
  const resourcesDir = 'Resources';
  const publicDir = 'public';

  if (!fs.existsSync(resourcesDir)) {
    console.log('Resources directory not found.');
    return;
  }

  const filesToSync = [
    'splash_first.png',
    'splash_subsequent.png',
    'logo.png',
    'custom_footer.png',
    'copyright.png'
  ];

  console.log('Syncing resources from Resources/ to public/...');

  for (const file of filesToSync) {
    const srcPath = path.join(resourcesDir, file);
    const destPath = path.join(publicDir, file);

    if (fs.existsSync(srcPath)) {
      fs.copyFileSync(srcPath, destPath);
      console.log(`Copied ${file} to public/`);

      // If it's a splash image, also generate the webp version if sharp is available
      if (file.startsWith('splash_') && file.endsWith('.png')) {
        const webpDestPath = destPath.replace('.png', '.webp');
        try {
          const sharp = (await import('sharp')).default;
          await sharp(srcPath)
            .webp({ quality: 85 })
            .toFile(webpDestPath);
          console.log(`Generated webp for ${file} at ${webpDestPath}`);
        } catch (err: any) {
          console.warn(`Could not generate webp for ${file} using sharp, using png fallback:`, err.message);
        }
      }
    } else {
      console.log(`File ${file} does not exist in Resources/`);
    }
  }

  console.log('Sync resources completed!');
}

syncResources().catch(console.error);
