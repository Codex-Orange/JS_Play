class LocalFirstage_LocalApi {
    constructor() {
    }

    // =========================
    // local write API
    // =========================
    async setItem(sKey, v, fLog = empty) {
        fLog(sKey, v);
        return this.addRemoveProperties(sKey, {
            localChanged: true, value: v,
        }, ["localDeleted"]);
    }

    async removeItem(sKey, fLog = empty) {
        fLog(sKey);
        return this.addRemoveProperties(sKey, {
            localChanged: true, localDeleted: true,
        }, ["value"]);
    }

    async clear(fLog = empty) {
        fLog();
        return this.dbClear();
    }

    // =========================
    // local read API
    // (do not include deleted)
    // =========================
    async getItem(sKey, fLog = empty) {
        // return value or null
        const data = await this.dbGetItem(sKey);
        let result;
        if (!data) {
            result = null;
        } else if (data.localDeleted) {
            result = null;
        } else {
            result = data.value;
        }
        fLog(sKey, result);
        return result;
    }

    async keys(fLog = empty) {
        const result = [];
        await this.dbIterateValue((v, sKey) => {
            result.push(sKey);
        });
        fLog(result);
        return result;
    }

    async length(fLog = empty) {
        const keys = await this.keys();
        const length = keys.length;
        fLog(length);
        return length;
    }

    async iterate(f, fLog = empty) {
        // do not include deleted
        // f(v, sKey, iOneBasedIndex)
        // pass through async
        fLog();
        return this.dbIterateValue(f);
    }

    // =========================
    // local sync API
    // (include deleted)
    // =========================
    async setTimestamp(sKey, iTimestamp, fLog = empty) {
        fLog(sKey, iTimestamp);
        return this.addRemoveProperties(sKey, {
            localTimestamp: iTimestamp,
        }, ["localChanged"]);
    }

    async keysWithData(fLog = empty) {
        // include deleted
        // do not include value
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
    // utility
    // =========================
    async addRemoveProperties(sKey, oAdd, aRemove = [], fLog = empty) {
        fLog(sKey, oAdd, aRemove);
        const oldData = await this.dbGetItem(sKey) || {};
        const newData = Object.assign({}, oldData, oAdd);
        aRemove.forEach(each => {
            delete newData[each];
        });
        return this.dbSetItem(sKey, newData);
    }

    // =========================
    // visitor
    // (include deleted)
    // =========================
    async asVisitTarget() {
        const target = {};
        await this.dbIterateAll((oAll, sKey) => {
            target[sKey] = oAll;
        });
        return target;
    }

    // =========================
    // db access
    // =========================
    async login() {
    }

    async dbSetItem(sKey, v) {
        // v = {value: localDeleted: localTimestamp:}
    }

    async dbGetItem(sKey) {
        // v = {value: localDeleted: localTimestamp:}
    }

    async dbGetItemData(sKey) {
        // v = {localDeleted: localTimestamp:}
        // {value:} is optional (for db's that are not split)
        // optional overwrite by subclass (for db's that are split)
        return this.dbGetItem(sKey);
    }

    async dbIterateAll(f) {
        // include deleted
        // f(oAll {value: localDeleted: localTimestamp:}, sKey, iOneBasedIndex)
    }

    async dbIterateValue(f) {
        // do not include deleted
        // f(v, sKey, iOneBasedIndex)
        // pass through async
        // optional overwrite by subclass
        return this.dbIterateAll((oAll, sKey, iOneBasedIndex) => {
            if (!oAll.localDeleted) {
                f(oAll.value, sKey, iOneBasedIndex);
            }
        });
    }

    async dbIterateData(f) {
        // include deleted
        // f(oData {localDeleted: localTimestamp:}, sKey)
        // {value:} is optional (for db's that are not split)
        // optional overwrite by subclass (for db's that are split)
        // pass through async
        return this.dbIterateAll(f);
    }

    async dbClear() {
    }

    async dbRemoveItem(sKey) {
    }

    //End Class LocalFirstage_ApiLocal
}

// =========================
// utility
// =========================
function empty() {
}

export {
    LocalFirstage_LocalApi as default, LocalFirstage_LocalApi,
};