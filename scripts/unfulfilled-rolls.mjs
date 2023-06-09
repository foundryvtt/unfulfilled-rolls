import DiceConfig from "./apps/dice-config.mjs";
import {_rollEvaluate, _dieEvaluate} from "./fulfillable-roll.mjs";

Hooks.once('init', async function() {

  // Register configuration setting
  game.settings.register("unfulfilled-rolls", "diceSettings", {
    config: false,
    default: {},
    type: Object,
    scope: "client"
  });
  game.settings.registerMenu("unfulfilled-rolls", "configuration", {
    name: "Dice Configuration",
    label: "Configure Dice",
    icon: "fa-solid fa-dice-d20",
    type: DiceConfig,
    restricted: false
  });

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

  // Provider configuration
  CONFIG.Dice.BluetoothDieProviders = {
    none: {label: "None"},
  };
  Hooks.callAll("unfulfilled-rolls-bluetooth", CONFIG.Dice.BluetoothDieProviders);

  // Patch into async Roll and Die evaluation methods
  Roll.prototype._evaluate = _rollEvaluate;
  Die.prototype._evaluate = _dieEvaluate;
});
