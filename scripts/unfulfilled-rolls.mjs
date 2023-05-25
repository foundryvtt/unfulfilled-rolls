import {FulfillableRoll} from "./FulfillableRoll.mjs";
import DiceConfig from "./apps/diceConfiguration/dice-config.mjs";

Hooks.once('init', async function() {

    game.settings.register("unfulfilled-rolls", "diceSettings", {
        config: false,
        default: {},
        type: Object,
        scope: "client"
    });

    //CONFIG.Dice.FulfillableRoll = FulfillableRoll;
    CONFIG.Dice.DieTypes = [
        { id: "d4", faces: 4, icon: "fa-dice-d4" },
        { id: "d6", faces: 6, icon: "fa-dice-d6" },
        { id: "d8", faces: 8, icon: "fa-dice-d8" },
        { id: "d10", faces: 10, icon: "fa-dice-d10" },
        { id: "d12", faces: 12, icon: "fa-dice-d12" },
        { id: "d20", faces: 20, icon: "fa-dice-d20" },
        { id: "d100", faces: 100, icon: "fa-percent" }
    ];
    CONFIG.Dice.FulfillmentMethods = {
        "fvtt": "Foundry VTT Digital Roll",
        "input": "Manual Input",
        "bluetooth": "Bluetooth Dice",
    };

    let providers = {
        "none": {
            label: "None",
        },
    };
    Hooks.callAll("unfulfilled-rolls-bluetooth", providers);
    CONFIG.Dice.BluetoothDieProviders = providers;

    // Replace the `Roll` in the global namespace with `FulfillableRoll` class
    Roll = FulfillableRoll;
    CONFIG.Dice.rolls.unshift(FulfillableRoll);
    //CONFIG.Dice.termTypes.DiceTerm = FulfillableRollTerm;

    if ( game.system.id === "dnd5e" ) {
        // Monkey patch the evaluate methods of the D20Roll and DamageRoll classes
        CONFIG.Dice.D20Roll.prototype.evaluate = FulfillableRoll.prototype.evaluate;
        CONFIG.Dice.D20Roll.prototype._evaluate = FulfillableRoll.prototype._evaluate;
        CONFIG.Dice.D20Roll.prototype._evaluateSync = FulfillableRoll.prototype._evaluateSync;
        CONFIG.Dice.DamageRoll.prototype.evaluate = FulfillableRoll.prototype.evaluate;
        CONFIG.Dice.DamageRoll.prototype._evaluate = FulfillableRoll.prototype._evaluate;
        CONFIG.Dice.DamageRoll.prototype._evaluateSync = FulfillableRoll.prototype._evaluateSync;
    }
});

Hooks.on("renderSettings", (app, html, data) => {
    const diceConfigButton = document.createElement("button");
    diceConfigButton.type = "button";
    diceConfigButton.classList.add("open-dice-config");
    diceConfigButton.innerHTML = `<i class="fas fa-dice-d20"></i> Open Dice Configuration`;
    diceConfigButton.addEventListener("click", () => {
        const diceConfig = new DiceConfig();
        diceConfig.render(true);
    });
    html.find("button[data-action='controls']").after(diceConfigButton);
});
