import {WriteStream} from "./ReadWriteStream.js";

class Visitor {
    constructor() {
        this.revisit_ = false;
        this.targetsVisited_ = [];
        this.isRevisit_ = false;
        this.count_ = 0;
        this.maxCount_ = 1000;
        this.index_ = false;
        this.indexAll_ = false;
    }

    static visit(v) {
        return new this().visit(v);
    }

    indexOn() {
        this.index_ = true;
        this.indexAll_ = false;
        return this;
    }

    indexAllOn() {
        this.index_ = false;
        this.indexAll_ = true;
        return this;
    }

    indexOff() {
        this.index_ = false;
        this.indexAll_ = false;
        return this;
    }

    //
    visit(v, ...args) {
        //Count and record visit (to control recursive visits)
        if (this.isCountExceeded()) {
            return this.countExceeded(v, ...args);
        }
        this.recordVisit(v);
        //Hook for subclasses
        this.preVisit(v, ...args);
        //Lookup and call a visit method, with optional arguments
        const selector = this.getSelector(v);
        //Call visit method - target is the first arg; other args are optional
        try {
            return this[selector](v, ...args);
        } catch (e) {
            const message = e.message + " => " + selector;
            throw {
                name: e.name, message: message,
            };
        }
    }

    isCountExceeded() {
        this.count_ += 1;
        return this.count_ > this.maxCount_;
    }

    countExceeded() {
        //Hook for subclasses
        return "Count Exceeded";
    }

    preVisit() {
        //Hook for subclasses
        return this;
    }

    recordVisit(v) {
        //Used to control recursive visits - update vTargetsVisited
        if (this.targetIndex(v) < 0) {
            this.isRevisit_ = false;
            this.targetsVisited_.push(v);
        } else {
            this.isRevisit_ = true;
        }
        return this;
    }

    targetIndex(v) {
        //Return a unique index for each v (acts like an object id)
        return this.targetsVisited_.indexOf(v);
    }

    getSelector(v) {
        //Return a selector that is defined for this particular visitor and target
        let selector;
        if (v === undefined) {
            selector = this.undefinedSelector();
            if (this[selector]) {
                return selector;
            } else {
                return this.anySelector();
            }
        }
        if (v === null) {
            selector = this.nullSelector();
            if (this[selector]) {
                return selector;
            } else {
                return this.anySelector();
            }
        }
        selector = this.constructorSelector(v);
        if (this[selector]) {
            return selector;
        }
        selector = this.typeofSelector(v);
        if (this[selector]) {
            return selector;
        }
        return this.anySelector();
    }

    constructorSelector(v) {
        //Return a visit selector made from the v's constructor
        return "visit_" + this.constructorName(v);
    }

    constructorName(v) {
        //Return class name, or parse the function name from the function source string
        return v.constructor.name || v.constructor.toString().split(" ")[1].slice(0, -2);
    }

    typeofSelector(v) {
        //Return a visit selector made from the v's type
        return "visit_" + typeof (v);
    }

    undefinedSelector() {
        //Return the default undefined selector
        return "visit_undefined";
    }

    nullSelector() {
        //Return the default null selector
        return "visit_null";
    }

    anySelector() {
        //Return the default visit selector
        return "visit_any";
    }

    visit_any(v) {
        //dummy function
        return "Visited Any";
    }
}

class PrintVisitor extends Visitor {
    crDotVisit(v, ws) {
        const result = this.visit(v, ws);
        const withCrs = result.replace(/\n/g, "<cr>");
        return withCrs.replace(/ /g, ".");
    }

    visit(v, ws) {
        if (!ws) {
            ws = new WriteStream();
        }
        return super.visit(v, ws);
    }

    countExceeded(v, ws) {
        ws.s("<count exceeded>");
        return "Count Exceeded";
    }

    preVisit(v, ws) {
        if (this.indexAll_) {
            const index = this.targetIndex(v);
            ws.s(index).s("~");
        }
        return this;
    }

