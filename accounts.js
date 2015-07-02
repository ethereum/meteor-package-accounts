/**

@module Ethereum:accounts
*/



/**
The accounts collection, with some ethereum additions.

@class Accounts
@constructor
*/

Accounts = new Mongo.Collection('accounts', {connection: null});
new PersistentMinimongo(Accounts);


Accounts.watching = false;

/**
Updates the accounts balances, by watching for new blocks and checking the balance.

@method _watchBalance
*/
Accounts._watchBalance = function(){
    var _this = this;

    this.watching = true;

    // UPDATE SIMPLE ACCOUNTS balance on each new block
    web3.eth.filter('latest').watch(function(e, res){
        if(!e) {
            _this._updateBalance();
            _this._addAccounts();
        }
    });
};

/**
Updates the accounts balances.

@method _updateBalance
*/
Accounts._updateBalance = function(){
    _.each(Accounts.find().fetch(), function(account){
        web3.eth.getBalance(account.address, function(err, res){
            if(!err) {
                Accounts.update(account._id, {$set: {
                    balance: res.toString(10)
                }});
            }
        });
    });
}

/**
Updates the accounts list,
if its finds a difference between the accounts in the collection and the accounts in the accounts array.

@method _addAccounts
*/
Accounts._addAccounts = function(){

    // UPDATE normal accounts on start
    web3.eth.getAccounts(function(e, accounts){
        var localAccounts = Accounts.find().fetch();

        if(_.difference(_.pluck(localAccounts, 'address'), accounts).length === 0)
            return;

        // if the accounts are different, update the local ones
        _.each(localAccounts, function(account){
            // set status deactivated, if it seem to be gone
            if(!_.contains(accounts, account.address)) {
                Accounts.update(account._id, {$set: {
                    deactivated: true
                }});
            } else {
                web3.eth.getBalance(account.address, function(e, balance){
                    if(!e) {
                        Accounts.update(account._id, {$set: {
                            balance: balance.toString(10)
                        }, $unset: {
                            deactivated: ''
                        }});
                    }
                });
            }

            accounts = _.without(accounts, account.address);
        });
        // ADD missing accounts
        _.each(accounts, function(address){
            web3.eth.getBalance(address, function(e, balance){
                if(!e) {
                    web3.eth.getCoinbase(function(e, coinbase){
                        Accounts.insert({
                            address: address,
                            balance: balance.toString(10),
                            name: (address === coinbase) ? 'Coinbase' : address
                        });
                    });
                }
            });
        });
    });
};

/**
Starts fetching and watching the accounts

@method init
*/
Accounts.init = function(){
    var _this = this;

    Tracker.nonreactive(function(){

        _this._addAccounts();

        if(!_this.watching) {
            _this._updateBalance();
            _this._watchBalance();
        }
    });
};