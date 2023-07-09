import ManualResolver from "./apps/manual-resolver.mjs";
const _rollEvaluateOriginal = Roll.prototype._evaluate;
const _dieEvaluateOriginal = Die.prototype._evaluate;

/**
 * @typedef {Object} FulfillableTerm
 * @property {DiceTerm} term
 * @property {number} index
 * @property {string} method
 */

/**
 * Patch the asynchronous Roll#_evaluate method to handle logistics of manual fulfillment.
 * @param {object} options      Options passed to the Roll#_evaluate method
 * @returns {Promise<Roll>}     The evaluated Roll instance
 */
export async function _rollEvaluate(options) {

  // If there are terms that require manual fulfillment, display the dialog
  const config = game.settings.get("unfulfilled-rolls", "diceSettings");
  const fulfillable = _identifyFulfillableTerms(this.terms, config);
  if ( fulfillable.length ) {
    const results = await _displayFulfillmentDialog(this, fulfillable, config);
    for ( const {term, index} of fulfillable ) {
      const fulfilled = [];
      for ( let i=0; i<term.number; i++ ) {
        const resultId = `d${term.faces}-${index}-${i}`;
        fulfilled.push(results.get(resultId));
      }
      term._fulfilled = fulfilled;
    }
  }

  // Standard evaluation path
  return _rollEvaluateOriginal.call(this, options);
}

/* -------------------------------------------- */

/**
 * Patch the asynchronous Die#_evaluate method to handle logistics of manual fulfillment.
 * @param {object} options        Options passed to the Die#_evaluate method
 * @returns {Promise<Die>}        The evaluated Die term
 */
export async function _dieEvaluate(options) {
  if ( !this._fulfilled?.length > 0 ) return _dieEvaluateOriginal.call(this, options);
  if ( this.number > 999 ) throw new Error("You may not evaluate a DiceTerm with more than 999 requested results.");
  for ( let n=0; n < this.number; n++ ) {
    const v = this._fulfilled[n];
    if ( Number.isNumeric(v) ) this.results.push({result: v, active: true});
    else this.roll(options);
  }
  this._evaluateModifiers();
  return this;
}

/* -------------------------------------------- */

/**
 * Identify terms in a Roll instance which are able to be externally fulfilled.
 * @param {RollTerm[]} terms      Terms of the Roll instance
 * @param {object} config         The unfulfilled-rolls.diceSettings configuration
 * @returns {FulfillableTerm[]}   An array of identified terms
 * @private
 */
function _identifyFulfillableTerms(terms, config) {
  const toFulfill = [];
  for ( const [i, term] of terms.entries() ) {
    if ( !(term instanceof Die) ) continue;
    const method = config[`d${term.faces}`];
    if ( !method || (method === "fvtt") ) continue;
    toFulfill.push({term, method, index: i});
  }
  return toFulfill;
}

/* -------------------------------------------- */

/**
 * Configure and render the resolver application for externally fulfilled rolls.
 * Await the completion of the dialog before proceeding with roll evaluation.
 * @param {Roll} roll                 The Roll instance being configured
 * @param {FulfillableTerm[]} terms   Identified fulfillable terms
 * @param {object} config             The unfulfilled-rolls.diceSettings configuration
 * @returns {Promise<Map<number>>}    A map of externally fulfilled rolls
 * @private
 */
async function _displayFulfillmentDialog(roll, terms, config) {
  const bluetooth = CONFIG.Dice.BluetoothDieProviders[config.bluetoothDieProvider];
  let resolverApp = ManualResolver;

  // Expand terms to individual rolls which are required
  const dice = terms.reduce((rolls, {term, method, index}) => {
    const denom = `d${term.faces}`;
    for ( let i=0; i<term.number; i++ ) {
      rolls.push({
        term,
        id: `${denom}-${index}-${i}`,
        faces: term.faces,
        randomValue: Math.ceil(CONFIG.Dice.randomUniform() * term.faces),
        fulfillmentMethod: method,
        icon: CONFIG.Dice.DieTypes.find(d => d.id === denom).icon,
      });
    }
    if ( (method === "bluetooth") && bluetooth.app ) resolverApp = bluetooth.app;
    return rolls;
  }, []);

  // Display the resolver app
  return new Promise(resolve => {
    const app = new resolverApp(dice, roll, resolve);
    app.render(true);
  });
}
