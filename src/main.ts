import * as core from '@actions/core'
import * as fs from 'fs';
import * as github from '@actions/github';
import * as path from 'path';
import * as os from 'os';
import * as semver from 'semver';
import * as tc from '@actions/tool-cache';

// arch in [arm, x32, x64...] (https://nodejs.org/api/os.html#os_os_arch)
// return value in [amd64, 386, arm]
function mapArch(arch: string): string {
  const mappings: { [s: string]: string } = {
    x64: 'amd64',
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
  const filename = `conftest_${mapOS(platform)}_${mapArch(os.arch())}`;
  const binaryName = platform === 'win32' ? `${filename}.exe` : filename;

  const url = `https://github.com/open-policy-agent/conftest/releases/download/${vsn}/${binaryName}`;
  core.info(`Fetch url: ${url}`);
  return {
    url,
    binaryName,
  };
}


async function getVersion(): Promise<string> {
  const version = core.getInput('version');
  if (version === 'latest' || version === 'edge') {
    return version;
  }

  if (semver.valid(version)) {
    return semver.clean(version) || version;
  }

  if (semver.validRange(version)) {
    const max = semver.maxSatisfying(await getAllVersions(), version);
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
    await tc.downloadTool(
      download.url,
      path.join(pathToCLI, download.binaryName)
    );

    // Make the downloaded file executable
    fs.chmodSync(path.join(pathToCLI, download.binaryName), '755');

    // Expose the tool by adding it to the PATH
    core.addPath(pathToCLI);

  } catch (e) {
    core.setFailed(e as string | Error);
  }
}

if (require.main === module) {
  void setup();
}