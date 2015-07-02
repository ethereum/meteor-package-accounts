Package.describe({
  name: 'ethereum:accounts',
  summary: 'Provides the available accounts in the accounts collection',
  version: '0.1.2',
  git: 'http://github.com/ethereum/meteor-package-accounts'
});

Package.onUse(function(api) {
  api.versionsFrom('1.0');
  api.use('underscore', 'client');
  api.use('mongo', 'client');

  api.use('frozeman:persistent-minimongo@0.1.3', 'client');
  api.use('ethereum:web3@0.7.0', 'client');

  api.export('Accounts', 'client');

  api.addFiles('accounts.js', 'client');
});

// Package.onTest(function(api) {
//   api.use('tinytest');
//   api.use('ethereum:accounts');
//   api.addFiles('accounts-tests.js');
// });

