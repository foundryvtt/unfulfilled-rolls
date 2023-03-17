import FulfillableRollTerm from "./FulfillableRollTerm.mjs";

export class FulfillableRoll extends Roll {

    // async evaluate({minimize = false, maximize = false, async} = {}) {
    //     console.log("FulfillableRoll.evaluate");
    //
    //     const config = game.settings.get("unfulfilled-rolls", "diceSettings");
    //
    //     for ( const term of this.terms ) {
    //         const dieSize = term.term;
    //         const fulfillmentMethod = config[dieSize] || "fvtt";
    //         console.log(`Fulfillment method for ${dieSize}: ${fulfillmentMethod}`);
    //
    //         if (fulfillmentMethod === "input") {
    //             const result = prompt(`Enter the result of the ${dieSize} roll`, fulfillmentMethod.faces);
    //             if (result) {
    //                 term.results = [
    //                     {
    //                         active: true,
    //                         result: parseInt(result)
    //                     }];
    //             }
    //         }
    //     }
    //
    //     return super.evaluate({minimize, maximize, async});
    // }

    /* -------------------------------------------- */

    /** @override */
    static simplifyTerms(terms) {
        const result = super.simplifyTerms(terms);

        // For any terms of type Die, see if we should replace them with a FulfillableRollTerm
        for ( let [i, t] of result.entries() ) {
            if ( t instanceof Die ) {
                result[i] = new FulfillableRollTerm({faces: t.faces, number: t.number});
            }
        }
        return result;
    }

    /* -------------------------------------------- */

    /** @override */
    static validate(formula) {

        // Replace all data references with an arbitrary number
        formula = formula.replace(/@([a-z.0-9_\-]+)/gi, "1");

        // Attempt to evaluate the roll
        try {
            const r = new Roll(formula);
            r.evaluate({async: false});
            return true;
        }

            // If we weren't able to evaluate, the formula is invalid
        catch(err) {
            return false;
        }
    }
}
