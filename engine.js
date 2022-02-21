'format cjs';

const wrap = require('word-wrap');
const map = require('lodash.map');
const longest = require('longest');
const rightPad = require('right-pad');
const chalk = require('chalk');
const branch = require('git-branch');
const boxen = require('boxen');
const defaults = require('./defaults');
const LimitedInputPrompt = require('./LimitedInputPrompt');

let filter = function(array) {
  return array.filter(function(x) {
    return x;
  });
};

let filterSubject = function(subject) {
  subject = subject.trim();
  while (subject.endsWith('.')) {
    subject = subject.slice(0, subject.length - 1);
  }
  return subject;
};

// This can be any kind of SystemJS compatible module.
// We use Commonjs here, but ES6 or AMD would do just fine.
module.exports = function(options) {
  let getFromOptionsOrDefaults = function(key) {
    return options[key] || defaults[key];
  };

  let types = getFromOptionsOrDefaults('types');
  let typeLength = longest(Object.keys(types)).length + 1;
  let typeChoices = map(types, function(type, key) {
    return {
      name: rightPad(key + ':', typeLength) + ' ' + type.description,
      value: key
    };
  });

  let workflows = getFromOptionsOrDefaults('workflows');
  let workflowsLength = longest(Object.keys(workflows)).length + 1;
  let workflowChoices = map(workflows, function(type, key) {
    return {
      name: rightPad(type.title + ':', workflowsLength) + ' ' + type.description,
      value: key
    };
  });

  const minHeaderWidth = getFromOptionsOrDefaults('minHeaderWidth');
  const maxHeaderWidth = getFromOptionsOrDefaults('maxHeaderWidth');

  const branchName = branch.sync() || '';
  const jiraIssueRegex = /(?<jiraIssue>(?<!([A-Z0-9]{1,10})-?)[A-Z0-9]+-\d+)/;
  const matchResult = branchName.match(jiraIssueRegex);
  const jiraIssue = matchResult && matchResult.groups && matchResult.groups.jiraIssue;

  const hasScopes = options.scopes && Array.isArray(options.scopes) && options.scopes.length > 0;

  return {
    // When a user runs `git cz`, prompter will be executed.
    // We pass you cz, which currently is just an instance of inquirer.js.
    // Using this you can ask questions and get answers.
    //
    // The commit callback should be executed when you're ready to send back a commit template to git.
    //
    // By default, we'll de-indent your commit template and will keep empty lines.
    prompter: function(cz, commit, testMode) {
      cz.registerPrompt('limitedInput', LimitedInputPrompt);

      // Let's ask some questions of the user so that we can populate our commit template.
      //
      // See inquirer.js docs for specifics.
      // You can also opt to use another input collection library if you prefer.
      cz.prompt([
        {
          type: 'list',
          name: 'type',
          message: 'Selecione o tipo de alteração:',
          choices: typeChoices,
          default: options.defaultType
        },
        {
          type: hasScopes ? 'list' : 'input',
          name: 'scope',
          when: !options.skipScope,
          choices: hasScopes ? options.scopes : undefined,
          message:
            'Qual é o escopo da mudança (ex.: componente ou nome do arquivo): ' +
            (hasScopes ? '(selecione na lista)' : '(pressione enter para ignorar)'),
          default: options.defaultScope,
          filter: function(value) {
            return value.trim().toLowerCase();
          }
        },
        {
          type: 'limitedInput',
          name: 'subject',
          message: 'Escreva uma descrição breve da mudança (utilizando o tempo verbal imperativo na 2ª pessoa):',
          default: options.defaultSubject,
          maxLength: maxHeaderWidth,
          leadingLabel: answers => {
            let scope = '';

            if (answers.scope && answers.scope !== 'none') {
              scope = `(${answers.scope})`;
            }

            return `${answers.type}${scope}:`;
          },
          validate: input =>
            input.length >= minHeaderWidth || `A descrição deve conter ao menos ${minHeaderWidth} caracteres`,
          filter: function(subject) {
            return filterSubject(subject);
          }
        },
        {
          type: 'input',
          name: 'body',
          message: 'Forneça uma descrição mais detalhada da mudança: (pressione enter para ignorar)\n',
          default: options.defaultBody
        },
        {
          type: 'confirm',
          name: 'isBreaking',
          message: 'Há alguma "Breaking Change"?',
          default: false
        },
        {
          type: 'confirm',
          name: 'isBreaking',
          message: 'Isso gerará um incremento na versão principal, tem certeza?',
          default: false,
          when: function(answers) {
            return answers.isBreaking;
          }
        },
        {
          type: 'input',
          name: 'breaking',
          message: 'Descreva as breaking changes:\n',
          when: function(answers) {
            return answers.isBreaking;
          }
        },
        {
          type: 'confirm',
          name: 'isIssueAffected',
          message: 'Essa alteração afeta alguma tarefa no Jira?',
          default: options.defaultIssues,
          when: options.jiraMode
        },
        {
          type: 'input',
          name: 'jira',
          message: 'Digite o código da tarefa do JIRA (' + getFromOptionsOrDefaults('jiraPrefix') + '-12345)' + ':',
          default: jiraIssue ? jiraIssue : undefined,
          when: function(answers) {
            return answers.isIssueAffected;
          },
          validate: function(jira) {
            if (!jira) {
              return (
                'Deve-se especificar código da tarefa, caso contrário, ' +
                'especifique que não afetará tarefas no Jira (Ctrl+C para cancelar)'
              );
            }
            return /^(?<!([A-Z0-9]{1,10})-?)[A-Z0-9]+-\d+$/.test(jira);
          },
          filter: function(jira) {
            return jira.toUpperCase();
          }
        },
        {
          type: 'list',
          name: 'workflow',
          message: 'Selecione o fluxo de trabalho para a tarefa do JIRA:\n',
          choices: workflowChoices,
          when: function(answers) {
            return answers.isIssueAffected;
          },
          validate: function(input) {
            if (input && input.indexOf(' ') !== -1) {
              return (
                'Os fluxos de trabalho não podem ter espaços em smart commits. ' +
                '' +
                'Se o nome do seu fluxo de trabalho tiver um espaço, use um traço (-)'
              );
            }
          },
          default: options.defaultIssues ? options.defaultIssues : undefined
        },
        {
          type: 'input',
          name: 'time',
          message: 'Tempo gasto (ex. 3h 15m) (opcional):\n',
          when: function(answers) {
            return answers.isIssueAffected;
          },
          default: options.defaultIssues ? options.defaultIssues : undefined
        },
        {
          type: 'input',
          name: 'comment',
          message: 'Comentário no Jira (opcional):\n',
          when: function(answers) {
            return answers.isIssueAffected;
          },
          default: options.defaultIssues ? options.defaultIssues : undefined
        }
      ]).then(async function(answers) {
        let wrapOptions = {
          trim: true,
          cut: false,
          newline: '\n',
          indent: '',
          width: options.maxLineWidth
        };

        // parentheses are only needed when a scope is present
        let scope = answers.scope ? '(' + answers.scope + ')' : '';

        // Hard limit this line in validate
        let head = answers.type + scope + ': ' + answers.subject;

        // Wrap these lines at options.maxLineWidth characters
        let body = answers.body ? wrap(answers.body, wrapOptions) : false;

        let footer = false;

        // Apply breaking change prefix, removing it if already present
        let breaking = answers.breaking ? answers.breaking.trim() : '';
        breaking = breaking ? 'BREAKING CHANGE: ' + breaking.replace(/^BREAKING CHANGE: /, '') : '';
        breaking = breaking ? wrap(breaking, wrapOptions) : false;

        let jira = answers.jira ? answers.jira : false;
        if (jira) {
          let issueWorkflow = answers.workflow ? '#' + answers.workflow : undefined;
          if (issueWorkflow === '#nothing') {
            issueWorkflow = undefined;
          }

          footer = filter([
            jira.trim(),
            answers.time ? '#time ' + answers.time : undefined,
            issueWorkflow,
            answers.comment ? '#comment ' + answers.comment : undefined
          ]).join(' ');
        }

        if (!body && (breaking || footer)) {
          body = wrap('-', wrapOptions);
        }

        const fullCommit = filter([head, body, breaking, footer]).join('\n\n');

        if (testMode) {
          return commit(fullCommit);
        }

        console.log();
        console.log(chalk.underline('Commit preview:'));
        console.log(boxen(chalk.green(fullCommit), { padding: 1, margin: 1 }));

        const { doCommit } = await cz.prompt([
          {
            type: 'confirm',
            name: 'doCommit',
            message: 'Deseja confirmar o commit?'
          }
        ]);

        if (doCommit) {
          commit(fullCommit);
        }
      });
    }
  };
};
