import {ReadStream, WriteStream} from "./ReadWriteStream.js";

class ReadStream_TestCase {
	static testSetup(t) {
		t.rs__ = new ReadStream('/one\n/two\n/three four five');
	}

	static test_constructor(t) {
		const rs = new ReadStream('12345');
		t.eq(rs.contents(), '12345');
	}

	static test_makeGlobal(t) {
		let reG = t.rs__.makeGlobal(/abc/);
		t.eq(reG.source, 'abc');
		t.eq(reG.ignoreCase, false);
		t.eq(reG.multiline, false);
		t.eq(reG.global, true);
		//
		reG = t.rs__.makeGlobal(/abc/i);
		t.eq(reG.source, 'abc');
		t.eq(reG.ignoreCase, true);
		t.eq(reG.multiline, false);
		t.eq(reG.global, true);
		//
		reG = t.rs__.makeGlobal(/abc/m);
		t.eq(reG.source, 'abc');
		t.eq(reG.ignoreCase, false);
		t.eq(reG.multiline, true);
		t.eq(reG.global, true);
		//
		reG = t.rs__.makeGlobal(/abc/im);
		t.eq(reG.source, 'abc');
		t.eq(reG.ignoreCase, true);
		t.eq(reG.multiline, true);
		t.eq(reG.global, true);
	}

	//======================================
	// string parts
	//======================================
	static test_contents(t) {
		t.eq(t.rs__.contents(), '/one\n/two\n/three four five');
	}

	static test_char(t) {
		t.eq(t.rs__.char(), '/');
		t.rs__.next();
		t.eq(t.rs__.char(), 'o');
		t.rs__.nextToEnd();
		t.eq(t.rs__.char(), null);
	}

	static test_snapshot(t) {
		t.eq(t.rs__.snapshot(), '[|/one\n...][0]');
		t.rs__.next();
		t.eq(t.rs__.snapshot(), '[/|one\n/...][1]');
		t.rs__.nextToEnd();
		t.eq(t.rs__.snapshot(), '[... five|][26]');
	}

	static test_slice(t) {
		t.eq(t.rs__.p, 0);
		t.eq(t.rs__.slice(13, 16), 'ree');
		t.eq(t.rs__.p, 0);
		t.rs__.p = 13;
		t.eq(t.rs__.snapshot(), '[...o\n/th|ree f...][13]');
		t.eq(t.rs__.snapshot(20), '[/one\n/two\n/th|ree four five][13]');
	}

	static test_sliceToEnd(t) {
		t.eq(t.rs__.sliceToEnd(), t.rs__.contents());
		t.eq(t.rs__.before(/three/), '/one\n/two\n/');
		t.eq(t.rs__.p, 11);
		t.eq(t.rs__.sliceToEnd(), 'three four five');
	}

	static test_splitSplit(t) {
		const desired = [
			["one"],
			["two"],
			["three", "four", "five"]
		];
		t.eq(t.rs__.splitSplit('/', ' '), desired);
	}

	static test_split(t) {
		t.eq(t.rs__.split('/'), ["", "one\n", "two\n", "three four five"]);
		t.eq(t.rs__.split('\n/'), ["/one", "two", "three four five"]);
	}

	static test_splitTrim(t) {
		const rs = new ReadStream('   asdf   asdf   asdf');
		t.eq(rs.splitTrim('a'), ["", "sdf", "sdf", "sdf"]);
	}

	static test_splitTrimCull(t) {
		t.eq(t.rs__.splitTrimCull('/'), ["one", "two", "three four five"]);
		t.eq(t.rs__.splitTrimCull('\n/'), ["/one", "two", "three four five"]);
	}

	static test_asHtml(t) {
		t.eq(t.rs__.asHtml(), '/one<br />/two<br />/three&nbsp;four&nbsp;five');
	}

	//======================================
	// lines
	//======================================
	static test_firstLine(t) {
		t.eq(t.rs__.firstLine(), '/one');
		const s = 'Hello World';
		const rs = new ReadStream(s);
		t.eq(rs.firstLine(), s);
	}

