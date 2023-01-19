import AsyncLogger from "./_LocalFirstage_AsyncLogger.js";
import LocalFirstage from "./_LocalFirstage.js";
import LocalFirstage_LocalForage_ApiLocal from "./_LocalFirstage_LocalForage_ApiLocal.js";
import LocalFirstage_LocalForage_ApiRemote from "./_LocalFirstage_LocalForage_ApiRemote.js";

class StorageLocalFirstage {
    constructor() {
        const local = new LocalFirstage_LocalForage_ApiLocal("OFLocal");
        //const remote = new RemoteApi_LocalForage("OFRemote");
        const remote = new LocalFirstage_LocalForage_ApiRemote("Notes");
        this.db_ = new LocalFirstage(local, remote);
    }

    // =========================
    // Login
    // =========================
    async loginAndSync() {
        console.log(111, "StorageLocalFirstage.loginAndSync()", "started");
        await this.db_.login();
        this.db_.syncKeys().then(r => {
            console.log(111, "StorageLocalFirstage.loginAndSync()", "sync done");
        });
        console.log(111, "StorageLocalFirstage.loginAndSync()", "done", "(sync running in background)");
    }

    // =========================
    // Storage API
    // =========================
    async getItem(sKey, zResult, zError) {
        // return p sText, null, or error string
        try {
            const text = await this.db_.getItem(sKey);
            if (text) {
                zResult && zResult.cuPush(text);
            } else {
                zError && zError.cuPush("GETITEM TEXT IS NULL");
            }
            return text;
        } catch (error) {
            zError && zError.cuPush("GETITEM ERROR" + error);
            return "GETITEM ERROR" + error;
        }
    }

    async setItem(sKey, sText, zKeys, zError) {
        // return p asKeys
        try {
            await this.db_.setItem(sKey, sText);
            return this.getKeys(zKeys, zError);
        } catch (error) {
            zError && zError.push(error);
            return error;
        }
    }

    async removeItem(sKey, zKeys, zError) {
        // return p asKeys
        await this.db_.removeItem(sKey);
        return await this.getKeys(zKeys, zError);
    }

    async getKeys(zResult, zError) {
        const asyncLogger = new AsyncLogger("getKeys");
        // return p asKeys
        try {
            const keys = await this.db_.keys(asyncLogger.newLog());
            zResult && zResult.uPush(keys);
            asyncLogger.report();
            return keys;
        } catch (error) {
            zError && zError.push(error);
            asyncLogger.report();
            return error;
        }
    }

    async getAllItems(zResult, zError) {
        // return p asTexts
        const keys = await this.getKeys();
        return this.getItems(keys);
    }

    async getItems(asKeys, zResult, zError) {
        // return p asTexts
        const result = [];
        const promises = asKeys.map((each) => {
            return this.getItem(each).then(r => {
                result.push(r);
            });
        });
        await Promise.all(promises);
        return result;
    }

    // =========================
    // import export API
    // =========================
    async exportToString(sName) {
        return this.db_.exportToString(sName);
    }

    async importFromString(sImport, zKeys, zError) {
        await this.db_.importFromString(sImport);
        return await this.getKeys(zKeys, zError);
    }
}

const Module = {
    addModuleToClasses(oClasses) {
        oClasses.Storage = StorageLocalFirstage;
    }, addModuleToTestClasses(aTestClasses) {
        aTestClasses.push(StorageLocalFirstage);
    },
};
export {Module as default, StorageLocalFirstage};
