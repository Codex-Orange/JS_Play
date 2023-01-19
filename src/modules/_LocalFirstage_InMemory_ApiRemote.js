import LocalFirstage_ApiRemote from "./_LocalFirstage_ApiRemote.js";

class LocalFirstage_InMemory_ApiRemote extends LocalFirstage_ApiRemote {
    constructor() {
        super();
        this.db_ = {};
    }

    // =========================
    // db access
    // =========================
    async login() {
        console.log(333, "LocalFirstage_InMemory_ApiRemote.login()");
    }

    async dbSetItem(sKey, v) {
        this.db_[sKey] = v;
    }

    async dbGetItem(sKey) {
        return this.db_[sKey];
    }

    async dbIterateData(f) {
        // include deleted
        // f(oData {remoteDeleted: remoteTimestamp:}, sKey)
        // {value:} is optional (for db's that are not split)
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

    //End Class LocalFirstage_InMemory_ApiRemote
}

// =========================
// utility
// =========================
function empty() {
}

export {
    LocalFirstage_InMemory_ApiRemote as default, LocalFirstage_InMemory_ApiRemote,
};