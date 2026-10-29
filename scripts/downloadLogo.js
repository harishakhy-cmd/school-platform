const https = require('https');
const fs = require('fs');
const path = require('path');

const fileId = '1x5qmJDU3jIHXgt0OPBxnFfSJT7NfxW25';
const downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;

// Create images directory if it doesn't exist
const imagesDir = path.join(__dirname, '..', 'public', 'images');
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}

const filePath = path.join(imagesDir, 'logo.png');

console.log('Downloading logo from Google Drive...');

const file = fs.createWriteStream(filePath);

https.get(downloadUrl, { followRedirects: true, maxRedirects: 5 }, (response) => {
  // Handle redirects
  if (response.statusCode === 301 || response.statusCode === 302) {
    const redirectUrl = response.headers.location;
    console.log('Following redirect to:', redirectUrl);
    https.get(redirectUrl, (redirectResponse) => {
      redirectResponse.pipe(file);
      redirectResponse.on('end', () => {
        console.log('Logo downloaded successfully to:', filePath);
        console.log('');
        console.log('The logo is now available at: /images/logo.png');
        process.exit(0);
      });
    }).on('error', (err) => {
      console.error('Error following redirect:', err.message);
      process.exit(1);
    });
    return;
  }

  response.pipe(file);
  
  response.on('end', () => {
    console.log('Logo downloaded successfully to:', filePath);
    console.log('');
    console.log('The logo is now available at: /images/logo.png');
    process.exit(0);
  });
}).on('error', (err) => {
  console.error('Error downloading logo:', err.message);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
  process.exit(1);
});