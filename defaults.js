const conventionalCommitTypes = require('./types');
const workflowTransitions = require('./workflows');

module.exports = {
  types: conventionalCommitTypes,
  jiraMode: true,
  skipScope: false,
  maxHeaderWidth: 72,
  minHeaderWidth: 2,
  maxLineWidth: 72,
  jiraPrefix: 'JNR',
  jiraOptional: true,
  workflows: workflowTransitions
};
