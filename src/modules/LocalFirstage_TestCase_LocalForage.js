import AsyncLogger from "./_LocalFirstage_AsyncLogger.js";
import LocalFirstage_TestCase_Abstract from "./_LocalFirstage_TestCase_Abstract.js";
import LocalFirstage_LocalForage_LocalApi from "./_LocalFirstage_LocalForage_ApiLocal.js";
import LocalFirstage_LocalForage_RemoteApi from "./_LocalFirstage_LocalForage_ApiRemote.js";

function empty() {
}

class LocalFirstage_TestCase_LocalForage extends LocalFirstage_TestCase_Abstract {
    static inheritsTests = true;

    static async newLocal(sName) {
        const local = new LocalFirstage_LocalForage_LocalApi("test_local_" + sName);
        await local.clear();
        return local;
    }

    static async newRemote(sName) {
        const remote = new LocalFirstage_LocalForage_RemoteApi("test_remote_" + sName);
        await remote.clear();
        return remote;
    }
}

const Module = {
    addModuleToTestClasses(aTestClasses) {
        aTestClasses.push(LocalFirstage_TestCase_LocalForage);
    },
};
export {Module as default, LocalFirstage_TestCase_LocalForage};