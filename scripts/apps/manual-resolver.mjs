export default class ManualResolver extends FormApplication {

  constructor(terms, roll, callback) {
    super({});
    this.terms = terms;
    this.roll = roll;
    this.callback = callback;
  }

  /* -------------------------------------------- */

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: "manual-resolver",
      template: "modules/unfulfilled-rolls/templates/manual-resolver.hbs",
      title: "Manual Resolver",
      popOut: true,
      width: 720,
      submitOnChange: false,
      submitOnClose: true,
      closeOnSubmit: true
    });
  }

  /* -------------------------------------------- */

  /** @override */
  async getData(options={}) {
    const context = await super.getData(options);

    context.terms = this.terms;
    context.roll = this.roll;

    return context;
  }

  /* -------------------------------------------- */

  /** @override */
  _getSubmitData(updateData = {}) {
    const data = super._getSubmitData(updateData);

    // Find all input fields and add placeholder values to inputs with no value
    const inputs = this.form.querySelectorAll("input");
    for ( const input of inputs ) {
      if ( !input.value ) {
        data[input.name] = input.placeholder;
      }
    }

    return data;
  }

  /* -------------------------------------------- */

  /** @override */
  async _updateObject(event, formData) {
    // Turn the entries into a map
    const fulfilled = new Map();
    for ( const [id, result] of Object.entries(formData) ) {
      // Parse the result as a number
      fulfilled.set(id, Number(result));
    }
    this.callback(fulfilled);
  }
}
