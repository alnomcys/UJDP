import {
  onManageActiveEffect,
  prepareActiveEffectCategories,
} from '../helpers/effects.mjs';


/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
export class UjdpActorSheet extends ActorSheet {
  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ['ujdp', 'sheet', 'actor'],
      width: 700,
      height: 600,
      tabs: [
        {
          navSelector: '.sheet-tabs',
          contentSelector: '.sheet-body',
          initial: 'features',
        },
      ],
    });
  }

  

  /** @override */
  get template() {
    return `systems/ujdp/templates/actor/actor-${this.actor.type}-sheet.hbs`;
  }

  /* -------------------------------------------- */

  /** @override */
  async getData() {
    // Retrieve the data structure from the base sheet. You can inspect or log
    // the context variable to see the structure, but some key properties for
    // sheets are the actor object, the data object, whether or not it's
    // editable, the items array, and the effects array.
    const context = super.getData();

    // Use a safe clone of the actor data for further operations.
    const actorData = this.document.toObject(false);

    // Add the actor's data to context.data for easier access, as well as flags.
    context.system = actorData.system;
    context.flags = actorData.flags;

    // Adding a pointer to CONFIG.UJDP
    context.config = CONFIG.UJDP;

    // Prepare character data and items.
    if (actorData.type == 'character') {
      this._prepareItems(context);
      this._prepareCharacterData(context);
    }

    // Prepare NPC data and items.
    if (actorData.type == 'npc') {
      this._prepareItems(context);
    }

    // Enrich biography info for display
    // Enrichment turns text like `[[/r 1d20]]` into buttons
    context.enrichedBiography = await TextEditor.enrichHTML(
      this.actor.system.biography,
      {
        // Whether to show secret blocks in the finished html
        secrets: this.document.isOwner,
        // Necessary in v11, can be removed in v12
        async: true,
        // Data to fill in for inline rolls
        rollData: this.actor.getRollData(),
        // Relative UUID resolution
        relativeTo: this.actor,
      }
    );

    // Prepare active effects
    context.effects = prepareActiveEffectCategories(
      // A generator that returns all effects stored on the actor
      // as well as any items
      this.actor.allApplicableEffects()
    );

    return context;
  }

  /**
   * Character-specific context modifications
   *
   * @param {object} context The context object to mutate
   */
  _prepareCharacterData(context) {
    // This is where you can enrich character-specific editor fields
    // or setup anything else that's specific to this type
   
  }

  /**
   * Organize and classify Items for Actor sheets.
   *
   * @param {object} context The context object to mutate
   */
  _prepareItems(context) {
    // Initialize containers.
    const gear = [];
    const features = [];
    const spells = {
      0: [],
      1: [],
      2: [],
      3: [],
      4: [],
      5: [],
      6: [],
      7: [],
      8: [],
      9: [],
    };

    // Iterate through items, allocating to containers
    for (let i of context.items) {
      i.img = i.img || Item.DEFAULT_ICON;
      // Append to gear.
      if (i.type === 'item') {
        gear.push(i);
      }
      // Append to features.
      else if (i.type === 'feature') {
        features.push(i);
      }
      // Append to spells.
      else if (i.type === 'spell') {
        if (i.system.spellLevel != undefined) {
          spells[i.system.spellLevel].push(i);
        }
      }
    }

    // Assign and return
    context.gear = gear;
    context.features = features;
    context.spells = spells;


  }

  /* -------------------------------------------- */
  
  
  

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);
    // Render the item sheet for viewing/editing prior to the editable check.
    /*
    html.on('click', '.item-edit', (ev) => {
      const li = $(ev.currentTarget).parents('.item');
      const item = this.actor.items.get(li.data('itemId'));
      item.sheet.render(true);
    });

    // -------------------------------------------------------------
    // Everything below here is only needed if the sheet is editable
    if (!this.isEditable) return;

    //Add Inventory Item
    html.on('click', '.item-create', this._onItemCreate.bind(this));

    // Delete Inventory Item
    html.on('click', '.item-delete', (ev) => {
      const li = $(ev.currentTarget).parents('.item');
      const item = this.actor.items.get(li.data('itemId'));
      item.delete();
      li.slideUp(200, () => this.render(false));
    });

    // Active Effect management
    html.on('click', '.effect-control', (ev) => {
      const row = ev.currentTarget.closest('li');
      const document =
        row.dataset.parentId === this.actor.id
          ? this.actor
          : this.actor.items.get(row.dataset.parentId);
      onManageActiveEffect(ev, document);
    });*/
    
    // bouton d'action.
    html.on('click', '.action', this._onRoll.bind(this));

     //checkbox.
     
     html.on('change','.checkstockage',this._onCheck.bind(this));


    // Drag events for macros.
    if (this.actor.isOwner) {
      let handler = (ev) => this._onDragStart(ev);
      html.find('li.item').each((i, li) => {
        if (li.classList.contains('inventory-header')) return;
        li.setAttribute('draggable', true);
        li.addEventListener('dragstart', handler, false);
      });
    }
  }
    /**
   * Handle creating a new Owned Item for the actor using initial data defined in the HTML dataset
   * @param {Event} event   The originating click event
   * @private
   */
  async _onItemCreate(event) {
    event.preventDefault();
    const header = event.currentTarget;
    // Get the type of item to create.
    const type = header.dataset.type;
    // Grab any data associated with this control.
    const data = duplicate(header.dataset);
    // Initialize a default name.
    const name = `New ${type.capitalize()}`;
    // Prepare the item object.
    const itemData = {
      name: name,
      type: type,
      system: data,
    };
    // Remove the type from the dataset since it's in the itemData.type prop.
    delete itemData.system['type'];

    // Finally, create the item!
    return await Item.create(itemData, { parent: this.actor });
  }
  /**
   * Handle clickable rolls.
   * @param {Event} event   The originating click event
   * @private
   */
  _onRoll(event) {
    event.preventDefault();
    const element = event.delegateTarget;
    //recup du bonus d'action
    const bonus = element[2].dataset.bonus;

    //recup des caracs
    const phy = element[9].dataset.value;
    const min = element[12].dataset.value;
    const per = element[15].dataset.value;
    const pre = element[18].dataset.value;

    //recup des faiblesses
    const faibphy = element[10].dataset.value;
    const faibmin = element[13].dataset.value;
    const faibper = element[16].dataset.value;
    const faibpre = element[19].dataset.value;

    //recup des domaines
    const danger = element[21].dataset.value;
    const route = element[23].dataset.value;
    const exploration = element[25].dataset.value;
    const foyer = element[27].dataset.value;

    //recup des atouts d'outils
    let atoutoutil = [element[41].dataset.atout, element[44].dataset.atout, element[47].dataset.atout, element[50].dataset.atout,element[53].dataset.atout, element[56].dataset.atout];
    
    // variables pour le jet de dés
    var dcarac = "D10";
    var ddomaine = "D10";
    var faiblesse = 0;
    var atout = 0;
    
    //attribution de la carac sélectionnée
    if(element[8].checked){
      dcarac = phy;
      faiblesse = faibphy;
    };
    if(element[11].checked){
      dcarac = min;
      faiblesse = faibmin;
    };
    if(element[14].checked){
      dcarac = per;
      faiblesse = faibper;
    };
    if(element[17].checked){
      dcarac = pre;
      faiblesse = faibpre;
    };

    //attribution du domaine sélectionné
    if(element[20].checked){
      ddomaine = danger;
    };
    if(element[22].checked){
      ddomaine = route;
    };
    if(element[24].checked){
      ddomaine = exploration;
    };
    if(element[26].checked){
      ddomaine = foyer;   
    };

    //attribution de l'atout des Outils sélectionné
    if(element[28].checked){
      atout += atoutoutil[0];
    };
    if(element[30].checked){
      atout += atoutoutil[1];
    };
    if(element[32].checked){
      atout += atoutoutil[2];
    };
    if(element[34].checked){
      atout += atoutoutil[3];
    };
    if(element[36].checked){
      atout += atoutoutil[4];
    };
    if(element[38].checked){
      atout += atoutoutil[5];
    };

    var formule = "{" + dcarac + "," + ddomaine + "}kh + " + bonus + " + " + atout + " - " + faiblesse; 
    formule = formule.replace("D", "d");
    formule = formule.replace("D", "d");

    let roll = new Roll(formule);
    roll.toMessage({
      speaker: ChatMessage.getSpeaker({actor: this.actor}),
      flavor: formule
    });
    console.log(formule);
    console.log("bonus : " + dcarac + " + " +  bonus);
    console.log("domaine : " + ddomaine);

    console.log (event);
   
  }
  _onCheck(ev) {
    ev.preventDefault();
    const element = ev.delegateTarget;
    let max = 6;
    console.log (ev);
    
    //Mise à jour des valeurs max de stockage selon les stockages cochées
      
      if(ev.delegateTarget[58].checked){       
        max = 6;
        this.actor.update({'system.stockages.sursoi.max' : max});
      } else{        
        max = 0;
        this.actor.update({'system.stockages.sursoi.max' : max});
      };
      if(ev.delegateTarget[61].checked){
        max = 15;
        this.actor.update({'system.stockages.sacados.max' : max});
      } else{
        max = 0;
        this.actor.update({'system.stockages.sacados.max' : max});
      };
      if(ev.delegateTarget[64].checked){
        max = 10;
        this.actor.update({'system.stockages.sacappoint.max' : max});
      } else{
        max = 0;
        this.actor.update({'system.stockages.sacappoint.max' : max});
      };
      if(ev.delegateTarget[67].checked){
        max = 30;
        this.actor.update({'system.stockages.chariot.max' : max});
      } else{
        max = 0;
        this.actor.update({'system.stockages.chariot.max' : max});
      };
  }
}