	static test_lines(t) {
		const s = '  \n  \n\n  a.a   \n\n   b.  xxx   .b\n   \t   \t\t   c.xxx.c\n\t   \t\n';
		const rs = new ReadStream(s);
		let result = rs.lines();
		t.eq(result.length, 9);
		t.eq(result, ["  ", "  ", "", "  a.a   ", "", "   b.  xxx   .b", "   \t   \t\t   c.xxx.c", "\t   \t", ""]);
	}

	static test_linesTrim(t) {
		const s = '  asdf   \n   asdf  \n  asdf   \n   ';
		const rs = new ReadStream(s);
		let result = rs.linesTrim();
		t.eq(result, ["asdf", "asdf", "asdf", ""]);
	}

	static test_linesTrimCull(t) {
		const s = '  \n  \n\n  a.a   \n\n   b.  xxx   .b\n   \t   \t\t   c.xxx.c\n\t   \t\n';
		const rs = new ReadStream(s);
		let result = rs.linesTrimCull();
		t.eq(result.length, 3);
		t.eq(result, ["a.a", "b.  xxx   .b", "c.xxx.c"]);
	}

	static test_forEachLine(t) {
		let result = [];
		t.rs__.forEachLine(function (each, i, s) {
			result.push(each);
			result.push(i);
			result.push(s.length);
		});
		t.eq(result, ["/one", 0, 3, "/two", 1, 3, "/three four five", 2, 3]);
	}

	//======================================
	// length
	//======================================
	static test_length(t) {
		t.eq(t.rs__.length(), 26);
		t.rs__.next(5);
		t.eq(t.rs__.length(), 26);
	}

	static test_lengthToEnd(t) {
		t.eq(t.rs__.lengthToEnd(), 26);
		t.rs__.next(5);
		t.eq(t.rs__.lengthToEnd(), 21);
	}

	//======================================
	// boolean
	//======================================
	static test_atStart(t) {
		t.eq(t.rs__.snapshot(), '[|/one\n...][0]');
		t.eq(t.rs__.atStart(), true);
		t.rs__.next();
		t.eq(t.rs__.snapshot(), '[/|one\n/...][1]');
		t.eq(t.rs__.atStart(), false);
	}

	static test_atEnd(t) {
		t.eq(t.rs__.snapshot(), '[|/one\n...][0]');
		t.eq(t.rs__.atEnd(), false);
		t.rs__.next(1000);
		t.eq(t.rs__.snapshot(), '[... five|][26]');
		t.eq(t.rs__.atEnd(), true);
	}

	static test_matchesHere(t) {
		t.eq(t.rs__.snapshot(), '[|/one\n...][0]');
		t.eq(t.rs__.matchesHere(/\/one/), true);
		t.eq(t.rs__.matchesHere(/one/), false);
		t.eq(t.rs__.matchesHere(/\/two/), false);
		t.rs__.next();
		t.eq(t.rs__.snapshot(), '[/|one\n/...][1]');
		t.eq(t.rs__.matchesHere(/\/one/), false);
		t.eq(t.rs__.matchesHere(/one/), true);
		t.eq(t.rs__.matchesHere(/two/), false);
	}

	//======================================
	// next, peek, go
	//======================================
	static test_next(t) {
		t.eq(t.rs__.next(), '/');
		t.eq(t.rs__.p, 1);
	}

	static test_next2(t) {
		t.eq(t.rs__.next(4), '/one');
		t.eq(t.rs__.p, 4);
	}

	static test_nextToEnd(t) {
		t.eq(t.rs__.p, 0);
		const expected = t.rs__.sliceToEnd();
		t.eq(t.rs__.nextToEnd(), expected);
		t.eq(t.rs__.p, 26);
	}

	static test_nextToEnd2(t) {
		t.rs__.next(5);
		t.eq(t.rs__.p, 5);
		const expected = t.rs__.sliceToEnd();
		t.eq(t.rs__.nextToEnd(), expected);
		t.eq(t.rs__.p, 26);
	}

