import UjdpActorBase from "./base-actor.mjs";

export default class UjdpCharacter extends UjdpActorBase {

  static defineSchema() {
    const fields = foundry.data.fields;
    const requiredInteger = { required: true, nullable: false, integer: true };
    const schema = super.defineSchema();

    schema.attributes = new fields.SchemaField({
      stockage: new fields.SchemaField({
        value: new fields.NumberField({ ...requiredInteger, initial: 1 })
      }),
    });

    // Iterate over carac names and create a new SchemaField for each.
    schema.caracs = new fields.SchemaField(Object.keys(CONFIG.UJDP.caracs).reduce((obj, carac) => {
      obj[carac] = new fields.SchemaField({
        value: new fields.NumberField({ ...requiredInteger, initial: 10, min: 0 }),
      });
      return obj;
    }, {}));

    return schema;
  }

  prepareDerivedData() {
    // Loop through carac scores, and add their modifiers to our sheet output.
    for (const key in this.caracs) {
      // Calculate the modifier using d20 rules.
      this.caracs[key].mod = Math.floor((this.caracs[key].value - 10) / 2);
      // Handle carac label localization.
      this.caracs[key].label = game.i18n.localize(CONFIG.UJDP.caracs[key]) ?? key;
    }
  }

  getRollData() {
    const data = {};

    // Copy the carac scores to the top stockage, so that rolls can use
    // formulas like `@phy.mod + 4`.
    if (this.caracs) {
      for (let [k,v] of Object.entries(this.caracs)) {
        data[k] = foundry.utils.deepClone(v);
      }
    }

    data.lvl = this.stockage.value;

    return data
  }
}