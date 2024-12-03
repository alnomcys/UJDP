import UjdpDataModel from "./base-model.mjs";

export default class UjdpItemBase extends UjdpDataModel {

  static defineSchema() {
    const fields = foundry.data.fields;
    const schema = {};

    schema.notes = new fields.StringField({ required: true, blank: true });

    return schema;
  }

}