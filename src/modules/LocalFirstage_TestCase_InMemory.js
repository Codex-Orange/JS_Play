import LocalFirstage_TestCase_Abstract from "./_LocalFirstage_TestCase_Abstract.js";
import LocalFirstage_InMemory_ApiLocal from "./_LocalFirstage_InMemory_ApiLocal.js";
import LocalFirstage_InMemory_ApiRemote from "./_LocalFirstage_InMemory_ApiRemote.js";

function empty() {
}

class LocalFirstage_TestCase_InMemory extends LocalFirstage_TestCase_Abstract {
    static inheritsTests = true;

    static async newLocal() {
        const storageObject = {};
        const local = new LocalFirstage_InMemory_ApiLocal(storageObject);
        await local.clear();
        return local;
    }

    static async newRemote() {
        const storageObject = {};
        const remote = new LocalFirstage_InMemory_ApiRemote(storageObject);
        await remote.clear();
        return remote;
    }
}

const Module = {
    addModuleToTestClasses(aTestClasses) {
        aTestClasses.push(LocalFirstage_TestCase_InMemory);
    },
};
export {Module as default, LocalFirstage_TestCase_InMemory};