    visit_Object(o, ws) {
        ws.s("{");
        if (this.index_ && !this.indexAll_) {
            const index = this.targetIndex(o);
            ws.s(index);
        }
        let count = 0;
        for (let key in o) {
            if (o.hasOwnProperty(key)) {
                count++;
            }
        }
        if (this.isRevisit_ && !this.revisit_) {
            this.visit_Revisit(o, ws);
        } else {
            if (count <= 1) {
                this.visit_Object1(o, ws);
            } else {
                this.visit_ObjectN(o, ws);
            }
        }
        ws.s("}");
        return ws.contents();
    }

    visit_Object1(o, ws) {
        ws.sp();
        for (let key in o) {
            const value = o[key];
            if (o.hasOwnProperty(key)) {
                ws.s(key).colon().sp().visitWith(value, this);
            }
        }
        ws.sp();
        return ws.contents();
    }

    visit_ObjectN(o, ws) {
        ws.cr().inc();
        for (let key in o) {
            const value = o[key];
            if (o.hasOwnProperty(key)) {
                ws.key(key).visitWith(value, this).unStop().cr();
            }
        }
        ws.dec().ind();
        return ws.contents();
    }

    visit_Revisit(oa, ws) {
        ws.s(" <revisit> ");
        return ws.contents();
    }

    visit_Array(a, ws) {
        const tempVisitor = new PrintVisitor();
        const tempWriteStream = new WriteStream();
        const result = tempVisitor.visit_ArrayLine(a, tempWriteStream);
        if (result.length < 60) {
            ws.s(result);
            return ws.contents();
        } else {
            return this.visit_ArrayLines(a, ws);
        }
    }

    visit_ArrayLine(a, ws) {
        ws.s("[");
        if (this.index_ && !this.indexAll_) {
            const index = this.targetIndex(a);
            ws.s(index);
        }
        ws.sp();
        if (this.isRevisit_ && !this.revisit_) {
            this.visit_Revisit(a, ws);
        } else {
            this.visit_ArrayElements(a, ws);
        }
        ws.s(" ]");
        return ws.contents();
    }

    visit_ArrayLines(a, ws) {
        ws.s("[");
        if (this.index_ && !this.indexAll_) {
            const index = this.targetIndex(a);
            ws.s(index);
        }
        ws.cr().inc().ind();
        if (this.isRevisit_ && !this.revisit_) {
            this.visit_Revisit(a, ws);
        } else {
            this.visit_ArrayElementsLines(a, ws);
        }
        ws.cr().dec().ind().s("]");
        return ws.contents();
    }

    visit_ArrayElements(a, ws) {
        for (let i in a) {
            this.visit(a[i], ws);
            if (i < a.length - 1) {
                ws.s(", ");
            }
        }
        return ws.contents();
    }

    visit_ArrayElementsLines(a, ws) {
        for (const i in a) {
            this.visit(a[i], ws);
            if (i < a.length - 1) {
                ws.comma().cr().ind();
            }
        }
        return ws.contents();
    }

    visit_String(s, ws) {
        ws.s("'").s(s).s("'");
        return ws.contents();
    }

    visit_Function(f, ws) {
        function isClass(func) {
            return typeof func === "function" && /^class\s/.test(Function.prototype.toString.call(func));
        }

        if (isClass(f)) {
            ws.s("Class" + " " + this.constructorName(f));
        } else {
            ws.s("Function");
        }
        return ws.contents();
    }

    visit_Date(d, ws) {
        function two(i) {
            return ("0" + i).slice(-2);
        }

        const day = d.getDate();
        const month = d.getMonth() + 1;
        const year = d.getFullYear();
        const string = two(day) + "/" + two(month) + "/" + year;
        ws.s(string);
        return ws.contents();
    }

    visit_object(o, ws) {
        ws.s(this.constructorName(o)).sp();
        return this.visit_Object(o, ws);
    }

    visit_undefined(v, ws) {
        ws.s("undefined");
        return ws.contents();
    }

    visit_null(v, ws) {
        ws.s("null");
        return ws.contents();
    }

    visit_any(v, ws) {
        ws.s(v);
        return ws.contents();
    }
}

const Module = {
    addModuleToClasses(oClasses) {
        oClasses.Visitor = Visitor;
        oClasses.PrintVisitor = PrintVisitor;
    },
};
export {Module as default, Visitor, PrintVisitor};