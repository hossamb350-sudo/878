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
    'logo2.png',
    'logo3.png',
    'custom_footer.png',
    'copyright.png'
  ];

  console.log('Syncing resources from Resources/ to public/Resources/...');

  // Ensure target directory exists
  const capResourcesDir = path.join(publicDir, 'Resources');
  
  if (!fs.existsSync(capResourcesDir)) {
    fs.mkdirSync(capResourcesDir, { recursive: true });
  }

  for (const file of filesToSync) {
    const srcPath = path.join(resourcesDir, file);
    
    if (fs.existsSync(srcPath)) {
      // Copy to public root
      const destPath = path.join(publicDir, file);
      fs.copyFileSync(srcPath, destPath);
      console.log(`Copied ${file} to public/`);

      // Copy to public/Resources
      const capDestPath = path.join(capResourcesDir, file);
      fs.copyFileSync(srcPath, capDestPath);
      console.log(`Copied ${file} to public/Resources/`);

      // If it's a splash image, also generate the webp version if sharp is available
      if (file.startsWith('splash_') && file.endsWith('.png')) {
        const webpDestPath = destPath.replace('.png', '.webp');
        const capWebpDestPath = capDestPath.replace('.png', '.webp');
        
        try {
          const sharp = (await import('sharp')).default;
          
          await sharp(srcPath).webp({ quality: 85 }).toFile(webpDestPath);
          await sharp(srcPath).webp({ quality: 85 }).toFile(capWebpDestPath);
          
          console.log(`Generated webp versions for ${file}`);
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
