import _ from 'https://cdn.skypack.dev/lodash';

window._ = _;

class Stream {
	constructor(sName = "Stream", oRiverProxy) {
		this.name_ = sName;
		this.river_ = oRiverProxy;
		this.onValueFunctions_ = [];
		this.value_ = undefined;
	}

	// =================================
	// API - miscellaneous
	// =================================
	// do nothing - allows stream to be created
	touch() {
		return this;
	}

	// set one or more properties
	assign(o) {
		// myStream.assign({
		//      myKey1: myValue1,
		//      myKey2: myValue2
		// })
		Object.assign(this, o);
		return this;
	}

	// lazy init, and push to an array property
	assignPush(sName, ...args) {
		// myStream.assignPush("one_",s 11,22,33))
		if (!this[sName]) {
			this[sName] = [];
		}
		args.forEach(each => {
			if (!this[sName].includes(each)) {
				this[sName].push(each);
			}
		});
		return this;
	}

	// =================================
	// API - query
	// =================================
	value(vDefault) {
		if (this.value_ === undefined) {
			return vDefault;
		} else {
			return this.value_;
		}
	}

	hasValue() {
		return !(this.value_ === undefined);
	}

	label(sLabel) {
		if (sLabel === undefined) {
			return this.label_;
		} else {
			this.label_ = sLabel;
			return this;
		}
	}

	// =================================
	// API - listen
	// =================================
	onValue(f, trigger = false) {
		// f(v, oStream)
		this.onValueFunctions_.push(f);
		if (trigger && this.hasValue()) {
			f(this.value_, this);
		}
		return this;
	}

	clearListeners() {
		this.onValueFunctions_ = [];
		return this;
	}

	// =================================
	// API - push
	// =================================
	triggerOnValue() {
		if (this.hasValue()) {
			this.onValueFunctions_.forEach(each => each(this.value_, this));
		}
		return this;
	}

	push(v, kw = {}) {
		const options = {...{clean: false, unique: false}, ...kw};
		if (options.unique && _.isEqual(v, this.value_)) {
			//do not push if v has not changed
			return this;
		}
		this.value_ = v;
		this.triggerOnValue();
		return this;
	}

	uPush(v) {
		return this.push(v, {unique: true});
	};

	pushCycle(a) {
		const currentIndex = a.indexOf(this.value());
		const nextIndex = (currentIndex + 1) % a.length;
		return this.push(a[nextIndex]);
	}

	// =================================
	// API - push strings
	// =================================
	appendString(s, delimiter = "") {
		if ((!_.isString(this.value_)) || this.value_ === "") {
			//push first string
			this.push(s.toString());
		} else {
			//push subsequent strings
			this.push(this.value_ + delimiter + s.toString());
		}
		return this;
	};

	prependString(s, delimiter = "") {
		if ((!_.isString(this.value_)) || this.value_ === "") {
			//push first string
			this.push(s.toString());
		} else {
			//push subsequent strings
			this.push(s.toString() + delimiter + this.value_ );
		}
		return this;
	};

	appendLine(s) {
		this.appendString(s, "\n");
		return this;
	};

	prependLine(s) {
		this.prependString(s, "\n");
		return this;
	};

	clearString() {
		this.push("");
		return this;
	}

	// =================================
	// API - render
	// =================================
	postRenderFunctions() {
		if (!this.postRenderFunctions_) {
			this.postRenderFunctions_ = [];
		}
		return this.postRenderFunctions_;
	}

	classes() {
		if (!this.classes_) {
			this.classes_ = [];
		}
		return this.classes_;
	}

	onRender(f) {
		// f($element, z)
		this.postRenderFunctions().push(f);
		return this;
	}

	postRender($element) {
		this.postRenderFunctions().forEach(each => each($element, this));
		return this;
	}

	addClasses(...args) {
		this.classes().push(...args);
		return this;
	}

