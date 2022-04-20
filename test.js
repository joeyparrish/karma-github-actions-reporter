/*! @license
 * Karma GitHub Actions Reporter Tests
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

const {parseFormattedError, GitHubActionsReporter} = require('./index.js');

describe('parseFormattedError', () => {
  it('extracts file and line numbers', () => {
    const text = 'Error: Expected 0 to be 1.\n' + 
        '    at <Jasmine>\n' +
        '    at Bar (test/foo.js:11:15)\n' + 
        '    at <Jasmine>\n';
    expect(parseFormattedError(text)).toEqual({
      message: 'Error: Expected 0 to be 1.',
      file: 'test/foo.js',
      line: '11',
      column: '15',
    });
  });

  // When using Babel and sourcemaps, the line number info is different.
  it('extracts file and line numbers in sourcemapped format', () => {
    const text = 'Error: Expected 0 to be 1.\n' + 
        '    at <Jasmine>\n' +
        '    at Bar (test/foo.js:11:15 <- test/foo.js:867:5309)\n' +
        '    at <Jasmine>\n';
    expect(parseFormattedError(text)).toEqual({
      message: 'Error: Expected 0 to be 1.',
      file: 'test/foo.js',
      line: '11',
      column: '15',
    });
  });

  it('still returns the message when there are no useful line numbers', () => {
    const text = 'Error: Expected 0 to be 1.\n' + 
        '    at <Jasmine>\n';
    expect(parseFormattedError(text)).toEqual({
      message: 'Error: Expected 0 to be 1.',
    });
  });
});

describe('GitHubActionsReporter', () => {
  const fakeDecorator = () => {};
  const fakeFormatError = (error) => error;
  const fakeBrowser = {name: 'Chrome (Linux)'};

  it('reports spec errors via GitHub Actions workflow commands', () => {
    const config = {
      githubActionsReporter: {
        outputCallback: jasmine.createSpy('outputCallback'),
      },
    };
    const reporter = new GitHubActionsReporter(
        fakeDecorator, fakeFormatError, config);
    const result = {
      fullName: 'Foo can Bar',
      log: [
        'Error: Expected 0 to be 1.\n' +
        '    at <Jasmine>\n' +
        '    at Bar (test/foo.js:11:15 <- test/foo.js:867:5309)\n' +
        '    at <Jasmine>\n',
      ],
    };

    reporter.specFailure(fakeBrowser, result);
    expect(config.githubActionsReporter.outputCallback).toHaveBeenCalledWith(
      '::error file=test/foo.js,line=11,col=15::' +
      'Foo can Bar FAILED: Error: Expected 0 to be 1.');
  });

  it('reports spec errors with browser name', () => {
    const config = {
      githubActionsReporter: {
        outputCallback: jasmine.createSpy('outputCallback'),
        showBrowser: true,
      },
    };
    const reporter = new GitHubActionsReporter(
        fakeDecorator, fakeFormatError, config);
    const result = {
      fullName: 'Foo can Bar',
      log: [
        'Error: Expected 0 to be 1.\n' +
        '    at <Jasmine>\n' +
        '    at Bar (test/foo.js:11:15 <- test/foo.js:867:5309)\n' +
        '    at <Jasmine>\n',
      ],
    };

    reporter.specFailure(fakeBrowser, result);
    expect(config.githubActionsReporter.outputCallback).toHaveBeenCalledWith(
      '::error file=test/foo.js,line=11,col=15::' +
      'Chrome (Linux) Foo can Bar FAILED: Error: Expected 0 to be 1.');
  });
});
