class AsyncLogger {
    // each newLog is a function (similar to console.log) that is bound to its own logArray
    // each logArray is aas, logArrays is aaas
    // log(arg1, arg2) will result in boundLogArray.push([Class.callingMethod, arg1Value, arg2Value])
    // todo pass in log function instead of showReport boolean
    constructor(sName, showReport = false) {
        this.name = sName;
        this.logArrays = [];
        this.reportStrings = [];
        this.showReport = showReport;
    }

    newLog() {
        const newLogArray = [];
        this.logArrays.push(newLogArray);
        const newLog = (function (...args) {
            const callerName = ((new Error()).stack.split("\n")[2].trim().split(" ")[1]);
            const line = [];
            line.push(callerName);
            line.push(...args);
            this.push(line);
        }).bind(newLogArray);
        return newLog;
    }

    addReportString(...args) {
        args.forEach(each => this.reportStrings.push(each));
    }

    report() {
        if (!this.showReport) {
            return;
        }
        console.log(22, "==================================================================================");
        console.log(22, "ASYNC LOGGER REPORT", this.name);
        console.log(22, "==================================================================================");
        this.logArrays.forEach(each => {
            this.reportLog(each);
        });
        this.reportStrings.forEach(each => {
            console.log(each);
        });
    }

    reportLog(aas) {
        console.log(11, "==================================");
        aas.forEach(each => {
            console.log(11, ...each);
        });
    }
}

class AsyncLoggerMuted extends AsyncLogger {
    report() {
    }

    reportLog(aas) {
    }
}

export {
    AsyncLogger as default, AsyncLogger, AsyncLoggerMuted,
};