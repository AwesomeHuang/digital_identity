<template>
    <section class="identity scroller" v-if="identity">

        <nav-actions :actions="[
            {event:'submit', text:locale(langKeys.GENERIC_Save)}
        ]" v-if="!saving" v-on:submit="saveIdentity"></nav-actions>

        <!-- Disabling -->
        <section class="panel" style="background:#fff;" v-if="!isNew">
            <figure class="header">{{locale(langKeys.IDENTITY_DisablingHeader)}}</figure>
            <figure class="sub-header" style="margin-bottom:0;">{{locale(langKeys.IDENTITY_DisablingDescription)}}</figure>
        </section>

        <!-- Identity Name -->
        <section class="panel">
            <figure class="header">{{locale(langKeys.IDENTITY_NameHeader)}}</figure>
            <figure class="sub-header" style="margin-bottom:0;">{{locale(langKeys.IDENTITY_NameDescription)}}</figure>
            <cin v-if="identity.ridl > 0 || !registeringIdentity" :text="identity.name" v-on:changed="changed => bind(changed, 'identity.name')" :disabled="true"></cin>
            <cin v-else :placeholder="locale(langKeys.PLACEHOLDER_Name)" :text="newName" v-on:changed="changed => bind(changed, 'newName')"></cin>
            <!--<section v-if="identity.ridl <= 0">-->
                <!--<btn v-if="!isNew && !registeringIdentity"-->
                     <!--:text="registeringIdentity ? locale(langKeys.BUTTON_RegisterIdentity) : locale(langKeys.BUTTON_ChangeName)"-->
                     <!--v-on:clicked="registerIdentity" :is-blue="registeringIdentity" margined="true"></btn>-->

                <!--<btn v-if="!isNew && registeringIdentity"-->
                     <!--:text="locale(langKeys.BUTTON_ClaimIdentity)"-->
                     <!--v-on:clicked="claimIdentity" is-blue="true" margined="true"></btn>-->

                <!--<btn v-if="!isNew && registeringIdentity"-->
                     <!--:text="locale(langKeys.BUTTON_Cancel)"-->
                     <!--v-on:clicked="registeringIdentity = false" margined="true" :is-red="true"></btn>-->
            <!--</section>-->
        </section>

        <!-- Account -->
        <section class="panel" v-if="keypairs.length">
            <figure class="header">{{locale(langKeys.IDENTITY_AccountHeader)}}</figure>
            <figure class="sub-header" style="margin-bottom:0;">{{locale(langKeys.IDENTITY_AccountDescription)}}</figure>

            <sel :disabled="importing" :selected="networks[0]" :options="networks" :parser="(network) => network.name.length ? network.name : network.unique()" v-on:changed="selectNetwork"></sel>

            <cin :disabled="importing"
                 v-if="identity.networkedAccount(selectedNetwork)"
                 :tag="identity.networkedAccount(selectedNetwork).name"
                 :text="identity.networkedAccount(selectedNetwork).name"
                 v-on:untagged="removeAccount"></cin>

            <sel v-if="!identity.networkedAccount(selectedNetwork)"
                 :disabled="importing"
                 :selected="noKeypair"
                 :options="filteredKeypairs()"
                 :parser="keypair => keypair.name"
                 v-on:changed="selectKeypair"></sel>

            <btn :disabled="importing || !selectedKeypair || !selectedKeypair.publicKey.length"
                 :text="locale(langKeys.GENERIC_Import)"
                 v-on:clicked="importAccount" margined="true"></btn>
        </section>

        <!-- NO KEY PAIRS -->
        <section class="panel" v-else>
            <figure class="header">{{locale(langKeys.IDENTITY_NoKeyPairsHeader)}}</figure>
            <figure class="sub-header" style="margin-bottom:0;">{{locale(langKeys.IDENTITY_NoKeyPairsDescription)}}{{locale(langKeys.SETTINGSMENU_Keypairs)}}</figure>
        </section>

        <!-- Personal Information -->
        <section class="panel">
            <figure class="header">{{locale(langKeys.IDENTITY_PersonalHeader)}}</figure>
            <figure class="sub-header" style="margin-bottom:0;">{{locale(langKeys.IDENTITY_PersonalDescription)}}</figure>

            <cin :placeholder="locale(langKeys.PLACEHOLDER_FirstName)" :text="identity.personal.firstname" v-on:changed="changed => bind(changed, 'identity.personal.firstname')"></cin>
            <cin :placeholder="locale(langKeys.PLACEHOLDER_LastName)" :text="identity.personal.lastname" v-on:changed="changed => bind(changed, 'identity.personal.lastname')"></cin>
            <cin :placeholder="locale(langKeys.PLACEHOLDER_Email)" :text="identity.personal.email" v-on:changed="changed => bind(changed, 'identity.personal.email')"></cin>
            <cin :placeholder="locale(langKeys.PLACEHOLDER_BirthDate)" type="date" :text="identity.personal.birthday" v-on:changed="changed => bind(changed, 'identity.personal.birthday')"></cin>
			<cin :placeholder="locale(langKeys.PLACEHOLDER_Phone)" :text="identity.personal.phone" v-on:changed="changed => bind(changed, 'identity.personal.phone')"></cin>

			<cin :placeholder="locale(langKeys.PLACEHOLDER_Country)" :text="identity.personal.country" v-on:changed="changed => bind(changed, 'identity.personal.country')"></cin>
			<cin :placeholder="locale(langKeys.PLACEHOLDER_Address)" :text="identity.personal.address" v-on:changed="changed => bind(changed, 'identity.personal.address')"></cin>
        </section>

		<btn is-blue="true" :text="locale(langKeys.BUTTON_Yes)"
			 v-on:clicked="upload" :key="locationKey(5)"></btn>

    </section>
