import { execSync } from 'child_process';
try {
  const result = execSync('keytool -genkey -v -keystore android/app/debug.keystore -storepass android -alias androiddebugkey -keypass android -keyalg RSA -keysize 2048 -validity 10000 -dname "C=US, O=Android, CN=Android Debug"');
  console.log('Keystore generated successfully');
  const sha = execSync('keytool -list -v -keystore android/app/debug.keystore -storepass android -alias androiddebugkey | grep SHA1:');
  console.log(sha.toString());
} catch (e) {
  console.error(e.message);
}
