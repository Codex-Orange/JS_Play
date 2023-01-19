import {TestEngine} from "./TestEngine";

class TestRunner {
    runTests(aClasses, zOutput, oOptions) {
        // testFilter (sName)=>{return true}
        const defaults = {
            showSuccess: false,
            showFailure: true,
            showDone: true,
            debugOnError: false,
            testFilter: null,
            asyncTestFilter: null,
            reportHeader: null,
        };
        const options = Object.assign({}, defaults, oOptions);
        const t = new TestEngine();

        function show(s) {
            zOutput.appendLine(s);
        }

        options.showSuccess && t.setShowSuccess(show);
        options.showFailure && t.setShowFailure(show);
        options.showDone && t.setShowDone(show);
        options.debugOnError && (t.debugOnError_ = true);
        options.testFilter && (t.testFilter = options.testFilter);
        options.asyncTestFilter && (t.asyncTestFilter = options.asyncTestFilter);
        options.reportHeader && (t.reportHeader_ = options.reportHeader);
        t.testClasses(aClasses);
    }
}

const Module = {
    addModuleToMixins(aMixins) {
        aMixins.push((F, div) => {
            console.log(2222);
            const river = new F.classes_.River;
            const testResultStream = river.testResult;
            let n = 0;
            testResultStream.onValue((v, stream) => {
                console.log(n++, v);
            })
            const testRunner = new F.classes_.TestRunner();
            const button = document.createElement("BUTTON");
            button.innerHTML = "Test";
            button.addEventListener("click", () => {
                testRunner.runTests(F.testClasses_, testResultStream, {});
            });
            div.appendChild(button);
        });
    }, addModuleToClasses(oClasses) {
        oClasses.TestRunner = TestRunner;
    }, addModuleToTestClasses(aTestClasses) {
        aTestClasses.push(TestRunner);
    },
};
export {Module as default, TestRunner};