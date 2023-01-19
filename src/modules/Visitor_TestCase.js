import {Visitor, PrintVisitor} from "./Visitor.js";
import {WriteStream} from "./ReadWriteStream.js";

class ExampleClass {
	constructor(x) {
		this.x_ = x;
	}

	getX() {
		return this.x_;
	}

	setX(x) {
		this.x_ = x;
	}
}

class Visitor_TestCase {
	static testSetup(t) {
		t.visitor__ = new Visitor();
		t.things__ = [
			[1, 2, 3],
			{one: 1},
			'hi',
			17,
			new Date(),
			function () {
				return 17;
			}
		];
	}

	static test_indexOn_indexAllOn_indexOff(t) {
		const visitor = t.visitor__;
		t.eq(visitor.index_, false);
		t.eq(visitor.indexAll_, false);
		visitor.indexOn();
		t.eq(visitor.index_, true);
		t.eq(visitor.indexAll_, false);
		visitor.indexOff();
		t.eq(visitor.index_, false);
		t.eq(visitor.indexAll_, false);
		visitor.indexAllOn();
		t.eq(visitor.index_, false);
		t.eq(visitor.indexAll_, true);
		visitor.indexOff();
		t.eq(visitor.index_, false);
		t.eq(visitor.indexAll_, false);
	}

	static test_visit_isRevisit(t) {
		const visitor = t.visitor__;
		t.eq(visitor.targetsVisited_, []);
		t.eq(visitor.isRevisit_, false);
		visitor.visit(1);
		t.eq(visitor.targetsVisited_, [1]);
		t.eq(visitor.isRevisit_, false);
		visitor.visit(1);
		t.eq(visitor.targetsVisited_, [1]);
		t.eq(visitor.isRevisit_, true);
	}

	static test_countExceeded_isCountExceeded(t) {
		const visitor = t.visitor__;
		visitor.maxCount_ = 3;
		t.eq(visitor.count_, 0);
		t.eq(visitor.visit(17), "Visited Any");
		t.eq(visitor.count_, 1);
		t.eq(visitor.visit(17), "Visited Any");
		t.eq(visitor.count_, 2);
		t.eq(visitor.visit(17), "Visited Any");
		t.eq(visitor.count_, 3);
		t.eq(visitor.visit(17), "Count Exceeded");
		t.eq(visitor.count_, 4)
	}

	static test_preVisit(t) {
		const r = t.visitor__.preVisit(17);
		t.eq(r, t.visitor__);
	}

	static test_recordVisit(t) {
		const visitor = t.visitor__;
		t.eq(visitor.targetsVisited_, []);
		visitor.recordVisit(1);
		t.eq(visitor.targetsVisited_, [1]);
		visitor.recordVisit(2);
		t.eq(visitor.targetsVisited_, [1, 2]);
	}

	static test_targetIndex(t) {
		const visitor = t.visitor__;
		visitor.visit(10);
		visitor.visit(11);
		t.eq(visitor.targetIndex(10), 0);
		t.eq(visitor.targetIndex(11), 1);
		t.eq(visitor.targetIndex(12), -1);
	}

	static test_constructorName(t) {
		const r = t.things__.map((each) => {
			return t.visitor__.constructorName(each);
		});
		const d = ["Array", "Object", "String", "Number", "Date", "Function"];
		t.eq(r, d);
	}

	static test_getSelector(t) {
		const visitor = t.visitor__;
		visitor.visit_Array = 17;
		visitor.visit_Object = 17;
		visitor.visit_String = 17;
		visitor.visit_Number = 17;
		visitor.visit_object = 17;
		visitor.visit_function = 17;
		const r = t.things__.map((each) => {
			return visitor.getSelector(each);
		});
		const d = ["visit_Array", "visit_Object", "visit_String", "visit_Number", "visit_object", "visit_function"];
		t.eq(r, d);
	}

	static test_constructorSelector(t) {
		const r = t.things__.map((each) => {
			return t.visitor__.constructorSelector(each);
		});
		const d = ["visit_Array", "visit_Object", "visit_String", "visit_Number", "visit_Date", "visit_Function"];
		t.eq(r, d);
	}

