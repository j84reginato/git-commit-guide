# git Commit Guide

Part of the [commitizen](https://github.com/commitizen/cz-cli) family. Prompts
for [conventional changelog](https://github.com/conventional-changelog/conventional-changelog) standard and also prompts
for a mandatory JIRA issue.

Adds Smart commits functionality
in [@digitalroute/cz-conventional-changelog-for-jira](https://github.com/digitalroute/cz-conventional-changelog-for-jira)

## Features

- Works seamlessly with semantic-release 🚀
- Works seamlessly with Jira smart commits
- Automatically detects the Jira issue from the branch name

## Quickstart

### Installation

```bash
npm install commitizen git-commit-guide
```

and then add the following to package.json:

```json
{
  "scripts": {
    "commit": "git-cz"
  },
  "config": {
    "commitizen": {
      "path": "./node_modules/git-commit-guide"
    }
  }
}
```

### Install Globally

Create a .czrc file in your home directory, with path referring to the preferred, globally installed, commitizen adapter

```bash
echo '{ "path": "./node_modules/git-commit-guide" }' > ~/.czrc
```

After commitizen has been installed, instead of making a commit with git commit you make a commit with:

```bash
git cz
```

## Configuration

Like commitizen, you can specify the configuration of cz-conventional-changelog-for-jira through the
package.json's `config.commitizen` key, or with environment variables.

| Environment variable | package.json   | Default   | Description                                                                                                                                                           |
| -------------------- | -------------- | --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CZ_JIRA_MODE         | jiraMode       | true      | If this is set to true, CZ will ask for a Jira issue and put it in the commit head. If set to false CZ will ask for the issue in the end, and can be used for GitHub. |
| CZ_MAX_HEADER_WIDTH  | maxHeaderWidth | 72        | This limits how long a commit message head can be.                                                                                                                    |
| CZ_MIN_HEADER_WIDTH  | minHeaderWidth | 2         | This limits how short a commit message can be.                                                                                                                        |
| CZ_MAX_LINE_WIDTH    | maxLineWidth   | 100       | Commit message bodies are automatically wrapped. This decides how long the lines will be.                                                                             |
| CZ_SKIP_SCOPE        | skipScope      | true      | If scope should be used in commit messages.                                                                                                                           |
| CZ_TYPE              | defaultType    | undefined | The default type.                                                                                                                                                     |
| CZ_SCOPE             | defaultScope   | undefined | The default scope.                                                                                                                                                    |
| CZ_SUBJECT           | defaultSubject | undefined | A default subject.                                                                                                                                                    |
| CZ_BODY              | defaultBody    | undefined | A default body.                                                                                                                                                       |
| CZ_ISSUES            | defaultIssues  | undefined | A default issue.                                                                                                                                                      |
| CZ_JIRA_OPTIONAL     | jiraOptional   | false     | If this is set to true, you can leave the JIRA field blank.                                                                                                           |

## Dynamic Configuration

Alternatively, if you want to create your own profile, you can use the _configurable_ approach. Here is an example:
**./index.js**

```javascript
const custom = require('git-commit-guide/configurable');
// You can do this optionally if you want to extend the commit types
const defaultTypes = require('git-commit-guide/types');

module.exports = custom({
  types: {
    ...defaultTypes,
    perf: {
      description: 'Improvements that will make your code perform better',
      title: 'Performance'
    }
  },
  skipScope: false,
  scopes: ['myScope1', 'myScope2']
});
```

**./package.json**

```json
{
  "config": {
    "commitizen": {
      "path": "./index.js"
    }
  }
}
```

This example would:

* Display _"perf"_ as an extra commit type
* Ask you to add a commit scope
* Limit the scope selection to either `myScope` or `myScope2`

List of all supported configurable options when using the _configurable_ approach:

| Key            | Default        | Description                                                                                                                                                           |
| -------------- |----------------| --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| jiraMode       | true           | If this is set to true, CZ will ask for a Jira issue and put it in the commit head. If set to false CZ will ask for the issue in the end, and can be used for GitHub. |
| maxHeaderWidth | 72             | This limits how long a commit message head can be.                                                                                                                    |
| minHeaderWidth | 2              | This limits how short a commit message can be.                                                                                                                        |
| maxLineWidth   | 100            | Commit message bodies are automatically wrapped. This decides how long the lines will be.                                                                             |
| skipScope      | true           | If scope should be used in commit messages.                                                                                                                           |
| defaultType    | undefined      | The default type.                                                                                                                                                     |
| defaultScope   | undefined      | The default scope.                                                                                                                                                    |
| defaultSubject | undefined      | A default subject.                                                                                                                                                    |
| defaultBody    | undefined      | A default body.                                                                                                                                                       |
| defaultIssues  | undefined      | A default issue.                                                                                                                                                      |
| jiraPrefix     | 'JNR'          | The default JIRA ticket prefix that will be displayed.                                                                                                                |
| types          | ./types.js     | A list (JS Object) of supported commit types.                                                                                                                         |
| workflows      | ./workflows.js | A list (JS Object) of supported Jira issues Workflow transitions types.                                                                                               |
| scopes         | undefined      | A list (JS Array) of scopes that will be available for selection. Note that adding this will change the scope field from Inquirer 'input' to 'list'.                  |
| jiraOptional   | false          | If this is set to true, you can leave the JIRA field blank.                                                                                                           |

### Commitlint

If using the [commitlint](https://github.com/conventional-changelog/commitlint) js library, the "maxHeaderWidth"
configuration property will default to the configuration of the "header-max-length" rule instead of the hard coded value
of 72. This can be ovewritten by setting the 'maxHeaderWidth' configuration in package.json or the CZ_MAX_HEADER_WIDTH
environment variable.