	static test_peek(t) {
		t.eq(t.rs__.peek(), '/');
		t.eq(t.rs__.p, 0);
	}

	static test_peek2(t) {
		t.eq(t.rs__.peek(4), '/one');
		t.eq(t.rs__.p, 0);
	}

	static test_go(t) {
		t.eq(t.rs__.go(), t.rs__);
		t.eq(t.rs__.p, 1);
	}

	static test_go2(t) {
		t.eq(t.rs__.go(3), t.rs__);
		t.eq(t.rs__.p, 3);
	}

	//======================================
	// before, after
	//======================================
	static test_before(t) {
		t.eq(t.rs__.before(/three/), '/one\n/two\n/');
		t.eq(t.rs__.snapshot(), '[...two\n/|three...][11]');
		t.eq(t.rs__.p, 11);
	}

	static test_beforeLineStartsWith(t) {
		t.eq(t.rs__.snapshot(), '[|/one\n...][0]');
		t.eq(t.rs__.beforeLineStartsWith(/\/one/), '');
		t.eq(t.rs__.snapshot(), '[|/one\n...][0]');
		t.eq(t.rs__.p, 0);
	}

	static test_beforeLineStartsWith2(t) {
		t.eq(t.rs__.snapshot(), '[|/one\n...][0]');
		t.eq(t.rs__.beforeLineStartsWith(/\/three/), '/one\n/two\n');
		t.eq(t.rs__.snapshot(), '[.../two\n|/thre...][10]');
		t.eq(t.rs__.p, 10);
	}

	static test_beforeLineStartsWith3(t) {
		t.eq(t.rs__.snapshot(), '[|/one\n...][0]');
		t.eq(t.rs__.beforeLineStartsWith(/asdf/), t.rs__.contents());
		t.eq(t.rs__.snapshot(), '[... five|][26]');
		t.eq(t.rs__.p, 26);
	}

	static test_after(t) {
		t.eq(t.rs__.after(/three/), '/one\n/two\n/three');
		t.eq(t.rs__.snapshot(), '[...three| four...][16]');
		t.eq(t.rs__.p, 16);
	}

	static test_after2(t) {
		t.eq(t.rs__.after(/three/), '/one\n/two\n/three');
		t.eq(t.rs__.snapshot(), '[...three| four...][16]');
		t.eq(t.rs__.p, 16);
		const expected = t.rs__.sliceToEnd();
		t.eq(t.rs__.after(/asdf/), expected);
		t.eq(t.rs__.snapshot(), '[... five|][26]');
		t.eq(t.rs__.p, 26);
	}

	//======================================
	// nextWhile, nextUntil
	//======================================
	static test_nextWhile(t) {
		const fWhile = function (c) {
			return c !== 't'
		};
		let result = t.rs__.nextWhile(fWhile);
		t.eq(result, '/one\n/');
	}

	static test_nextUntil(t) {
		const fUntil = function (c) {
			return c === 't'
		};
		let result = t.rs__.nextUntil(fUntil);
		t.eq(result, '/one\n/');
	}

	static test_sonToJsonInner(t) {
		const string = 'xxx\n.one:1\n.two\n   20\n   21\n.three:\n   30\n   31';
		const rs = new ReadStream(string);
		let result = rs.sonToJsonInner();
		const desired = {'one': '1', 'two': '   20\n   21', 'three': '   30\n   31'};
		t.eq(result, desired);
	}

	static test_sonToJson(t) {
		const string = 'xxx\n.one:1\n.two\n   20\n   21\n.three:\n   30\n   31\n==\nxxx\n.one:1\n.two\n   20\n   21\n.three:\n   30\n   31\n==\nxxx\n.one:1\n.two\n   20\n   21\n.three:\n   30\n   31';
		const rs = new ReadStream(string);
		let result = rs.sonToJson();
		const desired = [
			{'one': '1', 'two': '   20\n   21', 'three': '   30\n   31'},
			{'one': '1', 'two': '   20\n   21', 'three': '   30\n   31'},
			{'one': '1', 'two': '   20\n   21', 'three': '   30\n   31'}
		];
		t.eq(result, desired);
	}
}

