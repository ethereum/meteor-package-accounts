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
    _.each(Accounts.findAll().fetch(), function(account){
        web3.eth.getBalance(account.address, function(err, res){
            if(!err) {
                Accounts.updateAll(account._id, {$set: {
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

        if(_.difference(accounts, _.pluck(Accounts.find().fetch(), 'address')).length === 0)
            return;

        var localAccounts = Accounts.findAll().fetch();

        // if the accounts are different, update the local ones
        _.each(localAccounts, function(account){
            // set status deactivated, if it seem to be gone
            if(!_.contains(accounts, account.address)) {
                Accounts.updateAll(account._id, {$set: {
                    deactivated: true
                }});
            } else {
                web3.eth.getBalance(account.address, function(e, balance){
                    if(!e) {
                        Accounts.updateAll(account._id, {$set: {
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
Accounts._find = Accounts.find;
Accounts._findOne = Accounts.findOne;
Accounts._update = Accounts.update;
// Accounts._remove = Accounts.remove;


/**
Builds the query with the addition of "{deactivated: {$exists: false}}"

@method _addToQuery
@param {Mixed} arg
@return {Object} The query
*/
Accounts._addToQuery = function(args){
    var args = Array.prototype.slice.call(args);

    if(_.isObject(args[0]))
        args[0] = _.extend(args[0], {deactivated: {$exists: false}});
    else if(_.isString(args[0]))
        args[0] = {_id: args[0], deactivated: {$exists: false}};
    else
        args[0] = {deactivated: {$exists: false}};

    return args;
};

/**
Find all accounts, besides the deactivated ones

@method find
@return {Object} cursor
*/
Accounts.find = function(){    
    return this._find.apply(this, this._addToQuery(arguments));
};

/**
Find one accounts, besides the deactivated ones

@method findOne
@return {Object} cursor
*/
Accounts.findOne = function(){
    return this._findOne.apply(this, this._addToQuery(arguments));
};

/**
Find all accounts, including the deactivated ones

@method findAll
@return {Object} cursor
*/
Accounts.findAll = Accounts._find;

/**
Update accounts, besides the deactivated ones

@method update
@return {Object} cursor
*/
Accounts.update = function(){
    return this._update.apply(this, this._addToQuery(arguments));
};

/**
Update accounts, including the deactivated ones

@method updateAll
@return {Object} cursor
*/
Accounts.updateAll = Accounts._update;

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

        // check for new accounts every 2s
        setInterval(function(){
            _this._addAccounts();
        }, 2000);
    });
};