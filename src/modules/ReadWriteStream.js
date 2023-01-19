/* =======================
 * ReadWriteStream.js
 * ======================= */

/***
 peek is next with last parameter (consume) = false

 while      (char function)
 until       (char function)

 whileWhite  (char function)
 untilWhite  (char function)

 before          whileNot for character, but also substring
 after
 afterExclude

 beforeCr
 afterCr
 afterCrExclude

 beforeWhite
 afterWhite
 afterWhiteExclude

 beforeNotWhite
 afterNotWhite
 afterNotWhiteExclude

 nextLine = afterCrExclude

 rest
 peekRest
 atEnd

 atStart

 restIncludes
 lineIncludes

 ***/
class ReadStream {
	//=======================================
	//ReadStream is inspired by Smalltalk's
	//ReadStream.  It allows you to read from
	//a string programmatically.  It knows how to
	//read up to or through a cr, a position,
	//a substring, or a grep match.
	//
	//It is useful for simple parsing.
	//=======================================


	//=======================================
	//Prototype-read/Instance-write variables.
	//  Initial values read from prototype
	//  Initial values can be overwritten
	//      in WriteStream.create({here})
	//  New values are written to instances
	//=======================================
	constructor(s) {
		this.s = s || '';   // string
		this.p = 0;       // position
	}

	//======================================
	//Instance methods (called by instances)
	//======================================
	//======================================
	// utility
	//======================================
	makeGlobal(re) {
		let modifiers = 'g';
		if (re.ignoreCase) {
			modifiers += 'i';
		}
		if (re.multiline) {
			modifiers += 'm';
		}
		return new RegExp(re.source, modifiers);
	}

	//======================================
	// string parts
	//======================================
	contents() {
		return this.s;
	}

	char() {
		if (this.atEnd()) {
			return null;
		}
		return this.slice(this.p, this.p + 1);
	}

	snapshot(n) {
		n = n || 5;
		let p = this.p;
		let start = p - n;
		start = Math.max(start, 0);
		let end = p + n;
		end = Math.min(end, this.length());
		//
		let prefix = '', suffix = '';
		if (start !== 0) {
			prefix = '...';
		}
		if (end !== this.length()) {
			suffix = '...';
		}
		const before = this.slice(start, p);   //.replace(/\n/, '\\n');
		const after = this.slice(p, end);      //.replace(/\n/, '\\n');
		return '[' + prefix + before + '|' + after + suffix + '][' + this.p + ']';
	}

	slice(start, end) {
		let result;
		if (end !== undefined) {
			result = this.s.slice(start, end);
		} else {
			if (start !== undefined) {
				result = this.s.slice(start);
			} else {
				result = this.s.slice();
			}
		}
		return result;
	}

	sliceToEnd() {
		return this.slice(this.p);
	}

	splitSplit(sSplitter1, sSplitter2) {
		function splitTrimNoEmpties(sString, sSplitter) {
			const array1 = sString.split(sSplitter);
			const array2 = array1.map((each) => {
				return each.trim();
			});
			return array2.filter((each) => {
				return !!each;
			});
		}

		const array = splitTrimNoEmpties(this.s, sSplitter1);
		const arrayOfArrays = [];
		for (let i = 0; i < array.length; i++) {
			arrayOfArrays.push(splitTrimNoEmpties(array[i], sSplitter2))
		}
		return arrayOfArrays;
	}

	split(sSeparator) {
		return this.s.split(sSeparator);
	}

	splitTrim(sSeparator) {
		//split, trim pieces, then remove blanks
		const array = this.split(sSeparator);
		return array.map((each) => {
			return each.trim();
		});
	}

	splitTrimCull(sSeparator) {
		//split, trim pieces, then remove blanks
		const trimmed = this.splitTrim(sSeparator);
		return trimmed.filter((each) => {
			//true if not blank
			return !!each;
		});
	}

