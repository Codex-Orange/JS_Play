import {PrintVisitor} from "./Visitor.js";
import AsyncLogger from "./_LocalFirstage_AsyncLogger.js";
import LocalFirstage from "./_LocalFirstage.js";

function empty() {
}

const asyncTestTimeout = 15000;

class LocalFirstage_TestCase {
    // static async newLocal() {
    //     const storageObject = {};
    //     const local = new LocalFirstage_InMemory_ApiRemote(storageObject);
    //     await local.clear();
    //     return local;
    // }
    //
    // static async newRemote() {
    //     const storageObject = {};
    //     const remote = new LocalFirstage_InMemory_ApiRemote(storageObject);
    //     await remote.clear();
    //     return remote;
    // }
    //
    static async newLocalFirstage(sName, fLog = empty) {
        // local and remote need to be uniquely named per test, because tests are async in parallel
        // and will pollute each other if they use the same databases
        fLog();
        const local = await this.newLocal(sName);
        const remote = await this.newRemote(sName);
        const localFirstage = new LocalFirstage(local, remote);
        const data = {"one": "one\n\none", "two": 22};
        for (const [key, value] of Object.entries(data)) {
            await localFirstage.setItem(key, value, fLog);
        }
        return localFirstage;
    }

    static async async_test_localApi(t) {
        let result;
        const name = "async_test_localApi";
        // start
        t.asyncStart(asyncTestTimeout);
        const local = await this.newLocal(name);
        await local.setItem("one", "one\n\none");
        result = await local.getItem("one");
        t.eq(result, "one\n\none");
        // stop
        t.asyncStop();
    }

    static async async_test_remoteApi(t) {
        let result;
        const name = "async_test_remoteApi";
        const asyncLogger = new AsyncLogger(name);
        // start
        t.asyncStart(asyncTestTimeout);
        const remote = await this.newRemote(name);
        const timestamp = await remote.setItem("one", "one\n\none", asyncLogger.newLog());
        result = await remote.dbGetItem("one", asyncLogger.newLog());
        t.eq(result.value, "one\n\none");
        t.eq(result.remoteTimestamp, timestamp);
        // asyncLogger.addReportString(PrintVisitor.visit(await remote.asVisitTarget()));
        // asyncLogger.report();
        // stop
        t.asyncStop();
    }

    static async async_test_combinedData(t) {
        const name = "async_test_combinedData";
        const asyncLogger = new AsyncLogger(name);
        // start
        t.asyncStart(asyncTestTimeout);
        const localFirstage = await this.newLocalFirstage(name, asyncLogger.newLog());
        const data = await localFirstage.combinedData(asyncLogger.newLog());
        // report
        asyncLogger.addReportString(PrintVisitor.visit(await localFirstage.asVisitTarget()));
        asyncLogger.addReportString("Combined Data", PrintVisitor.visit(data));
        asyncLogger.report();
        // stop
        t.asyncStop();
    }

    static async async_test_length_iterate(t) {
        let result;
        const name = "async_test_length_iterate";
        const asyncLogger = new AsyncLogger(name);
        // start
        t.asyncStart(asyncTestTimeout);
        const localFirstage = await this.newLocalFirstage(name);
        result = await localFirstage.length(asyncLogger.newLog());
        t.eq(result, 2);
        result = {};
        await localFirstage.iterate((v, sKey, i) => {
            result[sKey] = v;
            result[sKey + "_index"] = i;
        }, asyncLogger.newLog());
        t.eq(result.one, "one\n\none");
        t.eq(result.two, 22);
        t.eq(result["one_index"], 1);
        t.eq(result["two_index"], 2);
        // report
        asyncLogger.addReportString(PrintVisitor.visit(await localFirstage.asVisitTarget()));
        asyncLogger.report();
        // stop
        t.asyncStop();
    }

    static async async_test_report(t) {
        const name = "async_test_report";
        const asyncLogger = new AsyncLogger(name);
        // start
        t.asyncStart(asyncTestTimeout);
        const localFirstage = await this.newLocalFirstage(name);
        // report
        asyncLogger.addReportString(PrintVisitor.visit(await localFirstage.asVisitTarget()));
        asyncLogger.report();
        // stop
        t.asyncStop();
    }

    static async async_test_getItem(t) {
        let result;
        const name = "async_test_getItem";
        const asyncLogger = new AsyncLogger(name);
        // start
        t.asyncStart(asyncTestTimeout);
        const localFirstage = await this.newLocalFirstage(name);
        result = await localFirstage.getItem("one", asyncLogger.newLog());
        t.eq(result, "one\n\none");
        result = await localFirstage.getItem("two", asyncLogger.newLog());
        t.eq(result, 22);
        result = await localFirstage.getItem("xxxx", asyncLogger.newLog());
        t.eq(result, null);
        // report
        asyncLogger.addReportString(PrintVisitor.visit(await localFirstage.asVisitTarget()));
        asyncLogger.report();
        // stop
        t.asyncStop();
    }

