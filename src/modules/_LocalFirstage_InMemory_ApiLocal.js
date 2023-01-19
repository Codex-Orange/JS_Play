import LocalFirstage_ApiLocal from "./_LocalFirstage_ApiLocal.js";

class LocalFirstage_InMemory_ApiLocal extends LocalFirstage_ApiLocal {
    constructor() {
        super();
        this.db_ = {};
    }

    // =========================
    // db access
    // =========================
    async login() {
        console.log(333, "LocalFirstage_InMemory_ApiLocal.login()");
    }

    async dbSetItem(sKey, v) {
        this.db_[sKey] = v;
    }

    async dbGetItem(sKey) {
        return this.db_[sKey];
    }

    async dbIterateAll(f) {
        // include deleted
        // f(oAll, sKey, iOneBasedIndex)
        // pass through async function
        Object.keys(this.db_).forEach((each, index) => {
            f(this.db_[each], each, index + 1);
        });
    }

    async dbClear() {
        for (const member in this.db_) delete this.db_[member];
    }

    async dbRemoveItem(sKey) {
        delete this.db_[sKey];
    }

    //End Class LocalFirstage_InMemory_ApiLocal
}

// =========================
// utility
// =========================
function empty() {
}

export {
    LocalFirstage_InMemory_ApiLocal as default, LocalFirstage_InMemory_ApiLocal,
};