import _ from "https://cdn.skypack.dev/lodash";
import moment from "https://cdn.skypack.dev/moment";
import YAML from "https://cdn.skypack.dev/yaml";

class Utility {
    // =========================================
    // atAdd
    // =========================================
    static atAdd(o, sKey, v, bUnique = false) {
        if (!o[sKey]) {
            o[sKey] = [];
        }
        if (bUnique) {
            if (!o[sKey].includes(v)) {
                o[sKey].push(v);
            }
        } else {
            o[sKey].push(v);
        }
    }

    static test_atAdd(t) {
        const result = {};
        this.atAdd(result, "one", 11);
        this.atAdd(result, "one", 111);
        this.atAdd(result, "one", 111);
        this.atAdd(result, "one", 111, true);
        this.atAdd(result, "two", 22);
        this.atAdd(result, "two", 222);
        const desired = {
            one: [11, 111, 111], two: [22, 222],
        };
        t.eq(result, desired);
    }

    // =========================================
    // report
    // =========================================
    static groupReport(oData, fReport, sTitle) {
        if (sTitle) {
            fReport(sTitle);
        }
        Object.keys(oData).sort().forEach(each => {
            fReport("\n===== " + each + " =====\n");
            oData[each].forEach(each2 => {
                fReport(each2);
            });
        });
    }

    static groupReport2(oData, fString, fReport, sTitle) {
        if (sTitle) {
            fString(sTitle);
        }
        Object.keys(oData).sort().forEach(each => {
            fString("\n===== " + each + " =====\n");
            oData[each].sort().forEach(each2 => {
                fReport(each2);
            });
        });
    }

    static test_groupReport(t) {
        let result = "";
        const fReport = (s) => {
            result += s + "\n";
        };
        const data = {
            one: ["11", "111"], two: ["22", "222"],
        };
        this.groupReport(data, fReport, "TITLE");
        const desired = `TITLE

===== one =====

11
111

===== two =====

22
222
`;
        t.eq(result, desired);
    }

    // =========================================
    // since
    // =========================================
    // const start = since();
    // const elapsed = since(start);
    // const elapsed = toSeconds(since(start));
    static since(iMilliseconds) {
        if (iMilliseconds) {
            return new Date().getTime() - iMilliseconds;
        } else {
            return new Date().getTime();
        }
    }

    static toSeconds(iMilliseconds) {
        return Math.round(iMilliseconds / 1000);
    }

    // =========================================
    // secondLineSplit
    // =========================================
    static secondLineSplit(sText) {
        const lines = sText.split("\n");
        const secondLine = lines[1];
        const separator = `\n${secondLine}\n`;
        return sText
            .split(separator)
            .map(each => {
                return each.trim();
            })
            .filter(each => {
                return (each !== "");
            });
    }

    static test_secondLineSplit(t) {
        const testString = `xxx
====

asdf
asdf

====
qwer
qwer

====
zxcv
zxcv`;
        const result = this.secondLineSplit(testString);
        t.eq(result, ["xxx", "asdf\nasdf", "qwer\nqwer", "zxcv\nzxcv"]);
    }

    // =========================================
    // backup
    // =========================================
    static saveFile(filename, data) {
        const blob = new Blob([data], {type: "text/text"});
        const element = window.document.createElement("a");
        const url = window.URL.createObjectURL(blob);
        element.href = url;
        element.download = filename;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
        window.URL.revokeObjectURL(url);
    }

    // =========================================
    // getDataPaths
    // =========================================
    static getDataPaths(sText) {
        if (!sText) {
            return [];
        }
        if (sText.trim().length === 0) {
            return [];
        }
        const lines = sText.split("\n");
        const dataLines = lines.filter((each) => each.slice(0, 2) === "@@");
        const dataPaths = dataLines.map(function (each) {
            const delimiter = each[2];
            const path = each.split(delimiter);
            // remove @@
            return (path.slice(1));
        });
        return dataPaths;
    }