class WriteStream_TestCase {
	static testSetup(t) {
		t.ws__ = new WriteStream();
		Object.assign(t.ws__, {_sp: '.', _cr: '|', _tab: ';', _indent: ',,,,', _stops: []});
		t.ws2__ = new WriteStream('one\ntwo\nthree\nfour');
		t.ws3__ = new WriteStream('one_two_three_four');
	}

	//======================================
	// ???
	//======================================
	static test_aaBlankLiteralArray1(t) {
		t.eq(t.ws__.contents(), '');
		t.eq(t.ws__._stops, []);
		t.ws__.s('xyz');
		t.ws__.setStop();
		t.eq(t.ws__.contents(), 'xyz');
		t.eq(t.ws__._stops, [3]);
	}

	static test_aaBlankLiteralArray2(t) {
		t.eq(t.ws__.contents(), '');
		t.eq(t.ws__._stops, []);
		t.ws__.s('xyz');
		t.ws__.setStop();
		t.eq(t.ws__.contents(), 'xyz');
		t.eq(t.ws__._stops, [3]);
	}

	//======================================
	// prototype methods
	//======================================
	static test_on(t) {
		const ws = new WriteStream('hello');
		let r = ws.contents();
		t.eq(r, 'hello');
	}

	//======================================
	// add string(s)
	//======================================
	static test_s_contents(t) {
		t.eq(t.ws__.s('abc').contents(), 'abc');
		this.testSetup(t);
		t.eq(t.ws__.s('abc', 3).contents(), 'abcabcabc');
		this.testSetup(t);
		t.eq(t.ws__.s(17).contents(), '17');
		this.testSetup(t);
		t.eq(t.ws__.s(0).contents(), '0');
		this.testSetup(t);
		t.eq(t.ws__.s(false).contents(), 'false');
	}

	//======================================
	// whitespace
	//======================================
	static test_sp(t) {
		t.eq(t.ws__.sp().contents(), '.');
		t.eq(t.ws__.sp(3).contents(), '....');
	}

	static test_cr(t) {
		t.eq(t.ws__.cr().contents(), '|');
		t.eq(t.ws__.cr(3).contents(), '||||');
	}

	static test_tab(t) {
		t.eq(t.ws__.tab().contents(), ';');
		t.eq(t.ws__.tab(3).contents(), ';;;;');
	}

	//======================================
	// characters
	//======================================
	static test_colon_comma_semi_period_dot_eq_ne_gt_ge_lt_le(t) {
		t.ws__.colon().comma().semi().period().dot();
		t.ws__.eq().ne().gt().ge().lt().le();
		t.eq(t.ws__.contents(), ":,;..=!=>>=<<=");
		this.testSetup(t);
		t.ws__.colon(2).comma(2).semi(2).period(2).dot(2);
		t.ws__.eq(2).ne(2).gt(2).ge(2).lt(2).le(2);
		t.eq(t.ws__.contents(), "::,,;;....==!=!=>>>=>=<<<=<=");
	}

	//======================================
	// lines
	//======================================
	static test_dash_star_under(t) {
		t.ws__.dash().star().under();
		t.eq(t.ws__.contents(), "-*_");
		this.testSetup(t);
		t.ws__.dash(2).star(2).under(2);
		t.eq(t.ws__.contents(), "--**__");
	}

	//======================================
	// indent or stop
	//======================================
	static test_ind_inc_dec(t) {
		t.eq(t.ws__.s('a').ind().s('b').contents(), 'ab');
		t.ws__.inc();
		t.eq(t.ws__.ind().s('c').contents(), 'ab,,,,c');
		t.ws__.inc();
		t.eq(t.ws__.ind().s('d').contents(), 'ab,,,,c,,,,,,,,d');
		t.ws__.dec();
		t.eq(t.ws__.ind().s('e').contents(), 'ab,,,,c,,,,,,,,d,,,,e');
	}

