![](https://img.shields.io/badge/Foundry-v11-informational)
<!--- Downloads @ Latest Badge -->
<!--- replace <user>/<repo> with your username/repository -->
<!--- ![Latest Release Download Count](https://img.shields.io/github/downloads/<user>/<repo>/latest/module.zip) -->

<!--- Forge Bazaar Install % Badge -->
<!--- replace <your-module-name> with the `name` in your manifest -->
<!--- ![Forge Installs](https://img.shields.io/badge/dynamic/json?label=Forge%20Installs&query=package.installs&suffix=%25&url=https%3A%2F%2Fforge-vtt.com%2Fapi%2Fbazaar%2Fpackage%2F<your-module-name>&colorB=4aa94a) -->


# Unfulfilled Rolls

Allows individual rolls to be fulfilled by other sources

## Configuring per-die resolution methods

A new Sidebar app is added called "Open Dice Configuration"

![image](https://github.com/foundryvtt/unfulfilled-rolls/assets/15639841/368c59c1-dba4-4002-8e74-d04091e0d318)

In this app, each User (client setting) may pick how each die is resolved - via Foundry VTT digital rolling, via manual input, or via a bluetooth provider - as well as what Bluetooth provider they are using (requires a separate module install for the bluetooth provider, such as the GoDice module).

![image](https://github.com/foundryvtt/unfulfilled-rolls/assets/15639841/ab0f26c2-1cb5-4e64-b8ee-9f82ace5864e)

## An example roll

In this example, d20's and d8's are configured for Bluetooth resolution, while d4 is Foundry VTT Digital Roll.

`/roll 2d20 + d8 + d4 + 4`

Unfulfilled rolls works with the Foundry VTT dice rolling workflow to determine that there are terms that need resolution (the 2d20 and the d8), and displays a window - note that it gives the full roll for context, but only prompts resolution of the ones marked

![image](https://github.com/foundryvtt/unfulfilled-rolls/assets/15639841/d2bdde9f-130f-436b-bc39-5c372f1c9adb)

Inside of the resolution app, the following two parameters are given:

`terms`
The array of terms that need to be fulfilled
```json
[
  {
    "id": "d20-1",
    "faces": 20,
    "randomValue": 12,
    "fulfillmentMethod": "bluetooth",
    "icon": "fa-dice-d20"
  },
  {
    "id": "d20-2",
    "faces": 20,
    "randomValue": 17,
    "fulfillmentMethod": "bluetooth",
    "icon": "fa-dice-d20"
  },
  {
    "id": "d8-1",
    "faces": 8,
    "randomValue": 7,
    "fulfillmentMethod": "bluetooth",
    "icon": "fa-dice-d8"
  }
]
```

`roll`
The originating Roll
```json
{
  "class": "FulfillableRoll",
  "options": {},
  "dice": [],
  "formula": "2d20 + d8 + d4 + 4",
  "terms": [
    {
      "class": "FulfillableRollTerm",
      "options": {},
      "evaluated": false,
      "number": 2,
      "faces": 20,
      "modifiers": [],
      "results": []
    },
    {
      "class": "OperatorTerm",
      "options": {},
      "evaluated": false,
      "operator": "+"
    },
    {
      "class": "FulfillableRollTerm",
      "options": {},
      "evaluated": false,
      "number": 1,
      "faces": 8,
      "modifiers": [],
      "results": []
    },
    {
      "class": "OperatorTerm",
      "options": {},
      "evaluated": false,
      "operator": "+"
    },
    {
      "class": "FulfillableRollTerm",
      "options": {},
      "evaluated": false,
      "number": 1,
      "faces": 4,
      "modifiers": [],
      "results": []
    },
    {
      "class": "OperatorTerm",
      "options": {},
      "evaluated": false,
      "operator": "+"
    },
    {
      "class": "NumericTerm",
      "options": {},
      "evaluated": false,
      "number": 4
    }
  ],
  "evaluated": true
}
```

## Registering a new Provider

Currently only bluetooth providers are supported, but more types can be added fairly easily by following the pattern bluetooth providers uses.

```js
Hooks.once('unfulfilled-rolls-bluetooth', function(providers) {
    return foundry.utils.mergeObject(providers, {
        "godice": {
            label: "GoDice",
            app: GodiceResolver
        }
    })
});
```

### Implementing a Provider

Each provider needs to register an application to handle the roll resolution. Here is a simplified example:

```js
export default class ExampleResolver extends FormApplication {

    constructor(terms, roll, callback) {
        super({});
        this.terms = terms;
        this.roll = roll;
        this.callback = callback;
    }

    /* -------------------------------------------- */

    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            id: "example-resolver",
            template: "modules/example/templates/example-resolver.hbs",
            title: "Example Resolver",
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
```