    static test_getDataPaths(t) {
        const text = `asdf
asdf
@@/11/22/33
asdf
@@/44/55/66/77
asdf
asdf`;
        let result = this.getDataPaths(text);
        t.eq(result, [["11", "22", "33"], ["44", "55", "66", "77"]]);
    }

    static getDataValues(sText, sKey) {
        // assume zero or one per page
        return this.getData(sText, sKey, true);
    }

    static test_getDataValues(t) {
        let result;
        let text = `xxx
@@|myKey|11
yyy
@@|myKey2|21|22
zzz`;
        result = this.getDataValues(text, "myKey");
        t.eq(result, ["11"]);
        result = this.getDataValues(text, "myKey2");
        t.eq(result, ["21", "22"]);
    }

    // ================================================
    // getData, setData, changeData
    // ================================================
    // data is @@|key|value or @@|key|value|value|value
    // i_key is integer     @@|i_days|1
    // d_key is date        @@|d_last|10/02/2020
    // ================================================
    static getData(sText, sKey, bAsArray = false) {
        // assume zero or one per pages
        const dataPaths = this.getDataPaths(sText).filter(each => {
            return each[0] === sKey;
        });
        if (!dataPaths.length) {
            return null;
        }
        const values = dataPaths[0].slice(1);
        if (values.length === 1 && !bAsArray) {
            // return parsed value or string
            const valueString = values[0];
            if (sKey.slice(0, 2) === "i_") {
                return parseInt(valueString);
            }
            if (sKey.slice(0, 2) === "d_") {
                return moment(valueString);
            }
            return valueString;
        } else {
            // return array
            return values;
        }
    }

    static test_getData(t) {
        let text = `xxx
@@|days|1
yyy
zzz`;
        let result = this.getData(text, "days");
        t.eq(result, "1");
        text = `xxx
@@|i_days|1
yyy
zzz`;
        result = this.getData(text, "i_days");
        t.eq(result, 1);
        text = `xxx
@@|start|10/03/20
yyy
zzz`;
        result = this.getData(text, "start");
        t.eq(result, "10/03/20");
        text = `xxx
@@|d_start|10/03/20
yyy
zzz`;
        result = this.getData(text, "d_start").format("YYYY-MM-DD");
        // result is moment()
        t.eq(result, "2020-10-03");
    }

    static setData(sText, sKey, v) {
        const dataLineRegex = new RegExp(`^\\@\\@\\|${sKey}\\|(.*)$`, "gm");
        const match = sText.match(dataLineRegex);
        if (match) {
            const oldDataLine = match[0];
            let vString = v;
            if (sKey.slice(0, 2) === "i_") {
                vString = v.toString();
            }
            if (sKey.slice(0, 2) === "d_") {
                vString = moment(v).format("YYYY-MM-DD");
            }
            const newDataLine = `@@|${sKey}|${vString}`;
            return sText.replace(oldDataLine, newDataLine);
        } else {
            return null;
        }
    }

    static test_setData(t) {
        const testString = `xxx
@@|days|1
yyy
zzz`;
        const desired = `xxx
@@|days|2
yyy
zzz`;
        const result = this.setData(testString, "days", 2);
        t.eq(result, desired);
    }

    static changeData(sText, sKey, f) {
        // f(oldValue) return newValue
        const oldValue = this.getData(sText, sKey);
        if (!oldValue) {
            return null;
        }
        const newValue = f(oldValue);
        return this.setData(sText, sKey, newValue);
    }

    static test_changeData(t) {
        const testString = `xxx
@@|i_days|1
yyy
zzz`;
        const desired = `xxx
@@|i_days|18
yyy
zzz`;
        const result = this.changeData(testString, "i_days", function (i) {
            return i + 17;
        });
        t.eq(result, desired);
    }

    // ================================
    // yaml
    // ================================
    static yamlDelimiter() {
        return "\n===YAML===\n";
    }

