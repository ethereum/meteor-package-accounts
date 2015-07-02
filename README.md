# Ethereum accounts

Provides you with an accounts collection, where balances are automatically updated.
Additionally the accounts are persisted in localstorage.

If the ethereum node removes one account,
the accounts collection will mark this account as deactivated,
and will later revivie it when its present in the node again.

## Usage

Simply use the global `Accounts` object like any other minimongo collection.
It provides the `.find()`, `.findOen()`, `.update()` and `.remove()` funcitons.

To make sure the accounts get only updated once you have a working etheruem connection, you need specifically call:

    Accounts.init();

Somewhere in the beginning of your code, or after you connected to an ethereum node.