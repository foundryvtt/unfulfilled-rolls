import FulfillableRollTerm from "./FulfillableRollTerm.mjs";

export class FulfillableRoll extends Roll {

    evaluate({minimize=false, maximize=false, async=true, validating=false}={}) {
        if ( this._evaluated ) {
            throw new Error(`The ${this.constructor.name} has already been evaluated and is now immutable`);
        }
        this._evaluated = true;
        if ( CONFIG.debug.dice ) console.debug(`Evaluating roll with formula ${this.formula}`);

        // Migration path for async rolls
        if ( minimize || maximize ) async = false;
        if ( async === undefined ) {
            foundry.utils.logCompatibilityWarning("Roll#evaluate is becoming asynchronous. In the short term, you may pass "
                + "async=true or async=false to evaluation options to nominate your preferred behavior.", {since: 8, until: 10});
            async = true;
        }
        return async ? this._evaluate({minimize, maximize, validating}) : this._evaluateSync({minimize, maximize, validating});
    }

    /* -------------------------------------------- */

    /** @override */
    async _evaluate({minimize=false, maximize=false, validating=false}={}) {

        // Step 1 - Replace intermediate terms with evaluated numbers
        const intermediate = [];
        for ( let term of this.terms ) {
            if ( !(term instanceof RollTerm) ) {
                throw new Error("Roll evaluation encountered an invalid term which was not a RollTerm instance");
            }
            if ( term.isIntermediate ) {
                await term.evaluate({minimize, maximize, async: true});
                this._dice = this._dice.concat(term.dice);
                term = new NumericTerm({number: term.total, options: term.options});
            }
            intermediate.push(term);
        }
        this.terms = intermediate;

        // Step 2 - Simplify remaining terms
        this.terms = FulfillableRoll.simplifyTerms(this.terms, validating);

        // Step 3 - Evaluate remaining terms
        for ( let term of this.terms ) {
            if ( !term._evaluated ) await term.evaluate({minimize, maximize, async: true});
        }

        // Step 4 - Evaluate the final expression
        this._total = this._evaluateTotal();
        return this;
    }

    /* -------------------------------------------- */

    _evaluateSync({minimize=false, maximize=false, validating=false}={}) {

        // Step 1 - Replace intermediate terms with evaluated numbers
        this.terms = this.terms.map(term => {
            if ( !(term instanceof RollTerm) ) {
                throw new Error("Roll evaluation encountered an invalid term which was not a RollTerm instance");
            }
            if ( term.isIntermediate ) {
                term.evaluate({minimize, maximize, async: false});
                this._dice = this._dice.concat(term.dice);
                return new NumericTerm({number: term.total, options: term.options});
            }
            return term;
        });

        // Step 2 - Simplify remaining terms
        this.terms = FulfillableRoll.simplifyTerms(this.terms, validating);

        // Step 3 - Evaluate remaining terms
        for ( let term of this.terms ) {
            if ( !term._evaluated ) term.evaluate({minimize, maximize, async: false});
        }

        // Step 4 - Evaluate the final expression
        this._total = this._evaluateTotal();
        return this;
    }

    /* -------------------------------------------- */

    /** @override */
    static simplifyTerms(terms, validating) {
        const result = super.simplifyTerms(terms);
        if ( validating ) return result;

        // For any terms of type Die, see if we should replace them with a FulfillableRollTerm
        for ( let [i, t] of result.entries() ) {
            if ( t.faces ) {
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
            r.evaluate({async: false, validating: true});
            return true;
        }

            // If we weren't able to evaluate, the formula is invalid
        catch(err) {
            return false;
        }
    }
}