    static async async_test_getItemData(t) {
        let result;
        const name = "async_test_getItemData";
        const asyncLogger = new AsyncLogger(name);
        // start
        t.asyncStart(asyncTestTimeout);
        const localFirstage = await this.newLocalFirstage(name);
        // test
        result = await localFirstage.remote_.dbGetItemData("one", asyncLogger.newLog());
        t.eq(Object.keys(result), ['value', 'remoteTimestamp']);
        // report
        const target = await localFirstage.asVisitTarget();
        asyncLogger.addReportString(PrintVisitor.visit(target));
        asyncLogger.report();
        // stop
        t.asyncStop();
    }

    static async async_test_removeItem_keys(t) {
        let result;
        const name = "async_test_removeItem_keys";
        const asyncLogger = new AsyncLogger(name);
        // start
        t.asyncStart(asyncTestTimeout);
        const localFirstage = await this.newLocalFirstage(name);
        result = await localFirstage.keys(asyncLogger.newLog());
        t.eq(result, ["one", "two"]);
        await localFirstage.removeItem("one", asyncLogger.newLog());
        result = await localFirstage.getItem("one", asyncLogger.newLog());
        t.eq(result, null);
        result = await localFirstage.getItem("xxxx", asyncLogger.newLog());
        t.eq(result, null);
        result = await localFirstage.keys(asyncLogger.newLog());
        t.eq(result, ["two"]);
        // report
        asyncLogger.addReportString(PrintVisitor.visit(await localFirstage.asVisitTarget()));
        asyncLogger.report();
        // stop
        t.asyncStop();
    }

    static async async_test_storeObject(t) {
        let result;
        const name = "async_test_storeObject";
        const asyncLogger = new AsyncLogger(name);
        // start
        t.asyncStart(asyncTestTimeout);
        const localFirstage = await this.newLocalFirstage(name);
        const object = {three: 3, four: 4};
        await localFirstage.setItem("object", object, asyncLogger.newLog());
        result = await localFirstage.getItem("object", asyncLogger.newLog());
        t.eq(result, object);
        t.eq(result.three, 3);
        // report
        asyncLogger.addReportString(PrintVisitor.visit(await localFirstage.asVisitTarget()));
        asyncLogger.report();
        // stop
        t.asyncStop();
    }

    // =========================
    // unit tests - syncKeys
    // =========================
    static async async_test_syncKeys(t) {
        const name = "async_test_syncKeys";
        const asyncLogger = new AsyncLogger(name);
        // start
        t.asyncStart(asyncTestTimeout);
        const localFirstage = await this.newLocalFirstage(name);
        await localFirstage.syncKeys(asyncLogger.newLog());
        await localFirstage.local_.setItem("three", 33, asyncLogger.newLog());
        await localFirstage.local_.removeItem("two", asyncLogger.newLog());
        await localFirstage.syncKeys(asyncLogger.newLog());
        await localFirstage.syncKeys(asyncLogger.newLog());
        await localFirstage.remote_.setItem("three", 33, asyncLogger.newLog());
        await localFirstage.remote_.setItem("two", 22, asyncLogger.newLog());
        await localFirstage.remote_.setItem("four", 44, asyncLogger.newLog());
        await localFirstage.remote_.removeItem("one", asyncLogger.newLog());
        await localFirstage.syncKeys(asyncLogger.newLog());
        await localFirstage.syncKeys(asyncLogger.newLog());
        // report
        asyncLogger.addReportString(PrintVisitor.visit(await localFirstage.asVisitTarget()));
        asyncLogger.report();
        // stop
        t.asyncStop();
    }

    static async async_test_syncKeys2(t) {
        const name = "async_test_syncKeys2";
        const asyncLogger = new AsyncLogger(name);
        // start
        t.asyncStart(asyncTestTimeout);
        const localFirstage = await this.newLocalFirstage(name);
        await localFirstage.syncKeys(asyncLogger.newLog());
        await localFirstage.local_.setItem("three", 33, asyncLogger.newLog());
        await localFirstage.local_.removeItem("three", asyncLogger.newLog());
        await localFirstage.syncKeys(asyncLogger.newLog());
        await localFirstage.syncKeys(asyncLogger.newLog());
        // report
        asyncLogger.addReportString(PrintVisitor.visit(await localFirstage.asVisitTarget()));
        asyncLogger.report();
        // stop
        t.asyncStop();
    }

