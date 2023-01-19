import Module_LocalFirstage_TestCase_InMemory from "./LocalFirstage_TestCase_InMemory.js";
import Module_LocalFirstage_TestCase_LocalForage from "./LocalFirstage_TestCase_LocalForage.js";
import Module_MixinVisitF from "./MixinVisitF.js";
import Module_ReadWriteStream from "./ReadWriteStream.js";
import Module_ReadWriteStream_TestCase from "./ReadWriteStream_TestCase.js";
import Module_River from "./River.js";
import Module_StorageLocalFirstage from "./StorageLocalFirstage.js";
import Module_TestEngine from "./TestEngine.js";
import Module_TestRunner from "./TestRunner.js";
import Module_Utility from "./Utility.js";
import Module_Visitor from "./Visitor.js";
import Module_Visitor_TestCase from "./Visitor_TestCase.js";
// ===============
// Factory
// ===============
class Factory {
    constructor() {
        this.classes_ = [];
        this.testClasses_ = [];
        this.mixins_ = [];
        this.postOpen_ = [];
    }

    addModule(oModule) {
        //add module to factory
        oModule.addModuleToClasses && oModule.addModuleToClasses(this.classes_);
        oModule.addModuleToTestClasses && oModule.addModuleToTestClasses(this.testClasses_);
        oModule.addModuleToMixins && oModule.addModuleToMixins(this.mixins_);
        oModule.addModuleToPostOpen && oModule.addModuleToPostOpen(this.postOpen_);
        //add factory classes to module
        oModule.addClassesToModule && oModule.addClassesToModule(this.classes_);
    }

    runMixins(div) {
        console.log(4444, div);
        this.mixins_.forEach(each => {
            each(this, div);
        });
        console.log(5555);
    }
}

const singletonFactory = new Factory();
const modules = [Module_LocalFirstage_TestCase_InMemory, Module_LocalFirstage_TestCase_LocalForage, Module_MixinVisitF,
                 Module_ReadWriteStream, Module_ReadWriteStream_TestCase, Module_River, Module_StorageLocalFirstage,
                 Module_TestEngine, Module_TestRunner, Module_Utility, Module_Visitor, Module_Visitor_TestCase];
modules.forEach(each => {
    singletonFactory.addModule(each);
});
export default singletonFactory;
