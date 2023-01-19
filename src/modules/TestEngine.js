import _ from "https://cdn.skypack.dev/lodash";

class TestParameter {
    constructor(oTestEngine, sCategory, sSelector) {
        this.testEngine_ = oTestEngine;
        this.category_ = sCategory;
        this.selector_ = sSelector;
        this.shouldFail_ = false;
        this.reportHeader_ = null;
    }

    // =============================
    // comparing
    // =============================
    is(v, sFailureMessage) {
        this.eq(v, true, sFailureMessage);
    }

    eq(vA, vB, sFailureMessage) {
        //strings are for copy and paste when debugger halts code
        let stringA = "ERROR", stringB = "ERROR";
        try {
            stringA = JSON.stringify(vA);
            stringB = JSON.stringify(vB);
        } catch (error) {
            this.fail("ERROR: " + error.message, vA, vB);
        }
        if (_.isEqual(vA, vB)) {
            this.succeed(vA, vB);
        } else {
            this.fail(sFailureMessage, vA, vB);
        }
    }

    // =============================
    // succeed, fail, and todo
    // =============================
    shouldFailDuring(f) {
        this.shouldFail_ = true;
        f();
        this.shouldFail_ = false;
    }

    succeed(vA, vB) {
        if (!this.ignoreBecauseTestTimedOut_) {
            if (this.shouldFail_) {
                this.failBasic(vA, vB);
            } else {
                this.succeedBasic(vA, vB);
            }
        }
    }

    succeedBasic(vA, vB) {
        this.testEngine_.succeed(this.selector_, this.category_);
    }

    fail(sMessage, vA, vB) {
        if (!this.ignoreBecauseTestTimedOut_) {
            if (this.shouldFail_) {
                this.succeedBasic(vA, vB);
            } else {
                this.failBasic(sMessage, vA, vB);
            }
        }
    }

    todo(sMessage, vA, vB) {
        if (!this.ignoreBecauseTestTimedOut_) {
            this.failBasic("TODO>> " + sMessage, vA, vB);
        }
    }

    failBasic(sMessage, vA, vB) {
        if (this.testEngine_.debugOnError_) {
            debugger;
        }
        console.log("==== TEST FAIL ====",  this.category_, this.selector_);
        // if first value is a number, console.log shows strings better
        if (sMessage) {
            console.log(0, sMessage, vA, vB);
        } else {
            console.log(0, vA, vB);
        }
        this.testEngine_.fail(this.selector_, this.category_, sMessage);
    }
}

class AsyncTestParameter extends TestParameter {
    constructor(oTestEngine, sCategory, sSelector) {
        super(oTestEngine, sCategory, sSelector);
        this.shouldTimeout_ = false;
    }

    // =============================
    // async
    // =============================
    asyncStart(iDuration, bShouldTimeout = false) {
        if (bShouldTimeout) {
            this.shouldTimeout_ = true;
        }
        this.testEngine_.registerAsyncTest(this);
        this.timeoutId_ = setTimeout(() => {
            if (this.timeoutId_) {
                // timeout fired before test ended
                delete this.timeoutId_;
                if (this.shouldTimeout_) {
                    this.succeed();
                } else {
                    this.fail("ASYNC TIMEOUT");
                }
                // ignore test if it ends in the future
                this.ignoreBecauseTestTimedOut_ = true;
                this.testEngine_.removeAsyncTest(this);
            }
        }, iDuration);
    }

    asyncStop() {
        if (!this.ignoreBecauseTestTimedOut_) {
            // test ended before timeout
            clearTimeout(this.timeoutId_);
            delete this.timeoutId_;
            this.testEngine_.removeAsyncTest(this);
        }
    }
}

class TestEngine {
    // =============================
    // constructor
    // =============================
    constructor() {
        this.fCategory_ = function () {
        };
        this.fSucceed_ = function () {
        };
        this.fFail_ = function () {
        };
        this.fDone_ = function () {
        };
        this.debugOnError_ = false;
        this.successCount_ = 0;
        this.failureCount_ = 0;
        this.runningAsyncTests_ = new Set();
        this.isRunning_ = false;
        this.asyncTestFilter = (sName) => sName.startsWith("async_test_");
        this.testFilter = (sName) => sName.startsWith("test_");
    }

    // =============================
    // utility
    // =============================
    static testSetup(t) {
        t.myValue_ = 17;
    }

    // =============================
    // accessing - setting
    static test_testSetup(t) {
        t.eq(t.myValue_, 17);
        t.myValue_ = null;
    }

    static test_testSetup2(t) {
        t.eq(t.myValue_, 17);
        t.myValue_ = null;
    }

    static test_eq_pass(t) {
        t.eq(1, 1);
        const a = [1, 2, 3];
        const b = [1, 2, 3];
        t.eq(a, b);
    }

    static test_eq_shouldFailDuring(t) {
        t.shouldFailDuring(function () {
            t.eq(1, 2);
            const a = [1, 2, 3];
            const b = [1, 2, 3, 4];
            t.eq(a, b);
        });
    }

    static test_is_pass(t) {
        t.is(3 < 4);
    }

