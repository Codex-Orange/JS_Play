// =================================================
// "scripts": {
// 		"factory": "node ./src/modules/__buildFactory.cjs"
// },
//
// Terminal: npm run factory
// =================================================
const fs = require("fs");
const path = require("path");
// =================================================
console.log("==== Start __buildFactory.cjs ====");
const currentDirectory = __dirname;
// =================================================
// generate __Factory.js file
// =================================================
const modFiles = fs.readdirSync(currentDirectory);
let importString = "";
let moduleString = "";
console.log("" + modFiles.length + " imports");
modFiles
    .filter(each => {
        return !each.startsWith("_");
    })
    .sort()
    .forEach((each, index) => {
        const sansJs = each.split(".").slice(0, -1).join(".");
        const moduleName = "Module_" + sansJs;
        const importLine = `import ${moduleName} from "./${each}";`;
        if (index !== 0) {
            importString += "\n";
            moduleString += ", ";
            if ((index % 3) === 0) {
                moduleString += "\n";
            }
        }
        importString += importLine;
        moduleString += moduleName;
    });
const contents = `
${importString}

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

	runMixins(div){
		this.mixins_.forEach(each => {
			each(this, div);
		})
	}
}

const singletonFactory = new Factory();

const modules = [${moduleString}];

modules.forEach(each => {
	singletonFactory.addModule(each);
});

export default singletonFactory;
`;
fs.writeFileSync(path.join(currentDirectory, "__Factory.js"), contents);
console.log("==== End __buildFactory.cjs ====");


