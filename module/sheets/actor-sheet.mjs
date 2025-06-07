/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
export class UjdpActorSheet extends ActorSheet {
  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ['ujdp', 'sheet', 'actor'],
      width: 630,
      height: 780,
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

    // Prepare Child data and items.
    if (actorData.type == 'child') {
      this._prepareItems(context);
      this._prepareChildData(context);
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

  _prepareChildData(context) {
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

    // bouton d'autonomie.
    html.on('click', '.autonomie', this._onRollAuto.bind(this));

    // bouton d'enfantillage.
    html.on('click', '.enfantillage', this._onRollEnf.bind(this));

    //checkbox de stockage.
    html.on('change','.checkstockage',this._onCheck.bind(this));

    // checkbox de tente.
    html.on('change', '.checktente', this._onCheckTente.bind(this));

    //checkbox de doudou.
    html.on('change','.checkdoudou',this._onCheckDoudou.bind(this));

    //checkbox d'objet1.
    html.on('change','.checkobjet1',this._onCheckObj1.bind(this));

    //checkbox d'objet2.
    html.on('change','.checkobjet2',this._onCheckObj2.bind(this));

    //checkbox d'objet3.
    html.on('change','.checkobjet3',this._onCheckObj3.bind(this));

    //checkbox d'objet4.
    html.on('change','.checkobjet4',this._onCheckObj4.bind(this));

    //checkbox d'objet5.
    html.on('change','.checkobjet5',this._onCheckObj5.bind(this));

    //check etat 1
    html.on('change','.checketat1',this._onCheckEtat1.bind(this));

    //check etat 2
    html.on('change','.checketat2',this._onCheckEtat2.bind(this));

    //check etat 3
    html.on('change','.checketat3',this._onCheckEtat3.bind(this));

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
    const bonusaction = element[8].dataset.bonus;

    //recup des caracs
    const phy = element[10].dataset.value;
    const min = element[12].dataset.value;
    const per = element[14].dataset.value;
    const pre = element[16].dataset.value;

    //recup des domaines
    const danger = element[18].dataset.value;
    const route = element[20].dataset.value;
    const foyer = element[22].dataset.value;

    //recup des atouts d'outils
    let atout = [element[36].dataset.bonus, element[39].dataset.bonus, element[42].dataset.bonus, element[45].dataset.bonus,element[48].dataset.bonus, element[51].dataset.bonus];
    // recup des hzndicaps d'état
    let handicap = [element[63].dataset.malus, element[65].dataset.malus, element[67].dataset.malus, element[69].dataset.malus,element[71].dataset.malus];

    // variables pour le jet de dés
    var dcarac = "D10";
    var ddomaine = "D10";
    var bonus = parseInt(0);
    var malus = parseInt(0);
    var faiblesse = this.actor.system.faiblesse.value;
    var newEntropie = parseInt(bonusaction) + parseInt(this.actor.system.entropie.value);
    console.log(newEntropie);
    this.actor.update({'system.entropie.value' : newEntropie});
    
    //attribution de la carac sélectionnée
    if(element[9].checked){
      dcarac = phy;
    };
    if(element[11].checked){
      dcarac = min;
    };
    if(element[13].checked){
      dcarac = per;
    };
    if(element[15].checked){
      dcarac = pre;
    };

    //attribution du domaine sélectionné
    if(element[17].checked){
      ddomaine = danger;
    };
    if(element[19].checked){
      ddomaine = route;
    };
    if(element[21].checked){
      ddomaine = foyer;   
    };

    //attribution du bonus des Outils sélectionnés
    if(element[23].checked){
      bonus += parseInt(atout[0]);
    };
    if(element[25].checked){
      bonus +=  parseInt(atout[1]);
    };
    if(element[27].checked){
      bonus +=  parseInt(atout[2]);
    };
    if(element[29].checked){
      bonus +=  parseInt(atout[3]);
    };
    if(element[31].checked){
      bonus +=  parseInt(atout[4]);
    };
    if(element[33].checked){
      bonus +=  parseInt(atout[5]);
    };

    //attribution du malus des Etats sélectionné
    if(element[53].checked){
      malus +=  parseInt(handicap[0]);
    };
    if(element[55].checked){
      malus +=  parseInt(handicap[1]);
    };
    if(element[57].checked){
      malus +=  parseInt(handicap[2]);
    };
    if(element[59].checked){
      malus +=  parseInt(handicap[3]);
    };
    if(element[61].checked){
      malus +=  parseInt(handicap[4]);
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
  _onRollAuto(event) {
    event.preventDefault();
    console.log (event);
    const element = event.delegateTarget;

    let formule = "d20"; 
    
    let roll = new Roll(formule);
        
    roll.toMessage({
      speaker: ChatMessage.getSpeaker({actor: this.actor}),
      flavor: formule
    });
    console.log(formule);
  }

  
  _onRollEnf(event) {
    event.preventDefault();
    //console.log (event);
    const element = event.delegateTarget;

    //recup du bonus d'action
    let bonusjouet = 0;
        
    //attribution du bonus des Jouets
    if(element[23].checked){
      bonusjouet += 2;
    };
    if(element[27].checked){
      bonusjouet += 2;
    };
    if(element[31].checked){
      bonusjouet += 2;
    };
    if(element[35].checked){
      bonusjouet += 2;
    };
    if(element[39].checked){
      bonusjouet += 2;
    };
   
    // Construct the Roll instance
        
   let formule = "d12 + " + parseInt(bonusjouet) + " - " + parseInt(element[1].dataset.age);
   console.log(formule);
   this._myRollEnf(formule);

   let roll = new Roll(formule);
  }

  _onCheck(ev) {
    ev.preventDefault();
    const element = ev.delegateTarget;
    let max = 6;
    console.log (ev);
    
    //Mise à jour des valeurs max de stockage selon les stockages cochées
      
      if(element[73].checked){       
        max = 6;
        this.actor.update({'system.stockages.sursoi.max' : max});
      } else{        
        max = 0;
        this.actor.update({'system.stockages.sursoi.max' : max});
      };
      if(element[76].checked){
        max = 12;
        this.actor.update({'system.stockages.sacados.max' : max});
      } else{
        max = 0;
        this.actor.update({'system.stockages.sacados.max' : max});
      };
      if(element[79].checked){
        max = 8;
        this.actor.update({'system.stockages.sacappoint.max' : max});
      } else{
        max = 0;
        this.actor.update({'system.stockages.sacappoint.max' : max});
      };
      if(element[82].checked){
        max = 20;
        this.actor.update({'system.stockages.chariot.max' : max});
      } else{
        max = 0;
        this.actor.update({'system.stockages.chariot.max' : max});
      };
  }
  //Check tente
  _onCheckTente(ev){
    ev.preventDefault();
    const element = ev.delegateTarget;
    let enc = 3;    
    if(element[92].checked){       
      enc = 3;
      this.actor.update({'system.vetements.tente.encombrement' : enc});
    } else{        
      enc = 0;
      this.actor.update({'system.vetements.tente.encombrement' : enc});
    };
  }

  //Check doudou
  _onCheckDoudou(ev){
    ev.preventDefault();
    const element = ev.delegateTarget;
    let newDesespoir = parseInt(element[5].dataset.desespoir);      
    if(element[11].checked){       
      newDesespoir -= 3;
      this.actor.update({'system.desespoir.value' : newDesespoir});
    } else{        
      newDesespoir += 3;
      this.actor.update({'system.desespoir.value' : newDesespoir});
    };
  }

  //Check Objet 1
  _onCheckObj1(ev){
    ev.preventDefault();
    const element = ev.delegateTarget;
    let newAutonomie = parseInt(element[2].dataset.autonomie);    
    
    
    if(element[13].checked){       
      newAutonomie += parseInt(element[25].dataset.bonus);
      this.actor.update({'system.autonomie.value' : newAutonomie});
    } else{        
      newAutonomie -= parseInt(element[25].dataset.bonus);
      this.actor.update({'system.autonomie.value' :newAutonomie});
    };
  }
  _onCheckObj2(ev){
    ev.preventDefault();
    const element = ev.delegateTarget;
    let newAutonomie = parseInt(element[2].dataset.autonomie);    
    if(element[15].checked){       
      newAutonomie += parseInt(element[29].dataset.bonus);
      this.actor.update({'system.autonomie.value' : newAutonomie});
    } else{        
      newAutonomie -= parseInt(element[29].dataset.bonus);
      this.actor.update({'system.autonomie.value' :newAutonomie});
    };
  }
  _onCheckObj3(ev){
    ev.preventDefault();
    const element = ev.delegateTarget;
    let newAutonomie = parseInt(element[2].dataset.autonomie);    
    if(element[17].checked){       
      newAutonomie += parseInt(element[33].dataset.bonus);
      this.actor.update({'system.autonomie.value' : newAutonomie});
    } else{        
      newAutonomie -= parseInt(element[33].dataset.bonus);
      this.actor.update({'system.autonomie.value' :newAutonomie});
    };
  }
  _onCheckObj4(ev){
    ev.preventDefault();
    const element = ev.delegateTarget;
    let newAutonomie = parseInt(element[2].dataset.autonomie);    
    if(element[19].checked){       
      newAutonomie += parseInt(element[37].dataset.bonus);
      this.actor.update({'system.autonomie.value' : newAutonomie});
    } else{        
      newAutonomie -= parseInt(element[37].dataset.bonus);
      this.actor.update({'system.autonomie.value' :newAutonomie});
    };
  }
  _onCheckObj5(ev){
    ev.preventDefault();
    const element = ev.delegateTarget;
    let newAutonomie = parseInt(element[2].dataset.autonomie);    
    if(element[21].checked){       
      newAutonomie += parseInt(element[41].dataset.bonus);
      this.actor.update({'system.autonomie.value' : newAutonomie});
    } else{        
      newAutonomie -= parseInt(element[41].dataset.bonus);
      this.actor.update({'system.autonomie.value' :newAutonomie});
    };
  }

  _onCheckEtat1(ev){
    ev.preventDefault();
    const element = ev.delegateTarget;
    let newAutonomie = parseInt(element[2].dataset.autonomie);    
    if(element[43].checked){       
      newAutonomie -= parseInt(element[49].dataset.malus);
      this.actor.update({'system.autonomie.value' : newAutonomie});
    } else{        
      newAutonomie += parseInt(element[49].dataset.malus);
      this.actor.update({'system.autonomie.value' :newAutonomie});
    };
  }

  _onCheckEtat2(ev){
    ev.preventDefault();
    const element = ev.delegateTarget;
    let newAutonomie = parseInt(element[2].dataset.autonomie);    
    if(element[45].checked){       
      newAutonomie -= parseInt(element[51].dataset.malus);
      this.actor.update({'system.autonomie.value' : newAutonomie});
    } else{        
      newAutonomie += parseInt(element[51].dataset.malus);
      this.actor.update({'system.autonomie.value' :newAutonomie});
    };
  }
  _onCheckEtat3(ev){
    ev.preventDefault();
    const element = ev.delegateTarget;
    let newAutonomie = parseInt(element[2].dataset.autonomie);    
    if(element[47].checked){       
      newAutonomie -= parseInt(element[53].dataset.malus);
      this.actor.update({'system.autonomie.value' : newAutonomie});
    } else{        
      newAutonomie += parseInt(element[53].dataset.malus);
      this.actor.update({'system.autonomie.value' :newAutonomie});
    };
  }

  async _myRollEnf(formula) {
    // Construct the Roll instance
    let r = new Roll(formula);
    // Execute the roll
    await r.evaluate();
    this.actor.update({'system.joie.value' : r.total});
    r.toMessage({
      speaker: ChatMessage.getSpeaker({actor: this.actor}),
      flavor: formula
    });
    return r
  }
}
