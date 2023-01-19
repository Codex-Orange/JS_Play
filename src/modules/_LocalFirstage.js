import _ from "https://cdn.skypack.dev/lodash";
// =========================
// utility
// =========================
function pWithTimeout(p, iMilliseconds = 1000 * 30) {
    // wrap promise in a timeout (default 30 seconds)
    const pTimeout = new Promise((fResolve, fReject) => {
        setTimeout(fReject, iMilliseconds);
    });
    return Promise.race([p, pTimeout]);
}

function empty() {
}

// =========================
// LocalFirstage
// =========================
class LocalFirstage {
    constructor(oLocal, oRemote) {
        this.local_ = oLocal;
        this.remote_ = oRemote;
    }

    // =========================
    // login and sync
    // =========================
    async login() {
        // return p fResolve() or fReject()
        await Promise.all([this.local_.login(), this.remote_.login()]);
    }

    // ======================================
    // public write API (same as LocalForage)
    // ======================================
    async setItemOld(sKey, v, fLog = empty) {
        fLog(sKey, v);
        await this.local_.setItem(sKey, v, fLog);
        try {
            const timestamp = await pWithTimeout(this.remote_.setItem(sKey, v, fLog));
            await this.local_.setTimestamp(sKey, timestamp, fLog);
        } catch (error) {
            // do not blow up on remote timeout or error
            fLog("ERROR", error);
        }
        return this;
    }

    async setItem(sKey, v, fLog = empty) {
        fLog(sKey, v);
        try {
            await this.local_.setItem(sKey, v, fLog);
            const data = await this.combinedItemData(sKey, fLog);
            await this.syncKey(sKey, data, fLog);
        } catch (error) {
            // do not blow up on remote timeout or error
            console.log("ERROR LocalFirstage setItem", error);
            fLog("ERROR LocalFirstage setItem", error);
        }
        return this;
    }

    async removeItem(sKey, fLog = empty) {
        fLog(sKey);
        await this.local_.removeItem(sKey, fLog);
        try {
            const timestamp = await pWithTimeout(this.remote_.removeItem(sKey, fLog));
            await this.local_.setTimestamp(sKey, timestamp, fLog);
        } catch (error) {
            // do not blow up on remote timeout or error
            fLog("ERROR", error);
        }
        return this;
    }

    async clear(fLog = empty) {
        fLog();
        await this.local_.clear(fLog);
        await this.remote_.clear(fLog);
        return this;
    }

    // ======================================
    // public read API (same as LocalForage)
    // ======================================
    async getItem(sKey, fLog = empty) {
        fLog(sKey);
        return this.local_.getItem(sKey, fLog);
    }

    async keys(fLog = empty) {
        fLog();
        return this.local_.keys(fLog);
    }

    async length(fLog = empty) {
        fLog();
        return this.local_.length(fLog);
    }

    async iterate(f, fLog = empty) {
        // f (v, sKey, iOneBasedIndex)
        return this.local_.iterate(f, fLog);
    }

    // =========================
    // sync API
    // =========================
    async syncKeys(fLog = empty) {
        console.log(222, "LocalFirstage.syncKeys()", "started");
        fLog();
        try {
            const combinedData = await pWithTimeout(this.combinedData(fLog));
            console.log(222, "===== Syncing " + Object.keys(combinedData).length + " keys =====");
            const promises = Object.keys(combinedData).sort().map((each) => {
                const data = combinedData[each];
                return this.syncKey(each, data, fLog);
            });
            await Promise.all(promises);
        } catch (error) {
            // do not blow up on remote timeout or error
            fLog("ERROR", error);
        }
        console.log(222, "LocalFirstage.syncKeys()", "done");
    }

    async syncKey(sKey, oData, fLog = empty) {
        const state = this.dataState(oData, fLog);
        if (state !== "NEITHER_CHANGED") {
            //console.log(444, each, state);
        }
        if (state === "LOCAL_CHANGED") {
            return this.syncLocalChanged(sKey, oData, fLog);
        } else if (state === "BOTH_CHANGED") {
            return this.syncBothChanged(sKey, oData, fLog);
        } else if (state === "REMOTE_CHANGED") {
            return this.syncRemoteChanged(sKey, oData, fLog);
        } else if (state === "NEITHER_CHANGED") {
            return this.syncNeitherChanged(sKey, oData, fLog);
        } else {
            return this.syncError(sKey, oData, fLog);
        }
    }

