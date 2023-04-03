export default class FulfillableRollTerm extends DiceTerm {

    async _evaluate({minimize=false, maximize=false}={}) {
        if ( (this.number > 999) ) {
            throw new Error(`You may not evaluate a DiceTerm with more than 999 requested results`);
        }
        for ( let n=1; n <= this.number; n++ ) {
            await this.roll({minimize, maximize});
        }
        this._evaluateModifiers();
        return this;
    }

    /* -------------------------------------------- */

    /** @override */
    async roll({minimize=false, maximize=false}={}) {
        const roll = {result: undefined, active: true};
        if ( minimize ) roll.result = Math.min(1, this.faces);
        else if ( maximize ) roll.result = this.faces;
        else roll.result = await this._fulfillRoll();
        this.results.push(roll);
        return roll;
    }

    /* -------------------------------------------- */

    async _fulfillRoll() {
        //if ( this._fromData ) return;
        console.log("FulfillableRollTerm._fulfillRoll");
        const config = game.settings.get("unfulfilled-rolls", "diceSettings");

        const dieSize = `d${this.faces}`;
        const fulfillmentMethod = config[dieSize] || "fvtt";
        console.log(`Fulfillment method for ${dieSize}: ${fulfillmentMethod}`);

        if (fulfillmentMethod === "input") {

            const result = await Dialog.prompt({
                title: `${dieSize} roll`,
                content: `<p>Enter the result of the roll. Number should be between 1 and ${this.faces}</p>
                          <input type="number" name="result" min="1" max="${this.faces}" value="${Math.ceil(CONFIG.Dice.randomUniform() * this.faces)}">
                          <p>Press OK to submit the roll, or Cancel to cancel the roll.</p>`,
                label: "Roll",
                callback: html => html.find('[name="result"]').val()
            });
            if (result) {
                return parseInt(result);
            }

            // const result = prompt(`Enter the result of the ${dieSize} roll`, this.faces);
            // if (result) {
            //     return parseInt(result);
            // }
        }

        // Default to the original FVTT roller
        return Math.ceil(CONFIG.Dice.randomUniform() * this.faces);
    }

    /* -------------------------------------------- */

    static _fromData(data) {
        const term = new this(data);
        term._evaluated = data.evaluated ?? true;
        term._fromData = true;
        return term;
    }
}