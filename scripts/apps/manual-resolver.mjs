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
      width: 620,
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
    const inputs = this.form.querySelectorAll("input");
    for ( const input of inputs ) {
      if ( !input.value ) {
        const term = this.terms[Number(input.dataset.term)];
        data[input.name] = term.randomValue;
      }
    }
    return data;
  }

  /* -------------------------------------------- */

  /** @override */
  async _updateObject(event, formData) {
    const fulfilled = new Map();
    for ( const [id, result] of Object.entries(formData) ) {
      fulfilled.set(id, Number(result));
    }
    this.callback(fulfilled);
  }
}