	classString(sClass) {
		if (sClass) {
			this.addClasses(sClass);
		}
		return this.classes().join(" ").trim();
	}

	// Stream
}

class EventStream extends Stream {
	constructor(sName = "EventStream", oRiver = {name_: "River"}) {
		super(sName, oRiver);
		this.onEventFunctions_ = {};
	}

	// =================================
	// API - events
	// =================================
	on(sEventName, f) {
		this.getEventHandlers(sEventName).push(f);
		return this;
	}

	trigger(sEventName, ...args) {
		this.getEventHandlers(sEventName).forEach(each => {
			each(...args);
		});
		return this;
	}

	// =================================
	// utility
	// =================================
	getEventHandlers(sEventName) {
		let allHandlers = this.onEventFunctions_;
		if (!allHandlers) {
			allHandlers = {};
			this.onEventFunctions_ = allHandlers;
		}
		let eventHandlers = allHandlers[sEventName];
		if (!eventHandlers) {
			eventHandlers = [];
			this.onEventFunctions_[sEventName] = eventHandlers;
		}
		return eventHandlers;
	}

	// used for tests
	clearEventHandlers(sEventName) {
		if (sEventName) {
			this.onEventFunctions_[sEventName] = [];
		} else {
			this.onEventFunctions_ = {};
		}
		return this;
	}

	// EventStream
}

class DirtyStream extends EventStream {
	constructor(sName = "DirtyStream", oRiverProxy) {
		super(sName, oRiverProxy);
		this.cleanValue_ = undefined;
		this.dirty_ = undefined;
	}

	isDirty() {
		return !_.isEqual(this.value_, this.cleanValue_);
	}

	onDirty(f) {
		this.on("dirty_", f);
		return this;
	}

	clearListeners() {
		super.clearListeners();
		this.onDirtyFunctions_ = [];
		return this;
	}

	triggerOnDirty() {
		if (this.hasValue()) {
			const newDirty = this.isDirty();
			if (newDirty !== this.dirty_) {
				this.dirty_ = newDirty;
				this.trigger("dirty_", newDirty);
			}
		}
		return this;
	}

	push(v, kw = {}) {
		super.push(v, kw);
		const options = {...{clean: false}, ...kw};
		if (options.clean) {
			//set clean
			this.cleanValue_ = v;
		}
		this.triggerOnDirty();
		return this;
	}

	cPush(v) {
		return this.push(v, {clean: true});
	}

	cuPush(v) {
		return this.push(v, {clean: true, unique: true});
	};

	setClean() {
		this.cleanValue_ = this.value_;
		this.triggerOnDirty();
		return this;
	}

	// DirtyStream
}

class River {
	constructor(oRiver = {name_: "River"}) {
		const proxy = new Proxy(oRiver, {
			get: function (oRiver, sGetter) {
				if (!sGetter.endsWith("_")) {
					if (oRiver[sGetter] === undefined) {
						oRiver[sGetter] = new DirtyStream(sGetter);
						oRiver[sGetter].river_ = oRiver.proxy_;
						oRiver.onStreamCreate_ && oRiver.onStreamCreate_(oRiver[sGetter]);
					}
				}
				return oRiver[sGetter];
			},
		});
		proxy.self_ = oRiver;
		Object.assign(proxy, {
			streamNames_: function streamNames_() {
				return Object.keys(this)
					.sort()
					.filter(each => {
						return !each.endsWith("_");
					});
			},
			streams_: function streams_() {
				return this.streamNames_().map(each => {
					return this[each];
				});
			},
		});
		oRiver.proxy_ = proxy;
		return proxy;
	}

	static clear(zzRiver) {
		const target = zzRiver.self_;
		const keys = Object.keys(target);
		keys.forEach((each) => {
			// only delete stream names
			if (each.slice(-1) !== "_") {
				delete target[each];
			}
		});
	}

	// ======================
	// Unit Tests
	// ======================
	static test_streamNames_(t) {
		const river = new River();
		river.one;
		river.two;
		t.eq(river.self_.streamNames_(), ["one", "two"]);
	}

