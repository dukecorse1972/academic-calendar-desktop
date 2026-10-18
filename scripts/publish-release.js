const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function getGitHubToken() {
  try {
    const creds = execSync('git credential fill', {
      input: 'protocol=https\nhost=github.com\n',
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore']
    });
    const match = creds.match(/password=(.+)/);
    if (match && match[1]) {
      return match[1].trim();
    }
  } catch (err) {
    console.error('Error fetching git credentials:', err.message);
  }
  return null;
}

async function main() {
  const token = getGitHubToken();
  if (!token) {
    console.error('Could not retrieve GitHub token from Git Credential Manager.');
    process.exit(1);
  }

  const pkgPath = path.join(__dirname, '..', 'package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  const version = pkg.version;
  const tag = `v${version}`;
  const owner = 'dukecorse1972';
  const repo = 'cursa';

  console.log(`Checking existing releases for ${owner}/${repo} at tag ${tag}...`);
  const headers = {
    'Accept': 'application/vnd.github+json',
    'Authorization': `Bearer ${token}`,
    'User-Agent': 'Node-Release-Uploader',
    'X-GitHub-Api-Version': '2022-11-28'
  };

  const releaseNotesPath = path.join(__dirname, '..', `RELEASE_NOTES_v${version}.md`);
  let releaseBody = '';
  if (fs.existsSync(releaseNotesPath)) {
    releaseBody = fs.readFileSync(releaseNotesPath, 'utf8');
  } else {
    releaseBody = `## 🎓 Cursa v${version} Official Release\n\nOfficial production release for Cursa Desktop.`;
  }

  let release;
  const getRelRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/releases/tags/${tag}`, { headers });
  if (getRelRes.status === 200) {
    release = await getRelRes.json();
    console.log(`Found existing release: ${release.name} (id: ${release.id})`);
  } else if (getRelRes.status === 404) {
    console.log(`Creating release for tag ${tag}...`);
    const createRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/releases`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tag_name: tag,
        name: `Cursa Desktop v${version} — Official Windows Release`,
        body: releaseBody,
        draft: false,
        prerelease: false
      })
    });

    if (!createRes.ok) {
      const err = await createRes.text();
      console.error(`Failed to create release: ${createRes.status} ${err}`);
      process.exit(1);
    }
    release = await createRes.json();
    console.log(`Release created successfully: ${release.html_url}`);
  } else {
    const err = await getRelRes.text();
    console.error(`Error checking release: ${getRelRes.status} ${err}`);
    process.exit(1);
  }

  // Upload assets
  const releaseDir = path.join(__dirname, '..', 'release');
  const filesToUpload = [
    {
      fileName: `Cursa-Setup-${version}.exe`,
      filePath: path.join(releaseDir, `Cursa-Setup-${version}.exe`),
      contentType: 'application/octet-stream'
    },
    {
      fileName: `Cursa-v${version}-windows-x64.zip`,
      filePath: path.join(releaseDir, `Cursa-v${version}-windows-x64.zip`),
      contentType: 'application/zip'
    }
  ];

  const existingAssets = release.assets || [];

  for (const item of filesToUpload) {
    if (!fs.existsSync(item.filePath)) {
      console.warn(`File not found: ${item.filePath}, skipping.`);
      continue;
    }

    const existing = existingAssets.find(a => a.name === item.fileName);
    if (existing) {
      console.log(`Asset already uploaded: ${item.fileName}`);
      continue;
    }

    const stats = fs.statSync(item.filePath);
    console.log(`Uploading ${item.fileName} (${(stats.size / 1024 / 1024).toFixed(1)} MB)...`);

    const uploadUrl = release.upload_url.replace(/\{(\?name,label)?\}/, `?name=${encodeURIComponent(item.fileName)}`);
    const fileBuffer = fs.readFileSync(item.filePath);

    const uploadRes = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Accept': 'application/vnd.github+json',
        'Authorization': `Bearer ${token}`,
        'Content-Type': item.contentType,
        'Content-Length': fileBuffer.length.toString(),
        'User-Agent': 'Node-Release-Uploader',
        'X-GitHub-Api-Version': '2022-11-28'
      },
      body: fileBuffer,
      duplex: 'half'
    });

    if (!uploadRes.ok) {
      const err = await uploadRes.text();
      console.error(`Failed to upload ${item.fileName}: ${uploadRes.status} ${err}`);
    } else {
      const asset = await uploadRes.json();
      console.log(`Successfully uploaded: ${item.fileName} -> ${asset.browser_download_url}`);
    }
  }

  console.log(`\nAll done! Public release page:\n${release.html_url}`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
