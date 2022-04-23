import * as core from '@actions/core'
import * as github from '@actions/github';
import * as os from 'os';
import * as semver from 'semver';

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
function mapOS(os: string): string {
  const mappings: { [s: string]: string } = {
    win32: 'windows',
  };
  return mappings[os] || os;
}

function getDownloadObject(version: string): {
  url: string;
  binaryName: string;
} {
  let vsn = `v${version}`;

  const platform = os.platform();
  const filename = `opa_${mapOS(platform)}_${mapArch(os.arch())}`;
  const binaryName = platform === 'win32' ? `${filename}.exe` : filename;

  let url = `https://github.com/open-policy-agent/conftest/releases/download/${vsn}/${binaryName}`;

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

  } catch (e) {
    core.setFailed(e as string | Error);
  }
}

if (require.main === module) {
  void setup();
}