	static test_typeofSelector(t) {
		const r = t.things__.map((each) => {
			return t.visitor__.typeofSelector(each);
		});
		const d = ["visit_object", "visit_object", "visit_string", "visit_number", "visit_object", "visit_function"];
		t.eq(r, d);
	}

	static test_anySelector(t) {
		const r = t.visitor__.anySelector();
		t.eq(r, 'visit_any');
	}

	static test_nullSelector(t) {
		const r = t.visitor__.nullSelector();
		t.eq(r, 'visit_null');
	}

	static test_undefinedSelector(t) {
		const r = t.visitor__.undefinedSelector();
		t.eq(r, 'visit_undefined');
	}

	static test_visit_any(t) {
		const r = t.visitor__.visit_any(17);
		t.eq(r, "Visited Any");
	}
}

class PrintVisitor_TestCase {
	static testSetup(t) {
		t.visitor__ = new PrintVisitor();
		t.ws__ = new WriteStream();
		t.things__ = [
			[1, 2, 3],
			{one: 1},
			'hi',
			17,
			new Date('1/1/2001'),
			function () {
				return 17;
			}
		];
	}

	static test_crDotVisit(t) {
		const r = t.visitor__.crDotVisit({one: 1, two: 2}, t.ws__);
		const d = "{<cr>....one:.1<cr>....two:.2<cr>}";
		t.eq(r, d);
	}

	static test_visit(t) {
		const result = t.visitor__.visit(t.things__, t.ws__);
		const desired = "[ [ 1, 2, 3 ], { one: 1 }, 'hi', 17, 01/01/2001, Function ]";
		t.eq(result, desired);
	}

	static test_recursion(t) {
		const o = {one: 1};
		o.object = o;
		t.visitor__._maxCount = 5;
		t.eq(t.visitor__.targetsVisited_.length, 0);
		const r = t.visitor__.indexOn().visit(o, t.ws__);
		const d = '{0\n    one: 1\n    object: {0 <revisit> }\n}';
		t.eq(r, d);
		t.eq(t.visitor__.targetsVisited_.length, 2);
	}

	static test_countExceeded(t) {
		const r = t.visitor__.countExceeded(17, t.ws__);
		t.eq(t.ws__.contents(), "<count exceeded>");
		t.eq(r, "Count Exceeded");
	}

	static test_preVisit(t) {
		t.visitor__.preVisit(17, t.ws__);
		t.eq(t.ws__.contents(), "");
		this.testSetup(t);
		t.visitor__.indexAllOn().preVisit(17, t.ws__);
		t.eq(t.ws__.contents(), "-1~");
	}

	static test_visit_Object(t) {
		let value = {one: 1, two: 2, three: 3};
		t.visitor__.visit_Object(value, t.ws__);
		let result = t.ws__.contents();
		let desired = '{\n    one: 1\n    two: 2\n    three: 3\n}';
		t.eq(result, desired);
		//
		t.ws__ = new WriteStream();
		value = {one: 1};
		t.visitor__.visit_Object(value, t.ws__);
		result = t.ws__.contents();
		desired = '{ one: 1 }';
		t.eq(result, desired);
	}

	static test_visit_Object1(t) {
		const value = {one: 1};
		t.visitor__.visit_Object1(value, t.ws__);
		const result = t.ws__.contents();
		const desired = ' one: 1 ';
		t.eq(result, desired);
	}

	static test_visit_ObjectN(t) {
		const value = {one: 1, two: 2, three: 3};
		t.visitor__.visit_ObjectN(value, t.ws__);
		const result = t.ws__.contents();
		const desired = '\n    one: 1\n    two: 2\n    three: 3\n';
		t.eq(result, desired);
	}

	static test_visit_Revisit(t) {
		const o = {one: 1};
		t.visitor__.visit_Revisit(o, t.ws__);
		let r = t.ws__.contents();
		let d = ' <revisit> ';
		t.eq(r, d);
		this.testSetup(t);
		const a = [1, 2];
		t.visitor__.visit_Revisit(a, t.ws__);
		r = t.ws__.contents();
		d = ' <revisit> ';
		t.eq(r, d);
	}

