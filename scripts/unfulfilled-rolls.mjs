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
        "fvtt": "Foundry VTT Digital roll",
        "input": "Manual input",
    };
    
    CONFIG.Dice.rolls.unshift(FulfillableRoll);
    //CONFIG.Dice.termTypes.DiceTerm = FulfillableRollTerm;
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