	asHtml() {
		//replace \n with <br />
		let html = this.s;
		//html = html.replace(/&/g, '&amp;');
		html = html.replace(/\t/g, '&nbsp;&nbsp;&nbsp;&nbsp;');
		html = html.replace(/\t/g, '&#09;');
		html = html.replace(/ /g, '&nbsp;');
		html = html.replace(/</g, '&lt;');
		html = html.replace(/>/g, '&gt;');
		html = html.replace(/\n/g, '<br />');
		return html;
	}

	//======================================
	// lines
	//======================================
	firstLine() {
		return this.lines()[0];
	}

	lines() {
		return this.split('\n');
	}

	linesTrim() {
		//get lines, trim each
		return this.splitTrim('\n');
	}

	linesTrimCull() {
		//get lines, trim each, then remove blanks
		return this.splitTrimCull('\n');
	}

	forEachLine(f_each_i_a) {
		return this.lines().map(f_each_i_a);
	}

	//======================================
	// length
	//======================================
	length() {
		return this.s.length;
	}

	lengthToEnd() {
		return this.length() - this.p;
	}

	//======================================
	// boolean
	//======================================
	atStart() {
		return (this.p === 0);
	}

	atEnd() {
		return (this.p === this.length());
	}

	matchesHere(re) {
		const search = this.sliceToEnd().search(re);
		return (search === 0);
	}

	//======================================
	// next, peek, go
	//======================================
	next(n, bPeek, bGo) {
		//next is next(n, false, false)
		//peek is next(n, true, false)
		//go is next(n, false, true)
		if (n !== 0) {
			n = n || 1
		}
		const from = this.p;
		let to = this.p + n;
		to = Math.min(to, this.length());
		const result = this.slice(from, to);
		this.p = to;
		if (bGo) {
			return this;
		}
		if (bPeek) {
			this.p = from;
		}
		return result;
	}

	nextToEnd(bPeek, bGo) {
		return this.next(this.lengthToEnd(), bPeek, bGo);
	}

	peek(n) {
		return this.next(n, true, false);
	}

	go(n) {
		return this.next(n, false, true);
	}

	//======================================
	// before, after
	//======================================
	before(re, bPeek, bGo) {
		const fromHere = this.sliceToEnd();
		let index = fromHere.search(re);
		index = (index === -1 ? this.lengthToEnd() : index);
		return this.next(index, bPeek, bGo);
	}

	after(re, bPeek, bGo) {
		const reG = this.makeGlobal(re);
		const fromHere = this.sliceToEnd();
		reG.exec(fromHere);
		let result;
		const index = reG.lastIndex;
		if (index === 0) {
			result = this.nextToEnd(bPeek, bGo);
		} else {
			result = this.next(index, bPeek, bGo);
		}
		return result;
	}

	beforeLineStartsWith(re) {
		//if at start, and first line starts with re, do nothing
		const start = this.p;
		let result;
		if (this.atStart() && this.matchesHere(re)) {
			result = '';
			return result;
		}
		//else repeat until at start of line that starts with re
		while (!this.atEnd()) {
			this.after(/\n/);
			if (this.matchesHere(re)) {
				result = this.slice(start, this.p);
				return result;
			}
		}
		//didn't find \n followed be re - will be at end here
		return this.slice(start, this.length());
	}

	//======================================
	// nextWhile, nextUntil
	//======================================
	nextWhile(fWhile) {
		const start = this.p;
		//increment p until at end, or fWhile is false
		while (!this.atEnd() && fWhile(this.char())) {
			this.p++;
		}
		return this.slice(start, this.p);
	}

	nextUntil(fUntil) {
		return this.nextWhile(function (c) {
			return !fUntil(c);
		});
	}

	//======================================
	// SON parse
	//
	// SON means "simple object notation"
	// This method converts SON to JSON
	//
	// xxx
	// .one:1
	// .two
	//    20
	//    21
	// .three:
	//    30
	//    31
	//
	// {one:'1', two:'   20\n   21', three:'   30\n   31'}
	//======================================
	sonToJson() {
		const pages = this.splitTrimCull(/\n==\n/);
		return pages.map((each) => {
			const rs = new ReadStream(each);
			return rs.sonToJsonInner();
		});
	}

