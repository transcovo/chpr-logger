'use strict';

const DEFAULT_SENSITIVE_DATA_FRAGMENTS =
  '(mdp|password|authorization|token|pwd|auth)';

module.exports = class SensitiveDataStream {
  constructor(fragments, patterns = []) {
    this.fragments = fragments || DEFAULT_SENSITIVE_DATA_FRAGMENTS;
    this.replacer = '__SENSITIVE_DATA__';

    this.patterns = [
      ...patterns,
      {
        // Default pattern
        regex: new RegExp(`"${this.fragments}":"([^"]*)"`, 'ig'), // @Match "mdp":"My super password"
        substitute: `"$1":"${this.replacer}"`,
      },
    ];
  }

  write(input) {
    let sanitized = input;

    // Apply replace on input looping through patterns array
    for (let pattern of this.patterns) {
      sanitized = sanitized.replace(pattern.regex, pattern.substitute);
    }

    return process.stdout.write(sanitized);
  }
};
