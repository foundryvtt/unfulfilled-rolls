export default class FulfillableRollTerm extends DiceTerm {

    MODIFIERS = {};

    /* -------------------------------------------- */

    evaluate({minimize=false, maximize=false, async=false, fulfilled=null}={}) {
        if ( this._evaluated ) {
            throw new Error(`The ${this.constructor.name} has already been evaluated and is now immutable`);
        }
        this._evaluated = true;
        return async ? this._evaluate({minimize, maximize, fulfilled}) : this._evaluateSync({minimize, maximize});
    }

    /* -------------------------------------------- */

    async _evaluate({minimize=false, maximize=false, fulfilled=null}={}) {
        if ( (this.number > 999) ) {
            throw new Error(`You may not evaluate a DiceTerm with more than 999 requested results`);
        }
        for ( let n=1; n <= this.number; n++ ) {
            await this.roll({minimize, maximize, fulfilled, n});
        }
        this._evaluateModifiers();
        return this;
    }

    /* -------------------------------------------- */

    /** @override */
    async roll({minimize=false, maximize=false, fulfilled, n}={}) {
        const roll = {result: undefined, active: true};
        if ( minimize ) roll.result = Math.min(1, this.faces);
        else if ( maximize ) roll.result = this.faces;
        else {
            // Grab the result from fulfilled
            const id = `d${this.faces}-${n}`;
            if ( fulfilled && fulfilled.has(id) ) {
                const result = fulfilled.get(id);
                roll.result = Number.parseInt(result);
            }
            else {
                roll.result = await this._fulfillRoll();
            }
        }
        this.results.push(roll);
        return roll;
    }

    /* -------------------------------------------- */

    async _fulfillRoll() {
        // This term was not already fulfilled, so use the original FVTT roller
        return Math.ceil(CONFIG.Dice.randomUniform() * this.faces);
    }

    /* -------------------------------------------- */

    static _fromData(data) {
        const term = new this(data);
        term._evaluated = data.evaluated ?? true;
        term._fromData = true;
        return term;
    }

    /* -------------------------------------------- */

    /**
     * Sequentially evaluate each dice roll modifier by passing the term to its evaluation function
     * Augment or modify the results array.
     * @private
     */
    _evaluateModifiers() {
        const requested = foundry.utils.deepClone(this.modifiers);
        this.modifiers = [];

        // Iterate over requested modifiers
        for ( let m of requested ) {
            let command = m.match(/[A-z]+/)[0].toLowerCase();

            // Matched command
            if ( command in this.MODIFIERS ) {
                this._evaluateModifier(command, m);
                continue;
            }

            // Unmatched compound command
            // Sort modifiers from longest to shortest to ensure that the matching algorithm greedily matches the longest
            // prefixes first.
            const modifiers = Object.keys(this.MODIFIERS).sort((a, b) => b.length - a.length);
            while ( !!command ) {
                let matched = false;
                for ( let cmd of modifiers ) {
                    if ( command.startsWith(cmd) ) {
                        matched = true;
                        this._evaluateModifier(cmd, cmd);
                        command = command.replace(cmd, "");
                        break;
                    }
                }
                if ( !matched ) command = "";
            }
        }
    }

    /* -------------------------------------------- */

    /**
     * Evaluate a single modifier command, recording it in the array of evaluated modifiers
     * @param {string} command        The parsed modifier command
     * @param {string} modifier       The full modifier request
     * @private
     */
    _evaluateModifier(command, modifier) {
        let fn = this.MODIFIERS[command];
        if ( typeof fn === "string" ) fn = this[fn];
        if ( fn instanceof Function ) {
            const result = fn.call(this, modifier);
            const earlyReturn = (result === false) || (result === this); // handling this is backwards compatibility
            if ( !earlyReturn ) this.modifiers.push(modifier.toLowerCase());
        }
    }
}