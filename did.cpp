#include <graphenelib/graphene.hpp>
#include <graphenelib/contract.hpp>
#include <graphenelib/dispatcher.hpp>
#include <graphenelib/print.hpp>
#include <graphenelib/types.h>
#include <graphenelib/multi_index.hpp>
#include <graphenelib/crypto.h>
#include <graphenelib/global.h>

using namespace graphene;
using std::string;

class Did: public contract
{
    
private:
    // @abi table record i64
    struct user {
        uint64_t user_id;
        string first_name;
        string last_name;
        string birthday;
        
        string email;
        string phone;
        string country;
        string address;

        uint64_t primary_key() const { return user_id; }

        GRAPHENE_SERIALIZE(user, (user_id)(first_name)(last_name)(birthday)(email)(phone)(country)(address))
    };

    typedef graphene::multi_index<N(user), user> user_index;
    user_index users;
    
    uint64_t get_user_id(const string &account)
    {
        return get_account_id(account.c_str(), account.size());
    }
    
public:
    Did(uint64_t id)
        : contract(id)
        , users(_self, _self)
    {
    }
    
    /// @abi action
    void authorize(const string &app_name, const string &keys, const string &app_pubkey)
    {
        // decrypt info use keys, ',' segmented keys
        
        // encrypt info with app_pubkey
        print("hello");
    }
    
    /// @abi action
    void adduser(const string &first_name, const string &last_name, const string &birthday, const string &email,\
        const string &phone, const string &country, const string &address)
    {
        uint64_t owner = get_trx_sender();
        auto iter = users.find(owner);
        if(iter == users.end()) {
            users.emplace(owner, [&](auto &u) {
                u.user_id = owner;
                u.first_name = first_name;
                u.last_name = last_name;
                u.birthday = birthday;
                u.email = email;
                u.phone = phone;
                u.country = country;
                u.address = address;
            });
        } else {
            if(iter->first_name != first_name) {
                update("first_name", first_name);
            }
            if(iter->last_name != last_name) {
                update("last_name", last_name);
            }
            if(iter->birthday != birthday) {
                update("birthday", birthday);
            }
            if(iter->email != email) {
                update("email", email);
            }
            if(iter->phone != phone) {
                update("phone", phone);
            }
            if(iter->country != country) {
                update("country", country);
            }
            if(iter->address != address) {
                update("address", address);
            }
        }
    }
    
    /// @abi action
    void update(const string &key, const string &value)
    {
        uint64_t owner = get_trx_sender();
        graphene_assert(owner >= 0, "user not exist");
        
        auto iter = users.find(owner);
        graphene_assert(iter != users.end(), "user not exist");
        
        if(key == "first_name") {
            users.modify(iter, owner, [&](auto &obj){
                obj.first_name = value;
            });
        } else if(key == "last_name") {
            users.modify(iter, owner, [&](auto &obj){
                obj.last_name = value;
            });
        } else if(key == "birthday") {
            users.modify(iter, owner, [&](auto &obj){
                obj.birthday = value;
            });
        } else if(key == "email") {
            users.modify(iter, owner, [&](auto &obj){
                obj.email = value;
            });
        } else if(key == "phone") {
            users.modify(iter, owner, [&](auto &obj){
                obj.phone = value;
            });
        } else if(key == "country") {
            users.modify(iter, owner, [&](auto &obj){
                obj.country = value;
            });
        } else if(key == "address") {
            users.modify(iter, owner, [&](auto &obj){
                obj.address = value;
            });
        }
    }
    
};

GRAPHENE_ABI(Did, (adduser)(update)(authorize))