	sonToJsonInner() {
		function trimCr(s) {
			//trim leading and trailing cr's
			return s.replace(/^\n+/, '').replace(/\n+$/, '');
		}

		function trimColon(s) {
			//trim leading :
			return s.replace(/^:/, '');
		}

		let groups = this.splitTrimCull(/\n\./);
		if (this.char() !== '.') {
			//get rid of junk before first key
			groups = groups.slice(1);
		}
		const result = {};
		groups.forEach((each) => {
			const endOfKey = each.search(/[:\n]/);
			let key = each.slice(0, endOfKey);
			key = trimCr(key);
			let value = each.slice(endOfKey);
			value = trimColon(value);
			value = trimCr(value);
			result[key] = value;
		});
		return result;
	}
}

class WriteStream {
	//Prototype (used to create instances)

	//WriteStream is inspired by Smalltalk's
	//WriteStream.  It allows you to create
	//a string programtically.  It knows how to
	//increment indent and decrement indent.
	//It is useful for allowing tree objects to
	//print themselves.

	//Example
	//
	//const stream = WriteStream.create({_sp:'_'});
	//stream.ind().s('hello').cr().
	// inc().
	// ind().s('how').sp().s('are').cr().
	// ind().s('you').cr().
	// dec().
	// ind().s('world').cr(2);
	//return stream.contents();

	constructor(s) {
		this._string = s || '';
		this._indent = '    ';
		this._indentCount = 0;
		this._stops = [];

		this._sp = ' ';
		this._cr = '\n';
		this._tab = '\t';

		this._line = '=';
	}


	//======================================
	// add string(s)
	//======================================
	s(s, n) {
		if (n !== 0) {
			n = n || 1
		}
		while (n--) {
			this._string += s;
		}
		return this;
	}

	//======================================
	// whitespace
	//======================================
	sp(n) {
		return this.s(this._sp, n)
	}

	cr(n) {
		return this.s(this._cr, n)
	}

	tab(n) {
		return this.s(this._tab, n)
	}

	//======================================
	// characters
	//======================================
	colon(n) {
		return this.s(':', n)
	}

	comma(n) {
		return this.s(',', n)
	}

	semi(n) {
		return this.s(';', n)
	}

	period(n) {
		return this.s('.', n)
	}

	dot(n) {
		return this.s('.', n)
	}

	eq(n) {
		return this.s('=', n)
	}

	ne(n) {
		return this.s('!=', n)
	}

	gt(n) {
		return this.s('>', n)
	}

	ge(n) {
		return this.s('>=', n)
	}

	lt(n) {
		return this.s('<', n)
	}

	le(n) {
		return this.s('<=', n)
	}

	//======================================
	// lines
	//======================================
	dash(n) {
		return this.s('-', n)
	}

	star(n) {
		return this.s('*', n)
	}

	under(n) {
		return this.s('_', n)
	}

	//======================================
	// indent or stop
	//======================================
	ind() {
		const stop = this.getStop();
		if (stop) {
			return this.col(stop, true)
		} else {
			return this.s(this._indent, this._indentCount);
		}
	}

	//======================================
	// adjust indent or stop
	//======================================
	inc() {
		this._indentCount += 1;
		return this;
	}

	dec() {
		this._indentCount -= 1;
		this._indentCount = Math.max(0, this._indentCount);
		return this;
	}

	setStop() {
		this._stops.push(this.lengthAfterLastCr());
		return this;
	}

	unStop() {
		this._stops.pop();
		return this;
	}

	unstopAll() {
		this._stops = [];
		return this;
	}

	getStop() {
		if (this._stops.length === 0) {
			return null;
		}
		return this._stops[this._stops.length - 1];
	}

	//======================================
	// combinations
	//======================================
	crInd() {
		return this.cr().ind();
	}

	crIndS(s) {
		return this.cr().ind().s(s);
	}

