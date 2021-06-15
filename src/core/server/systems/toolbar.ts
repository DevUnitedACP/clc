import * as alt from 'alt-server';
import { ItemType } from '../../shared/enums/item-type';
import { SystemEvent } from '../../shared/enums/system';
import { Item } from '../../shared/interfaces/item';
import { LOCALE_KEYS } from '../../shared/locale/languages/keys';
import { LocaleManager } from '../../shared/locale/locale';
import { isFlagEnabled } from '../../shared/utility/flags';
import { playerFuncs } from '../extensions/Player';

export class ToolbarManager {
    static handleToolbarChange(player: alt.Player, slot: number): void {
        if (slot <= -1 || slot >= 4) {
            return;
        }

        const item = playerFuncs.inventory.getToolbarItem(player, slot);
        if (!item) {
            playerFuncs.emit.message(player, LocaleManager.get(LOCALE_KEYS.ITEM_NOT_EQUIPPED));
            return;
        }

        if (!isFlagEnabled(item.behavior, ItemType.IS_TOOLBAR)) {
            return;
        }

        // Handle Weapon Switch
        if (isFlagEnabled(item.behavior, ItemType.IS_WEAPON)) {
            ToolbarManager.handleWeaponEquip(player, item);
            return;
        }

        // Handle Consume Item from Toolbar
        if (isFlagEnabled(item.behavior, ItemType.CONSUMABLE)) {
            ToolbarManager.handleToolbarUse(player, item);
            return;
        }

        // Handle other item switch types
        // No idea what this will be yet.
    }

    static handleWeaponEquip(player: alt.Player, item: Item) {
        player.removeAllWeapons();

        if (!item.data.hash) {
            playerFuncs.emit.message(player, LocaleManager.get(LOCALE_KEYS.WEAPON_NO_HASH));
            return;
        }

        // Handle first equip
        if (!player.lastToolbarData) {
            player.lastToolbarData = { equipped: true, slot: item.slot };
            player.giveWeapon(item.data.hash, 9999, true);
            playerFuncs.emit.sound3D(player, 'item_equip', player);
            alt.emitClient(player, SystemEvent.PLAYER_RELOAD);
            return;
        }

        if (player.lastToolbarData.slot !== item.slot) {
            player.lastToolbarData = { equipped: true, slot: item.slot };
            player.giveWeapon(item.data.hash, 9999, true);
            playerFuncs.emit.sound3D(player, 'item_equip', player);
            alt.emitClient(player, SystemEvent.PLAYER_RELOAD);
            return;
        }

        if (!player.lastToolbarData.equipped) {
            player.giveWeapon(item.data.hash, 9999, true);
            player.lastToolbarData.equipped = true;
            playerFuncs.emit.sound3D(player, 'item_equip', player);
            alt.emitClient(player, SystemEvent.PLAYER_RELOAD);
            return;
        }

        player.lastToolbarData.equipped = false;
        playerFuncs.emit.sound3D(player, 'item_remove', player);
    }

    static handleToolbarUse(player: alt.Player, item: Item) {
        if (!isFlagEnabled(item.behavior, ItemType.SKIP_CONSUMABLE)) {
            item.quantity -= 1;

            if (item.quantity <= 0) {
                playerFuncs.inventory.toolbarRemove(player, item.slot);
            } else {
                playerFuncs.inventory.replaceToolbarItem(player, item);
            }

            playerFuncs.sync.inventory(player);
            playerFuncs.save.field(player, 'toolbar', player.data.toolbar);
        }

        if (item.data && item.data.event) {
            alt.emit(item.data.event, player, item);
            playerFuncs.emit.sound2D(player, 'item_use', Math.random() * 0.45 + 0.1);
        }
    }
}

alt.onClient(SystemEvent.PLAYER_TOOLBAR_SET, ToolbarManager.handleToolbarChange);