    async removeDeletedKeys(fLog = empty) {
        // remove keys deleted both local and remote
        // assume all locals are up to date with remote
        // non-deleted values on currently offline locals will repopulate the remote
        const combinedData = await pWithTimeout(this.combinedData(fLog));
        const promises = Object.keys(combinedData).sort().map(each => {
            const data = combinedData[each];
            if (data.localDeleted && data.remoteDeleted) {
                this.local_.dbRemoveItem(each);
                this.remote_.dbRemoveItem(each);
                // console.log(6666, each, "=== CLEARED KEY (WAS DELETED LOCAL AND REMOTE) ===");
            }
        });
    }

    // =========================
    // sync utility
    // =========================
    async combinedData(fLog = empty) {
        const local = await this.local_.keysWithData(fLog);
        const remote = await this.remote_.keysWithData(fLog);
        const result = _.merge({}, local, remote);
        fLog(result);
        return result;
    }

    async combinedItemData(sKey, fLog = empty) {
        const local = await this.local_.getItemData(sKey);
        const remote = await this.remote_.getItemData(sKey);
        const result = _.merge({}, local, remote);
        fLog(result);
        return result;
    }

    dataState(oData, fLog = empty) {
        let result;
        // RT remote timeStamp, LC localChanged, LT local timeStamp
        // !RT + !LC + !LT never happens - it means no local and no remote entry
        if (!oData.remoteTimestamp) {
            // !RT + !LC + LT       (error or new remote - normally LT is never later)
            // !RT + LC + !LT
            // !RT + LC + LT        (error or new remote - normally LT is never later)
            result = "LOCAL_CHANGED";
        } else if (oData.localChanged) {
            // RT + LC
            if (oData.localTimestamp === oData.remoteTimestamp) {
                // RT= + LC + LT=
                result = "LOCAL_CHANGED";
            } else {
                // RT + LC + !LT
                // RT> + LC + LT<
                // RT< + LC + LT>   (error or new remote - normally LT is never later)
                result = "BOTH_CHANGED";
            }
        } else {
            // RT + !LC
            if (oData.localTimestamp === oData.remoteTimestamp) {
                // RT= + !LC + LT=
                result = "NEITHER_CHANGED";
            } else if (oData.localTimestamp > oData.remoteTimestamp) {
                // RT< + !LC + LT>   (error or new remote - normally LT is never later)
                result = "BOTH_CHANGED";
            } else {
                // RT + !LC + !LT
                // RT> + !LC + LT<
                result = "REMOTE_CHANGED";
            }
        }
        fLog(result);
        return result;
    }

    dataStateOld(oData, fLog = empty) {
        let result;
        if (oData.localChanged) {
            if (!oData.localTimestamp) {
                if (oData.remoteTimestamp && !oData.remoteDeleted) {
                    result = "BOTH_CHANGED";
                } else {
                    result = "LOCAL_CHANGED";
                }
            } else if (!oData.remoteTimestamp) {
                result = "LOCAL_CHANGED";
            } else if (oData.localTimestamp === oData.remoteTimestamp) {
                result = "LOCAL_CHANGED";
            } else if (oData.localTimestamp < oData.remoteTimestamp) {
                result = "BOTH_CHANGED";
            } else {
                result = "DATA_ERROR";
            }
        } else if (!oData.localTimestamp) {
            result = "REMOTE_CHANGED";
        } else if (oData.localTimestamp < oData.remoteTimestamp) {
            result = "REMOTE_CHANGED";
        } else if (oData.localTimestamp === oData.remoteTimestamp) {
            result = "NEITHER_CHANGED";
        } else {
            result = "DATA_ERROR";
        }
        fLog(result);
        return result;
    }

