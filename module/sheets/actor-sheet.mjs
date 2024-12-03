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
    }

    // Assign and return
    context.gear = gear;
    context.features = features;


  }

  /* -------------------------------------------- */
  
  
  

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);
        
    // bouton d'action.
    html.on('click', '.action', this._onRoll.bind(this));

     //checkbox de stockage.
    html.on('change','.checkstockage',this._onCheck.bind(this));

    // checkbox de tente.
    html.on('change', '.checktente', this._onCheckTente.bind(this));


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
    const bonusaction = element[2].dataset.bonus;

    //recup des caracs
    const phy = element[9].dataset.value;
    const min = element[11].dataset.value;
    const per = element[13].dataset.value;
    const pre = element[15].dataset.value;

    //recup des domaines
    const danger = element[17].dataset.value;
    const route = element[19].dataset.value;
    const exploration = element[21].dataset.value;
    const foyer = element[23].dataset.value;

    //recup des atouts d'modifs
    let atout = [element[41].dataset.bonus, element[45].dataset.bonus, element[49].dataset.bonus, element[53].dataset.bonus,element[57].dataset.bonus, element[61].dataset.bonus,element[65].dataset.bonus, element[69].dataset.bonus];
    
    let handicap = [element[42].dataset.malus, element[46].dataset.malus, element[50].dataset.malus, element[54].dataset.malus,element[58].dataset.malus, element[62].dataset.malus, element[66].dataset.malus, element[70].dataset.malus];

    // variables pour le jet de dés
    var dcarac = "D10";
    var ddomaine = "D10";
    var bonus = 0;
    var malus = 0;
    var faiblesse = this.actor.system.faiblesse.value;
    var newEntropie = parseInt(bonusaction) + parseInt(this.actor.system.entropie.value);
    this.actor.update({'system.entropie.value' : newEntropie});
    
    //attribution de la carac sélectionnée
    if(element[8].checked){
      dcarac = phy;
    };
    if(element[11].checked){
      dcarac = min;
    };
    if(element[14].checked){
      dcarac = per;
    };
    if(element[17].checked){
      dcarac = pre;
    };

    //attribution du domaine sélectionné
    if(element[16].checked){
      ddomaine = danger;
    };
    if(element[18].checked){
      ddomaine = route;
    };
    if(element[20].checked){
      ddomaine = exploration;
    };
    if(element[22].checked){
      ddomaine = foyer;   
    };

    //attribution du bonus des Modifs sélectionnés
    if(element[24].checked){
      bonus += atout[0];
    };
    if(element[26].checked){
      bonus += atout[1];
    };
    if(element[28].checked){
      bonus += atout[2];
    };
    if(element[30].checked){
      bonus += atout[3];
    };
    if(element[32].checked){
      bonus += atout[4];
    };
    if(element[34].checked){
      bonus += atout[5];
    };
    if(element[36].checked){
      bonus += atout[6];
    };
    if(element[38].checked){
      bonus += atout[7];
    };

    //attribution du malus des Modifs sélectionné
    if(element[24].checked){
      malus += handicap[0];
    };
    if(element[26].checked){
      malus += handicap[1];
    };
    if(element[28].checked){
      malus += handicap[2];
    };
    if(element[30].checked){
      malus += handicap[3];
    };
    if(element[32].checked){
      malus += handicap[4];
    };
    if(element[34].checked){
      malus += handicap[5];
    };
    if(element[36].checked){
      malus += handicap[6];
    };
    if(element[38].checked){
      malus += handicap[7];
    };

    var formule = "{" + dcarac + "," + ddomaine + "}kh + " + bonusaction + " + " + parseInt(bonus) + " - " + parseInt(malus) + " - " + faiblesse; 
    formule = formule.replace("D", "d");
    formule = formule.replace("D", "d");

    let roll = new Roll(formule);
    roll.toMessage({
      speaker: ChatMessage.getSpeaker({actor: this.actor}),
      flavor: formule
    });
    console.log(formule);

    console.log (event);
   
  }
  _onCheck(ev) {
    ev.preventDefault();
    const element = ev.delegateTarget;
    let max = 6;
    console.log (ev);
    
    //Mise à jour des valeurs max de stockage selon les stockages cochées
      
      if(element[72].checked){       
        max = 6;
        this.actor.update({'system.stockages.sursoi.max' : max});
      } else{        
        max = 0;
        this.actor.update({'system.stockages.sursoi.max' : max});
      };
      if(element[75].checked){
        max = 12;
        this.actor.update({'system.stockages.sacados.max' : max});
      } else{
        max = 0;
        this.actor.update({'system.stockages.sacados.max' : max});
      };
      if(element[78].checked){
        max = 8;
        this.actor.update({'system.stockages.sacappoint.max' : max});
      } else{
        max = 0;
        this.actor.update({'system.stockages.sacappoint.max' : max});
      };
      if(element[81].checked){
        max = 20;
        this.actor.update({'system.stockages.chariot.max' : max});
      } else{
        max = 0;
        this.actor.update({'system.stockages.chariot.max' : max});
      };
  }

  _onCheckTente(ev){
    ev.preventDefault();
    const element = ev.delegateTarget;
    let enc = 3;    
    if(element[91].checked){       
      enc = 3;
      this.actor.update({'system.vetements.tente.encombrement' : enc});
    } else{        
      enc = 0;
      this.actor.update({'system.vetements.tente.encombrement' : enc});
    };
  }
}