    static getYaml(sText) {
        //return a JavaScript object or null
        const yamlDelimiter = this.yamlDelimiter();
        const position = sText.indexOf(yamlDelimiter);
        if (position < 0) {
            return null;
        }
        const yamlStart = position + yamlDelimiter.length;
        const yamlString = sText.slice(yamlStart);
        const object = YAML.parse(yamlString);
        return object;
    }

    static setYaml(sText, o) {
        //replace YAML in sText with YAML version of object o
        const yamlDelimiter = this.yamlDelimiter();
        const newYaml = YAML.stringify(o).trim();
        const position = sText.indexOf(yamlDelimiter);
        if (position < 0) {
            return sText + yamlDelimiter + newYaml;
        } else {
            return sText.slice(0, position) + yamlDelimiter + newYaml;
        }
    }

    static test_getYaml(t) {
        const testString = `xxx
===YAML===
spacedRep:
  - q: one?
    a: 1
    cat: [Stan, wallet]
  - q: two?
    a: 2`;
        let result = this.getYaml(testString);
        const desired = {
            spacedRep: [{q: "one?", a: 1, cat: ["Stan", "wallet"]}, {q: "two?", a: 2},],
        };
        t.eq(result, desired);
    }

    static test_setYaml(t) {
        const testString = `xxx
===YAML===
spacedRep:
  - q: one?
    a: 1
  - q: two?
    a: 2`;
        let result = this.setYaml(testString, {spacedRep: [{q: "three?", a: 3, cat: ["Stan", "wallet"]}]});
        const desired = `xxx
===YAML===
spacedRep:
  - q: three?
    a: 3
    cat:
      - Stan
      - wallet`;
        t.eq(result, desired);
    }

    // ================================
    // search
    // ================================
    static webSearch(sText, asTemplates) {
        const encoded = encodeURIComponent(sText);
        asTemplates.forEach((each) => {
            const url = each.replace("${encoded}", encoded);
            window.open(url, "_blank");
        });
    }

    // ================================
    // miscellaneous
    // ================================
    static pWait(iMilliseconds) {
        return new Promise(fResolve => setTimeout(fResolve, iMilliseconds));
    }

    static spacesToUnderscore(s) {
        return s.trim().replace(/\W+/g, "_");
    }

    static test_spacesToUnderscore(t) {
        const result = this.spacesToUnderscore("  hello     cruel world  ");
        t.eq(result, "hello_cruel_world");
    }

    static prepended(a, v) {
        a.unshift(v);
        return a;
    }

    static test_prepended(t) {
        t.eq(this.prepended([22, 33], 11), [11, 22, 33]);
    }

    static capitalize([first, ...rest], locale = navigator.language) {
        return [first.toLocaleUpperCase(locale), ...rest].join("");
    }

    static test_capitalize(t) {
        t.eq(this.capitalize("hello"), "Hello");
    }

    static unicodeCharEscape(charCode) {
        const string = charCode.toString(16);
        const padded = new Array(5 - string.length).join("0") + string;
        return "&#x" + padded;
    }

    static test_unicodeCharEscape(t) {
        t.eq(this.unicodeCharEscape(62), "&#x003e");
        t.eq(this.unicodeCharEscape(9989), "&#x2705");
        t.eq(this.unicodeCharEscape(10060), "&#x274c");
    }

    static unicodeEscape(string) {
        return string.split("")
                     .map((char) => {
                         const charCode = char.charCodeAt(0);
                         return charCode > 127 ? this.unicodeCharEscape(charCode) : char;
                     })
                     .join("");
    }

    static test_unicodeEscape(t) {
        t.eq(this.unicodeEscape("hello"), "hello");
        t.eq(this.unicodeEscape("todo ✅❌[]"), "todo &#x2705&#x274c[]");
    }
}

const Module = {
    addModuleToClasses(oClasses) {
        oClasses.Utility = Utility;
    }, addModuleToTestClasses(aTestClasses) {
        aTestClasses.push(Utility);
    },
};
export {Module as default, Utility};