    static async async_test_syncKeys3(t) {
        const name = "async_test_syncKeys3";
        const asyncLogger = new AsyncLogger(name);
        // start
        t.asyncStart(asyncTestTimeout);
        const localFirstage = await this.newLocalFirstage(name);
        await localFirstage.syncKeys(asyncLogger.newLog());
        await localFirstage.local_.setItem("three", 33, asyncLogger.newLog());
        await localFirstage.remote_.setItem("three", 333, asyncLogger.newLog());
        await localFirstage.syncKeys(asyncLogger.newLog());
        await localFirstage.syncKeys(asyncLogger.newLog());
        await localFirstage.local_.removeItem("two", asyncLogger.newLog());
        await localFirstage.remote_.removeItem("two", asyncLogger.newLog());
        await localFirstage.syncKeys(asyncLogger.newLog());
        await localFirstage.syncKeys(asyncLogger.newLog());
        // report
        asyncLogger.addReportString(PrintVisitor.visit(await localFirstage.asVisitTarget()));
        asyncLogger.report();
        // stop
        t.asyncStop();
    }

    static async async_test_first_export(t) {
        const name = "async_test_first_exportToString";
        const asyncLogger = new AsyncLogger(name);
        // start
        t.asyncStart(asyncTestTimeout);
        const localFirstage = await this.newLocalFirstage(name);
        await localFirstage.exportToString("NAME", asyncLogger.newLog());
        asyncLogger.report();
        t.asyncStop();
    }

    static async async_test_exportToString(t) {
        const name = "async_test_exportToString";
        const asyncLogger = new AsyncLogger(name);
        // start
        t.asyncStart(asyncTestTimeout);
        const localFirstage = await this.newLocalFirstage(name);
        const result = await localFirstage.exportToString("async_test_exportToString", asyncLogger.newLog());
        const desired = "async_test_exportToString\n=====//=====//=====\none\n\none\n=====//=====//=====\n22";
        t.eq(result, desired);
        asyncLogger.report();
        t.asyncStop();
    }

    static testLines1() {
        return ["TESTImportExport1", "aaa/bbb/ccc\n\nsame text", "xxx/yyy/zzz\n\ndifferent text",
                "jjj/kkk/lll\n\nunique key1"];
    }

    static testLines2() {
        return ["TESTImportExport2", "aaa/bbb/ccc\n\nsame text", "xxx/yyy/zzz\n\ndifferent text 2",
                "mmm/nnn/ooo\n\nunique key2"];
    }

    static async async_test_importFromString(t) {
        const name = "async_test_importFromString";
        const asyncLogger = new AsyncLogger(name);
        // start
        t.asyncStart(asyncTestTimeout);
        const localFirstage = await this.newLocalFirstage(name);
        //
        const string1 = this.testLines1().join(localFirstage.exportDivider());
        await localFirstage.importFromString(string1, asyncLogger.newLog());
        const keys1 = await localFirstage.keys();
        const sorted1 = keys1.sort();
        t.eq(sorted1, ["aaa/bbb/ccc", "jjj/kkk/lll", "one", "two", "xxx/yyy/zzz"]);
        //
        const string2 = this.testLines2().join(localFirstage.exportDivider());
        await localFirstage.importFromString(string2, asyncLogger.newLog());
        const keys2 = await localFirstage.keys();
        const sorted2 = keys2.sort();
        t.eq(sorted2, ["IMPORT/xxx/yyy/zzz", "aaa/bbb/ccc", "jjj/kkk/lll", "mmm/nnn/ooo", "one", "two", "xxx/yyy/zzz"]);
        // report
        asyncLogger.addReportString(PrintVisitor.visit(await localFirstage.asVisitTarget()));
        asyncLogger.report();
        t.asyncStop();
    }

    static async async_test_importFromString2(t) {
        const name = "async_test_importFromString2";
        const asyncLogger = new AsyncLogger(name);
        // start
        t.asyncStart(asyncTestTimeout);
        const localFirstage = await this.newLocalFirstage(name);
        const string = "async_test_importFromString2\n=====//=====//=====\nthree\n\n33\n=====//=====//=====\nfour\n\n44";
        await localFirstage.importFromString(string, asyncLogger.newLog());
        const keys = await localFirstage.keys();
        const sorted = keys.sort();
        t.eq(sorted, ["four", "one", "three", "two"]);
        asyncLogger.report();
        t.asyncStop();
    }
}

export {LocalFirstage_TestCase as default, LocalFirstage_TestCase};