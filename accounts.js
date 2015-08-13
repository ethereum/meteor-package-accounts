/**

@module Ethereum:accounts
*/



/**
The accounts collection, with some ethereum additions.

@class EthAccounts
@constructor
*/


EthAccounts = new Mongo.Collection('ethereum_accounts', {connection: null});

if(typeof PersistentMinimongo !== 'undefined')
    new PersistentMinimongo(EthAccounts);


EthAccounts._watching = false;

/**
Updates the accounts balances, by watching for new blocks and checking the balance.

@method _watchBalance
*/
EthAccounts._watchBalance = function(){
    var _this = this;

    this._watching = true;

    // UPDATE SIMPLE ACCOUNTS balance on each new block
    web3.eth.filter('latest').watch(function(e, res){
        if(!e) {
            _this._updateBalance();
        }
    });
};

/**
Updates the accounts balances.

@method _updateBalance
*/
EthAccounts._updateBalance = function(){
    _.each(EthAccounts.findAll().fetch(), function(account){
        web3.eth.getBalance(account.address, function(err, res){
            if(!err) {
                EthAccounts.updateAll(account._id, {$set: {
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
EthAccounts._addAccounts = function(){
    var _this = this;

    // UPDATE normal accounts on start
    web3.eth.getAccounts(function(e, accounts){
        if(!e) {
            var visibleAccounts = _.pluck(EthAccounts.find().fetch(), 'address');


            if(!_.isEmpty(accounts) &&
                _.difference(accounts, visibleAccounts).length === 0 &&
                _.difference(visibleAccounts, accounts).length === 0)
                return;


            var localAccounts = EthAccounts.findAll().fetch();

            // if the accounts are different, update the local ones
            _.each(localAccounts, function(account){
                // set status deactivated, if it seem to be gone
                if(!_.contains(accounts, account.address)) {
                    EthAccounts.updateAll(account._id, {$set: {
                        deactivated: true
                    }});
                } else {
                    EthAccounts.updateAll(account._id, {$unset: {
                        deactivated: ''
                    }});
                }

                accounts = _.without(accounts, account.address);
            });

            // ADD missing accounts
            var accountsCount = visibleAccounts.length + 1;
            _.each(accounts, function(address){

                web3.eth.getBalance(address, function(e, balance){
                    if(!e) {
                        web3.eth.getCoinbase(function(e, coinbase){
                            EthAccounts.insert({
                                type: 'account',
                                address: address,
                                balance: balance.toString(10),
                                name: (address === coinbase) ? 'Etherbase' : 'Account '+ accountsCount
                            });

                            if(address !== coinbase)
                                accountsCount++;
                        });
                    }
                });

            });
        }
    });
};
EthAccounts._find = EthAccounts.find;
EthAccounts._findOne = EthAccounts.findOne;
EthAccounts._update = EthAccounts.update;
// EthAccounts._remove = EthAccounts.remove;


/**
Builds the query with the addition of "{deactivated: {$exists: false}}"

@method _addToQuery
@param {Mixed} arg
@return {Object} The query
*/
EthAccounts._addToQuery = function(args){
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
EthAccounts.find = function(){    
    return this._find.apply(this, this._addToQuery(arguments));
};

/**
Find one accounts, besides the deactivated ones

@method findOne
@return {Object} cursor
*/
EthAccounts.findOne = function(){
    return this._findOne.apply(this, this._addToQuery(arguments));
};

/**
Find all accounts, including the deactivated ones

@method findAll
@return {Object} cursor
*/
EthAccounts.findAll = EthAccounts._find;

/**
Update accounts, besides the deactivated ones

@method update
@return {Object} cursor
*/
EthAccounts.update = function(){
    return this._update.apply(this, this._addToQuery(arguments));
};

/**
Update accounts, including the deactivated ones

@method updateAll
@return {Object} cursor
*/
EthAccounts.updateAll = EthAccounts._update;

/**
Starts fetching and watching the accounts

@method init
*/
EthAccounts.init = function(){
    var _this = this;

    Tracker.nonreactive(function(){

        _this._addAccounts();

        if(!_this._watching) {
            _this._updateBalance();
            _this._watchBalance();

            // check for new accounts every 2s
            Meteor.clearInterval(_this._intervalId);
            _this._intervalId = Meteor.setInterval(function(){
                _this._addAccounts();
            }, 2000);
        }
    });
};