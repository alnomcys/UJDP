/**
 * Extend the base Actor document by defining a custom roll data structure which is ideal for the Simple system.
 * @extends {Actor}
 */
export class UjdpActor extends Actor {
  /** @override */
  prepareData() {
    // Prepare data for the actor. Calling the super version of this executes
    // the following, in order: data reset (to clear active effects),
    // prepareBaseData(), prepareEmbeddedDocuments() (including active effects),
    // prepareDerivedData().
    super.prepareData();
  }

  /** @override */
  prepareBaseData() {
    // Data modifications in this step occur before processing embedded
    // documents or derived data.
  }

  /**
   * @override
   * Augment the actor source data with additional dynamic data. Typically,
   * you'll want to handle most of your calculated/derived data in this step.
   * Data calculated in this step should generally not exist in template.json
   * (such as carac modifiers rather than carac scores) and should be
   * available both inside and outside of character sheets (such as if an actor
   * is queried and has a roll executed directly from it).
   */
  prepareDerivedData() {
    const actorData = this;
    const systemData = actorData.system;
    const flags = actorData.flags.ujdp || {};

    // Make separate methods for each Actor type (character, npc, etc.) to keep
    // things organized.
    this._prepareCharacterData(actorData);
    this._prepareNpcData(actorData);
  }

  /**
   * Prepare Character type specific data
   */
  _prepareCharacterData(actorData) {
    if (actorData.type !== 'character') return;

    // Make modifications to data here. For example:
    const systemData = actorData.system;
    
    // Loop through carac scores, and add their modifiers to our sheet output.
    for (let [key, carac] of Object.entries(systemData.caracs)) {
      // Calculate the modifier using d20 rules.
      carac.mod = Math.floor((carac.value - 10) / 2);
    }

    //Repos max 10
    if(systemData.repos.value > 10){systemData.repos.value = 10;}

    // Repos qui dimune l'entropie
    while(systemData.repos.value >= 5 && systemData.entropie.value >= 1){
      systemData.repos.value -= 5;
      systemData.entropie.value -= 1;
    }

    //Calcul encombrement
    var encombrementressources = parseInt(systemData.ressources.vivres.value) + parseInt(systemData.ressources.bricabrac.value) + parseInt(systemData.ressources.pharmacie.value) + Math.floor(parseInt(systemData.ressources.munitions.value)/5);
    var encombrementoutils = 0;
    for (let i = 0; i < 6; i++){      
      encombrementoutils += parseInt(systemData.outils[i].quantite) * parseInt(systemData.outils[i].encombrement);
    }
    //console.log(encombrementoutils);
    var encombrementtente = parseInt(systemData.vetements.tente.encombrement);
    systemData.stocktotal.value = encombrementressources + encombrementoutils + encombrementtente; // à finir pour le remplissage des stockages.



    // Calcul stockagemax
    systemData.stocktotal.max = systemData.stockages.sursoi.max + systemData.stockages.sacados.max + systemData.stockages.sacappoint.max + systemData.stockages.chariot.max; //stockagetab[0] + stockagetab[1] + stockagetab[2]+ stockagetab[3];
  }

  /**
   * Prepare NPC type specific data.
   */
  _prepareNpcData(actorData) {
    if (actorData.type !== 'npc') return;

    // Make modifications to data here. For example:
    const systemData = actorData.system;
    systemData.xp = systemData.rang * systemData.rang * 100;
  }

  /**
   * Override getRollData() that's supplied to rolls.
   */
  getRollData() {
    // Starts off by populating the roll data with a shallow copy of `this.system`
    const data = { ...this.system };

    // Prepare character roll data.
    this._getCharacterRollData(data);
    this._getNpcRollData(data);

    return data;
  }

  /**
   * Prepare character roll data.
   */
  _getCharacterRollData(data) {
    if (this.type !== 'character') return;

    // Copy the carac scores to the top stockage, so that rolls can use
    // formulas like `@phy.mod + 4`.
    if (data.caracs) {
      for (let [k, v] of Object.entries(data.caracs)) {
        data[k] = foundry.utils.deepClone(v);
      }
    }

    // Add stockage for easier access, or fall back to 0.
   /* if (data.stockage) {
      data.lvl = data.stockage.value ?? 0;
    }*/
  }

  /**
   * Prepare NPC roll data.
   */
  _getNpcRollData(data) {
    if (this.type !== 'npc') return;

    // Process additional NPC data here.
  }
}
