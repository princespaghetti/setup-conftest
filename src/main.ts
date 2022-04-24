import * as core from '@actions/core'
import * as fs from 'fs';
import * as github from '@actions/github';
import * as os from 'os';
import * as path from 'path';
import * as semver from 'semver';
import * as tc from '@actions/tool-cache';

// arch in [arm, x32, x64...] (https://nodejs.org/api/os.html#os_os_arch)
// return value in [amd64, 386, arm]
function mapArch(arch: string): string {
  const mappings: { [s: string]: string } = {
    x64: 'x86_64',
  };
  return mappings[arch] || arch;
}

// os in [darwin, linux, win32...] (https://nodejs.org/api/os.html#os_os_platform)
// return value in [darwin, linux, windows]
function mapOS(opsys: string): string {
  const mappings: { [s: string]: string } = {
    win32: 'windows',
  };
  return mappings[opsys] || opsys;
}

function getDownloadObject(version: string): {
  url: string;
  binaryName: string;
} {
  const vsn = `v${version}`;

  const platform = os.platform();
  const filename = `conftest_${version}_${mapOS(platform)}_${mapArch(os.arch())}`;


  let url: string;
  let binaryName: string;

  if (process.platform === 'win32') {
    url = `https://github.com/open-policy-agent/conftest/releases/download/${vsn}/${filename}.zip`;
    binaryName = `conftest.exe`
  } else {
    url = `https://github.com/open-policy-agent/conftest/releases/download/${vsn}/${filename}.tar.gz`;
    binaryName = `conftest`
  }

  core.info(`Fetch url: ${url}`);
  return {
    url,
    binaryName
  };
}


async function getVersion(): Promise<string> {
  const version = core.getInput('version');
  const versions = await getAllVersions()
  if (version === 'latest') {
    return versions[0];
  }

  if (semver.valid(version)) {
    return semver.clean(version) || version;
  }

  if (semver.validRange(version)) {
    const max = semver.maxSatisfying(versions, version);
    if (max) {
      return semver.clean(max) || version;
    }
    core.warning(`${version} did not match any release version.`);
  } else {
    core.warning(`${version} is not a valid version or range.`);
  }
  return version;
}

async function getAllVersions(): Promise<string[]> {
  const githubToken = core.getInput('github-token', { required: true });
  const octokit = github.getOctokit(githubToken);

  const allVersions: string[] = [];
  for await (const response of octokit.paginate.iterator(
    octokit.rest.repos.listReleases,
    { owner: 'open-policy-agent', repo: 'conftest' }
  )) {
    for (const release of response.data) {
      if (release.name) {
        allVersions.push(release.name);
      }
    }
  }

  return allVersions;
}



async function setup(): Promise<void> {
  try {
    // Get version of tool to be installed
    const version = await getVersion();
    core.info(`Setup Conftest version ${version}`);
    // Download the specific version of the tool, e.g. as a tarball/zipball
    const download = getDownloadObject(version);
    const pathToCLI = fs.mkdtempSync(path.join(os.tmpdir(), 'tmp'));
    const downloadPath = await tc.downloadTool(download.url);
    if (process.platform === 'win32') {
      await tc.extractZip(downloadPath, pathToCLI);
    } else {
      await tc.extractTar(downloadPath, pathToCLI);
    }
    // Make the downloaded file executable
    fs.chmodSync(path.join(pathToCLI,download.binaryName), '755');

    // Expose the tool by adding it to the PATH
    core.addPath(pathToCLI);

  } catch (e) {
    core.setFailed(e as string | Error);
  }
}

if (require.main === module) {
  void setup();
}