    async syncLocalChanged(sKey, oData, fLog = empty) {
        fLog(sKey, oData);
        if (oData.localDeleted) {
            try {
                const timestamp = await pWithTimeout(this.remote_.removeItem(sKey, fLog));
                await this.local_.setTimestamp(sKey, timestamp, fLog);
            } catch (error) {
                // do not blow up on remote timeout or error
                fLog("ERROR", error);
            }
        } else {
            const value = await this.local_.getItem(sKey, fLog);
            try {
                const timestamp = await pWithTimeout(this.remote_.setItem(sKey, value, fLog));
                await this.local_.setTimestamp(sKey, timestamp, fLog);
            } catch (error) {
                // do not blow up on remote timeout or error
                fLog("ERROR", error);
            }
        }
    }

    async syncRemoteChanged(sKey, oData, fLog = empty) {
        fLog(sKey, oData);
        if (oData.remoteDeleted) {
            await this.local_.removeItem(sKey, fLog);
            await this.local_.setTimestamp(sKey, oData.remoteTimestamp, fLog);
        } else {
            const value = await this.remote_.getItem(sKey, fLog);
            await this.local_.setItem(sKey, value, fLog);
            await this.local_.setTimestamp(sKey, oData.remoteTimestamp, fLog);
        }
    }

    async syncBothChanged(sKey, oData, fLog = empty) {
        fLog(sKey, oData);
        // if both are (independently) deleted, do nothing
        // if one is deleted, the non-deleted value wins
        // if two values, remote wins, and local is renamed
        if (oData.localDeleted && oData.remoteDeleted) {
            // do nothing
        } else if (oData.localDeleted) {
            await this.syncRemoteChanged(sKey, oData, fLog);
        } else if (oData.remoteDeleted) {
            await this.syncLocalChanged(sKey, oData, fLog);
        } else {
            await this.saveCollidedLocalChanged(sKey, fLog);
            await this.syncRemoteChanged(sKey, oData, fLog);
        }
    }

    syncNeitherChanged(sKey, oData, fLog = empty) {
        fLog(sKey, oData);
    }

    syncError(sKey, oData, fLog = empty) {
        fLog(sKey, oData);
    }

    async saveCollidedLocalChanged(sKey, fLog = empty) {
        fLog(sKey);
        const value = await this.local_.getItem(sKey, fLog);
        const newKey = "{LOCAL}/" + sKey;
        const newValue = "{LOCAL}/" + value;
        await this.local_.setItem(newKey, newValue, fLog);
    }

    // =========================
    // import export API
    // =========================
    exportDivider() {
        return "\n=====//=====//=====\n";
    }

    async exportToString(sName, fLog = empty) {
        const divider = this.exportDivider();
        let string = sName;
        await this.iterate((v, sKey, iOneBasedIndex) => {
            string += divider;
            string += v.toString();
        });
        fLog(string);
        return string;
    }

    async importFromString(sImport, fLog = empty) {
        fLog();
        const secondLine = sImport.split("\n")[1];
        const delimiter = "\n" + secondLine + "\n";
        const items = sImport.split(delimiter);
        const name = items[0];
        const texts = items.slice(1);
        const localData = await this.local_.keysWithData(fLog);
        const promises = texts.map((each) => {
            const importKey = each.split("\n")[0].trim();
            return this.importText(importKey, each, localData[importKey], fLog);
        });
        await Promise.all(promises);
    }

    async importText(sImportKey, sText, oLocalData, fLog = empty) {
        //oLocalData {localDeleted: localTimestamp: value:}
        fLog(sImportKey);
        if (oLocalData && !oLocalData.localDeleted) {
            // exists in storage
            const existingText = await this.getItem(sImportKey, fLog);
            if (existingText !== sText) {
                // text not the same - so store with IMPORT key
                const newKey = "IMPORT/" + sImportKey;
                const newText = "IMPORT/" + sText;
                await this.setItem(newKey, newText, fLog);
            }
        } else {
            // does not exist in storage - so store
            await this.setItem(sImportKey, sText, fLog);
        }
    };

    // =========================
    // visitor API
    // todo replace with async visitor
    // =========================
    async asVisitTarget() {
        const constructor = this.constructor;
        const target = new constructor();
        target.local_ = await this.local_.asVisitTarget();
        target.remote_ = await this.remote_.asVisitTarget();
        return target;
    }
}

export {
    LocalFirstage as default, LocalFirstage,
};