	//======================================
	// adjust indent or stop
	//======================================
	static test_setStop_unStop_unstopAll(t) {
		t.ws__.s('12345').setStop().s('67890').setStop().s('12345').setStop();
		t.eq(t.ws__._stops, [5, 10, 15]);
		t.ws__.unStop();
		t.eq(t.ws__._stops, [5, 10]);
		t.ws__.unstopAll();
		t.eq(t.ws__._stops, []);
	}

	static test_getStop(t) {
		t.eq(t.ws__.getStop(), null);
		t.ws__.s('12345').setStop().s('67890').setStop().s('12345').setStop();
		t.eq(t.ws__._stops, [5, 10, 15]);
		t.eq(t.ws__.getStop(), 15);
		t.eq(t.ws__._stops, [5, 10, 15]);
	}

	//======================================
	// combinations
	//======================================
	static test_crInd(t) {
		t.ws__.s('one').inc().crInd().s('two');
		t.ws__.dec().crInd().s('three');
		t.eq(t.ws__.contents(), "one|,,,,two|three");
	}

	static test_crIndS(t) {
		t.ws__.s('one').inc().crIndS('two');
		t.ws__.dec().crIndS('three');
		t.eq(t.ws__.contents(), "one|,,,,two|three");
	}

	static test_key(t) {
		t.ws__.inc().key('one');
		t.eq(t.ws__.contents(), ",,,,one:.");
		t.eq(t.ws__._stops, [9]);
	}

	static test_line(t) {
		t.ws__.line().cr().line(4);
		t.eq(t.ws__.contents(), "==========|====");
	}

	static test_title(t) {
		t.ws__.title('Hello');
		t.eq(t.ws__.contents(), "|=====|Hello|=====||");
	}

	static test_comment(t) {
		t.ws__.comment('Hello');
		t.eq(t.ws__.contents(), "/******|* Hello|*/|");
	}

	//======================================
	// columns
	//======================================
	static test_colBasic(t) {
		let r = t.ws__.s('12345').colBasic(7).contents();
		t.eq(r, "12345..");
		this.testSetup(t);
		r = t.ws__.s('12345').colBasic(4).contents();
		t.eq(r, "12345");
		this.testSetup(t);
		r = t.ws__.s('12345').colBasic(4, true).contents();
		t.eq(r, "123.");
		this.testSetup(t);
		r = t.ws__.s('12345').colBasic(4, true, true).contents();
		t.eq(r, "1234");
	}

	static test_col(t) {
		let r = t.ws__.s('12345').col(7).contents();
		t.eq(r, "12345..");
		this.testSetup(t);
		r = t.ws__.s('12345').col(4).contents();
		t.eq(r, "12345");
	}

	static test_colTrim(t) {
		let r = t.ws__.s('12345').colTrim(7).contents();
		t.eq(r, "12345..");
		this.testSetup(t);
		r = t.ws__.s('12345').colTrim(4).contents();
		t.eq(r, "123.");
	}

	static test_colTrimNoSpace(t) {
		let r = t.ws__.s('12345').colTrimNoSpace(7).contents();
		t.eq(r, "12345..");
		this.testSetup(t);
		r = t.ws__.s('12345').colTrimNoSpace(4).contents();
		t.eq(r, "1234");
	}

	//======================================
	// visiting
	//======================================
	static test_visitWith(t) {
		const visitor = {
			visit: function (v, ws) {
				ws.s('visited ' + v)
			}
		};
		t.ws__.s('[');
		t.ws__.visitWith('hello', visitor);
		t.ws__.s(']');
	}

	//======================================
	// printing
	//======================================
	static test_print(t) {
		let r;
		const object = {
			printOn: function (ws) {
				ws.s('XXX');
			}
		};
		r = t.ws__.print(1);
		t.eq(t.ws__.contents(), '1');
		t.eq(r.contents(), t.ws__.contents());
		this.testSetup(t);
		r = t.ws__.print(object);
		t.eq(t.ws__.contents(), 'XXX');
		t.eq(r.contents(), t.ws__.contents());
	}

