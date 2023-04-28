export default class GodiceResolver extends FormApplication {

    constructor(terms, roll, callback) {
        super({});
        this.terms = terms;
        this.roll = roll;
        this.callback = callback;
    }

    /* -------------------------------------------- */

    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            id: "godice-resolver",
            template: "modules/unfulfilled-rolls/templates/godice-resolver.hbs",
            title: "GoDice Resolver",
            popOut: true,
            width: 720,
            submitOnChange: false,
            submitOnClose: true,
            closeOnSubmit: true
        });
    }

    /* -------------------------------------------- */

    static socket = null;

    static createdChatMessages = [];

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

    /* -------------------------------------------- */

    /** @override */
    activateListeners(html) {
        super.activateListeners(html);

        // Find all input fields
        const inputs = Array.from(html.find("input"));

        function matchingInput(event) {
            const dieSize = event.die.shell.toLowerCase(); // "D20", "D8", etc

            // Find the first input field matching this die size that does not have a value
            return inputs.find(input => input.name.toLowerCase().startsWith(dieSize)
                && !input.value);
        }

        // Establish a websocket connection to the GoDice socket
        if ( !GodiceResolver.socket || GodiceResolver.socket.readyState === WebSocket.CLOSED ) {
            GodiceResolver.socket = new WebSocket("ws://192.168.68.129:8596/FoundryVTT");
            GodiceResolver.socket.onopen = () => {
                console.log("GoDice socket opened");

                // Send a message to the GoDice socket to flash the die
                const payload = JSON.stringify({
                    "event": "blink_die",
                    "die": {
                        "id": "7030229a-496d-4b25-960b-894a9ccc9129"
                    },
                    "settings": {
                        "blinks_amount": 4,
                        "color": [0.996, 0.384, 0.118],
                        "duration_on": 0.2,
                        "duration_off": 0.2,
                        "is_mixed": true,
                    }
                });
                GodiceResolver.socket.send(payload);
            }
            GodiceResolver.socket.onclose = () => {
                console.log("GoDice socket closed");
            }
            GodiceResolver.socket.onerror = (error) => {
                console.log("GoDice socket error");
                console.log(error);
            }
        }

        GodiceResolver.socket.onmessage = (event) => {
            console.log("GoDice socket message received");
            const data = JSON.parse(event.data);
            console.dir(data);

            if ( data.event === "die_roll_started" ) {
                const input = matchingInput(data);
                if ( input ) {
                    // Find the span sibling before the input field and add a " - Rolling..." message
                    const span = input.previousElementSibling;
                    span.innerText += " - Rolling...";

                    // Find the font awesome icon and apply the animation
                    const icon = span.previousElementSibling;
                    icon.classList.add("fa-spin-pulse");

                    // Create a chat message to indicate that the die is rolling
                    const message = {
                        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
                        content: `<i class="fas ${input.dataset.icon} fa-spin-pulse"></i> Rolling ${data.die.shell}...`,
                        type: CONST.CHAT_MESSAGE_TYPES.ROLL,
                    }
                    ChatMessage.create(message).then(createdChatMessage => {
                        GodiceResolver.createdChatMessages.push(createdChatMessage);
                    });
                }
            }
            if ( data.event === "die_roll_ended" ) {

                const input = matchingInput(data);
                if ( input ) {
                    input.value = data.die.value;

                    // Find the span sibling before the input field and remove the " - Rolling..." message
                    const span = input.previousElementSibling;
                    span.innerText = span.innerText.replace(" - Rolling...", " (Fulfilled)");

                    // Find the font awesome icon and remove the animation
                    const icon = span.previousElementSibling;
                    icon.classList.remove("fa-spin-pulse");

                    // Add a fulfilled class to the parent .dice-term
                    const term = span.closest(".dice-term");
                    term.classList.add("fulfilled");

                    // Delete the chat message that indicated that the die was rolling
                    const createdChatMessage = GodiceResolver.createdChatMessages.pop();
                    if ( createdChatMessage ) {
                        createdChatMessage.delete();
                    }
                }

                // If all input fields have values, submit the form
                if ( inputs.every(input => input.value) ) {
                    this.submit();
                }
            }
        }

        if ( GodiceResolver.socket.readyState === WebSocket.OPEN ) {
            // Send a message to the GoDice socket to flash the die
            const payload = JSON.stringify({
                "event": "blink_die",
                "die": {
                    "id": "7030229a-496d-4b25-960b-894a9ccc9129"
                },
                "settings": {
                    "blinks_amount": 4,
                    "color": [0.996, 0.384, 0.118],
                    "duration_on": 0.2,
                    "duration_off": 0.2,
                    "is_mixed": true,
                }
            });
            GodiceResolver.socket.send(payload);
        }

    }

    /* -------------------------------------------- */

    // /** @override */
    // async close(options={}) {
    //     GodiceResolver.socket.close();
    //     return super.close(options);
    // }
}
