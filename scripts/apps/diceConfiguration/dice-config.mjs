export default class DiceConfig extends FormApplication {

    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            id: "dice-config",
            template: "modules/unfulfilled-rolls/templates/dice-config.hbs",
            title: "Dice Configuration",
            popOut: true,
            width: 720,
            submitOnChange: true,
            submitOnClose: true,
            closeOnSubmit: false
        });
    }

    /* -------------------------------------------- */

    /** @override */
    async getData(options={}) {
        const context = await super.getData(options);
        context.fulfillmentMethods = CONFIG.Dice.FulfillmentMethods;

        const config = game.settings.get("unfulfilled-rolls", "diceSettings");
        const dieTypes = CONFIG.Dice.DieTypes;
        // For each die type, add the fulfillment method to the data
        for ( const dieType of dieTypes ) {
            dieType.fulfillmentMethod = config[dieType.id] || "fvtt";
        }
        context.dieTypes = dieTypes;
        context.bluetoothDieProviders = CONFIG.Dice.BluetoothDieProviders;
        context.bluetoothDieProvider = config.bluetoothDieProvider || "none";

        return context;
    }

    /* -------------------------------------------- */

    /** @override */
    async _updateObject(event, formData) {
        const config = game.settings.get("unfulfilled-rolls", "diceSettings");
        for ( const [dieType, fulfillmentMethod] of Object.entries(formData) ) {
            config[dieType] = fulfillmentMethod;
        }
        await game.settings.set("unfulfilled-rolls", "diceSettings", config);
    }
}
