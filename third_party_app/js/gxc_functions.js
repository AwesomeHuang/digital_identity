const network = {
    blockchain: 'gxc',
    protocol: 'https',
    host: 'testnet.gxchain.org',
    port: 443,
    chainId: 'c2af30ef9340ff81fd61654295e98a1ff04b23189748f86727d0b26b40bb0ff4'
}
const requiredFields = {
    personal: ['firstname', 'lastname', 'email', 'birthdate']
};
const accountNameElem = document.getElementById('accountName')
let gscatter, gxc;
function setAccountName(account) {
    //accountNameElem.innerText = account.name
}
function clearAccountName(account) {
    accountNameElem.innerText = ''
}
GScatterJS.gscatter.connect('exampleApp').then(async connected => {
    if (!connected) return false;
    let account
    gscatter = GScatterJS.gscatter;
    // require version, if user's plugin is less than the version, when operate, plugin will prompt a tips
    // gscatter.requireVersion('9.9.9')
    // when user not login, you could use api which not need identity, like generateKey
    gxc = gscatter.gxc(network);
    // if identity exist, means user has authorize the website and already unlock, you could display user info then
    if (gscatter.identity) {
        account = gscatter.identity.accounts.find(x => x.blockchain === 'gxc');
        setAccountName(account)
    }
});
window.login = async () => {
    let identity
    try {
        // if you want user add the network, you could call suggestNetwork, if user already has, nothing happen
        await gscatter.suggestNetwork(network);
    } catch (err) {
        // user refuse or close the prompt window
        console.error(err)
        return;
    }
    try {
        // required fields, it will appear at gscatter.identity
        identity = await gscatter.getIdentity({ accounts: [network] })
    } catch (err) {
        // user refuse or close the prompt window
        console.error(err)
        return;
    }
    // you could get gscatter.identity.accounts because of { accounts: [network] } before
    const account = gscatter.identity.accounts.find(x => x.blockchain === 'gxc');
    setAccountName(account)
};
window.logout = async () => {
    try {
        await gscatter.forgetIdentity();
        clearAccountName()
    } catch (err) {
        // no identity found
        console.error(err)
    }
};
window.transfer = async () => {
    // if user don't have these requiredFields, the operation would be cancel, and go to catch area
    gxc.transfer('youxiu123', 'memo info', '1 GXC', true).then(trx => {
        console.log(`transfer success`, trx);
    }).catch(error => {
        if (error.code === 432) {
            alert('you don\'t authorize identity!')
        }
        console.error(error);
    });
};
window.contract = () => {
    gxc.callContract('lzydododo', 'hi', { user: 'lzy' }, 0, true).then(trx => {
        console.log(`call contract success`, trx);
        window.location.href="./index.html"
    }).catch(error => {
        console.error(error);
    });
}
window.vote = () => {
    gxc.vote(['math-wallet-test', 'gxc-pacific'], true).then(trx => {
        console.log(`vote success`, trx);
    }).catch(error => {
        console.error(error);
    });
}
window.generateKey = async () => {
    const key = await gxc.generateKey()
    console.log(key)
}
window.queryAccount = async () => {
    const account = await gxc.getAccount('lzydophin94')
    console.log(account)
}
window.getBalance = () => {
    const account = gscatter.identity.accounts.find(x => x.blockchain === 'gxc');
    gxc.getAccountBalances(account.name).then(res => {
        console.log('balances:', res)
    }).catch(err => {
        console.error(err)
    })
}
window.checkExtension = () => {
    // don't have extension
    if (!GScatterJS.gscatter.isExtension) {
        var flag = confirm('You haven\'t download extension, confirm to download')
        if (flag) {
            // if installed, nothing hapen
            GScatterJS.openExtensionPage()
        }
    }
}
window.getArbitrarySignature = async () => {
    const publicKey = gscatter.identity.publicKey
    try{
        const sig = await gscatter.getArbitrarySignature(publicKey, 'max data size is 64 byte')
        console.log(sig)
    }catch(err){
        console.log(err)
    }

}

//const CryptoJS = require("crypto-js");
//const crypto = require("crypto");

const private_key = "5JST8WrSnHd9zEJSvVW7tD8bMZ2z4UKVrv1aoBStydpJo9oU5J7";

window.sha256 = (str) => {
	//var hash = crypto.createHash("sha256");
	//hash.update(str);
	//return hash.digest("hex");
	return CryptoJS.SHA256(str).toString();
}

const fname_key = sha256(private_key + "first_name");
const lname_key = sha256(private_key + "last_name");
const birthday_key = sha256(private_key + "birthday");
const email_key = sha256(private_key + "email");
const phone_key = sha256(private_key + "phone");
const country_key = sha256(private_key + "country");
const address_key = sha256(private_key + "address");

window.encrypt = (message, key) => {
	var key_hex = CryptoJS.enc.Utf8.parse(key);
	var encrypted = CryptoJS.DES.encrypt(message, key_hex, {
		mode: CryptoJS.mode.ECB,
		padding: CryptoJS.pad.Pkcs7
	});
	return {
		key: key_hex,
		value: encrypted.toString()
	}
}

window.decrypt = (message, key) => {
/*    var plaintext = CryptoJS.DES.decrypt(message, key, {
        mode: CryptoJS.mode.ECB,
        padding: CryptoJS.pad.Pkcs7
    })
    return plaintext.toString(CryptoJS.enc.Utf8)
	*/
	return message;
}

window.query = () => {
    gxc.getTableObjects('did004','user',0,100).then(trx => {

		let first_name = decrypt(trx[0].first_name, fname_key);
		let last_name = decrypt(trx[0].last_name, lname_key);
		let birthday = decrypt(trx[0].birthday, birthday_key);
		let email = decrypt(trx[0].email, email_key);
		let phone = decrypt(trx[0].phone, phone_key);
		let country = decrypt(trx[0].country, country_key);
		let address = decrypt(trx[0].address, address_key);
        document.getElementById('user_name').innerText = first_name + last_name;
        document.getElementById('birthday').birthday = birthday;
        document.getElementById('email').email = email;
        document.getElementById('phone_number').phone = phone;
        document.getElementById('identity').country = country;
        document.getElementById('address_home').address = address;
        //alert(trx[0].owner);
    }).catch(error => {
        console.error(error);
    });
}
window.auto_query = () => {
    gxc.getTableObjects('did004', 'user', 0, 100).then(trx => {
        document.getElementById('auto_user_name').innerText = trx[0].first_name + trx[0].last_name;
        document.getElementById('auto_birthday').innerText = trx[0].birthday;
        document.getElementById('auto_email').innerText = trx[0].email;
        document.getElementById('auto_phone_number').innerText = trx[0].phone;
        document.getElementById('auto_identity').innerText = trx[0].country;
        document.getElementById('auto_address_home').innerText = trx[0].address;
        //alert(trx[0].owner);
    }).catch(error => {
        console.error(error);
    });
}
