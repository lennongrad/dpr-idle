import { Injectable } from '@angular/core';
import { CharacterInstance } from '../classes/character-instance';
import { EnemyInstance } from '../classes/enemy-instance';
import { UnitInstance } from '../classes/unit-instance';
import { CHARACTERS, GENERIC_FEATURES } from '../data/character-list';
import { ENCOUNTERS } from '../data/enemy-list';
import { CharacterSave } from '../interfaces/unit-information';
import { SaveService } from './save.service';
import { EncounterInformation } from '../interfaces/unit-information';
import * as _ from 'underscore';
import { Subject } from 'rxjs';
import { InventoryService } from './inventory.service';

@Injectable({
  providedIn: 'root'
})
export class UnitInstancesService {
  characterInstances: Array<CharacterInstance> = [
    new CharacterInstance("A", CHARACTERS["eirika"], this, GENERIC_FEATURES),
    new CharacterInstance("B", CHARACTERS["archer"], this, GENERIC_FEATURES),
    new CharacterInstance("C", CHARACTERS["wizard"], this, GENERIC_FEATURES)
  ]

  enemyInstances!: Array<EnemyInstance>;
  selectedEncounter!: EncounterInformation;
  enemyDifficulty: number = 1;

  selectedCharacter!: CharacterInstance;
  selectedTab!: string;

  unitChangeSubject = new Subject<void>();

  selectCharacter(character: CharacterInstance): void {
    this.selectedCharacter = character;
    this.selectTab("character");
    this.saveService.saveData("selected-character", this.selectedCharacter.name);
  }

  selectTab(tab: string): void {
    this.selectedTab = tab;
    this.saveService.saveData("selected-tab", tab);
  }

  forEachUnit(callback: (unit: UnitInstance) => void): void {
    this.characterInstances.forEach(character => callback(character));
    this.enemyInstances.forEach(enemy => callback(enemy));
  }

  resetUnits(): void {
    this.forEachUnit((unit) => unit.reset());
  }

  saveData(character: CharacterInstance, resetTimeline: boolean = false): void {
    var dataStore: any = {};
    dataStore["experience"] = character.permanentData.experience;
    dataStore["learntFeature"] = Array.from(character.permanentData.learntFeatures);
    dataStore["statBonuses"] = character.permanentData.statBonuses;

    var data = JSON.stringify(dataStore)
    this.saveService.saveData("character-" + character.characterInformation.name, data);

    if (resetTimeline) {
      this.unitChangeSubject.next();
    }
  }

  loadData(character: CharacterInstance): CharacterSave | undefined {
    var dataString = this.saveService.getData("character-" + character.characterInformation.name);

    if (dataString != null) {
      try {
        var baseData = JSON.parse(dataString);
        var modifiedData: CharacterSave = {
          experience: baseData.experience,
          learntFeatures: new Set<string>(baseData.learntFeature),
          statBonuses: baseData.statBonuses
        };
        return modifiedData;
      } catch {
        return undefined;
      }
    } else {
      return undefined;
    }
  }

  rewardXP(amount: number): void {
    this.characterInstances.forEach(character => {
      character.addXP(amount);
    })
    this.inventoryService.addGold(amount);
  }

  loadEncounter(name?: string, difficulty?: number): void {
    if (name != undefined && ENCOUNTERS.hasOwnProperty(name)) {
      this.selectedEncounter = ENCOUNTERS[name]
    } else if (this.selectedEncounter == undefined) {
      this.selectedEncounter = ENCOUNTERS["soldiers"];
    }

    if (difficulty != undefined) {
      this.enemyDifficulty = difficulty;
    }

    this.enemyInstances = [
      new EnemyInstance("A", this.selectedEncounter.enemies[0], this, this.enemyDifficulty),
      new EnemyInstance("B", this.selectedEncounter.enemies[1], this, this.enemyDifficulty),
      new EnemyInstance("C", this.selectedEncounter.enemies[2], this, this.enemyDifficulty)
    ]
    this.saveService.saveData("encounter-name", this.selectedEncounter.id);
    this.unitChangeSubject.next();
  }

  constructor(private saveService: SaveService, private inventoryService: InventoryService) {
    try {
      this.loadEncounter(this.saveService.getData("encounter-name") as string);
    } catch {
      this.loadEncounter(undefined);
    }

    try {
      var selectedCharacterName = this.saveService.getData("selected-character") as string;
      var attemptSelected = _.find(this.characterInstances, (character) => character.name == selectedCharacterName);
      if (attemptSelected == undefined) {
        throw new Error();
      }
      this.selectedCharacter = attemptSelected;
    } catch {
      this.selectedCharacter = this.characterInstances[0];
    }

    try {
      var tabName = this.saveService.getData("selected-tab");
      if(tabName == "" || tabName == undefined){
        throw new Error();
      }
      this.selectedTab = tabName;
    } catch {
      this.selectedTab = "character";
    }
  }
}
