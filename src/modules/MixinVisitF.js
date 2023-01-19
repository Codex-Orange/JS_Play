// show contents of F
const Module = {
    addModuleToMixins(aMixins) {
        aMixins.push((F, div) => {
            console.log(1111, div);
            const button = document.createElement("BUTTON");
            button.innerHTML = "Visit";
            button.addEventListener("click", () => {
                //Inspect F
                const visitor = new F.classes_.PrintVisitor();
                const result = visitor.visit(F);
                console.log(result);
            });
            div.appendChild(button);
        });
    }
};
export {Module as default};