	static test_printBetween(t) {
		let result = t.ws__.printBetween([1, 2, 3], function (ws) {
			ws.cr().inc().ind();
		});
		t.eq(t.ws__.contents(), '1|,,,,2|,,,,,,,,3');
		t.eq(result.contents(), t.ws__.contents());
	}

	static test_printBetweenCommaSp(t) {
		let result = t.ws__.printBetweenCommaSp([1, 2, 3]);
		t.eq(t.ws__.contents(), '1, 2, 3');
		t.eq(result.contents(), t.ws__.contents());
	}

	static test_printBetweenCrInd(t) {
		let r = t.ws__.inc().printBetweenCrInd([1, 2, 3]);
		t.eq(t.ws__.contents(), "1|,,,,2|,,,,3");
		t.eq(r.contents(), t.ws__.contents());
	}

	//======================================
	// querying
	//======================================
	static test_length(t) {
		let r = t.ws__.length();
		t.eq(r, 0);
		r = t.ws2__.length();
		t.eq(r, 18);
		r = t.ws3__.length();
		t.eq(r, 18);
	}

	static test_lengthAfterLastCr(t) {
		let r = t.ws__.lengthAfterLastCr();
		t.eq(r, 0);
		r = t.ws2__.lengthAfterLastCr();
		t.eq(r, 4);
		r = t.ws3__.lengthAfterLastCr();
		t.eq(r, 18);
	}

	static test_asLines(t) {
		let r = t.ws__.asLines();
		t.eq(r, ['']);
		r = t.ws2__.asLines();
		t.eq(r, ["one", "two", "three", "four"]);
		r = t.ws3__.asLines();
		t.eq(r, ["one_two_three_four"]);
	}

	static test_lastCrIndex(t) {
		let r = t.ws__.lastCrIndex();
		t.eq(r, -1);
		r = t.ws2__.lastCrIndex();
		t.eq(r, 13);
		r = t.ws3__.lastCrIndex();
		t.eq(r, -1);
	}

	static test_afterLastCrIndex(t) {
		let r = t.ws__.afterLastCrIndex();
		t.eq(r, 0);
		r = t.ws2__.afterLastCrIndex();
		t.eq(r, 14);
		r = t.ws3__.afterLastCrIndex();
		t.eq(r, 0);
	}

	static test_lastLineLength(t) {
		let r = t.ws__.lastLineLength();
		t.eq(r, 0);
		r = t.ws2__.lastLineLength();
		t.eq(r, 4);
		r = t.ws3__.lastLineLength();
		t.eq(r, 18);
	}

	static test_numberOfLines(t) {
		let r = t.ws__.numberOfLines();
		t.eq(r, 1);
		r = t.ws2__.numberOfLines();
		t.eq(r, 4);
		r = t.ws3__.numberOfLines();
		t.eq(r, 1);
	}

	static test_maxLineLength(t) {
		let r = t.ws__.maxLineLength();
		t.eq(r, 0);
		r = t.ws2__.maxLineLength();
		t.eq(r, 5);
		r = t.ws3__.maxLineLength();
		t.eq(r, 18);
	}

	static test_stringReverse(t) {
		let r = t.ws__.stringReverse();
		t.eq(r, "");
		r = t.ws2__.stringReverse();
		t.eq(r, "ruof\neerht\nowt\neno");
		r = t.ws3__.stringReverse();
		t.eq(r, "ruof_eerht_owt_eno");
	}

	//======================================
	// result
	//======================================
	static test_asHtml(t) {
		t.eq(t.ws__.asHtml(), "");
		t.eq(t.ws2__.asHtml(), "one<br />two<br />three<br />four");
		t.eq(t.ws3__.asHtml(), "one_two_three_four");
	}
}

const Module = {
	addModuleToTestClasses(aTestClasses) {
		aTestClasses.push(ReadStream_TestCase, WriteStream_TestCase);
	},
};
export {Module as default, ReadStream_TestCase, WriteStream_TestCase};