	static test_visit_Array(t) {
		const value = [1, 2, 3, [4, 5]];
		t.visitor__.visit_Array(value, t.ws__);
		const result = t.ws__.contents();
		const desired = '[ 1, 2, 3, [ 4, 5 ] ]';
		t.eq(result, desired);
	}

	static test_visit_ArrayLine(t) {
		let r, d;
		const value = [1, 2, 3, [4, 5]];
		t.visitor__.visit_ArrayLine(value, t.ws__);
		r = t.ws__.contents();
		d = '[ 1, 2, 3, [ 4, 5 ] ]';
		t.eq(r, d);
		this.testSetup(t);
		t.visitor__.index_ = true;
		t.visitor__.indexAll_ = false;
		t.visitor__.visit_ArrayLine(value, t.ws__);
		r = t.ws__.contents();
		d = '[-1 1, 2, 3, [ 4, 5 ] ]';
		t.eq(r, d);
		this.testSetup(t);
		t.visitor__.isRevisit_ = true;
		t.visitor__.visit_ArrayLine(value, t.ws__);
		r = t.ws__.contents();
		d = "[  <revisit>  ]";
		t.eq(r, d);
	}

	static test_visit_ArrayLines(t) {
	}

	static test_visit_ArrayElements(t) {
		const value = [1, 2, 3, [4, 5]];
		t.visitor__.visit_ArrayElements(value, t.ws__);
		const r = t.ws__.contents();
		const d = '1, 2, 3, [ 4, 5 ]';
		t.eq(r, d);
	}

	static test_visit_ArrayElementsLines(t) {
		const value = [1, 2, 3, [4, 5]];
		t.visitor__.visit_ArrayElementsLines(value, t.ws__);
		const r = t.ws__.contents();
		const d = '1,\n' +
			'2,\n' +
			'3,\n' +
			'[ 4, 5 ]';
		t.eq(r, d);
	}

	static test_visit_String(t) {
		const value = '123';
		t.visitor__.visit_String(value, t.ws__);
		const result = t.ws__.contents();
		const desired = "'123'";
		t.eq(result, desired);
	}

	static test_visit_Function(t) {
		const value = function () {
			return 17;
		};
		t.visitor__.visit_Function(value, t.ws__);
		const result = t.ws__.contents();
		const desired = 'Function';
		t.eq(result, desired);
	}

	static test_visit_Date(t) {
		const value = new Date('1/1/2001');
		t.visitor__.visit_Date(value, t.ws__);
		const result = t.ws__.contents();
		const desired = '01/01/2001';
		t.eq(result, desired);
	}

	static test_visit_instance(t) {
		const value = new ExampleClass(17);
		t.visitor__.visit(value, t.ws__);
		const result = t.ws__.contents();
		const desired = 'ExampleClass { x_: 17 }';
		t.eq(result, desired);
	}

	static test_visit_object(t) {
		const value = new Date('1/1/2001');
		t.visitor__.visit_object(value, t.ws__);
		const result = t.ws__.contents();
		const desired = "Date {  }";
		t.eq(result, desired);
	}

	static test_visit_undefined(t) {
		const value = undefined;
		t.visitor__.visit_any(value, t.ws__);
		const result = t.ws__.contents();
		const desired = 'undefined';
		t.eq(result, desired);
	}

	static test_visit_null(t) {
		const value = null;
		t.visitor__.visit_any(value, t.ws__);
		const result = t.ws__.contents();
		const desired = 'null';
		t.eq(result, desired);
	}

	static test_visit_any(t) {
		const value = 17;
		t.visitor__.visit_any(value, t.ws__);
		const result = t.ws__.contents();
		const desired = '17';
		t.eq(result, desired);
	}
}

const Module = {
	addModuleToTestClasses(aTestClasses) {
		aTestClasses.push(Visitor_TestCase, PrintVisitor_TestCase);
	},
};
export {Module as default, Visitor_TestCase, PrintVisitor_TestCase};