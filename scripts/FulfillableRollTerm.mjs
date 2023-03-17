export default class FulfillableRollTerm extends DiceTerm {

    /** @override */
    roll({minimize=false, maximize=false}={}) {
        const roll = {result: undefined, active: true};
        if ( minimize ) roll.result = Math.min(1, this.faces);
        else if ( maximize ) roll.result = this.faces;
        else roll.result = this._fulfillRoll();
        this.results.push(roll);
        return roll;
    }

    /* -------------------------------------------- */

    _fulfillRoll() {
        //if ( this._fromData ) return;
        console.log("FulfillableRollTerm._fulfillRoll");
        const config = game.settings.get("unfulfilled-rolls", "diceSettings");

        const dieSize = `d${this.faces}`;
        const fulfillmentMethod = config[dieSize] || "fvtt";
        console.log(`Fulfillment method for ${dieSize}: ${fulfillmentMethod}`);

        if (fulfillmentMethod === "input") {
            const result = prompt(`Enter the result of the ${dieSize} roll`, this.faces);
            if (result) {
                return parseInt(result);
            }
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