</template>

<script>
    import { mapActions, mapGetters, mapState } from 'vuex'
    import * as Actions from '../store/constants';
    import {RouteNames} from '../vue/Routing'
    import Identity from '../models/Identity'
    import Scatter from '../models/Scatter'
    import Account from '../models/Account'
    import KeyPair from '../models/KeyPair'
    import {LocationInformation} from '../models/Identity'
    import AlertMsg from '../models/alerts/AlertMsg'
    import IdentityService from '../services/IdentityService'
    import AccountService from '../services/AccountService'
    import EOSKeygen from '../util/EOSKeygen'
    import {Countries} from '../data/Countries'
    import PluginRepository from '../plugins/PluginRepository'
    import {Blockchains} from '../models/Blockchains'
    import RIDLService from '../services/RIDLService'
	import GXClientFactory from "gxclient";
    import crypto from "crypto";


    export default {
        data(){ return {
            identity:null,
            accountNameOrPrivateKey:'',
            isNew:false,
            countries: Countries,
            selectedLocation:null,
            selectedNetwork:null,
            selectedKeypair:null,

            importing:false,
            noKeypair:KeyPair.fromJson({name:'None'}),
            registeringIdentity:false,
            newName:'',
            saving:false,
        }},
        computed: {
            ...mapState([
                'scatter'
            ]),
            ...mapGetters([
                'networks',
                'keypairs'
            ])
        },
        mounted(){
            this.selectNetwork(this.networks[0]);
            const existing = this.scatter.keychain.identities.find(x => x.publicKey === this.$route.query.publicKey);
            if(existing) this.identity = existing.clone();
            else {
                this.identity = Identity.placeholder();
                this.identity.initialize(this.scatter.hash).then(() => {
                    this.identity.name = `${this.locale(this.langKeys.GENERIC_New)} ${this.locale(this.langKeys.GENERIC_Identity)}`;
                })
            }

            this.selectedLocation = this.identity.defaultLocation();

            this.isNew = !existing;
        },
        methods: {
            registerIdentity(){
                if(!this.registeringIdentity) return this.registeringIdentity = true;
            },
            async claimIdentity(){
                const updatedIdentity = await RIDLService.claimIdentity(this.newName, this.identity.clone(), this).catch(() => null);
                if(updatedIdentity) {
                    const scatter = this.scatter.clone();
                    this.identity.name = updatedIdentity.name;
                    scatter.keychain.updateOrPushIdentity(updatedIdentity);
                    await this[Actions.UPDATE_STORED_SCATTER](scatter);
                    this.$router.back();
                }
            },
            filteredKeypairs(){
                return [this.noKeypair].concat(this.keypairs.filter(keypair => keypair.blockchain === this.selectedNetwork.blockchain));
            },
            // This is just a fix for vuejs reusing components and losing uniqueness
            locationKey(index){ return this.identity.locations.indexOf(this.selectedLocation)+index; },
            bind(changed, dotNotation) {
                let props = dotNotation.split(".");
                const lastKey = props.pop();
                props.reduce((obj,key)=> obj[key], this)[lastKey] = changed;
            },
            selectNetwork(network){
                this.selectedNetwork = network;
                this.selectedKeypair = null;
            },
            selectKeypair(keypair){
                this.selectedKeypair = !keypair.publicKey.length ? null : keypair;
            },
            removeAccount(){
                const account = this.identity.accounts[this.selectedNetwork.unique()];
                const formattedAccount = PluginRepository.plugin(this.selectedNetwork.blockchain).accountFormatter(account);

                this[Actions.PUSH_ALERT](AlertMsg.RemovingAccount(formattedAccount)).then(res => {
                    if(!res || !res.hasOwnProperty('accepted')) return false;
                    this.identity.removeAccount(this.selectedNetwork);
                    const refreshHelper = this.selectedNetwork;
                    this.selectedNetwork = null;
                    this.selectedNetwork = refreshHelper;
                })
            },
            importAccount(){
                if(!this.selectedKeypair || !this.selectedKeypair.publicKey.length) return false;
                this.importing = true;
                AccountService.importFromKey(this.selectedKeypair, this.selectedNetwork, this).then(imported => {
                    if(!imported.account){
                        this.importing = false;
                        return false;
                    }
                    this.identity.setAccount(this.selectedNetwork, imported.account);
                    this.importing = false;
                }).catch(() => this.importing = false);
            },
            setAsDefaultLocation(){
                this.identity.defaultLocation().isDefault = false;
                this.selectedLocation.isDefault = true;
            },
            addNewLocation(){
                if(!this.identity.locations.find(location => location.isDefault)){
                    this.identity.locations[0].isDefault = true;
                }

                const newLocation = LocationInformation.placeholder();
                this.identity.locations.push(newLocation);
                this.selectedLocation = newLocation;
            },
            removeSelectedLocation(){
                const wasDefault = this.selectedLocation.isDefault;
                const index = this.identity.locations.indexOf(this.selectedLocation);
                this.identity.locations.splice(index, 1);
                if(wasDefault) this.identity.locations[0].isDefault = true;
                this.selectedLocation = this.identity.locations[0];
            },

			upload() {
                const CryptoJS = require("crypto-js");
				let tripledes = require("crypto-js/tripledes");

				console.log(this.selectedLocation)
				console.log(this.identity.personal)
                
                function sha256(str) {
                    /*var hash = crypto.createHash("sha256");*/
                    /*hash.update(str);*/
                    /*return hash.digest("hex");*/
					return CryptoJS.SHA256(str).toString();
                }

				function decrypt(ciphertext, key) {
					var key_hex = CryptoJS.enc.Utf8.parse(key);
					let encryptedHexStr = CryptoJS.enc.Hex.parse(ciphertext);
					let srcs = CryptoJS.enc.Base64.stringify(encryptedHexStr);
					let decrypt = CryptoJS.AES.decrypt(srcs, key_hex, { mode: CryptoJS.mode.ECB, padding: CryptoJS.pad.Pkcs7 });
					let decryptedStr = decrypt.toString(CryptoJS.enc.Utf8);
					return decryptedStr.toString();
				}

				function encrypt(message, key) {
					var key_hex = CryptoJS.enc.Utf8.parse(key);
					let srcs = CryptoJS.enc.Utf8.parse(message);
					let encrypted = CryptoJS.AES.encrypt(srcs, key_hex,
						{
							mode: CryptoJS.mode.ECB,
							padding: CryptoJS.pad.Pkcs7
						}
					);
					return encrypted.ciphertext.toString().toUpperCase();
				}

				/*const private_key = "5JST8WrSnHd9zEJSvVW7tD8bMZ2z4UKVrv1aoBStydpJo9oU5J7";*/
				const private_key = "5KSZfMozPQqi6NuynmoUw8Ejh3K1qEgYhL83fLDyRryDg4sGuku";

                //console.log(sha256(private_key));
                //9fa8ff92a5f4b1b2d93e624c1dec175482264651e12718f75257267ef7e58730

                const fname_key = sha256(private_key + "first_name");
                const lname_key = sha256(private_key + "last_name");
                const birthday_key = sha256(private_key + "birthday");
                const email_key = sha256(private_key + "email");
                const phone_key = sha256(private_key + "phone");
                const country_key = sha256(private_key + "country");
                const address_key = sha256(private_key + "address");

				console.log(fname_key);
                let ciphertext = encrypt("shit", fname_key);
				console.log("ciphertext = ", ciphertext);
                let secret = decrypt(ciphertext, fname_key);
				console.log("secret = ", secret);

				console.log(encrypt(this.identity.personal.birthday, birthday_key));

				const account_name = "bitrocket666";
				const contract_name = "did008";
				const asset_precicion = 5;

				let client = GXClientFactory.instance({keyProvider:private_key, account:account_name,network:"wss://testnet.gxchain.org"});

				client.callContract(contract_name, "adduser", {
					first_name: encrypt(this.identity.personal.firstname, fname_key),
					last_name: encrypt(this.identity.personal.lastname, lname_key),
					birthday: encrypt(this.identity.personal.birthday, birthday_key),
					email: encrypt(this.identity.personal.email, email_key),
					phone: encrypt(this.identity.personal.phone, phone_key),
					country: encrypt(this.identity.personal.country, country_key),
					address: encrypt(this.identity.personal.address, address_key),
				}, 0, true).then(
					tx => {
						console.log(tx);
					}
				).catch(err => {
					console.log(err);
				});

			},
            async saveIdentity(){
                this.saving = true;

                if(this.isNew) {
                    const identified = await RIDLService.identify(this.identity.publicKey);
                    if(!identified) return null;
                    this.identity.name = identified;
                }

                //TODO: More Error handling
                // -----
                // Location names must not be empty
                // * Email
                // * State ( if exists, only 2 characters )

                const scatter = this.scatter.clone();
                scatter.keychain.updateOrPushIdentity(this.identity);
                this[Actions.UPDATE_STORED_SCATTER](scatter).then(() => this.$router.back());

            },
            ...mapActions([
                Actions.SIGN_RIDL,
                Actions.UPDATE_STORED_SCATTER,
                Actions.PUSH_ALERT
            ])
        }
    }
</script>

<style lang="scss">
    .identity {
        font-family:'Open Sans', sans-serif;



        .panel {
            padding:20px;

            &:not(:last-child){
                border-bottom:1px solid #eaeaea;
            }

            .header {
                color:#cecece;
                font-size:11px;
                padding-bottom:5px;
                margin-top:-5px;
                margin-bottom:10px;
                border-bottom:1px solid #eaeaea;
            }

            .sub-header {
                color: #505050;
                font-size:11px;
                margin-bottom:20px;
            }
        }
    }
</style>