	static test_streams_(t) {
		let result;
		const river = new River();
		river.one.push(11);
		river.two.push(22);
		result = river.self_.streams_().map(each => {
			return [each.name_, each.value()];
		});
		t.eq(result, [["one", 11], ["two", 22]]);
	}

	static test_label(t) {
		const river = new River();
		const stream = river.one;
		let result = stream.label("One").label();
		t.eq(result, "One");
		result = stream.label_;
		t.eq(result, "One");
	}

	static test_onStreamCreate_(t) {
		const river = new River();
		river.two_ = 2;
		river.onStreamCreate_ = (stream) => stream.one_ = 3 - stream.river_.two_;
		const stream = river.one;
		let result = stream.one_;
		t.eq(result, 1);
	}

	static test_getEventHandlers(t) {
		const river = new River();
		const stream = river.one;
		let result = stream.getEventHandlers("eventOne");
		t.eq(result, []);
		result = stream.onEventFunctions_;
		t.eq(result, {eventOne: []});
	}

	static test_on_trigger(t) {
		const river = new River();
		const stream = river.one;
		let result = "RESULT";
		stream.on("eventOne", (x, y) => {
			result += x;
			result += y;
		});
		stream.trigger("eventOne", " ONE", " TWO");
		t.eq(result, "RESULT ONE TWO");
	}

	static test_clearEventListeners(t) {
		const river = new River();
		const stream = river.one;
		stream.on("eventOne", () => 9999);
		stream.on("eventTwo", () => 9999);
		stream.on("eventThree", () => 9999);
		t.eq(stream.getEventHandlers("eventOne").length, 1);
		t.eq(stream.getEventHandlers("eventTwo").length, 1);
		t.eq(stream.getEventHandlers("eventThree").length, 1);
		stream.clearEventHandlers("eventTwo");
		t.eq(stream.getEventHandlers("eventOne").length, 1);
		t.eq(stream.getEventHandlers("eventTwo").length, 0);
		t.eq(stream.getEventHandlers("eventThree").length, 1);
		stream.clearEventHandlers();
		t.eq(stream.getEventHandlers("eventOne").length, 0);
		t.eq(stream.getEventHandlers("eventTwo").length, 0);
		t.eq(stream.getEventHandlers("eventThree").length, 0);
	}

	static test_push(t) {
		let result = 0;
		const river = new River();
		const stream = river.one;
		stream.onValue(function (v) {
			result = v;
		});
		t.eq(result, 0);
		stream.push(17);
		t.eq(result, 17);
		stream.push(18);
		t.eq(result, 18);
		result = 0;
		stream.uPush(18);
		t.eq(result, 0);
		stream.clearString();
		t.eq(result, "");
		stream.appendString("xxx");
		t.eq(result, "xxx");
		stream.appendString("yyy");
		t.eq(result, "xxxyyy");
		stream.appendString("zzz", "|");
		t.eq(result, "xxxyyy|zzz");
		stream.appendLine("aaa");
		t.eq(result, "xxxyyy|zzz\naaa");
		stream.clearListeners();
		stream.push(17);
		t.eq(result, "xxxyyy|zzz\naaa");
	}

	static test_assign(t) {
		const river = new River();
		const stream = river.one;
		stream.assign({one_: 11, two_: 22});
		t.eq(stream.one_, 11);
		t.eq(stream.two_, 22);
	}

	static test_assignPush(t) {
		const river = new River();
		const stream = river.one;
		stream.assignPush("one_", 11, 22, 33);
		stream.assignPush("one_", 22, 33, 44);
		t.eq(stream.one_, [11, 22, 33, 44]);
	}

	// River
}

const Module = {
	addModuleToClasses(oClasses) {
		oClasses.River = River;
	},
	addModuleToTestClasses(aTestClasses) {
		aTestClasses.push(River);
	},
};
export {Module as default, River};