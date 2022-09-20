import { Component, OnInit } from '@angular/core';
import { ITEMS } from 'src/app/data/item-list';
import { Equipment, EquipmentTypeNames, Item, ItemType, ItemTypeNames } from 'src/app/interfaces/item-information';
import { InventoryService } from 'src/app/services/inventory.service';
import { SoundEffectPlayerService } from 'src/app/services/sound-effect-player.service';
import { TooltipService } from 'src/app/services/tooltip.service';
import * as _ from 'underscore';

@Component({
  selector: 'app-item-list',
  templateUrl: './item-list.component.html',
  styleUrls: ['./item-list.component.less']
})
export class ItemListComponent implements OnInit {
  itemTypes = [ItemType.equipment, ItemType.consumable, ItemType.material]
  typeNames = ItemTypeNames;

  filteredTypes: {[type: string]: boolean} = {
    "EQUIPMENT": false,
    "CONSUMABLE": true,
    "MATERIAL": true
  }
  
  sortBy: string = "cost";
  ascending = true;

  selectSort(sortType: string): void {
    if (this.sortBy == sortType) {
      this.ascending = !this.ascending;
    } else {
      this.sortBy = sortType;
    }
  }

  clickFilter(type: ItemType): void{
    this.filteredTypes[type] = !this.filteredTypes[type];
  }

  getItems(): Array<Item> {
    var baseList = _.sortBy(ITEMS, this.sortBy);
    baseList = _.filter(baseList, (item) => this.itemsOwned(item) != 0);
    baseList = _.filter(baseList, (item) => this.filteredTypes[item.itemType]);
    if (!this.ascending) {
      return baseList.reverse();
    }
    return baseList;
  }

  getTypes(item: Item): string {
    var equipment = item as Equipment;
    if (equipment.equipmentType != undefined) {
      return EquipmentTypeNames[equipment.equipmentType];
    }
    return "";
  }

  itemsOwned(item: Item): number {
    return this.inventoryService.getItemCount(item);
  }

  getWeight(item: Item): string {
    if (item.itemType = ItemType.equipment) {
      var weight = (item as Equipment).weight;
      var baseString = "";
      for (var i = 0; i < weight; i++) {
        baseString += "●";
      }
      return baseString;
    }
    return "";
  }

  mouseoverItem(event: any, item: Item): void {
    this.tooltipService.setItemTooltip(item, event.toElement ? event.toElement.parentElement : event.target.parentElement, 1);
  }

  mouseoutItem(): void {
    this.tooltipService.setItemTooltip(undefined, undefined, 0);
  }

  clickItem(item: Item): void {
    this.inventoryService.sellItem(item);
    this.soundEffectPlayer.playSound(this.soundEffectPlayer.trackPingNoise);
  }

  getItemCost(item: Item): number{
    return this.inventoryService.getItemSellCost(item);
  }

  constructor(private tooltipService: TooltipService,
    private inventoryService: InventoryService,
    private soundEffectPlayer: SoundEffectPlayerService) { }

  ngOnInit(): void {
  }

}
