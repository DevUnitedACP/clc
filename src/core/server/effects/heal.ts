import * as alt from 'alt-server';
import { Item } from '../../shared/interfaces/item';
import { playerFuncs } from '../extensions/player';
import EFFECT from '../../shared/enums/effects';
import './load-effects';

alt.on(EFFECT.EFFECT_HEAL, handleItemEvent);

function handleItemEvent(player: alt.Player, item: Item, slot: number, tab: number) {
    if (!item || !item.data || !item.data.amount) {
        return;
    }

    playerFuncs.safe.addHealth(player, item.data.amount, false);

    if (item.data.sound) {
        playerFuncs.emit.sound3D(player, item.data.sound, player);
    }
}
