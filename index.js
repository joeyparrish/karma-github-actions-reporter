/*! @license
 * Karma GitHub Actions Reporter
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

function defaultOutputCallback(text) {
  console.log(text);
}

function GitHubActionsReporter(baseReporterDecorator, formatError, config) {
  baseReporterDecorator(this);

  const reporterConfig = config.githubActionsReporter || {};
  const outputCallback = reporterConfig.outputCallback || defaultOutputCallback;

  this.specFailure = function(browser, result) {
    // We get one log for each failed expectation.
    for (const log of result.log) {
      // formatError() turns URLs into file paths.  Then we parse it further.
      const error = parseFormattedError(formatError(log));

      // Create a GitHub Actions annotation for this error.
      let annotation = '::error';
      if (error.file) {
        // Add file and line number if we have it.
        annotation +=
            ` file=${error.file},line=${error.line},col=${error.column}`;
      }
      annotation += '::';

      if (reporterConfig.showBrowser) {
        annotation += `${browser.name} `;
      }
      annotation += `${result.fullName} FAILED: ${error.message}`;

      // Log it.
      outputCallback(annotation);
    }
  };
}

function parseFormattedError(error) {
  // Our input looks something like:
  //   Error: Expected 0 to be 1.
  //     at <Jasmine>
  //     at UserContext.<anonymous> (test/util/string_utils_unit.js:11:15)
  //     at <Jasmine>
  // or like this if we're using Babel:
  //   Error: Expected 0 to be 1.
  //     at <Jasmine>
  //     at UserContext.<anonymous> (test/util/string_utils_unit.js:11:15 <- test/util/string_utils_unit.js:11:15)
  //     at <Jasmine>
  // In the case of Babel, the line number on the left is the original.
  const regex = /^\s*at .* \(([^:]+):(\d+):(\d+)(\)| <-)/m;
  const parsed = {
    // The error message is the first line of the formatted error.
    message: error.split('\n')[0],
  };

  // Try to get more detailed info.
  const match = regex.exec(error);
  if (match) {
    parsed.file = match[1];
    parsed.line = match[2];
    parsed.column = match[3];
  }

  return parsed;
}

GitHubActionsReporter.$inject = [
  'baseReporterDecorator',
  'formatError',
  'config',
];

module.exports = {
  'reporter:github-actions': ['type', GitHubActionsReporter],
  GitHubActionsReporter,
  parseFormattedError,
};
