Package.describe({
  name: 'ethereum:accounts',
  summary: 'Provides and updates the ethereum accounts in the Accounts collection',
  version: '0.2.0',
  git: 'http://github.com/ethereum/meteor-package-accounts'
});

Package.onUse(function(api) {
  api.versionsFrom('1.0');
  api.use('underscore', 'client');
  api.use('mongo', 'client');

  api.use('frozeman:persistent-minimongo@0.1.3', 'client');
  api.use('ethereum:web3@0.8.1', 'client');

  api.export(['EthAccounts', 'web3'], 'client'); // we need to expose web3.js, so that the app, can re-use this one, instead of having two instances

  api.addFiles('accounts.js', 'client');
});

// Package.onTest(function(api) {
//   api.use('tinytest');
//   api.use('ethereum:accounts');
//   api.addFiles('accounts-tests.js');
// });

