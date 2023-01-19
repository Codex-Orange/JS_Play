import localForage from "https://cdn.skypack.dev/localforage";
import LocalFirstage_ApiLocal from "./_LocalFirstage_ApiLocal.js";
// =========================
// utility
// =========================
function empty() {
}

// ===================================
// LocalFirstage_LocalForage_ApiLocal
// ===================================
class LocalFirstage_LocalForage_ApiLocal extends LocalFirstage_ApiLocal {
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
        console.log(333, "LocalFirstage_LocalForage_ApiLocal.login()");
    }

    async dbSetItem(sKey, v) {
        // pass through async function
        return this.db_.setItem(sKey, v);
    }

    async dbGetItem(sKey) {
        // pass through async function
        return this.db_.getItem(sKey);
    }

    async dbIterateAll(f) {
        // include deleted
        // f(oAll, sKey, iOneBasedIndex)
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

    //End Class LocalFirstage_LocalForage_ApiLocal
}

export {
    LocalFirstage_LocalForage_ApiLocal as default, LocalFirstage_LocalForage_ApiLocal, localForage,
};