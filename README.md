# Setup Conftest GitHub Action

GitHub action to add [Conftest](https://www.conftest.dev/) to your GitHub Actions workflow.

Conftest is a utility to help you write tests against structured configuration data


## Basic Usage

Here we see a simple template that checks out the repository code, installs Conftest, and then runs a test against a yaml file. 

```yml
name: Run Conftest Validation  
on: [push]
jobs:
  Run-OPA-Tests:
    runs-on: ubuntu-latest
    steps:
    - name: Check out repository code
      uses: actions/checkout@v2

    - name: Setup Conftest
      uses: princespaghetti/setup-conftest@v1

    - name: Run Conftest 
      run: conftest test file.yaml
```

## Choose Conftest Version

When Conftest is installed on the GitHub runner, you can select a the specific version of Conftest you wish to run.

```yml
steps:
  - name: Setup Conftest
    uses: princespaghetti/setup-conftest@v1
    with:
      version: 0.29.0
```

Or, Conftest can be locked to a [SemVer range](https://www.npmjs.com/package/semver#ranges).

```yml
steps:
  - name: Setup Conftest
    uses: princespaghetti/setup-conftest@v1
    with:
      version: 0.31.x
```

```yml
steps:
  - name: Setup Conftest
    uses: princespaghetti/setup-conftest@v1
    with:
      version: 0.31
```

```yml
steps:
  - name: Setup Conftest
    uses: princespaghetti/setup-conftest@v1
    with:
      version: <0.31
```


## Inputs

The action supports the following inputs:

- `version`: Optional, defaults to `latest` and [SemVer ranges](https://www.npmjs.com/package/semver#ranges) are supported, so instead of a full version string, you can use `0.29` or `0.31` as the version.

## Outputs

This action does not set any direct outputs.

## Credits

Thanks to the fine folks over at [Infracost](https://github.com/infracost/infracost) who created the initial version of [setup-opa](https://github.com/open-policy-agent/setup-opa) and the OPA team for their continued support of the action. 
This repository re-uses a large amount of the functionality with modifications for how Conftest is distributed.

The [typescript action template](https://github.com/actions/typescript-action) also helpful to rapidly create this action.