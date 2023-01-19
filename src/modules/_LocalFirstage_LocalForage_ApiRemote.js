import localForage from "https://cdn.skypack.dev/localforage";
import LocalFirstage_ApiRemote from "./_LocalFirstage_ApiRemote.js";

class LocalFirstage_LocalForage_ApiRemote extends LocalFirstage_ApiRemote {
    constructor(sName) {
        super();
        const lowerCase = sName.toLowerCase();
        this.db_ = localForage.createInstance({
            name: lowerCase,
        });
    }

    // =========================
    // db access
    // =========================
    async login() {
        console.log(333, "LocalFirstage_LocalForage_ApiRemote.login()");
    }

    async dbSetItem(sKey, v) {
        // v = {value: remoteDeleted: remoteTimestamp:}
        // pass through async function
        return this.db_.setItem(sKey, v);
    }

    async dbGetItem(sKey) {
        // v = {value: remoteDeleted: remoteTimestamp:}
        // pass through async function
        return this.db_.getItem(sKey);
    }

    async dbIterateData(f) {
        // include deleted
        // f(oData {remoteDeleted: remoteTimestamp:}, sKey)
        // {value:} is optional (for db's that are not split)
        // pass through async function
        return this.db_.iterate(f);
    }

    async dbClear() {
        // pass through async function
        return this.db_.clear();
    }

    async dbRemoveItem(sKey) {
        // pass through async function
        return this.db_.removeItem(sKey);
    }

    //Class LocalFirstage_LocalForage_ApiRemote
}

export {
    LocalFirstage_LocalForage_ApiRemote as default, LocalFirstage_LocalForage_ApiRemote, localForage,
};