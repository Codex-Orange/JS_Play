class LocalFirstage_RemoteApi {
    constructor() {
    }

    // =========================
    // remote write API
    // =========================s
    async setItem(sKey, v, fLog = empty) {
        fLog(sKey, v);
        const timestamp = Date.now();
        await this.dbSetItem(sKey, {
            value: v, remoteTimestamp: timestamp,
        });
        return timestamp;
    }

    async removeItem(sKey, fLog = empty) {
        fLog(sKey);
        const timestamp = Date.now();
        await this.dbSetItem(sKey, {
            remoteDeleted: true, remoteTimestamp: timestamp, value: null,
        });
        return timestamp;
    }

    async clear(fLog = empty) {
        fLog();
        return this.dbClear();
    }

    // =========================
    // remote sync API
    // =========================
    async getItem(sKey, fLog = empty) {
        // return value or null
        const data = await this.dbGetItem(sKey);
        let result;
        if (!data) {
            result = null;
        } else if (data.remoteDeleted) {
            result = null;
        } else {
            result = data.value;
        }
        fLog(sKey, result);
        return result;
    }

    async keysWithData(fLog = empty) {
        //include deleted
        const result = {};
        await this.dbIterateData((oData, sKey) => {
            result[sKey] = oData;
        });
        fLog(result);
        return result;
    }

    async getItemData(sKey, fLog = empty) {
        fLog(sKey);
        return this.dbGetItemData(sKey);
    }

    // =========================
    // visitor
    // =========================
    async asVisitTarget() {
        const target = {};
        await this.dbIterateData((oData, sKey) => {
            target[sKey] = oData;
        });
        return target;
    }

    // =========================
    // db access
    // =========================
    async login() {
    }

    async dbSetItem(sKey, v) {
        // v = {value: remoteDeleted: remoteTimestamp:}
    }

    async dbGetItem(sKey) {
        // v = {value: remoteDeleted: remoteTimestamp:}
    }

    async dbGetItemData(sKey) {
        // v = {remoteDeleted: remoteTimestamp:}
        // {value:} is optional (for db's that are not split)
        // optional overwrite by subclass (for db's that are split)
        return this.dbGetItem(sKey);
    }

    async dbIterateData(f) {
        // include deleted
        // f(oData {remoteDeleted: remoteTimestamp:}, sKey)
        // {value:} is optional (for db's that are not split)
    }

    async dbClear() {
    }

    async dbRemoveItem(sKey) {
    }

    //Class LocalFirstage_RemoteApi
}

// =========================
// utility
// =========================
function empty() {
}

export {
    LocalFirstage_RemoteApi as default, LocalFirstage_RemoteApi,
};