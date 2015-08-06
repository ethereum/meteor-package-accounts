# Ethereum accounts

Provides you with an `EthAccounts` collection, where balances are automatically updated.
Additionally the accounts are persisted in localstorage.

If the ethereum node removes accounts,
the `EthAccounts` collection will set the `deactivated: true` property to these accounts and hide them from normal queries.

If the Accounts should reapear in the node (e.g. the user importet those, or mist allwed them access), they will be available again,
including all the extra properties you've set.

**Note** don't use the `EthAccounts` collection to add your own custom accounts as a reload of your application,
or any change in `web3.eth.accounts` would hide them.

## Installation

    $ meteor add ethereum:accounts

## Usage

Initialize Accounts on the start of your application, as soon as you have a ethereum connection:

```js
EthAccounts.init();
```

Then simply use the global `EthAccounts` object like any other minimongo collection.
It provides the `.find()`, `.findOne()`, `.findAll()`, `.update()`, `.updateAll()` and `.remove()` functions e.g.:

```js
// Get all active accounts
var myAccounts = EthAccounts.find().fetch();

[
  {
    "_id": "2Zd3Z9XQrc7iN7Ci3"
    "address": "0x343c98e2b6e49bc0fed722c2a269f3814ddd1533",
    "balance": "18260939861619682985678",
    "name": "Coinbase",
  }
]

// or
var myPrimaryAccount = EthAccounts.findOne({name: 'Coinbase'});
```

#### If you want to get truly all accounts including the deactivated ones use:

```js
var allAccounts = EthAccounts.findAll().fetch();

[
  {
    "_id": "2Zd3Z9XQrc7iN7Ci3"
    "address": "0x343c98e2b6e49bc0fed722c2a269f3814ddd1533",
    "balance": "18260939861619682985678",
    "name": "Coinbase",
  },
  {
    "_id": "56sbC8dggbYstmN2o",
    "address": "0x990ccf8a0de58091c028d6ff76bb235ee67c1c39",
    "balance": "0",
    "name": "0x990ccf8a0de58091c028d6ff76bb235ee67c1c39",
    "deactivated": true
  }
]

```

#### If you want to update a deactivated account use:

```js
EthAccounts.updateAll({address: "0x990ccf8a0de58091c028d6ff76bb235ee67c1c39"}, {name: 'XYZ'}});
```

#### If you manually want to activate an account to make it visible call:

```js
EthAccounts.updateAll({address: "0x990ccf8a0de58091c028d6ff76bb235ee67c1c39"}, {$unset: {deactivated: ''}})
```