	key(s) {
		return this.ind().s(s).colon().sp().setStop();
	}

	line(n) {
		if (n !== 0) {
			n = n || 10
		}
		return this.s(this._line, n);
	}

	title(s) {
		const length = s.length;
		return this.crInd().line(length).crIndS(s).crInd().line(length).cr(2);
	}

	comment(s) {
		const length = s.length;
		this.s('/').s('*', length + 1).crIndS('* ').s(s).crIndS('*', length + 1).s('/').cr();
		return this;
	}

	//======================================
	// columns
	//======================================
	colBasic(nPosition, bTrim, bNoSpace) {
		//  move right to column
		//  if bTrim, delete left to column
		//  if bSpace, delete one more and add space
		//  (assume length of _sp is 1)
		const desired = this.afterLastCrIndex() + nPosition;
		const actual = this._string.length;
		const delta = desired - actual;
		if (delta > 0) {
			this.sp(delta);
		} else {
			if (bTrim) {
				if (delta < 0) {
					this._string = this._string.slice(0, delta);    //delta is negative
				}
				if (!bNoSpace) {                                    //make a space (is default)
					this._string = this._string.slice(0, -1);
					this.sp();
				}
			}
		}
		return this;
	}

	col(nPosition) {
		return this.colBasic(nPosition);
	}

	colTrim(nPosition) {
		return this.colBasic(nPosition, true);
	}

	colTrimNoSpace(nPosition) {
		return this.colBasic(nPosition, true, true);
	}

	//======================================
	// visiting
	//======================================
	visitWith(v, oVisitor) {
		oVisitor.visit(v, this);
		return this;
	}

	//======================================
	// printing
	//======================================
	print(v) {
		//print a value (that understands .printOn() or .toString()) on the stream
		if (v.printOn) {
			v.printOn(this);
			return this;
		}
		if (v.toString) {
			this.s(v.toString());
			return this;
		}
		this.s('???' + typeof v + '???');
		return this;
	}

	printBetween(a, fBetween) {
		//print an array of values, calling fBetween(ws) in between them
		if (!fBetween) {
			return this.printBetweenCommaSp(a);
		}
		if (typeof fBetween === 'string') {
			const string = fBetween;
			fBetween = function (ws) {
				ws.s(string);
			}
		}
		for (let i = 0; i < a.length; i++) {
			this.print(a[i]);
			if (i < a.length - 1) {
				fBetween(this);
			}
		}
		return this;
	}

	printBetweenCommaSp(aValues) {
		return this.printBetween(aValues, ', ');
	}

	printBetweenCrInd(aValues) {
		return this.printBetween(aValues, function (ws) {
			ws.cr().ind()
		});
	}

	//======================================
	// querying
	//======================================
	length() {
		return this._string.length
	}

	lengthAfterLastCr() {
		const indexAfterCr = this.afterLastCrIndex();
		return this._string.length - indexAfterCr;
	}

	asLines() {
		return this._string.split(this._cr);
	}

	lastCrIndex() {
		return this._string.lastIndexOf(this._cr);
	}

	afterLastCrIndex() {
		const lastIndex = this.lastCrIndex();
		return lastIndex + this._cr.length;
	}

	lastLineLength() {
		return this.length() - this.lastCrIndex() - 1;
	}

	numberOfLines() {
		return this.asLines().length
	}

	maxLineLength() {
		const lines = this.asLines();
		let result = 0;
		for (let i in lines) {
			result = Math.max(result, lines[i].length);
		}
		return result;
	}

	stringReverse() {
		return this._string.split('').reverse().join('');
	}

	//======================================
	// result
	//======================================
	asHtml() {
		const rs = new ReadStream(this._string);
		return rs.asHtml();
	}

	contents() {
		return this._string;
	}
}

const Module = {
	addModuleToClasses(oClasses) {
		oClasses.ReadStream = ReadStream;
		oClasses.WriteStream = WriteStream;
	},
};
export {Module as default, ReadStream, WriteStream};