    // =============================
    // accessing - getting
    static test_is_shouldFailDuring(t) {
        t.shouldFailDuring(function () {
            t.is(4 < 3);
        });
    }

    static async_test_eq(t) {
        t.asyncStart(200);
        // simulate a web call
        setTimeout(() => {
            t.eq(1, 1);
            t.shouldFailDuring(() => {
                t.eq(1, 2);
            });
            t.asyncStop();
        }, 100);
    }

    // =============================
    // registering
    static async_test_timeout(t) {
        t.asyncStart(200, true);
        // simulate a web call
        setTimeout(() => {
            t.eq(1, 2);
            t.asyncStop();
        }, 500);
    }

    static test_error(t) {
        t.shouldFailDuring(() => {
            throw("TestError");
        });
    }

    static test_nothing(t) {
        return (t);
    }

    // =============================
    // running
    static xxx_test_should_fail(t) {
        t.eq(3, 4, "This should fail");
    }

    // =============================
    withBrackets(s) {
        return (s === undefined) ? "" : "[" + s + "]";
    }

    // =============================
    onCategory(f) {
        this.fCategory_ = f;
        return this;
    }

    setShowSuccess(f) {
        this.fSucceed_ = function (sSelector, sCategory) {
            const sp = " ";
            f("SUCCEED" + sp + sSelector + sp + sCategory);
        };
        return this;
    }

    setShowFailure(f) {
        this.fFail_ = function (sSelector, sCategory, sMessage) {
            const sp = " ";
            f("FAIL" + sp + sSelector + sp + sCategory + sp + this.withBrackets(sMessage));
        };
        return this;
    }

    setShowDone(f) {
        this.fDone_ = () => {
            this.reportHeader_ && f(this.reportHeader_);
            f("SUCCESS COUNT " + this.successCount_);
            f("FAILURE COUNT " + this.failureCount_);
        };
    }

    setDebugger() {
        this.debugOnError_ = true;
        return this;
    }

    // =============================
    // Unit Tests
    // =============================
    successCount() {
        return this.successCount_;
    }

    failureCount() {
        return this.failureCount_;
    }

    // =============================
    registerAsyncTest(oAsyncTestParameter) {
        this.runningAsyncTests_.add(oAsyncTestParameter);
    };

    removeAsyncTest(oAsyncTestParameter) {
        this.runningAsyncTests_.delete(oAsyncTestParameter);
        if (this.runningAsyncTests_.size === 0) {
            this.asyncTestSetBecameEmpty();
        }
    };

    asyncTestSetBecameEmpty() {
        if (!this.isRunning_) {
            this.fDone_();
        }
    }

    // =============================
    getName(fClass) {
        const name = fClass.name;
        return (name === "Constructor" || name === "") ? fClass.displayName : name;
    }

    testClasses(aClasses) {
        this.isRunning_ = true;
        aClasses.forEach(each => {
            this.testClass(each);
        });
        // do this before setting isRunning_ to false
        if (!this.runningAsyncTests_.size) {
            this.fDone_();
        }
        this.isRunning_ = false;
    }

    testClass(fClass) {
        const className = this.getName(fClass);
        this.fCategory_(name, this);
        this.asyncTestSelectorsOf(fClass).forEach(each => {
            this.selector_ = each;
            const t = new AsyncTestParameter(this, className, each);
            try {
                fClass.testSetup && fClass.testSetup(t);
                fClass[each](t);
            } catch (error) {
                t.fail("ERROR >> " + error.toString());
            }
        });
        this.testSelectorsOf(fClass).forEach(each => {
            this.selector_ = each;
            const t = new TestParameter(this, className, each);
            try {
                fClass.testSetup && fClass.testSetup(t);
                fClass[each](t);
            } catch (error) {
                t.fail("ERROR >> " + error.toString());
            }
        });
        return this;
    }

    testSelectorsOf(fClass) {
        let selectors = [];
        if (fClass.inheritsTests) {
            selectors = selectors.concat(this.testSelectorsOf(Object.getPrototypeOf(fClass)));
        }
        selectors = selectors.concat(Object.getOwnPropertyNames(fClass).filter(this.testFilter));
        return selectors;
    }

    asyncTestSelectorsOf(fClass) {
        let selectors = [];
        if (fClass.inheritsTests) {
            selectors = selectors.concat(this.asyncTestSelectorsOf(Object.getPrototypeOf(fClass)));
        }
        selectors = selectors.concat(Object.getOwnPropertyNames(fClass).filter(this.asyncTestFilter));
        return selectors;
    }

    succeed(sSelector, sCategory) {
        this.successCount_++;
        this.fSucceed_(sSelector, sCategory, this);
    }

    fail(sSelector, sCategory, sMessage = "") {
        this.failureCount_++;
        this.fFail_(sSelector, sCategory, sMessage, this);
    }
}

const Module = {
    addModuleToClasses(oClasses) {
        oClasses.TestEngine = TestEngine;
    }, addModuleToTestClasses(aTestClasses) {
        aTestClasses.push(TestEngine);
    },
};
export {Module as default, TestEngine};